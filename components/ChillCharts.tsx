"use client";

import { useState } from "react";
import {
  calendarDays, conditionSummary, diurnalRange, fmt, getAvailableSeasons,
  hourlyProfile, morningHistogram, signed, summary,
  type CalendarDay,
} from "@/lib/hachioji-chill-publication";

const orange = "#c2410c";
const blue = "#1d4ed8";
const ink = "#475569";
const grid = "#e2e8f0";

const buttonStyle = (active: boolean) =>
  `min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
    active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
  }`;

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
      <span className="inline-flex items-center gap-2 text-orange-800">
        <span className="h-2.5 w-4 rounded-full bg-orange-700" aria-hidden="true" />
        八王子（中央値 · 実線）
      </span>
      <span className="inline-flex items-center gap-2 text-blue-800">
        <span className="h-0.5 w-4 border-b-2 border-dashed border-blue-700" aria-hidden="true" />
        東京都心（中央値 · 破線）
      </span>
      <span className="inline-flex items-center gap-2 text-slate-600 text-xs font-normal">
        <span className="h-2.5 w-3 rounded bg-orange-200" aria-hidden="true" />
        <span className="h-2.5 w-3 rounded bg-blue-200" aria-hidden="true" />
        薄帯：25〜75%範囲
      </span>
    </div>
  );
}

/**
 * 1. 24時間気温プロファイル & 時刻別気温差チャート
 */
export function HourlyProfileChart() {
  const [selectedHour, setSelectedHour] = useState<number>(7);
  const selectedItem = hourlyProfile.find((p) => p.hour === selectedHour) || hourlyProfile[7];

  // SVG coordinate scales
  // Top chart: Temp -5 to 15℃, height 200, width 640.
  // X: hour 0..23 -> 55 to 600
  const x = (h: number) => 55 + (h / 23) * 545;
  const yTemp = (t: number) => 185 - ((t - (-2)) / 16) * 165;

  // Bottom chart: Delta -6 to +2℃, height 120.
  const yDelta = (d: number) => 310 - ((d - (-6)) / 8) * 90;

  // Build SVG paths for top chart
  const hLine = hourlyProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.hour)} ${yTemp(p.hachioji.median)}`).join(" ");
  const tLine = hourlyProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.hour)} ${yTemp(p.tokyo.median)}`).join(" ");
  const dLine = hourlyProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.hour)} ${yDelta(p.delta.median)}`).join(" ");

  // Ribbons for 25-75% range
  const hRibbon = [
    ...hourlyProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.hour)} ${yTemp(p.hachioji.q75)}`),
    ...hourlyProfile.slice().reverse().map((p) => `L ${x(p.hour)} ${yTemp(p.hachioji.q25)}`),
    "Z",
  ].join(" ");

  const tRibbon = [
    ...hourlyProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.hour)} ${yTemp(p.tokyo.q75)}`),
    ...hourlyProfile.slice().reverse().map((p) => `L ${x(p.hour)} ${yTemp(p.tokyo.q25)}`),
    "Z",
  ].join(" ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Legend />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>時刻タップ・キーボード左右キーで詳細選択</span>
        </div>
      </div>

      <figure>
        <div className="overflow-x-auto rounded-2xl bg-slate-50 p-3" tabIndex={0} role="region" aria-label="冬の24時間気温と気温差の推移グラフ。横にスクロールできます">
          <svg viewBox="0 0 650 360" className="min-w-[550px] w-full" role="img" aria-labelledby="hourly-title hourly-desc">
            <title id="hourly-title">冬の24時間気温と地点間差（八王子 − 東京都心）</title>
            <desc id="hourly-desc">
              0時から23時までの各時刻の中央値と四分位範囲。朝7時の八王子中央値{fmt(selectedItem.hachioji.median)}℃、東京都心{fmt(selectedItem.tokyo.median)}℃、差{signed(selectedItem.delta.median)}℃。
            </desc>

            {/* Morning commute highlight band (6:30 - 8:30) */}
            <rect x={x(6.5)} y={20} width={x(8.5) - x(6.5)} height={310} fill="#fef3c7" opacity={0.45} />
            <text x={(x(6.5) + x(8.5)) / 2} y={16} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#b45309">
              通勤・通学時間帯（7〜8時）
            </text>

            {/* Top Chart Grid & Labels: Temp */}
            {[-2, 2, 6, 10, 14].map((t) => (
              <g key={t}>
                <line x1="55" x2="600" y1={yTemp(t)} y2={yTemp(t)} stroke={grid} strokeWidth="1" />
                <text x="48" y={yTemp(t) + 4} textAnchor="end" fontSize="11" fill={ink}>
                  {t}℃
                </text>
              </g>
            ))}

            {/* Temperature Bands (q25-q75) */}
            <path d={hRibbon} fill={orange} opacity={0.15} />
            <path d={tRibbon} fill={blue} opacity={0.15} />

            {/* Temperature Lines */}
            <path d={hLine} fill="none" stroke={orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={tLine} fill="none" stroke={blue} strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />

            {/* Bottom Chart Divider & Grid */}
            <line x1="55" x2="600" y1="215" y2="215" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="55" y="230" fontSize="11" fontWeight="bold" fill="#334155">
              気温差（八王子 − 東京都心）
            </text>

            {[-5, -3, 0].map((d) => (
              <g key={`d-${d}`}>
                <line x1="55" x2="600" y1={yDelta(d)} y2={yDelta(d)} stroke={d === 0 ? "#64748b" : grid} strokeWidth={d === 0 ? "1.5" : "1"} />
                <text x="48" y={yDelta(d) + 4} textAnchor="end" fontSize="11" fill={d === 0 ? "#0f172a" : ink}>
                  {signed(d, 0)}℃
                </text>
              </g>
            ))}

            {/* Delta Line */}
            <path d={dLine} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Hour X-Axis Baseline & Ticks */}
            <line x1="55" x2="600" y1="330" y2="330" stroke={ink} strokeWidth="1" />
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => (
              <g key={h}>
                <line x1={x(h)} x2={x(h)} y1="330" y2="335" stroke={ink} strokeWidth="1" />
                <text x={x(h)} y="348" textAnchor="middle" fontSize="11" fill={ink}>
                  {h}時
                </text>
              </g>
            ))}

            {/* Interactive column markers with Keyboard & ARIA support */}
            {hourlyProfile.map((p) => {
              const isSelected = p.hour === selectedHour;
              return (
                <g
                  key={`col-${p.hour}`}
                  className="cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${p.hour}時: 八王子${fmt(p.hachioji.median)}℃, 都心${fmt(p.tokyo.median)}℃, 差${signed(p.delta.median)}℃`}
                  onClick={() => setSelectedHour(p.hour)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedHour(p.hour);
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setSelectedHour((p.hour + 1) % 24);
                    } else if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setSelectedHour((p.hour + 23) % 24);
                    }
                  }}
                >
                  <rect x={x(p.hour) - 11} y={20} width={22} height={310} fill="transparent" />
                  {isSelected && (
                    <>
                      <line x1={x(p.hour)} x2={x(p.hour)} y1={20} y2={330} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx={x(p.hour)} cy={yTemp(p.hachioji.median)} r="4.5" fill={orange} />
                      <circle cx={x(p.hour)} cy={yTemp(p.tokyo.median)} r="4.5" fill={blue} />
                      <circle cx={x(p.hour)} cy={yDelta(p.delta.median)} r="4.5" fill="#6366f1" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Hour Details Box with aria-live */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 text-base">{selectedHour}時の気象データ（冬季12シーズン中央値）</span>
            <span className="text-xs text-slate-500">サンプル数：{selectedItem.sample_size} 日</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="rounded-lg bg-orange-50 p-2 sm:p-3">
              <span className="text-xs text-orange-800 font-medium">八王子 気温</span>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-orange-950 tabular-nums">
                {fmt(selectedItem.hachioji.median)}
                <span className="text-xs font-normal ml-0.5">℃</span>
              </p>
              <span className="text-[11px] text-orange-700 block">Q1~Q3: {fmt(selectedItem.hachioji.q25)}~{fmt(selectedItem.hachioji.q75)}℃</span>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 sm:p-3">
              <span className="text-xs text-blue-800 font-medium">東京都心 気温</span>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-blue-950 tabular-nums">
                {fmt(selectedItem.tokyo.median)}
                <span className="text-xs font-normal ml-0.5">℃</span>
              </p>
              <span className="text-[11px] text-blue-700 block">Q1~Q3: {fmt(selectedItem.tokyo.q25)}~{fmt(selectedItem.tokyo.q75)}℃</span>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 sm:p-3">
              <span className="text-xs text-indigo-800 font-medium">気温差（八王子 − 都心）</span>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-indigo-950 tabular-nums">
                {signed(selectedItem.delta.median)}
                <span className="text-xs font-normal ml-0.5">℃</span>
              </p>
              <span className="text-[11px] text-indigo-700 block">平均: {signed(selectedItem.delta.mean)}℃</span>
            </div>
          </div>
        </div>

        {/* Accessibility Data Table */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
            24時間の詳細数値を表で見る
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1 px-2">時刻</th>
                  <th className="py-1 px-2">八王子中央値</th>
                  <th className="py-1 px-2">八王子Q1~Q3</th>
                  <th className="py-1 px-2">都心中央値</th>
                  <th className="py-1 px-2">都心Q1~Q3</th>
                  <th className="py-1 px-2">気温差中央値</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {hourlyProfile.map((p) => (
                  <tr key={p.hour} className={p.hour === selectedHour ? "bg-blue-50 font-bold" : ""}>
                    <td className="py-1 px-2 font-sans">{p.hour}時</td>
                    <td className="py-1 px-2 text-orange-900">{fmt(p.hachioji.median)}℃</td>
                    <td className="py-1 px-2 text-slate-600">{fmt(p.hachioji.q25)}~{fmt(p.hachioji.q75)}℃</td>
                    <td className="py-1 px-2 text-blue-900">{fmt(p.tokyo.median)}℃</td>
                    <td className="py-1 px-2 text-slate-600">{fmt(p.tokyo.q25)}~{fmt(p.tokyo.q75)}℃</td>
                    <td className="py-1 px-2 text-indigo-900">{signed(p.delta.median)}℃</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <figcaption className="mt-3 text-xs leading-5 text-slate-500">
          2014年12月〜2026年2月の冬季（12〜2月、計12シーズン）。各時刻の中央値と四分位範囲（25〜75%）。東京観測地点は北の丸公園。
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * 2. 朝7時の地点間気温差分布（ヒストグラム）
 */
export function MorningGapDistributionChart() {
  return (
    <figure className="space-y-4">
      <div className="overflow-x-auto rounded-2xl bg-slate-50 p-3" tabIndex={0} role="region" aria-label="朝7時の地点間気温差の頻度分布図。横にスクロールできます">
        <svg viewBox="0 0 640 280" className="min-w-[500px] w-full" role="img" aria-labelledby="hist-title hist-desc">
          <title id="hist-title">冬の朝7時 気温差（八王子 − 東京都心）の頻度分布</title>
          <desc id="hist-desc">
            全{summary.period.total_days_analyzed}日の朝7時における気温差の割合。八王子が都心より低い日は{summary.morning_7am.pct_hachioji_colder}%、3℃以上低い日は{summary.morning_7am.pct_gap_le_minus3}%、5℃以上低い日は{summary.morning_7am.pct_gap_le_minus5}%。
          </desc>

          {/* Grid lines */}
          {[0, 10, 20, 25].map((pct) => {
            const y = 220 - (pct / 28) * 180;
            return (
              <g key={pct}>
                <line x1="50" x2="600" y1={y} y2={y} stroke={grid} strokeWidth="1" />
                <text x="44" y={y + 4} textAnchor="end" fontSize="11" fill={ink}>
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {morningHistogram.map((b, i) => {
            const barW = 36;
            const barX = 60 + i * 41;
            const barH = (b.pct / 28) * 180;
            const barY = 220 - barH;
            const isCold = b.bin_max <= 0;
            const isVeryCold = b.bin_max <= -3;

            const fillColor = isVeryCold ? "#1d4ed8" : isCold ? "#3b82f6" : "#f97316";

            return (
              <g key={b.range_label}>
                <rect x={barX} y={barY} width={barW} height={barH} rx="3" fill={fillColor} opacity={0.85} />
                {b.pct >= 1 && (
                  <text x={barX + barW / 2} y={barY - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill={ink}>
                    {b.pct}%
                  </text>
                )}
                <text x={barX + barW / 2} y="237" textAnchor="middle" fontSize="9" fill={ink}>
                  {b.range_label}
                </text>
              </g>
            );
          })}

          {/* X Axis Base Line */}
          <line x1="50" x2="600" y1="220" y2="220" stroke={ink} strokeWidth="1.5" />
          <text x="325" y="262" textAnchor="middle" fontSize="11" fill={ink}>
            朝7時の気温差 [℃]（八王子 − 東京都心）← 左ほど八王子が寒い
          </text>

          {/* Key Reference Markers */}
          {/* 0℃ marker (at bar index 9 left edge: 60 + 9*41 = 429) */}
          <line x1="429" x2="429" y1="30" y2="220" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />
          <text x="433" y="42" fontSize="10.5" fontWeight="bold" fill="#0f172a">
            0℃（同温境界）
          </text>

          {/* -3℃ marker (at bar index 6 left edge: 60 + 6*41 = 306) */}
          <line x1="306" x2="306" y1="30" y2="220" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="302" y="42" textAnchor="end" fontSize="10.5" fontWeight="bold" fill="#1d4ed8">
            −3℃差 (60.7%がこれ以下)
          </text>
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <span className="text-xs text-blue-800 font-bold">八王子が都心より寒い朝</span>
          <p className="mt-1 text-2xl font-bold text-blue-950 tabular-nums">
            {summary.morning_7am.pct_hachioji_colder}
            <span className="text-xs font-normal ml-0.5">%</span>
          </p>
          <span className="text-xs text-slate-600 block mt-1">1,078日中 1,040日で八王子が低温</span>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
          <span className="text-xs text-indigo-800 font-bold">3℃以上八王子が寒い朝</span>
          <p className="mt-1 text-2xl font-bold text-indigo-950 tabular-nums">
            {summary.morning_7am.pct_gap_le_minus3}
            <span className="text-xs font-normal ml-0.5">%</span>
          </p>
          <span className="text-xs text-slate-600 block mt-1">冬の朝の約6割で3℃以上の開き</span>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
          <span className="text-xs text-purple-800 font-bold">5℃以上八王子が寒い朝</span>
          <p className="mt-1 text-2xl font-bold text-purple-950 tabular-nums">
            {summary.morning_7am.pct_gap_le_minus5}
            <span className="text-xs font-normal ml-0.5">%</span>
          </p>
          <span className="text-xs text-slate-600 block mt-1">約5日に1日は5℃以上の強烈な差</span>
        </div>
      </div>

      {/* Accessibility Data Table */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
          度数分布の詳細数値を表で見る
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 px-2">気温差階級</th>
                <th className="py-1 px-2">日数</th>
                <th className="py-1 px-2">構成比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {morningHistogram.map((b) => (
                <tr key={b.range_label}>
                  <td className="py-1 px-2 font-sans">{b.range_label}℃</td>
                  <td className="py-1 px-2 text-slate-800">{b.count} 日</td>
                  <td className="py-1 px-2 text-indigo-900 font-bold">{b.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <figcaption className="text-xs leading-5 text-slate-500">
        対象期間：2014-2026冬（12シーズン、1,078日）。階級幅1℃。欠測日は除外。
      </figcaption>
    </figure>
  );
}

/**
 * 3. 朝7時気温差カレンダー（ヒートマップ）
 */
export function MorningGapCalendarHeatmap() {
  const seasons = getAvailableSeasons();
  const [activeSeason, setActiveSeason] = useState<number>(seasons[0] || 2026);
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);

  const seasonDays = calendarDays.filter((d) => d.season === activeSeason);

  // Group by month: 12, 1, 2
  const month12 = seasonDays.filter((d) => d.date.startsWith(`${activeSeason - 1}-12`));
  const month01 = seasonDays.filter((d) => d.date.startsWith(`${activeSeason}-01`));
  const month02 = seasonDays.filter((d) => d.date.startsWith(`${activeSeason}-02`));

  // Color mapping based on delta (WCAG AA compliant contrast)
  const getCellColor = (delta: number | null) => {
    if (delta === null) return "bg-slate-100 text-slate-400";
    if (delta <= -6.0) return "bg-blue-950 text-white";
    if (delta <= -4.5) return "bg-blue-800 text-white";
    if (delta <= -3.0) return "bg-blue-600 text-white";
    if (delta <= -1.5) return "bg-blue-200 text-slate-950";
    if (delta <= 0.0) return "bg-blue-50 text-slate-900 border border-blue-200";
    return "bg-orange-200 text-orange-950"; // Hachioji warmer
  };

  const getDayNumColor = (delta: number | null) => {
    if (delta === null) return "text-slate-400";
    if (delta <= -3.0) return "text-blue-100";
    return "text-slate-600";
  };

  const renderMonthGrid = (title: string, days: CalendarDay[]) => {
    if (days.length === 0) return null;
    const firstDate = new Date(days[0].date + "T00:00:00");
    const firstDayOfWeek = firstDate.getDay(); // 0 (Sun) to 6 (Sat)
    const weekHeaders = ["日", "月", "火", "水", "木", "金", "土"];

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700">{title}</h4>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
          {weekHeaders.map((w, idx) => (
            <span key={w} className={idx === 0 ? "text-rose-500" : idx === 6 ? "text-blue-500" : ""}>
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for leading day-of-week offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 rounded bg-transparent" aria-hidden="true" />
          ))}

          {days.map((d) => {
            const dayNum = parseInt(d.date.split("-")[2], 10);
            const isSelected = hoveredDay?.date === d.date;
            return (
              <button
                key={d.date}
                type="button"
                className={`flex flex-col items-center justify-center rounded p-1 text-[11px] font-mono transition-all ${getCellColor(
                  d.delta_7am
                )} ${isSelected ? "ring-2 ring-slate-900 ring-offset-1 z-10 scale-105" : "hover:opacity-80"}`}
                onClick={() => setHoveredDay(d)}
                onMouseEnter={() => setHoveredDay(d)}
                onFocus={() => setHoveredDay(d)}
                aria-label={`${d.date}: 差 ${signed(d.delta_7am)}℃`}
              >
                <span className={`text-[9px] font-sans ${getDayNumColor(d.delta_7am)}`}>{dayNum}</span>
                <span className="font-bold tabular-nums">{signed(d.delta_7am, 0)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Season Selector Buttons (All 12 seasons) */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="表示する冬季シーズンを選択">
        <span className="text-xs font-bold text-slate-600 mr-1">シーズン:</span>
        {seasons.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === activeSeason}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
              s === activeSeason ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => {
              setActiveSeason(s);
              setHoveredDay(null);
            }}
          >
            {s - 1}–{s}冬
          </button>
        ))}
      </div>

      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <span className="font-bold text-slate-900 text-sm">
            {activeSeason - 1}年12月 〜 {activeSeason}年2月 朝7時の気温差カレンダー
          </span>
          <span className="text-xs text-slate-500">日付セルをタップして詳細確認</span>
        </div>

        {/* 3 Months Container */}
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {renderMonthGrid(`${activeSeason - 1}年 12月`, month12)}
          {renderMonthGrid(`${activeSeason}年 1月`, month01)}
          {renderMonthGrid(`${activeSeason}年 2月`, month02)}
        </div>

        {/* Legend for Heatmap */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span>凡例（八王子 − 都心）:</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-blue-950" /> −6.0℃以下</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-blue-800" /> −4.5〜−6.0℃</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-blue-600" /> −3.0〜−4.5℃</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-blue-200" /> −1.5〜−3.0℃</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-blue-50 border border-blue-200" /> 0.0〜−1.5℃</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-4 rounded bg-orange-200" /> 0.0℃超（八王子が高温）</span>
          </div>
        </div>

        {/* Hovered / Tapped Day Detail Modal / Box with aria-live */}
        {hoveredDay ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">{hoveredDay.date} 朝7時の観測値</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                {hoveredDay.condition === "calm_dry"
                  ? "静穏・非降水（放射冷却日）"
                  : hoveredDay.condition === "windy"
                  ? "強風条件"
                  : hoveredDay.condition === "precip"
                  ? "降水あり"
                  : "通常"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
              <div className="rounded-lg bg-orange-50 p-2">
                <span className="text-xs text-orange-800">八王子（7時）</span>
                <p className="text-lg font-bold text-orange-950 tabular-nums">{fmt(hoveredDay.hachioji_7am)}℃</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <span className="text-xs text-blue-800">東京都心（7時）</span>
                <p className="text-lg font-bold text-blue-950 tabular-nums">{fmt(hoveredDay.tokyo_7am)}℃</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2">
                <span className="text-xs text-indigo-800">朝7時の気温差</span>
                <p className="text-lg font-bold text-indigo-950 tabular-nums">{signed(hoveredDay.delta_7am)}℃</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="text-xs text-slate-600">昼14時の気温差</span>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{signed(hoveredDay.delta_14pm)}℃</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
            日付をクリックまたはタップすると、その日の八王子・都心気温と昼の気温差を確認できます。
          </div>
        )}

        {/* Accessibility Data Table */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
            選択中シーズンの月別集計を表で見る
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1 px-2">月</th>
                  <th className="py-1 px-2">日数</th>
                  <th className="py-1 px-2">朝7時差中央値</th>
                  <th className="py-1 px-2">八王子低温日数</th>
                  <th className="py-1 px-2">−3℃以下日数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {[
                  { label: "12月", list: month12 },
                  { label: "1月", list: month01 },
                  { label: "2月", list: month02 },
                ].map((m) => {
                  const deltas = m.list.map((d) => d.delta_7am).sort((a, b) => a - b);
                  const med = deltas.length > 0 ? deltas[Math.floor(deltas.length / 2)] : null;
                  const coldCount = deltas.filter((v) => v < 0).length;
                  const le3Count = deltas.filter((v) => v <= -3.0).length;
                  return (
                    <tr key={m.label}>
                      <td className="py-1 px-2 font-sans font-bold">{m.label}</td>
                      <td className="py-1 px-2">{m.list.length} 日</td>
                      <td className="py-1 px-2 text-indigo-900 font-bold">{signed(med)}℃</td>
                      <td className="py-1 px-2">{coldCount} 日</td>
                      <td className="py-1 px-2 text-blue-900">{le3Count} 日</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>

        <figcaption className="mt-3 text-xs leading-5 text-slate-500">
          負の値（青系）は八王子が東京都心より寒い日。朝7時実測値。
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * 4. 冬季日較差の地点間比較（箱ひげ図）
 */
export function WinterDiurnalRangeBoxPlot() {
  const stations = [
    { key: "hachioji", name: "八王子", color: "bg-orange-700" },
    { key: "ome", name: "青梅", color: "bg-amber-600" },
    { key: "fuchu", name: "府中", color: "bg-emerald-600" },
    { key: "tokyo", name: "東京都心", color: "bg-blue-700" },
  ] as const;

  const maxRange = 15;

  return (
    <figure className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        {stations.map((s) => {
          const item = diurnalRange[s.key];
          if (!item) return null;

          return (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-800">{s.name}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-500 font-mono">Q1~Q3: {fmt(item.q25)}~{fmt(item.q75)}℃</span>
                  <span className="font-bold tabular-nums text-slate-900 text-base">
                    {fmt(item.median)} <span className="text-xs font-normal">℃</span>
                  </span>
                </div>
              </div>

              {/* Box plot bar visualization: Q1-Q3 box with median marker line */}
              <div className="relative h-5 rounded-lg bg-slate-100 overflow-hidden" aria-hidden="true">
                {/* Background grid lines (5, 10) */}
                <div className="absolute top-0 bottom-0 left-[33.3%] w-px bg-slate-200" />
                <div className="absolute top-0 bottom-0 left-[66.7%] w-px bg-slate-200" />

                {/* Range span (q25..q75) - Semi-transparent box */}
                <div
                  className={`absolute top-1 bottom-1 rounded opacity-35 ${s.color}`}
                  style={{
                    left: `${(item.q25 / maxRange) * 100}%`,
                    width: `${((item.q75 - item.q25) / maxRange) * 100}%`,
                  }}
                />

                {/* Median marker: solid vertical line */}
                <div
                  className={`absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full ${s.color}`}
                  style={{
                    left: `${(item.median / maxRange) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-4 flex justify-between border-t border-slate-200 pt-2 text-xs text-slate-500" aria-hidden="true">
          <span>0℃</span>
          <span>5℃</span>
          <span>10℃</span>
          <span>15℃</span>
        </div>
      </div>

      {/* Accessibility Data Table */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
          冬季日較差の詳細数値を表で見る
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 px-2">地点</th>
                <th className="py-1 px-2">中央値</th>
                <th className="py-1 px-2">第1四分位数 (Q1)</th>
                <th className="py-1 px-2">第3四分位数 (Q3)</th>
                <th className="py-1 px-2">四分位範囲 (IQR)</th>
                <th className="py-1 px-2">サンプル年数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {stations.map((s) => {
                const item = diurnalRange[s.key];
                if (!item) return null;
                return (
                  <tr key={s.key}>
                    <td className="py-1 px-2 font-sans font-bold">{s.name}</td>
                    <td className="py-1 px-2 text-slate-900 font-bold">{fmt(item.median)}℃</td>
                    <td className="py-1 px-2 text-slate-600">{fmt(item.q25)}℃</td>
                    <td className="py-1 px-2 text-slate-600">{fmt(item.q75)}℃</td>
                    <td className="py-1 px-2 text-indigo-900">{fmt(item.q75 - item.q25)}℃</td>
                    <td className="py-1 px-2 text-slate-500">{item.count} 年</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <figcaption className="text-xs leading-5 text-slate-500">
        1990〜2025年（36年間、35冬季シーズン）の冬季（12〜2月）における日較差（日最高気温 − 日最低気温）の中央値および四分位範囲。気象庁過去の気象データより。
      </figcaption>
    </figure>
  );
}

/**
 * 5. 条件別比較（放射冷却・風速・降水）
 */
export function ConditionComparisonChart() {
  const groups = [
    {
      key: "calm_dry",
      item: conditionSummary.calm_dry,
      textColor: "text-blue-900",
    },
    {
      key: "windy",
      item: conditionSummary.windy,
      textColor: "text-indigo-900",
    },
    {
      key: "precip",
      item: conditionSummary.precip,
      textColor: "text-slate-800",
    },
  ] as const;

  return (
    <figure className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((g) => {
          const stats = g.item.stats;
          return (
            <div key={g.key} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 block">{g.item.name}</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-600">朝7時差 中央値</span>
                <span className={`text-3xl font-bold tabular-nums ${g.textColor}`}>
                  {signed(stats.median)}
                  <span className="text-sm font-normal ml-0.5">℃</span>
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>3℃以上低い割合:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.pct_le_minus3}%</span>
                </div>
                <div className="flex justify-between">
                  <span>5℃以上低い割合:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.pct_le_minus5}%</span>
                </div>
                <div className="flex justify-between">
                  <span>日数（N）:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.count} 日</span>
                </div>
              </div>

              <p className="text-[11px] leading-4 text-slate-500 pt-2 border-t border-slate-100">
                {g.item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Accessibility Data Table */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
          気象条件別比較の詳細数値を表で見る
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 px-2">条件区分</th>
                <th className="py-1 px-2">日数</th>
                <th className="py-1 px-2">朝7時差中央値</th>
                <th className="py-1 px-2">朝7時差平均</th>
                <th className="py-1 px-2">3℃以上低い割合</th>
                <th className="py-1 px-2">5℃以上低い割合</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {groups.map((g) => (
                <tr key={g.key}>
                  <td className="py-1 px-2 font-sans font-bold">{g.item.name}</td>
                  <td className="py-1 px-2">{g.item.stats.count} 日</td>
                  <td className="py-1 px-2 text-indigo-900 font-bold">{signed(g.item.stats.median)}℃</td>
                  <td className="py-1 px-2 text-slate-600">{signed(g.item.stats.mean)}℃</td>
                  <td className="py-1 px-2 text-blue-900">{g.item.stats.pct_le_minus3}%</td>
                  <td className="py-1 px-2 text-purple-900">{g.item.stats.pct_le_minus5}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <figcaption className="text-xs leading-5 text-slate-500">
        2014-2026冬の朝7時差。夜間平均風速（0〜6時八王子観測値）と夜間降水有無による分類。
      </figcaption>
    </figure>
  );
}
