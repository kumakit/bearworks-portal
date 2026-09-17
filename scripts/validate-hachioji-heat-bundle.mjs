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

  // Recalculate 2020-2025 averages and verify against summary
  const recent6 = bundle.annual_comparison.filter((r) => r.year >= 2020 && r.year <= 2025);
  assert(recent6.length === 6, "must have 6 rows for 2020-2025");

  const calcAvg = (fn) => Math.round((recent6.reduce((sum, item) => sum + fn(item), 0) / recent6.length) * 10) / 10;
  assertClose(calcAvg((r) => r.hachioji.heatstroke_days), bundle.summary.recent_averages_2020_2025.heatstroke_days.hachioji, "hachioji heatstroke_days avg");
  assertClose(calcAvg((r) => r.tokyo.heatstroke_days), bundle.summary.recent_averages_2020_2025.heatstroke_days.tokyo, "tokyo heatstroke_days avg");
  assertClose(calcAvg((r) => r.hachioji.min_temp_ge25_days), bundle.summary.recent_averages_2020_2025.min_temp_ge25_days.hachioji, "hachioji min_temp_ge25_days avg");
  assertClose(calcAvg((r) => r.tokyo.min_temp_ge25_days), bundle.summary.recent_averages_2020_2025.min_temp_ge25_days.tokyo, "tokyo min_temp_ge25_days avg");

  // Cases check
  assert(bundle.hourly_cases.length === 3, "expected 3 hourly cases");
  for (const c of bundle.hourly_cases) {
    assert(c.series.length === 30, `${c.id} series must have 30 points`);
    for (const pt of c.series) {
      assert(typeof pt.hour === "number", "point hour must be number");
      assert(pt.hachioji.temp !== null, "point hachioji temp must not be null");
      assert(pt.tokyo.temp !== null, "point tokyo temp must not be null");
      assert(pt.hachioji.quality === 8, "point hachioji quality must be 8");
      assert(pt.tokyo.quality === 8, "point tokyo quality must be 8");
    }
  }

  // Cooling rates check
  assert(bundle.cooling_rates.length === 3, "expected 3 cooling rates");
  for (const cr of bundle.cooling_rates) {
    assert(cr.cooling_amount.hachioji > cr.cooling_amount.tokyo, `${cr.case_id}: hachioji cooling should exceed tokyo cooling`);
  }

  console.log("PASS: hachioji-heat bundle validated successfully.");
}

validate().catch((err) => {
  console.error("FAIL: hachioji-heat bundle validation error:", err.message);
  process.exit(1);
});
