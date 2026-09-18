import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import qs from "node:querystring";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const climateBundlePath = join(root, "app", "(monetized)", "labs", "hachioji-climate", "data", "hachioji-climate-2026-08-11.r1.json");
const outputDir = join(root, "app", "(monetized)", "labs", "hachioji-chill", "data");
const bundleFileName = "hachioji-chill-2026-09-18.r1.json";
const lockFileName = "hachioji-chill-2026-09-18.r1.lock.json";

// Stations
const stations = [
  {
    key: "hachioji",
    name: "八王子",
    code: "a0366",
    block_no: "0366",
    kind: "amedas_four_elements",
    elements_available: ["temp", "wind", "sunshine", "precip"],
    note: "アメダス観測所。湿度・雲量・気圧の観測なし。",
  },
  {
    key: "tokyo",
    name: "東京都心",
    code: "s47662",
    block_no: "47662",
    kind: "surface_observatory",
    elements_available: ["temp", "wind", "sunshine", "precip", "humidity", "pressure", "cloud_cover"],
    note: "気象官署（東京）。2014年12月2日に大手町から北の丸公園へ移転。",
  },
];

// Winter seasons to fetch: 2014-12..2015-02 (2015 winter) through 2025-12..2026-02 (2026 winter)
// 12 seasons of hourly data with homogeneous Tokyo station location (Kitanomaru)
const seasonsToFetch = [
  { startYear: 2014, endYear: 2015, season: 2015, label: "2014-2015冬" },
  { startYear: 2015, endYear: 2016, season: 2016, label: "2015-2016冬" },
  { startYear: 2016, endYear: 2017, season: 2017, label: "2016-2017冬" },
  { startYear: 2017, endYear: 2018, season: 2018, label: "2017-2018冬" },
  { startYear: 2018, endYear: 2019, season: 2019, label: "2018-2019冬" },
  { startYear: 2019, endYear: 2020, season: 2020, label: "2019-2020冬" },
  { startYear: 2020, endYear: 2021, season: 2021, label: "2020-2021冬" },
  { startYear: 2021, endYear: 2022, season: 2022, label: "2021-2022冬" },
  { startYear: 2022, endYear: 2023, season: 2023, label: "2022-2023冬" },
  { startYear: 2023, endYear: 2024, season: 2024, label: "2023-2024冬" },
  { startYear: 2024, endYear: 2025, season: 2025, label: "2024-2025冬" },
  { startYear: 2025, endYear: 2026, season: 2026, label: "2025-2026冬" },
];

function fetchJmaHourlyWinter(startYear, endYear) {
  return new Promise((resolve, reject) => {
    const fields = {
      stationNumList: JSON.stringify(["a0366", "s47662"]),
      aggrgPeriod: "9",
      elementNumList: JSON.stringify([["201", ""], ["301", ""], ["401", ""], ["101", ""]]),
      interAnnualType: "1",
      ymdList: JSON.stringify([String(startYear), String(endYear), "12", "2", "1", "28"]),
      optionNumList: "[]",
      downloadFlag: "true",
      rmkFlag: "1",
      disconnectFlag: "1",
      youbiFlag: "0",
      fukenFlag: "0",
      kijiFlag: "0",
      csvFlag: "1",
      jikantaiFlag: "0",
      jikantaiList: "[1,24]",
      ymdLiteral: "1",
    };

    const postData = qs.stringify(fields);
    const req = https.request("https://www.data.jma.go.jp/risk/obsdl/show/table", {
      method: "POST",
      headers: {
        Referer: "https://www.data.jma.go.jp/risk/obsdl/",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    }, (res) => {
      const chunks = [];
      res.on("data", d => chunks.push(d));
      res.on("end", () => {
        const text = new TextDecoder("shift-jis").decode(Buffer.concat(chunks));
        resolve(text);
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function parseCsv(csvText, seasonId) {
  const lines = csvText.split(/\r?\n/).filter(l => /^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:00:00/.test(l));
  const hourlyRows = [];

  for (const line of lines) {
    const cols = line.split(",").map(c => c.trim());
    const m = cols[0].match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):00:00$/);
    if (!m) continue;

    const [_, y, mo, d, hrStr] = m;
    const year = parseInt(y, 10);
    const month = parseInt(mo, 10);
    const day = parseInt(d, 10);
    let hour = parseInt(hrStr, 10);

    let dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (hour === 24) {
      hour = 0;
      const nextDayDate = new Date(Date.UTC(year, month - 1, day + 1));
      dateStr = nextDayDate.toISOString().slice(0, 10);
    }

    const hTemp = parseFloat(cols[1]);
    const hTempQual = parseInt(cols[2], 10);
    const hWind = parseFloat(cols[4]);
    const hWindQual = parseInt(cols[5], 10);
    const hSun = parseFloat(cols[9]);
    const hPrecip = parseFloat(cols[12]);

    const tTemp = parseFloat(cols[15]);
    const tTempQual = parseInt(cols[16], 10);
    const tWind = parseFloat(cols[18]);
    const tWindQual = parseInt(cols[19], 10);
    const tSun = parseFloat(cols[23]);
    const tPrecip = parseFloat(cols[27]);

    const validPair = hTempQual >= 5 && tTempQual >= 5 && !isNaN(hTemp) && !isNaN(tTemp);

    hourlyRows.push({
      season: seasonId,
      date: dateStr,
      hour,
      hachioji: {
        temp: hTempQual >= 5 && !isNaN(hTemp) ? hTemp : null,
        wind: hWindQual >= 5 && !isNaN(hWind) ? hWind : null,
        sun: !isNaN(hSun) ? hSun : null,
        precip: !isNaN(hPrecip) ? hPrecip : null,
      },
      tokyo: {
        temp: tTempQual >= 5 && !isNaN(tTemp) ? tTemp : null,
        wind: tWindQual >= 5 && !isNaN(tWind) ? tWind : null,
        sun: !isNaN(tSun) ? tSun : null,
        precip: !isNaN(tPrecip) ? tPrecip : null,
      },
      delta: validPair ? Math.round((hTemp - tTemp) * 10) / 10 : null,
    });
  }

  return hourlyRows;
}

function quantile(sortedArr, q) {
  if (sortedArr.length === 0) return 0;
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return Math.round((sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base])) * 10) / 10;
  }
  return sortedArr[base];
}

async function main() {
  console.log("=== Hachioji Chill Bundle Generator ===");

  console.log("1. Fetching hourly winter data from JMA obsdl...");
  const allHourly = [];
  for (const s of seasonsToFetch) {
    console.log(`  Fetching ${s.label} (${s.startYear}-12-01 to ${s.endYear}-02-28)...`);
    const csv = await fetchJmaHourlyWinter(s.startYear, s.endYear);
    const rows = parseCsv(csv, s.season);
    console.log(`    Parsed ${rows.length} hourly rows.`);
    allHourly.push(...rows);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Total hourly points collected: ${allHourly.length}`);

  console.log("2. Calculating 24-hour hourly profile...");
  const hourlyProfile = [];
  for (let h = 0; h < 24; h++) {
    const hRows = allHourly.filter(r => r.hour === h && r.delta !== null);
    const hTemps = hRows.map(r => r.hachioji.temp).filter(v => v !== null).sort((a, b) => a - b);
    const tTemps = hRows.map(r => r.tokyo.temp).filter(v => v !== null).sort((a, b) => a - b);
    const deltas = hRows.map(r => r.delta).sort((a, b) => a - b);

    hourlyProfile.push({
      hour: h,
      sample_size: hRows.length,
      hachioji: {
        median: quantile(hTemps, 0.5),
        q25: quantile(hTemps, 0.25),
        q75: quantile(hTemps, 0.75),
        mean: Math.round((hTemps.reduce((s, v) => s + v, 0) / hTemps.length) * 10) / 10,
      },
      tokyo: {
        median: quantile(tTemps, 0.5),
        q25: quantile(tTemps, 0.25),
        q75: quantile(tTemps, 0.75),
        mean: Math.round((tTemps.reduce((s, v) => s + v, 0) / tTemps.length) * 10) / 10,
      },
      delta: {
        median: quantile(deltas, 0.5),
        q25: quantile(deltas, 0.25),
        q75: quantile(deltas, 0.75),
        mean: Math.round((deltas.reduce((s, v) => s + v, 0) / deltas.length) * 10) / 10,
      },
    });
  }

  console.log("3. Grouping days for 7am analysis and calendar...");
  const dayMap = new Map();
  for (const row of allHourly) {
    if (!dayMap.has(row.date)) {
      dayMap.set(row.date, {
        date: row.date,
        season: row.season,
        hours: {},
      });
    }
    dayMap.get(row.date).hours[row.hour] = row;
  }

  const calendarDays = [];
  const valid7amDays = [];

  for (const [date, dObj] of dayMap.entries()) {
    const h7 = dObj.hours[7];
    const h8 = dObj.hours[8];
    const h14 = dObj.hours[14];

    if (!h7 || h7.delta === null) continue;

    let nightWindSum = 0;
    let nightWindCount = 0;
    let nightPrecipSum = 0;
    for (let h = 0; h <= 6; h++) {
      const hrObj = dObj.hours[h];
      if (hrObj) {
        if (hrObj.hachioji.wind !== null) {
          nightWindSum += hrObj.hachioji.wind;
          nightWindCount++;
        }
        if (hrObj.hachioji.precip !== null) {
          nightPrecipSum += hrObj.hachioji.precip;
        }
      }
    }

    const nightWindAvg = nightWindCount > 0 ? Math.round((nightWindSum / nightWindCount) * 10) / 10 : null;
    const isPrecip = nightPrecipSum > 0;
    const isCalm = nightWindAvg !== null && nightWindAvg < 1.5;
    const isWindy = nightWindAvg !== null && nightWindAvg >= 2.5;

    let condition = "normal";
    if (isPrecip) {
      condition = "precip";
    } else if (isCalm) {
      condition = "calm_dry";
    } else if (isWindy) {
      condition = "windy";
    }

    const dayEntry = {
      date,
      season: dObj.season,
      hachioji_7am: h7.hachioji.temp,
      tokyo_7am: h7.tokyo.temp,
      delta_7am: h7.delta,
      delta_8am: h8 && h8.delta !== null ? h8.delta : null,
      delta_14pm: h14 && h14.delta !== null ? h14.delta : null,
      night_wind_avg: nightWindAvg,
      night_precip_sum: Math.round(nightPrecipSum * 10) / 10,
      condition,
    };

    calendarDays.push(dayEntry);
    valid7amDays.push(dayEntry);
  }

  console.log("4. Computing 7am gap statistics and histogram...");
  const deltas7am = valid7amDays.map(d => d.delta_7am).sort((a, b) => a - b);
  const totalDays = deltas7am.length;
  const countLeMinus3 = deltas7am.filter(v => v <= -3.0).length;
  const countLeMinus5 = deltas7am.filter(v => v <= -5.0).length;
  const countHachiojiColder = deltas7am.filter(v => v < 0).length;

  const binEdges = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3];
  const histogram = [];
  for (let i = 0; i < binEdges.length; i++) {
    const low = binEdges[i];
    const high = i < binEdges.length - 1 ? binEdges[i + 1] : 999;
    const count = deltas7am.filter(v => v >= low && v < high).length;
    histogram.push({
      range_label: i === binEdges.length - 1 ? `${low}℃以上` : `${low}〜${high}℃`,
      bin_min: low,
      bin_max: high === 999 ? 4 : high,
      count,
      pct: Math.round((count / totalDays) * 1000) / 10,
    });
  }

  const calmDays = valid7amDays.filter(d => d.condition === "calm_dry");
  const windyDays = valid7amDays.filter(d => d.condition === "windy");
  const precipDays = valid7amDays.filter(d => d.condition === "precip");

  const calcGroupStats = (group) => {
    if (group.length === 0) return null;
    const sorted = group.map(d => d.delta_7am).sort((a, b) => a - b);
    return {
      count: group.length,
      median: quantile(sorted, 0.5),
      q25: quantile(sorted, 0.25),
      q75: quantile(sorted, 0.75),
      mean: Math.round((sorted.reduce((s, v) => s + v, 0) / sorted.length) * 10) / 10,
      pct_le_minus3: Math.round((sorted.filter(v => v <= -3).length / sorted.length) * 1000) / 10,
      pct_le_minus5: Math.round((sorted.filter(v => v <= -5).length / sorted.length) * 1000) / 10,
    };
  };

  const conditionsSummary = {
    calm_dry: {
      name: "静穏・非降水（放射冷却条件）",
      description: "夜間平均風速1.5m/s未満かつ降水なし。放射冷却が強まりやすい典型条件。",
      stats: calcGroupStats(calmDays),
    },
    windy: {
      name: "強風条件",
      description: "夜間平均風速2.5m/s以上。風による大気混合で放射冷却が阻害されやすい条件。",
      stats: calcGroupStats(windyDays),
    },
    precip: {
      name: "降水条件",
      description: "夜間に降水を観測。雲に覆われ放射冷却が起きにくい条件。",
      stats: calcGroupStats(precipDays),
    },
  };

  console.log("5. Loading winter diurnal range from climate bundle...");
  const climateRaw = await readFile(climateBundlePath, "utf8");
  const climate = JSON.parse(climateRaw);
  const winterAggs = climate.aggregates.winter;

  const diurnalRangeByStation = {};
  for (const st of ["hachioji", "tokyo", "fuchu", "ome"]) {
    const list = winterAggs.filter(w => w.station_key === st).map(w => w.metrics.median_daily_range_c).sort((a, b) => a - b);
    diurnalRangeByStation[st] = {
      count: list.length,
      median: quantile(list, 0.5),
      q25: quantile(list, 0.25),
      q75: quantile(list, 0.75),
      mean: Math.round((list.reduce((s, v) => s + v, 0) / list.length) * 10) / 10,
      min: list[0],
      max: list[list.length - 1],
    };
  }

  console.log("6. Extracting representative cold morning cases...");
  const findDay = (dateStr) => {
    const d = calendarDays.find((item) => item.date === dateStr);
    if (!d) throw new Error(`Day not found in calendarDays: ${dateStr}`);
    return d;
  };

  const day2018 = findDay("2018-01-26");
  const day2022 = findDay("2022-01-01");
  const day2024 = findDay("2024-02-06");

  const representativeCases = [
    {
      id: "extreme-chill-20180126",
      name: `2018年1月26日（八王子7時 ${day2018.hachioji_7am}℃ / 差 ${day2018.delta_7am}℃）`,
      date: "2018-01-26",
      description: "記録的な南岸低気圧大雪の数日後、澄み渡った快晴と静穏（夜間平均風速1.1m/s）により強力な放射冷却が発生。朝7時実測は八王子−6.4℃・都心−2.1℃（差−4.3℃）。なお同日の八王子の日最低気温は氷点下−8.2℃に達した。",
      hachioji_7am: day2018.hachioji_7am,
      tokyo_7am: day2018.tokyo_7am,
      delta_7am: day2018.delta_7am,
      condition: "快晴・静穏（積雪残存下での強力な放射冷却）",
    },
    {
      id: "typical-calm-20220101",
      name: `2022年1月1日（八王子7時 ${day2022.hachioji_7am}℃ / 差 ${day2022.delta_7am}℃）`,
      date: "2022-01-01",
      description: "元旦の澄み切った冬晴れと夜間静穏（風速1.3m/s）により内陸盆地で強い放射冷却が発生。都心が氷点下わずか−0.5℃にとどまる中、八王子は−6.5℃まで冷え込み、差は−6.0℃に拡大した典型的な冷え込みの朝。",
      hachioji_7am: day2022.hachioji_7am,
      tokyo_7am: day2022.tokyo_7am,
      delta_7am: day2022.delta_7am,
      condition: "移動性高気圧・静穏・非降水",
    },
    {
      id: "cloudy-rain-20240206",
      name: `2024年2月6日（八王子7時 ${day2024.hachioji_7am}℃ / 差 ${day2024.delta_7am}℃）`,
      date: "2024-02-06",
      description: "前日の南岸低気圧による降雪・降雨が残り、厚い雲に覆われた朝。夜間降水2.5mmにより地表からの赤外放射冷却が遮られ、朝7時の八王子1.7℃・都心2.2℃と地点間差はわずか−0.5℃に消失した事例。",
      hachioji_7am: day2024.hachioji_7am,
      tokyo_7am: day2024.tokyo_7am,
      delta_7am: day2024.delta_7am,
      condition: "南岸低気圧・降水・雲量大",
    },
  ];

  const summary = {
    period: {
      hourly_start: "2014-12-01",
      hourly_end: "2026-02-28",
      hourly_seasons_count: seasonsToFetch.length,
      total_days_analyzed: totalDays,
    },
    morning_7am: {
      median_gap: quantile(deltas7am, 0.5),
      mean_gap: Math.round((deltas7am.reduce((s, v) => s + v, 0) / totalDays) * 10) / 10,
      q25_gap: quantile(deltas7am, 0.25),
      q75_gap: quantile(deltas7am, 0.75),
      pct_hachioji_colder: Math.round((countHachiojiColder / totalDays) * 1000) / 10,
      pct_gap_le_minus3: Math.round((countLeMinus3 / totalDays) * 1000) / 10,
      pct_gap_le_minus5: Math.round((countLeMinus5 / totalDays) * 1000) / 10,
      max_negative_gap: deltas7am[0],
    },
    afternoon_14pm: {
      median_gap: hourlyProfile.find(p => p.hour === 14)?.delta.median,
      mean_gap: hourlyProfile.find(p => p.hour === 14)?.delta.mean,
    },
    diurnal_range_winter: {
      hachioji_median: diurnalRangeByStation.hachioji.median,
      tokyo_median: diurnalRangeByStation.tokyo.median,
      difference_median: Math.round((diurnalRangeByStation.hachioji.median - diurnalRangeByStation.tokyo.median) * 10) / 10,
    },
  };

  const bundle = {
    bundle_version: "2026-09-18.r1",
    bundle_schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    attribution: {
      source_name: "気象庁 (JMA) 過去の気象データ・ダウンロード",
      source_url: "https://www.data.jma.go.jp/risk/obsdl/",
      license_terms: "政府標準利用規約（第2.0版）/ 気象庁利用規約",
    },
    stations,
    summary,
    hourly_profile: hourlyProfile,
    morning_gap_histogram: histogram,
    condition_summary: conditionsSummary,
    diurnal_range_comparison: diurnalRangeByStation,
    calendar_days: calendarDays,
    representative_cases: representativeCases,
  };

  await mkdir(outputDir, { recursive: true });
  const bundleJsonText = JSON.stringify(bundle, null, 2);
  const bundlePath = join(outputDir, bundleFileName);
  await writeFile(bundlePath, bundleJsonText, "utf8");

  const bundleBuffer = Buffer.from(bundleJsonText, "utf8");
  const bundleSha256 = createHash("sha256").update(bundleBuffer).digest("hex");

  const lock = {
    lock_schema_version: "1.0.0",
    bundle_file: bundleFileName,
    bundle_version: bundle.bundle_version,
    bundle_schema_version: bundle.bundle_schema_version,
    bundle_byte_size: bundleBuffer.byteLength,
    bundle_sha256: bundleSha256,
    generated_at: bundle.generated_at,
  };

  const lockPath = join(outputDir, lockFileName);
  await writeFile(lockPath, JSON.stringify(lock, null, 2), "utf8");

  console.log(`\nGenerated bundle: ${bundlePath} (${bundleBuffer.byteLength} bytes)`);
  console.log(`SHA-256: ${bundleSha256}`);
  console.log(`Generated lock: ${lockPath}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
