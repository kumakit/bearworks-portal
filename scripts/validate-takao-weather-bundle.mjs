import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "app", "(monetized)", "labs", "takao-weather-shift", "data");
const bundlePath = join(dataDir, "takao-weather-shift-2026-09-17.r1.json");
const lockPath = join(dataDir, "takao-weather-shift-2026-09-17.r1.lock.json");

async function validate() {
  const [bundleRaw, lockRaw] = await Promise.all([
    readFile(bundlePath, "utf8"),
    readFile(lockPath, "utf8"),
  ]);

  const lock = JSON.parse(lockRaw);
  const bundle = JSON.parse(bundleRaw);

  const actualByteSize = Buffer.byteLength(bundleRaw, "utf8");
  const actualSha256 = createHash("sha256").update(bundleRaw, "utf8").digest("hex");

  assert.equal(actualByteSize, lock.byte_size, "Bundle byte size must match lock file");
  assert.equal(actualSha256, lock.sha256, "Bundle SHA-256 must match lock file");

  // Metadata check
  assert(bundle.metadata, "Bundle must have metadata");
  assert.equal(bundle.metadata.dataset_version, "2026-09-17.r1");
  assert.equal(bundle.metadata.year, 2024);

  // Annual summary check
  assert(bundle.annual_summary, "Bundle must have annual_summary");
  assert.equal(bundle.annual_summary.total_days, 366, "2024 is leap year, total days must be 366");
  assert.equal(
    bundle.annual_summary.apparent_sunny_gas_days_pct,
    Math.round(bundle.annual_summary.apparent_sunny_gas_days / bundle.annual_summary.total_days * 1000) / 10,
    "Annual percentage must use all calendar days as its denominator",
  );

  // Monthly summary check
  assert.equal(bundle.monthly_summary.length, 12, "Monthly summary must contain 12 months");
  const sumMonthlyDays = bundle.monthly_summary.reduce((acc, m) => acc + m.total_days, 0);
  assert.equal(sumMonthlyDays, 366, "Sum of monthly days must equal 366");

  const sumApparentGas = bundle.monthly_summary.reduce((acc, m) => acc + m.apparent_sunny_gas_days, 0);
  assert.equal(sumApparentGas, bundle.annual_summary.apparent_sunny_gas_days, "Monthly apparent gas days sum must match annual");

  for (const m of bundle.monthly_summary) {
    assert(m.month >= 1 && m.month <= 12);
    assert(Number.isFinite(m.avg_summit_humidity) && Number.isFinite(m.avg_base_humidity));
    assert.equal(m.humidity_gap, Math.round((m.avg_summit_humidity - m.avg_base_humidity) * 10) / 10);
  }

  // Summer hourly matrix check
  assert.equal(bundle.summer_hourly_matrix.length, 5, "Summer hourly matrix must have 5 hour slots");
  for (const slot of bundle.summer_hourly_matrix) {
    assert([10, 12, 14, 16, 18].includes(slot.hour));
    assert(slot.rain_probability >= 0 && slot.rain_probability <= 100);
    assert(slot.gas_probability >= 0 && slot.gas_probability <= 100);
  }

  // Mechanisms check
  assert(Array.isArray(bundle.mechanisms) && bundle.mechanisms.length >= 4, "Must have at least 4 mechanism steps");

  console.log("PASS: archived takao-weather-shift r1 bundle integrity and internal arithmetic only.");
  console.log("- Original hourly input is unavailable; this does not validate the weather claims or data licence.");
  console.log(`- Byte size: ${actualByteSize}`);
  console.log(`- SHA-256: ${actualSha256}`);
}

validate().catch(err => {
  console.error("FAIL: Validation failed:", err);
  process.exit(1);
});
