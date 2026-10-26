import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base=process.argv[2] ?? "http://127.0.0.1:8788";
const get=async path=>{const r=await fetch(new URL(path,base));assert.equal(r.status,200,path);return r.text();};
const html=await get("/labs/hachioji-aging");
const textContent=html.replace(/<!--.*?-->/gs,"").replace(/<[^>]*>/g,"");
for (const text of ["八王子は高齢者の街", "143,464","157,614","95,600","30,379","28.1%","2026年1月1日","全199町丁","189町丁","CC BY 4.0","高齢化率だけで、まちの衰退は判断できない","https://bearworks.uk/labs/hachioji-aging","/labs/hachioji-population","/labs/hachioji-land-prices"]) assert((html+textContent).includes(text),text);
assert(html.includes('src="/images/hachioji-aging/hero-illustration.webp"'));
assert(html.includes("人口・年齢構成の比率を再現したものではありません"));
assert(html.includes('property="og:image"'));
assert(html.includes("https://bearworks.uk/images/hachioji-aging/hero-illustration.webp"));
assert(!html.includes("/_next/image"), "hero uses the static asset directly");
const imageResponse = await fetch(new URL("/images/hachioji-aging/hero-illustration.webp", base));
assert.equal(imageResponse.status, 200);
assert(imageResponse.headers.get("content-type")?.includes("image/webp"));
assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), await readFile(new URL("../public/images/hachioji-aging/hero-illustration.webp", import.meta.url)));
for (const path of ["/labs","/labs/hachioji-population","/labs/hachioji-land-prices","/sitemap.xml"]) assert((await get(path)).includes("/labs/hachioji-aging"),path);
const lock=JSON.parse(await readFile(new URL("./hachioji-aging/publication.lock.json",import.meta.url)));
for (const path of Object.keys(lock.files).filter(p=>p.startsWith("public/"))) {
  assert.equal(await get(path.slice(6)),await readFile(new URL("../"+path,import.meta.url),"utf8"),path);
}
console.log("Aging pages: PASS (SSR, links, canonical, sitemap, all public file bytes)");
