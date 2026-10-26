import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.argv[2] ?? "http://127.0.0.1:8788";
const get = async path => { const r = await fetch(new URL(path, base)); assert.equal(r.status, 200, path); return r.text(); };
const html = await get("/labs/hachioji-land-prices");
for (const s of ["八王子は本当に", "124地点", "131,316", "117,500", "11,750,000", "14.7%", "9.1%", "225", "2016年の全地点の分布", "2026年", "実際の売買価格", "CC BY 4.0", "商用可", "/labs/hachioji-population", "124地点の所在地と価格を表で見る", "https://bearworks.uk/labs/hachioji-land-prices"]) assert(html.includes(s), `SSR includes ${s}`);
assert((await get("/labs")).includes("/labs/hachioji-land-prices"));
assert((await get("/labs/hachioji-population")).includes("/labs/hachioji-land-prices"));
assert((await get("/sitemap.xml")).includes("https://bearworks.uk/labs/hachioji-land-prices"));
for (const name of ["source-manifest.json", "points.csv", "continuity-audit.csv", "README.txt", "generate_bundle.py", "normalized-inputs.json", "hachioji-land-prices-2026-10-26.r1.json"]) {
  const response = await get(`/data/hachioji-land-prices/${name}`);
  const expected = await readFile(new URL(`../public/data/hachioji-land-prices/${name}`, import.meta.url), "utf8");
  assert.equal(response, expected, `deployed bytes: ${name}`);
}
console.log("Land price pages: PASS (SSR, related links, canonical, sitemap, data bytes)");
