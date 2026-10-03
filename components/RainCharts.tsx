"use client";

import { useState } from "react";
import type { RainData } from "@/lib/hachioji-rain-autumn-publication";

const number = (n: number, digits = 1) => n.toLocaleString("ja-JP", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const colors = { h: "#0369a1", t: "#a16207" };
const options = [
  { key: "total", title: "降水量", unit: "mm/年", axis: 2500 },
  { key: "wet_days", title: "降水日数", unit: "日/年", axis: 150 },
  { key: "top5_share", title: "上位5日の割合", unit: "%", axis: 60 },
] as const;

export function RainAnnualChart({ data }: { data: RainData }) {
  const [metric, setMetric] = useState<(typeof options)[number]>(options[0]);
  const allYears = Array.from({ length: 11 }, (_, i) => 2015 + i);
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div role="group" aria-label="年別グラフの指標" className="flex flex-wrap gap-2">{options.map(option => <button key={option.key} type="button" aria-pressed={option.key === metric.key} onClick={() => setMetric(option)} className={`rounded-full border px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${metric.key === option.key ? "border-sky-800 bg-sky-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>{option.title}</button>)}</div>
    <div className="mt-5 flex flex-wrap gap-5 text-xs"><span className="text-sky-800">■ 八王子</span><span className="text-yellow-800">■ 東京都心</span><span className="text-slate-500">両地点で全日が正常値の8年</span></div>
    <figure className="mt-3" aria-label={`年ごとの${metric.title}`}>
      <div className="overflow-x-auto"><svg role="img" aria-labelledby={`rain-${metric.key}-title`} viewBox="0 0 800 340" className="w-full min-w-[620px]">
        <title id={`rain-${metric.key}-title`}>{`2015〜2025年の${metric.title}。2019・2020・2024年は主集計の対象外。数値は下の表にも掲載。`}</title>
        {[0, metric.axis / 2, metric.axis].map(tick => <g key={tick}><line x1="62" x2="786" y1={275 - tick / metric.axis * 225} y2={275 - tick / metric.axis * 225} stroke="#e2e8f0" /><text x="53" y={280 - tick / metric.axis * 225} textAnchor="end" fontSize="12" fill="#475569">{tick.toLocaleString()}</text></g>)}
        <text x="62" y="24" fontSize="12" fill="#475569">{metric.unit} · 0からの共通目盛り</text>
        {allYears.map((year, i) => { const a = data.annual.find(row => row.year === year); const x = 76 + i * 65; return <g key={year}>
          {a ? (["h", "t"] as const).map((key, j) => <g key={key}><rect x={x + j * 23} y={275 - a[key][metric.key] / metric.axis * 225} width="19" height={a[key][metric.key] / metric.axis * 225} fill={colors[key]} rx="2"><title>{`${year}年 ${key === "h" ? "八王子" : "東京都心"} ${number(a[key][metric.key])}${metric.unit}`}</title></rect></g>) : <text x={x + 20} y="264" textAnchor="middle" fontSize="10" fill="#64748b">対象外</text>}
          <text x={x + 20} y="300" textAnchor="middle" fontSize="12" fill="#334155">{year}</text>
        </g>; })}
      </svg></div>
      <figcaption className="text-xs leading-6 text-slate-600">欠けた年を0として描いていません。上位5日の割合は、それぞれの年の多雨上位5日分 ÷ その年の全降水量です。スマートフォンでは図を横にスクロールできます。</figcaption>
    </figure>
    <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-sky-800">この図の数値表</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[370px] text-right"><caption className="mb-2 text-left">{metric.title}（{metric.unit}）</caption><thead><tr className="border-b"><th scope="col" className="py-2 text-left">年</th><th scope="col">八王子</th><th scope="col">東京都心</th></tr></thead><tbody>{allYears.map(year => { const a = data.annual.find(row => row.year === year); return <tr key={year} className="border-b border-slate-100"><th scope="row" className="py-2 text-left font-normal">{year}</th><td>{a ? number(a.h[metric.key]) : "対象外"}</td><td>{a ? number(a.t[metric.key]) : "対象外"}</td></tr>; })}</tbody></table></div></details>
  </div>;
}

export function RainMonthlyChart({ data }: { data: RainData }) {
  return <figure className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap justify-between gap-2 text-xs"><span className="text-sky-800">■ 八王子</span><span className="text-yellow-800">■ 東京都心</span><span className="text-slate-600">各月の平均降水量 · 共通目盛り0〜350mm</span></div>
    <div className="space-y-3">{data.summary.h.monthly.map((h, i) => { const t = data.summary.t.monthly[i]; return <div key={h.month} className="grid grid-cols-[2rem_1fr] items-center gap-3 text-xs">
      <span className="font-semibold text-slate-600">{h.month}月</span><div className="space-y-1.5">{[[h.total, colors.h, "八王子"], [t.total, colors.t, "東京都心"]].map(([value, color, label]) => <div key={String(label)} className="grid grid-cols-[1fr_3.8rem] items-center gap-2"><div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full" style={{ width: `${Number(value) / 350 * 100}%`, backgroundColor: String(color) }} /></div><span aria-label={`${label} ${number(Number(value))}mm`} className="text-right tabular-nums text-slate-700">{number(Number(value))}</span></div>)}</div>
    </div>; })}</div>
    <figcaption className="mt-5 text-xs leading-6 text-slate-600">主集計の同じ8年を、月ごとに等しい重みで平均。雨の強さを表す「mm/時」ではありません。数値は各棒の右に表示しています。</figcaption>
    <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-sky-800">月別の数値を表で見る</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[340px] text-right"><caption className="mb-2 text-left">月別の平均降水量（mm）・主集計の8年</caption><thead><tr className="border-b"><th scope="col" className="py-2 text-left">月</th><th scope="col">八王子</th><th scope="col">東京都心</th></tr></thead><tbody>{data.summary.h.monthly.map((h, i) => <tr key={h.month} className="border-b border-slate-100"><th scope="row" className="py-2 text-left font-normal">{h.month}月</th><td>{number(h.total)}</td><td>{number(data.summary.t.monthly[i].total)}</td></tr>)}</tbody></table></div></details>
  </figure>;
}
