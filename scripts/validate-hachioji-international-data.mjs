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

// 追加分析（analysis.json）の独立再計算チェック
const analysis = JSON.parse(readFileSync(new URL("../public/data/hachioji-international/analysis.json", import.meta.url), "utf8"));
const round = (v, digits = 1) => Number(v.toFixed(digits));
const firstRow = annual[0];
const lastRow = annual.at(-1);
assert.equal(analysis.decomposition.japaneseDiff + analysis.decomposition.foreignDiff, analysis.decomposition.totalDiff);
assert.equal(analysis.decomposition.totalDiff, lastRow.total - firstRow.total);
assert.equal(analysis.decomposition.foreignDiff, lastRow.foreign - firstRow.foreign);
assert.equal(analysis.decomposition.japaneseDiff, lastRow.japanese - firstRow.japanese);
assert.equal(analysis.decomposition.offsetRatioPercent, round((analysis.decomposition.foreignDiff / Math.abs(analysis.decomposition.japaneseDiff)) * 100, 1));

assert.equal(analysis.indexSummary.series.length, annual.length);
assert.equal(analysis.indexSummary.foreignCagrPercent, round((Math.pow(lastRow.foreign / firstRow.foreign, 1 / (annual.length - 1)) - 1) * 100, 2));
assert.equal(analysis.indexSummary.series.at(-1).foreignIndex, round((lastRow.foreign / firstRow.foreign) * 100, 1));

const yoyDiffs = annual.slice(1).map((r, i) => r.foreign - annual[i].foreign);
assert.deepEqual(analysis.yoySummary.rows.map((r) => r.foreignDiff), yoyDiffs);
assert.equal(analysis.yoySummary.periods.pre2020.avgForeignDiff, Math.round(yoyDiffs.slice(0, 6).reduce((a, b) => a + b, 0) / 6));
assert.equal(analysis.yoySummary.periods.stagnation.avgForeignDiff, Math.round(yoyDiffs.slice(6, 8).reduce((a, b) => a + b, 0) / 2));
assert.equal(analysis.yoySummary.periods.post2022.avgForeignDiff, Math.round(yoyDiffs.slice(8).reduce((a, b) => a + b, 0) / 5));

assert.equal(analysis.nationalitySummary.categories.reduce((s, c) => s + c.diff, 0), analysis.decomposition.foreignDiff);
for (const row of analysis.nationalitySummary.annualShares) {
  const countSum = Object.values(row.counts).reduce((a, b) => a + b, 0);
  assert.equal(countSum, row.foreign);
  const shareSum = Object.values(row.shares).reduce((a, b) => a + b, 0);
  assert(Math.abs(shareSum - 100) < 0.06, `Share sum off 100%: ${row.year} = ${shareSum}`);
}

const cityRates = comparison.cities.map((c) => round((c.foreign / c.total) * 100, 2)).sort((a, b) => a - b);
assert.equal(analysis.nearbySummary.medianShare, round((cityRates[2] + cityRates[3]) / 2, 2));

// 町丁別地図データ（town-map.json）の整合・非表示徹底チェック
const townMap = JSON.parse(readFileSync(new URL("../public/data/hachioji-international/town-map.json", import.meta.url), "utf8"));
assert.equal(townMap.towns.length, 199);
assert.equal(townMap.counts.totalTowns, 199);
assert.equal(townMap.counts.comparableTowns + townMap.counts.suppressedTowns + townMap.counts.boundaryChangedTowns, 199);
assert.equal(townMap.counts.boundaryChangedTowns, 4);
for (const t of townMap.towns) {
  assert(t.path && t.path.startsWith("M"), `Missing SVG path: ${t.name}`);
  if (t.status === "comparable") {
    assert(t.foreign2024 >= 10 && t.foreign2026 >= 10 && t.total2024 >= 100 && t.total2026 >= 100, `Comparable threshold violated: ${t.name}`);
    assert.equal(t.foreignDiff, t.foreign2026 - t.foreign2024);
  } else {
    for (const k of ["foreign2024", "total2024", "share2024", "foreign2026", "total2026", "share2026", "foreignDiff", "sharePointDiff"]) {
      assert.equal(t[k], null, `Hidden town leaks ${k}: ${t.name}`);
    }
  }
}
assert.equal(townMap.top10Increase.length, 10);
assert.equal(townMap.bottom10Change.length, 10);
assert(townMap.top10Increase.every((t) => t.status === "comparable"));
assert(townMap.bottom10Change.every((t) => t.status === "comparable"));

console.log("第6弾のデータ検証に合格しました（年次値、統計分析、同日6市、在留資格、町丁別地図）。");
