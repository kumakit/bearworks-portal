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
  assert(bundle.annual_summary.gas_days > 200, "Gas days should be substantial");
  assert(bundle.annual_summary.apparent_sunny_gas_days > 0, "Apparent sunny gas days must be > 0");

  // Monthly summary check
  assert.equal(bundle.monthly_summary.length, 12, "Monthly summary must contain 12 months");
  const sumMonthlyDays = bundle.monthly_summary.reduce((acc, m) => acc + m.total_days, 0);
  assert.equal(sumMonthlyDays, 366, "Sum of monthly days must equal 366");

  const sumApparentGas = bundle.monthly_summary.reduce((acc, m) => acc + m.apparent_sunny_gas_days, 0);
  assert.equal(sumApparentGas, bundle.annual_summary.apparent_sunny_gas_days, "Monthly apparent gas days sum must match annual");

  for (const m of bundle.monthly_summary) {
    assert(m.month >= 1 && m.month <= 12);
    assert(m.avg_summit_humidity > m.avg_base_humidity, `Summit humidity (${m.avg_summit_humidity}) should be higher than base (${m.avg_base_humidity}) in month ${m.month}`);
    assert(m.humidity_gap > 0, `Humidity gap should be positive in month ${m.month}`);
  }

  // Summer hourly matrix check
  assert.equal(bundle.summer_hourly_matrix.length, 5, "Summer hourly matrix must have 5 hour slots");
  for (const slot of bundle.summer_hourly_matrix) {
    assert([10, 12, 14, 16, 18].includes(slot.hour));
    assert(slot.rain_probability >= 0 && slot.rain_probability <= 100);
    assert(slot.gas_probability >= 0 && slot.gas_probability <= 100);
  }

  // Afternoon peak rain check: 14:00 or 16:00 rain prob should be higher than 10:00 morning
  const h10 = bundle.summer_hourly_matrix.find(s => s.hour === 10);
  const h16 = bundle.summer_hourly_matrix.find(s => s.hour === 16);
  assert(h16.rain_probability > h10.rain_probability, "Afternoon rain probability at 16:00 should exceed 10:00 morning");

  // Mechanisms check
  assert(Array.isArray(bundle.mechanisms) && bundle.mechanisms.length >= 4, "Must have at least 4 mechanism steps");

  console.log("PASS: takao-weather-shift bundle validated successfully.");
  console.log(`- Byte size: ${actualByteSize}`);
  console.log(`- SHA-256: ${actualSha256}`);
  console.log(`- Annual gas days: ${bundle.annual_summary.gas_days} (${bundle.annual_summary.gas_days_pct}%)`);
  console.log(`- Apparent sunny gas days: ${bundle.annual_summary.apparent_sunny_gas_days} (${bundle.annual_summary.apparent_sunny_gas_days_pct}%)`);
}

validate().catch(err => {
  console.error("FAIL: Validation failed:", err);
  process.exit(1);
});
