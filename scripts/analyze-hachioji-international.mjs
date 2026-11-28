import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const inputUrl = new URL("../public/data/hachioji-international/population.json", import.meta.url);
const outputUrl = new URL("../public/data/hachioji-international/analysis.json", import.meta.url);

const data = JSON.parse(readFileSync(inputUrl, "utf8"));
const { annual, categories, comparison, retrievedOn } = data;
const round = (v, digits = 1) => Number(v.toFixed(digits));

const first = annual[0];
const last = annual.at(-1);
const yearsSpan = annual.length - 1;

// I1: Population decomposition (2013 -> 2026)
const totalDiff = last.total - first.total;
const japaneseDiff = last.japanese - first.japanese;
const foreignDiff = last.foreign - first.foreign;
assert.equal(japaneseDiff + foreignDiff, totalDiff);

const decomposition = {
  fromDate: first.date,
  toDate: last.date,
  totalFrom: first.total,
  totalTo: last.total,
  totalDiff,
  totalChangePercent: round((totalDiff / first.total) * 100, 2),
  japaneseFrom: first.japanese,
  japaneseTo: last.japanese,
  japaneseDiff,
  japaneseChangePercent: round((japaneseDiff / first.japanese) * 100, 2),
  foreignFrom: first.foreign,
  foreignTo: last.foreign,
  foreignDiff,
  foreignChangePercent: round((foreignDiff / first.foreign) * 100, 2),
  offsetRatioPercent: round((foreignDiff / Math.abs(japaneseDiff)) * 100, 1),
};

// I2: Indexation (2013 = 100) and CAGR
const annualSeries = annual.map((row) => ({
  year: Number(row.date.slice(0, 4)),
  date: row.date,
  foreign: row.foreign,
  japanese: row.japanese,
  total: row.total,
  foreignShare: round((row.foreign / row.total) * 100, 2),
  foreignIndex: round((row.foreign / first.foreign) * 100, 1),
  japaneseIndex: round((row.japanese / first.japanese) * 100, 1),
  totalIndex: round((row.total / first.total) * 100, 1),
}));

const indexSummary = {
  baseYear: Number(first.date.slice(0, 4)),
  latestYear: Number(last.date.slice(0, 4)),
  years: yearsSpan,
  foreignRatio: round(last.foreign / first.foreign, 2),
  foreignCagrPercent: round((Math.pow(last.foreign / first.foreign, 1 / yearsSpan) - 1) * 100, 2),
  japaneseCagrPercent: round((Math.pow(last.japanese / first.japanese, 1 / yearsSpan) - 1) * 100, 2),
  totalCagrPercent: round((Math.pow(last.total / first.total, 1 / yearsSpan) - 1) * 100, 2),
  series: annualSeries,
};

// I3: YoY diffs and three periods
const yoyRows = annual.slice(1).map((row, i) => {
  const prev = annual[i];
  const fDiff = row.foreign - prev.foreign;
  return {
    year: Number(row.date.slice(0, 4)),
    date: row.date,
    foreignDiff: fDiff,
    foreignYoYPct: round((fDiff / prev.foreign) * 100, 1),
    japaneseDiff: row.japanese - prev.japanese,
    totalDiff: row.total - prev.total,
  };
});

const preRows = yoyRows.filter((r) => r.year >= 2014 && r.year <= 2019);
const stagRows = yoyRows.filter((r) => r.year >= 2020 && r.year <= 2021);
const postRows = yoyRows.filter((r) => r.year >= 2022 && r.year <= 2026);
const mean = (arr) => arr.reduce((s, r) => s + r.foreignDiff, 0) / arr.length;
const preAvgExact = mean(preRows);
const stagAvgExact = mean(stagRows);
const postAvgExact = mean(postRows);
const maxPost = postRows.reduce((best, r) => (r.foreignDiff > best.foreignDiff ? r : best), postRows[0]);

const yoySummary = {
  periods: {
    pre2020: { label: "2014～2019年", years: preRows.length, avgForeignDiff: Math.round(preAvgExact) },
    stagnation: { label: "2020～2021年", years: stagRows.length, avgForeignDiff: Math.round(stagAvgExact) },
    post2022: {
      label: "2022～2026年",
      years: postRows.length,
      avgForeignDiff: Math.round(postAvgExact),
      maxYear: maxPost.year,
      maxDiff: maxPost.foreignDiff,
      ratioToPre2020Avg: round(postAvgExact / preAvgExact, 2),
    },
  },
  rows: yoyRows,
};

// I4: Nationality/region contribution & annual 100% shares
const categoryContributions = categories.map((name, idx) => {
  const from = first.counts[idx];
  const to = last.counts[idx];
  const diff = to - from;
  const fromShare = round((from / first.foreign) * 100, 1);
  const toShare = round((to / last.foreign) * 100, 1);
  return {
    name,
    from,
    to,
    diff,
    ratio: round(to / from, 2),
    contributionPercent: round((diff / foreignDiff) * 100, 1),
    fromShare,
    toShare,
    sharePointDiff: round(toShare - fromShare, 1),
  };
});

const emergingNames = new Set(["ベトナム", "ネパール", "ミャンマー"]);
const emergingDiffSum = categoryContributions
  .filter((c) => emergingNames.has(c.name))
  .reduce((s, c) => s + c.diff, 0);

const annualShares = annual.map((row) => {
  const shares = {};
  const counts = {};
  categories.forEach((name, idx) => {
    counts[name] = row.counts[idx];
    shares[name] = round((row.counts[idx] / row.foreign) * 100, 2);
  });
  return {
    year: Number(row.date.slice(0, 4)),
    date: row.date,
    foreign: row.foreign,
    counts,
    shares,
  };
});

// I5: Nearby 6 cities
const cities = comparison.cities.map((c) => ({
  ...c,
  share: round((c.foreign / c.total) * 100, 2),
  isHachioji: c.code === "13201",
}));
const sortedShares = cities.map((c) => c.share).sort((a, b) => a - b);
const sortedForeign = cities.map((c) => c.foreign).sort((a, b) => a - b);
const mid = (arr) => (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;

const analysis = {
  generatedFrom: "public/data/hachioji-international/population.json",
  retrievedOn,
  decomposition,
  indexSummary,
  yoySummary,
  nationalitySummary: {
    categories: categoryContributions,
    threeEmerging: {
      names: ["ベトナム", "ネパール", "ミャンマー"],
      diffSum: emergingDiffSum,
      contributionPercent: round((emergingDiffSum / foreignDiff) * 100, 1),
    },
    annualShares,
  },
  nearbySummary: {
    date: comparison.date,
    medianShare: round(mid(sortedShares), 2),
    medianForeign: mid(sortedForeign),
    cities,
  },
};

assert.equal(decomposition.offsetRatioPercent, 70.6);
assert.equal(indexSummary.foreignIndex2026 ?? annualSeries.at(-1).foreignIndex, 221.9);
assert.equal(analysis.nearbySummary.medianShare, 2.9);

writeFileSync(outputUrl, JSON.stringify(analysis, null, 2) + "\n", "utf8");
console.log("Generated public/data/hachioji-international/analysis.json");
