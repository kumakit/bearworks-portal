"use client";

import React, { useId, useMemo, useState } from "react";
import { monthNames } from "@/lib/takao-weather-publication";

type TimeSlotKey = "morning" | "midday" | "afternoon" | "evening";
type WeatherConditionKey = "clear_north" | "sunny_south" | "cloudy" | "rainy";
type RouteChoiceKey = "omotesando" | "trail" | "traverse";

const timeSlots: { key: TimeSlotKey; label: string; desc: string }[] = [
  { key: "morning", label: "朝（8:00〜11:00）", desc: "大気が最も安定しやすい時間帯" },
  { key: "midday", label: "昼（11:00〜14:00）", desc: "気温上昇に伴い上昇気流が発達" },
  { key: "afternoon", label: "午後（14:00〜17:00）", desc: "夏の熱雷・夕立・急変ピーク" },
  { key: "evening", label: "夕刻（17:00以降）", desc: "日没後の急激な冷え込みと視界喪失" },
];

const weatherConditions: { key: WeatherConditionKey; label: string; sub: string }[] = [
  { key: "clear_north", label: "快晴・北寄りの風", sub: "乾燥した高気圧圏内（安定天候）" },
  { key: "sunny_south", label: "晴れ・南〜南東の風", sub: "東京湾・相模湾の湿った気流（要注意）" },
  { key: "cloudy", label: "曇り・湿度高め", sub: "平野の雲底が低く、山頂はすでにガス圏内" },
  { key: "rainy", label: "雨・気圧の谷", sub: "平地小雨でも山頂は強風・豪雨・雪の危険" },
];

const routeChoices: { key: RouteChoiceKey; label: string; sub: string }[] = [
  { key: "omotesando", label: "1号路（表参道・舗装路）", sub: "ケーブルカー併用可・街灯あり" },
  { key: "trail", label: "6号路・稲荷山（山道・沢沿い）", sub: "未舗装・急変時の増水や赤土スリップ" },
  { key: "traverse", label: "陣馬山・小仏縦走（長距離）", sub: "逃げ場が少なく行動時間が長い" },
];

export function TakaoWeatherRiskMeter() {
  const monthSelectId = useId();
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Default: July
  const [selectedTime, setSelectedTime] = useState<TimeSlotKey>("afternoon");
  const [selectedWeather, setSelectedWeather] = useState<WeatherConditionKey>("sunny_south");
  const [selectedRoute, setSelectedRoute] = useState<RouteChoiceKey>("trail");

  // Calculate dynamic risk score and warning indicators
  const result = useMemo(() => {
    let score = 20; // baseline
    const warnings: string[] = [];
    const actions: string[] = [];

    const isSummer = selectedMonth >= 6 && selectedMonth <= 9;
    const isWinter = selectedMonth === 12 || selectedMonth === 1 || selectedMonth === 2;
    const isSpringAutumn = !isSummer && !isWinter;

    // Month factors
    if (isSummer) score += 15;
    if (selectedMonth === 6 || selectedMonth === 9) score += 10; // Rain front months

    // Weather condition factors
    if (selectedWeather === "sunny_south") {
      score += 25;
      warnings.push("【見せかけの晴れ注意】平野は晴れていても、南東の湿った風が山肌にぶつかり山頂は湿度95%以上の濃霧（ガス）になる確率が跳ね上がります。");
    } else if (selectedWeather === "cloudy") {
      score += 20;
      warnings.push("【雲中行動リスク】山頂はすでに雲底の内側に入っている可能性大。視界不良と衣類のガス濡れに警戒してください。");
    } else if (selectedWeather === "rainy") {
      score += 35;
      warnings.push("【悪天候警報】降水時の山頂は強風と低温が重なります。未舗装路は滑落リスクが高まります。");
    } else {
      score -= 10; // clear_north is dry and stable
    }

    // Time slot factors
    if (selectedTime === "afternoon") {
      if (isSummer) {
        score += 25;
        warnings.push("【午後発雷・ゲリラ雷雨ピーク】夏期の14〜17時は熱雷による降水確率が午前の2倍（40%超）に達します。");
      } else {
        score += 10;
      }
    } else if (selectedTime === "evening") {
      score += 20;
      warnings.push("【日没・急冷アラート】日没とともに気温が急降下し、ガスが発生するとヘッドライトの光が乱反射して道迷い遭難が発生します。");
    } else if (selectedTime === "morning") {
      score -= 10;
    }

    // Route factors
    if (selectedRoute === "traverse") {
      score += 15;
      warnings.push("【エスケープ困難】陣馬縦走は稜線が吹きさらしとなり、急変時の撤退に数時間要します。");
    } else if (selectedRoute === "trail") {
      score += 5;
    }

    // Winter rain/snow border check
    if (isWinter && (selectedWeather === "rainy" || selectedWeather === "cloudy")) {
      warnings.push("【雨雪境界（氷点下・アイスバーン）】八王子で気温3℃の冷たい雨でも、標高差による気温減率で山頂は0℃以下の湿雪または夜間凍結になります。");
      actions.push("チェーンスパイクまたは軽アイゼンの携行が必須です。");
    }

    // Clamp score 5..98
    score = Math.max(5, Math.min(98, score));

    // Determine category
    let levelCode: "safe" | "notice" | "warning" | "danger" = "safe";
    let levelLabel = "安定・低リスク";
    let levelColor = "emerald";

    if (score >= 75) {
      levelCode = "danger";
      levelLabel = "危険・荒天急変警戒";
      levelColor = "rose";
    } else if (score >= 55) {
      levelCode = "warning";
      levelLabel = "午後急変警戒（熱雷・豪雨）";
      levelColor = "orange";
    } else if (score >= 35) {
      levelCode = "notice";
      levelLabel = "ガス注意（見せかけの晴れ）";
      levelColor = "amber";
    }

    // Actions
    if (score >= 55) {
      actions.push("午前11時〜正午までに山頂到着・下山を開始するタイムスケジュールに変更してください。");
      actions.push("レインウェア上下（完全防水透湿素材）とザックカバーを常時携帯してください。");
      actions.push("雷鳴が聞こえたら山頂のあずまや（東屋）に留まらず、電波塔・高い木から離れて舗装路（1号路）で早急に下山してください。");
    } else if (score >= 35) {
      actions.push("平野の晴天に騙されず、防風シェルまたは薄手のレインジャケットを携帯してください。");
      actions.push("濃霧による濡れ（ガス濡れ）を防ぐため、綿素材の衣服は避け速乾インナーを着用してください。");
    } else {
      actions.push("天候は比較的安定していますが、標高差による体感温度低下に備えウィンドブレーカーをお持ちください。");
    }

    return {
      score,
      levelCode,
      levelLabel,
      levelColor,
      warnings,
      actions,
    };
  }, [selectedMonth, selectedTime, selectedWeather, selectedRoute]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-white">
            ⚡
          </span>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            高尾山 天候急変・ガス発生リスク判定メーター
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          登山予定月、時間帯、平野部の天気予報を選択すると、山頂の「見せかけの晴れ確率」「午後雷雨危険度」をリアルタイムに診断します。
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Month Selection */}
        <div>
          <label htmlFor={monthSelectId} className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase">
            ① 登山予定月
          </label>
          <select
            id={monthSelectId}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name} {i + 1 >= 6 && i + 1 <= 9 ? "（夏期急変シーズン）" : (i + 1 === 12 || i + 1 <= 2) ? "（雨雪境界シーズン）" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Time Slot Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase">
            ② 行動時間帯
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value as TimeSlotKey)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {timeSlots.map((ts) => (
              <option key={ts.key} value={ts.key}>
                {ts.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Base Weather Forecast */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase">
            ③ 麓（平野部）の予報
          </label>
          <select
            value={selectedWeather}
            onChange={(e) => setSelectedWeather(e.target.value as WeatherConditionKey)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {weatherConditions.map((wc) => (
              <option key={wc.key} value={wc.key}>
                {wc.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Route Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase">
            ④ 予定ルート
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value as RouteChoiceKey)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {routeChoices.map((rc) => (
              <option key={rc.key} value={rc.key}>
                {rc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meter Display Result */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Gauge & Score */}
          <div className="flex items-center gap-5">
            {/* Visual Circular/Badge Indicator */}
            <div
              className={`flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 shadow-inner transition-colors ${
                result.levelCode === "danger"
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : result.levelCode === "warning"
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : result.levelCode === "notice"
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-emerald-400 bg-emerald-50 text-emerald-700"
              }`}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase">急変危険度</span>
              <span className="text-3xl font-black">{result.score}</span>
              <span className="text-[10px] font-bold">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                    result.levelCode === "danger"
                      ? "bg-rose-600"
                      : result.levelCode === "warning"
                      ? "bg-orange-600"
                      : result.levelCode === "notice"
                      ? "bg-amber-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {result.levelLabel}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                選択条件：<strong>{monthNames[selectedMonth - 1]}</strong> /{" "}
                <strong>{timeSlots.find((t) => t.key === selectedTime)?.label}</strong> /{" "}
                <strong>{weatherConditions.find((w) => w.key === selectedWeather)?.label}</strong>
              </p>
            </div>
          </div>

          {/* Linear Meter Bar */}
          <div className="w-full lg:max-w-xs">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>0 (安全)</span>
              <span>50 (注意)</span>
              <span>100 (極めて危険)</span>
            </div>
            <div className="mt-1.5 h-3.5 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.levelCode === "danger"
                    ? "bg-rose-600"
                    : result.levelCode === "warning"
                    ? "bg-orange-500"
                    : result.levelCode === "notice"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${result.score}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Warnings Alert Box */}
        {result.warnings.length > 0 && (
          <div className="mt-5 space-y-2">
            {result.warnings.map((warn, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed font-medium text-amber-950"
              >
                {warn}
              </div>
            ))}
          </div>
        )}

        {/* Action Guidelines */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
            🛡️ この条件での推奨行動・必須ギア
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {result.actions.map((act, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold text-amber-600">✓</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
