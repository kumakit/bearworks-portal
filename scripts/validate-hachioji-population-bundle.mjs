import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const bundlePath = "app/(monetized)/labs/hachioji-population/data/hachioji-population-2026-10-24.r1.json";
const publicDir = "public/data/hachioji-population";
const bundleBytes = await readFile(bundlePath);
const bundle = JSON.parse(bundleBytes.toString("utf8"));
const lock = JSON.parse(await readFile("app/(monetized)/labs/hachioji-population/data/lock.json", "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
assert.equal(sha(bundleBytes), lock.sha256, "bundle hash matches lock");
assert.equal(bundleBytes.length, lock.bytes, "bundle byte length matches lock");
const publishedBundleBytes = await readFile(`${publicDir}/${lock.bundle}`);
assert.equal(sha(publishedBundleBytes), lock.sha256, "public aggregate JSON matches the locked bundle");
assert.equal(bundle.schemaVersion, 1);
assert.equal(bundle.comparison.from, "2016-09-30");
assert.equal(bundle.comparison.to, "2026-09-30");
assert.equal(bundle.comparison.cityPopulation2016, 563327);
assert.equal(bundle.comparison.cityPopulation2026, 559320);
assert.equal(bundle.comparison.cityDelta, -4007);
assert.equal(bundle.comparison.latestYearDelta, 56);
assert.equal(bundle.annualPopulation.length, 11);
assert.equal(bundle.regions.count, 191);
assert.equal(bundle.regions.rows.length, 191);
assert.equal(bundle.regions.rateEligibleCount, 190);
assert.equal(bundle.regions.rateExcludedSmallBaseline.length, 1);
assert.equal(bundle.regions.rateExcludedSmallBaseline[0].name, "宇津貫町");
assert.equal(bundle.excludedRegions.count, 8);
assert.equal(bundle.excludedRegions.confirmedCount, 4);
assert.equal(bundle.excludedRegions.effectiveDateUnconfirmedCount, 4);
for (const row of bundle.excludedRegions.rows) {
  assert(!("delta" in row) && !("changePercent" in row), `${row.name} stays reference-only`);
}
const excludedCodes = new Set(bundle.excludedRegions.rows.map((row) => row.code));
for (const row of bundle.regions.rows) assert(!excludedCodes.has(row.code), `${row.name} excluded from comparison`);
for (const ranking of [bundle.regions.deltaIncreaseTop, bundle.regions.deltaDecreaseTop, bundle.regions.rateIncreaseTop, bundle.regions.rateDecreaseTop]) {
  for (const row of ranking) assert(!excludedCodes.has(row.code), `${row.name} excluded from rankings`);
}
const compareDelta = (a, b) => a.delta - b.delta;
const compareRate = (a, b) => BigInt(a.delta) * BigInt(b.population2016) - BigInt(b.delta) * BigInt(a.population2016);
const expectedTop = (rows, compare, descending) => {
  const orderCompare = (a, b) => {
    const raw = compare(a, b);
    const result = (typeof raw === "bigint" ? Number(raw > 0n ? 1n : raw < 0n ? -1n : 0n) : Math.sign(raw)) * (descending ? -1 : 1);
    return result || a.name.localeCompare(b.name, "ja");
  };
  const sorted = [...rows].sort(orderCompare);
  if (sorted.length <= 10) return sorted;
  const cutoff = sorted[9];
  return sorted.filter((row) => orderCompare(row, cutoff) <= 0);
};
for (const [actual, expected] of [
  [bundle.regions.deltaIncreaseTop, expectedTop(bundle.regions.rows, compareDelta, true)],
  [bundle.regions.deltaDecreaseTop, expectedTop(bundle.regions.rows, compareDelta, false)],
  [bundle.regions.rateIncreaseTop, expectedTop(bundle.regions.rows.filter((row) => row.population2016 >= 100), compareRate, true)],
  [bundle.regions.rateDecreaseTop, expectedTop(bundle.regions.rows.filter((row) => row.population2016 >= 100), compareRate, false)],
]) assert.deepEqual(actual.map((row) => row.code), expected.map((row) => row.code), "rankings use exact values and retain exact ties");
assert(Math.abs(bundle.ageComposition.reduce((sum, row) => sum + row.share2016, 0) - 100) < 0.02);
assert(Math.abs(bundle.ageComposition.reduce((sum, row) => sum + row.share2026, 0) - 100) < 0.02);
assert.equal(bundle.ageComposition.reduce((sum, row) => sum + row.delta, 0), bundle.comparison.cityDelta);

const csvRows = async (filename) => (await readFile(`${publicDir}/${filename}`, "utf8")).trim().split(/\r?\n/);
assert.equal((await csvRows("annual-population.csv")).length, 12);
assert.equal((await csvRows("age-2016-09.csv")).length, 200);
assert.equal((await csvRows("age-2026-09.csv")).length, 200);
assert.equal((await csvRows("retained-region-comparison.csv")).length, 192);
assert.equal((await csvRows("excluded-region-reference.csv")).length, 9);
assert.equal((await csvRows("csv-2026-discrepancies.csv")).length, 9);

const inputDir = "docs/task/issue-410/evidence/normalized";
for (const [filename, expected] of Object.entries(bundle.sourceHashes)) {
  const actual = sha(await readFile(`${inputDir}/${filename}`));
  assert.equal(actual, expected, `${filename} source hash`);
  assert.equal(lock.sourceHashes[filename], expected, `${filename} lock hash`);
}
const manifest = JSON.parse(await readFile(`${publicDir}/source-manifest.json`, "utf8"));
assert.deepEqual([...manifest.plannedFiles].sort(), (await readdir(publicDir)).sort(), "published files match the manifest");
assert(!manifest.plannedPublicArtifacts.includes("original-dataset"));
assert.equal(manifest.publicBundle.sha256, lock.sha256);
for (const record of manifest.records) assert(!record.plannedPublicArtifacts?.includes("original-dataset"), `${record.filename} does not plan to publish an original`);
console.log("Hachioji population bundle: PASS (11 city snapshots, 191 retained towns, 8 reference-only exclusions, 190 rate ranks)");
