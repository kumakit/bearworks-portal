// Explicit online check, separate from the reproducible offline build.
// Reads JMA public HTML tables, not the CSV parser used to create the bundle.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = await readFile(join(root, "app/(monetized)/labs/hachioji-heat/data/hachioji-heat-2026-09-17.r1.json"));
const bundle = JSON.parse(bytes);
const checks = [];
const mismatches = [];
let checked = 0;

for (const item of bundle.hourly_cases) {
  for (const station of ["hachioji", "tokyo"]) {
    const amedas = station === "hachioji";
    for (const date of [...new Set(item.series.map(point => point.date))]) {
      const [year, month, day] = date.split("-").map(Number);
      const url = `https://www.data.jma.go.jp/stats/etrn/view/hourly_${amedas ? "a" : "s"}1.php?prec_no=44&block_no=${amedas ? "0366" : "47662"}&year=${year}&month=${month}&day=${day}&view=`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200, url);
      const html = await response.text();
      assert(html.includes("気温"), `No temperature heading: ${url}`);
      const observations = new Map();
      for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const cells = [...match[1].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)];
        const text = cells.map(cell => cell[2].replace(/<[^>]+>/g, "").trim());
        if (!/^\d{1,2}$/.test(text[0] ?? "")) continue;
        const hour = Number(text[0]);
        const temperatureColumn = amedas ? 2 : 4;
        const cell = cells[temperatureColumn];
        assert(cell && /class="data_0_0"/.test(cell[1]), `Non-normal source value: ${url}/${hour}`);
        assert(/^-?\d+\.\d+$/.test(text[temperatureColumn]), `Invalid source temperature: ${url}/${hour}`);
        observations.set(hour, Number(text[temperatureColumn]));
      }
      assert.equal(observations.size, 24, `Expected 24 hourly rows: ${url}`);
      // JMA's hour 24 belongs to the following calendar day's hour 0 in the bundle.
      const matched = item.series.filter(point => point.date === date && point.hour !== 0 || point.hour === 0 && Date.parse(point.datetime) === Date.parse(`${date}T00:00:00+09:00`) + 24 * 3600000);
      const values = matched.map(point => {
        const observed = observations.get(point.hour === 0 ? 24 : point.hour);
        const expected = point[station].temp;
        checked += 1;
        if (observed !== expected) mismatches.push({ case: item.id, station, at: point.datetime, bundle: expected, source: observed });
        return { at: point.datetime, source_temperature_c: observed, bundle_temperature_c: expected };
      });
      checks.push({ case: item.id, station, url, retrieved_at: new Date().toISOString(), html_sha256: createHash("sha256").update(html).digest("hex"), values });
    }
  }
}
assert.equal(checked, 180, "All 3 cases × 30 timestamps × 2 stations must be checked");
const output = join(root, "docs/task/issue-381/evidence/jma-hourly-source-check.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ checked_at: new Date().toISOString(), bundle_sha256: createHash("sha256").update(bytes).digest("hex"), checked_temperatures: checked, mismatches, checks }, null, 2) + "\n");
assert.equal(mismatches.length, 0, `JMA mismatch: ${JSON.stringify(mismatches)}`);
console.log(`PASS: ${checked} hourly temperatures independently matched to 12 JMA HTML tables. Evidence: ${output}`);
