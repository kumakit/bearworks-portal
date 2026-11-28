import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const url = new URL("../public/data/hachioji-students/student-data.json", import.meta.url);
const { trend, schoolScope, referenceCounts, survey, moves } = JSON.parse(readFileSync(url, "utf8"));

// 市公表の折れ線の18点。欠年や並べ替え、参考値の混入も検出する。
const expected = [104130, 104511, 106386, 104679, 107186, 110084, 105229, 103725, 102465,
  99259, 95653, 95625, 95090, 94444, 93637, 94253, 94823, 89763];
assert.deepEqual(trend.rows, expected.map((students, i) => ({ year: 2006 + i, students })));
assert.equal(trend.scope, "市内の大学等");
assert.equal(trend.unit, "人");
assert.equal(trend.printedPage, 19);
assert.match(trend.sourceSha256, /^[a-f0-9]{64}$/);
assert.equal(schoolScope.year, trend.rows.at(-1).year);
assert.deepEqual([schoolScope.citySchools, schoolScope.consortiumSchools], [21, 25]);
assert.deepEqual([schoolScope.cityApproxStudents, schoolScope.consortiumApproxStudents], [90000, 100000]);
assert.deepEqual(referenceCounts.map(({ date, schools, students }) => [date, schools, students]), [
  ["2024-05-01", 21, 90768],
  ["2025-05-01", 21, 91540],
]);
assert.deepEqual([survey.start, survey.end, survey.responses, survey.residentPercent, survey.intendsToLivePercent],
  ["2023-05-01", "2023-06-30", 682, 32.1, 9.7]);
assert.deepEqual(moves.map(({ date }) => date), ["2015-04", "2016-04", "2023-04"]);

const latest = expected.at(-1);
const percent = (base) => ((base - latest) / base * 100).toFixed(1);
assert.deepEqual([expected[0] - latest, percent(expected[0])], [14367, "13.8"]);
assert.deepEqual([expected.at(-2) - latest, percent(expected.at(-2))], [5060, "5.3"]);

// 追加分析（analysis.json）の独立再計算チェック
const analysis = JSON.parse(readFileSync(new URL("../public/data/hachioji-students/analysis.json", import.meta.url), "utf8"));
const round = (v, digits = 1) => Number(v.toFixed(digits));
const baseStudents = expected[0];
assert.equal(analysis.indexSummary.latestIndex2006, round((latest / baseStudents) * 100, 1));
assert.equal(analysis.indexSummary.cagrPercent, round((Math.pow(latest / baseStudents, 1 / (expected.length - 1)) - 1) * 100, 2));
assert.equal(analysis.indexSummary.series.length, expected.length);
expected.forEach((students, idx) => {
  assert.equal(analysis.indexSummary.series[idx].students, students);
  assert.equal(analysis.indexSummary.series[idx].index2006, round((students / baseStudents) * 100, 1));
});

const yoyDiffs = expected.slice(1).map((v, i) => v - expected[i]);
assert.deepEqual(analysis.yoySummary.rows.map((r) => r.diff), yoyDiffs);
const sorted = [...yoyDiffs].sort((a, b) => a - b);
const quantile = (p) => {
  const pos = (sorted.length - 1) * p;
  const b = Math.floor(pos);
  return sorted[b] + (sorted[b + 1] !== undefined ? (pos - b) * (sorted[b + 1] - sorted[b]) : 0);
};
assert.equal(analysis.yoySummary.q1, quantile(0.25));
assert.equal(analysis.yoySummary.median, quantile(0.5));
assert.equal(analysis.yoySummary.q3, quantile(0.75));
assert.equal(analysis.yoySummary.iqr, quantile(0.75) - quantile(0.25));

const olsSlope = (pts) => {
  const mx = pts.reduce((s, p) => s + p.year, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.students, 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p.year - mx) * (p.students - my), 0);
  const den = pts.reduce((s, p) => s + (p.year - mx) ** 2, 0);
  return round(num / den, 1);
};
assert.equal(analysis.regressionSummary.period1.slope, olsSlope(trend.rows.filter((r) => r.year <= 2014)));
assert.equal(analysis.regressionSummary.period2.slope, olsSlope(trend.rows.filter((r) => r.year >= 2015)));
assert.equal(analysis.regressionSummary.fullPeriod.slope, olsSlope(trend.rows));

const wilson = (pct, n) => {
  const p = pct / 100;
  const z = 1.959963984540054;
  const den = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / den;
  const h = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / den;
  return [round((c - h) * 100, 1), round((c + h) * 100, 1)];
};
assert.deepEqual([analysis.surveySummary.resident.ciLow, analysis.surveySummary.resident.ciHigh], wilson(32.1, 682));
assert.deepEqual([analysis.surveySummary.intendsToLive.ciLow, analysis.surveySummary.intendsToLive.ciHigh], wilson(9.7, 682));
assert.equal(analysis.perCapitaSummary.status, "omitted");

// キャンパス位置データ（campus-locations.json）の整合チェック
const campusData = JSON.parse(readFileSync(new URL("../public/data/hachioji-students/campus-locations.json", import.meta.url), "utf8"));
assert.equal(campusData.schools.length, 25);
assert.equal(campusData.markers.reduce((s, m) => s + m.schools.length, 0), 25);
assert.equal(campusData.relocations.length, 3);
for (const school of campusData.schools) {
  assert(school.lon > 139.0 && school.lon < 139.9, `Invalid lon: ${school.name}`);
  assert(school.lat > 35.4 && school.lat < 35.9, `Invalid lat: ${school.name}`);
}
for (const rel of campusData.relocations) {
  assert.match(rel.source, /^https:\/\//);
  assert(rel.toLon > 139.0 && rel.toLat > 35.4);
}

console.log("八王子の学生数データの検証に合格しました（年次値・集計範囲・統計分析・キャンパス位置）。");
