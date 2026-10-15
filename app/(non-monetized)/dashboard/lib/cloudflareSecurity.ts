// Keep this parser independently loadable in Node's type-stripping test runner.
function timestamp(x: unknown): number | null {
  if (typeof x !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.exec(x);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (+month < 1 || +month > 12 || +day < 1 || +day > days || +hour > 23 || +minute > 59 || +second > 59) return null;
  const milliseconds = x.replace(/\.(\d{1,6})(?=Z|[+-]\d{2}:\d{2}$)/, (_, fraction: string) => `.${fraction.slice(0, 3).padEnd(3, "0")}`);
  const time = Date.parse(milliseconds);
  return Number.isFinite(time) ? time : null;
}

export const SECURITY_KEYS = ["securityTrend24h", "securityTrend7d", "securityTrend30d"] as const;
export type SecurityKey = typeof SECURITY_KEYS[number];
export interface SecurityPoint { hour: string; count: number; sampleInterval: number }
export interface SecurityBlock {
  status: "OK" | "ERROR" | "PARTIAL" | "UNKNOWN";
  errorCode: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  attemptedAt: string | null;
  collectedAt: string | null;
  validUntil: string | null;
  sampling: "ADAPTIVE" | "NONE" | "UNKNOWN";
  points: SecurityPoint[] | null;
  invalid: boolean;
  missing: boolean;
}
export type SecurityCollection = Record<SecurityKey, SecurityBlock>;
const hoursByKey: Record<SecurityKey, number> = { securityTrend24h: 24, securityTrend7d: 168, securityTrend30d: 720 };
const errors = ["ACCESS_DENIED", "MISSING_CONFIG", "TIMEOUT", "UPSTREAM_ERROR", "INVALID_RESPONSE", "UNKNOWN_ERROR", "PARTIAL_RESPONSE", "RESULT_LIMIT"];
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const count = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const text = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;
const blank = (missing: boolean, invalid = false): SecurityBlock => ({ status: "UNKNOWN", errorCode: null, windowStart: null, windowEnd: null,
  attemptedAt: null, collectedAt: null, validUntil: null, sampling: "UNKNOWN", points: null, invalid, missing });

function parseBlock(x: unknown, runId: string, hours: number): SecurityBlock {
  const bad = () => blank(false, true);
  if (!record(x) || x.runId !== runId || !record(x.scope) || x.scope.kind !== "ZONE" || !text(x.scope.label)) return bad();
  if (!["OK", "ERROR", "PARTIAL", "UNKNOWN"].includes(String(x.status)) || !["ADAPTIVE", "NONE", "UNKNOWN"].includes(String(x.sampling))) return bad();
  const start = timestamp(x.windowStart), end = timestamp(x.windowEnd), attempted = timestamp(x.attemptedAt);
  if (start === null || end === null || attempted === null || start % 3600000 || end % 3600000 || end - start !== hours * 3600000 || attempted < end || attempted >= end + 3600000) return bad();
  const basic = { status: x.status as SecurityBlock["status"], errorCode: x.errorCode as string | null,
    windowStart: x.windowStart as string, windowEnd: x.windowEnd as string, attemptedAt: x.attemptedAt as string,
    collectedAt: x.collectedAt as string | null, validUntil: x.validUntil as string | null,
    sampling: x.sampling as SecurityBlock["sampling"], points: null, invalid: false, missing: false };
  if (x.status === "UNKNOWN") return x.source === "UNKNOWN" && x.coverage === "UNKNOWN" && x.data === null && x.errorCode === null && x.sampling === "UNKNOWN" && x.precision === "unknown" && x.collectedAt === null && x.validUntil === null ? basic : bad();
  if (x.status === "ERROR" || x.status === "PARTIAL") {
    const partial = x.status === "PARTIAL";
    const code = x.errorCode;
    return x.source === "LIVE" && x.data === null && x.collectedAt === null && x.validUntil === null && x.sampling === "UNKNOWN" && x.precision === "unknown" &&
      errors.includes(String(code)) && (partial ? ["PARTIAL_RESPONSE", "RESULT_LIMIT"].includes(String(code)) && x.coverage === (code === "RESULT_LIMIT" ? "POSSIBLY_TRUNCATED" : "INCOMPLETE") : !["PARTIAL_RESPONSE", "RESULT_LIMIT"].includes(String(code)) && x.coverage === "UNKNOWN") ? basic : bad();
  }
  const collected = timestamp(x.collectedAt), until = timestamp(x.validUntil);
  if (x.source !== "LIVE" || x.coverage !== "FULL" || x.errorCode !== null || !record(x.data) || x.data.granularity !== "HOUR" || !Array.isArray(x.data.points) || x.data.points.length > hours ||
    collected === null || until === null || collected < attempted || until < collected || until > end + 86400000) return bad();
  let previous = -Infinity;
  const points: SecurityPoint[] = [];
  for (const item of x.data.points) {
    if (!record(item) || !text(item.hour) || !count(item.count) || typeof item.sampleInterval !== "number" || !Number.isFinite(item.sampleInterval) || item.sampleInterval < 1 || item.sampleInterval >= 1000000) return bad();
    const hour = timestamp(item.hour);
    if (hour === null || hour % 3600000 || hour < start || hour >= end || hour <= previous) return bad();
    points.push({ hour: item.hour, count: item.count, sampleInterval: item.sampleInterval });
    previous = hour;
  }
  const sampled = points.some(p => p.sampleInterval > 1);
  if (x.sampling !== (sampled ? "ADAPTIVE" : "NONE") || x.precision !== (sampled ? "estimated" : "exact")) return bad();
  return { ...basic, points };
}

export function parseSecurityCollection(payload: unknown): SecurityCollection {
  const root = record(payload) ? payload.cloudflareCollection : null;
  const valid = record(root) && root.schemaVersion === 2 && text(root.runId) && root.runId.length <= 128;
  return Object.fromEntries(SECURITY_KEYS.map(key => [key,
    valid && Object.hasOwn(root, key) ? parseBlock(root[key], root.runId as string, hoursByKey[key]) : blank(true)])) as SecurityCollection;
}

export function assessSecurityBlock(block: SecurityBlock, nowUpper: number | null): { state: string; reason: string; usable: boolean } {
  if (block.missing) return { state: "未収集", reason: "この参考データはまだ収集されていません。", usable: false };
  if (block.invalid) return { state: "利用不可", reason: "取得データの形式または時間範囲を確認できません。", usable: false };
  if (block.status === "UNKNOWN") return { state: "未収集", reason: "この参考データの収集はまだ有効になっていません。", usable: false };
  if (block.status !== "OK") return { state: "利用不可", reason: block.errorCode === "RESULT_LIMIT" ? "取得件数が上限に達しました。" : "今回の参考データを取得できませんでした。", usable: false };
  if (nowUpper === null || !Number.isFinite(nowUpper)) return { state: "未確認", reason: "サーバー時刻を確認できません。", usable: false };
  const collected = timestamp(block.collectedAt), until = timestamp(block.validUntil);
  if (collected === null || until === null || collected > nowUpper) return { state: "未確認", reason: "取得時刻を確認できません。", usable: false };
  if (nowUpper >= until) return { state: "期限切れ", reason: "参考データの更新期限を過ぎています。", usable: false };
  return { state: "取得正常", reason: "返された時間だけを表示します。", usable: true };
}
