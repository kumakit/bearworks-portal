import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
for (const path of ["/labs", "/labs/hachioji-population"]) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path} returns 200`);
  const html = await response.text();
  assert(html.includes(`https://bearworks.uk${path}`) || path === "/labs", `${path} has canonical or is the listing`);
  if (path === "/labs") {
    assert(html.includes("八王子を数字で読み解く"), "Labs lists the new series");
    assert(html.includes("八王子の気候を一次データで検証"), "Labs keeps the climate series");
  } else {
    for (const text of ["八王子の人口は", "563,327", "559,320", "−4,007", "2016年9月末", "2026年9月末", "区域変更関連の比較対象外8町丁", "CC BY 4.0", "比較対象191町丁の数値を表で見る"]) {
      assert(html.includes(text), `population page includes server-rendered ${text}`);
    }
    assert(html.includes("/data/hachioji-population/annual-population.csv"), "page links to reproducible data");
  }
}
const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
assert(sitemap.includes("https://bearworks.uk/labs/hachioji-population"), "sitemap contains the article");
assert(sitemap.includes("https://bearworks.uk/labs"), "sitemap contains the Labs page");
console.log("Hachioji population pages: PASS (SSR copy, links, canonical, sitemap)");
