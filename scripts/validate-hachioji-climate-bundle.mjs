import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "app", "(monetized)", "labs", "hachioji-climate", "data");
const expected = {
  lockSchemaVersion: "1.0.0",
  bundleFile: "hachioji-climate-2026-08-11.r1.json",
  bundleVersion: "2026-08-11.r1",
  bundleSchemaVersion: "1.0.0",
  bundleByteSize: 405549,
  bundleSha256: "8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd",
  appsRepository: "kumakit/bearworks-apps",
  appsProductionCommit: "6d543851a69833d01999975d85b20d94340c9fab",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertClose(actual, expectedValue, label) {
  assert(Math.abs(actual - expectedValue) < 1e-6, `${label}: expected ${expectedValue}, got ${actual}`);
}

const lock = JSON.parse(await readFile(join(dataDir, `${expected.bundleFile.replace(/\.json$/, "")}.lock.json`), "utf8"));
const bundleBytes = await readFile(join(dataDir, expected.bundleFile));
const bundle = JSON.parse(bundleBytes.toString("utf8"));
const actualSha256 = createHash("sha256").update(bundleBytes).digest("hex");

const lockFields = {
  lock_schema_version: expected.lockSchemaVersion,
  bundle_file: expected.bundleFile,
  bundle_version: expected.bundleVersion,
  bundle_schema_version: expected.bundleSchemaVersion,
  bundle_byte_size: expected.bundleByteSize,
  bundle_sha256: expected.bundleSha256,
  apps_repository: expected.appsRepository,
  apps_production_commit: expected.appsProductionCommit,
};
for (const [field, value] of Object.entries(lockFields)) {
  assert(lock[field] === value, `lock ${field} mismatch`);
}

assert(bundleBytes.byteLength === expected.bundleByteSize, "bundle byte size mismatch");
assert(actualSha256 === expected.bundleSha256, "bundle SHA-256 mismatch");
assert(bundle.schema_version === expected.bundleSchemaVersion, "bundle schema version mismatch");
assert(bundle.bundle_version === expected.bundleVersion, "bundle version mismatch");
assert(bundle.analysis_scope.start_date === "1990-01-01", "analysis start date mismatch");
assert(bundle.analysis_scope.end_date === "2025-12-31", "analysis end date mismatch");
assert(bundle.analysis_scope.complete_winter_seasons.first === 1991, "first complete winter mismatch");
assert(bundle.analysis_scope.complete_winter_seasons.last === 2025, "last complete winter mismatch");
assert(bundle.quality_contract.publication_coverage_threshold === 0.9, "coverage threshold mismatch");
assert(JSON.stringify(bundle.quality_contract.aggregatable_codes) === "[5,8]", "quality codes mismatch");

const stationKeys = bundle.stations.map((station) => station.station_key).sort();
assert(JSON.stringify(stationKeys) === '["fuchu","hachioji","ome","tokyo"]', "station set mismatch");

const hypothesisIds = bundle.hypotheses.map((hypothesis) => hypothesis.hypothesis_id);
assert(JSON.stringify(hypothesisIds) === '["H1","H2","H3","H4","H5"]', "hypothesis set/order mismatch");
for (const hypothesis of bundle.hypotheses) {
  assert(hypothesis.outcome === "supported", `${hypothesis.hypothesis_id} outcome mismatch`);
  assert(hypothesis.permission === "caution", `${hypothesis.hypothesis_id} permission mismatch`);
  assert(hypothesis.segments.length > 0, `${hypothesis.hypothesis_id} segments missing`);
}

const expectedDeltaRanges = {
  H1: [3, 5.8],
  H2: [22, 36.6],
  H3: [49.272727, 61.6],
  H4: [3.909091, 10],
  H5: [1.513636, 4.3],
};
for (const hypothesis of bundle.hypotheses) {
  const deltas = hypothesis.segments.map((segment) => segment.delta);
  assertClose(Math.min(...deltas), expectedDeltaRanges[hypothesis.hypothesis_id][0], `${hypothesis.hypothesis_id} min delta`);
  assertClose(Math.max(...deltas), expectedDeltaRanges[hypothesis.hypothesis_id][1], `${hypothesis.hypothesis_id} max delta`);
}

const expectedRecent = {
  hachioji: [23.666667, 72.833333, 11.666667, 59.5, 10.958333],
  fuchu: [21.333333, 72, 25, 44.5, 10],
  ome: [24.666667, 71.333333, 8.666667, 62, 11.25],
  tokyo: [16.833333, 72.166667, 38.666667, 8.833333, 8.741667],
};
for (const [stationKey, values] of Object.entries(expectedRecent)) {
  const rows = bundle.aggregates.annual.filter(
    (row) => row.station_key === stationKey && row.period_id >= 2020 && row.period_id <= 2025,
  );
  assert(rows.length === 6, `${stationKey} must have six annual rows for 2020-2025`);
  const metrics = ["heatstroke_days", "midsummer_days", "min_temp_ge25_days", "winter_days", "median_daily_range_c"];
  metrics.forEach((metric, index) => {
    const average = rows.reduce((sum, row) => sum + row.metrics[metric], 0) / rows.length;
    assertClose(average, values[index], `${stationKey} ${metric}`);
  });
}

const qualityWarning = bundle.warnings.find((warning) => warning.code === "semi_normal_values_included");
assert(qualityWarning, "quality warning missing");
assert(
  JSON.stringify(qualityWarning.counts_by_station) === '{"fuchu":60,"hachioji":56,"ome":50,"tokyo":6}',
  "quality warning counts mismatch",
);

console.log(`Validated ${expected.bundleFile} (${bundleBytes.byteLength} bytes, sha256 ${actualSha256})`);
