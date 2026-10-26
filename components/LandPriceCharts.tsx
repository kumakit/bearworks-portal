import { landMan as m, type LandPriceCity, type LandPricePoint } from "@/lib/hachioji-land-prices-publication";

export function LandPriceDistribution({ cities, points, year = 2026 }: { cities: LandPriceCity[]; points: LandPricePoint[]; year?: 2016 | 2026 }) {
  const x = (price: number) => 88 + price / 650000 * 620;
  return <figure className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-6">
    <div className="overflow-x-auto" tabIndex={0} aria-label={`${year}年の分布図。横にスクロールできます`}><svg viewBox="0 0 740 425" role="img" aria-labelledby={`distribution-title-${year} distribution-desc-${year}`} className="h-auto w-full min-w-[620px]">
      <title id={`distribution-title-${year}`}>{`${year}年、6市の住宅地の標準地価格分布`}</title>
      <desc id={`distribution-desc-${year}`}>1点が1標準地。横軸は万円/㎡。黒線は中央値、ひし形は平均。正確な値は配布CSVで確認できます。両年の図の横軸は同じです。</desc>
      {[0, 10, 20, 30, 40, 50, 60].map(t => <g key={t}><line x1={x(t * 10000)} x2={x(t * 10000)} y1="25" y2="365" stroke="#e2e8f0" /><text x={x(t * 10000)} y="394" textAnchor="middle" fontSize="14" fill="#475569">{t}</text></g>)}
      {cities.map((city, index) => {
        const y = 55 + index * 58;
        const rows = points.filter(p => p.cityCode === city.code && p.year === year);
        const stats = year === 2026 ? city.current : city.past;
        return <g key={city.code}><text x="74" y={y + 5} textAnchor="end" fontSize="16" fill="#0f172a">{city.name}</text>
          {rows.map((p, i) => <circle key={p.id} cx={x(p.price)} cy={y + ((i * 7) % 19 - 9) * 1.5} r="3.6" fill={city.code === "13201" ? "#0e7490" : "#64748b"} opacity="0.65"><title>{`${city.name} ${p.id}：${m(p.price)}万円/㎡`}</title></circle>)}
          <line x1={x(stats.median)} x2={x(stats.median)} y1={y - 20} y2={y + 20} stroke="#0f172a" strokeWidth="2" />
          <path d={`M ${x(stats.mean)} ${y - 6} l 6 6 l -6 6 l -6 -6 Z`} fill="#f59e0b" stroke="#78350f" />
        </g>;
      })}
      <text x="708" y="420" textAnchor="end" fontSize="13" fill="#475569">万円/㎡</text>
    </svg></div>
    <figcaption className="mt-3 text-sm leading-6 text-slate-600">スマホでは図を横にスクロールできます。点＝住宅地の標準地1地点、黒い縦線＝中央値、◆＝平均。点の上下のずれは重なりを減らすためで、別の値を表しません。価格時点：{year}年1月1日。出典：国土交通省「国土数値情報（地価公示）」を加工。</figcaption>
  </figure>;
}

export function LandPriceHistory({ cities }: { cities: LandPriceCity[] }) {
  return <figure className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-6">
    <div className="overflow-x-auto" tabIndex={0} aria-label="平均価格比較図。横にスクロールできます"><svg viewBox="0 0 740 345" role="img" aria-labelledby="history-title history-desc" className="h-auto w-full min-w-[620px]">
      <title id="history-title">2016年と2026年、各年の全住宅地標準地の平均価格</title>
      <desc id="history-desc">各市の平均価格の2時点比較。同じ地点だけの値上がり率ではありません。6市すべてで平均は上昇。数値と地点数は下の表にあります。</desc>
      {[0, 10, 20, 30, 40].map(t => <g key={t}><line x1="80" x2="710" y1={280 - t * 6} y2={280 - t * 6} stroke="#e2e8f0" /><text x="65" y={285 - t * 6} textAnchor="end" fontSize="14" fill="#475569">{t}</text></g>)}
      {cities.map((city, i) => { const x = 130 + i * 105; return <g key={city.code}>
        <rect x={x - 29} y={280 - city.past.mean / 10000 * 6} width="26" height={city.past.mean / 10000 * 6} fill="#94a3b8" />
        <rect x={x + 3} y={280 - city.current.mean / 10000 * 6} width="26" height={city.current.mean / 10000 * 6} fill="#0e7490" />
        <text x={x} y="310" textAnchor="middle" fontSize="15" fill="#0f172a">{city.name}</text>
      </g>; })}
      <text x="18" y="24" fontSize="13" fill="#475569">万円/㎡</text><text x="710" y="337" textAnchor="end" fontSize="14" fill="#475569">左：2016年　右：2026年</text>
    </svg></div>
    <figcaption className="mt-3 text-sm leading-6 text-slate-600">スマホでは図を横にスクロールできます。灰色＝2016年、青＝2026年。いずれも1月1日、各年の全住宅地標準地の単純平均。標本構成の違いを含む比較です。出典：国土交通省「国土数値情報（地価公示）」を加工。</figcaption>
  </figure>;
}
