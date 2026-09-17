"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  Compass,
  Footprints,
  Info,
  Layers,
  MapPin,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import type {
  LayeringPreset,
  MonthlyComparisonRow,
  RouteItem,
} from "@/lib/takao-gear-publication";
import {
  layeringPresets,
  monthlyComparison,
  routes,
} from "@/lib/takao-gear-publication";

interface SimulatorProps {
  initialMonth?: number;
}

export default function TakaoGearSimulator({ initialMonth = 10 }: SimulatorProps) {
  const currentMonthId = useId();
  const timeOfDayId = useId();
  const routeSelectId = useId();
  const cableCarId = useId();

  // 入力ステート
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "midday" | "evening">("midday");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-1");
  const [useCableCar, setUseCableCar] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<"sunny" | "cloudy" | "rainy">("sunny");
  const [hadRecentRain, setHadRecentRain] = useState<boolean>(false);

  // チェックリストのローカル状態
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 選択されたルートデータ
  const currentRoute = useMemo<RouteItem>(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0];
  }, [selectedRouteId]);

  // 選択された月の気候データ
  const monthData = useMemo<MonthlyComparisonRow>(() => {
    return monthlyComparison.find((m) => m.month === selectedMonth) || monthlyComparison[9]; // 10月
  }, [selectedMonth]);

  // 気温・体感温度の動的計算
  const calculatedWeather = useMemo(() => {
    // 基準は昼の気温
    let baseHachiojiTemp = monthData.hachioji.midday_temp;
    let baseTakaoTemp = monthData.takao.midday_temp;
    let baseWind = monthData.takao.avg_wind_speed;

    // 時間帯補正
    if (timeOfDay === "morning") {
      baseHachiojiTemp -= 3.5;
      baseTakaoTemp -= 3.5;
      baseWind = Math.max(1.5, baseWind - 0.8);
    } else if (timeOfDay === "evening") {
      baseHachiojiTemp -= 2.0;
      baseTakaoTemp -= 2.2;
      baseWind = Math.max(2.0, baseWind + 0.5);
    }

    // 天候補正（雨天や曇天での日射減・風速変化）
    if (weatherCondition === "cloudy") {
      baseHachiojiTemp -= 1.0;
      baseTakaoTemp -= 1.0;
    } else if (weatherCondition === "rainy") {
      baseHachiojiTemp -= 2.5;
      baseTakaoTemp -= 2.8;
      baseWind += 1.5;
    }

    // 体感温度 (BOM近似式: 風速1m/sごとに約1℃低下 + 湿度影響)
    // AT = T - 0.7 * wind (簡易近似)
    const takaoApparent = Math.round((baseTakaoTemp - 0.7 * baseWind) * 10) / 10;
    const hachiojiApparent = Math.round((baseHachiojiTemp - 0.3 * 2.0) * 10) / 10;
    const gap = Math.round((takaoApparent - baseHachiojiTemp) * 10) / 10;

    return {
      hachiojiTemp: Math.round(baseHachiojiTemp * 10) / 10,
      hachiojiApparent,
      takaoTemp: Math.round(baseTakaoTemp * 10) / 10,
      takaoApparent,
      takaoWind: Math.round(baseWind * 10) / 10,
      gap,
    };
  }, [monthData, timeOfDay, weatherCondition]);

  // レイヤリング判定
  const layering = useMemo<LayeringPreset>(() => {
    const at = calculatedWeather.takaoApparent;
    if (at < 5) return layeringPresets.freezing;
    if (at < 10) return layeringPresets.cold;
    if (at < 18) return layeringPresets.mild;
    return layeringPresets.warm;
  }, [calculatedWeather.takaoApparent]);

  // 装備判定フラグ
  const gearFlags = useMemo(() => {
    const isWinter = selectedMonth === 12 || selectedMonth === 1 || selectedMonth === 2;
    const isJinba = currentRoute.id === "route-jinba";
    const isTrail = currentRoute.id === "route-6" || currentRoute.id === "route-inari";
    const isRain = weatherCondition === "rainy";

    // 防寒着
    const needsWarmClothes = calculatedWeather.takaoApparent < 10;

    // レインウェア
    const needsRainwear = isRain || isJinba;

    // 軽アイゼン/滑り止め
    const needsCrampons = isWinter && (isRain || hadRecentRain) && calculatedWeather.takaoTemp <= 2;

    // 靴判定
    let footwearStatus: "sneaker_ok" | "trail_shoes_recommended" | "hiking_boots_required" = "sneaker_ok";
    let footwearReason = "";

    if (isJinba) {
      footwearStatus = "hiking_boots_required";
      footwearReason = "15km超の本格山岳縦走のため、足首を保護し剛性のある登山靴が必須です。";
    } else if (isTrail) {
      if (isRain || hadRecentRain) {
        footwearStatus = "hiking_boots_required";
        footwearReason =
          currentRoute.id === "route-6"
            ? "雨・雨後は沢の飛び石が増水し泥濘化するため、防水の登山靴が必須です。"
            : "雨・雨後は赤土（粘土質）が猛烈に滑り転倒しやすいため、グリップのある登山靴が必須です。";
      } else {
        footwearStatus = "trail_shoes_recommended";
        footwearReason = "木の根や不整地が続くため、滑りにくいトレッキングシューズまたはトレランシューズを推奨します。";
      }
    } else {
      // 1号路
      if (isRain) {
        footwearStatus = "trail_shoes_recommended";
        footwearReason = "全線舗装されていますが、雨天の下り坂は苔や濡れたコンクリートで滑りやすくなります。防滑ソールの靴を推奨します。";
      } else {
        footwearStatus = "sneaker_ok";
        footwearReason = "全線舗装路のため、歩き慣れた通常のスニーカーでも問題なく登頂可能です。";
      }
    }

    return {
      needsWarmClothes,
      needsRainwear,
      needsCrampons,
      footwearStatus,
      footwearReason,
    };
  }, [selectedMonth, currentRoute, weatherCondition, hadRecentRain, calculatedWeather]);

  // 持ち物チェックリストの構築
  const checklist = useMemo(() => {
    const list: Array<{ id: string; name: string; required: boolean; note: string }> = [];

    // 靴
    if (gearFlags.footwearStatus === "hiking_boots_required") {
      list.push({ id: "boots", name: "ミッドカット登山靴（防水）", required: true, note: gearFlags.footwearReason });
    } else if (gearFlags.footwearStatus === "trail_shoes_recommended") {
      list.push({ id: "boots", name: "トレッキングシューズ（または防滑スニーカー）", required: false, note: gearFlags.footwearReason });
    } else {
      list.push({ id: "boots", name: "歩き慣れたスニーカー", required: false, note: gearFlags.footwearReason });
    }

    // レインウェア
    if (gearFlags.needsRainwear) {
      list.push({
        id: "rainwear",
        name: "レインウェア上下（防水透湿・ゴアテックス等）",
        required: true,
        note: "雨天時だけでなく、急な悪天候や強風時の最終防寒シェルとしても不可欠です。",
      });
    } else {
      list.push({
        id: "rainwear",
        name: "折りたたみ傘 または 軽量レインジャケット",
        required: false,
        note: "山の天候急変に備えてザックに忍ばせておくと安心です。",
      });
    }

    // 防寒着
    if (gearFlags.needsWarmClothes) {
      list.push({
        id: "warm",
        name: "防寒着（フリース・インサレーション・ダウン）",
        required: true,
        note: `山頂体感温度が${calculatedWeather.takaoApparent}℃と10℃未満のため、立ち止まると急速に冷え込みます。`,
      });
    } else {
      list.push({
        id: "warm",
        name: "薄手の羽織りもの（ウィンドブレーカー）",
        required: false,
        note: "風が吹いた際の汗冷え防止にあると快適です。",
      });
    }

    // 軽アイゼン
    if (gearFlags.needsCrampons) {
      list.push({
        id: "crampons",
        name: "軽アイゼン（チェーンスパイク）",
        required: true,
        note: "日陰や木の階段が凍結している恐れがあります。携行しないと下山困難になります。",
      });
    }

    // 水分
    const waterAmt = currentRoute.id === "route-jinba" ? "1.5L〜2.0L" : "500ml〜1.0L";
    list.push({
      id: "water",
      name: `水分・飲料（${waterAmt}）`,
      required: true,
      note: currentRoute.id === "route-jinba" ? "縦走区間は自販機が限られます。" : "熱中症予防・脱水防止のため必須です。",
    });

    // ヘッドライト
    if (currentRoute.id === "route-jinba" || timeOfDay === "evening") {
      list.push({
        id: "headlamp",
        name: "ヘッドランプ（予備電池含む）",
        required: true,
        note: "山の日没は平地より早く、樹林帯は真っ暗になります。スマホのライトはバッテリー切れリスク大。",
      });
    }

    // 行動食
    list.push({
      id: "snacks",
      name: "行動食・非常食（チョコ・羊羹・ナッツ等）",
      required: currentRoute.id === "route-jinba",
      note: "シャリバテ（エネルギー切れによる行動不能）を防ぎます。",
    });

    // モバイルバッテリー
    list.push({
      id: "powerbank",
      name: "モバイルバッテリー",
      required: false,
      note: "地図アプリや緊急連絡用。寒冷期はスマホバッテリー消費が加速します。",
    });

    return list;
  }, [gearFlags, calculatedWeather, currentRoute, timeOfDay]);

  return (
    <div className="space-y-6">
      {/* 入力フォーム */}
      <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 md:text-xl">
            <Compass className="h-5 w-5 text-emerald-600" />
            登山条件の選択
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            条件変更で即時再計算
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 月選択 */}
          <div>
            <label htmlFor={currentMonthId} className="block text-xs font-bold text-slate-700">登山月</label>
            <div className="relative mt-1.5">
              <select
                id={currentMonthId}
                aria-label="登山月"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}月 ({m >= 6 && m <= 8 ? "夏" : m >= 12 || m <= 2 ? "冬" : m >= 3 && m <= 5 ? "春" : "秋"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* 時間帯 */}
          <div>
            <label htmlFor={timeOfDayId} className="block text-xs font-bold text-slate-700">山頂到達の時間帯</label>
            <div className="relative mt-1.5">
              <select
                id={timeOfDayId}
                aria-label="山頂到達の時間帯"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as "morning" | "midday" | "evening")}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="morning">朝（07:00〜09:00 冷え込み注意）</option>
                <option value="midday">日中（11:00〜14:00 標準）</option>
                <option value="evening">夕方（15:00以降 日没・急冷注意）</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* ルート選択 */}
          <div>
            <label htmlFor={routeSelectId} className="block text-xs font-bold text-slate-700">選択ルート</label>
            <div className="relative mt-1.5">
              <select
                id={routeSelectId}
                aria-label="選択ルート"
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* 登山形態 */}
          <div>
            <label htmlFor={cableCarId} className="block text-xs font-bold text-slate-700">ケーブルカー利用</label>
            <div className="relative mt-1.5">
              <select
                id={cableCarId}
                aria-label="ケーブルカー利用"
                value={useCableCar ? "yes" : "no"}
                onChange={(e) => setUseCableCar(e.target.value === "yes")}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="no">徒歩登頂（麓から全工程歩行）</option>
                <option value="yes">利用する（高尾山駅472mまでワープ）</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* 天候・路面オプション */}
        <div className="mt-1 flex flex-wrap items-center gap-4 rounded-2xl bg-white/80 p-3 text-xs text-slate-700">
          <span className="font-bold text-slate-900">天候・路面状況:</span>
          <div className="flex items-center gap-2">
            {(["sunny", "cloudy", "rainy"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeatherCondition(w)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  weatherCondition === w
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {w === "sunny" ? "晴れ" : w === "cloudy" ? "くもり" : "雨 / 小雨"}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-800">
            <input
              type="checkbox"
              checked={hadRecentRain}
              onChange={(e) => setHadRecentRain(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            前日にまとまった雨が降った（路面ぬかるみ）
          </label>
        </div>
      </div>

      {/* 気象ギャップと警告カード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 麓の気温 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">麓（八王子駅・登山口）</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{calculatedWeather.hachiojiTemp}</span>
            <span className="text-base font-bold text-slate-500">℃</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            出発時の街の気温（体感 {calculatedWeather.hachiojiApparent}℃）
          </p>
        </div>

        {/* 山頂の気温 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">高尾山頂（標高599m）気温</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-sky-700">{calculatedWeather.takaoTemp}</span>
            <span className="text-base font-bold text-slate-500">℃</span>
          </div>
          <p className="mt-1 text-xs text-sky-700">
            標高差476mで約 {(calculatedWeather.takaoTemp - calculatedWeather.hachiojiTemp).toFixed(1)}℃ 低下
          </p>
        </div>

        {/* 山頂の体感温度 */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800">山頂の体感温度 (AT)</p>
            <Wind className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-emerald-900">{calculatedWeather.takaoApparent}</span>
            <span className="text-base font-bold text-emerald-700">℃</span>
          </div>
          <p className="mt-1 text-xs font-medium text-emerald-800">
            平均風速 {calculatedWeather.takaoWind} m/s による風冷え加味
          </p>
        </div>

        {/* 麓との体感ギャップ */}
        <div className={`rounded-2xl border p-4 shadow-sm ${
          Math.abs(calculatedWeather.gap) >= 7
            ? "border-rose-200 bg-rose-50/70 text-rose-950"
            : "border-amber-200 bg-amber-50/70 text-amber-950"
        }`}>
          <p className="text-xs font-bold">麓出発時との体感ギャップ</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">
              {calculatedWeather.gap > 0 ? `+${calculatedWeather.gap}` : calculatedWeather.gap}
            </span>
            <span className="text-base font-bold">℃</span>
          </div>
          <p className="mt-1 text-xs">
            {Math.abs(calculatedWeather.gap) >= 7
              ? "「街の感覚」で登ると猛烈に冷え込みます！"
              : "山頂での休憩時は1枚羽織る準備を。"}
          </p>
        </div>
      </div>

      {/* 装備判定バッジ群 */}
      <div className="flex flex-wrap gap-2.5">
        {/* 靴 */}
        {gearFlags.footwearStatus === "sneaker_ok" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            スニーカー登頂OK（1号路舗装路）
          </span>
        )}
        {gearFlags.footwearStatus === "trail_shoes_recommended" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            トレッキングシューズ推奨
          </span>
        )}
        {gearFlags.footwearStatus === "hiking_boots_required" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1.5 text-xs font-bold text-rose-800">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            防水登山靴 必須（スニーカー不可）
          </span>
        )}

        {/* 防寒着 */}
        {gearFlags.needsWarmClothes ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1.5 text-xs font-bold text-blue-800">
            <Thermometer className="h-4 w-4 text-blue-600" />
            防寒着 必須（山頂体感 10℃未満）
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
            防寒着：薄手シェル携行で可
          </span>
        )}

        {/* レインウェア */}
        {gearFlags.needsRainwear && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs font-bold text-indigo-800">
            <CloudRain className="h-4 w-4 text-indigo-600" />
            レインウェア上下 必須
          </span>
        )}

        {/* アイゼン */}
        {gearFlags.needsCrampons && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-800">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            軽アイゼン / スパイク 警戒・携行
          </span>
        )}
      </div>

      {/* レイヤリング提案 & ルート情報 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* レイヤリング推奨 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Layers className="h-5 w-5 text-emerald-600" />
              推奨レイヤリング（重ね着）
            </h4>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {layering.label}
            </span>
          </div>

          <div className="mt-4 space-y-3.5 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">アウター（最外層・防風防水）</p>
              <p className="mt-0.5 font-bold text-slate-900">{layering.outer}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">ミドルレイヤー（中間着・保温）</p>
              <p className="mt-0.5 font-bold text-slate-900">{layering.mid}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">ベースレイヤー（肌着・汗冷え防止）</p>
              <p className="mt-0.5 font-bold text-slate-900">{layering.base}</p>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700">おすすめ小物・ギア:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {layering.gear.map((g, i) => (
                  <span key={i} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 選択ルートの特性と注意点 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-emerald-600" />
              選択ルートの特性
            </h4>
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
              currentRoute.difficulty === "beginner"
                ? "bg-emerald-100 text-emerald-800"
                : currentRoute.difficulty === "intermediate"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}>
              {currentRoute.difficulty === "beginner" ? "初級" : currentRoute.difficulty === "intermediate" ? "中級" : "上級・本格山岳"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-bold text-slate-900">{currentRoute.name}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="block text-slate-400">歩行距離</span>
                <span className="text-sm font-bold text-slate-800">{currentRoute.distance_km} km</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="block text-slate-400">獲得標高</span>
                <span className="text-sm font-bold text-slate-800">+{currentRoute.elevation_gain_m} m</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="block text-slate-400">標準所要時間</span>
                <span className="text-sm font-bold text-slate-800">約 {currentRoute.estimated_time_up_min} 分</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">{currentRoute.features}</p>

            {useCableCar && currentRoute.id === "route-1" && (
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>ケーブルカー・リフト利用時は標高472mまで移動できるため、徒歩登高は約127m（約40分）に短縮されます。</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
              <p className="font-bold text-slate-700">足元の環境判定:</p>
              <p className="mt-1 text-slate-600">{gearFlags.footwearReason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 持ち物チェックリスト */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 md:text-lg">
              <Footprints className="h-5 w-5 text-emerald-600" />
              当日の持ち物チェックリスト
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              選択条件（{selectedMonth}月・{currentRoute.name}・{weatherCondition === "sunny" ? "晴" : weatherCondition === "cloudy" ? "曇" : "雨"}）に基づいた自動生成チェックリスト
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {Object.values(checkedItems).filter(Boolean).length} / {checklist.length} チェック済
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {checklist.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                  isChecked
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isChecked ? "text-emerald-950 line-through opacity-70" : "text-slate-900"}`}>
                      {item.name}
                    </span>
                    {item.required && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700">
                        必須
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{item.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
