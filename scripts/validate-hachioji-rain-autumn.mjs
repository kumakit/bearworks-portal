import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSource, makeBundles, jsonBytes, sha256, version } from "./lib/hachioji-rain-autumn.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await loadSource(root);
assert.equal(source.manifest.sha256, "69386719a3ad29b243d40a96ff7400dc8e9f2fd568af0b01e12764966d7dcf7b");
assert.deepEqual(await readFile(resolve(root, "public/data/hachioji-rain-autumn", source.manifest.filename)), source.bytes);
assert.deepEqual(JSON.parse(await readFile(resolve(root, "public/data/hachioji-rain-autumn/source-manifest.json"), "utf8")), source.manifest);
const bundles = makeBundles(source);
for (const [slug, bundle] of Object.entries(bundles)) {
  const directory = resolve(root, `app/(monetized)/labs/hachioji-${slug}/data`);
  const lock = JSON.parse(await readFile(resolve(directory, `hachioji-${slug}-${version}.lock.json`), "utf8"));
  assert.equal(lock.filename, `hachioji-${slug}-${version}.json`);
  assert.equal(lock.version, version); assert.equal(lock.source_sha256, source.manifest.sha256);
  const bytes = await readFile(resolve(directory, lock.filename));
  assert.equal(bytes.length, lock.bytes); assert.equal(sha256(bytes), lock.sha256);
  assert.equal(bytes.toString("utf8"), jsonBytes(bundle), `${slug} must reproduce exactly from the fixed raw CSV`);
}
const r = bundles.rain.main; const a = bundles.autumn.main;
assert.deepEqual(r.included_years, [2015, 2016, 2017, 2018, 2021, 2022, 2023, 2025]);
assert.deepEqual(r.excluded.map(x => x.year), [2019, 2020, 2024]);
assert.equal(r.summary.h.total, 1446); assert.equal(r.summary.t.total, 1581.625);
assert.equal(r.summary.h.wet_days, 99.25); assert.equal(r.summary.t.wet_days, 102);
assert.deepEqual(r.contingency, { both: 665, h_only: 129, t_only: 151, neither: 1976, total: 2921 });
assert(r.summary.h.thresholds.every((x, i) => x.days < r.summary.t.thresholds[i].days));
for (const key of ["h", "t"]) {
  assert.equal(r.summary[key].monthly.reduce((best, x) => best.total > x.total ? best : x).month, 9);
  assert(r.annual.every(x => x[key].total <= 2500 && x[key].wet_days <= 150 && x[key].top5_share <= 60), "Rain chart domain must contain all values");
  assert(r.summary[key].monthly.every(x => x.total <= 350), "Monthly chart domain");
}
assert.deepEqual(a.excluded.map(x => x.year), [2014, 2018, 2021]);
assert.equal(a.comparison[1].early.middle, 47.6); assert.equal(a.comparison[1].late.middle, 42.5);
assert.equal(a.comparison[1].middle_difference, -5.1);
assert.equal(bundles.autumn.sensitivity_quality5.comparison[1].middle_difference, -3.2);
assert.equal(bundles.autumn.sensitivity_quality5.included_years.length, 17);
for (const annual of a.annual) {
  for (const t of annual.thresholds) assert.equal(t.cool + t.middle + t.warm, annual.valid_days);
}
console.log("PASS: 6,209 dates; source/download hashes; 2 deterministic bundles; complete-year policies; headline values; chart domains.");
