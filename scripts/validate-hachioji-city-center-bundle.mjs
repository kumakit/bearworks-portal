import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const base = new URL("../public/data/hachioji-city-center/", import.meta.url);
const name = "hachioji-city-center-2026-10-27.r1.json";
const raw = await readFile(new URL(name, base));
const data = JSON.parse(raw);
const manifest = JSON.parse(await readFile(new URL("source-manifest.json", base)));
assert.deepEqual(raw, await readFile(new URL(`../app/(monetized)/labs/hachioji-city-center/data/${name}`, import.meta.url)));
assert.deepEqual((await readdir(base)).sort(), [...Object.keys(manifest.files), "source-manifest.json"].sort());
for (const [file, hash] of Object.entries(manifest.files)) {
  assert.equal(createHash("sha256").update(await readFile(new URL(file, base))).digest("hex"), hash, file);
}
for (const file of ["generate_bundle.py", "prepare_sources.py", "normalized-inputs.json"]) {
  assert.deepEqual(await readFile(new URL(`../scripts/hachioji-city-center/${file}`, import.meta.url)), await readFile(new URL(file, base)));
}
assert.equal(manifest.officialReconciliation.passed, true);
assert.equal(data.population.joined, false);
assert.equal(data.vacancies.joined, false);
assert.equal(data.walking.pointChanges.length, 32);
assert.equal(data.walking.pointChanges.filter(p => p.inPlan).length, 23);
for (const key of ["plan23", "all32"]) {
  assert.deepEqual(data.walking[key].map(r => r.year), Array.from({ length: 10 }, (_, i) => 2016 + i));
  for (const row of data.walking[key]) assert.equal(row.weighted, Math.round((row.holiday * 2 + row.weekday * 5) / 7));
}
assert.equal(data.summary.population.delta, 586);
assert.equal(data.summary.vacancies.delta, -24);
assert.equal(data.summary.planYearOnYear.weekday.delta, 2271);
assert.equal(data.summary.allYearOnYear.weekday.delta, -14343);
console.log("City center bundle: PASS (provenance, file hashes, split periods, subsets, weighted means)");
