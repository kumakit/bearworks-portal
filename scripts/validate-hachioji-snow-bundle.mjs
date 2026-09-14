import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir = new URL('../app/(monetized)/labs/hachioji-snow/data/', import.meta.url);
const lock = JSON.parse(fs.readFileSync(new URL('lock.json', dir)));
assert.equal(lock.file, 'hachioji-snow-2026-09-14.r1.json');
const raw = fs.readFileSync(new URL(lock.file, dir));
assert.equal(raw.length, lock.bytes);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), lock.sha256);
const b = JSON.parse(raw);
assert.equal(b.schema_version, '1.0.0');
assert.equal(b.version, lock.version);
assert.equal(b.sources.length, 35);
assert.equal(b.primary.winters.length, 35);
assert.equal(b.cases.length, 4);
assert.equal(b.overlap_records_verified, 3264);
for (const s of b.primary.segments) {
  assert.equal(s.points.length, s.wet_pairs);
  assert.equal(s.events.length, s.eligible_events);
  assert.equal(s.points.filter(p => p[3] < 0).length / s.points.length, s.lower_temperature_fraction);
  assert.equal(s.events.filter(e => e.mean_delta_c < 0).length / s.events.length, s.negative_event_fraction);
  assert(s.points.every(p => p.length === 4 && p.slice(1).every(Number.isFinite) && Math.abs(p[1] - p[2] - p[3]) < 1e-9));
  const expected = s.winters.length < 5 || s.eligible_events < 30 ? 'insufficient_data' : s.lower_temperature_fraction >= .6 && s.negative_event_fraction >= .6 ? 'supported' : 'not_supported';
  assert.equal(s.status, expected);
}
assert.equal(b.humidity.points.length, b.humidity.tokyo_rain_paired_hours);
assert(b.humidity.points.every(p => p.weather_t === 10 && p.h !== null && p.rh_h !== null));
for (const c of b.cases) {
  assert.equal(c.series.length * 12, c.source.observation_count);
  assert(c.series.every(r => r.rh_h === null));
}
console.log(`Validated snow bundle (${raw.length} bytes, ${lock.sha256})`);
