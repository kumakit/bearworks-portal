"use client";

import { useMemo, useState } from "react";

type Annual = { targetDate: string; population: number };
type Age = { key: string; label: string; population2016: number; population2026: number; delta: number; changePercent: number; share2016: number; share2026: number; shareDeltaPoints: number };
type Region = { code: string; name: string; population2016: number; population2026: number; delta: number; changePercent: number };
export type PopulationChartData = {
  annualPopulation: Annual[];
  ageComposition: Age[];
  regions: { count: number; populationCoverage2026: number; rows: Region[]; deltaIncreaseTop: Region[]; deltaDecreaseTop: Region[]; rateEligibleCount: number; rateExcludedSmallBaseline: { code: string; name: string; population2016: number; population2026: number; delta: number }[]; rateIncreaseTop: Region[]; rateDecreaseTop: Region[] };
};

const n = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${n(Math.abs(value))}`;
const percent = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(1)}%`;

export default function PopulationCharts({ data }: { data: PopulationChartData }) {
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [measure, setMeasure] = useState<"delta" | "rate">("delta");
  const [selectedCode, setSelectedCode] = useState(data.regions.rows[0]?.code ?? "");
  const rows = measure === "delta"
    ? direction === "increase" ? data.regions.deltaIncreaseTop : data.regions.deltaDecreaseTop
    : direction === "increase" ? data.regions.rateIncreaseTop : data.regions.rateDecreaseTop;
  const tableRows = useMemo(() => [...data.regions.rows].sort((a, b) => {
    const diff = measure === "delta" ? a.delta - b.delta : a.changePercent - b.changePercent;
    return (direction === "increase" ? -diff : diff) || a.name.localeCompare(b.name, "ja");
  }), [data.regions.rows, direction, measure]);
  const selected = data.regions.rows.find((row) => row.code === selectedCode);
  const maximum = Math.max(1, ...rows.map((row) => Math.abs(measure === "delta" ? row.delta : row.changePercent)));
  const annual = data.annualPopulation;
  const min = Math.min(...annual.map((row) => row.population)) - 2500;
  const max = Math.max(...annual.map((row) => row.population)) + 1000;
  const points = annual.map((row, index) => `${50 + index * 70},${24 + ((max - row.population) / (max - min)) * 160}`).join(" ");
  const ageColors = ["bg-cyan-700", "bg-blue-800", "bg-amber-700"];

  return <div className="space-y-6">
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <figcaption className="font-semibold text-slate-900">各年9月末の全市人口</figcaption>
      <p className="mt-1 text-xs text-slate-600">住民基本台帳・日本人と外国人の合計 · 人</p><p className="mt-1 text-xs text-slate-600">対象：八王子市全市 · 分母：割合計算なし · 基準日：各年9月30日</p>
      <div className="mt-4 overflow-x-auto"><svg viewBox="0 0 800 230" role="img" aria-label="2016年から2026年まで、八王子市人口の9月末推移" className="min-w-[620px] w-full">
        {[0, 1, 2, 3].map((step) => { const y = 24 + step * 53; const label = Math.round(max - ((max - min) * step) / 3); return <g key={step}><line x1="50" x2="750" y1={y} y2={y} stroke="#cbd5e1" strokeDasharray="4 4"/><text x="45" y={y + 4} textAnchor="end" fontSize="11" fill="#475569">{n(label)}</text></g>; })}
        <polyline points={points} fill="none" stroke="#0369a1" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
        {annual.map((row, index) => { const x = 50 + index * 70; const y = 24 + ((max - row.population) / (max - min)) * 160; return <g key={row.targetDate}><circle cx={x} cy={y} r="4" fill="white" stroke="#0369a1" strokeWidth="3"/><text x={x} y="210" textAnchor="middle" fontSize="11" fill="#334155">{row.targetDate.slice(0, 4)}</text></g>; })}
      </svg></div>
      <p className="mt-2 text-sm text-slate-700">11時点の実数は下の表にあります。2017年に563,538人となり、2026年は前年より56人増えています。</p>
    </figure>

    <figure className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <figcaption className="font-semibold text-slate-900">全市人口に占める年齢3区分</figcaption><p className="mt-1 text-xs text-slate-600">各年の全市人口を100%として表示</p><p className="mt-1 text-xs text-slate-600">対象：全市の年齢別人口 · 分母：各年の全市人口 · 基準日：2016年9月30日・2026年9月30日</p>
      <div className="mt-5 space-y-5">{([2016, 2026] as const).map((year) => <div key={year}><p className="mb-2 text-sm font-bold">{year}年9月末</p><div className="flex h-8 overflow-hidden rounded-full" role="img" aria-label={`${year}年の年齢構成: ${data.ageComposition.map((row) => `${row.label} ${year === 2016 ? row.share2016 : row.share2026}%`).join("、")}`}>{data.ageComposition.map((row, i) => <span key={row.key} className={ageColors[i]} style={{ width: `${year === 2016 ? row.share2016 : row.share2026}%` }}/>)}</div><div className="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums text-slate-700">{data.ageComposition.map((row, i) => <p key={row.key}><span className={`mr-1 inline-block size-2 rounded-full ${ageColors[i]}`} aria-hidden="true"/>{row.label}<br/>{(year === 2016 ? row.share2016 : row.share2026).toFixed(1)}%</p>)}</div></div>)}</div>
      <p className="mt-4 text-sm text-slate-700">人数・構成比・構成比の差は記事内の表でも確認できます。年齢区分の移動を含み、同じ人々を追跡した図ではありません。</p>
    </figure>

    <section aria-labelledby="regional-chart-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h3 id="regional-chart-title" className="text-lg font-bold text-slate-900">町丁別に見る：増える・減るを切り替える</h3>
      <p className="mt-1 text-sm text-slate-600">比較対象は191町丁。2026年9月末の全市人口に対するカバー率は{data.regions.populationCoverage2026.toFixed(1)}%。</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <fieldset><legend className="mb-2 text-sm font-semibold">見る指標</legend><div className="flex flex-wrap gap-2">{([["delta", "人数（人）"], ["rate", "増減率（%）"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={measure === value} onClick={() => setMeasure(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${measure === value ? "border-sky-800 bg-sky-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}>{label}</button>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">方向</legend><div className="flex flex-wrap gap-2">{([["increase", "増加が大きい順"], ["decrease", "減少が大きい順"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={direction === value} onClick={() => setDirection(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${direction === value ? "border-sky-800 bg-sky-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}>{label}</button>)}</div></fieldset>
      </div>
      <p className="mt-4 text-xs text-slate-600">対象：境界変更関連の除外8町丁を除く191町丁 · 分母：率は各町丁の2016年人口（100人以上の190町丁） · 基準日：2016年9月末→2026年9月末</p>
      {measure === "rate" && <p className="mt-2 text-xs text-slate-600">宇津貫町は2016年65人のため、率の主順位から分けています。</p>}
      <figure className="mt-5" aria-label={`${measure === "delta" ? "人数の増減" : "増減率"}、${direction === "increase" ? "増加" : "減少"}が大きい順`}>
        <figcaption className="sr-only">上位町丁。符号・「増」「減」と数値で示し、色だけで区別しません。</figcaption>
        <ol className="space-y-3">{rows.map((row, index) => { const value = measure === "delta" ? row.delta : row.changePercent; const width = Math.max(1, Math.abs(value) / maximum * 100); return <li key={row.code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"><span className="min-w-0 truncate font-medium text-slate-900">{index + 1}. {row.name}</span><span className="text-right font-bold tabular-nums text-slate-900">{signed(value)}{measure === "delta" ? "人" : "%"}{value > 0 ? " 増" : value < 0 ? " 減" : ""}</span><span className="col-span-2 block h-2 rounded-full bg-slate-100" aria-hidden="true"><span className={`block h-2 rounded-full ${value >= 0 ? "bg-sky-700" : "bg-amber-700"}`} style={{ width: `${width}%` }}/></span></li>; })}</ol>
        <p className="mt-3 text-xs text-slate-600">棒の長さは現在の順位内での相対値です。</p>
      </figure>
      <div className="mt-6 rounded-xl bg-slate-50 p-4"><label htmlFor="town-choice" className="block text-sm font-semibold">町丁を選んで2時点を比べる</label><select id="town-choice" value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-700">{data.regions.rows.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</select>{selected && <p className="mt-3 text-sm leading-6">{selected.name}：2016年 {n(selected.population2016)}人 → 2026年 {n(selected.population2026)}人、{signed(selected.delta)}人（{percent(selected.changePercent)}）。</p>}</div>
      <details className="mt-5 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold text-slate-900">比較対象191町丁の数値を表で見る</summary><div className="mt-4 max-h-[34rem] overflow-auto"><table className="w-full min-w-[680px] text-right text-sm"><caption className="mb-3 text-left">2016年9月末から2026年9月末の人口比較。区域変更関連の除外8町丁は含みません。</caption><thead className="sticky top-0 bg-white"><tr className="border-b border-slate-300"><th scope="col" className="p-2 text-left">町丁</th><th scope="col" className="p-2">2016年（人）</th><th scope="col" className="p-2">2026年（人）</th><th scope="col" className="p-2">増減（人）</th><th scope="col" className="p-2">増減率</th></tr></thead><tbody>{tableRows.map((row) => <tr key={row.code} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{row.name}</th><td className="p-2 tabular-nums">{n(row.population2016)}</td><td className="p-2 tabular-nums">{n(row.population2026)}</td><td className="p-2 tabular-nums">{signed(row.delta)}</td><td className="p-2 tabular-nums">{percent(row.changePercent)}</td></tr>)}</tbody></table></div></details>
    </section>
  </div>;
}
