import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const url = new URL("../public/data/hachioji-international/population.json", import.meta.url);
const { annual, comparison, categories, residence, retrievedOn } = JSON.parse(readFileSync(url, "utf8"));
const expectedForeign = [8997, 9422, 9928, 11059, 11954, 12737, 13120, 12881, 12898, 14059, 15125, 16495, 18535, 19961];
const expectedTotal = [563895, 562940, 562781, 563327, 563538, 562522, 562828, 561872, 562326, 562605, 560913, 559809, 559264, 559320];
assert.deepEqual(annual.map(({ date }) => date), expectedForeign.map((_, i) => (2013 + i) + "-10-01"));
assert.deepEqual(annual.map(({ foreign }) => foreign), expectedForeign);
assert.deepEqual(annual.map(({ total }) => total), expectedTotal);
assert.deepEqual(categories, ["中国", "フィリピン", "ベトナム", "ネパール", "ミャンマー", "この5区分以外"]);
assert.match(retrievedOn, /^\d{4}-\d{2}-\d{2}$/);
for (const row of annual) {
  assert.equal(row.code, "13201");
  assert.equal(row.japanese + row.foreign, row.total);
  assert(row.foreign > 0 && Number.isSafeInteger(row.japanese) && row.japanese >= 0);
  assert.equal(row.counts.length, categories.length);
  assert(row.counts.every((n) => Number.isSafeInteger(n) && n >= 0));
  assert.equal(row.counts.reduce((sum, n) => sum + n, 0), row.foreign);
  const year = row.date.slice(0, 4);
  assert.deepEqual(row.sources.map(({ url }) => url), [
    `https://www.toukei.metro.tokyo.lg.jp/juukim/${year}/jm${year.slice(2)}av0000_1.csv`,
    `https://www.toukei.metro.tokyo.lg.jp/gaikoku/${year}/ga${year.slice(2)}hv0100.csv`,
  ]);
  for (const { sha256 } of row.sources) assert.match(sha256, /^[a-f0-9]{64}$/);
}
assert.deepEqual(annual[0].counts, [3715, 1043, 198, 239, 27, 3775]);
assert.deepEqual(annual.at(-1).counts, [6400, 1633, 2232, 1614, 1077, 7005]);
assert.equal(comparison.date, annual.at(-1).date);
assert.deepEqual(comparison.cities.map(({ code, foreign, total, japanese }) => {
  assert.equal(total, japanese + foreign);
  return [code, foreign, total, (100 * foreign / total).toFixed(2)];
}), [
  ["13201", 19961, 559320, "3.57"], ["13209", 12137, 431417, "2.81"],
  ["13202", 6876, 188093, "3.66"], ["13212", 4616, 189493, "2.44"],
  ["13206", 6987, 263429, "2.65"], ["13205", 3824, 128157, "2.98"],
]);
assert.equal(residence.period, "2025年4月");
assert.deepEqual(residence.groups.map(({ percent }) => percent), [26, 25.6, 9]);
console.log("第6弾のデータ検証に合格しました（年次値、人口内訳、国籍・地域の残余、同日6市、在留資格）。");
