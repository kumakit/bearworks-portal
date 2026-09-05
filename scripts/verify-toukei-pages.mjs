import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

// Verify the actual TypeScript data and the server that serves the built pages.
// Usage: node scripts/verify-toukei-pages.mjs http://127.0.0.1:3000
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Use a local preview");
const bundle = await build({
  stdin: {
    contents: `export { problems } from "./app/(monetized)/toukei/problems/problem-data";
      export { guides } from "./app/(monetized)/toukei/guides/guide-data";
      export { siteContent } from "./app/site-content";`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { problems, guides, siteContent } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const expectedNewSlugs = [
  "linear-transformation", "bayes-theorem-screening", "binomial-normal-approximation",
  "sample-proportion-distribution", "paired-t-test",
];
const batch2Slugs = [
  "correlation-coefficient", "sum-and-difference-variance", "poisson-distribution-calculation",
  "sample-proportion-confidence-interval", "one-way-anova",
];
const batch3Slugs = [
  "two-sample-t-test-pooled", "two-sample-f-test-variance", "chi-square-goodness-of-fit",
  "adjusted-r-squared", "chi-square-variance-confidence-interval",
];
const batch4Slugs = [
  "laspeyres-paasche-price-index", "chebyshev-inequality", "geometric-distribution",
  "type-1-type-2-errors-power", "fishers-three-principles-experiment",
];
assert.equal(problems.length, 25);
assert.equal(new Set(problems.map(p => p.slug)).size, 25);
assert.deepEqual(problems.slice(5, 10).map(p => p.slug), expectedNewSlugs);
assert.deepEqual(problems.slice(10, 15).map(p => p.slug), batch2Slugs);
assert.deepEqual(problems.slice(15, 20).map(p => p.slug), batch3Slugs);
assert.deepEqual(problems.slice(20).map(p => p.slug), batch4Slugs);
assert.equal(siteContent.length, 42);
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const adPattern = /pagead2\.googlesyndication\.com|adsbygoogle|ca-pub-\d+/;
const escape = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
async function page(path, status = 200) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  assert.equal(response.status, status, `${path} status`);
  return response.text();
}
const index = await page("/toukei/problems");
for (const problem of problems) {
  const path = `/toukei/problems/${problem.slug}`;
  assert(manifest.routes[path], `${path} must be statically generated`);
  assert(index.includes(`href="${path}"`), `${path} index link`);
  const html = await page(path);
  assert(html.includes(`<link rel="canonical" href="https://bearworks.uk${path}"`), `${path} canonical`);
  assert(adPattern.test(html), `${path} ads`);
  assert(html.includes("ca-pub-0000000000000000"), `${path} use the dummy ad ID for QA`);
  for (const text of [problem.title, problem.question, problem.finalAnswer]) {
    assert(html.includes(escape(text)), `${path} rendered text: ${text.slice(0, 30)}`);
  }
  for (const value of problem.givenValues) {
    assert(html.includes(escape(value.label)) && html.includes(escape(value.value)), `${path} given values`);
  }
  for (const step of problem.solutionSteps) {
    assert(html.includes(escape(step.expression)), `${path} calculation`);
    assert(html.includes(escape(step.description)), `${path} explanation`);
  }
  for (const distractor of problem.distractors) {
    assert(html.includes(escape(distractor.value)) && html.includes(escape(distractor.reason)), `${path} distractor`);
  }
  for (const slug of problem.relatedGuideSlugs) {
    assert(guides.some(guide => guide.slug === slug), `${path} valid guide slug`);
    assert(html.includes(`href="/toukei/guides/${slug}"`), `${path} rendered guide link`);
  }
  for (const ref of [...problem.references, ...problem.appLinks, ...problem.provenance.evidenceLinks]) {
    assert(html.includes(`href="${escape(ref.url)}"`), `${path} reference link`);
  }
  if (expectedNewSlugs.includes(problem.slug)) {
    assert(html.includes("2026-09-04に公開内容を承認"), `${path} publication approval`);
    assert(!html.includes("最終公開内容の承認待ち") && !html.includes("公開前の検証版"), `${path} no draft notice`);
    assert(!html.includes("5例題の公開commit"), `${path} must not inherit old publication evidence`);
  }
  if (batch2Slugs.includes(problem.slug)) {
    assert(html.includes("2026-09-04に公開内容を承認"), `${path} publication approval`);
    assert(!html.includes("最終公開内容の承認待ち") && !html.includes("公開前の検証版"), `${path} no draft notice`);
    assert(!html.includes("5例題の公開commit"), `${path} no inherited publication evidence`);
    for (const text of [problem.author, problem.publishedAt, problem.reviewedAt, problem.provenance.aiUsage]) {
      assert(html.includes(escape(text)), `${path} author/date/provenance`);
    }
  }
  if (batch3Slugs.includes(problem.slug)) {
    assert(html.includes("運営者が公開内容を承認しました"), `${path} publication approval`);
    assert(!html.includes("最終公開内容の承認待ち") && !html.includes("公開前の検証版"), `${path} no draft notice`);
    assert(!html.includes("5例題の公開commit"), `${path} no inherited publication evidence`);
    for (const text of [problem.author, problem.publishedAt, problem.reviewedAt, problem.provenance.aiUsage]) {
      assert(html.includes(escape(text)), `${path} author/date/provenance`);
    }
  }
  if (batch4Slugs.includes(problem.slug)) {
    assert(html.includes("最終公開内容の承認待ち"), `${path} draft approval notice`);
    assert(html.includes("最終公開内容の確認と公開可否の判断は未実施"), `${path} accurate human review status`);
    assert(!html.includes("5例題の公開commit"), `${path} no inherited publication evidence`);
    for (const text of [problem.author, problem.publishedAt, problem.reviewedAt, problem.provenance.aiUsage]) {
      assert(html.includes(escape(text)), `${path} author/date/provenance`);
    }
  }
  const tables = [problem.frequencyTable, problem.solutionTable].filter(Boolean);
  for (const table of tables) {
    assert(table.rows.length > 0, `${path} table rows`);
    assert(html.includes(escape(table.caption)), `${path} table caption`);
    for (const column of table.columns) assert(html.includes(escape(column)), `${path} table column`);
    for (const row of table.rows) {
      assert.equal(row.length, table.columns.length);
      for (const cell of row) assert(html.includes(escape(cell)), `${path} table cell`);
    }
    assert(html.includes("<caption") && html.includes('scope="row"') && html.includes('scope="col"'), `${path} accessible table`);
  }
  console.log(`PASS ${path}: static, full text, canonical, ads, references`);
}
for (const path of ["/about", "/contact", "/privacy", "/weather", "/dashboard", "/ai-news"]) {
  assert(!adPattern.test(await page(path)), `${path} must have no ads`);
}
for (const path of ["/toukei/problems/__invalid__", "/toukei/guides/__invalid__", "/route-that-does-not-exist"]) {
  assert(!adPattern.test(await page(path, 404)), `${path} must have no ads`);
}
const xml = await page("/sitemap.xml");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, 42);
assert.equal(new Set(urls).size, 42);
assert.deepEqual([...urls].sort(), siteContent.map(p => `https://bearworks.uk${p.pathname}`).sort());
console.log("PASS: sitemap 42 unique URLs; 6 non-ad pages and 3 invalid/404 routes have no ads");
