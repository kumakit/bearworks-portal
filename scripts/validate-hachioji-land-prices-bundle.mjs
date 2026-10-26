import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const dir = new URL("../public/data/hachioji-land-prices/", import.meta.url);
const raw = await readFile(new URL("hachioji-land-prices-2026-10-26.r1.json", dir));
const data = JSON.parse(raw);
const manifest = JSON.parse(await readFile(new URL("source-manifest.json", dir)));
const article = await readFile(new URL("../app/(monetized)/labs/hachioji-land-prices/data/hachioji-land-prices-2026-10-26.r1.json", import.meta.url));
assert.deepEqual(raw, article);
assert.equal(manifest.officialReconciliation.passed, true);
for (const [name, hash] of Object.entries(manifest.files)) assert.equal(createHash("sha256").update(await readFile(new URL(name, dir))).digest("hex"), hash, name);
const generator = await readFile(new URL("../scripts/hachioji-land-prices/generate_bundle.py", import.meta.url));
assert.equal(createHash("sha256").update(generator).digest("hex"), manifest.generatorSha256);
assert.deepEqual(generator, await readFile(new URL("generate_bundle.py", dir)));
assert.deepEqual(await readFile(new URL("../docs/task/issue-413/normalized-inputs.json", import.meta.url)), await readFile(new URL("normalized-inputs.json", dir)));
assert.deepEqual((await readdir(dir)).sort(), ["README.txt", "continuity-audit.csv", "generate_bundle.py", "hachioji-land-prices-2026-10-26.r1.json", "normalized-inputs.json", "points.csv", "source-manifest.json"].sort());
assert.equal(data.points.length, 685);
assert.equal(new Set(data.points.map(p => `${p.year}-${p.id}`)).size, 685);
for (const c of data.cities) {
  for (const [year, key] of [[2016, "past"], [2026, "current"]]) {
    const prices = data.points.filter(p => p.year === year && p.cityCode === c.code).map(p => p.price).sort((a,b) => a-b);
    const mid = Math.floor(prices.length / 2);
    assert.equal(prices.length, c[key].count);
    assert(Math.abs(prices.reduce((a,b)=>a+b,0) / prices.length - c[key].mean) < 1e-8);
    assert.equal(prices.length % 2 ? prices[mid] : (prices[mid-1] + prices[mid]) / 2, c[key].median);
    assert.equal(prices[0], c[key].min);
    assert.equal(prices.at(-1), c[key].max);
  }
}
assert.equal(data.continuity.audit.length, 341);
assert.equal(data.continuity.audit.filter(p=>p.status === "採用").length, data.continuity.count);
assert.equal(data.points.filter(p=>p.year===2026&&p.cityCode==="13201").length, 124);
console.log("Land price bundle: PASS (hash, publication set, means/medians, continuity audit)");
