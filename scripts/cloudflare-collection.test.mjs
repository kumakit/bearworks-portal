import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCK_KEYS, parseCollection, assessCollection, assessBlock, historyFresh, timestamp, syncClock, clockUpperBound, samplingNote, actionLabel } from "../app/(non-monetized)/dashboard/lib/cloudflareCollection.ts";
import { parseSecurityCollection, assessSecurityBlock } from "../app/(non-monetized)/dashboard/lib/cloudflareSecurity.ts";

const require = createRequire(import.meta.url);
const fixtureBytes = await readFile(new URL("./fixtures/cloudflare-collection-v1.json", import.meta.url));
const fixture = JSON.parse(fixtureBytes);
const fixtureV2Bytes = await readFile(new URL("./fixtures/cloudflare-collection-v2.json", import.meta.url));
const fixtureV2 = JSON.parse(fixtureV2Bytes);
const fixtureV2Phase2Bytes = await readFile(new URL("./fixtures/cloudflare-collection-v2-phase2.json", import.meta.url));
const fixtureV2Phase2 = JSON.parse(fixtureV2Phase2Bytes);
const manifest = JSON.parse(await readFile(new URL("./fixtures/cloudflare-collection-manifest.json", import.meta.url)));
const NOW = Date.parse("2026-10-06T00:00:00Z");
const UNTIL = Date.parse("2026-10-06T03:00:00Z");
const clone = () => structuredClone(fixture);
const parsed = root => parseCollection({ cloudflareCollection: root });
const block = (root, key) => ["traffic24h", "pagesMonth"].includes(key) ? root[key] : root.waf7d[key];
const meta = { servedAt: "2026-10-06T00:00:00Z", clockMaxUncertaintySeconds: 5, clockResyncIntervalSeconds: 30 };
const hourlyMeta = { ...meta, clockResyncIntervalSeconds: 3600 };

async function compile(path) {
  const result = await build({ entryPoints: [path], bundle: true, platform: "node", format: "cjs", packages: "external", write: false, logLevel: "silent" });
  return result.outputFiles[0].text;
}
function load(code, resolver = require) {
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(resolver, loaded, loaded.exports);
  return loaded.exports;
}
const route = load(await compile("app/api/dashboard-data/route.ts"));
const view = load(await compile("app/(non-monetized)/dashboard/components/CloudflareCollectionView.tsx")).CloudflareCollectionView;
const accessView = load(await compile("app/(non-monetized)/dashboard/components/CloudflareAccessView.tsx")).CloudflareAccessView;
const pageCode = await compile("app/(non-monetized)/dashboard/cloudflare/page.tsx");
const html = (root, now = NOW, extra = {}) => renderToStaticMarkup(React.createElement(view, { collection: parsed(root), nowUpper: now, ...extra }));
const accessHtml = (root, period, now = NOW) => renderToStaticMarkup(React.createElement(accessView, { collection: parsed(root), nowUpper: now, defaultPeriod: period }));
const withPhase2Periods = () => structuredClone(fixtureV2Phase2);
const withHistory = () => {
  const root = withPhase2Periods();
  const end = NOW - 3600000;
  const window = endAt => {
    const start = endAt - 720 * 3600000;
    return { state: "READY", windowStart: new Date(start).toISOString(), windowEnd: new Date(endAt).toISOString(),
      totalRequests: 720, points: Array.from({ length: 720 }, (_, index) => ({ hour: new Date(start + index * 3600000).toISOString(), requests: 1 })) };
  };
  root.history30d = { schemaVersion: 1, runId: root.runId, dataset: "httpRequests1hGroups", aggregation: "UTC_HOUR_SUM_REQUESTS",
    scope: { kind: "ZONE", label: "設定されたCloudflareゾーン全体" }, generatedAt: new Date(NOW).toISOString(),
    referenceEnd: new Date(end).toISOString(), current: window(end), previous: window(end - 720 * 3600000),
    comparison: { state: "READY", difference: 0, percent: 0 } };
  return root;
};
const withSecurity = () => {
  const root = withPhase2Periods();
  for (const [key, hours] of [["securityTrend24h", 24], ["securityTrend7d", 168], ["securityTrend30d", 720]]) {
    root[key] = { runId: root.runId, source: "LIVE", status: "OK", coverage: "FULL", sampling: "ADAPTIVE", precision: "estimated",
      errorCode: null, attemptedAt: "2026-10-06T00:00:00Z", collectedAt: "2026-10-06T00:00:00Z", validUntil: "2026-10-06T03:00:00Z",
      windowStart: new Date(NOW - hours * 3600000).toISOString(), windowEnd: "2026-10-06T00:00:00Z", scope: { kind: "ZONE", label: "bearworks.uk" },
      data: { granularity: "HOUR", points: [{ hour: new Date(NOW - hours * 3600000).toISOString(), count: 0, sampleInterval: 1 },
        { hour: "2026-10-05T23:00:00Z", count: 7, sampleInterval: 2 }] } };
  }
  return root;
};

test("sparse Firewall reference keeps API counts and cannot change access health", () => {
  const root = withSecurity();
  const original = assessCollection(parsed(root), NOW);
  const security = parseSecurityCollection({ cloudflareCollection: root });
  assert.deepEqual(security.securityTrend24h.points.map(p => p.count), [0, 7]);
  assert.equal(assessSecurityBlock(security.securityTrend24h, NOW).usable, true);
  const output = html(root, NOW, { security });
  assert.match(output, /Firewall イベントの時間別集計（参考）/);
  assert.match(output, /イベントの集計値/);
  assert.match(output, /7件の攻撃・遮断や7人の訪問を意味せず/);
  assert.match(output, /値を取得できた時間 2 \/ 24/);
  assert.match(output, /推計を含みます/);
  assert.match(output, /返らなかった時間は未確認/);
  assert.equal(assessCollection(parsed(root), NOW).counts.unavailable, original.counts.unavailable);
  root.securityTrend24h.data.points[1].count = -1;
  assert.equal(assessSecurityBlock(parseSecurityCollection({ cloudflareCollection: root }).securityTrend24h, NOW).state, "利用不可");
  assert.equal(assessCollection(parsed(root), NOW).counts.unavailable, original.counts.unavailable);
});

test("missing, expired and malformed Firewall periods stay local", () => {
  const root = withSecurity();
  delete root.securityTrend7d;
  assert.equal(assessSecurityBlock(parseSecurityCollection({ cloudflareCollection: root }).securityTrend7d, NOW).state, "未収集");
  assert.equal(assessSecurityBlock(parseSecurityCollection({ cloudflareCollection: root }).securityTrend24h, UNTIL).state, "期限切れ");
  for (const variant of ["duplicate", "outOfRange", "badInterval", "badCount"]) {
    const candidate = structuredClone(root);
    const points = candidate.securityTrend24h.data.points;
    if (variant === "duplicate") points[1].hour = points[0].hour;
    if (variant === "outOfRange") points[1].hour = candidate.securityTrend24h.windowEnd;
    if (variant === "badInterval") points[1].sampleInterval = 0;
    if (variant === "badCount") points[1].count = 1.5;
    const parsedSecurity = parseSecurityCollection({ cloudflareCollection: candidate });
    assert.equal(parsedSecurity.securityTrend24h.invalid, true, variant);
    assert.equal(assessSecurityBlock(parsedSecurity.securityTrend30d, NOW).usable, true);
  }
});

test("shared fixture hash and independently specified expectations", () => {
  assert.equal(createHash("sha256").update(fixtureBytes).digest("hex"), manifest.files["cloudflare-collection-v1.json"]);
  assert.equal(createHash("sha256").update(fixtureV2Bytes).digest("hex"), manifest.files["cloudflare-collection-v2.json"]);
  assert.equal(createHash("sha256").update(fixtureV2Phase2Bytes).digest("hex"), manifest.files["cloudflare-collection-v2-phase2.json"]);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.evaluationTime, "2026-10-06T00:00:00Z");
  const result = assessCollection(parsed(fixture), NOW);
  assert.equal(result.state, "取得正常");
  assert.equal(result.counts.unavailable, 0);
  assert.equal(parsed(fixture).traffic24h.data.threatEvents, 4);
  assert.equal(parsed(fixture).pagesMonth.data.usagePercent, null);
  assert.equal(result.signals.state, "判定ルール未設定");
  assert.equal(result.signals.configured, 0);
  assert.equal(result.signals.domain, "SIGNALS");
  assert.equal(result.blocks.summary.domain, "COLLECTION");
  assert.equal(result.wafFacts.domain, "FACT");
  assert.equal(result.pagesQuota.ruleId, "P01");
  assert.doesNotMatch(html(fixture), /利用枠は未確認/);
});

test("legacy, unknown version, root runId and malformed input never reuse old numeric values", () => {
  for (const input of [null, [], { summary: { cloudflareTotalThreats24h: 99999 }, wafDetails: { total_events: 88888 } }, { cloudflareCollection: { ...fixture, schemaVersion: 3 } }, { cloudflareCollection: { ...fixture, runId: " " } }]) {
    const result = parseCollection(input);
    for (const key of BLOCK_KEYS) assert.equal(result[key].data, null);
    assert.equal(assessCollection(result, NOW).state, "未確認");
  }
});

test("v1 remains usable while new access blocks stay undistributed", () => {
  const result = parsed(fixture);
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.traffic24h.data.requests, 100);
  assert.equal(result.trafficSeries.data, null);
  assert.equal(result.countryTraffic.data, null);
  assert.doesNotMatch(html(fixture), /国別アクセス（直近24時間）/);
});

test("v2 validates the same full hourly denominator for trend and country list", () => {
  const result = parsed(fixtureV2);
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.trafficSeries.data.points.length, 24);
  assert.equal(result.trafficSeries.data.totalRequests, result.countryTraffic.data.totalRequests);
  assert.equal(result.trafficSeries.data.cacheRate, 40);
  assert.equal(result.countryTraffic.data.countries.reduce((sum, row) => sum + row.requests, 0), 100);
  const output = html(fixtureV2);
  assert.match(output, /アクセス推移（直近24時間）/);
  assert.match(output, /国別アクセス（直近24時間）/);
  assert.match(output, /キャッシュ率：40%/);
  assert.match(output, /比較データを準備中/);
  assert.match(output, /訪問人数ではありません/);
  assert.match(output, /日本/);
});

test("period selector renders 24h, adaptive 7d and adaptive 30d data with period-specific comparison", () => {
  const root = withPhase2Periods();
  const parsedRoot = parsed(root);
  assert.equal(parsedRoot.trafficSeries7d.data.points.length, 168);
  assert.equal(parsedRoot.trafficSeries30d.data.points.length, 720);
  assert.equal(parsedRoot.trafficSeries7d.precision, "estimated");
  assert.equal(parsedRoot.trafficPrevious24h.status, "OK");
  assert.equal(assessBlock(parsedRoot.trafficPrevious24h, NOW).usable, true);
  assert.equal(parsedRoot.trafficPrevious7d.data.totalRequests, 84);
  const sevenDay = accessHtml(root, "7d");
  assert.match(sevenDay, /aria-pressed="true"[^>]*>7日間/);
  assert.match(sevenDay, /アクセス推移（7日間）/);
  assert.match(sevenDay, /サンプルからの推計値です/);
  assert.match(sevenDay, /前期間との差 \+84 件（\+100\.0%）/);
  assert.match(sevenDay, /国別アクセス（7日間）/);
  assert.match(sevenDay, /23\.8%/);
  const thirtyDay = accessHtml(root, "30d");
  assert.match(thirtyDay, /aria-pressed="true"[^>]*>30日間/);
  assert.match(thirtyDay, /この期間は前期間比較に対応していません/);
  assert.match(thirtyDay, /履歴が揃うまでは比較できません/);
  assert.match(thirtyDay, /国別アクセス（30日間）/);
  const oneDay = accessHtml(root, "24h");
  assert.match(oneDay, /キャッシュ率：40%/);
  assert.match(oneDay, /前期間との差 \+20 件（\+25\.0%）/);
});

test("hourly history is optional and a malformed block cannot alter existing access results", () => {
  const root = withHistory();
  assert.equal(parsed(root).history30d.state, "OK");
  assert.equal(historyFresh(parsed(root).history30d, NOW), true);
  assert.equal(historyFresh(parsed(root).history30d, NOW + 2 * 3600000), false);
  assert.match(accessHtml(root, "30d"), /この期間は前期間比較に対応していません/);
  const malformed = structuredClone(root);
  malformed.history30d.current.points[1].hour = malformed.history30d.current.points[0].hour;
  assert.equal(parsed(malformed).history30d.state, "INVALID");
  assert.equal(parsed(malformed).trafficSeries30d.status, "OK");
  assert.equal(assessCollection(parsed(malformed), NOW).state, assessCollection(parsed(root), NOW).state);
  const wrongRun = structuredClone(root);
  wrongRun.history30d.runId = "another-run";
  assert.equal(parsed(wrongRun).history30d.state, "INVALID");
});

test("30-day hourly display and same-source comparison require separate flags and fresh complete windows", () => {
  const root = withHistory();
  const oldDisplay = process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_30D_ENABLED;
  const oldCompare = process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED;
  try {
    process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_30D_ENABLED = "true";
    process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED = "false";
    const displayOnly = accessHtml(root, "30d");
    assert.match(displayOnly, /保存した時間別集計（抽出なし）/);
    assert.match(displayOnly, /前期間比較を準備中/);
    assert.match(displayOnly, /合計が一致しない場合があります/);
    process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED = "true";
    assert.match(accessHtml(root, "30d"), /前の30日間との差 \+0 件（\+0\.0%）/);
    const incomplete = structuredClone(root);
    incomplete.history30d.previous = { ...incomplete.history30d.previous, state: "ACCUMULATING", totalRequests: null, points: null };
    incomplete.history30d.comparison = { state: "UNAVAILABLE", reason: "PREVIOUS_ACCUMULATING" };
    assert.match(accessHtml(incomplete, "30d"), /前の30日間の履歴を蓄積中/);
    incomplete.history30d.previous.state = "MISSING";
    incomplete.history30d.comparison.reason = "PREVIOUS_MISSING";
    assert.match(accessHtml(incomplete, "30d"), /欠測があるため比較できません/);
    const sampled = structuredClone(root);
    sampled.history30d.current = { ...sampled.history30d.current, state: "SAMPLED", totalRequests: null, points: null };
    sampled.history30d.comparison = { state: "UNAVAILABLE", reason: "CURRENT_SAMPLED" };
    assert.match(accessHtml(sampled, "30d"), /この期間は前期間比較に対応していません/);
    assert.match(accessHtml(sampled, "30d"), /従来の30日集計を表示しています/);
    assert.doesNotMatch(accessHtml(sampled, "30d"), /保存した時間別集計（抽出なし）/);
    assert.doesNotMatch(accessHtml(root, "30d", NOW + 2 * 3600000), /保存した時間別集計（抽出なし）/);
  } finally {
    if (oldDisplay === undefined) delete process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_30D_ENABLED;
    else process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_30D_ENABLED = oldDisplay;
    if (oldCompare === undefined) delete process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED;
    else process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED = oldCompare;
  }
});

test("unsampled adaptive periods remain exact and the comparison describes them accurately", () => {
  const root = withPhase2Periods();
  for (const key of ["trafficSeries7d", "countryTraffic7d", "trafficPrevious7d", "trafficSeries30d", "countryTraffic30d"]) {
    root[key].sampling = "NONE";
    root[key].precision = "exact";
  }
  const result = parsed(root);
  assert.equal(result.trafficSeries7d.status, "OK");
  assert.equal(result.countryTraffic7d.status, "OK");
  assert.equal(result.trafficPrevious7d.status, "OK");
  const output = accessHtml(root, "7d");
  assert.match(output, /前期間との差 \+84 件/);
  assert.match(output, /同じ集計条件で比較しています/);
  assert.doesNotMatch(output, /推計値同士の参考比較/);
});

test("phase 2 blocks reject incomplete buckets, inconsistent denominators and non-estimated data independently", () => {
  const changes = [
    root => { root.trafficSeries7d.data.points.pop(); },
    root => { root.trafficSeries30d.data.points[12].hour = root.trafficSeries30d.data.points[11].hour; },
    root => { root.countryTraffic7d.data.totalRequests += 1; },
    root => { root.countryTraffic30d.data.countries[0].code = root.countryTraffic30d.data.countries[1].code; },
    root => { root.trafficPrevious7d.windowEnd = "2026-09-28T00:00:00Z"; },
    root => { root.trafficSeries7d.sampling = "UNKNOWN"; },
  ];
  for (const change of changes) {
    const root = withPhase2Periods(); change(root);
    const result = parsed(root);
    if (root.trafficSeries7d.sampling === "UNKNOWN") assert.equal(result.trafficSeries7d.data, null);
    if (root.countryTraffic7d.data.totalRequests !== 168) assert.equal(result.countryTraffic7d.data, null);
    if (root.countryTraffic30d.data.countries[0].code === root.countryTraffic30d.data.countries[1].code) assert.equal(result.countryTraffic30d.data, null);
    if (root.trafficPrevious7d.windowEnd !== root.trafficSeries7d.windowStart) assert.equal(result.trafficPrevious7d.data, null);
  }
});

test("a missing period block stays isolated and absent optional blocks do not affect legacy health", () => {
  const root = withPhase2Periods();
  delete root.countryTraffic7d;
  const parsedRoot = parsed(root);
  assert.equal(parsedRoot.trafficSeries7d.status, "OK");
  assert.equal(parsedRoot.countryTraffic7d.status, "UNKNOWN");
  const output = accessHtml(root, "7d");
  assert.match(output, /アクセス推移（7日間）/);
  assert.match(output, /未配信：この期間のデータはありません/);
  assert.doesNotMatch(output, /国・地域の件数順一覧/);
  const result = assessCollection(parsed(root), NOW);
  assert.equal(result.blocks.trafficSeries7d.state, "取得正常");
  assert.equal(result.blocks.countryTraffic7d.state, "未確認");
});

test("v2 access failures affect collection health while explicitly disabled blocks do not", () => {
  const failed = structuredClone(fixtureV2);
  Object.assign(failed.countryTraffic, { status: "ERROR", coverage: "UNKNOWN", errorCode: "UPSTREAM_ERROR",
    data: null, collectedAt: null, validUntil: null });
  const assessment = assessCollection(parsed(failed), NOW);
  assert.equal(assessment.state, "一部未取得");
  assert.equal(assessment.counts.total, 4);
  assert.equal(assessment.counts.unavailable, 1);
  assert.equal(assessment.blocks.countryTraffic.state, "取得失敗");
  assert.match(html(failed), /データについて（要確認の項目があります）/);
  assert.match(html(failed), /国別アクセス（完了した24時間）：取得失敗/);

  const disabled = structuredClone(fixtureV2);
  Object.assign(disabled.countryTraffic, { source: "UNKNOWN", status: "UNKNOWN", coverage: "UNKNOWN",
    errorCode: null, data: null, collectedAt: null, validUntil: null });
  const disabledAssessment = assessCollection(parsed(disabled), NOW);
  assert.equal(disabledAssessment.state, "取得正常");
  assert.equal(disabledAssessment.counts.total, 3);
  assert.equal(disabledAssessment.counts.unavailable, 0);
  assert.doesNotMatch(html(disabled), /国別アクセス（完了した24時間）：未確認/);

  const retiredWaf = structuredClone(fixtureV2);
  Object.assign(retiredWaf.waf7d.summary, { status: "ERROR", coverage: "UNKNOWN", errorCode: "ACCESS_DENIED",
    data: null, collectedAt: null, validUntil: null });
  const wafAssessment = assessCollection(parsed(retiredWaf), NOW);
  assert.equal(wafAssessment.state, "取得正常");
  assert.equal(wafAssessment.counts.unavailable, 0);
  assert.equal(wafAssessment.blocks.summary.state, "取得失敗");
});

test("unknown country code remains visible as an unknown region", () => {
  const root = structuredClone(fixtureV2);
  root.countryTraffic.data.countries[1].code = "XX";
  const output = html(root);
  assert.match(output, /不明な地域/);
  assert.match(output, /40 件/);
});

test("pinned Natural Earth map has explicit join exceptions and no duplicate usable codes", async () => {
  const map = JSON.parse(await readFile(new URL("../public/maps/ne_110m_admin_0_countries_v5.1.1.geojson", import.meta.url)));
  const codes = map.features.map(feature => feature.properties.ISO_A2_EH).filter(code => /^[A-Z]{2}$/.test(code));
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(map.features.length > 100);
  assert.equal(map.features.find(feature => feature.properties.NAME === "France").properties.ISO_A2, "-99");
  assert.equal(map.features.find(feature => feature.properties.NAME === "France").properties.ISO_A2_EH, "FR");
  assert.equal(map.features.find(feature => feature.properties.NAME === "Taiwan").properties.ISO_A2_EH, "TW");
  assert.equal(codes.includes("HK"), false);
  assert.equal(codes.includes("SG"), false);
});

test("v2 missing, mismatched or incomplete access data does not fabricate the affected block", () => {
  for (const change of [
    root => { delete root.countryTraffic; },
    root => { root.countryTraffic.data.totalRequests = 101; },
    root => { root.trafficSeries.data.points.pop(); },
    root => { root.trafficSeries.data.cacheRate = 90; },
    root => { root.countryTraffic.windowEnd = "2026-10-05T23:00:00Z"; },
  ]) {
    const root = structuredClone(fixtureV2); change(root);
    const parsedRoot = parsed(root);
    assert.equal(parsedRoot.countryTraffic.data === null || parsedRoot.trafficSeries.data === null, true);
    if (parsedRoot.countryTraffic.data === null) assert.doesNotMatch(html(root), /国・地域の件数順一覧/);
    if (parsedRoot.trafficSeries.data === null) assert.doesNotMatch(html(root), /時間別の件数を表で見る/);
  }
});

test("unknown enum, run mismatch and illegal combinations are block-local UNKNOWN", () => {
  const cases = [{ runId: "previous-run" }, { source: "NEW_SOURCE" }, { status: "NEW_STATUS" }, { coverage: "NEW_COVERAGE" }, { sampling: "NEW_SAMPLING" }, { errorCode: "untrusted error text" }, { source: "MOCK" }, { status: "PARTIAL", coverage: "FULL", errorCode: "PARTIAL_RESPONSE" }, { coverage: "TOP_N" }, { scope: { kind: "ACCOUNT", label: "incorrect scope" } }];
  for (const mutation of cases) {
    const root = clone(); Object.assign(root.traffic24h, mutation);
    const result = parsed(root);
    assert.equal(result.traffic24h.status, "UNKNOWN", JSON.stringify(mutation));
    assert.equal(result.traffic24h.data, null);
    assert.equal(result.summary.status, "OK");
    assert.doesNotMatch(html(root), /untrusted error text/);
  }
});

test("LIVE error and UNKNOWN combinations validate; failures cannot carry old values", () => {
  for (const source of ["LIVE", "UNKNOWN"]) for (const errorCode of ["TIMEOUT", "ACCESS_DENIED", "UPSTREAM_ERROR", "INVALID_RESPONSE", "MISSING_CONFIG", "UNKNOWN_ERROR"]) {
    const root = clone(); Object.assign(root.traffic24h, { source, status: "ERROR", coverage: "UNKNOWN", errorCode, data: null, collectedAt: null, validUntil: null });
    const result = parsed(root);
    assert.equal(result.traffic24h.invalid, false);
    assert.equal(assessBlock(result.traffic24h, null).state, "取得失敗");
    assert.equal(assessBlock(result.traffic24h, null).usable, false);
    root.traffic24h.data = fixture.traffic24h.data;
    assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); Object.assign(root.traffic24h, { source: "UNKNOWN", status: "UNKNOWN", coverage: "UNKNOWN", errorCode: null, data: null, collectedAt: null, validUntil: null });
  assert.equal(parsed(root).traffic24h.invalid, false);
});

test("retired detail failure stays in the contract but outside the access screen", () => {
  const root = clone(); Object.assign(root.waf7d.topPaths, { status: "ERROR", coverage: "UNKNOWN", errorCode: "ACCESS_DENIED", data: null, collectedAt: null, validUntil: null });
  const result = assessCollection(parsed(root), NOW);
  assert.equal(result.blocks.summary.usable, true);
  assert.equal(result.blocks.topPaths.usable, false);
  assert.equal(result.state, "一部未取得");
  assert.equal(result.counts.unavailable, 1);
  assert.match(result.actions[0], /設定・応答と取得元の提供状況/);
  const output = html(root);
  assert.match(output, /アクセス推移と国別アクセスのデータはまだ確認できません/);
  assert.doesNotMatch(output, /総イベント|\/wp-login.php|上位パス|取得元の提供状況/);
});

test("unavailable WAF groups keep five failures and describe the unknown cause neutrally", () => {
  const root = clone();
  const wafKeys = ["summary", "topRules", "topPaths", "topASNs", "timeline"];
  for (const key of wafKeys) Object.assign(root.waf7d[key], {
    status: "ERROR", coverage: "UNKNOWN", errorCode: "ACCESS_DENIED",
    data: null, collectedAt: null, validUntil: null,
  });
  const collection = parsed(root);
  const result = assessCollection(collection, NOW);
  assert.equal(result.state, "一部未取得");
  assert.equal(result.counts.unavailable, 5);
  for (const key of wafKeys) {
    assert.equal(collection[key].data, null);
    assert.equal(result.blocks[key].state, "取得失敗");
    assert.equal(result.blocks[key].usable, false);
    assert.match(result.blocks[key].reason, /原因はこの情報だけでは特定できません/);
    assert.match(result.blocks[key].action, /取得元の提供状況/);
  }
  const output = html(root);
  assert.doesNotMatch(output, /権限がありません|プラン対象外|アクセス条件を満たせませんでした|総イベント 15 件/);
  assert.doesNotMatch(output, /データ収集について必要な操作|Security Events|WAFの処理結果/);
});

test("PARTIAL with verified data is reference-only, null remains unavailable", () => {
  for (const coverage of ["INCOMPLETE", "POSSIBLY_TRUNCATED"]) for (const errorCode of ["PARTIAL_RESPONSE", "RESULT_LIMIT"]) {
    const root = clone(); Object.assign(root.waf7d.topPaths, { status: "PARTIAL", coverage, errorCode });
    let item = parsed(root).topPaths;
    assert.equal(item.invalid, false);
    assert.equal(assessBlock(item, NOW).state, "一部未取得");
    assert.equal(assessBlock(item, NOW).usable, true);
    Object.assign(root.waf7d.topPaths, { data: null, collectedAt: null, validUntil: null }); item = parsed(root).topPaths;
    assert.equal(item.invalid, false);
    assert.equal(assessBlock(item, null).state, "一部未取得");
    assert.equal(assessBlock(item, NOW).usable, false);
  }
});

test("MOCK plus DEMO is explicitly demo, never produces production actions or signal health", () => {
  const root = clone(); for (const key of BLOCK_KEYS) Object.assign(block(root, key), { source: "MOCK", status: "DEMO", validUntil: null });
  const result = assessCollection(parsed(root), null);
  assert.equal(result.state, "デモ");
  assert.deepEqual(result.actions, []);
  assert.equal(result.signals.state, "判定ルール未設定");
  const output = html(root, null);
  assert.match(output, /アクセス推移と国別アクセスのデータはまだ確認できません/);
  assert.doesNotMatch(output, /必要な操作：Cloudflare/);
});

test("zero events, empty arrays, sampling and zero-denominator cache rate stay distinct from null", () => {
  const root = clone(); root.traffic24h.data = { requests: 0, threatEvents: 0, cachedRequests: 0, cacheRate: null }; root.waf7d.summary.data = { actionCounts: {}, totalEvents: 0 };
  assert.equal(assessCollection(parsed(root), NOW).state, "取得正常");
  const output = html(root);
  assert.doesNotMatch(output, /算出不能|総イベント|キャッシュ率/);
  assert.doesNotMatch(output, /攻撃0件|攻撃ゼロ|平常|正常稼働中/);
  assert.equal(samplingNote("NONE", true), "この集計では観測されず");
  root.waf7d.topRules.data = null;
  assert.equal(parsed(root).topRules.status, "UNKNOWN");
});

test("invalid numbers and missing fields are not coerced into zero", () => {
  for (const mutation of [{ requests: -1 }, { requests: NaN }, { requests: Infinity }, { requests: "100" }, { cachedRequests: 101 }, { cacheRate: 101 }, { cacheRate: 60.12 }, { cacheRate: null }, { requests: 0, cachedRequests: 0, cacheRate: 0 }, { threatEvents: undefined }]) {
    const root = clone(); Object.assign(root.traffic24h.data, mutation);
    assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); root.waf7d.summary.data.actionCounts.block = -1;
  assert.equal(parsed(root).summary.status, "UNKNOWN");
  root.pagesMonth.data.usagePercent = 0;
  assert.equal(parsed(root).pagesMonth.status, "UNKNOWN");
  const rounded = clone(); rounded.traffic24h.data.cacheRate = 60.1;
  assert.equal(parsed(rounded).traffic24h.status, "OK");
  for (const field of ["org", "country"]) {
    const invalidASN = clone(); invalidASN.waf7d.topASNs.data = [{ asn: 64500, org: "Synthetic", country: "ZZ", count: 1, [field]: "" }];
    assert.equal(parsed(invalidASN).topASNs.status, "UNKNOWN");
  }
});

test("timestamps, ordering, missing deadlines and exact expiry boundaries", () => {
  const item = parsed(fixture).traffic24h;
  assert.equal(assessBlock(item, UNTIL - 1).state, "取得正常");
  assert.equal(assessBlock(item, UNTIL).state, "期限切れ");
  assert.equal(assessBlock(item, UNTIL + 1).usable, false);
  assert.equal(assessBlock(item, null).state, "未確認");
  for (const mutation of [{ windowStart: "2026-10-07T00:00:00Z" }, { windowEnd: "2026-10-07T00:00:00Z" }, { validUntil: "2026-10-05T23:59:59Z" }, { collectedAt: "2026-02-30T00:00:00Z" }, { collectedAt: "2026-10-06 00:00:00" }, { attemptedAt: "2026-10-06T00:01:00Z" }]) {
    const root = clone(); Object.assign(root.traffic24h, mutation); assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); root.traffic24h.validUntil = null;
  assert.equal(assessBlock(parsed(root).traffic24h, NOW).state, "未確認");
  assert.equal(timestamp("2026-10-06T09:00:00+09:00"), NOW);
  assert.equal(timestamp("2026-10-06T00:00:00.123456+00:00"), NOW + 123);
  assert.equal(timestamp("2026-10-06T00:00:00.1Z"), NOW + 100);
  const microseconds = clone();
  for (const key of BLOCK_KEYS) for (const field of ["attemptedAt", "collectedAt", "windowStart", "windowEnd", "validUntil"]) {
    if (key === "pagesMonth" && field === "windowStart") continue;
    block(microseconds, key)[field] = block(microseconds, key)[field].replace("Z", ".123456+00:00");
  }
  assert.equal(assessCollection(parsed(microseconds), NOW + 124).state, "取得正常");
});

test("fixed traffic/WAF periods, UTC Pages month and maximum freshness are contract conditions", () => {
  for (const [key, field, value] of [
    ["traffic24h", "windowStart", "2026-10-05T01:00:00Z"],
    ["traffic24h", "attemptedAt", "2026-10-05T23:59:59Z"],
    ["summary", "windowStart", "2026-09-30T00:00:00Z"],
    ["topPaths", "windowStart", "2026-09-28T00:00:00Z"],
    ["pagesMonth", "windowStart", "2026-10-02T00:00:00Z"],
    ["pagesMonth", "windowStart", "2026-10-01T00:00:00.001Z"],
    ["traffic24h", "validUntil", "2026-10-07T00:00:00.001Z"],
  ]) {
    const root = clone(); block(root, key)[field] = value;
    assert.equal(parsed(root)[key].status, "UNKNOWN", `${key}:${field}`);
  }
  const max = clone(); max.traffic24h.validUntil = "2026-10-07T00:00:00Z";
  assert.equal(parsed(max).traffic24h.status, "OK");
  const partial = clone(); Object.assign(partial.waf7d.topPaths, { status: "PARTIAL", coverage: "INCOMPLETE", errorCode: "PARTIAL_RESPONSE", windowStart: "2026-09-30T00:00:00Z" });
  assert.equal(parsed(partial).topPaths.status, "UNKNOWN");
});

test("unknown actions preserve count under Other, scope identifiers are not exposed", () => {
  const root = clone(); root.waf7d.summary.data = { actionCounts: { brand_new_action: 9 }, totalEvents: 9 };
  root.traffic24h.scope.id = "do-not-display-zone-id";
  assert.equal(parsed(root).summary.data.totalEvents, 9);
  assert.equal(actionLabel("brand_new_action"), "その他（処理種別未確認）");
  const output = html(root);
  assert.doesNotMatch(output, /その他（処理種別未確認）/);
  assert.doesNotMatch(output, /brand_new_action|do-not-display-zone-id/);
});

test("access trend and country failures remain independent on the main screen", () => {
  const noCountry = structuredClone(fixtureV2);
  Object.assign(noCountry.countryTraffic, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  let output = html(noCountry);
  assert.match(output, /この24時間には 100 件の HTTP リクエスト/);
  assert.match(output, /国別アクセス（直近24時間）/);
  assert.match(output, /取得失敗：最後の取得試行では、応答の待ち時間を超えました/);
  assert.doesNotMatch(output, /国・地域の件数順一覧/);
  const noTrend = structuredClone(fixtureV2);
  Object.assign(noTrend.trafficSeries, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  output = html(noTrend);
  assert.match(output, /国・地域の件数順一覧/);
  assert.match(output, /アクセス推移（直近24時間）/);
  assert.doesNotMatch(output, /この24時間には 100 件の HTTP リクエスト/);
});

test("collapsed data details flag a separate Pages failure and expired access stays hidden", () => {
  const pagesFailed = structuredClone(fixtureV2);
  Object.assign(pagesFailed.pagesMonth, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  const output = html(pagesFailed);
  assert.match(output, /<details[^>]*><summary[^>]*>データについて（要確認の項目があります）<\/summary>/);
  assert.match(output, /別の監視項目：Pages の取得状態：取得失敗/);
  assert.doesNotMatch(output, /Pages当月デプロイ|利用枠は未確認|危険度判定は次段階|WAFの処理結果/);
  const expired = html(fixtureV2, timestamp(fixtureV2.trafficSeries.validUntil));
  assert.match(expired, /アクセス推移（直近24時間）/);
  assert.match(expired, /期限切れ：データの有効期限に達しています/);
  assert.doesNotMatch(expired, /この24時間には 100 件の HTTP リクエスト/);
});

test("transport failure recommends retry instead of inventing a malformed collector result", () => {
  const output = html(null, null, { failed: true });
  assert.match(output, /APIからデータを取得できませんでした。値は表示できません/);
  assert.doesNotMatch(output, /必要な操作：収集処理の出力形式を確認する|危険度判定は次段階|100 件/);
  assert.doesNotMatch(html(fixtureV2, NOW, { failed: true }), /アクセス数（24時間）|100 件|データについて/);
});

test("monotonic clock includes RTT and uncertainty, expires at resync and ignores wall clock", () => {
  const anchor = syncClock(meta, 100, 300, null);
  assert.equal(clockUpperBound(anchor, 300), NOW + 5200);
  assert.equal(clockUpperBound(anchor, 1300), NOW + 6200);
  assert.equal(clockUpperBound(anchor, 30300), null);
  assert.equal(clockUpperBound(anchor, 299), null);
  const original = Date.now;
  try {
    for (const wall of [0, NOW - 86400000, NOW + 86400000]) { Date.now = () => wall; assert.equal(clockUpperBound(anchor, 1300), NOW + 6200); }
  } finally { Date.now = original; }
  const nearExpiry = syncClock({ ...meta, servedAt: "2026-10-06T02:59:55Z" }, 0, 100, null);
  assert.equal(assessBlock(parsed(fixture).traffic24h, clockUpperBound(nearExpiry, 100)).state, "期限切れ");
});

test("Worker clock settings keep production and staging on hourly sync", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url)));
  assert.equal(config.vars.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS, "3600");
  assert.equal(config.env.staging.vars.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS, "3600");
});

test("clock rejects missing config, excessive latency and contradictory resync", () => {
  for (const bad of [null, {}, { ...meta, servedAt: fixture.traffic24h.windowStart }, { ...meta, clockMaxUncertaintySeconds: null }, { ...meta, clockMaxUncertaintySeconds: 0 }, { ...meta, clockResyncIntervalSeconds: -1 }, { ...meta, clockResyncIntervalSeconds: "30" }]) {
    const previous = bad?.servedAt === fixture.traffic24h.windowStart ? syncClock(meta, 0, 100, null) : null;
    assert.equal(syncClock(bad, 200, 300, previous), null);
  }
  assert.equal(syncClock(meta, 0, 5001, null), null);
  assert.equal(syncClock(meta, 100, 90, null), null);
  const previous = syncClock(meta, 0, 100, null);
  assert.ok(syncClock({ ...meta, servedAt: "2026-10-06T00:00:10Z" }, 10000, 10100, previous));
  assert.equal(syncClock({ ...meta, servedAt: "2026-10-06T00:10:00Z" }, 10000, 10100, previous), null);
});

test("API auth/config, successful servedAt, no-store and all explicit method rejections", async t => {
  const names = ["DASHBOARD_API_TOKEN", "DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS", "DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS"];
  const saved = Object.fromEntries(names.map(n => [n, process.env[n]])); const oldFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = oldFetch; for (const n of names) saved[n] === undefined ? delete process.env[n] : process.env[n] = saved[n]; });
  let calls = 0;
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.cache, "no-store"); assert.equal(options.headers["X-Dashboard-Token"], "synthetic-only-token"); assert.ok(options.signal); return Response.json({ cloudflareCollection: fixture, responseMeta: { servedAt: "1999-01-01T00:00:00Z" } }); };
  const authenticated = new Request("https://example.test/api/dashboard-data", { headers: { "cf-access-jwt-assertion": "synthetic-assertion" } });
  const noStore = response => { assert.match(response.headers.get("cache-control"), /no-store/); assert.equal(response.headers.get("pragma"), "no-cache"); assert.equal(response.headers.get("expires"), "0"); };
  delete process.env.DASHBOARD_API_TOKEN;
  let response = await route.GET(authenticated); assert.equal(response.status, 500); noStore(response); assert.equal(calls, 0);
  process.env.DASHBOARD_API_TOKEN = "synthetic-only-token";
  response = await route.GET(new Request(authenticated.url)); assert.equal(response.status, 401); noStore(response); assert.equal(calls, 0);
  process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS = "5"; process.env.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS = "3600";
  const before = Date.now(); response = await route.GET(authenticated); const after = Date.now(); noStore(response); assert.equal(response.status, 200);
  const body = await response.json(); assert.ok(timestamp(body.responseMeta.servedAt) >= before && timestamp(body.responseMeta.servedAt) <= after); assert.match(body.responseMeta.servedAt, /Z$/); assert.equal(body.responseMeta.clockMaxUncertaintySeconds, 5); assert.equal(body.responseMeta.clockResyncIntervalSeconds, 3600); assert.deepEqual(body.cloudflareCollection, fixture);
  for (const value of [undefined, "0", "-1", "1.5", "01", "NaN", "9007199254740991"]) {
    if (value === undefined) delete process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS; else process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS = value;
    const body = await (await route.GET(authenticated)).json(); assert.equal(body.responseMeta.clockMaxUncertaintySeconds, null);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) { response = await route[method](); assert.equal(response.status, 405); noStore(response); }
  for (const upstream of [() => Response.json({}, { status: 403 }), () => Response.json(null), () => new Response("invalid JSON"), () => { throw new Error("synthetic private exception"); }]) {
    globalThis.fetch = async () => upstream(); response = await route.GET(authenticated); assert.equal(response.status, 500); noStore(response); const text = await response.text(); assert.doesNotMatch(text, /responseMeta|cloudflareCollection|private exception/);
  }
});

test("page refetches on visibility/pageshow/resume and periodic sync; fetch failure clears data", async t => {
  const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch, performance: globalThis.performance };
  t.after(() => { for (const [key, value] of Object.entries(originals)) value === undefined ? delete globalThis[key] : globalThis[key] = value; });
  const states = []; const effects = []; const timers = []; let stateIndex = 0; let mono = 0; let calls = 0; let error = false;
  const listeners = () => { const map = new Map(); return { map, addEventListener: (n, cb) => map.set(n, cb), removeEventListener: n => map.delete(n) }; };
  globalThis.window = { ...listeners(), setInterval: cb => (timers.push(cb), timers.length), clearInterval: () => {} };
  globalThis.document = { ...listeners(), visibilityState: "visible" };
  globalThis.performance = { now: () => mono };
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.cache, "no-store"); if (error) throw new Error("failed"); mono += 100; return Response.json({ cloudflareCollection: fixture, responseMeta: { ...hourlyMeta, servedAt: new Date(NOW + mono).toISOString() } }); };
  const hooks = { ...React, useState: initial => { const index = stateIndex++; states[index] = typeof initial === "function" ? initial() : initial; return [states[index], next => { states[index] = next; }]; }, useRef: current => ({ current }), useCallback: cb => cb, useEffect: cb => effects.push(cb) };
  const page = load(pageCode, name => name === "react" ? hooks : require(name));
  page.default(); const cleanup = effects[0](); const flush = () => new Promise(resolve => setImmediate(resolve)); await flush();
  assert.equal(calls, 1); assert.ok(states[2]); assert.equal(states[0].traffic24h.status, "OK");
  globalThis.document.visibilityState = "hidden"; globalThis.document.map.get("visibilitychange")(); assert.equal(states[2], null);
  globalThis.document.visibilityState = "visible"; globalThis.document.map.get("visibilitychange")(); await flush(); assert.equal(calls, 2);
  globalThis.window.map.get("pageshow")(); assert.equal(states[2], null); await flush(); assert.equal(calls, 3);
  globalThis.document.map.get("resume")(); await flush(); assert.equal(calls, 4);
  for (let i = 0; i < 3599; i++) { mono += 1000; timers[0](); }
  await flush(); assert.equal(calls, 4);
  mono += 1000; timers[0](); await flush(); assert.equal(calls, 5);
  mono += 5000; timers[0](); assert.equal(states[2], null); await flush(); assert.equal(calls, 6);
  error = true; globalThis.window.map.get("focus")(); await flush(); assert.equal(states[0].traffic24h.data, null); assert.equal(states[2], null); assert.equal(states[6], true);
  cleanup(); assert.equal(globalThis.document.map.size, 0); assert.equal(globalThis.window.map.size, 0);
});
