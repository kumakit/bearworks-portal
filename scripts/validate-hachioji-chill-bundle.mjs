import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "app", "(monetized)", "labs", "hachioji-chill", "data");

const expected = {
  lockSchemaVersion: "1.0.0",
  bundleFile: "hachioji-chill-2026-09-18.r1.json",
  bundleVersion: "2026-09-18.r1",
  bundleSchemaVersion: "1.0.0",
  bundleByteSize: 313650,
  bundleSha256: "c6208e688ad68c9c856e26a245f6a5f425c7b45fdfb85e5c80673578a3b54580",
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
  assert(JSON.stringify(stationKeys) === '["hachioji","tokyo"]', "station keys mismatch");

  // Hourly profile check (24 hours)
  assert(bundle.hourly_profile.length === 24, `expected 24 hours in profile, got ${bundle.hourly_profile.length}`);
  for (let h = 0; h < 24; h++) {
    assert(bundle.hourly_profile[h].hour === h, `hourly profile hour mismatch at index ${h}`);
    assert(bundle.hourly_profile[h].sample_size > 1000, `hourly profile sample size too low: ${bundle.hourly_profile[h].sample_size}`);
  }

  // Calendar days check
  assert(bundle.calendar_days.length === 1078, `expected 1078 calendar days, got ${bundle.calendar_days.length}`);
  const sampleDay = bundle.calendar_days[0];
  assert(sampleDay.date && typeof sampleDay.delta_7am === "number", "calendar day invalid format");

  // Re-verify summary statistics from raw calendar days
  const deltas = bundle.calendar_days.map(d => d.delta_7am).sort((a, b) => a - b);
  const median7 = deltas[Math.floor(deltas.length / 2)];
  assertClose(median7, bundle.summary.morning_7am.median_gap, "median 7am gap check");

  const countLeMinus3 = deltas.filter(v => v <= -3.0).length;
  const pctLeMinus3 = Math.round((countLeMinus3 / deltas.length) * 1000) / 10;
  assertClose(pctLeMinus3, bundle.summary.morning_7am.pct_gap_le_minus3, "pct <= -3C check");

  const countLeMinus5 = deltas.filter(v => v <= -5.0).length;
  const pctLeMinus5 = Math.round((countLeMinus5 / deltas.length) * 1000) / 10;
  assertClose(pctLeMinus5, bundle.summary.morning_7am.pct_gap_le_minus5, "pct <= -5C check");

  const countColder = deltas.filter(v => v < 0).length;
  const pctColder = Math.round((countColder / deltas.length) * 1000) / 10;
  assertClose(pctColder, bundle.summary.morning_7am.pct_hachioji_colder, "pct colder check");

  // Verify diurnal range values
  assert(bundle.diurnal_range_comparison.hachioji.median === 11.5, "hachioji diurnal range median mismatch");
  assert(bundle.diurnal_range_comparison.tokyo.median === 7.4, "tokyo diurnal range median mismatch");

  // Verify representative cases
  assert(bundle.representative_cases.length === 3, "representative cases count mismatch");

  console.log(`PASS: hachioji-chill bundle validated successfully.`);
  console.log(`- Byte size: ${bundleBytes.byteLength}`);
  console.log(`- SHA-256: ${actualSha256}`);
  console.log(`- Total days analyzed: ${bundle.summary.period.total_days_analyzed}`);
  console.log(`- 7am median gap: ${bundle.summary.morning_7am.median_gap}℃`);
  console.log(`- <= -3℃ pct: ${bundle.summary.morning_7am.pct_gap_le_minus3}%`);
  console.log(`- <= -5℃ pct: ${bundle.summary.morning_7am.pct_gap_le_minus5}%`);
}

validate().catch((err) => {
  console.error("FAIL: hachioji-chill validation error:", err);
  process.exit(1);
});
