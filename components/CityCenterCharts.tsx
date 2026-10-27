"use client";

import { useState } from "react";
import type { CityCenterData } from "@/lib/hachioji-city-center-publication";

const n = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${n(Math.abs(value))}`;
const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6";
const button = (active: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${active ? "border-teal-900 bg-teal-900 text-white" : "border-slate-300 bg-white text-slate-800"}`;

function LinePlot({ years, series, title, unit }: { years: number[]; series: { name: string; color: string; values: number[]; dashed?: boolean }[]; title: string; unit: string }) {
  const maximum = Math.ceil(Math.max(...series.flatMap(s => s.values)) / 4 / 1000) * 4000;
  const x = (index: number) => 72 + index * 618 / Math.max(1, years.length - 1);
  const y = (value: number) => 225 - value / maximum * 190;
  return <>
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">{series.map(s => <li key={s.name} className="flex items-center gap-2"><span className="inline-block w-5 border-t-[3px]" style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }} aria-hidden="true"/>{s.name}</li>)}</ul>
    <div className="mt-3 overflow-x-auto rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-800" tabIndex={0} role="region" aria-label={`${title}のグラフ。横にスクロールできます`}>
      <svg viewBox="0 0 730 275" role="img" aria-label={`${title}。縦軸は${unit}、0から表示。数値は直後の表を参照`} className="w-full min-w-[550px]">
        {[0, 1, 2, 3, 4].map(step => { const value = maximum * step / 4; return <g key={step}><line x1="72" x2="690" y1={y(value)} y2={y(value)} stroke="#cbd5e1" strokeDasharray="3 5"/><text x="64" y={y(value) + 4} textAnchor="end" fontSize="12" fill="#475569">{n(value)}</text></g>; })}
        <text x="72" y="18" fontSize="12" fill="#475569">{unit}</text>
        {series.map(s => <g key={s.name}><polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed ? "6 5" : undefined} fill="none" strokeLinejoin="round"/>{s.values.map((v, i) => <circle key={years[i]} cx={x(i)} cy={y(v)} r="3.5" fill="white" stroke={s.color} strokeWidth="2"/>)}</g>)}
        {years.map((year, i) => <text key={year} x={x(i)} y="253" textAnchor="middle" fontSize="12" fill="#334155">{year}</text>)}
      </svg>
    </div>
  </>;
}

function PopulationPanel({ rows, caption }: { rows: CityCenterData["population"]["recent"]; caption: string }) {
  return <figure className={card}><figcaption className="font-bold text-slate-900">{caption}</figcaption><p className="mt-1 text-xs text-slate-600">各年12月31日 · 人 · 市公表の集計範囲。115ha内の厳密人口とは断定しません。</p>
    <LinePlot years={rows.map(r => r.year)} series={[{ name: "掲載人口", color: "#0f766e", values: rows.map(r => r.population) }]} title={caption} unit="人"/>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-right text-sm"><caption className="sr-only">{caption}、各年12月31日、人</caption><thead><tr className="border-b border-slate-200"><th scope="col" className="p-2 text-left">年</th><th scope="col" className="p-2">掲載人口（人）</th></tr></thead><tbody>{rows.map(r => <tr key={r.year} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-normal">{r.year}</th><td className="p-2 tabular-nums">{n(r.population)}</td></tr>)}</tbody></table></div>
  </figure>;
}

export function CityPopulationCharts({ data }: { data: CityCenterData["population"] }) {
  return <div className="space-y-5"><PopulationPanel rows={data.recent} caption="2022–2025年：市フォローアップの掲載人口"/>
    <details className={card}><summary className="cursor-pointer font-semibold text-teal-900">旧資料の2012–2021年を別に見る</summary><div className="mt-4"><PopulationPanel rows={data.historical} caption="2012–2021年：旧資料の17町丁合計"/><p className="mt-3 text-sm">{data.reason}</p><div className="mt-3 overflow-x-auto"><table className="w-full text-right text-sm"><caption className="mb-2 text-left">同じ各年12月末の市全体との参考比較（人）。上の新しい系列へは接続しません。</caption><thead><tr><th scope="col" className="p-2 text-left">年</th><th scope="col" className="p-2">17町丁</th><th scope="col" className="p-2">市全体</th></tr></thead><tbody>{data.historical.map(r => <tr key={r.year} className="border-t border-slate-100"><th scope="row" className="p-2 text-left font-normal">{r.year}</th><td className="p-2 tabular-nums">{n(r.population)}</td><td className="p-2 tabular-nums">{n(r.cityPopulation)}</td></tr>)}</tbody></table></div></div></details>
  </div>;
}

export function CityWalkingTrend({ data }: { data: CityCenterData["walking"] }) {
  const [scope, setScope] = useState<"plan23" | "all32">("plan23");
  const rows = data[scope];
  const title = scope === "plan23" ? "計画指標の23地点" : "駅通路などを含む全32地点";
  const series = [{ name: "休日の調査値", color: "#b45309", values: rows.map(r => r.holiday) }, { name: "平日の調査値", color: "#0369a1", values: rows.map(r => r.weekday) }];
  return <figure className={card}><figcaption className="text-lg font-bold text-slate-900">歩行量の推移：平日と休日を分ける</figcaption>
    <fieldset className="mt-4"><legend className="mb-2 text-sm font-semibold">集計する地点</legend><div className="flex flex-wrap gap-2">{([["plan23", "計画の23地点"], ["all32", "調査全32地点"]] as const).map(([value, label]) => <button type="button" key={value} className={button(scope === value)} aria-pressed={scope === value} onClick={() => setScope(value)}>{label}</button>)}</div></fieldset>
    <p className="mt-3 text-sm font-semibold" aria-live="polite">{title} · 各年度の調査日の9–22時 · 通過計数（人/13時間）</p>
    <LinePlot years={rows.map(r => r.year)} series={scope === "plan23" ? [...series, { name: "2:5加重平均", color: "#6d28d9", values: rows.map(r => r.weighted), dashed: true }] : series} title={title} unit="人/13時間"/>
    <p className="mt-2 text-sm text-slate-600">同じ人が複数地点を通る場合もあります。来街者の実人数や、年間の総人流ではありません。</p>
    <details className="mt-4 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer font-semibold">2016–2025年度の数値表</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[390px] text-right text-sm"><caption className="mb-2 text-left">{title}。各年度の調査値、単位：人/13時間。23地点の平均のみ2:5で加重。</caption><thead><tr><th scope="col" className="p-2 text-left">年度</th><th scope="col" className="p-2">休日</th><th scope="col" className="p-2">平日</th>{scope === "plan23" && <th scope="col" className="p-2">加重平均</th>}</tr></thead><tbody>{rows.map(r => <tr key={r.year} className="border-t border-slate-200"><th scope="row" className="p-2 text-left font-normal">{r.year}</th><td className="p-2 tabular-nums">{n(r.holiday)}</td><td className="p-2 tabular-nums">{n(r.weekday)}</td>{scope === "plan23" && <td className="p-2 tabular-nums">{n(r.weighted)}</td>}</tr>)}</tbody></table></div></details>
  </figure>;
}

export function CityPointChanges({ points }: { points: CityCenterData["walking"]["pointChanges"] }) {
  const [day, setDay] = useState<"weekday" | "holiday">("weekday");
  const [all, setAll] = useState(false);
  const rows = [...points.filter(p => all || p.inPlan)].sort((a, b) => b[day].delta - a[day].delta);
  const max = Math.max(1, ...rows.map(p => Math.abs(p[day].delta)));
  return <section className={card} aria-labelledby="point-comparison-title"><h3 id="point-comparison-title" className="text-lg font-bold text-slate-900">どの通りで増え、どこで減った？</h3><p className="mt-1 text-sm">2024→2025年度、同じ地点の通過計数の差（人/13時間）。人数差で並べています。</p>
    <div className="mt-4 flex flex-wrap gap-5"><fieldset><legend className="mb-2 text-sm font-semibold">調査日</legend><div className="flex gap-2">{([["weekday", "平日"], ["holiday", "休日"]] as const).map(([v, label]) => <button key={v} type="button" aria-pressed={day === v} className={button(day === v)} onClick={() => setDay(v)}>{label}</button>)}</div></fieldset><fieldset><legend className="mb-2 text-sm font-semibold">地点の範囲</legend><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={!all} className={button(!all)} onClick={() => setAll(false)}>23地点</button><button type="button" aria-pressed={all} className={button(all)} onClick={() => setAll(true)}>全32地点</button></div></fieldset></div>
    <p className="mt-4 text-sm font-semibold text-slate-800" aria-live="polite">{day === "weekday" ? "平日" : "休日"} · {all ? "全32地点" : "計画の23地点"} · 上位・下位の4地点ずつ</p>
    <ol className="mt-4 space-y-4">{[...rows.slice(0, 4), ...rows.slice(-4)].map(p => <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm"><span className="min-w-0 font-medium text-slate-800">No.{p.id} {p.name}</span><span className="font-bold tabular-nums">{signed(p[day].delta)}{p[day].delta >= 0 ? " 増" : " 減"}</span><span className="col-span-2 block h-2 rounded-full bg-slate-100" aria-hidden="true"><span className={`block h-2 rounded-full ${p[day].delta >= 0 ? "bg-teal-700" : "bg-amber-700"}`} style={{ width: `${Math.abs(p[day].delta) / max * 100}%` }}/></span></li>)}</ol>
    <p className="mt-3 text-xs text-slate-600">棒は現在の地点集合における増減の絶対値。色に加え符号・増減文字で区別。動線や目的を追跡した調査ではありません。</p>
    <details className="mt-5 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer font-semibold">全{rows.length}地点の2時点を表で見る</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[580px] text-right text-sm"><caption className="mb-2 text-left">{day === "weekday" ? "平日" : "休日"}の同地点比較。人/13時間。地点番号は歩行量調査報告書に対応。</caption><thead><tr><th scope="col" className="p-2 text-left">調査地点</th><th scope="col" className="p-2">2024</th><th scope="col" className="p-2">2025</th><th scope="col" className="p-2">差</th></tr></thead><tbody>{rows.map(p => <tr key={p.id} className="border-t border-slate-200"><th scope="row" className="p-2 text-left font-normal">{p.id}. {p.name}</th><td className="p-2 tabular-nums">{n(p[day].previous)}</td><td className="p-2 tabular-nums">{n(p[day].current)}</td><td className="p-2 tabular-nums">{signed(p[day].delta)}</td></tr>)}</tbody></table></div></details>
  </section>;
}

function VacancyBars({ rows, title }: { rows: CityCenterData["vacancies"]["recent"]; title: string }) {
  return <figure className={card}><figcaption className="font-bold text-slate-900">{title}</figcaption><p className="mt-1 text-xs text-slate-600">1階路面の空き店舗数 · 店舗 · 棒の上限は140店舗、0から表示</p><ol className="mt-5 space-y-4">{rows.map(r => <li key={r.year} className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"><span>{r.year}年度</span><span className="h-5 rounded bg-slate-100" aria-hidden="true"><span className="block h-5 rounded bg-amber-700" style={{ width: `${r.count / 140 * 100}%` }}/></span><span className="text-right font-bold tabular-nums">{n(r.count)}</span></li>)}</ol></figure>;
}

export function CityVacancyCharts({ data }: { data: CityCenterData["vacancies"] }) {
  return <div className="space-y-5"><VacancyBars rows={data.recent} title="2021–2025年度：フォローアップの空き店舗数"/><details className={card}><summary className="cursor-pointer font-semibold text-teal-900">旧資料の2018–2021年度を別に見る</summary><div className="mt-4"><VacancyBars rows={data.historical} title="2018–2021年度：基本計画の空き店舗数"/><p className="mt-3 text-sm">{data.reason} 2021年度の86店舗は両表に登場しますが、同じ期間を二重に加算していません。</p></div></details></div>;
}
