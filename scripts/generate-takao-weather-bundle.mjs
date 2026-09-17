import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "app", "(monetized)", "labs", "takao-weather-shift", "data");
const bundleFileName = "takao-weather-shift-2026-09-17.r1.json";
const lockFileName = "takao-weather-shift-2026-09-17.r1.lock.json";

const coords = {
  takao_summit: { name: "高尾山頂", latitude: 35.6251, longitude: 139.2437, elevation: 599 },
  hachioji: { name: "八王子（市街地）", latitude: 35.6567, longitude: 139.3244, elevation: 123 },
};

async function fetchHourly(lat, lon, elevation, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&elevation=${elevation}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia%2FTokyo`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Open-Meteo: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.hourly;
}

const mechanisms = [
  {
    step: 1,
    title: "湿潤気流の平野流入",
    description: "東京湾・相模湾方面から、湿り気を多く含んだ南東〜南の季節風が関東平野を横断して吹き込みます。"
  },
  {
    step: 2,
    title: "地形衝突と強制上昇（Orographic Lift）",
    description: "平坦な平野部を進んできた気流が、標高599mの高尾山・陣馬山地にぶつかり、山肌に沿って強制的に上昇します。"
  },
  {
    step: 3,
    title: "断熱膨張と冷却による飽和",
    description: "空気が上昇すると気圧が低下して断熱膨張が起き、100mあたり約0.65℃気温が下がります。これにより露点温度に達し、水蒸気が凝結します。"
  },
  {
    step: 4,
    title: "局地的な雲底低下・濃霧（ガス）の発生",
    description: "平野部では雲底高度が800〜1,000mであっても、山肌に沿って上昇した空気は山腹（300〜500m）で飽和し、平野は晴れでも山頂は真っ白なガスに包まれます。"
  }
];

const riskCheckerRules = {
  description: "月・時間帯・麓天候の組み合わせに基づく天候急変・ガス発生リスク判定エンジン",
  levels: [
    { code: "safe", label: "安定・低リスク", color: "emerald", score_range: [0, 30] },
    { code: "notice", label: "ガス注意（見せかけの晴れリスク）", color: "amber", score_range: [31, 55] },
    { code: "warning", label: "天候急変警戒（午後発雷・夕立）", color: "orange", score_range: [56, 75] },
    { code: "danger", label: "高リスク（荒天・凍結・視界不良）", color: "rose", score_range: [76, 100] }
  ]
};

async function main() {
  const startDate = "2024-01-01";
  const endDate = "2024-12-31";

  console.log("1. Fetching hourly weather data for Takao Summit (599m)...");
  const takao = await fetchHourly(
    coords.takao_summit.latitude,
    coords.takao_summit.longitude,
    coords.takao_summit.elevation,
    startDate,
    endDate
  );

  console.log("2. Fetching hourly weather data for Hachioji Base (123m)...");
  const hachioji = await fetchHourly(
    coords.hachioji.latitude,
    coords.hachioji.longitude,
    coords.hachioji.elevation,
    startDate,
    endDate
  );

  const totalHours = takao.time.length;
  console.log(`Processing ${totalHours} hours of data...`);

  // Group by date (YYYY-MM-DD) and month (1..12)
  const daysMap = new Map();
  for (let i = 0; i < totalHours; i++) {
    const timeStr = takao.time[i];
    const dateStr = timeStr.slice(0, 10);
    const hour = parseInt(timeStr.slice(11, 13), 10);

    if (!daysMap.has(dateStr)) {
      daysMap.set(dateStr, {
        date: dateStr,
        month: parseInt(dateStr.slice(5, 7), 10),
        hours: [],
      });
    }

    const tTemp = takao.temperature_2m[i];
    const tHumid = takao.relative_humidity_2m[i];
    const tPrecip = takao.precipitation[i];
    const tCloud = takao.cloud_cover[i];
    const tWindSpeed = takao.wind_speed_10m[i];
    const tWindDir = takao.wind_direction_10m[i];
    const tWeather = takao.weather_code[i];

    const hTemp = hachioji.temperature_2m[i];
    const hHumid = hachioji.relative_humidity_2m[i];
    const hPrecip = hachioji.precipitation[i];
    const hCloud = hachioji.cloud_cover[i];

    // Gas on summit: relative humidity >= 90% or fog/drizzle/rain weather code
    const isGasTakao = tHumid >= 90 || [45, 48, 51, 53, 55, 61, 63, 65, 80, 81, 82].includes(tWeather);

    // Sunny in Hachioji: precip == 0 and cloud_cover <= 50 and humidity < 75%
    const isHachiojiSunny = hPrecip === 0 && hCloud <= 50 && hHumid < 75;

    // Apparent sunny gas: Hachioji is sunny, but Takao summit is in gas
    const isApparentSunnyGas = isHachiojiSunny && isGasTakao;

    daysMap.get(dateStr).hours.push({
      hour,
      takao: { temp: tTemp, humidity: tHumid, precip: tPrecip, cloud: tCloud, windSpeed: tWindSpeed, windDir: tWindDir, weather: tWeather },
      hachioji: { temp: hTemp, humidity: hHumid, precip: hPrecip, cloud: hCloud },
      isGasTakao,
      isHachiojiSunny,
      isApparentSunnyGas,
    });
  }

  // Monthly aggregations
  const monthlyStats = Array.from({ length: 12 }, (_, idx) => ({
    month: idx + 1,
    total_days: 0,
    gas_days: 0,
    apparent_sunny_gas_days: 0,
    afternoon_shift_days: 0,
    rain_snow_border_days: 0,
    avg_summit_humidity: 0,
    avg_base_humidity: 0,
    humidity_gap: 0,
  }));

  const monthSums = Array.from({ length: 12 }, () => ({
    daysCount: 0,
    tHumidSum: 0,
    hHumidSum: 0,
    hoursCount: 0,
  }));

  // Analyze each day
  for (const day of daysMap.values()) {
    const mIdx = day.month - 1;
    monthlyStats[mIdx].total_days++;
    monthSums[mIdx].daysCount++;

    let dayGasHours = 0;
    let dayApparentGasHours = 0;
    let isRainSnowBorder = false;

    for (const h of day.hours) {
      monthSums[mIdx].tHumidSum += h.takao.humidity;
      monthSums[mIdx].hHumidSum += h.hachioji.humidity;
      monthSums[mIdx].hoursCount++;

      if (h.isGasTakao) dayGasHours++;
      if (h.isApparentSunnyGas) dayApparentGasHours++;

      // Winter rain/snow border: Hachioji precip > 0 and 1.5 <= temp <= 4.5, summit temp <= 0.5
      if ([1, 2, 12].includes(day.month)) {
        if (h.hachioji.precip > 0 && h.hachioji.temp >= 1.5 && h.hachioji.temp <= 4.5 && h.takao.temp <= 0.5) {
          isRainSnowBorder = true;
        }
      }
    }

    // A gas day is defined as >= 3 hours of gas on the summit
    if (dayGasHours >= 3) {
      monthlyStats[mIdx].gas_days++;
    }

    // Apparent sunny gas day: at least 2 hours of apparent sunny gas during daytime (08:00 - 17:00)
    const daytimeApparentHours = day.hours
      .filter(h => h.hour >= 8 && h.hour <= 17 && h.isApparentSunnyGas)
      .length;
    if (daytimeApparentHours >= 2) {
      monthlyStats[mIdx].apparent_sunny_gas_days++;
    }

    // Afternoon shift day in summer (June - September):
    // 10:00 morning had 0mm precip and cloud <= 60%, but 13:00-17:00 had precip >= 1.0mm or heavy weather
    if ([6, 7, 8, 9].includes(day.month)) {
      const h10 = day.hours.find(h => h.hour === 10);
      const afternoonHours = day.hours.filter(h => h.hour >= 13 && h.hour <= 17);
      if (h10 && h10.takao.precip === 0 && h10.takao.cloud <= 60) {
        const afternoonRain = afternoonHours.some(h => h.takao.precip >= 1.0 || [80, 81, 82, 95, 96].includes(h.takao.weather));
        if (afternoonRain) {
          monthlyStats[mIdx].afternoon_shift_days++;
        }
      }
    }

    if (isRainSnowBorder) {
      monthlyStats[mIdx].rain_snow_border_days++;
    }
  }

  // Calculate monthly averages
  for (let i = 0; i < 12; i++) {
    const avgSummitHumid = Math.round((monthSums[i].tHumidSum / monthSums[i].hoursCount) * 10) / 10;
    const avgBaseHumid = Math.round((monthSums[i].hHumidSum / monthSums[i].hoursCount) * 10) / 10;
    monthlyStats[i].avg_summit_humidity = avgSummitHumid;
    monthlyStats[i].avg_base_humidity = avgBaseHumid;
    monthlyStats[i].humidity_gap = Math.round((avgSummitHumid - avgBaseHumid) * 10) / 10;
  }

  // Summer Hourly Matrix (June - September, 122 days total)
  const targetHours = [10, 12, 14, 16, 18];
  const summerMonths = [6, 7, 8, 9];
  const summerHourlyMatrix = targetHours.map(hour => {
    let totalSampleDays = 0;
    let rainCount = 0;
    let heavyRainCount = 0;
    let highHumidityCount = 0;
    let gasCount = 0;
    let tempSum = 0;
    let cloudSum = 0;

    for (const day of daysMap.values()) {
      if (!summerMonths.includes(day.month)) continue;
      const h = day.hours.find(item => item.hour === hour);
      if (!h) continue;

      totalSampleDays++;
      tempSum += h.takao.temp;
      cloudSum += h.takao.cloud;
      if (h.takao.precip >= 0.1) rainCount++;
      if (h.takao.precip >= 2.0) heavyRainCount++;
      if (h.takao.humidity >= 85) highHumidityCount++;
      if (h.isGasTakao) gasCount++;
    }

    return {
      hour,
      hour_label: `${hour}:00`,
      rain_probability: Math.round((rainCount / totalSampleDays) * 1000) / 10,
      heavy_rain_probability: Math.round((heavyRainCount / totalSampleDays) * 1000) / 10,
      high_humidity_rate: Math.round((highHumidityCount / totalSampleDays) * 1000) / 10,
      gas_probability: Math.round((gasCount / totalSampleDays) * 1000) / 10,
      avg_temperature: Math.round((tempSum / totalSampleDays) * 10) / 10,
      avg_cloud_cover: Math.round((cloudSum / totalSampleDays) * 10) / 10,
    };
  });

  // Annual Totals
  const annualTotalDays = daysMap.size;
  const annualGasDays = monthlyStats.reduce((acc, m) => acc + m.gas_days, 0);
  const annualApparentSunnyGasDays = monthlyStats.reduce((acc, m) => acc + m.apparent_sunny_gas_days, 0);
  const annualAfternoonShiftDays = monthlyStats.reduce((acc, m) => acc + m.afternoon_shift_days, 0);
  const annualRainSnowBorderDays = monthlyStats.reduce((acc, m) => acc + m.rain_snow_border_days, 0);

  const annualStats = {
    total_days: annualTotalDays,
    gas_days: annualGasDays,
    gas_days_pct: Math.round((annualGasDays / annualTotalDays) * 1000) / 10,
    apparent_sunny_gas_days: annualApparentSunnyGasDays,
    apparent_sunny_gas_days_pct: Math.round((annualApparentSunnyGasDays / annualTotalDays) * 1000) / 10,
    afternoon_shift_days: annualAfternoonShiftDays,
    rain_snow_border_days: annualRainSnowBorderDays,
  };

  const bundle = {
    metadata: {
      generated_at: new Date().toISOString(),
      dataset_version: "2026-09-17.r1",
      year: 2024,
      points: coords,
      description: "高尾山頂（標高599m）における気象急変・ガス発生リスクおよび平野部（八王子）との天候乖離の統計bundle",
    },
    annual_summary: annualStats,
    monthly_summary: monthlyStats,
    summer_hourly_matrix: summerHourlyMatrix,
    mechanisms,
    risk_checker_engine: riskCheckerRules,
  };

  await mkdir(outputDir, { recursive: true });
  const bundleJson = JSON.stringify(bundle, null, 2) + "\n";
  const bundlePath = join(outputDir, bundleFileName);
  await writeFile(bundlePath, bundleJson, "utf8");

  const byteSize = Buffer.byteLength(bundleJson, "utf8");
  const sha256 = createHash("sha256").update(bundleJson, "utf8").digest("hex");

  const lockData = {
    file: bundleFileName,
    byte_size: byteSize,
    sha256: sha256,
    generated_at: bundle.metadata.generated_at,
  };
  const lockJson = JSON.stringify(lockData, null, 2) + "\n";
  const lockPath = join(outputDir, lockFileName);
  await writeFile(lockPath, lockJson, "utf8");

  console.log(`\n Successfully generated:`);
  console.log(`- Bundle: ${bundlePath} (${byteSize} bytes)`);
  console.log(`- SHA-256: ${sha256}`);
  console.log(`- Lock: ${lockPath}`);
  console.log(`Annual Summary:`, annualStats);
}

main().catch(err => {
  console.error("Fatal error generating bundle:", err);
  process.exit(1);
});
