import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:3107");
assert(["http:", "https:"].includes(base.protocol), "HTTP(S) base URL required");
const requireAds = process.argv.includes("--ads");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const articles = [
  { path: "/labs/hachioji-rain", name: "hachioji-rain", headline: "雨が多い街。", result: "1,446.0", title: "八王子は都心より雨が多い？" },
  { path: "/labs/hachioji-autumn", name: "hachioji-autumn", headline: "夏が終わると、", result: "47.6", title: "八王子の秋は本当に短くなった？" },
];
let checks = 0;
async function get(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200, `${path}: HTTP 200`);
  checks++;
  return Buffer.from(await response.arrayBuffer());
}

for (const article of articles) {
  const html = (await get(article.path)).toString("utf8");
  const canonical = `https://bearworks.uk${article.path}`;
  assert(html.includes(article.headline) && html.includes(article.result), `${article.path}: article body`);
  assert(html.includes(`rel="canonical" href="${canonical}"`), `${article.path}: canonical`);
  assert(html.includes(article.title), `${article.path}: title`);
  const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
  assert(structuredData.some(item => item["@type"] === "Article" && item.mainEntityOfPage === canonical), `${article.path}: Article schema`);
  const lock = JSON.parse(await readFile(new URL(`../app/(monetized)/labs/${article.name}/data/${article.name}-2026-10-04.r1.lock.json`, import.meta.url), "utf8"));
  assert(html.includes(lock.sha256), `${article.path}: fixed data hash`);
  assert(html.includes("2026-10-04 原稿承認"), `${article.path}: operator approval`);
  assert(!html.includes("最終原稿の確認待ち"), `${article.path}: no stale approval text`);
  assert.equal((html.match(/<summary[^>]*><span[^>]*>Q/g) ?? []).length, 5, `${article.path}: five questions`);
  for (const other of articles) assert(html.includes(`href="${other.path}"`), `${article.path}: series navigation`);
  if (requireAds) assert(html.includes("ca-pub-0000000000000000"), `${article.path}: CI ad layout`);
}

const csvPath = "/data/hachioji-rain-autumn/jma-daily-2009-2025-20261004.csv";
const csv = await get(csvPath);
const source = await readFile(new URL("../data/hachioji-rain-autumn/jma-daily-2009-2025-20261004.csv", import.meta.url));
assert.equal(hash(csv), hash(source), "download CSV bytes match original");
assert.equal(hash(csv), "69386719a3ad29b243d40a96ff7400dc8e9f2fd568af0b01e12764966d7dcf7b", "pinned original hash");
const manifestPath = "/data/hachioji-rain-autumn/source-manifest.json";
assert.equal(hash(await get(manifestPath)), hash(await readFile(new URL("../data/hachioji-rain-autumn/source-manifest.json", import.meta.url))), "download manifest bytes match original");

for (const path of ["/", "/sitemap.xml", "/labs/hachioji-climate", "/labs/hachioji-snow", "/labs/hachioji-heat", "/labs/hachioji-chill", "/labs/takao-gear", "/labs/takao-weather-shift"]) {
  const text = (await get(path)).toString("utf8");
  for (const article of articles) assert(text.includes(article.path), `${path}: new article link`);
}
console.log(`PASS: ${checks} routes; article body/schema/canonical/data hashes/approval/questions; downloads; series links and sitemap${requireAds ? "; CI ad layout" : ""}.`);
