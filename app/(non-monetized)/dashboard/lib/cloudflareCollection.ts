import type { WAFTopRule, WAFTopPath, WAFTopASN, WAFHourlyEvent } from "./dashboardUtils";

export type Sampling = "ADAPTIVE" | "NONE" | "UNKNOWN";
export type BlockKey = "traffic24h" | "summary" | "topRules" | "topPaths" | "topASNs" | "timeline" | "pagesMonth";
export type BlockStatus = "OK" | "PARTIAL" | "ERROR" | "UNKNOWN" | "DEMO";
export interface TrafficData { requests: number; threatEvents: number; cachedRequests: number; cacheRate: number | null }
export interface SummaryData { totalEvents: number; actionCounts: Record<string, number> }
export interface PagesData { deploymentCount: number; buildCount: null; limitBuilds: null; usagePercent: null; aggregationTimezone: "UTC"; scopeConfirmed: false }
interface DataByKey { traffic24h: TrafficData; summary: SummaryData; topRules: WAFTopRule[]; topPaths: WAFTopPath[]; topASNs: WAFTopASN[]; timeline: WAFHourlyEvent[]; pagesMonth: PagesData }
export interface CollectionBlock<T> {
  status: BlockStatus; source: "LIVE" | "MOCK" | "UNKNOWN";
  coverage: "FULL" | "TOP_N" | "INCOMPLETE" | "POSSIBLY_TRUNCATED" | "UNKNOWN";
  sampling: Sampling; errorCode: string | null; data: T | null;
  attemptedAt: string | null; collectedAt: string | null; windowStart: string | null; windowEnd: string | null; validUntil: string | null;
  scope: { kind: "ZONE" | "ACCOUNT"; label: string } | null;
  invalid: boolean;
}
export type Collection = { [K in BlockKey]: CollectionBlock<DataByKey[K]> };
export const BLOCK_KEYS: BlockKey[] = ["traffic24h", "summary", "topRules", "topPaths", "topASNs", "timeline", "pagesMonth"];
export const BLOCK_LABELS: Record<BlockKey, string> = { traffic24h: "アクセス統計（24時間）", summary: "WAF処理集計（7日間）", topRules: "上位ルール", topPaths: "上位パス", topASNs: "上位ネットワーク", timeline: "WAF時系列", pagesMonth: "Pages当月デプロイ" };
const FAILURE_CODES = ["TIMEOUT", "ACCESS_DENIED", "UPSTREAM_ERROR", "INVALID_RESPONSE", "MISSING_CONFIG", "UNKNOWN_ERROR"];
const ERROR_CODES = [...FAILURE_CODES, "PARTIAL_RESPONSE", "RESULT_LIMIT"];
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const count = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const str = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0 && x.length <= 1024;
const member = (x: unknown, values: string[]) => typeof x === "string" && values.includes(x);

/** タイムゾーン付きの実在する日時だけを受け入れる。端末の現在時刻は使わない。 */
export function timestamp(x: unknown): number | null {
  if (typeof x !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.exec(x);
  if (!m) return null;
  const [, year, month, day, hour, minute, second] = m;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (+month < 1 || +month > 12 || +day < 1 || +day > days || +hour > 23 || +minute > 59 || +second > 59) return null;
  // PythonのISO出力は最大6桁。ブラウザの解析前にミリ秒へ切り下げる。
  const milliseconds = x.replace(/\.(\d{1,6})(?=Z|[+-]\d{2}:\d{2}$)/, (_, fraction: string) => `.${fraction.slice(0, 3).padEnd(3, "0")}`);
  const ms = Date.parse(milliseconds);
  return Number.isFinite(ms) ? ms : null;
}

function dataValid(key: BlockKey, x: unknown): boolean {
  if (["topRules", "topPaths", "topASNs", "timeline"].includes(key)) {
    if (!Array.isArray(x) || x.length > 10000) return false;
    return x.every(item => {
      if (!record(item) || !count(item.count)) return false;
      if (key === "topASNs") return count(item.asn) && str(item.org) && str(item.country);
      if (!str(item.action)) return false;
      if (key === "topRules") return str(item.rule_id) && str(item.source);
      if (key === "topPaths") return str(item.path);
      return timestamp(item.hour) !== null;
    });
  }
  if (!record(x)) return false;
  if (key === "traffic24h") return count(x.requests) && count(x.threatEvents) && count(x.cachedRequests) && x.cachedRequests <= x.requests &&
    (x.requests === 0 ? x.cacheRate === null : typeof x.cacheRate === "number" && Number.isFinite(x.cacheRate) && x.cacheRate >= 0 && x.cacheRate <= 100 && Math.abs(x.cacheRate - x.cachedRequests / x.requests * 100) <= 0.11);
  if (key === "summary") return count(x.totalEvents) && record(x.actionCounts) && Object.entries(x.actionCounts).every(([a, n]) => str(a) && count(n)) &&
    Object.values(x.actionCounts).reduce<number>((sum, n) => sum + Number(n), 0) === x.totalEvents;
  return count(x.deploymentCount) && x.buildCount === null && x.limitBuilds === null && x.usagePercent === null && x.aggregationTimezone === "UTC" && x.scopeConfirmed === false;
}

function unknownBlock<T>(): CollectionBlock<T> {
  return { status: "UNKNOWN", source: "UNKNOWN", coverage: "UNKNOWN", sampling: "UNKNOWN", data: null, errorCode: null,
    attemptedAt: null, collectedAt: null, windowStart: null, windowEnd: null, validUntil: null, scope: null, invalid: true };
}

function parseBlock<K extends BlockKey>(key: K, x: unknown, runId: string): CollectionBlock<DataByKey[K]> {
  const bad = () => unknownBlock<DataByKey[K]>();
  if (!record(x) || x.runId !== runId || !member(x.source, ["LIVE", "MOCK", "UNKNOWN"]) || !member(x.status, ["OK", "PARTIAL", "ERROR", "UNKNOWN", "DEMO"]) ||
    !member(x.coverage, ["FULL", "TOP_N", "INCOMPLETE", "POSSIBLY_TRUNCATED", "UNKNOWN"]) || !member(x.sampling, ["ADAPTIVE", "NONE", "UNKNOWN"]) ||
    !(x.errorCode === null || member(x.errorCode, ERROR_CODES))) return bad();
  if (!record(x.scope) || x.scope.kind !== (key === "pagesMonth" ? "ACCOUNT" : "ZONE") || !str(x.scope.label)) return bad();
  const fields = ["attemptedAt", "collectedAt", "windowStart", "windowEnd", "validUntil"] as const;
  if (fields.some(f => x[f] !== null && timestamp(x[f]) === null)) return bad();
  const success = x.source === "LIVE" && x.status === "OK" && member(x.coverage, ["FULL", "TOP_N"]) && x.errorCode === null;
  const partial = x.source === "LIVE" && x.status === "PARTIAL" && member(x.coverage, ["INCOMPLETE", "POSSIBLY_TRUNCATED"]) && member(x.errorCode, ["PARTIAL_RESPONSE", "RESULT_LIMIT"]);
  const error = member(x.source, ["LIVE", "UNKNOWN"]) && x.status === "ERROR" && x.coverage === "UNKNOWN" && x.data === null && member(x.errorCode, FAILURE_CODES);
  const unknown = x.source === "UNKNOWN" && x.status === "UNKNOWN" && x.coverage === "UNKNOWN" && x.data === null && x.errorCode === null;
  const demo = x.source === "MOCK" && x.status === "DEMO" && member(x.coverage, ["FULL", "TOP_N"]) && x.errorCode === null && x.validUntil === null;
  if (!(success || partial || error || unknown || demo)) return bad();
  if (x.coverage === "TOP_N" && !["topRules", "topPaths", "topASNs"].includes(key)) return bad();
  if ((success || demo || partial && x.data !== null) && !dataValid(key, x.data)) return bad();
  if ((error || unknown || partial && x.data === null) && (x.data !== null || x.collectedAt !== null || x.validUntil !== null)) return bad();
  if ((success || partial || demo) && x.data !== null) {
    const start = timestamp(x.windowStart), end = timestamp(x.windowEnd), collected = timestamp(x.collectedAt), attempted = timestamp(x.attemptedAt);
    if (start === null || end === null || collected === null || attempted === null || start > end || end > collected || attempted > collected || x.source === "LIVE" && end !== attempted) return bad();
    const until = timestamp(x.validUntil);
    if (until !== null && until < collected) return bad();
    if (!demo) {
      if (key === "traffic24h" && end - start !== 24 * 60 * 60 * 1000) return bad();
      if (key !== "traffic24h" && key !== "pagesMonth" && end - start !== 7 * 24 * 60 * 60 * 1000) return bad();
      if (key === "pagesMonth") {
        const endDate = new Date(end);
        if (start !== Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)) return bad();
      }
      if (until !== null && until > end + 86400 * 1000) return bad();
    }
    if (key === "timeline" && (x.data as WAFHourlyEvent[]).some(item => timestamp(item.hour)! < start || timestamp(item.hour)! > end)) return bad();
  }
  return { status: x.status, source: x.source, coverage: x.coverage, sampling: x.sampling, errorCode: x.errorCode, data: x.data,
    attemptedAt: x.attemptedAt, collectedAt: x.collectedAt, windowStart: x.windowStart, windowEnd: x.windowEnd, validUntil: x.validUntil,
    scope: { kind: x.scope.kind, label: x.scope.label }, invalid: false } as CollectionBlock<DataByKey[K]>;
}

export function parseCollection(payload: unknown): Collection {
  const root = record(payload) ? payload.cloudflareCollection : null;
  const valid = record(root) && root.schemaVersion === 1 && str(root.runId) && root.runId.length <= 128;
  const waf = valid && record(root.waf7d) ? root.waf7d : {};
  return Object.fromEntries(BLOCK_KEYS.map(key => [key, valid ? parseBlock(key, key === "traffic24h" || key === "pagesMonth" ? root[key] : waf[key], root.runId as string) : unknownBlock()])) as Collection;
}

export interface ClockAnchor { servedMs: number; receivedMono: number; rttMs: number; uncertaintyMs: number; resyncMs: number }
export function syncClock(meta: unknown, startMono: number, receiveMono: number, previous: ClockAnchor | null): ClockAnchor | null {
  if (!record(meta)) return null;
  const servedMs = timestamp(meta.servedAt);
  if (servedMs === null || !count(meta.clockMaxUncertaintySeconds) || meta.clockMaxUncertaintySeconds === 0 || !count(meta.clockResyncIntervalSeconds) || meta.clockResyncIntervalSeconds === 0 ||
    !Number.isSafeInteger(meta.clockMaxUncertaintySeconds * 1000) || !Number.isSafeInteger(meta.clockResyncIntervalSeconds * 1000)) return null;
  const rttMs = receiveMono - startMono;
  const uncertaintyMs = meta.clockMaxUncertaintySeconds * 1000;
  if (!Number.isFinite(rttMs) || startMono < 0 || rttMs < 0 || rttMs > uncertaintyMs) return null;
  if (previous) {
    const elapsed = receiveMono - previous.receivedMono;
    if (elapsed < 0 || Math.abs(servedMs - (previous.servedMs + elapsed)) > uncertaintyMs + previous.rttMs + rttMs) return null;
  }
  return { servedMs, receivedMono: receiveMono, rttMs, uncertaintyMs, resyncMs: meta.clockResyncIntervalSeconds * 1000 };
}
export function clockUpperBound(anchor: ClockAnchor | null, mono: number): number | null {
  if (!anchor || !Number.isFinite(mono)) return null;
  const elapsed = mono - anchor.receivedMono;
  if (elapsed < 0 || elapsed >= anchor.resyncMs) return null;
  return anchor.servedMs + elapsed + anchor.rttMs + anchor.uncertaintyMs;
}

export type DisplayState = "取得正常" | "一部未取得" | "取得失敗" | "期限切れ" | "デモ" | "未確認";
export interface BlockAssessment { domain: "COLLECTION"; ruleId: "C01" | "C02" | "C03" | "C04" | "C05"; state: DisplayState; reason: string; action: string; usable: boolean }
export function assessBlock(block: CollectionBlock<unknown>, nowUpper: number | null): BlockAssessment {
  const result = (state: DisplayState, reason: string, action: string, usable = false, ruleId: BlockAssessment["ruleId"] = "C04"): BlockAssessment => ({ domain: "COLLECTION", ruleId, state, reason, action, usable });
  if (block.invalid) return result("未確認", "取得形式・実行識別子・期間の整合性を確認できません。", "収集処理の出力形式を確認する", false, "C01");
  if (block.status === "DEMO") return result("デモ", "収集側が明示したデモ値です。本番の状態を表しません。", "", true);
  if (block.status === "ERROR") {
    const accessDenied = block.errorCode === "ACCESS_DENIED";
    const missingConfig = block.errorCode === "MISSING_CONFIG";
    const reasons: Record<string, string> = { ACCESS_DENIED: "指定された条件でデータを取得できませんでした。原因はこの情報だけでは特定できません", MISSING_CONFIG: "必要な収集設定が不足していました", TIMEOUT: "応答の待ち時間を超えました", UPSTREAM_ERROR: "取得先の応答が失敗しました", INVALID_RESPONSE: "取得先の応答形式を確認できませんでした", UNKNOWN_ERROR: "原因を特定できない取得失敗がありました" };
    return result("取得失敗", `最後の取得試行では、${reasons[block.errorCode!] ?? "取得できませんでした"}。現在も続いているかは未確認です。`,
      accessDenied ? "収集処理の設定・応答と取得元の提供状況を確認する" : missingConfig ? "必要な収集設定を確認する" : "時間をおいて再取得する",
      false, accessDenied || missingConfig ? "C02" : "C03");
  }
  if (block.status === "UNKNOWN") return result("未確認", "取得状態が不明です。", "収集処理の取得状態を確認する");
  if (block.status === "PARTIAL" && block.data === null) return result("一部未取得", "取得は完了せず、表示できる部分データもありません。", "取得範囲と収集処理の応答を確認する");
  if (nowUpper === null || !Number.isFinite(nowUpper)) return result("未確認", "サーバー時刻の同期または許容誤差・再同期間隔の設定を確認できません。", "再読込し、時刻同期の運用設定を確認する", false, "C05");
  const until = timestamp(block.validUntil);
  if (until === null) return result("未確認", "データの更新期限が未設定です。", "収集間隔と更新期限の設定を確認する", false, "C05");
  if (timestamp(block.collectedAt)! > nowUpper) return result("未確認", "取得時刻がサーバー基準時刻より未来です。", "収集処理とサーバーの時刻同期を確認する", false, "C05");
  if (nowUpper >= until) return result("期限切れ", "データの有効期限に達しています。", "再読込し、収集処理の更新状況を確認する", false, "C05");
  if (block.status === "PARTIAL") return result("一部未取得", "今回確認できた部分データだけを参考表示します。", "取得範囲と収集処理の応答を確認する", block.data !== null);
  return result("取得正常", block.coverage === "TOP_N" ? "要求した上位一覧を取得しました。全体件数ではありません。" : "要求した集計範囲の取得を確認しました。安全の判定ではありません。", "", true);
}
export function assessCollection(collection: Collection, nowUpper: number | null) {
  const blocks = Object.fromEntries(BLOCK_KEYS.map(key => [key, assessBlock(collection[key], nowUpper)])) as Record<BlockKey, BlockAssessment>;
  const counts = { unavailable: 0, total: BLOCK_KEYS.length };
  for (const key of BLOCK_KEYS) if (blocks[key].state !== "取得正常" && blocks[key].state !== "デモ") counts.unavailable++;
  const states = BLOCK_KEYS.map(key => blocks[key].state);
  const state: DisplayState = states.every(s => s === "デモ") ? "デモ" : states.every(s => s === "取得正常") ? "取得正常" :
    states.includes("取得正常") || states.includes("一部未取得") ? "一部未取得" : states.includes("取得失敗") ? "取得失敗" : states.includes("期限切れ") ? "期限切れ" : "未確認";
  const actions = [...new Set(BLOCK_KEYS.filter(k => collection[k].status !== "DEMO").sort((a, b) => Number(["ACCESS_DENIED", "MISSING_CONFIG"].includes(collection[b].errorCode!)) - Number(["ACCESS_DENIED", "MISSING_CONFIG"].includes(collection[a].errorCode!))).map(k => blocks[k].action).filter(Boolean))];
  return { state, blocks, counts, actions,
    signals: { domain: "SIGNALS" as const, state: "判定ルール未設定" as const, total: 0, unavailable: 0, configured: 0 },
    pagesQuota: { domain: "COLLECTION" as const, ruleId: "P01", state: "未確認" as const, unavailable: 1, total: 1 },
    wafFacts: { domain: "FACT" as const, ruleId: "W01", usable: blocks.summary.usable },
  };
}
export function samplingNote(sampling: Sampling, zero = false): string {
  if (zero) return sampling === "ADAPTIVE" ? "この集計では観測されず（推計）" : sampling === "UNKNOWN" ? "この集計では観測されず（集計方法未確認）" : "この集計では観測されず";
  return sampling === "ADAPTIVE" ? "サンプリングによる推計値" : sampling === "UNKNOWN" ? "集計方法未確認" : "この集計範囲の件数";
}
export function actionLabel(action: string): string {
  const labels: Record<string, string> = { block: "遮断", managed_challenge: "マネージドチャレンジ", js_challenge: "JSチャレンジ", log: "記録", allow: "許可", skip: "スキップ" };
  return Object.hasOwn(labels, action) ? labels[action] : "その他（処理種別未確認）";
}
