import Link from "@/components/InternalLink";

const articles = [
  ["hachioji-climate", "夏は暑く、冬は寒い？", "気候の全体像"],
  ["hachioji-snow", "雪のニュース。また、八王子だ。", "雪と気温"],
  ["hachioji-heat", "昼は暑い。夜も暑い？", "夏の暑さ"],
  ["hachioji-chill", "八王子の朝はなぜ寒い？", "冬の冷え込み"],
  ["takao-gear", "高尾山の装備をどう決める？", "出発前の確認"],
  ["takao-weather-shift", "高尾山の天気をどう読む？", "観測と確率"],
  ["hachioji-rain", "八王子は都心より雨が多い？", "降る日数と量"],
  ["hachioji-autumn", "八王子の秋は本当に短くなった？", "気温で数える秋"],
];

export default function ClimateSeriesNav({ current }: { current: string }) {
  return <nav aria-label="八王子の気候シリーズ" className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
    <p className="text-xs font-semibold tracking-wider text-slate-300">街のうわさを、統計でほどく</p>
    <h2 className="mt-2 text-xl font-bold">ひとつの街から、データの読み方を。</h2>
    <ol className="mt-6 grid gap-3 sm:grid-cols-2">
      {articles.map(([slug, title, topic], i) => <li key={slug}>
        <Link href={`/labs/${slug}`} aria-current={current === slug ? "page" : undefined} className={`block h-full rounded-xl border p-4 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${current === slug ? "border-sky-300 bg-slate-700" : "border-slate-700 bg-slate-800"}`}>
          <span className="text-xs text-slate-300">第{i + 1}弾 · {topic}{current === slug ? " · この記事" : ""}</span>
          <span className="mt-2 block text-sm font-bold">{title} <span aria-hidden="true">→</span></span>
        </Link>
      </li>)}
    </ol>
  </nav>;
}
