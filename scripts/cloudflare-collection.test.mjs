import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCK_KEYS, parseCollection, assessCollection, assessBlock, timestamp, syncClock, clockUpperBound, samplingNote, actionLabel } from "../app/(non-monetized)/dashboard/lib/cloudflareCollection.ts";

const require = createRequire(import.meta.url);
const fixtureBytes = await readFile(new URL("./fixtures/cloudflare-collection-v1.json", import.meta.url));
const fixture = JSON.parse(fixtureBytes);
const manifest = JSON.parse(await readFile(new URL("./fixtures/cloudflare-collection-manifest.json", import.meta.url)));
const NOW = Date.parse("2026-10-06T00:00:00Z");
const UNTIL = Date.parse("2026-10-06T03:00:00Z");
const clone = () => structuredClone(fixture);
const parsed = root => parseCollection({ cloudflareCollection: root });
const block = (root, key) => ["traffic24h", "pagesMonth"].includes(key) ? root[key] : root.waf7d[key];
const meta = { servedAt: "2026-10-06T00:00:00Z", clockMaxUncertaintySeconds: 5, clockResyncIntervalSeconds: 30 };

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
const pageCode = await compile("app/(non-monetized)/dashboard/cloudflare/page.tsx");
const html = (root, now = NOW, extra = {}) => renderToStaticMarkup(React.createElement(view, { collection: parsed(root), nowUpper: now, ...extra }));

test("shared fixture hash and independently specified expectations", () => {
  assert.equal(createHash("sha256").update(fixtureBytes).digest("hex"), manifest.files["cloudflare-collection-v1.json"]);
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
  assert.match(html(fixture), /利用枠は未確認/);
});

test("legacy, unknown version, root runId and malformed input never reuse old numeric values", () => {
  for (const input of [null, [], { summary: { cloudflareTotalThreats24h: 99999 }, wafDetails: { total_events: 88888 } }, { cloudflareCollection: { ...fixture, schemaVersion: 2 } }, { cloudflareCollection: { ...fixture, runId: " " } }]) {
    const result = parseCollection(input);
    for (const key of BLOCK_KEYS) assert.equal(result[key].data, null);
    assert.equal(assessCollection(result, NOW).state, "未確認");
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

test("optional failure keeps valid summary, counts the missing detail and gives collection action", () => {
  const root = clone(); Object.assign(root.waf7d.topPaths, { status: "ERROR", coverage: "UNKNOWN", errorCode: "ACCESS_DENIED", data: null, collectedAt: null, validUntil: null });
  const result = assessCollection(parsed(root), NOW);
  assert.equal(result.blocks.summary.usable, true);
  assert.equal(result.blocks.topPaths.usable, false);
  assert.equal(result.state, "一部未取得");
  assert.equal(result.counts.unavailable, 1);
  assert.match(result.actions[0], /設定とアクセス条件/);
  const output = html(root);
  assert.match(output, /総イベント 15 件/);
  assert.doesNotMatch(output, /\/wp-login.php ·/);
  assert.match(output, /最後の取得試行/);
  assert.doesNotMatch(output, /継続失敗|攻撃への対応/);
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
  assert.match(output, /本番の状態を表しません/);
  assert.doesNotMatch(output, /必要な操作：Cloudflare/);
});

test("zero events, empty arrays, sampling and zero-denominator cache rate stay distinct from null", () => {
  const root = clone(); root.traffic24h.data = { requests: 0, threatEvents: 0, cachedRequests: 0, cacheRate: null }; root.waf7d.summary.data = { actionCounts: {}, totalEvents: 0 };
  assert.equal(assessCollection(parsed(root), NOW).state, "取得正常");
  const output = html(root);
  assert.match(output, /算出不能/); assert.match(output, /この集計では観測されず（推計）/); assert.match(output, /この集計では観測されず（集計方法未確認）/);
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
  assert.match(output, /その他（処理種別未確認）/);
  assert.doesNotMatch(output, /brand_new_action|do-not-display-zone-id/);
});

test("graphs use valid summary and timeline independently; missing blocks never become zero graphs", () => {
  const root = clone(); root.waf7d.timeline.data = [{ hour: "2026-10-05T00:00:00Z", action: "block", count: 2 }];
  let output = html(root);
  assert.match(output, /処理種別分布。件数は下の一覧/);
  assert.match(output, /時間別WAFイベント件数/);
  Object.assign(root.waf7d.summary, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  output = html(root);
  assert.doesNotMatch(output, /処理種別分布。件数は下の一覧/);
  assert.match(output, /時間別WAFイベント件数/);
  Object.assign(root.waf7d.timeline, { status: "PARTIAL", coverage: "INCOMPLETE", errorCode: "PARTIAL_RESPONSE" });
  output = html(root); assert.match(output, /今回の部分データを参考表示/);
  Object.assign(root.waf7d.timeline, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  output = html(root); assert.doesNotMatch(output, /時間別WAFイベント件数|時系列グラフは表示できません/);
});

test("transport failure recommends retry instead of inventing a malformed collector result", () => {
  const output = html(null, null, { failed: true });
  assert.match(output, /収集APIの応答と接続を確認する/);
  assert.doesNotMatch(output, /必要な操作：収集処理の出力形式を確認する/);
  assert.match(output, /危険度判定は次段階/);
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
  process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS = "5"; process.env.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS = "30";
  const before = Date.now(); response = await route.GET(authenticated); const after = Date.now(); noStore(response); assert.equal(response.status, 200);
  const body = await response.json(); assert.ok(timestamp(body.responseMeta.servedAt) >= before && timestamp(body.responseMeta.servedAt) <= after); assert.match(body.responseMeta.servedAt, /Z$/); assert.equal(body.responseMeta.clockMaxUncertaintySeconds, 5); assert.equal(body.responseMeta.clockResyncIntervalSeconds, 30); assert.deepEqual(body.cloudflareCollection, fixture);
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
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.cache, "no-store"); if (error) throw new Error("failed"); mono += 100; return Response.json({ cloudflareCollection: fixture, responseMeta: { ...meta, servedAt: new Date(NOW + mono).toISOString() } }); };
  const hooks = { ...React, useState: initial => { const index = stateIndex++; states[index] = typeof initial === "function" ? initial() : initial; return [states[index], next => { states[index] = next; }]; }, useRef: current => ({ current }), useCallback: cb => cb, useEffect: cb => effects.push(cb) };
  const page = load(pageCode, name => name === "react" ? hooks : require(name));
  page.default(); const cleanup = effects[0](); const flush = () => new Promise(resolve => setImmediate(resolve)); await flush();
  assert.equal(calls, 1); assert.ok(states[1]); assert.equal(states[0].traffic24h.status, "OK");
  globalThis.document.visibilityState = "hidden"; globalThis.document.map.get("visibilitychange")(); assert.equal(states[1], null);
  globalThis.document.visibilityState = "visible"; globalThis.document.map.get("visibilitychange")(); await flush(); assert.equal(calls, 2);
  globalThis.window.map.get("pageshow")(); assert.equal(states[1], null); await flush(); assert.equal(calls, 3);
  globalThis.document.map.get("resume")(); await flush(); assert.equal(calls, 4);
  for (let i = 0; i < 30; i++) { mono += 1000; timers[0](); await flush(); }
  assert.equal(calls, 5);
  mono += 5000; timers[0](); assert.equal(states[1], null); await flush(); assert.equal(calls, 6);
  error = true; globalThis.window.map.get("focus")(); await flush(); assert.equal(states[0].traffic24h.data, null); assert.equal(states[1], null); assert.equal(states[5], true);
  cleanup(); assert.equal(globalThis.document.map.size, 0); assert.equal(globalThis.window.map.size, 0);
});
