import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import { CloudRain, Droplets, CalendarDays, ArrowDown } from "lucide-react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import ContentProvenance from "@/components/ContentProvenance";
import ClimateSeriesNav from "@/components/ClimateSeriesNav";
import { ClimateDownloads, ClimateLesson, ClimateQuizzes, ClimateSection } from "@/components/ClimateArticleParts";
import { RainAnnualChart, RainMonthlyChart } from "@/components/RainCharts";
import { rainBundle as bundle, rainLock, climateNumber as n } from "@/lib/hachioji-rain-autumn-publication";
import { rainArticleProvenance } from "@/lib/hachioji-series-provenance";

const title = "八王子は都心より雨が多い？ 降る日数と、降る量を分けてみる";
const canonical = "https://bearworks.uk/labs/hachioji-rain";
export const metadata: Metadata = {
  title: `${title} | bearworks.uk`, description: "気象庁の日別観測から、八王子と東京都心の降水量・降水日数・上位5日への集中度を比較。2015〜2025年のうち条件のそろう8年と、品質条件を変えた10年を分けて読み解きます。",
  alternates: { canonical }, openGraph: { type: "article", title, url: canonical, siteName: "bearworks.uk" },
};
const data = bundle.main;
const sensitivity = bundle.sensitivity_quality5;
const h = data.summary.h; const t = data.summary.t; const c = data.contingency;
const card = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const quizzes = [
  { question: "年間降水量が多い街では、雨の日も必ず多い？", answer: "必ずしもそうではありません。少数の日に大量の雨が降れば、降水日数が少なくても合計は大きくなります。降水量と、あらかじめ定義した降水日数を別々に比較します。" },
  { question: "この8年の平均は、2015〜2025年の11年平均？", answer: "違います。主集計は2019・2020・2024年を除いた8年です。欠測を0として11年で割った値でもありません。除外した年の天候が平均に影響し得るため、品質条件を変えた集計も併せて示しています。" },
  { question: "上位5日が全体の約30％。残りの日には降らなかった？", answer: "違います。これは日数の割合ではなく降水量の割合です。残りの日にも年間雨量の約70％が分散しています。大きな値だからという理由だけで、実際の大雨を誤測定として除外することもできません。" },
  { question: "都心で降った日に八王子でも降った割合。分母は全観測日？", answer: `分母は東京都心で1mm以上だった${c.both + c.t_only}日です。両地点で降った${c.both}日をこれで割ると${n(data.h_given_t)}％。全${c.total.toLocaleString()}日で割れば「両地点で降った日の全体割合」という別の値になります。` },
  { question: "過去の同日割合を、そのまま明日の降水確率にできる？", answer: "できません。ここでは観測後の日別値を集計しています。明日の予報にはその時点の気象状況などが必要です。また、1日の中で同じ時刻に降ったか、同じ雨雲だったかは日別の合計だけでは分かりません。" },
];

export default function HachiojiRainPage() {
  return <main className="mx-auto w-full max-w-5xl px-4 pb-12 text-slate-800 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, dateModified: "2026-10-04", author: { "@type": "Person", name: "kuma" }, mainEntityOfPage: canonical }) }} />
    <PublicSiteHeader />
    <article className="mx-auto max-w-4xl space-y-10 text-base leading-8">
      <header className="relative overflow-hidden rounded-3xl bg-sky-950 p-7 text-white sm:p-12">
        <CloudRain aria-hidden="true" size={180} strokeWidth={0.7} className="pointer-events-none absolute -right-7 top-8 text-sky-700/50 sm:right-5" />
        <div className="relative max-w-2xl"><p className="text-xs font-bold tracking-widest text-sky-200">街のうわさを、統計でほどく · 07</p><h1 className="mt-6 text-3xl font-bold leading-snug sm:text-5xl">雨が多い街。<br />それは、<span className="text-sky-300">日数？ 量？</span></h1><p className="mt-5 font-semibold text-sky-100">八王子は都心より雨が多い？</p><p className="mt-4 max-w-xl text-sm leading-7 text-sky-100">帰り道だけ、雨に降られた。そんな記憶から街の天気を想像していませんか。八王子と東京都心の日別観測を、「どのくらい降るか」「何日降るか」「一部の日に集中するか」に分けて読みます。</p><p className="mt-6 text-xs text-sky-200">気象庁の地点観測 · 2015〜2025年のうち共通8年 · 2026年10月4日作成</p></div>
      </header>

      <section aria-labelledby="rain-answer" className="space-y-5"><p className="text-xs font-bold tracking-widest text-sky-800">まず、今回のデータから</p><h2 id="rain-answer" className="text-2xl font-bold leading-relaxed text-slate-900">8年平均では、八王子のほうが少ない。</h2><p>主集計の年間降水量は八王子{n(h.total)}mm、東京都心{n(t.total)}mm。日降水量1mm以上の日数も、八王子が少ない結果でした。一方、上位5日に集まる雨量の割合は八王子のほうが大きくなっています。</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-sky-50 p-5"><Droplets aria-hidden="true" className="text-sky-800" /><h3 className="mt-3 text-sm font-semibold">年間降水量の差</h3><p className="mt-3 text-3xl font-bold tabular-nums text-sky-900">−{n(t.total - h.total)}<span className="ml-1 text-sm font-normal">mm</span></p><p className="mt-2 text-xs text-slate-600">八王子 − 東京都心 · 年平均</p></div>
          <div className="rounded-2xl bg-sky-50 p-5"><CalendarDays aria-hidden="true" className="text-sky-800" /><h3 className="mt-3 text-sm font-semibold">降水日数の差</h3><p className="mt-3 text-3xl font-bold tabular-nums text-sky-900">−{n(t.wet_days - h.wet_days)}<span className="ml-1 text-sm font-normal">日</span></p><p className="mt-2 text-xs text-slate-600">日降水量1mm以上 · 年平均</p></div>
          <div className="rounded-2xl bg-slate-900 p-5 text-white"><ArrowDown aria-hidden="true" className="text-sky-300" /><h3 className="mt-3 text-sm font-semibold">八王子の上位5日への集中</h3><p className="mt-3 text-3xl font-bold tabular-nums text-sky-200">{n(h.top5_share)}<span className="ml-1 text-sm font-normal">％</span></p><p className="mt-2 text-xs text-slate-300">各年の「上位5日 ÷ 年間雨量」を平均</p></div>
        </div>
        <p className="text-sm leading-7 text-slate-600">採用年は{data.included_years.join("・")}年。2019・2020・2024年は両地点の全日が正常値でそろわず除外しました。11年全体の平均でも、30年の平年値でもありません。「東京都心」は気象庁の東京観測所を指します。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-sky-800">{[["definitions", "01 日数と量"], ["annual", "02 年ごとの差"], ["monthly", "03 季節"], ["together", "04 同じ日に降る？"], ["robustness", "05 比べ方"], ["quiz", "06 確認問題"], ["method", "方法・出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-sky-200 underline-offset-4 hover:decoration-sky-800">{label}</a>)}</nav>

      <ClimateSection id="definitions" number="01" title="同じ「多い」でも、三つの数字がある。">
        <p>降水量は、雨や雪を水の深さに換算した量です。ここでは雪も含めた観測値を使います。「降水日」は日降水量1mm以上の日と決めました。少しでも雨を見た日、傘を使った日とは一致しません。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[510px] text-right text-sm"><caption className="mb-4 text-left font-semibold">同じ8年から計算した、三つの年平均</caption><thead><tr className="border-b"><th scope="col" className="py-3 text-left">指標</th><th scope="col">八王子</th><th scope="col">東京都心</th></tr></thead><tbody>{[["年間の降水量（mm）", h.total, t.total], ["1mm以上の日数（日）", h.wet_days, t.wet_days], ["降水日1日あたりの量（mm）", h.wet_mean, t.wet_mean]].map(([label, a, b]) => <tr key={String(label)} className="border-b border-slate-100"><th scope="row" className="py-3 text-left font-normal">{String(label)}</th><td className="tabular-nums">{n(Number(a))}</td><td className="tabular-nums">{n(Number(b))}</td></tr>)}</tbody></table></div>
        <ClimateLesson title="条件を付けた平均は、分子もそろえる。"><p>「降水日1日あたりの量」は、1mm以上だった日の降水量だけを合計して、その日数で割ります。年間総量には1mm未満の日の降水も含まれるため、年間総量をそのまま降水日数で割った値とは異なります。表はこの計算を年ごとに行い、8年を同じ重みで平均しています。</p></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="annual" number="02" title="平均の下に、違う降り方の年がある。">
        <p>八王子の年間降水量が東京都心を上回ったのは、採用した{data.annual.length}年中{data.greater_total_years}年でした。図のボタンで日数と集中度にも切り替えられます。平均だけで街の順位を固定せず、年ごとの関係を確かめてください。</p>
        <RainAnnualChart data={data} />
        <p>各年の多雨上位5日が年間雨量に占める割合は、八王子で平均{n(h.top5_share)}％、東京都心で{n(t.top5_share)}％。八王子では、年間合計の約3割が5日分に集まっています。</p>
        <details className={`${card} text-sm`}><summary className="cursor-pointer font-semibold text-sky-800">各年の八王子の多雨上位5日を見る</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.annual.map(a => <div key={a.year}><h3 className="font-bold">{a.year}年 · 年間の{n(a.h.top5_share)}％</h3><ol className="mt-2 space-y-1 text-slate-600">{a.h.top5.map(d => <li key={d.date} className="flex justify-between gap-3"><span>{d.date}</span><span>{n(d.mm)}mm</span></li>)}</ol></div>)}</div></details>
        <ClimateLesson title="大きな値は、消す前に理由を考える。"><p>大雨は年間雨量を左右する現象そのものです。値が大きいだけで誤測定とみなすことはできません。品質情報を確認したうえで、合計と集中度を併記します。この集中度から災害の発生確率や雨の原因までは判断していません。</p></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="monthly" number="03" title="梅雨だけが、雨の季節ではない。">
        <p>今回の8年平均では、両地点とも9月の降水量が最も大きくなっています。八王子と都心の大小関係も月によって異なります。月の平均は季節を見渡す目安で、毎年同じ月に同じ量が降るという意味ではありません。</p><RainMonthlyChart data={data} />
        <ClimateLesson title="月の合計と、1時間の強さを分ける。"><p>月300mmは、その月を通じて積み上がった量です。短時間の激しい雨と、長く続く雨のどちらでも増えます。日別・月別の集計から、1時間雨量や雨の継続時間を逆算することはできません。</p></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="together" number="04" title="都心で降った日に、八王子でも降っている？">
        <p>主集計の{c.total.toLocaleString()}日を、両地点で1mm以上だったかどうかで分類しました。同じ日に降ったという分類であり、同じ時刻に降ったという観測ではありません。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[460px] text-center text-sm"><caption className="mb-4 text-left">日降水量1mm以上を「降水あり」とする対応表（日）</caption><thead><tr><td /><th scope="col" className="p-3">都心：あり</th><th scope="col" className="p-3">都心：なし</th><th scope="col" className="p-3">合計</th></tr></thead><tbody><tr className="border-t"><th scope="row" className="p-3 text-left">八王子：あり</th><td className="bg-sky-50 font-bold text-sky-900">{c.both}</td><td>{c.h_only}</td><td>{c.both + c.h_only}</td></tr><tr className="border-t"><th scope="row" className="p-3 text-left">八王子：なし</th><td>{c.t_only}</td><td>{c.neither.toLocaleString()}</td><td>{(c.t_only + c.neither).toLocaleString()}</td></tr><tr className="border-t font-bold"><th scope="row" className="p-3 text-left">合計</th><td>{c.both + c.t_only}</td><td>{(c.h_only + c.neither).toLocaleString()}</td><td>{c.total.toLocaleString()}</td></tr></tbody></table></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-sky-50 p-5"><h3 className="text-sm font-semibold">都心で降った日を分母に</h3><p className="mt-3 text-2xl font-bold text-sky-900">{c.both} ÷ {c.both + c.t_only} = {n(data.h_given_t)}％</p><p className="mt-2 text-sm">そのうち八王子でも降った割合</p></div><div className="rounded-2xl bg-amber-50 p-5"><h3 className="text-sm font-semibold">八王子で降った日を分母に</h3><p className="mt-3 text-2xl font-bold text-amber-900">{c.both} ÷ {c.both + c.h_only} = {n(data.t_given_h)}％</p><p className="mt-2 text-sm">そのうち都心でも降った割合</p></div></div>
        <ClimateLesson title="分母を入れ替えると、別の問いになる。"><p>両地点で降った日数は共通でも、条件を付ける側が違うと割合は変わります。これは対象期間の観測割合です。日々の天気には時間的なつながりがあるため、全日を独立な試行とみなした検定や信頼区間は付けていません。</p><Link href="/toukei/problems/contingency-table" className="font-semibold underline">分割表の例題で確かめる →</Link></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="robustness" number="05" title="数え方を変えても、同じ結論だろうか。">
        <p>降水日の区切りを0.5・1・5・10mmに変えても、今回の8年平均では八王子の日数が東京都心を下回りました。これは選んだ条件の範囲での確認です。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[380px] text-right text-sm"><caption className="mb-3 text-left">しきい値別の日数（8年の平均、日/年）</caption><thead><tr><th scope="col" className="py-2 text-left">日降水量</th><th scope="col">八王子</th><th scope="col">東京都心</th></tr></thead><tbody>{h.thresholds.map((row, i) => <tr key={row.threshold} className="border-t border-slate-100"><th scope="row" className="py-2 text-left font-normal">{row.threshold}mm以上</th><td>{n(row.days)}</td><td>{n(t.thresholds[i].days)}</td></tr>)}</tbody></table></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">品質条件を緩めた場合も併記する</h3><p className="mt-3 text-sm leading-7">一部の観測が欠けた「準正常値」（品質5）も採用すると、2019・2020年が加わり10年になります。年間降水量は八王子{n(sensitivity.summary.h.total)}mm、都心{n(sensitivity.summary.t.total)}mm、降水日数は{n(sensitivity.summary.h.wet_days)}日と{n(sensitivity.summary.t.wet_days)}日。大小関係は同じですが、差の大きさは変わります。2024年はこの条件でも除外します。</p></div>
        <p className="text-sm leading-7 text-slate-600">年を丸ごと除外するため、大雨が多かった年や少なかった年が抜ける影響は残ります。欠測を補って11年全体を推定した分析ではありません。</p>
      </ClimateSection>

      <ClimateSection id="quiz" number="06" title="グラフの読み方を、5問で確かめる。"><ClimateQuizzes items={quizzes} /></ClimateSection>
      <ClimateSection id="method" number="資料" title="方法・再現性・出典">
        <div className="space-y-4 text-sm leading-7"><p>原本は2026年10月4日に気象庁「過去の気象データ・ダウンロード」から取得。八王子・東京の2009〜2025年、各6,209日の日付被覆と重複のないことを確認しました。本記事は2015〜2025年を候補とし、両地点の降水量が全日正常値の共通8年を採用しています。候補期間内の降水量の均質番号は各地点で一定でした。</p><p>2019年は1月22日、2020年は2月26日、2024年は12月21〜23日に、八王子の降水量が主集計の品質条件を満たしません。欠測や資料不足を0mmとして埋めていません。年平均は採用年を等しい重みで計算し、割合もまず年ごとに求めてから平均しています。同日対応表のみ全採用日をまとめた集計です。</p><p>観測所間の比較であり、市内全域・東京23区全体の平均ではありません。雨量の地域差の原因、長期トレンド、将来の予報、災害リスクは推定していません。表示値は最後に丸めるため、表示した値同士を引いた結果と差の表示がずれる場合があります。</p></div>
        <ul className="space-y-2 text-sm text-sky-800"><li><a className="underline" href="https://www.data.jma.go.jp/risk/obsdl/">気象庁：過去の気象データ・ダウンロード</a></li><li><a className="underline" href="https://www.data.jma.go.jp/risk/obsdl/top/help3.html">気象庁：品質情報・現象なし情報・均質番号</a></li><li><a className="underline" href="https://www.jma.go.jp/jma/kishou/know/amedas/kaisetsu.html">気象庁：アメダスの観測</a></li></ul>
        <ClimateDownloads hash={rainLock.sha256} version={bundle.version} />
      </ClimateSection>
      <ContentProvenance provenance={rainArticleProvenance} />
      <ClimateSeriesNav current="hachioji-rain" />
    </article><PublicSiteFooter />
  </main>;
}
