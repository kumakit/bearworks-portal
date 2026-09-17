import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "app", "(monetized)", "labs", "takao-gear", "data");

const expected = {
  lockSchemaVersion: "1.0.0",
  bundleFile: "takao-gear-2026-09-17.r1.json",
  bundleVersion: "2026-09-17.r1",
  bundleSchemaVersion: "1.0.0",
  bundleByteSize: 15773,
  bundleSha256: "4b4b0d866d91a5fb7a2343b728f358bc5d9dbba22934364c7b3470c01cedd1a3",
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

  // Monthly comparison check (1..12 months)
  assert(bundle.monthly_comparison.length === 12, `expected 12 months, got ${bundle.monthly_comparison.length}`);
  for (let i = 0; i < 12; i++) {
    const row = bundle.monthly_comparison[i];
    assert(row.month === i + 1, `month mismatch at index ${i}`);
    // 山頂昼体感温度は麓昼気温より低いはず（ギャップがマイナス）
    assert(row.gap.apparent_gap < 0, `month ${row.month} apparent_gap must be negative (got ${row.gap.apparent_gap})`);
    assert(row.gap.temp_gap < 0, `month ${row.month} temp_gap must be negative (got ${row.gap.temp_gap})`);
  }

  // Routes check
  assert(bundle.routes.length === 4, `expected 4 routes, got ${bundle.routes.length}`);
  const routeIds = bundle.routes.map((r) => r.id).sort();
  assert(JSON.stringify(routeIds) === '["route-1","route-6","route-inari","route-jinba"]', "route IDs mismatch");

  // Layering presets check
  const presetKeys = Object.keys(bundle.layering_presets).sort();
  assert(JSON.stringify(presetKeys) === '["cold","freezing","mild","warm"]', "layering preset keys mismatch");

  // Gear days summary check
  const summary = bundle.gear_days_summary;
  assert(summary.total_days === 366, "total days must be 366 (leap year)");
  assert(summary.monthly_gear_days.length === 12, "expected 12 monthly gear day entries");

  // Sum check
  const sumWarm = summary.monthly_gear_days.reduce((s, m) => s + m.warm_clothes_days, 0);
  assert(sumWarm === summary.warm_clothes_required_days, `warm_clothes days sum mismatch: ${sumWarm} !== ${summary.warm_clothes_required_days}`);

  const sumRain = summary.monthly_gear_days.reduce((s, m) => s + m.rainwear_days, 0);
  assert(sumRain === summary.rainwear_required_days, `rainwear days sum mismatch: ${sumRain} !== ${summary.rainwear_required_days}`);

  const sumCrampons = summary.monthly_gear_days.reduce((s, m) => s + m.crampons_days, 0);
  assert(sumCrampons === summary.crampons_caution_days, `crampons days sum mismatch: ${sumCrampons} !== ${summary.crampons_caution_days}`);

  console.log("PASS: takao-gear bundle validated successfully.");
}

validate().catch((err) => {
  console.error("FAIL: takao-gear bundle validation error:", err.message);
  process.exit(1);
});
