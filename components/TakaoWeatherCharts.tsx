"use client";

import React, { useState } from "react";
import { MonthlySummaryRow, SummerHourlySlot, monthNames } from "@/lib/takao-weather-publication";

type ChartsProps = {
  monthlySummary: MonthlySummaryRow[];
  summerHourlyMatrix: SummerHourlySlot[];
};

export function TakaoWeatherCharts({ monthlySummary, summerHourlyMatrix }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<"summer_hourly" | "apparent_gas">("summer_hourly");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Tab Switcher */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("summer_hourly")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "summer_hourly"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          ① 夏期の時間帯別 天候急変・降水確率マトリクス（10時〜18時）
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("apparent_gas")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "apparent_gas"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          ② 「見せかけの晴れ（街は晴れ・山頂はガス）」月別発生日数（年34日）
        </button>
      </div>

      {activeTab === "summer_hourly" ? (
        <SummerHourlyChart data={summerHourlyMatrix} />
      ) : (
        <ApparentSunnyGasChart data={monthlySummary} />
      )}
    </div>
  );
}

function SummerHourlyChart({ data }: { data: SummerHourlySlot[] }) {
  // SVG Chart showing the steep increase from 10:00 to 16:00
  const width = 600;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 50 };

  const maxProb = 50; // max Y percentage
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pointsRain = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.rain_probability / maxProb) * chartHeight;
    return { x, y, val: d.rain_probability, label: d.hour_label };
  });

  const pointsGas = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.gas_probability / maxProb) * chartHeight;
    return { x, y, val: d.gas_probability };
  });

  const pathRain = pointsRain.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const pathGas = pointsGas.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">
          高尾山頂：夏期（6〜9月）の時間経過に伴う急変確率の上昇
        </h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1 text-rose-600">
            <span className="inline-block h-3 w-3 rounded-full bg-rose-500"></span>
            降水発生確率（%）
          </span>
          <span className="flex items-center gap-1 text-sky-600">
            <span className="inline-block h-3 w-3 rounded-full bg-sky-500"></span>
            ガス（濃霧）発生確率（%）
          </span>
        </div>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-600">
        ※2024年6〜9月の全122日における時間帯別観測値。午前10時台は安定していても、午後14時〜16時にかけて湿潤大気の対流（熱雷・地形性上昇気流）により降水確率が約2倍に急上昇します。
      </p>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]">
          {/* Background grid */}
          {[0, 10, 20, 30, 40, 50].map((tick) => {
            const y = padding.top + chartHeight - (tick / maxProb) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={tick === 0 ? "none" : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Danger zone overlay for 14:00 - 18:00 */}
          <rect
            x={pointsRain[2].x - 30}
            y={padding.top}
            width={pointsRain[4].x - pointsRain[2].x + 45}
            height={chartHeight}
            fill="#fef2f2"
            opacity="0.7"
          />
          <text
            x={pointsRain[3].x}
            y={padding.top + 18}
            textAnchor="middle"
            className="fill-rose-600 text-[11px] font-bold"
          >
            ⚠️ 午後急変・雷雨警戒時間帯
          </text>

          {/* Lines */}
          <path d={pathGas} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 2" />
          <path d={pathRain} fill="none" stroke="#e11d48" strokeWidth="3" />

          {/* Points for Rain */}
          {pointsRain.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#e11d48" stroke="#fff" strokeWidth="2" />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="fill-rose-700 text-[11px] font-bold"
              >
                {p.val}%
              </text>
              <text
                x={p.x}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-slate-700 text-[12px] font-semibold"
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Points for Gas */}
          {pointsGas.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#0284c7" stroke="#fff" strokeWidth="2" />
              <text
                x={p.x}
                y={p.y + 16}
                textAnchor="middle"
                className="fill-sky-800 text-[10px] font-semibold"
              >
                {p.val}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.map((item) => (
          <div key={item.hour} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <span className="block text-xs font-bold text-slate-600">{item.hour_label}</span>
            <span className="block text-base font-black text-rose-600">{item.rain_probability}%</span>
            <span className="block text-[10px] text-slate-500">ガス確率: {item.gas_probability}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApparentSunnyGasChart({ data }: { data: MonthlySummaryRow[] }) {
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 45 };

  const maxDays = 8;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = 24;

  const totalApparentDays = data.reduce((acc, m) => acc + m.apparent_sunny_gas_days, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            「見せかけの晴れ」月別日数（市街地は晴天・山頂はガス）
          </h3>
          <span className="text-xs font-semibold text-amber-700">
            年間合計: <strong className="text-sm font-bold text-amber-900">{totalApparentDays}日</strong>（年間の約1割で予報と山頂天候が乖離）
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-amber-600">
            <span className="inline-block h-3 w-3 rounded-sm bg-amber-500"></span>
            見せかけの晴れ日数
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="inline-block h-3 w-3 rounded-sm bg-slate-300"></span>
            全ガス発生日数
          </span>
        </div>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-600">
        ※八王子市街地では「降水量0mm かつ 雲量50%以下」の晴天であるにもかかわらず、高尾山頂（599m）では湿度90%以上の濃霧・ガスが日中2時間以上継続した日数。初夏（6〜7月）と秋雨（9〜10月）に急増します。
      </p>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px]">
          {/* Horizontal grid */}
          {[0, 2, 4, 6, 8].map((tick) => {
            const y = padding.top + chartHeight - (tick / maxDays) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={tick === 0 ? "none" : "3 3"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px]"
                >
                  {tick}日
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((m, i) => {
            const xCenter = padding.left + ((i + 0.5) / 12) * chartWidth;
            const barHeight = (m.apparent_sunny_gas_days / maxDays) * chartHeight;
            const y = padding.top + chartHeight - barHeight;

            return (
              <g key={m.month}>
                {/* Bar */}
                <rect
                  x={xCenter - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  className={m.apparent_sunny_gas_days > 0 ? "fill-amber-500 hover:fill-amber-600 transition-colors" : "fill-slate-200"}
                />
                {/* Value on top */}
                {m.apparent_sunny_gas_days > 0 && (
                  <text
                    x={xCenter}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-amber-800 text-[11px] font-bold"
                  >
                    {m.apparent_sunny_gas_days}
                  </text>
                )}
                {/* Month label */}
                <text
                  x={xCenter}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px] font-medium"
                >
                  {monthNames[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
        <strong className="font-bold">💡 統計から見る「見せかけの晴れ」の危険性：</strong><br />
        平野部の天気予報で「晴れ」と表示されていても、年間34日は山頂で濃霧が発生しています。
        特に<strong>6月（7日）、7月（6日）、9月（5日）</strong>は、南風が湿気を含んで山にぶつかるため、平野の快晴に騙されて軽装で登ると山頂で視界数メートルの真っ白なガスと服がぐっしょり濡れる「ガス濡れ」に見舞われます。
      </div>
    </div>
  );
}
