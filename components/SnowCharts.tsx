import { quantile, type SnowCase } from "@/lib/hachioji-snow-publication";

const blue = "#2563eb", pink = "#db2777";
const fmt = (n: number) => n.toFixed(1);
export function Distribution({ values, id }: { values: number[]; id: string }) {
  const lo = Math.floor(Math.min(...values)) - 1, hi = Math.ceil(Math.max(...values)) + 1;
  const x = (v: number) => 55 + (v - lo) / (hi - lo) * 570;
  const [q1, median, q3] = [.25, .5, .75].map(p => quantile(values, p));
  const inside = values.filter(v => v >= q1 - 1.5 * (q3 - q1) && v <= q3 + 1.5 * (q3 - q1));
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const bins = ticks.slice(0, -1).map(v => ({ v, n: values.filter(d => d >= v && d < v + 1).length }));
  const maximum = Math.max(...bins.map(b => b.n));
  return <div>
    <svg viewBox="0 0 680 165" role="img" aria-labelledby={`${id}-box`} className="w-full">
      <title id={`${id}-box`}>気温差の箱ひげ図。中央値{fmt(median)}℃、第1四分位{fmt(q1)}℃、第3四分位{fmt(q3)}℃</title>
      <rect x={x(lo)} y="20" width={x(0) - x(lo)} height="95" fill="#eff6ff" />
      {ticks.filter(t => t % 4 === 0).map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="20" y2="115" stroke="#e2e8f0" /><text x={x(t)} y="148" textAnchor="middle" fontSize="28">{t}</text></g>)}
      <line x1={x(Math.min(...inside))} x2={x(Math.max(...inside))} y1="65" y2="65" stroke={blue} strokeWidth="2" />
      {[Math.min(...inside), Math.max(...inside)].map((v, i) => <line key={i} x1={x(v)} x2={x(v)} y1="48" y2="82" stroke={blue} strokeWidth="2" />)}
      <rect x={x(q1)} y="40" width={x(q3) - x(q1)} height="50" fill="#bfdbfe" stroke={blue} />
      <line x1={x(median)} x2={x(median)} y1="40" y2="90" stroke={blue} strokeWidth="3" />
      {[...new Set(values.filter(v => v < Math.min(...inside) || v > Math.max(...inside)))].map(v => <circle key={v} cx={x(v)} cy="65" r="3" fill={blue} />)}
    </svg>
    <p className="mb-3 text-center text-sm">気温差 ΔT（八王子 − 東京都心、℃）</p>
    <p className="text-sm text-muted">n = {values.length.toLocaleString()}時刻ペア。箱は中央50%、線は中央値。ひげは1.5 IQR内の最遠値、外の点は外れ点（同値は重ねて表示）。青い背景は八王子が低温の範囲です。</p>
    <details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold">ヒストグラムで分布を見る</summary>
      <div className="overflow-x-auto"><svg viewBox="0 0 680 240" role="img" aria-label="同じ気温差データの1℃幅ヒストグラム" className="mt-4 min-w-[560px] w-full">
        {bins.map(b => <g key={b.v}><rect x={x(b.v)} y={180 - b.n / maximum * 145} width={570 / bins.length - 2} height={b.n / maximum * 145} fill={b.v < 0 ? blue : pink} /><text x={x(b.v + .5)} y={170 - b.n / maximum * 145} textAnchor="middle" fontSize="10">{b.n}</text><text x={x(b.v)} y="201" textAnchor="middle" fontSize="11">{b.v}</text></g>)}
        <text x="20" y="18" fontSize="12">時刻ペア数</text><text x="340" y="230" textAnchor="middle" fontSize="12">気温差（℃）・区間は左端を含み右端を含まない</text>
      </svg></div>
      <p className="mt-2 text-xs text-muted sm:hidden">図は横にスクロールできます。</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="text-left">ヒストグラムの元集計</caption><thead><tr><th>気温差の区間（℃）</th><th>件数</th></tr></thead><tbody>{bins.map(b => <tr key={b.v}><td>{b.v}以上 {b.v + 1}未満</td><td className="text-center">{b.n}</td></tr>)}</tbody></table></div>
    </details>
  </div>;
}

export function TemperatureScatter({ points }: { points: (string | number)[][] }) {
  const min = Math.floor(Math.min(...points.flatMap(p => [Number(p[1]), Number(p[2])])) / 5) * 5;
  const max = Math.ceil(Math.max(...points.flatMap(p => [Number(p[1]), Number(p[2])])) / 5) * 5;
  const x = (v: number) => 60 + (v - min) / (max - min) * 510;
  const y = (v: number) => 325 - (v - min) / (max - min) * 290;
  const ticks = Array.from({ length: (max - min) / 5 + 1 }, (_, i) => min + 5 * i);
  return <div className="overflow-x-auto"><svg viewBox="0 0 640 380" role="img" aria-label="東京都心を横軸、八王子を縦軸とした降水時気温の全ペア散布図。斜線は両地点が同じ気温" className="min-w-[480px] w-full">
    {ticks.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="35" y2="325" stroke="#e2e8f0" /><line x1="60" x2="570" y1={y(t)} y2={y(t)} stroke="#e2e8f0" /><text x={x(t)} y="345" textAnchor="middle" fontSize="12">{t}</text><text x="48" y={y(t) + 4} textAnchor="end" fontSize="12">{t}</text></g>)}
    <line x1={x(min)} y1={y(min)} x2={x(max)} y2={y(max)} stroke="#64748b" strokeDasharray="6 5" />
    {points.map((p, i) => <circle key={i} cx={x(Number(p[2]))} cy={y(Number(p[1]))} r="2.3" fill={blue} opacity=".14" />)}
    <text x="60" y="20" fontSize="13">八王子（℃）</text><text x="320" y="373" textAnchor="middle" fontSize="13">東京都心（℃）</text>
  </svg><p className="text-xs text-muted sm:hidden">図は横にスクロールできます。</p></div>;
}

export function CaseChart({ item }: { item: SnowCase }) {
  const series = item.series;
  const numbers = series.flatMap(r => [r.h, r.t]).filter((v): v is number => v !== null);
  const lo = Math.floor(Math.min(...numbers)) - 1, hi = Math.ceil(Math.max(...numbers)) + 1;
  const x = (i: number) => 55 + i / (series.length - 1) * 570;
  const y = (v: number) => 225 - (v - lo) / (hi - lo) * 180;
  const paths = (key: "h" | "t") => { const paths: string[] = []; let path = ""; series.forEach((r, i) => { const v = r[key]; if (v === null) { if (path) paths.push(path); path = ""; } else path += `${path ? "L" : "M"}${x(i)},${y(v)} `; }); if (path) paths.push(path); return paths; };
  return <div className="overflow-x-auto"><svg viewBox="0 0 680 290" role="img" aria-label={`${item.id}の気温時系列。青は八王子、桃色は東京都心。欠測は線を切る`} className="min-w-[520px] w-full">
    {[lo, 0, hi].filter((v, i, a) => a.indexOf(v) === i).map(v => <g key={v}><line x1="55" x2="625" y1={y(v)} y2={y(v)} stroke="#cbd5e1" strokeDasharray="4 4" /><text x="45" y={y(v) + 4} textAnchor="end" fontSize="12">{v}</text></g>)}
    {(["h", "t"] as const).flatMap(key => paths(key).map((d, i) => <path key={`${key}-${i}`} d={d} fill="none" stroke={key === "h" ? blue : pink} strokeWidth="2.5" />))}
    {[0, Math.floor((series.length - 1) / 2), series.length - 1].map(i => <text key={i} x={x(i)} y="250" textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fontSize="11">{series[i].at.slice(5, 10)} {series[i].at.slice(11, 16)}</text>)}
    <text x="55" y="23" fontSize="12">気温（℃）</text><text x="340" y="278" textAnchor="middle" fontSize="12">日本標準時（JST）・青：八王子 ／ 桃：東京都心</text>
  </svg><p className="text-xs text-muted sm:hidden">図は横にスクロールできます。</p></div>;
}
