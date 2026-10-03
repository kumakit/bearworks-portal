"use client";

import { useState } from "react";
import type { AutumnData } from "@/lib/hachioji-rain-autumn-publication";

const fmt = (n: number) => n.toFixed(1);
const colors = { cool: "#4f759b", middle: "#047857", warm: "#c2410c" };

export default function AutumnCharts({ data }: { data: AutumnData }) {
  const [threshold, setThreshold] = useState(1);
  const [year, setYear] = useState(2025);
  const comparison = data.comparison[threshold];
  const selected = data.annual.find(a => a.year === year)!;
  const { low, high } = comparison;
  return <div className="space-y-6">
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
      <p className="font-bold text-emerald-950">気温の区切りを変えてみる</p><p className="mt-2 text-sm leading-7 text-emerald-950">下限は含み、上限は含みません。下の比較・年別図・カレンダーが一緒に切り替わります。</p>
      <div role="group" aria-label="中間の気温帯の定義" className="mt-4 flex flex-wrap gap-2">{data.comparison.map((c, i) => <button type="button" key={c.low} aria-pressed={threshold === i} onClick={() => setThreshold(i)} className={`rounded-full border px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${threshold === i ? "border-emerald-800 bg-emerald-800 text-white" : "border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100"}`}>{c.low}℃以上{c.high}℃未満{i === 1 ? "（基本）" : ""}</button>)}</div>
      <p aria-live="polite" className="mt-4 text-sm leading-7 text-emerald-950">中間の日数：最初の期間 {fmt(comparison.early.middle)}日 → 最近の期間 {fmt(comparison.late.middle)}日。差は {fmt(comparison.middle_difference)}日です。</p>
    </div>

    <figure className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold text-slate-900">9〜11月の91日を、三つに分ける</h3>
      <div className="my-4 flex flex-wrap gap-x-5 gap-y-2 text-xs"><span style={{ color: colors.cool }}>■ {low}℃未満</span><span style={{ color: colors.middle }}>■ {low}℃以上{high}℃未満</span><span style={{ color: colors.warm }}>■ {high}℃以上</span></div>
      {[["2009〜2013年", comparison.early], ["2021〜2025年", comparison.late]].map(([label, item]) => { const c = item as typeof comparison.early; return <div key={String(label)} className="mt-5">
        <p className="mb-2 text-sm font-semibold">{String(label)} <span className="font-normal text-slate-500">採用{c.years.length}年の平均</span></p>
        <div className="flex h-10 overflow-hidden rounded-lg" role="img" aria-label={`${label}：${low}℃未満${fmt(c.cool)}日、中間${fmt(c.middle)}日、${high}℃以上${fmt(c.warm)}日`}>{(["cool", "middle", "warm"] as const).map(key => <div key={key} className="flex items-center justify-center text-xs font-bold text-white" style={{ width: `${c[key] / 91 * 100}%`, backgroundColor: colors[key] }}>{fmt(c[key])}</div>)}</div>
        <p className="mt-1 text-xs text-slate-500">採用年：{c.years.join("・")}</p>
      </div>; })}
      <figcaption className="mt-4 text-xs leading-6 text-slate-600">両方とも横幅は91日。棒の数値は日数です。2021年は正常値が90日で、主集計の最近の期間は2022〜2025年の4年です。</figcaption>
    </figure>

    <figure className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-bold">平均の間に、17回の秋がある</h3><p className="mt-2 text-xs leading-6 text-slate-600">日平均気温{low}℃以上{high}℃未満の日数。どの年も0〜91日の共通目盛り。</p>
      <div className="mt-5 space-y-2">{data.annual.map(a => <div key={a.year} className="grid grid-cols-[2.8rem_1fr_4.2rem] items-center gap-3 text-xs"><span className="tabular-nums text-slate-600">{a.year}</span>{a.complete ? <><div className="h-4 rounded bg-slate-100"><div className="h-4 rounded bg-emerald-700" style={{ width: `${a.thresholds[threshold].middle / 91 * 100}%` }} /></div><span className="text-right tabular-nums">{a.thresholds[threshold].middle}日</span></> : <><div className="border-b border-dashed border-slate-300" /><span className="text-right text-slate-500">対象外</span></>}</div>)}</div>
      <figcaption className="mt-4 text-xs leading-6 text-slate-600">2014・2018・2021年は正常値が91日そろわず、主集計から除外。欠測年を0として扱っていません。1年単位の上下があり、平均差は毎年一様に短くなったことを意味しません。</figcaption>
    </figure>

    <figure className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="font-bold">「何日あるか」と「何日続くか」</h3><label className="flex items-center gap-2 text-sm">カレンダーの年<select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">{data.annual.map(a => <option key={a.year} value={a.year}>{a.year}年{a.complete ? "" : "（欠測あり）"}</option>)}</select></label></div>
      <p className="mt-4 text-sm leading-7">{selected.complete ? <>この年の中間の日数は<strong>{selected.thresholds[threshold].middle}日</strong>。最長で連続したのは<strong>{selected.thresholds[threshold].longest_run}日</strong>です。</> : <>この年は主集計の対象外です。確認できた正常値{selected.valid_days}日を表示し、不採用の1日は斜線で残します。</>}</p>
      <div className="mt-5 space-y-5">{[9, 10, 11].map(month => <div key={month}><p className="mb-2 text-xs font-bold text-slate-600">{month}月</p><div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))]">{selected.daily.filter(d => String(d[0]).startsWith(String(month).padStart(2, "0"))).map(d => {
        const date = String(d[0]); const value = d[1] as number | null; const color = value === null ? "#e2e8f0" : value < low ? colors.cool : value >= high ? colors.warm : colors.middle;
        return <div key={date} title={`${year}-${date}：${value === null ? "不採用" : `${value}℃`}`} className="flex aspect-square items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: color, backgroundImage: value === null ? "repeating-linear-gradient(45deg,transparent,transparent 4px,#64748b 4px,#64748b 5px)" : undefined }}><span aria-hidden="true">{Number(date.slice(3))}</span><span className="sr-only">{date}：{value === null ? "不採用" : `${value}℃`}</span></div>;
      })}</div></div>)}</div>
      <figcaption className="mt-4 text-xs leading-6 text-slate-600">1マスが1日。青は{low}℃未満、緑は{low}℃以上{high}℃未満、橙は{high}℃以上。色が行き来するため、最初と最後の緑の間が全部「中間の日」とは限りません。</figcaption>
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-emerald-800">日付と気温を表で見る</summary><div className="mt-3 max-h-72 overflow-y-auto"><table className="w-full text-right"><caption className="text-left">{year}年9〜11月・八王子の日平均気温（℃）</caption><thead><tr><th scope="col" className="py-2 text-left">月日</th><th scope="col">気温</th><th scope="col">区分</th></tr></thead><tbody>{selected.daily.map(d => { const value = d[1] as number | null; return <tr key={String(d[0])} className="border-t border-slate-100"><th scope="row" className="py-2 text-left font-normal">{String(d[0])}</th><td>{value === null ? "—" : fmt(value)}</td><td>{value === null ? "不採用" : value < low ? `${low}℃未満` : value >= high ? `${high}℃以上` : "中間"}</td></tr>; })}</tbody></table></div></details>
    </figure>
  </div>;
}
