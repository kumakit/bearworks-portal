import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

export const version = "2026-10-04.r1";
export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
export const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const sum = a => a.reduce((s, x) => s + x, 0);
export const round = (n, places = 4) => n === null ? null : Number(n.toFixed(places));
const years = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
export const jsonBytes = x => JSON.stringify(x, null, 2) + "\n";

export function parseCsv(text) {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map(line => {
    const columns = []; let value = ""; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (quoted && line[i + 1] === '"') { value += '"'; i++; }
        else quoted = !quoted;
      } else if (line[i] === "," && !quoted) { columns.push(value); value = ""; }
      else value += line[i];
    }
    assert(!quoted, "Unterminated CSV quote"); columns.push(value); return columns;
  });
}

export async function loadSource(root) {
  const directory = resolve(root, "data/hachioji-rain-autumn");
  const manifest = JSON.parse(await readFile(resolve(directory, "source-manifest.json"), "utf8"));
  const bytes = await readFile(resolve(directory, manifest.filename));
  assert.equal(bytes.length, manifest.bytes); assert.equal(sha256(bytes), manifest.sha256);
  const table = parseCsv(new TextDecoder(manifest.encoding).decode(bytes));
  const header = table.findIndex(r => r[0] === "年月日");
  assert(header > 0);
  const labels = table[header]; const stations = table[header - 1];
  const qualifiers = table.find(r => r.includes("品質情報"));
  const mapping = {};
  for (const [key, station] of [["h", "八王子"], ["t", "東京"]]) {
    mapping[key] = {};
    for (const [name, label] of [["mean", "平均気温(℃)"], ["max", "最高気温(℃)"], ["min", "最低気温(℃)"], ["rain", "降水量の合計(mm)"]]) {
      const indexes = labels.flatMap((x, i) => x === label && stations[i] === station ? [i] : []);
      assert(indexes.length >= 3, `Missing ${station} ${label}`);
      const value = indexes[0]; const quality = indexes.find(i => qualifiers[i] === "品質情報");
      const homogeneity = indexes.find(i => qualifiers[i] === "均質番号");
      assert.equal(qualifiers[value], ""); assert(quality && homogeneity);
      mapping[key][name] = { value, quality, homogeneity };
    }
  }
  const rows = table.filter(r => /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(r[0])).map(columns => {
    assert.equal(columns.length, labels.length);
    const [year, month, day] = columns[0].split("/").map(Number);
    const row = { date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, year, month, day };
    for (const key of ["h", "t"]) {
      row[key] = {};
      for (const name of ["mean", "max", "min", "rain"]) {
        const p = mapping[key][name];
        const number = i => columns[i] === "" ? null : Number(columns[i]);
        const value = number(p.value); const quality = number(p.quality); const homogeneity = number(p.homogeneity);
        assert(value === null || Number.isFinite(value));
        assert([0, 1, 2, 4, 5, 8].includes(quality));
        if ([5, 8].includes(quality)) { assert(value !== null); assert(homogeneity !== null); }
        if (name === "rain" && value !== null) assert(value >= 0);
        row[key][name] = { value, quality, homogeneity };
      }
    }
    return row;
  });
  assert.equal(rows.length, 6209);
  rows.forEach((r, i) => assert.equal(r.date, new Date(Date.UTC(2009, 0, 1 + i)).toISOString().slice(0, 10)));
  return { manifest, rows, bytes };
}

const valid = (cell, include5) => cell.value !== null && (cell.quality === 8 || (include5 && cell.quality === 5));
export function qualityReport(rows) {
  return Object.fromEntries(["h", "t"].map(key => [key, Object.fromEntries(["mean", "max", "min", "rain"].map(name => {
    const counts = {}; const segments = [];
    for (const r of rows) {
      const c = r[key][name]; counts[c.quality] = (counts[c.quality] ?? 0) + 1;
      if (!segments.length || segments.at(-1).number !== c.homogeneity) segments.push({ from: r.date, to: r.date, number: c.homogeneity });
      else segments.at(-1).to = r.date;
    }
    return [name, { counts, segments }];
  }))]));
}

function rainYear(rows) {
  const result = { year: rows[0].year, days: rows.length };
  for (const key of ["h", "t"]) {
    const values = rows.map(r => r[key].rain.value);
    const wet = values.filter(n => n >= 1);
    const top = [...rows].sort((a, b) => b[key].rain.value - a[key].rain.value || a.date.localeCompare(b.date)).slice(0, 5);
    result[key] = {
      total: sum(values), wet_days: wet.length, wet_mean: round(mean(wet)),
      top5_total: sum(top.map(r => r[key].rain.value)),
      top5_share: round(sum(top.map(r => r[key].rain.value)) / sum(values) * 100),
      top5: top.map(r => ({ date: r.date, mm: r[key].rain.value })),
      monthly: Array.from({ length: 12 }, (_, i) => {
        const v = rows.filter(r => r.month === i + 1).map(r => r[key].rain.value);
        return { month: i + 1, total: sum(v), wet_days: v.filter(n => n >= 1).length };
      }),
      thresholds: [0.5, 1, 5, 10].map(threshold => ({ threshold, days: values.filter(n => n >= threshold).length })),
    };
  }
  return result;
}

export function aggregateRain(source, include5 = false) {
  const candidates = source.rows.filter(r => r.year >= 2015);
  for (const key of ["h", "t"]) assert.equal(new Set(candidates.map(r => r[key].rain.homogeneity)).size, 1, "Rain comparison crosses homogeneity boundary");
  const annual = []; const excluded = [];
  for (const year of years(2015, 2025)) {
    const all = candidates.filter(r => r.year === year);
    const usable = all.filter(r => valid(r.h.rain, include5) && valid(r.t.rain, include5));
    if (all.length !== usable.length) { excluded.push({ year, expected: all.length, valid: usable.length, invalid_dates: all.filter(r => !usable.includes(r)).map(r => r.date) }); continue; }
    annual.push(rainYear(usable));
  }
  assert(annual.length >= 5, "Insufficient complete common years");
  const accepted = candidates.filter(r => annual.some(y => y.year === r.year));
  const contingency = { both: 0, h_only: 0, t_only: 0, neither: 0, total: accepted.length };
  accepted.forEach(r => { const h = r.h.rain.value >= 1; const t = r.t.rain.value >= 1;
    contingency[h && t ? "both" : h ? "h_only" : t ? "t_only" : "neither"]++; });
  const summary = Object.fromEntries(["h", "t"].map(key => [key, {
    total: round(mean(annual.map(a => a[key].total))), wet_days: round(mean(annual.map(a => a[key].wet_days))),
    wet_mean: round(mean(annual.map(a => a[key].wet_mean))),
    top5_share: round(mean(annual.map(a => a[key].top5_share))),
    monthly: Array.from({ length: 12 }, (_, i) => ({ month: i + 1,
      total: round(mean(annual.map(a => a[key].monthly[i].total))), wet_days: round(mean(annual.map(a => a[key].monthly[i].wet_days))) })),
    thresholds: [0.5, 1, 5, 10].map((threshold, i) => ({ threshold, days: round(mean(annual.map(a => a[key].thresholds[i].days))) })),
  }]));
  return { included_years: annual.map(a => a.year), excluded, annual, summary, contingency,
    h_given_t: round(contingency.both / (contingency.both + contingency.t_only) * 100),
    t_given_h: round(contingency.both / (contingency.both + contingency.h_only) * 100),
    greater_total_years: annual.filter(a => a.h.total > a.t.total).length,
    greater_wet_years: annual.filter(a => a.h.wet_days > a.t.wet_days).length };
}

function counts(values, low, high) {
  let longest = 0; let current = 0;
  for (const value of values) { current = value !== null && value >= low && value < high ? current + 1 : 0; longest = Math.max(longest, current); }
  return { cool: values.filter(x => x !== null && x < low).length,
    middle: values.filter(x => x !== null && x >= low && x < high).length,
    warm: values.filter(x => x !== null && x >= high).length, longest_run: longest };
}

export function aggregateAutumn(source, include5 = false) {
  const candidates = source.rows.filter(r => r.month >= 9 && r.month <= 11);
  assert.equal(new Set(candidates.map(r => r.h.mean.homogeneity)).size, 1, "Autumn crosses Hachioji mean-temperature homogeneity boundary");
  const annual = years(2009, 2025).map(year => {
    const rows = candidates.filter(r => r.year === year); assert.equal(rows.length, 91);
    const daily = rows.map(r => [r.date.slice(5), valid(r.h.mean, include5) ? r.h.mean.value : null]);
    const validDays = daily.filter(d => d[1] !== null).length;
    return { year, valid_days: validDays, complete: validDays === 91, daily,
      thresholds: [[14, 24], [15, 25], [16, 26]].map(([low, high]) => ({ low, high, ...counts(daily.map(d => d[1]), low, high) })) };
  });
  const comparison = [[14, 24], [15, 25], [16, 26]].map(([low, high], i) => {
    const first = annual.filter(a => a.year <= 2013 && a.complete);
    const last = annual.filter(a => a.year >= 2021 && a.complete);
    assert(first.length >= 3 && last.length >= 3, "Insufficient complete autumns");
    const summarize = list => ({ years: list.map(a => a.year), ...Object.fromEntries(["cool", "middle", "warm", "longest_run"].map(key => [key, round(mean(list.map(a => a.thresholds[i][key])))])) });
    const early = summarize(first); const late = summarize(last);
    return { low, high, early, late, middle_difference: round(late.middle - early.middle), warm_difference: round(late.warm - early.warm) };
  });
  return { annual, comparison, included_years: annual.filter(a => a.complete).map(a => a.year),
    excluded: annual.filter(a => !a.complete).map(a => ({ year: a.year, valid: a.valid_days, expected: 91, invalid_dates: a.daily.filter(d => d[1] === null).map(d => `${a.year}-${d[0]}`) })) };
}

export function makeBundles(source) {
  const shared = { schema_version: "1.0.0", version, source_sha256: source.manifest.sha256,
    retrieved_at: source.manifest.retrieved_at, source_url: source.manifest.source_landing,
    quality_policy: "Main: quality 8 only; sensitivity: quality 8 and 5. No missing-value imputation. Complete years/seasons only.",
    stations: { h: { name: "八王子", block: "0366", obsdl: "a0366" }, t: { name: "東京都心", block: "47662", obsdl: "s47662", note: "気象庁の東京観測所。東京都全域や23区の平均ではない。" } } };
  return {
    rain: { ...shared, period: "2015-2025", threshold_mm: 1, main: aggregateRain(source), sensitivity_quality5: aggregateRain(source, true), quality: qualityReport(source.rows.filter(r => r.year >= 2015)) },
    autumn: { ...shared, period: "2009-2025", months: [9, 10, 11], expected_days: 91, main: aggregateAutumn(source), sensitivity_quality5: aggregateAutumn(source, true), quality: qualityReport(source.rows.filter(r => r.month >= 9 && r.month <= 11)) },
  };
}
