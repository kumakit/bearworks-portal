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
const initialSlugs = [
  "confidence-interval", "hypothesis-test", "simple-regression",
  "contingency-table", "sampling-bias",
];
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
const batch5Slugs = [
  "two-sample-proportion-test", "exponential-distribution-waiting-time",
  "time-series-moving-average-autocorrelation", "two-way-anova-interaction",
  "multiple-regression-multicollinearity-dummy",
];
const expectedProblemSlugs = [
  ...initialSlugs, ...expectedNewSlugs, ...batch2Slugs, ...batch3Slugs,
  ...batch4Slugs, ...batch5Slugs,
];
const expectedGuideSlugs = [
  "learning-roadmap", "cbt-time-management", "hypothesis-testing-basics",
  "choosing-statistical-tests", "distribution-selection",
  "regression-interpretation", "anova-and-chi-square", "sampling-and-bias",
];
assert.equal(problems.length, 30);
assert.equal(new Set(problems.map(p => p.slug)).size, 30);
assert.deepEqual(problems.map(p => p.slug), expectedProblemSlugs, "approved problem slugs");
assert.deepEqual(guides.map(g => g.slug), expectedGuideSlugs, "approved guide slugs");
const expectedStaticPaths = [
  "/", "/about", "/contact", "/privacy", "/toukei", "/toukei/guides",
  "/toukei/problems", "/toukei/methodology", "/labs/hachioji-climate",
  "/labs/hachioji-snow", "/labs/hachioji-heat", "/labs/hachioji-chill",
  "/labs/takao-gear", "/labs/takao-weather-shift",
  "/labs/hachioji-rain", "/labs/hachioji-autumn",
];
const expectedContentPaths = [
  ...expectedStaticPaths,
  ...expectedGuideSlugs.map(slug => `/toukei/guides/${slug}`),
  ...expectedProblemSlugs.map(slug => `/toukei/problems/${slug}`),
];
assert.equal(siteContent.length, expectedContentPaths.length);
assert.equal(new Set(expectedContentPaths).size, expectedContentPaths.length, "approved paths must be unique");
assert.equal(new Set(siteContent.map(entry => entry.pathname)).size, siteContent.length, "siteContent paths must be unique");
assert.deepEqual(siteContent.map(entry => entry.pathname).sort(), expectedContentPaths.sort());
assert(siteContent.some(entry => entry.pathname === "/labs/takao-weather-shift"));
assert(siteContent.some(entry => entry.pathname === "/labs/takao-gear"));
assert(siteContent.some(entry => entry.pathname === "/labs/hachioji-chill"));
assert(siteContent.some(entry => entry.pathname === "/labs/hachioji-heat"));
assert(siteContent.some(entry => entry.pathname === "/labs/hachioji-snow"));
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
    assert(html.includes("運営者が公開内容を承認しました"), `${path} publication approval`);
    assert(!html.includes("最終公開内容の承認待ち") && !html.includes("公開前の検証版"), `${path} no draft notice`);
    assert(!html.includes("5例題の公開commit"), `${path} no inherited publication evidence`);
    for (const text of [problem.author, problem.publishedAt, problem.reviewedAt, problem.provenance.aiUsage]) {
      assert(html.includes(escape(text)), `${path} author/date/provenance`);
    }
  }
  if (batch5Slugs.includes(problem.slug)) {
    assert(html.includes("運営者が公開内容を承認しました"), `${path} publication approval`);
    assert(!html.includes("最終公開内容の承認待ち") && !html.includes("公開前の検証版") && !html.includes("公開承認待ち"), `${path} no draft notice`);
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
const guideIndex = await page("/toukei/guides");
for (const guide of guides) {
  const path = `/toukei/guides/${guide.slug}`;
  assert(manifest.routes[path], `${path} must be statically generated`);
  assert(guideIndex.includes(`href="${path}"`), `${path} index link`);
  const html = await page(path);
  assert(html.includes(`<link rel="canonical" href="https://bearworks.uk${path}"`), `${path} canonical`);
  assert(adPattern.test(html), `${path} ads`);
  for (const value of [guide.title, guide.question, guide.author, guide.publishedAt, guide.reviewedAt, guide.provenance.finalReviewedBy]) {
    assert(html.includes(escape(value)), `${path} displayed content: ${value.slice(0, 30)}`);
  }
  for (const section of guide.sections) {
    assert(html.includes(escape(section.heading)), `${path} section heading`);
    assert(html.includes(escape(section.text.split("\n\n")[0].slice(0, 30))), `${path} section body`);
  }
  for (const ref of guide.references) {
    assert(html.includes(`href="${escape(ref.url)}"`), `${path} reference link`);
  }
  console.log(`PASS ${path}: static, canonical, content, references`);
}
for (const path of ["/about", "/contact", "/privacy", "/weather", "/dashboard", "/ai-news"]) {
  assert(!adPattern.test(await page(path)), `${path} must have no ads`);
}
for (const path of ["/toukei/problems/__invalid__", "/toukei/guides/__invalid__", "/route-that-does-not-exist"]) {
  assert(!adPattern.test(await page(path, 404)), `${path} must have no ads`);
}
const xml = await page("/sitemap.xml");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, expectedContentPaths.length);
assert.equal(new Set(urls).size, urls.length);
assert.deepEqual([...urls].sort(), expectedContentPaths.map(path => `https://bearworks.uk${path}`).sort());
console.log(`PASS: sitemap ${urls.length} unique URLs; 6 non-ad pages and 3 invalid/404 routes have no ads`);
