"use client";
import { useMemo, useState } from "react";
import type { AgingRegion } from "@/lib/hachioji-aging-publication";

const n = (v: number) => new Intl.NumberFormat("ja-JP").format(v);
const share = (v: number | null) => v === null ? "算出なし" : `${v.toFixed(1)}%`;
const signed = (v: number, digits = 0) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toLocaleString("ja-JP", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
type Measure = "share" | "count" | "points";
const labels = { share: "65歳以上の割合（%）", count: "65歳以上の人数（人）", points: "割合の10年変化（ポイント）" };
const button = "rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700";

export default function AgingRegions({ rows }: { rows: AgingRegion[] }) {
  const [measure, setMeasure] = useState<Measure>("share");
  const [descending, setDescending] = useState(true);
  const [code, setCode] = useState(rows[0].code);
  const selected = rows.find(r => r.code === code)!;
  const value = (r: AgingRegion) => measure === "share" ? r.current.share65plus : measure === "count" ? r.current.age65plus : r.points;
  const ordered = useMemo(() => [...rows].sort((a, b) => {
    let difference: number;
    if (measure === "share") difference = a.current.age65plus * b.current.population - b.current.age65plus * a.current.population;
    else if (measure === "count") difference = a.current.age65plus - b.current.age65plus;
    else difference = (a.points ?? -Infinity) - (b.points ?? -Infinity);
    return (descending ? -difference : difference) || a.code.localeCompare(b.code);
  }), [rows, measure, descending]);
  const chartRows = ordered.filter(r => measure === "points" ? r.comparisonEligible : !r.smallPopulation && r.current.population > 0).slice(0, 12);
  const maximum = Math.max(1, ...chartRows.map(r => Math.abs(value(r) ?? 0)));
  const display = (r: AgingRegion) => {
    const v = value(r);
    return v === null ? "比較対象外" : measure === "share" ? share(v) : measure === "count" ? `${n(v)}人` : `${signed(v, 1)}ポイント`;
  };
  return <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <fieldset><legend className="mb-3 font-semibold text-slate-900">町丁別の指標を切り替える</legend><div className="flex flex-wrap gap-2">{(Object.keys(labels) as Measure[]).map(key => <button key={key} type="button" aria-pressed={measure === key} onClick={() => setMeasure(key)} className={`${button} ${measure === key ? "border-sky-900 bg-sky-900 text-white" : "border-slate-300 text-slate-800"}`}>{labels[key]}</button>)}</div></fieldset>
    <div className="flex flex-wrap gap-2" role="group" aria-label="並び順">{[true, false].map(order => <button key={String(order)} type="button" aria-pressed={descending === order} onClick={() => setDescending(order)} className={`${button} ${descending === order ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-800"}`}>{order ? "大きい順" : "小さい順"}</button>)}</div>
    <p className="text-xs leading-6 text-slate-600">{measure === "points" ? "2016-09-30→2026-09-30。分母：各年・各町丁の総人口。区域変更等8町丁と、両時点のいずれかが100人未満の町丁を順位から除く189町丁。" : "2026-09-30。割合の分母：各町丁の総人口。総人口100人以上の197町丁を順位の対象とし、うち先頭12町丁を表示。"}</p>
    <figure aria-label={`${labels[measure]}、${descending ? "大きい" : "小さい"}順`}>
      <figcaption className="mb-4 font-semibold text-slate-900">{labels[measure]}で見る12町丁</figcaption>
      <ol className="space-y-3">{chartRows.map(r => <li key={r.code}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3"><span className="font-semibold text-slate-900">{r.name}</span><span className="font-bold tabular-nums">{display(r)}</span></div>
        <p className="text-xs text-slate-500">総人口 {n(r.current.population)}人 · 65歳以上 {n(r.current.age65plus)}人</p>
        <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-slate-100"><span className={`block h-2 rounded-full ${(value(r) ?? 0) < 0 ? "bg-amber-700" : "bg-sky-700"}`} style={{ width: `${Math.abs(value(r) ?? 0) / maximum * 100}%` }} /></div>
      </li>)}</ol>
      <p className="mt-3 text-xs text-slate-500">棒は0を基準に絶対値を表示。長さの尺度は切り替えごとに変わります。変化の方向は符号で確認できます。</p>
    </figure>
    <div className="rounded-xl bg-slate-50 p-4">
      <label htmlFor="aging-town" className="block font-semibold text-slate-900">自分の住む町丁を調べる</label>
      <select id="aging-town" value={code} onChange={e => setCode(e.target.value)} className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base">{rows.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
      <div aria-live="polite" className="mt-4 space-y-2 text-sm leading-7">
        <p className="font-semibold text-slate-900">{selected.name} · 2026年9月末</p>
        <p>総人口 {n(selected.current.population)}人のうち、65歳以上 {n(selected.current.age65plus)}人（{share(selected.current.share65plus)}）。その内数は75歳以上 {n(selected.current.age75plus)}人、85歳以上 {n(selected.current.age85plus)}人です。</p>
        {selected.previous ? <p>2016年9月末：総人口 {n(selected.previous.population)}人、65歳以上 {n(selected.previous.age65plus)}人（{share(selected.previous.share65plus)}）。10年の変化は {signed(selected.delta65!)}人、{signed(selected.points!, 1)}ポイントです。</p> : <p>区域変更の確認、または施行時点が未確認のため、10年の変化は比較対象外です。最新時点の数値のみ表示します。</p>}
        {(selected.smallPopulation || (selected.previous && selected.previous.population < 100)) && <p>総人口が100人未満の時点があります。少人数の変化で割合が大きく動くため、順位とは分けて読んでください。</p>}
      </div>
    </div>
    <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold text-slate-900">全199町丁の人数・割合と比較条件を表で見る</summary>
      <div className="mt-4 max-h-[34rem] overflow-auto"><table className="w-full min-w-[760px] text-right text-sm">
        <caption className="mb-3 text-left">2026年9月末の全199町丁。10年変化は2016年9月末との比較。割合の分母は各年・各町丁の総人口。</caption>
        <thead className="sticky top-0 bg-white"><tr>{["町丁", "総人口（人）", "65歳以上（人）", "65歳以上の割合", "75歳以上（人）", "85歳以上（人）", "10年の割合差", "比較条件"].map(h => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
        <tbody>{ordered.map(r => <tr key={r.code} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{r.name}</th><td className="p-2">{n(r.current.population)}</td><td className="p-2">{n(r.current.age65plus)}</td><td className="p-2">{share(r.current.share65plus)}</td><td className="p-2">{n(r.current.age75plus)}</td><td className="p-2">{n(r.current.age85plus)}</td><td className="p-2">{r.points === null ? "比較対象外" : `${signed(r.points, 1)}pt`}</td><td className="p-2 text-left">{r.exclusion ? "区域変更等で過去比較外" : !r.comparisonEligible ? "小人口・変化順位外" : "10年比較対象"}</td></tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}
