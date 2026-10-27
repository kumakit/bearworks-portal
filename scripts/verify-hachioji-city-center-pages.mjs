import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const get = async path => {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  return response.text();
};
const html = await get("/labs/hachioji-city-center");
for (const value of ["八王子の中心市街地は", "586", "34,769", "118,742", "62", "2:5", "32地点", "115ha", "建設予定戸数の累計", "14,343", "2016–2025", "来街者の実人数", "https://bearworks.uk/labs/hachioji-city-center", "application/ld+json", "hero-illustration.webp", "2016–2025年度の数値表", "CC BY"]) assert(html.includes(value), `SSR: ${value}`);
assert(html.includes('src="/images/hachioji-city-center/hero-illustration.webp"'));
assert(html.includes("実在の場所や建物、人通りの量を再現したものではありません"));
assert(html.includes('rel="canonical"'));
if (process.argv.includes("--ads")) assert(html.includes("ca-pub-0000000000000000"), "monetized CI preview uses test ad ID");
for (const slug of ["hachioji-population", "hachioji-land-prices", "hachioji-aging"]) {
  assert(html.includes(`/labs/${slug}`));
  assert((await get(`/labs/${slug}`)).includes("/labs/hachioji-city-center"));
}
assert((await get("/labs")).includes("/labs/hachioji-city-center"));
assert((await get("/sitemap.xml")).includes("https://bearworks.uk/labs/hachioji-city-center"));
const manifest = JSON.parse(await readFile(new URL("../public/data/hachioji-city-center/source-manifest.json", import.meta.url), "utf8"));
for (const name of [...Object.keys(manifest.files), "source-manifest.json"]) {
  const actual = await fetch(new URL(`/data/hachioji-city-center/${name}`, base));
  assert.equal(actual.status, 200, name);
  assert.deepEqual(Buffer.from(await actual.arrayBuffer()), await readFile(new URL(`../public/data/hachioji-city-center/${name}`, import.meta.url)), name);
}
const hero = await fetch(new URL("/images/hachioji-city-center/hero-illustration.webp", base));
assert.equal(hero.status, 200);
assert.match(hero.headers.get("content-type"), /image\/webp/);
assert.deepEqual(Buffer.from(await hero.arrayBuffer()), await readFile(new URL("../public/images/hachioji-city-center/hero-illustration.webp", import.meta.url)));
console.log("City center pages: PASS (SSR, canonical, related links, Labs/sitemap, data bytes, OGP)");
