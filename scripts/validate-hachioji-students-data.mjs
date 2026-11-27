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

console.log("八王子の学生数データの検証に合格しました（年次値・集計範囲・基準日・割合・増減）。");
