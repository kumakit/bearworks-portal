import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "app", "(monetized)", "labs", "takao-gear", "data");
const bundleFileName = "takao-gear-2026-09-17.r1.json";
const lockFileName = "takao-gear-2026-09-17.r1.lock.json";

const coords = {
  takao_summit: { name: "高尾山頂", latitude: 35.6251, longitude: 139.2437, elevation: 599 },
  hachioji: { name: "八王子（市街地）", latitude: 35.6567, longitude: 139.3244, elevation: 123 },
  tokyo: { name: "東京都心", latitude: 35.6917, longitude: 139.75, elevation: 25 },
};

async function fetchHourly(lat, lon, elevation, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&elevation=${elevation}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m&timezone=Asia%2FTokyo`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Open-Meteo: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.hourly;
}

const routes = [
  {
    id: "route-1",
    name: "1号路（表参道コース）",
    distance_km: 3.8,
    elevation_gain_m: 399,
    estimated_time_up_min: 90,
    paved_ratio: 1.0,
    difficulty: "beginner",
    footwear_normal: "スニーカーOK",
    footwear_rain: "防滑靴推奨（濡れた舗装路の下りスリップ注意）",
    features: "薬王院を通る最も定番のコース。全線舗装されており街灯もあります。スニーカーでも登頂可能ですが、雨上がりの下り舗装路は苔や濡れた路面で滑りやすいため歩行に注意が必要です。"
  },
  {
    id: "route-6",
    name: "6号路（琵琶滝・沢コース）",
    distance_km: 3.3,
    elevation_gain_m: 390,
    estimated_time_up_min: 90,
    paved_ratio: 0.0,
    difficulty: "intermediate",
    footwear_normal: "登山靴・トレッキングシューズ推奨",
    footwear_rain: "登山靴必須（スニーカー不可）",
    features: "沢沿いを歩く自然豊かなコース。山頂手前には沢の中の飛び石を渡る区間があり、雨の後や降水時は増水・泥濘化します。防水性のある登山靴が必須となります。"
  },
  {
    id: "route-inari",
    name: "稲荷山コース（尾根コース）",
    distance_km: 3.1,
    elevation_gain_m: 400,
    estimated_time_up_min: 90,
    paved_ratio: 0.0,
    difficulty: "intermediate",
    footwear_normal: "トレッキングシューズ推奨",
    footwear_rain: "登山靴必須（赤土が猛烈に滑る）",
    features: "南側の尾根を登る見晴らしの良いコース。未舗装の山道で、木の根の段差や階段が続きます。土質が赤土（関東ローム層）のため、雨の後や霜柱が解けた後は非常に滑りやすく転倒リスクが高まります。"
  },
  {
    id: "route-jinba",
    name: "高尾山〜陣馬山縦走コース",
    distance_km: 15.3,
    elevation_gain_m: 1050,
    estimated_time_up_min: 330,
    paved_ratio: 0.05,
    difficulty: "advanced",
    footwear_normal: "本格登山靴必須",
    footwear_rain: "本格登山靴＋完全雨具必須",
    features: "城山・小仏峠・景信山・陣馬山を巡る本格的な縦走トレイル。歩行時間5時間以上を要し、途中で体調不良や日没を迎えるとエスケープが困難です。防寒着・雨具・ヘッドライト・行動食の携行が必須です。"
  }
];

const layeringPresets = {
  freezing: {
    key: "freezing",
    label: "氷点下〜5℃未満（極寒・厳冬期）",
    temp_range: "5℃未満",
    base: "厚手メリノウールまたは高機能保温アンダー（長袖）",
    mid: "厚手フリースまたは軽量インサレーションジャケット",
    outer: "防風・防寒ジャケット（ダウンまたはハードシェル）",
    gear: ["防風・保温グローブ", "ニット帽/耳あて", "ネックゲイター", "軽アイゼン/滑り止め（凍結時）"]
  },
  cold: {
    key: "cold",
    label: "5℃〜10℃未満（晩秋・初春）",
    temp_range: "5℃〜10℃",
    base: "吸汗速乾長袖ベースレイヤー（ウール混紡推奨）",
    mid: "薄手フリースまたはアクティブインサレーション",
    outer: "ウィンドブレーカーまたはレインジャケット",
    gear: ["薄手グローブ", "防寒用キャップ", "ネックウォーマー"]
  },
  mild: {
    key: "mild",
    label: "10℃〜18℃未満（春・秋の快適登山）",
    temp_range: "10℃〜18℃",
    base: "吸汗速乾長袖シャツ（化繊または薄手ウール）",
    mid: "薄手フリース（行動中は脱ぎ、山頂休憩時に着用）",
    outer: "軽量ウィンドブレーカー（山頂の風冷え対策に携行）",
    gear: ["日除けキャップ", "予備の着替えTシャツ"]
  },
  warm: {
    key: "warm",
    label: "18℃以上（初夏〜夏）",
    temp_range: "18℃以上",
    base: "高通気・吸汗速乾半袖Tシャツ（化繊）",
    mid: "不要",
    outer: "携帯用超軽量ウィンドブレーカー（雨天・強風時の備え）",
    gear: ["水分1.5L以上", "塩分補給タブレット", "日焼け止め", "虫除け"]
  }
};

async function main() {
  await mkdir(outputDir, { recursive: true });

  // 2024年の年間データ（うるう年: 366日 = 8784時間）
  const startDate = "2024-01-01";
  const endDate = "2024-12-31";

  const [takaoHourly, hachiojiHourly, tokyoHourly] = await Promise.all([
    fetchHourly(coords.takao_summit.latitude, coords.takao_summit.longitude, coords.takao_summit.elevation, startDate, endDate),
    fetchHourly(coords.hachioji.latitude, coords.hachioji.longitude, coords.hachioji.elevation, startDate, endDate),
    fetchHourly(coords.tokyo.latitude, coords.tokyo.longitude, coords.tokyo.elevation, startDate, endDate),
  ]);

  const numHours = takaoHourly.time.length;
  console.log(`Processing ${numHours} hours of data...`);

  // 日別集計と月別集計の準備
  const dailyData = [];
  let currentDay = null;
  let dayHours = [];

  for (let i = 0; i < numHours; i++) {
    const timeStr = takaoHourly.time[i]; // "2024-01-01T00:00"
    const dayStr = timeStr.slice(0, 10);
    const hour = parseInt(timeStr.slice(11, 13), 10);

    const pt = {
      time: timeStr,
      hour,
      takao: {
        temp: takaoHourly.temperature_2m[i],
        at: takaoHourly.apparent_temperature[i],
        precip: takaoHourly.precipitation[i],
        wind: takaoHourly.wind_speed_10m[i],
        rh: takaoHourly.relative_humidity_2m[i],
      },
      hachioji: {
        temp: hachiojiHourly.temperature_2m[i],
        at: hachiojiHourly.apparent_temperature[i],
        precip: hachiojiHourly.precipitation[i],
        wind: hachiojiHourly.wind_speed_10m[i],
      },
      tokyo: {
        temp: tokyoHourly.temperature_2m[i],
        at: tokyoHourly.apparent_temperature[i],
      }
    };

    if (!currentDay || currentDay !== dayStr) {
      if (dayHours.length > 0) {
        dailyData.push(summarizeDay(currentDay, dayHours));
      }
      currentDay = dayStr;
      dayHours = [pt];
    } else {
      dayHours.push(pt);
    }
  }
  if (dayHours.length > 0) {
    dailyData.push(summarizeDay(currentDay, dayHours));
  }

  function summarizeDay(dateStr, hours) {
    const month = parseInt(dateStr.slice(5, 7), 10);
    const takaoTemps = hours.map((h) => h.takao.temp);
    const takaoAts = hours.map((h) => h.takao.at);
    const takaoWinds = hours.map((h) => h.takao.wind);
    const takaoPrecipSum = hours.reduce((s, h) => s + h.takao.precip, 0);

    const hachiojiTemps = hours.map((h) => h.hachioji.temp);
    const hachiojiAts = hours.map((h) => h.hachioji.at);

    // 昼12時の体感
    const h12 = hours.find((h) => h.hour === 12) || hours[12];
    const h08 = hours.find((h) => h.hour === 8) || hours[8];

    return {
      date: dateStr,
      month,
      takao_min_temp: Math.min(...takaoTemps),
      takao_max_temp: Math.max(...takaoTemps),
      takao_avg_temp: takaoTemps.reduce((a, b) => a + b, 0) / takaoTemps.length,
      takao_min_at: Math.min(...takaoAts),
      takao_max_at: Math.max(...takaoAts),
      takao_avg_at: takaoAts.reduce((a, b) => a + b, 0) / takaoAts.length,
      takao_avg_wind: takaoWinds.reduce((a, b) => a + b, 0) / takaoWinds.length,
      takao_precip_sum: takaoPrecipSum,
      takao_midday_at: h12 ? h12.takao.at : 0,
      takao_midday_temp: h12 ? h12.takao.temp : 0,
      takao_morning_at: h08 ? h08.takao.at : 0,

      hachioji_avg_temp: hachiojiTemps.reduce((a, b) => a + b, 0) / hachiojiTemps.length,
      hachioji_avg_at: hachiojiAts.reduce((a, b) => a + b, 0) / hachiojiAts.length,
      hachioji_midday_temp: h12 ? h12.hachioji.temp : 0,
      hachioji_midday_at: h12 ? h12.hachioji.at : 0,

      tokyo_midday_temp: h12 ? h12.tokyo.temp : 0,
      tokyo_midday_at: h12 ? h12.tokyo.at : 0,
    };
  }

  // 判定フラグ計算（前日データ参照のためループ処理）
  for (let i = 0; i < dailyData.length; i++) {
    const day = dailyData[i];
    const prevDay = i > 0 ? dailyData[i - 1] : null;

    // 防寒着必須: 山頂の昼体感温度 < 10℃、または山頂最低体感温度 < 8℃
    day.warm_clothes_required = day.takao_midday_at < 10 || day.takao_min_at < 8;

    // レインウェア必須: 当日降水量合計 >= 1.0mm
    day.rainwear_required = day.takao_precip_sum >= 1.0;

    // 軽アイゼン/滑り止め警戒: 冬季（12, 1, 2月）かつ (前日降水 >= 1mm または 当日降水 >= 0.5mm) かつ 最低気温 < 0℃
    const isWinter = day.month === 12 || day.month === 1 || day.month === 2;
    const hadRecentPrecip = (prevDay && prevDay.takao_precip_sum >= 1.0) || day.takao_precip_sum >= 0.5;
    day.crampons_caution = isWinter && hadRecentPrecip && day.takao_min_temp < 0;

    // 泥濘化リスク（未舗装路の滑り・登山靴必須）: 前日降水 >= 5mm または 当日降水 >= 3mm
    day.mud_risk = (prevDay && prevDay.takao_precip_sum >= 5.0) || day.takao_precip_sum >= 3.0;
  }

  // 月別集計（1〜12月）
  const monthlyComparison = [];
  const monthlyGearDays = [];

  for (let m = 1; m <= 12; m++) {
    const mDays = dailyData.filter((d) => d.month === m);
    const count = mDays.length;

    const round1 = (val) => Math.round(val * 10) / 10;

    const takao_avg_temp = round1(mDays.reduce((s, d) => s + d.takao_avg_temp, 0) / count);
    const takao_avg_at = round1(mDays.reduce((s, d) => s + d.takao_avg_at, 0) / count);
    const takao_midday_temp = round1(mDays.reduce((s, d) => s + d.takao_midday_temp, 0) / count);
    const takao_midday_at = round1(mDays.reduce((s, d) => s + d.takao_midday_at, 0) / count);
    const takao_morning_at = round1(mDays.reduce((s, d) => s + d.takao_morning_at, 0) / count);
    const takao_avg_wind = round1(mDays.reduce((s, d) => s + d.takao_avg_wind, 0) / count);

    const hachioji_midday_temp = round1(mDays.reduce((s, d) => s + d.hachioji_midday_temp, 0) / count);
    const hachioji_midday_at = round1(mDays.reduce((s, d) => s + d.hachioji_midday_at, 0) / count);

    const tokyo_midday_temp = round1(mDays.reduce((s, d) => s + d.tokyo_midday_temp, 0) / count);
    const tokyo_midday_at = round1(mDays.reduce((s, d) => s + d.tokyo_midday_at, 0) / count);

    monthlyComparison.push({
      month: m,
      month_name: `${m}月`,
      takao: {
        avg_temp: takao_avg_temp,
        avg_apparent_temp: takao_avg_at,
        midday_temp: takao_midday_temp,
        midday_apparent_temp: takao_midday_at,
        morning_apparent_temp: takao_morning_at,
        avg_wind_speed: takao_avg_wind,
      },
      hachioji: {
        midday_temp: hachioji_midday_temp,
        midday_apparent_temp: hachioji_midday_at,
      },
      tokyo: {
        midday_temp: tokyo_midday_temp,
        midday_apparent_temp: tokyo_midday_at,
      },
      gap: {
        temp_gap: round1(takao_midday_temp - hachioji_midday_temp),
        apparent_gap: round1(takao_midday_at - hachioji_midday_at),
        tokyo_apparent_gap: round1(takao_midday_at - tokyo_midday_at),
        departure_gap: round1(takao_midday_at - hachioji_midday_temp),
      },
    });

    const warm_clothes_days = mDays.filter((d) => d.warm_clothes_required).length;
    const rainwear_days = mDays.filter((d) => d.rainwear_required).length;
    const crampons_days = mDays.filter((d) => d.crampons_caution).length;
    const mud_risk_days = mDays.filter((d) => d.mud_risk).length;

    monthlyGearDays.push({
      month: m,
      month_name: `${m}月`,
      total_days: count,
      warm_clothes_days,
      rainwear_days,
      crampons_days,
      mud_risk_days,
    });
  }

  const gearDaysSummary = {
    total_days: dailyData.length,
    warm_clothes_required_days: dailyData.filter((d) => d.warm_clothes_required).length,
    rainwear_required_days: dailyData.filter((d) => d.rainwear_required).length,
    crampons_caution_days: dailyData.filter((d) => d.crampons_caution).length,
    mud_risk_days: dailyData.filter((d) => d.mud_risk).length,
    monthly_gear_days: monthlyGearDays,
  };

  const bundle = {
    bundle_version: "2026-09-17.r1",
    bundle_schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    attribution: {
      source_name: "Open-Meteo Historical Weather API & 気象庁アメダス八王子",
      source_url: "https://open-meteo.com/",
      processing_ja: "高尾山頂（標高599m）、八王子（標高123m）、東京都心（標高25m）の気象モデル・観測値（2024年1時間値）から、月別体感温度・風速・ギャップおよび山装備必須日数を集計。"
    },
    coordinates: coords,
    routes,
    layering_presets: layeringPresets,
    monthly_comparison: monthlyComparison,
    gear_days_summary: gearDaysSummary,
  };

  const bundleJsonText = JSON.stringify(bundle, null, 2);
  const bundleBuffer = Buffer.from(bundleJsonText, "utf8");
  const bundleSha256 = createHash("sha256").update(bundleBuffer).digest("hex");
  const bundleByteSize = bundleBuffer.byteLength;

  const lock = {
    lock_schema_version: "1.0.0",
    bundle_file: bundleFileName,
    bundle_version: bundle.bundle_version,
    bundle_schema_version: bundle.bundle_schema_version,
    bundle_byte_size: bundleByteSize,
    bundle_sha256: bundleSha256,
  };

  await writeFile(join(outputDir, bundleFileName), bundleBuffer);
  await writeFile(join(outputDir, lockFileName), JSON.stringify(lock, null, 2), "utf8");

  console.log(`Bundle generated successfully:`);
  console.log(`  File: ${bundleFileName}`);
  console.log(`  Byte size: ${bundleByteSize}`);
  console.log(`  SHA-256: ${bundleSha256}`);
  console.log(`  Warm clothes days: ${gearDaysSummary.warm_clothes_required_days} / ${gearDaysSummary.total_days}`);
  console.log(`  Rainwear days: ${gearDaysSummary.rainwear_required_days} / ${gearDaysSummary.total_days}`);
  console.log(`  Crampons caution days: ${gearDaysSummary.crampons_caution_days} / ${gearDaysSummary.total_days}`);
}

main().catch((err) => {
  console.error("Error generating bundle:", err);
  process.exit(1);
});
