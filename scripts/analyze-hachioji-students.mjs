import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const inputUrl = new URL("../public/data/hachioji-students/student-data.json", import.meta.url);
const outputUrl = new URL("../public/data/hachioji-students/analysis.json", import.meta.url);

const data = JSON.parse(readFileSync(inputUrl, "utf8"));
const rows = data.trend.rows;
const moveYears = new Set(data.moves.map(({ date }) => Number(date.slice(0, 4))));

const round = (v, digits = 1) => Number(v.toFixed(digits));

// S1: Indexation (2006 = 100) and CAGR
const first = rows[0];
const last = rows.at(-1);
const yearsSpan = last.year - first.year;
const indexSeries = rows.map(({ year, students }) => ({
  year,
  students,
  index2006: round((students / first.students) * 100, 1),
}));
const peakRow = indexSeries.reduce((best, r) => (r.students > best.students ? r : best), indexSeries[0]);
const totalDiff = last.students - first.students;
const totalChangePercent = round((totalDiff / first.students) * 100, 1);
const cagrPercent = round((Math.pow(last.students / first.students, 1 / yearsSpan) - 1) * 100, 2);

// S2: YoY changes and Quartiles (linear interpolation)
const yoy = rows.slice(1).map((row, i) => {
  const prev = rows[i];
  const diff = row.students - prev.students;
  return {
    year: row.year,
    students: row.students,
    prevStudents: prev.students,
    diff,
    pct: round((diff / prev.students) * 100, 1),
    isMoveYear: moveYears.has(row.year),
  };
});

const sortedDiffs = yoy.map((d) => d.diff).sort((a, b) => a - b);
function quantile(sorted, p) {
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}
const q1 = quantile(sortedDiffs, 0.25);
const median = quantile(sortedDiffs, 0.5);
const q3 = quantile(sortedDiffs, 0.75);
const iqr = q3 - q1;

// S3: Ordinary Least Squares linear regression (descriptive slopes only)
function ols(points) {
  const count = points.length;
  const mx = points.reduce((s, p) => s + p.year, 0) / count;
  const my = points.reduce((s, p) => s + p.students, 0) / count;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.year - mx) * (p.students - my);
    den += (p.year - mx) ** 2;
  }
  const slope = num / den;
  const intercept = my - slope * mx;
  return {
    startYear: points[0].year,
    endYear: points.at(-1).year,
    slope: round(slope, 1),
    slopeExact: slope,
    intercept,
    fitted: points.map(({ year }) => ({
      year,
      fitted: Math.round(slope * year + intercept),
    })),
  };
}

const period1 = ols(rows.filter((r) => r.year <= 2014));
const period2 = ols(rows.filter((r) => r.year >= 2015));
const fullPeriod = ols(rows);

// S4: Wilson 95% confidence interval for survey proportions
const z = 1.959963984540054;
function wilsonCI(percent, n) {
  const p = percent / 100;
  const den = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / den;
  return {
    percent,
    responses: n,
    approxCount: Math.round((n * percent) / 100),
    ciLow: round((center - half) * 100, 1),
    ciHigh: round((center + half) * 100, 1),
    halfWidth: round(half * 100, 1),
  };
}

const stable2017to2022 = yoy.filter((d) => d.year >= 2017 && d.year <= 2022).map((d) => d.diff);

const analysis = {
  generatedFrom: "public/data/hachioji-students/student-data.json",
  reviewedOn: data.reviewedOn,
  indexSummary: {
    baseYear: first.year,
    baseStudents: first.students,
    latestYear: last.year,
    latestStudents: last.students,
    latestIndex2006: indexSeries.at(-1).index2006,
    peakYear: peakRow.year,
    peakStudents: peakRow.students,
    peakIndex2006: peakRow.index2006,
    totalDiff,
    totalChangePercent,
    cagrPercent,
    series: indexSeries,
  },
  yoySummary: {
    q1,
    median,
    q3,
    iqr,
    outsideLowerQ1Years: yoy.filter((d) => d.diff < q1).map((d) => d.year),
    stable2017to2022Range: {
      minDiff: Math.min(...stable2017to2022),
      maxDiff: Math.max(...stable2017to2022),
    },
    rows: yoy,
  },
  regressionSummary: {
    note: "過去の推移を整理するための説明用直線であり、将来の予測には使いません。",
    period1,
    period2,
    fullPeriod,
  },
  surveySummary: {
    note: "無作為抽出と仮定した場合の Wilson 95％信頼区間。Web回答のため学生全体へ一般化しません。",
    responses: data.survey.responses,
    resident: wilsonCI(data.survey.residentPercent, data.survey.responses),
    intendsToLive: wilsonCI(data.survey.intendsToLivePercent, data.survey.responses),
  },
  perCapitaSummary: {
    status: "omitted",
    reason: "市内の大学等学生数（年度別・2006～2023年）と住民基本台帳の市総人口（各年10月1日・2013年以降など）で期間と基準日が揃わないため見送り。",
  },
};

assert.equal(analysis.indexSummary.latestIndex2006, 86.2);
assert.equal(analysis.indexSummary.cagrPercent, -0.87);
assert.deepEqual([q1, median, q3, iqr], [-1707, -646, 570, 2277]);

writeFileSync(outputUrl, JSON.stringify(analysis, null, 2) + "\n", "utf8");
console.log("Generated public/data/hachioji-students/analysis.json");
