import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const article = "/labs/hachioji-international";
const previous = "/labs/hachioji-students";
const canonical = "https://bearworks.uk" + article;
const image = "/images/hachioji-international/hero-illustration.webp";
const data = "/data/hachioji-international/population.json";

async function get(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  return response;
}

// React inserts empty comments between adjacent text nodes in the server output.
const page = (await (await get(article)).text()).replaceAll("<!-- -->", "");
for (const value of [
  "八王子は国際的になってきている？", "19,961", "10,964", "559,320", "8,997", "1.60％", "3.57％",
  "3.66％", "2025年4月", "25.6％", "41.3％", "32.1％", "14年分の人口と割合",
  "70.6％", "6.32％", "40.7％", "2.90％", "20,121", "町丁別マップ",
  "application/ld+json", `href="${previous}"`, `src="${image}"`, `href="${data}"`,
  `href="/data/hachioji-international/analysis.json"`, `href="/data/hachioji-international/town-map.json"`,
  `rel="canonical" href="${canonical}"`, `property="og:image" content="https://bearworks.uk${image}"`,
]) assert(page.includes(value), `配信HTMLに必要な値がありません: ${value}`);
if (process.argv.includes("--ads")) assert(page.includes("ca-pub-0000000000000000"));
for (const path of [previous, "/labs"]) {
  assert((await (await get(path)).text()).includes(`href="${article}"`), path);
}
assert((await (await get("/sitemap.xml")).text()).includes(canonical));
for (const [path, contentType] of [
  [image, /image\/webp/],
  [data, /application\/json/],
  ["/data/hachioji-international/analysis.json", /application\/json/],
  ["/data/hachioji-international/town-map.json", /application\/json/],
]) {
  const response = await get(path);
  assert.match(response.headers.get("content-type"), contentType);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL("../public" + path, import.meta.url)));
}
console.log("第6弾のページ検証に合格しました（掲載値・統計分析・町丁別地図・画像・データ・相互リンク）。");
