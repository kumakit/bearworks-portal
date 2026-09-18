"use client";

import { useState } from "react";
import {
  annualComparison, average, caseCooling, caseDate, caseLabel, comparisonPeriods,
  hourlyCases, recentDifference, recentYears, signed, summary, temperatureDifference,
  validTemperature, type HeatMetric,
} from "@/lib/hachioji-heat-publication";

const orange = "#c2410c";
const blue = "#1d4ed8";
const ink = "#475569";
const grid = "#e2e8f0";
const stationNames = { hachioji: "八王子", tokyo: "東京都心" };
const stations = ["hachioji", "tokyo"] as const;
const buttonStyle = (active: boolean) => `min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`;

function Legend() {
  return <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
    <span className="inline-flex items-center gap-2 text-orange-800"><span className="h-2.5 w-2.5 rounded-full bg-orange-700" aria-hidden="true" />八王子 · 実線</span>
    <span className="inline-flex items-center gap-2 text-blue-800"><span className="h-2.5 w-2.5 bg-blue-700" aria-hidden="true" />東京都心 · 破線</span>
  </p>;
}

function MetricButtons({ value, onChange }: { value: HeatMetric; onChange: (value: HeatMetric) => void }) {
  return <div className="flex flex-wrap gap-2" role="group" aria-label="比較する指標">
    <button type="button" aria-pressed={value === "heatstroke_days"} className={buttonStyle(value === "heatstroke_days")} onClick={() => onChange("heatstroke_days")}>猛暑日</button>
    <button type="button" aria-pressed={value === "min_temp_ge25_days"} className={buttonStyle(value === "min_temp_ge25_days")} onClick={() => onChange("min_temp_ge25_days")}>日最低25℃以上</button>
  </div>;
}

export function RecentHeatBars({ metric, max }: { metric: HeatMetric | "midsummer_days"; max: number }) {
  const data = summary.recent_averages_2020_2025[metric];
  const rows = [{ key: "hachioji", name: "八王子" }, { key: "tokyo", name: "東京都心" }, { key: "fuchu", name: "府中" }, { key: "ome", name: "青梅" }] as const;
  return <figure>
    <div className="space-y-5">{rows.map(row => <div key={row.key}>
      <div className="mb-2 flex items-baseline justify-between text-sm"><span className="font-semibold text-slate-800">{row.name}</span><span className="font-bold tabular-nums text-slate-900">{data[row.key].toFixed(1)} <span className="text-xs font-normal">日/年</span></span></div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className={`h-full rounded-full ${row.key === "hachioji" ? "bg-orange-700" : row.key === "tokyo" ? "bg-blue-700" : "bg-slate-400"}`} style={{ width: `${data[row.key] / max * 100}%` }} /></div>
    </div>)}</div>
    <div className="mt-4 flex justify-between border-t border-slate-200 pt-2 text-xs text-slate-500" aria-hidden="true"><span>0</span><span>{max / 2}</span><span>{max} 日/年</span></div>
    <figcaption className="mt-4 text-sm leading-6 text-slate-600">2020〜2025年の年間日数を6年で平均。欠測分の推計・補正はしていません。</figcaption>
  </figure>;
}

export function RecentDifferenceChart() {
  const [metric, setMetric] = useState<HeatMetric>("heatstroke_days");
  const isHeat = metric === "heatstroke_days";
  const x = (value: number) => 340 + value * 5;
  const mean = recentDifference(metric);
  return <div className="space-y-5">
    <MetricButtons value={metric} onChange={setMetric} />
    <figure>
      <div className="overflow-x-auto rounded-2xl bg-slate-50 p-2" tabIndex={0} role="region" aria-label="年ごとの地点間差の図。横にスクロールできます">
        <svg viewBox="0 0 680 340" className="min-w-[550px] w-full" role="img" aria-labelledby="recent-difference-title recent-difference-desc">
          <title id="recent-difference-title">{isHeat ? "猛暑日" : "日最低25℃以上"}の年間日数差、八王子 − 東京都心</title>
          <desc id="recent-difference-desc">{recentYears.map(row => `${row.year}年 ${signed(row.hachioji[metric] - row.tokyo[metric], 0)}日`).join("、")}。6年平均差 {signed(mean)}日。全指標で共通の目盛り。</desc>
          <text x="105" y="27" fontSize="13" fill={blue}>← 八王子が少ない</text><text x="575" y="27" textAnchor="end" fontSize="13" fill={orange}>八王子が多い →</text>
          {[-40, -20, 0, 20, 40].map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1="43" y2="280" stroke={value === 0 ? ink : grid} strokeWidth={value === 0 ? 1.5 : 1} /><text x={x(value)} y="305" textAnchor="middle" fontSize="13" fill={ink}>{signed(value, 0)}</text></g>)}
          <line x1={x(mean)} x2={x(mean)} y1="43" y2="280" stroke="#64748b" strokeDasharray="5 5" />
          {recentYears.map((row, i) => {
            const delta = row.hachioji[metric] - row.tokyo[metric];
            const y = 62 + i * 40;
            return <g key={row.year}><text x="20" y={y + 5} fontSize="14" fill={ink}>{row.year}</text><line x1={x(0)} x2={x(delta)} y1={y} y2={y} stroke={delta >= 0 ? "#fed7aa" : "#bfdbfe"} strokeWidth="10" /><circle cx={x(delta)} cy={y} r="6" fill={delta >= 0 ? orange : blue} /><text x={x(delta) + (delta >= 0 ? 15 : -15)} y={y + 5} textAnchor={delta >= 0 ? "start" : "end"} fontSize="15" fontWeight="700" fill={delta >= 0 ? orange : blue}>{signed(delta, 0)}</text></g>;
          })}
          <text x="340" y="332" textAnchor="middle" fontSize="13" fill={ink}>年間日数差（日） · 破線は6年平均 {signed(mean)}日</text>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-slate-600">各点は同じ年の差。右側は八王子が多く、左側は少ないことを示します。範囲は年ごとのばらつきで、信頼区間ではありません。スマートフォンでは横にスクロールできます。</figcaption>
    </figure>
    <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-bold text-slate-800">6年分の日数と差を表で見る</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-right text-sm tabular-nums"><caption className="mb-3 text-left">{isHeat ? "猛暑日" : "日最低25℃以上"}（日/年）</caption><thead><tr>{["年", "八王子", "東京都心", "八王子 − 都心"].map(label => <th scope="col" key={label} className="whitespace-nowrap p-2">{label}</th>)}</tr></thead><tbody>{recentYears.map(row => <tr key={row.year} className="border-t border-slate-100"><th scope="row" className="p-2">{row.year}</th><td className="p-2">{row.hachioji[metric]}</td><td className="p-2">{row.tokyo[metric]}</td><td className="p-2">{signed(row.hachioji[metric] - row.tokyo[metric], 0)}</td></tr>)}</tbody></table></div></details>
  </div>;
}

export function AnnualTrendChart() {
  const [metric, setMetric] = useState<HeatMetric>("heatstroke_days");
  return <div className="space-y-5">
    <MetricButtons value={metric} onChange={setMetric} /><Legend />
    <div className="grid gap-4 md:grid-cols-2">{comparisonPeriods.map(period => {
      const rows = annualComparison.filter(row => row.year >= period.start && row.year <= period.end);
      const x = (i: number) => 42 + i / (rows.length - 1) * 286;
      const y = (value: number) => 158 - value * 2;
      const delta = average(rows.map(row => row.hachioji[metric] - row.tokyo[metric]));
      return <figure key={period.start} className="min-w-0 rounded-2xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-900">{period.start}〜{period.end}年 <span className="text-sm font-normal text-slate-500">／ {rows.length}年</span></h3>
        <div className="overflow-x-auto" role="region" tabIndex={0} aria-label={`${period.start}〜${period.end}年の図。横にスクロールできます`}>
        <svg viewBox="0 0 360 200" className="mt-3 w-full min-w-[360px]" role="img" aria-label={`${period.start}〜${period.end}年、${metric === "heatstroke_days" ? "猛暑日" : "日最低25℃以上"}。平均差は八王子 − 東京都心 ${signed(delta)}日/年。`}>
          {[0, 20, 40, 60].map(value => <g key={value}><line x1="42" x2="328" y1={y(value)} y2={y(value)} stroke={grid} /><text x="33" y={y(value) + 4} textAnchor="end" fontSize="12" fill={ink}>{value}</text></g>)}
          <text x="8" y="17" fontSize="12" fill={ink}>日/年</text>
          {stations.map(station => <g key={station}><path d={rows.map((row, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(row[station][metric])}`).join(" ")} fill="none" stroke={station === "hachioji" ? orange : blue} strokeWidth="2" strokeDasharray={station === "tokyo" ? "5 4" : undefined} />{rows.map((row, i) => <circle key={row.year} cx={x(i)} cy={y(row[station][metric])} r="3" fill={station === "hachioji" ? orange : blue}><title>{row.year}年 {stationNames[station]} {row[station][metric]}日</title></circle>)}</g>)}
          {rows.map((row, i) => i === 0 || i === rows.length - 1 || i === Math.floor(rows.length / 2) ? <text key={row.year} x={x(i)} y="182" textAnchor="middle" fontSize="12" fill={ink}>{row.year}</text> : null)}
        </svg>
        </div>
        <figcaption className="text-sm text-slate-700">区間平均差 <strong className="tabular-nums">{signed(delta)} 日/年</strong>（八王子 − 都心）</figcaption>
        <p className="mt-2 text-xs text-slate-500 sm:hidden">図は横にスクロールできます。</p>
        <details className="mt-3 text-sm"><summary className="cursor-pointer text-blue-800">この区間の年別値</summary><table className="mt-2 w-full text-right tabular-nums"><caption className="text-left">年間日数（日/年）</caption><thead><tr><th scope="col">年</th><th scope="col">八王子</th><th scope="col">都心</th></tr></thead><tbody>{rows.map(row => <tr key={row.year} className="border-t border-slate-100"><th scope="row" className="py-1">{row.year}</th><td>{row.hachioji[metric]}</td><td>{row.tokyo[metric]}</td></tr>)}</tbody></table></details>
      </figure>;
    })}</div>
    <p className="text-sm leading-6 text-slate-600">縦軸は全図・両指標とも0〜60日/年。横軸は区間ごとに年数が違うため、線の傾きを図同士で比べないでください。観測環境の境界を含む2008年・2014年を除外し、2003年で区間を分けています。区間をまたぐ変化率は推定していません。</p>
  </div>;
}

export function HourlyCaseChart() {
  const [selected, setSelected] = useState(0);
  const item = hourlyCases[selected];
  const cooling = caseCooling(item);
  const series = item.series;
  const initialDate = caseDate(item);
  const start = Date.parse(series[0].datetime);
  const elapsed = (datetime: string) => (Date.parse(datetime) - start) / 3_600_000;
  const x = (datetime: string) => 58 + elapsed(datetime) / 29 * 594;
  const y = (value: number) => 244 - (value - 20) * 10;
  const deltaY = (value: number) => 372 - value * 11;
  const midnight = series.find(point => point.date !== initialDate)!;
  const evening = series.find(point => point.date === initialDate && point.hour === 18)!;
  const morning = series.find(point => point.date !== initialDate && point.hour === 5)!;
  const path = (value: (point: typeof series[number]) => number | null, scale: (value: number) => number) => {
    let connected = false;
    return series.map(point => {
      const v = value(point);
      if (v === null) { connected = false; return ""; }
      const command = `${connected ? "L" : "M"}${x(point.datetime)},${scale(v)}`;
      connected = true;
      return command;
    }).join(" ");
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2" role="group" aria-label="表示する猛暑日の事例">{hourlyCases.map((c, i) => <button key={c.id} type="button" className={buttonStyle(selected === i)} aria-pressed={selected === i} onClick={() => setSelected(i)}>{caseLabel(c)}</button>)}</div>
    <div aria-live="polite"><h3 className="text-xl font-bold text-slate-900">{caseLabel(item)} の1時 → 翌日6時</h3><p className="mt-2 text-sm text-slate-600">30時刻の毎正時の気温。日最高・日最低気温そのものではありません。</p></div>
    <Legend />
    <figure>
      <div className="overflow-x-auto" role="region" tabIndex={0} aria-label="時間別気温と気温差の図。横にスクロールできます">
        <svg viewBox="0 0 720 475" className="min-w-[620px] w-full" role="img" aria-labelledby="hourly-title hourly-desc">
          <title id="hourly-title">{caseLabel(item)}の2地点の気温と、八王子 − 東京都心の気温差</title>
          <desc id="hourly-desc">上段は20〜40℃の共通軸、下段は気温差。縦の破線は翌日0時。色帯は18時から翌5時の比較区間で、日没・日の出を表しません。翌5時は八王子{cooling.hachioji.to}℃、東京都心{cooling.tokyo.to}℃。</desc>
          <rect x={x(evening.datetime)} y="44" width={x(morning.datetime) - x(evening.datetime)} height="200" fill="#eef2ff" />
          <text x="58" y="23" fontSize="14" fontWeight="700" fill={ink}>気温（℃）</text><text x="652" y="23" textAnchor="end" fontSize="12" fill="#4338ca">色帯：18時〜翌5時</text>
          {[20, 25, 30, 35, 40].map(value => <g key={value}><line x1="58" x2="652" y1={y(value)} y2={y(value)} stroke={grid} strokeDasharray={value === 25 ? "5 4" : undefined} /><text x="45" y={y(value) + 5} textAnchor="end" fontSize="13" fill={ink}>{value}</text></g>)}
          <text x="58" y="263" fontSize="12" fill={ink}>横の破線は25℃の目安。熱帯夜の判定線ではありません。</text>
          <line x1={x(midnight.datetime)} x2={x(midnight.datetime)} y1="44" y2="244" stroke="#94a3b8" strokeDasharray="4 5" />
          {stations.map(station => <g key={station}><path d={path(point => validTemperature(point, station), y)} fill="none" stroke={station === "hachioji" ? orange : blue} strokeWidth="2.5" strokeDasharray={station === "tokyo" ? "6 4" : undefined} />{series.map(point => {
            const t = validTemperature(point, station);
            return t === null ? null : <circle key={point.datetime} cx={x(point.datetime)} cy={y(t)} r="3" fill={station === "hachioji" ? orange : blue}><title>{point.date} {point.hour}時 {stationNames[station]} {t}℃</title></circle>;
          })}</g>)}
          <text x="58" y="287" fontSize="14" fontWeight="700" fill={ink}>気温差 ΔT ＝ 八王子 − 東京都心（℃）</text>
          <rect x="58" y="306" width="594" height="66" fill="#fff7ed" /><rect x="58" y="372" width="594" height="66" fill="#eff6ff" />
          {[-6, -3, 0, 3, 6].map(value => <g key={value}><line x1="58" x2="652" y1={deltaY(value)} y2={deltaY(value)} stroke={value === 0 ? ink : grid} /><text x="45" y={deltaY(value) + 4} textAnchor="end" fontSize="12" fill={ink}>{signed(value, 0)}</text></g>)}
          <line x1={x(midnight.datetime)} x2={x(midnight.datetime)} y1="306" y2="438" stroke="#94a3b8" strokeDasharray="4 5" />
          <path d={path(temperatureDifference, deltaY)} fill="none" stroke="#334155" strokeWidth="2" />
          {series.map(point => { const v = temperatureDifference(point); return v === null ? null : <circle key={point.datetime} cx={x(point.datetime)} cy={deltaY(v)} r="3" fill={v >= 0 ? orange : blue} />; })}
          <text x="646" y="323" textAnchor="end" fontSize="12" fill={orange}>＋ 八王子が高温</text><text x="646" y="427" textAnchor="end" fontSize="12" fill={blue}>− 八王子が低温</text>
          {series.filter(point => (point.date === initialDate && [1, 6, 12, 18].includes(point.hour)) || (point.date !== initialDate && [0, 6].includes(point.hour))).map(point => <text key={point.datetime} x={x(point.datetime)} y="461" textAnchor="middle" fontSize="13" fill={ink}>{point.date !== initialDate ? "翌" : ""}{point.hour}時</text>)}
        </svg>
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-slate-600">上下の図は同じ時刻に対応します。下段のゼロ線をまたぐと、2地点の高低関係が入れ替わります。全事例で同じ目盛りを使用。図は横にスクロールできます。</figcaption>
    </figure>
    <div className="grid gap-3 sm:grid-cols-3">{[
      ["18時の差", signed(temperatureDifference(evening)!), "八王子 − 東京都心"],
      ["翌5時の差", signed(temperatureDifference(morning)!), "八王子 − 東京都心"],
      ["八王子の翌5時", cooling.hachioji.to.toFixed(1), "大きく下がっても25℃以上"],
    ].map(([label, value, note]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}<span className="ml-1 text-sm">℃</span></p><p className="mt-2 text-xs text-slate-500">{note}</p></div>)}</div>
    <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-bold">この事例の30時刻を表で見る</summary><div className="mt-3 max-h-80 overflow-auto"><table className="w-full min-w-[440px] text-right text-sm tabular-nums"><caption className="mb-3 text-left">日時は日本時間。気温の品質8のみ。— は欠測・不採用で、0℃ではありません。</caption><thead><tr>{["日時（JST）", "八王子 ℃", "都心 ℃", "差 ℃"].map(label => <th scope="col" key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{series.map(point => { const delta = temperatureDifference(point); return <tr key={point.datetime} className="border-t border-slate-100"><th scope="row" className="whitespace-nowrap p-2 text-left font-normal">{point.date.slice(5)} {point.hour}時</th>{stations.map(station => <td key={station} className="p-2">{validTemperature(point, station)?.toFixed(1) ?? "—"}</td>)}<td className="p-2">{delta === null ? "—" : signed(delta)}</td></tr>; })}</tbody></table></div></details>
  </div>;
}

export function CoolingRateComparison() {
  return <div className="grid gap-5 lg:grid-cols-3">{hourlyCases.map(item => {
    const values = caseCooling(item);
    return <figure key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900">{caseLabel(item)}</h3><p className="mt-1 text-xs text-slate-500">18時 → 翌5時 · 11時間の低下量</p>
      <div className="mt-5 space-y-5">{stations.map(station => { const v = values[station]; return <div key={station}>
        <div className="flex items-baseline justify-between gap-2"><span className={`text-sm font-bold ${station === "hachioji" ? "text-orange-800" : "text-blue-800"}`}>{stationNames[station]}</span><span className="text-2xl font-bold tabular-nums text-slate-900">{v.drop.toFixed(1)}<span className="ml-1 text-sm font-normal">℃</span></span></div>
        <div className="my-2 h-3 rounded-full bg-slate-100" aria-hidden="true"><div className={`h-full rounded-full ${station === "hachioji" ? "bg-orange-700" : "bg-blue-700"}`} style={{ width: `${v.drop / 10 * 100}%` }} /></div>
        <p className="text-sm tabular-nums text-slate-600">{v.from.toFixed(1)}℃ → {v.to.toFixed(1)}℃</p><p className="mt-1 text-xs text-slate-500">区間平均の低下率 {v.rate.toFixed(2)}℃/h</p>
      </div>; })}</div>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500" aria-hidden="true"><span>0</span><span>5</span><span>10℃</span></div>
      <figcaption className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6">八王子のほうが<strong>{(values.hachioji.drop - values.tokyo.drop).toFixed(1)}℃</strong>多く低下。翌5時の地点間差は<strong>{(values.tokyo.to - values.hachioji.to).toFixed(1)}℃</strong>です。</figcaption>
    </figure>;
  })}</div>;
}
