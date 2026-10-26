import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const read = p => readFile(new URL(p, root));
const json = async p => JSON.parse(await read(p));
const lock = await json("scripts/hachioji-aging/publication.lock.json");
for (const [path, expected] of Object.entries(lock.files)) {
  assert.equal(createHash("sha256").update(await read(path)).digest("hex"), expected, path);
}
const dir = "public/data/hachioji-aging/";
const expected = Object.keys(lock.files).filter(p=>p.startsWith(dir)).map(p=>p.slice(dir.length)).sort();
assert.deepEqual((await readdir(new URL(dir, root))).sort(), expected, "exact public file set");
const data = await json(dir+"hachioji-aging-2026-10-26.r1.json");
const input = await json("scripts/hachioji-aging/normalized-inputs.json");
assert.deepEqual(data.cityDates, ["2016-09-30","2026-09-30"]);
assert.equal(data.comparisonDate, "2026-01-01");
assert.equal(data.regions.length, 199);
assert.equal(new Set(data.regions.map(r=>r.code)).size, 199);
assert.equal(data.regions.filter(r=>r.previous).length, 191);
assert.equal(data.regions.filter(r=>r.comparisonEligible).length, 189);
for (const [i, city] of data.city.entries()) {
  const towns=input.city[i].towns;
  assert.equal(towns.reduce((s,r)=>s+r.population,0),city.population);
  for (const [key, start] of [["age65plus",13],["age75plus",15],["age85plus",17]]) {
    assert.equal(towns.reduce((s,r)=>s+r.bins.slice(start).reduce((a,b)=>a+b,0),0),city[key]);
  }
  assert.equal(data.exclusiveGroups.reduce((s,r)=>s+r[i===0?"before":"after"],0),city.population);
}
for (const r of data.regions) {
  assert(r.current.age85plus<=r.current.age75plus && r.current.age75plus<=r.current.age65plus);
  assert(Math.abs(r.current.age65plus/r.current.population*100-r.current.share65plus)<1e-6);
  if (r.exclusion) assert(r.previous===null && r.points===null && r.delta65===null);
}
assert.deepEqual(data.comparison.map(r=>r.code),["13201","13202","13209","13212","13206","13205","13000","13200"]);
console.log("Aging bundle: PASS (hashes, exact files, all town/age totals, dates, exclusions, nested ages)");
