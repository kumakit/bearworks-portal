import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "app", "(monetized)", "labs", "hachioji-heat", "data");

const expected = {
  lockSchemaVersion: "1.0.0",
  bundleFile: "hachioji-heat-2026-09-17.r1.json",
  bundleVersion: "2026-09-17.r1",
  bundleSchemaVersion: "1.0.0",
  bundleByteSize: 63059,
  bundleSha256: "895f0e900555d84ac7e3881a89bcf1b2ab451d82a826c52d638451cbbd9586d1",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertClose(actual, expectedValue, label) {
  assert(Math.abs(actual - expectedValue) < 1e-4, `${label}: expected ${expectedValue}, got ${actual}`);
}

async function validate() {
  const lockBytes = await readFile(join(dataDir, `${expected.bundleFile.replace(/\.json$/, "")}.lock.json`), "utf8");
  const lock = JSON.parse(lockBytes);
  const bundleBytes = await readFile(join(dataDir, expected.bundleFile));
  const bundle = JSON.parse(bundleBytes.toString("utf8"));
  const actualSha256 = createHash("sha256").update(bundleBytes).digest("hex");

  assert(lock.lock_schema_version === expected.lockSchemaVersion, "lock schema version mismatch");
  assert(lock.bundle_file === expected.bundleFile, "lock bundle file mismatch");
  assert(lock.bundle_version === expected.bundleVersion, "lock bundle version mismatch");
  assert(lock.bundle_schema_version === expected.bundleSchemaVersion, "lock bundle schema version mismatch");
  assert(lock.bundle_byte_size === expected.bundleByteSize, "lock byte size mismatch");
  assert(lock.bundle_sha256 === expected.bundleSha256, "lock SHA-256 mismatch");

  assert(bundleBytes.byteLength === expected.bundleByteSize, "bundle byte size mismatch");
  assert(actualSha256 === expected.bundleSha256, "bundle SHA-256 mismatch");
  assert(bundle.bundle_schema_version === expected.bundleSchemaVersion, "bundle schema version mismatch");
  assert(bundle.bundle_version === expected.bundleVersion, "bundle version mismatch");

  // Stations check
  const stationKeys = bundle.stations.map((s) => s.key).sort();
  assert(JSON.stringify(stationKeys) === '["fuchu","hachioji","ome","tokyo"]', "station keys mismatch");

  // Annual comparison check (1990-2025: 36 years)
  assert(bundle.annual_comparison.length === 36, `expected 36 annual rows, got ${bundle.annual_comparison.length}`);
  assert(bundle.annual_comparison[0].year === 1990, "first year must be 1990");
  assert(bundle.annual_comparison[35].year === 2025, "last year must be 2025");

  // Verify all copied annual values against the independently locked source.
  const climateBytes = await readFile(join(root, "app", "(monetized)", "labs", "hachioji-climate", "data", "hachioji-climate-2026-08-11.r1.json"));
  assert(createHash("sha256").update(climateBytes).digest("hex") === "8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd", "annual source SHA mismatch");
  const climate = JSON.parse(climateBytes);
  for (const [index, row] of bundle.annual_comparison.entries()) {
    assert(row.year === 1990 + index, "annual years must be unique and consecutive");
    for (const station of stationKeys) {
      const source = climate.aggregates.annual.find(item => item.station_key === station && item.period_id === row.year);
      assert(source && row[station], `missing source station-year: ${station}/${row.year}`);
      for (const [metric, value] of Object.entries(row[station])) {
        assertClose(value, source.metrics[metric], `${station}/${row.year}/${metric} source match`);
      }
      for (const element of ["max", "min", "range"]) {
        const coverage = source.coverage[element];
        assert(coverage.publishable && coverage.rate >= 0.9, `${station}/${row.year}/${element} is not publishable`);
      }
    }
  }

  // Recalculate 2020-2025 averages and verify against summary
  const recent6 = bundle.annual_comparison.filter((r) => r.year >= 2020 && r.year <= 2025);
  assert(recent6.length === 6, "must have 6 rows for 2020-2025");

  const calcAvg = (fn) => Math.round((recent6.reduce((sum, item) => sum + fn(item), 0) / recent6.length) * 10) / 10;
  assertClose(calcAvg((r) => r.hachioji.heatstroke_days), bundle.summary.recent_averages_2020_2025.heatstroke_days.hachioji, "hachioji heatstroke_days avg");
  assertClose(calcAvg((r) => r.tokyo.heatstroke_days), bundle.summary.recent_averages_2020_2025.heatstroke_days.tokyo, "tokyo heatstroke_days avg");
  assertClose(calcAvg((r) => r.hachioji.min_temp_ge25_days), bundle.summary.recent_averages_2020_2025.min_temp_ge25_days.hachioji, "hachioji min_temp_ge25_days avg");
  assertClose(calcAvg((r) => r.tokyo.min_temp_ge25_days), bundle.summary.recent_averages_2020_2025.min_temp_ge25_days.tokyo, "tokyo min_temp_ge25_days avg");
  for (const [metric, values] of Object.entries(bundle.summary.recent_averages_2020_2025)) {
    for (const station of stationKeys) assertClose(calcAvg(row => row[station][metric]), values[station], `${station}/${metric} recent average`);
  }
  assertClose(calcAvg(row => row.hachioji.heatstroke_days - row.tokyo.heatstroke_days), 6.8, "round differences only after averaging");
  assertClose(calcAvg(row => row.hachioji.min_temp_ge25_days - row.tokyo.min_temp_ge25_days), -27, "recent minimum-temperature day difference");
  for (const id of ["H1", "H2"]) {
    const hypothesis = climate.hypotheses.find(item => item.hypothesis_id === id);
    assert(JSON.stringify(hypothesis.segments.map(segment => [segment.period_start, segment.period_end])) === "[[1990,2002],[2003,2007],[2009,2013],[2015,2025]]", "common annual intervals changed");
    for (const segment of hypothesis.segments) {
      const rows = bundle.annual_comparison.filter(row => row.year >= segment.period_start && row.year <= segment.period_end);
      const delta = rows.reduce((sum, row) => sum + (row.hachioji[hypothesis.metric] - row.tokyo[hypothesis.metric]), 0) / rows.length;
      assertClose(id === "H2" ? -delta : delta, segment.delta, `${id}/${segment.period_start} interval difference`);
    }
  }

  // Cases check
  assert(bundle.hourly_cases.length === 3, "expected 3 hourly cases");
  assert(new Set(bundle.hourly_cases.map(item => item.id)).size === 3, "duplicate case IDs");
  for (const c of bundle.hourly_cases) {
    assert(c.series.length === 30, `${c.id} series must have 30 points`);
    assert(c.series[0].hour === 1 && c.series.at(-1).hour === 6, `${c.id} time window`);
    for (const [index, pt] of c.series.entries()) {
      const timestamp = Date.parse(pt.datetime);
      assert(Number.isFinite(timestamp), "invalid timestamp");
      assert(pt.datetime === `${pt.date}T${String(pt.hour).padStart(2, "0")}:00:00+09:00`, "date/hour mismatch");
      assert(timestamp === Date.parse(c.series[0].datetime) + index * 3_600_000, "hourly times must be unique and consecutive");
      for (const station of ["hachioji", "tokyo"]) {
        assert(Number.isFinite(pt[station].temp), `${c.id}/${station} invalid temperature`);
        assert(pt[station].quality === 8, `${c.id}/${station} quality must be 8`);
        assert(pt[station].temp >= 20 && pt[station].temp <= 40, "temperature exceeds shared chart range");
      }
      assertClose(pt.delta, pt.hachioji.temp - pt.tokyo.temp, "paired temperature difference");
      assert(Math.abs(pt.delta) <= 6, "difference exceeds shared chart range");
    }
  }

  // Cooling rates check
  assert(bundle.cooling_rates.length === 3, "expected 3 cooling rates");
  assert(new Set(bundle.cooling_rates.map(item => item.case_id)).size === 3, "duplicate cooling IDs");
  for (const cr of bundle.cooling_rates) {
    const item = bundle.hourly_cases.find(item => item.id === cr.case_id);
    assert(item, "unknown cooling case");
    const start = item.series.find(point => point.date === item.series[0].date && point.hour === 18);
    const end = item.series.find(point => point.date !== item.series[0].date && point.hour === 5);
    assert(start && end, "missing cooling endpoints");
    const hours = (Date.parse(end.datetime) - Date.parse(start.datetime)) / 3_600_000;
    assert(hours === 11, "cooling interval must be 11 hours");
    for (const station of ["hachioji", "tokyo"]) {
      const drop = Math.round((start[station].temp - end[station].temp) * 10) / 10;
      assertClose(cr.temp_18h[station], start[station].temp, "18h endpoint");
      assertClose(cr.temp_05h[station], end[station].temp, "next 5h endpoint");
      assertClose(cr.cooling_amount[station], drop, "cooling amount");
      assertClose(cr.hourly_cooling_rate[station], Math.round(drop / hours * 100) / 100, "mean cooling rate");
      assert(drop >= 0 && drop <= 10, "cooling exceeds shared chart range");
    }
  }

  console.log("PASS: hachioji-heat integrity, 144 station-years, 16 averages, 8 intervals, 90 timestamp pairs and 6 cooling calculations.");
}

validate().catch((err) => {
  console.error("FAIL: hachioji-heat bundle validation error:", err.message);
  process.exit(1);
});
