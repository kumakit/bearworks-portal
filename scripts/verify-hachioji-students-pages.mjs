import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const article = "/labs/hachioji-students";
const previous = "/labs/hachioji-city-center";
const canonical = `https://bearworks.uk${article}`;
const image = "/images/hachioji-students/hero-illustration.webp";
const data = "/data/hachioji-students/student-data.json";

async function get(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  return response;
}

const page = (await (await get(article)).text()).replaceAll("<!-- -->", "");
for (const value of ["八王子はまだ学生の街？", "89,763", "104,130", "13.8", "5.3", "32.1", "9.7", "682",
  "90,768", "91,540", "18年分の数値表", "28.7", "35.7", "-0.87", "四分位範囲", "加盟25校の所在地一覧",
  "application/ld+json", `href="${previous}"`, `src="${image}"`,
  `rel="canonical" href="${canonical}"`, `property="og:image" content="https://bearworks.uk${image}"`,
  `href="${data}"`, `href="/data/hachioji-students/analysis.json"`, `href="/data/hachioji-students/campus-locations.json"`]) {
  assert(page.includes(value), `配信HTMLに必要な値がありません: ${value}`);
}
if (process.argv.includes("--ads")) assert(page.includes("ca-pub-0000000000000000"));

for (const path of [previous, "/labs"]) {
  assert((await (await get(path)).text()).includes(`href="${article}"`), path);
}
assert((await (await get("/sitemap.xml")).text()).includes(canonical));

for (const [path, contentType] of [
  [image, /image\/webp/],
  [data, /application\/json/],
  ["/data/hachioji-students/analysis.json", /application\/json/],
  ["/data/hachioji-students/campus-locations.json", /application\/json/],
]) {
  const response = await get(path);
  assert.match(response.headers.get("content-type"), contentType);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(`../public${path}`, import.meta.url)));
}

console.log("第5弾のページ検証に合格しました（HTML・統計値・地図・SNS画像・記事導線・配信データ）。");
