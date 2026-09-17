"use client";

import { useState } from "react";
import {
  annualComparison,
  coolingRates,
  hourlyCases,
  summary,
  type HourlyCase,
} from "@/lib/hachioji-heat-publication";

const orange = "#ea580c"; // 八王子昼・暖色
const blue = "#2563eb";   // 都心
const indigo = "#4f46e5"; // 八王子夜・寒色

/**
 * 4地点の最近6年（2020〜2025年）の猛暑日・真夏日・最低25℃以上の比較バー
 */
export function RecentHeatBars({
  metric,
  max,
  tone = "warm",
}: {
  metric: "heatstroke_days" | "min_temp_ge25_days" | "midsummer_days";
  max: number;
  tone?: "warm" | "cool";
}) {
  const data = summary.recent_averages_2020_2025[metric];
  const stations = [
    { key: "hachioji", name: "八王子", value: data.hachioji },
    { key: "tokyo", name: "東京都心", value: data.tokyo },
    { key: "fuchu", name: "府中", value: data.fuchu },
    { key: "ome", name: "青梅", value: data.ome },
  ];

  return (
    <figure>
      <div className="space-y-4">
        {stations.map((station) => {
          const isHachioji = station.key === "hachioji";
          const isTokyo = station.key === "tokyo";
          const barColor = isHachioji
            ? tone === "warm"
              ? "bg-orange-600"
              : "bg-indigo-600"
            : isTokyo
            ? tone === "warm"
              ? "bg-slate-500"
              : "bg-blue-600"
            : "bg-slate-300";

          return (
            <div key={station.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span
                  className={
                    isHachioji || isTokyo
                      ? "font-bold text-slate-900"
                      : "text-slate-600"
                  }
                >
                  {station.name}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {station.value.toFixed(1)}
                  <span className="ml-1 text-xs font-normal">日/年</span>
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                aria-hidden="true"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(100, (station.value / max) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="mt-3 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500"
        aria-hidden="true"
      >
        <span>0</span>
        <span>{max / 2}</span>
        <span>{max} 日/年</span>
      </div>
      <figcaption className="mt-3 text-xs leading-relaxed text-slate-500">
        気象庁アメダス・官署データの2020〜2025年（6年間）の単純年平均。
      </figcaption>
    </figure>
  );
}

/**
 * 猛暑日 vs 最低25℃以上の36年間推移グラフ（八王子 vs 東京都心）
 */
export function AnnualTrendChart() {
  const [activeMetric, setActiveMetric] = useState<"heatstroke_days" | "min_temp_ge25_days">("heatstroke_days");

  const isHeat = activeMetric === "heatstroke_days";
  const title = isHeat ? "猛暑日（最高35℃以上）の年間日数推移" : "最低25℃以上（熱帯夜相当）の年間日数推移";
  const subtitle = isHeat
    ? "八王子は多くの年で都心を上回り、2020年代に急増（2025年は八王子46日、都心33日）"
    : "都心はほぼすべての年で八王子を圧倒（都心は年30〜50日超、八王子は年10〜20日前後）";

  const rows = annualComparison;
  const years = rows.map((r) => r.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const maxVal = isHeat ? 50 : 60;
  const x = (year: number) => 50 + ((year - minYear) / (maxYear - minYear)) * 560;
  const y = (val: number) => 230 - (val / maxVal) * 190;

  const hachiojiPath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${x(r.year)},${y(r.hachioji[activeMetric])}`)
    .join(" ");

  const tokyoPath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${x(r.year)},${y(r.tokyo[activeMetric])}`)
    .join(" ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMetric("heatstroke_days")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              isHeat ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            猛暑日（昼）
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("min_temp_ge25_days")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              !isHeat ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            最低25℃以上（夜）
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 650 280"
          role="img"
          aria-label={`${title}（1990〜2025年）。橙は八王子、青は東京都心`}
          className="w-full min-w-[500px]"
        >
          {/* Y ticks */}
          {[0, 10, 20, 30, 40, 50, 60]
            .filter((v) => v <= maxVal)
            .map((val) => (
              <g key={val}>
                <line x1="50" x2="620" y1={y(val)} y2={y(val)} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x="42" y={y(val) + 4} textAnchor="end" fontSize="12" fill="#64748b">
                  {val}
                </text>
              </g>
            ))}
          <text x="15" y="25" fontSize="12" fill="#64748b">
            日数（日/年）
          </text>

          {/* X ticks */}
          {[1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].map((year) => (
            <g key={year}>
              <line x1={x(year)} x2={x(year)} y1="40" y2="230" stroke="#f1f5f9" />
              <text x={x(year)} y="252" textAnchor="middle" fontSize="12" fill="#64748b">
                {year}
              </text>
            </g>
          ))}

          {/* Paths */}
          <path d={hachiojiPath} fill="none" stroke={orange} strokeWidth="2.5" />
          <path d={tokyoPath} fill="none" stroke={blue} strokeWidth="2.5" strokeDasharray="4 2" />

          {/* Dots */}
          {rows.map((r) => (
            <g key={r.year}>
              <circle cx={x(r.year)} cy={y(r.hachioji[activeMetric])} r="3" fill={orange} />
              <circle cx={x(r.year)} cy={y(r.tokyo[activeMetric])} r="3" fill={blue} />
            </g>
          ))}

          {/* Legend */}
          <g transform="translate(430, 15)">
            <rect width="180" height="42" rx="8" fill="white" fillOpacity="0.9" stroke="#e2e8f0" />
            <line x1="12" x2="35" y1="16" y2="16" stroke={orange} strokeWidth="2.5" />
            <circle cx="23.5" cy="16" r="3" fill={orange} />
            <text x="42" y="20" fontSize="12" fontWeight="bold" fill="#1e293b">
              八王子
            </text>

            <line x1="100" x2="125" y1="16" y2="16" stroke={blue} strokeWidth="2.5" strokeDasharray="4 2" />
            <circle cx="112.5" cy="16" r="3" fill={blue} />
            <text x="132" y="20" fontSize="12" fontWeight="bold" fill="#1e293b">
              東京都心
            </text>

            <text x="12" y="34" fontSize="10" fill="#64748b">
              実線：八王子 / 破線：都心
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 text-xs leading-relaxed text-slate-500">
        対象期間：1990〜2025年（36年間）。日最高気温35℃以上（猛暑日）と日最低気温25℃以上（最低25℃以上日）。
      </figcaption>
    </div>
  );
}

/**
 * 猛暑日の24時間〜30時間推移グラフ（1時間値折れ線チャート）
 */
export function HourlyCaseChart() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(hourlyCases[0].id);
  const activeCase = hourlyCases.find((c) => c.id === selectedCaseId) || hourlyCases[0];

  const series = activeCase.series;
  const temps = series.flatMap((p) => [p.hachioji.temp, p.tokyo.temp]).filter((v): v is number => v !== null);
  const minTemp = Math.floor(Math.min(...temps) - 1);
  const maxTemp = Math.ceil(Math.max(...temps) + 1);

  const x = (i: number) => 50 + (i / (series.length - 1)) * 560;
  const y = (t: number) => 240 - ((t - minTemp) / (maxTemp - minTemp)) * 200;

  const hachiojiPath = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.hachioji.temp!)}`)
    .join(" ");

  const tokyoPath = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.tokyo.temp!)}`)
    .join(" ");

  // 25℃の熱帯夜基準ライン
  const y25 = y(25);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-slate-900">{activeCase.name}</h4>
          <p className="mt-1 text-sm text-slate-600">{activeCase.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hourlyCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(c.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                selectedCaseId === c.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c.id.replace("case-", "").slice(0, 4)}年事例
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 650 300"
          role="img"
          aria-label={`${activeCase.name}の気温推移（オレンジ：八王子、青：東京都心）`}
          className="w-full min-w-[520px]"
        >
          {/* 25℃ 熱帯夜境界線 */}
          {minTemp <= 25 && maxTemp >= 25 && (
            <g>
              <rect x="50" y={y25} width="560" height={240 - y25} fill="#eff6ff" fillOpacity="0.6" />
              <line x1="50" x2="610" y1={y25} y2={y25} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="615" y={y25 + 4} fontSize="11" fill="#2563eb" fontWeight="bold">
                25℃（熱帯夜ライン）
              </text>
            </g>
          )}

          {/* Y ticks */}
          {Array.from({ length: Math.floor((maxTemp - minTemp) / 5) + 1 }, (_, i) => minTemp + i * 5).map((val) => (
            <g key={val}>
              <line x1="50" x2="610" y1={y(val)} y2={y(val)} stroke="#e2e8f0" strokeDasharray="2 2" />
              <text x="42" y={y(val) + 4} textAnchor="end" fontSize="12" fill="#64748b">
                {val}℃
              </text>
            </g>
          ))}

          {/* X ticks (time points: every 3 hours) */}
          {series.map((p, i) => {
            if (i % 3 !== 0) return null;
            const isMidnight = p.hour === 0;
            return (
              <g key={p.datetime}>
                <line x1={x(i)} x2={x(i)} y1="35" y2="240" stroke="#f1f5f9" />
                <text
                  x={x(i)}
                  y="258"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isMidnight ? "bold" : "normal"}
                  fill={isMidnight ? "#0f172a" : "#64748b"}
                >
                  {isMidnight ? `${p.date.slice(5)}` : `${p.hour}時`}
                </text>
              </g>
            );
          })}

          {/* Paths */}
          <path d={hachiojiPath} fill="none" stroke={orange} strokeWidth="3" />
          <path d={tokyoPath} fill="none" stroke={blue} strokeWidth="3" />

          {/* Key points markers */}
          {series.map((p, i) => {
            // Peak around 12:00-15:00, or night minimum around 04:00-06:00
            const isPeak = p.hour === 14;
            const isNight = i === 28; //翌朝4-5時
            return (
              <g key={p.datetime}>
                <circle cx={x(i)} cy={y(p.hachioji.temp!)} r="3" fill={orange} />
                <circle cx={x(i)} cy={y(p.tokyo.temp!)} r="3" fill={blue} />
                {isPeak && (
                  <text
                    x={x(i)}
                    y={y(p.hachioji.temp!) - 10}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="bold"
                    fill={orange}
                  >
                    八王子 {p.hachioji.temp}℃
                  </text>
                )}
                {isNight && (
                  <text
                    x={x(i)}
                    y={y(p.hachioji.temp!) + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={indigo}
                  >
                    八王子 {p.hachioji.temp}℃
                  </text>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(60, 20)">
            <rect width="210" height="34" rx="8" fill="white" fillOpacity="0.9" stroke="#e2e8f0" />
            <line x1="12" x2="35" y1="17" y2="17" stroke={orange} strokeWidth="3" />
            <circle cx="23.5" cy="17" r="3.5" fill={orange} />
            <text x="42" y="21" fontSize="12" fontWeight="bold" fill="#1e293b">
              八王子
            </text>

            <line x1="110" x2="135" y1="17" y2="17" stroke={blue} strokeWidth="3" />
            <circle cx="122.5" cy="17" r="3.5" fill={blue} />
            <text x="142" y="21" fontSize="12" fontWeight="bold" fill="#1e293b">
              東京都心
            </text>
          </g>
        </svg>
      </div>

      <details className="mt-4 rounded-xl bg-slate-50 p-4 text-xs">
        <summary className="cursor-pointer font-bold text-slate-800">
          この事例の1時間値データテーブルを表示
        </summary>
        <div className="mt-3 max-h-72 overflow-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-1.5 text-left">日時</th>
                <th className="p-1.5 text-orange-700">八王子(℃)</th>
                <th className="p-1.5 text-blue-700">都心(℃)</th>
                <th className="p-1.5">気温差(八王子−都心)</th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.datetime} className="border-t border-slate-100">
                  <td className="p-1.5 text-left font-mono">
                    {p.date.slice(5)} {p.hour}時
                  </td>
                  <td className="p-1.5 font-semibold text-orange-700">{p.hachioji.temp}℃</td>
                  <td className="p-1.5 font-semibold text-blue-700">{p.tokyo.temp}℃</td>
                  <td className={`p-1.5 font-mono ${p.delta! > 0 ? "text-orange-600" : "text-blue-600"}`}>
                    {p.delta! > 0 ? `+${p.delta}` : p.delta}℃
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/**
 * 冷却速度・夜間の気温低下量比較カード
 */
export function CoolingRateComparison() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {coolingRates.map((cr) => (
        <div key={cr.case_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold text-slate-500">{cr.name.split("（")[0]}</p>
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-orange-800">八王子 冷却幅</span>
                <span className="font-bold text-orange-800">−{cr.cooling_amount.hachioji}℃</span>
              </div>
              <p className="text-[11px] text-slate-500">
                18時 {cr.temp_18h.hachioji}℃ → 翌5時 {cr.temp_05h.hachioji}℃（毎時 −{cr.hourly_cooling_rate.hachioji}℃/h）
              </p>
            </div>
            <div className="pt-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-blue-800">都心 冷却幅</span>
                <span className="font-bold text-blue-800">−{cr.cooling_amount.tokyo}℃</span>
              </div>
              <p className="text-[11px] text-slate-500">
                18時 {cr.temp_18h.tokyo}℃ → 翌5時 {cr.temp_05h.tokyo}℃（毎時 −{cr.hourly_cooling_rate.tokyo}℃/h）
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white p-2.5 text-center text-xs font-bold text-indigo-950">
            夜間の冷却差：八王子が {(cr.cooling_amount.hachioji - cr.cooling_amount.tokyo).toFixed(1)}℃ 多く下がる
          </div>
        </div>
      ))}
    </div>
  );
}
