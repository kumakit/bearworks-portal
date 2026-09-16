import { hypothesisById, recentAnnualRows, recentStationSummaries } from "@/lib/hachioji-climate-publication";

type Bar = { key: string; label: string; value: number };

export function ClimateBars({ rows, max, unit, caption, tone = "warm" }: {
  rows: Bar[]; max: number; unit: string; caption: string; tone?: "warm" | "cool";
}) {
  return <figure>
    <div className="space-y-4">
      {rows.map(row => <div key={row.key}>
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
          <span className={row.key === "hachioji" ? "font-bold text-slate-900" : "text-slate-600"}>{row.label}</span>
          <span className="font-semibold tabular-nums text-slate-900">{row.value.toFixed(1)}<span className="ml-1 text-xs font-normal">{unit}</span></span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={`h-full rounded-full ${row.key === "hachioji" ? (tone === "warm" ? "bg-orange-600" : "bg-blue-600") : "bg-slate-400"}`} style={{ width: `${row.value / max * 100}%` }} />
        </div>
      </div>)}
    </div>
    <div className="mt-3 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500" aria-hidden="true"><span>0</span><span>{max / 2}</span><span>{max} {unit}</span></div>
    <figcaption className="mt-4 text-sm leading-relaxed text-slate-600">{caption}</figcaption>
  </figure>;
}

export function RecentClimateBars({ metric, max, tone }: {
  metric: "heatstrokeDays" | "midsummerDays" | "tropicalNightEquivalentDays" | "winterDays";
  max: number; tone: "warm" | "cool";
}) {
  return <ClimateBars rows={recentStationSummaries.map(row => ({ key: row.key, label: row.name, value: row[metric] }))} max={max} unit="日/年" tone={tone} caption="2020〜2025年の年間日数を、6年で単純平均。観測できた日を数え、欠測分の補正はしていません。" />;
}

export function AnnualHeatChart() {
  const rows = recentAnnualRows.filter(row => row.station_key === "hachioji").sort((a, b) => a.period_id - b.period_id);
  const mean = rows.reduce((sum, row) => sum + row.metrics.heatstroke_days, 0) / rows.length;
  const y = (value: number) => 230 - value * 3.6;
  return <figure>
    <div className="overflow-x-auto">
      <svg viewBox="0 0 620 300" role="img" aria-labelledby="annual-heat-title annual-heat-desc" className="w-full min-w-[440px]">
        <title id="annual-heat-title">八王子の猛暑日、2020〜2025年の年間日数</title>
        <desc id="annual-heat-desc">{rows.map(row => `${row.period_id}年${row.metrics.heatstroke_days}日`).join("、")}。破線は6年平均{mean.toFixed(1)}日。線形トレンドは推定していません。</desc>
        {[0, 10, 20, 30, 40, 50].map(value => <g key={value}><line x1="55" x2="590" y1={y(value)} y2={y(value)} stroke="#e2e8f0" /><text x="43" y={y(value) + 5} textAnchor="end" fontSize="14" fill="#475569">{value}</text></g>)}
        <text x="20" y="22" fontSize="14" fill="#475569">猛暑日（日/年）</text>
        <line x1="55" x2="590" y1={y(mean)} y2={y(mean)} stroke="#475569" strokeWidth="2" strokeDasharray="6 5" />
        {rows.map((row, i) => <g key={row.period_id}>
          <line x1={95 + i * 90} x2={95 + i * 90} y1={y(0)} y2={y(row.metrics.heatstroke_days)} stroke="#fed7aa" strokeWidth="16" />
          <circle cx={95 + i * 90} cy={y(row.metrics.heatstroke_days)} r="7" fill="#c2410c" />
          <text x={95 + i * 90} y={y(row.metrics.heatstroke_days) - 15} textAnchor="middle" fontSize="17" fontWeight="700" fill="#9a3412">{row.metrics.heatstroke_days}</text>
          <text x={95 + i * 90} y="256" textAnchor="middle" fontSize="14" fill="#475569">{row.period_id}</text>
        </g>)}
        <text x="590" y="286" textAnchor="end" fontSize="14" fill="#475569">破線：6年平均 {mean.toFixed(1)}日</text>
      </svg>
    </div>
    <p className="mt-2 text-xs text-slate-600 sm:hidden">図は横にスクロールできます。</p>
    <figcaption className="mt-3 text-sm text-slate-600">点は各年の実測集計、破線は6年間の平均。年ごとの変動を示す図で、長期トレンドや将来予測ではありません。2024年は有効363日（366日中）です。</figcaption>
  </figure>;
}

export function SeasonalRangeCharts() {
  const segments = hypothesisById.H5.segments.filter(segment => segment.period_end === 2025);
  return <div className="grid gap-6 md:grid-cols-2">{segments.map(segment => <section key={segment.period_type} className="rounded-2xl bg-slate-50 p-5">
    <h3 className="font-bold text-slate-900">{segment.period_type === "summer" ? "夏 · 6〜8月" : "冬 · 12〜2月"}</h3>
    <p className="mb-5 mt-1 text-sm text-slate-600">{segment.period_start}〜{segment.period_end}{segment.period_type === "summer" ? "年" : "冬"}</p>
    <ClimateBars rows={[{ key: "hachioji", label: "八王子", value: segment.station_values.hachioji }, { key: "tokyo", label: "東京都心", value: segment.station_values.tokyo }]} max={15} unit="℃" tone={segment.period_type === "summer" ? "warm" : "cool"} caption={`各年の季節別「日較差の中央値」を区間内で平均。八王子 − 東京都心は ${segment.delta.toFixed(2)}℃。`} />
  </section>)}</div>;
}

export function SegmentComparison() {
  return <figure>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{hypothesisById.H1.segments.map(segment => <div key={segment.period_start} className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
      <p className="text-sm font-bold text-slate-700">{segment.period_start}〜{segment.period_end}年</p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-orange-800">+{segment.delta.toFixed(1)}<span className="ml-1 text-sm font-normal">日/年</span></p>
      <div className="mt-4 h-2 rounded-full bg-orange-100" aria-hidden="true"><div className="h-full rounded-full bg-orange-600" style={{ width: `${segment.delta / 6 * 100}%` }} /></div>
      <p className="mt-2 text-xs text-orange-900">共通目盛り：0〜6日/年</p>
    </div>)}</div>
    <figcaption className="mt-4 text-sm text-slate-600">猛暑日の区間平均差（八王子 − 東京都心）。観測環境の境界を含む2008年・2014年を除外。区間ごとに比較し、境界を線でつないだトレンドは描いていません。</figcaption>
  </figure>;
}
