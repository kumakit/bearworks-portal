import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import qs from "node:querystring";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const climateBundlePath = join(root, "app", "(monetized)", "labs", "hachioji-climate", "data", "hachioji-climate-2026-08-11.r1.json");
const outputDir = join(root, "app", "(monetized)", "labs", "hachioji-heat", "data");

const casesToFetch = [
  {
    id: "case-20180723",
    name: "2018年7月23日（八王子観測史上最高 39.3℃）",
    description: "八王子で観測史上最高気温39.3℃（国内歴代上位）を記録した日。都心も36.2℃を記録。",
    ymdList: ["2018", "2018", "7", "7", "23", "24"],
    rangeHours: 30, // 23日01:00 〜 24日06:00
  },
  {
    id: "case-20230716",
    name: "2023年7月16日（猛暑日 八王子 38.9℃）",
    description: "真夏の猛烈な日照で八王子が38.9℃に到達した一方、夜間は26.2℃まで急低下した日。",
    ymdList: ["2023", "2023", "7", "7", "16", "17"],
    rangeHours: 30, // 16日01:00 〜 17日06:00
  },
  {
    id: "case-20240729",
    name: "2024年7月29日（八王子 39.1℃ / 都心の熱帯夜）",
    description: "八王子が39.1℃を記録した翌朝、都心は朝5時でも30.8℃の超熱帯夜、八王子は26.1℃まで下がった日。",
    ymdList: ["2024", "2024", "7", "7", "29", "30"],
    rangeHours: 30, // 29日01:00 〜 30日06:00
  },
];

function fetchJmaHourly(ymdList) {
  return new Promise((resolve, reject) => {
    const fields = {
      stationNumList: JSON.stringify(["a0366", "s47662"]),
      aggrgPeriod: "9",
      elementNumList: JSON.stringify([["201", ""], ["101", ""]]),
      interAnnualType: "1",
      ymdList: JSON.stringify(ymdList),
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
      res.on("data", (d) => chunks.push(d));
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

function parseJmaHourly(csvText, limitHours = 30) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const dataLines = lines.filter((l) => /^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:00:00/.test(l));

  const points = [];
  for (const line of dataLines.slice(0, limitHours)) {
    const cols = line.split(",").map((c) => c.trim());
    const datetimeStr = cols[0];
    const match = datetimeStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):00:00$/);
    if (!match) continue;

    const [_, y, m, d, hourStr] = match;
    const hour = parseInt(hourStr, 10);
    const hachiojiTemp = parseFloat(cols[1]);
    const hachiojiQuality = parseInt(cols[2], 10);
    const hachiojiPrecip = parseFloat(cols[4]);
    const tokyoTemp = parseFloat(cols[7]);
    const tokyoQuality = parseInt(cols[8], 10);
    const tokyoPrecip = parseFloat(cols[10]);

    points.push({
      datetime: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hourStr.padStart(2, "0")}:00:00+09:00`,
      date: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
      hour,
      hachioji: {
        temp: isNaN(hachiojiTemp) ? null : hachiojiTemp,
        precip: isNaN(hachiojiPrecip) ? null : hachiojiPrecip,
        quality: hachiojiQuality,
      },
      tokyo: {
        temp: isNaN(tokyoTemp) ? null : tokyoTemp,
        precip: isNaN(tokyoPrecip) ? null : tokyoPrecip,
        quality: tokyoQuality,
      },
      delta: (isNaN(hachiojiTemp) || isNaN(tokyoTemp)) ? null : Math.round((hachiojiTemp - tokyoTemp) * 10) / 10,
    });
  }
  return points;
}

async function main() {
  console.log("Loading existing climate bundle...");
  const climateRaw = await readFile(climateBundlePath, "utf8");
  const climate = JSON.parse(climateRaw);

  const annuals = climate.aggregates.annual;

  // Extract 1990-2025 annual comparison rows for Hachioji, Tokyo, Fuchu, Ome
  const annualComparison = [];
  for (let year = 1990; year <= 2025; year++) {
    const hRow = annuals.find((r) => r.station_key === "hachioji" && r.period_id === year);
    const tRow = annuals.find((r) => r.station_key === "tokyo" && r.period_id === year);
    const fRow = annuals.find((r) => r.station_key === "fuchu" && r.period_id === year);
    const oRow = annuals.find((r) => r.station_key === "ome" && r.period_id === year);

    if (hRow && tRow) {
      annualComparison.push({
        year,
        hachioji: {
          heatstroke_days: hRow.metrics.heatstroke_days,
          midsummer_days: hRow.metrics.midsummer_days,
          min_temp_ge25_days: hRow.metrics.min_temp_ge25_days,
          winter_days: hRow.metrics.winter_days,
          median_daily_range_c: hRow.metrics.median_daily_range_c,
        },
        tokyo: {
          heatstroke_days: tRow.metrics.heatstroke_days,
          midsummer_days: tRow.metrics.midsummer_days,
          min_temp_ge25_days: tRow.metrics.min_temp_ge25_days,
          winter_days: tRow.metrics.winter_days,
          median_daily_range_c: tRow.metrics.median_daily_range_c,
        },
        fuchu: fRow ? {
          heatstroke_days: fRow.metrics.heatstroke_days,
          midsummer_days: fRow.metrics.midsummer_days,
          min_temp_ge25_days: fRow.metrics.min_temp_ge25_days,
          median_daily_range_c: fRow.metrics.median_daily_range_c,
        } : null,
        ome: oRow ? {
          heatstroke_days: oRow.metrics.heatstroke_days,
          midsummer_days: oRow.metrics.midsummer_days,
          min_temp_ge25_days: oRow.metrics.min_temp_ge25_days,
          median_daily_range_c: oRow.metrics.median_daily_range_c,
        } : null,
      });
    }
  }

  // Calculate 2020-2025 (recent 6 years) summaries
  const recent6 = annualComparison.filter((r) => r.year >= 2020 && r.year <= 2025);
  const calcAvg = (items, fn) => Math.round((items.reduce((sum, item) => sum + fn(item), 0) / items.length) * 10) / 10;

  const summary = {
    all_time_record_high: {
      hachioji: { temp: 39.3, date: "2018-07-23" },
      tokyo: { temp: 39.5, date: "2004-07-20" },
    },
    recent_averages_2020_2025: {
      heatstroke_days: {
        hachioji: calcAvg(recent6, (r) => r.hachioji.heatstroke_days),
        tokyo: calcAvg(recent6, (r) => r.tokyo.heatstroke_days),
        fuchu: calcAvg(recent6, (r) => r.fuchu.heatstroke_days),
        ome: calcAvg(recent6, (r) => r.ome.heatstroke_days),
      },
      midsummer_days: {
        hachioji: calcAvg(recent6, (r) => r.hachioji.midsummer_days),
        tokyo: calcAvg(recent6, (r) => r.tokyo.midsummer_days),
        fuchu: calcAvg(recent6, (r) => r.fuchu.midsummer_days),
        ome: calcAvg(recent6, (r) => r.ome.midsummer_days),
      },
      min_temp_ge25_days: {
        hachioji: calcAvg(recent6, (r) => r.hachioji.min_temp_ge25_days),
        tokyo: calcAvg(recent6, (r) => r.tokyo.min_temp_ge25_days),
        fuchu: calcAvg(recent6, (r) => r.fuchu.min_temp_ge25_days),
        ome: calcAvg(recent6, (r) => r.ome.min_temp_ge25_days),
      },
      median_daily_range_c: {
        hachioji: calcAvg(recent6, (r) => r.hachioji.median_daily_range_c),
        tokyo: calcAvg(recent6, (r) => r.tokyo.median_daily_range_c),
        fuchu: calcAvg(recent6, (r) => r.fuchu.median_daily_range_c),
        ome: calcAvg(recent6, (r) => r.ome.median_daily_range_c),
      },
    },
  };

  console.log("Fetching hourly cases from JMA...");
  const hourlyCases = [];
  for (const c of casesToFetch) {
    console.log(`Fetching ${c.id} (${c.name})...`);
    const csv = await fetchJmaHourly(c.ymdList);
    const series = parseJmaHourly(csv, c.rangeHours);
    hourlyCases.push({
      id: c.id,
      name: c.name,
      description: c.description,
      series,
    });
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Cooling rate analysis (18:00 to next day 05:00)
  const coolingRates = hourlyCases.map((c) => {
    const pt18 = c.series.find((p) => p.hour === 18);
    const ptNext5 = c.series.find((p, i) => i > 17 && p.hour === 5);
    if (!pt18 || !ptNext5) return null;
    const hDrop = Math.round((pt18.hachioji.temp - ptNext5.hachioji.temp) * 10) / 10;
    const tDrop = Math.round((pt18.tokyo.temp - ptNext5.tokyo.temp) * 10) / 10;
    return {
      case_id: c.id,
      name: c.name,
      temp_18h: { hachioji: pt18.hachioji.temp, tokyo: pt18.tokyo.temp },
      temp_05h: { hachioji: ptNext5.hachioji.temp, tokyo: ptNext5.tokyo.temp },
      cooling_amount: { hachioji: hDrop, tokyo: tDrop },
      hourly_cooling_rate: {
        hachioji: Math.round((hDrop / 11) * 100) / 100,
        tokyo: Math.round((tDrop / 11) * 100) / 100,
      },
    };
  }).filter(Boolean);

  const bundleVersion = "2026-09-17.r1";
  const bundle = {
    bundle_version: bundleVersion,
    bundle_schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    attribution: {
      source_name: "気象庁（過去の気象データ・ダウンロード）",
      source_url: "https://www.data.jma.go.jp/risk/obsdl/",
      processing_ja: "気象庁アメダス日別値および1時間値をもとに bearworks.uk にて抽出・集計",
    },
    stations: [
      { key: "hachioji", station_id: "44112", name: "八王子", prefecture: "東京都", type: "amedas" },
      { key: "tokyo", station_id: "44132", name: "東京都心", prefecture: "東京都", type: "kanso" },
      { key: "fuchu", station_id: "44116", name: "府中", prefecture: "東京都", type: "amedas" },
      { key: "ome", station_id: "44056", name: "青梅", prefecture: "東京都", type: "amedas" },
    ],
    summary,
    annual_comparison: annualComparison,
    hourly_cases: hourlyCases,
    cooling_rates: coolingRates,
  };

  await mkdir(outputDir, { recursive: true });
  const bundleJson = JSON.stringify(bundle, null, 2) + "\n";
  const bundleFile = `hachioji-heat-${bundleVersion}.json`;
  const bundlePath = join(outputDir, bundleFile);
  await writeFile(bundlePath, bundleJson, "utf8");

  const sha256 = createHash("sha256").update(Buffer.from(bundleJson, "utf8")).digest("hex");
  const byteSize = Buffer.byteLength(bundleJson, "utf8");

  const lock = {
    lock_schema_version: "1.0.0",
    bundle_file: bundleFile,
    bundle_version: bundleVersion,
    bundle_schema_version: "1.0.0",
    bundle_byte_size: byteSize,
    bundle_sha256: sha256,
    generated_at: bundle.generated_at,
  };
  const lockFile = `hachioji-heat-${bundleVersion}.lock.json`;
  const lockPath = join(outputDir, lockFile);
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");

  console.log(`Successfully generated:\n- ${bundlePath} (${byteSize} bytes, SHA: ${sha256})\n- ${lockPath}`);
}

main().catch((err) => {
  console.error("Error generating bundle:", err);
  process.exit(1);
});
