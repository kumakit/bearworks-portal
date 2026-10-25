import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PopulationCharts from "@/components/PopulationCharts";
import { populationBundle as data, populationNumber as n, populationPercent as percent, populationSigned as signed } from "@/lib/hachioji-population-publication";

const title = "八王子の人口は本当に減っている？";
const canonical = "https://bearworks.uk/labs/hachioji-population";
const description = "八王子市の住民基本台帳をもとに、全市・地域別・年齢別に2016年9月末と2026年9月末を比較。人口減少の見え方や、比較できない地域、統計の限界も確認します。";

export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`,
  description,
  alternates: { canonical },
  openGraph: { type: "article", url: canonical, title, description, siteName: "bearworks.uk", images: ["/images/hachioji-population/hero-illustration.webp"] },
};

const card = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

export default function HachiojiPopulationPage() {
  const comparison = data.comparison;
  const child = data.ageComposition.find((row) => row.key === "age0_14")!;
  const older = data.ageComposition.find((row) => row.key === "age65plus")!;
  const working = data.ageComposition.find((row) => row.key === "age15_64")!;
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, description, mainEntityOfPage: canonical, author: { "@type": "Organization", name: "bearworks.uk" }, isBasedOn: "https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/index.html" }) }} />
    <PublicSiteHeader />
    <article className="mx-auto max-w-5xl space-y-10 text-base leading-8">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 text-white">
        <div className="grid items-center gap-8 p-6 md:p-10 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-4 text-sm font-semibold tracking-widest text-cyan-200">八王子を数字で読み解く · 第1弾</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">八王子の人口は<br />本当に減っている？</h1>
            <p className="mt-6 text-xl font-semibold text-cyan-100">全体・地域・年齢で見る、2016年から2026年の変化</p>
            <p className="mt-4 text-slate-200">「八王子は人口が減っている」と耳にすることがあります。市全体の数字だけでなく、地域別や年齢別に分けると、同じ人口の変化でも違った姿が見えてきます。この記事では、八王子市が公表している住民基本台帳を使い、同じ「9月末」の基準日どうしで10年の変化を比較します。</p>
            <p className="mt-5 text-xs text-slate-300">比較日：2016年9月30日・2026年9月30日 · 人口は日本人と外国人の合計</p>
          </div>
          <figure className="min-w-0">
            <Image src="/images/hachioji-population/hero-illustration.webp" width={1536} height={1024} alt="丘陵を望む八王子をイメージした街並みで、親子や学生、高齢者が歩くイラスト" unoptimized priority className="h-auto w-full rounded-2xl" />
            <figcaption className="mt-3 text-xs leading-6 text-slate-300">導入用のAI生成イラスト。実在の場所や特定時点の街並み、人口・年齢構成の比率を再現したものではありません。</figcaption>
          </figure>
        </div>
      </header>

      <section aria-labelledby="answer" className="space-y-5">
        <p className="text-xs font-bold tracking-widest text-cyan-800">まず、今回の数字から</p>
        <h2 id="answer" className="text-2xl font-bold leading-relaxed text-slate-900">10年ではわずかに減少。直近1年は増加し、年齢構成は大きく変わりました。</h2>
        <p>八王子市の全市人口は、{n(comparison.cityPopulation2016)}人から{n(comparison.cityPopulation2026)}人へ、この10年で{n(Math.abs(comparison.cityDelta))}人（{percent(comparison.cityChangePercent)}）減少しました。その一方で、2025年9月末から2026年9月末の直近1年間では{n(Math.abs(comparison.latestYearDelta))}人増えています。10年間の変化と直近1年間の動きを分けて見ることが大切です。</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-cyan-50 p-5"><h3 className="text-sm font-semibold text-slate-900">全市・10年間</h3><p className="mt-3 text-3xl font-bold tabular-nums text-cyan-950">{signed(comparison.cityDelta)}<span className="ml-1 text-sm font-normal">人</span></p><p className="mt-2 text-sm">{percent(comparison.cityChangePercent)} · 全市人口を分母</p><p className="mt-2 text-xs leading-5">対象：全市 · 分母：2016年全市人口 · 基準日：2016-09-30→2026-09-30</p></div>
          <div className="rounded-2xl bg-sky-50 p-5"><h3 className="text-sm font-semibold text-slate-900">直近1年間</h3><p className="mt-3 text-3xl font-bold tabular-nums text-sky-950">{signed(comparison.latestYearDelta)}<span className="ml-1 text-sm font-normal">人</span></p><p className="mt-2 text-sm">2025年9月末→2026年9月末</p><p className="mt-2 text-xs leading-5">対象：全市 · 分母：割合計算なし · 基準日：2025-09-30→2026-09-30</p></div>
          <div className="rounded-2xl bg-amber-50 p-5"><h3 className="text-sm font-semibold text-slate-900">年齢構成</h3><p className="mt-3 text-lg font-bold text-amber-950">0〜14歳 {signed(child.delta)}人</p><p className="text-lg font-bold text-amber-950">65歳以上 {signed(older.delta)}人</p><p className="mt-2 text-sm">構成比の変化も下で確認</p><p className="mt-2 text-xs leading-5">対象：全市の年齢3区分 · 分母：各年の全市人口 · 基準日：2016-09-30→2026-09-30</p></div>
        </div>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-sky-800">{[["city", "全市の推移"], ["towns", "地域別"], ["ages", "年齢別"], ["limits", "比較の限界"], ["method", "方法・出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-sky-200 underline-offset-4 hover:decoration-sky-800">{label}</a>)}</nav>

      <section id="city" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">市全体では、途中で上下しながら、10年間でわずかに減少。</h2>
        <p>2016年から2026年まで、各年9月末時点の人口推移を並べました。今回比較した11時点のうち最も多かったのは、2017年の{n(Math.max(...data.annualPopulation.map((row) => row.population)))}人です。直近の2026年は前年（2025年）より56人多く、毎年一方向に減り続けたわけではありません。</p>
        <PopulationCharts data={data} />
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[420px] text-right text-sm"><caption className="mb-3 text-left font-semibold">八王子市の住民基本台帳人口（各年9月末）</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-2 text-left">基準日</th><th scope="col" className="p-2">人口（人）</th></tr></thead><tbody>{data.annualPopulation.map((row) => <tr key={row.targetDate} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{row.targetDate}</th><td className="p-2 tabular-nums">{n(row.population)}</td></tr>)}</tbody></table></div>
        <p className="text-xs text-slate-600">対象：八王子市全体 · 分母：10年間の増減率は2016年人口 · 基準日：各年9月30日。住民基本台帳による各時点の人数で、同一人物を追跡した集計ではありません。</p>
      </section>

      <section id="towns" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">市全体が減っていても、増えた地域はある。</h2>
        <p>区域変更に関わる8町丁を除いた191町丁では、増減の幅も方向も地域によってさまざまです。人数の増減と、2016年人口を分母にした増減率は別の問いになるため、図を切り替えて両方を見られるようにしました。なお増減率については、2016年の人口が100人未満の町丁を主順位から分けています。</p>
        <p className="rounded-xl bg-slate-50 p-4 text-sm">対象：区域変更関連の除外8町丁を除く191町丁 · 2026年9月末の全市人口に対するカバー率 {data.regions.populationCoverage2026.toFixed(1)}% · 率の順位は2016年人口100人以上の{data.regions.rateEligibleCount}町丁。宇津貫町（65人）は率の主順位から分けています。</p>
        <p>地図は載せていません。町名と統計用境界データの候補は見つかりましたが、地理的な一致を確かめられず、区域変更関連の地域を除くと事前に決めた人口カバー率95%にも届きませんでした。正確さを確かめられない地図を載せるより、対象範囲を明示したランキングと表を使います。</p>
        <h3 className="text-lg font-bold text-slate-900">比較から外した町丁も、理由と参考値を残す</h3>
        <p>区域変更が確認できた4町丁と、議決資料は見つかったものの施行日を確認できなかった4町丁です。参考人口は両時点の別々の値で、順位・増減人数・増減率は付けていません。</p><p className="text-xs text-slate-600">対象：区域変更関連の比較対象外8町丁 · 分母：人数比較なし · 基準日：2016-09-30・2026-09-30</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[650px] text-right text-sm"><caption className="mb-3 text-left">区域変更関連の比較対象外8町丁（参考人口）</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-2 text-left">町丁</th><th scope="col" className="p-2">2016年（人）</th><th scope="col" className="p-2">2026年（人）</th><th scope="col" className="p-2 text-left">比較対象外の理由</th></tr></thead><tbody>{data.excludedRegions.rows.map((row) => <tr key={row.code} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{row.name}</th><td className="p-2 tabular-nums">{n(row.population2016)}</td><td className="p-2 tabular-nums">{n(row.population2026)}</td><td className="p-2 text-left">{row.reason}</td></tr>)}</tbody></table></div>
        <p>西寺方町と美山町は、除外前の診断では減少人数・率の上位10に入っていました。除外すると目立つ地域が順位から外れるため、その事実も示します。これは「全市で減少した町丁の完全な一覧」ではありません。</p>
      </section>

      <section id="ages" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">人数の変化は、年齢区分によって異なる。</h2>
        <p>0〜14歳は{signed(child.delta)}人、65歳以上は{signed(older.delta)}人でした。全市人口に占める割合では、0〜14歳が{child.shareDeltaPoints.toFixed(2)}ポイント低下し、65歳以上は{older.shareDeltaPoints.toFixed(2)}ポイント上昇しています。15〜64歳は{signed(working.delta)}人、構成比は{working.shareDeltaPoints.toFixed(2)}ポイントの変化でした。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[660px] text-right text-sm"><caption className="mb-3 text-left">年齢3区分の人数と構成比。構成比の分母は各年の全市人口</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-2 text-left">年齢</th><th scope="col" className="p-2">2016年（人）</th><th scope="col" className="p-2">2026年（人）</th><th scope="col" className="p-2">人数差</th><th scope="col" className="p-2">2016年</th><th scope="col" className="p-2">2026年</th><th scope="col" className="p-2">構成比差</th></tr></thead><tbody>{data.ageComposition.map((row) => <tr key={row.key} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{row.label}</th><td className="p-2 tabular-nums">{n(row.population2016)}</td><td className="p-2 tabular-nums">{n(row.population2026)}</td><td className="p-2 tabular-nums">{signed(row.delta)}人</td><td className="p-2 tabular-nums">{row.share2016.toFixed(2)}%</td><td className="p-2 tabular-nums">{row.share2026.toFixed(2)}%</td><td className="p-2 tabular-nums">{row.shareDeltaPoints > 0 ? "+" : ""}{row.shareDeltaPoints.toFixed(2)}ポイント</td></tr>)}</tbody></table></div>
        <p className="text-sm text-slate-600">年齢区分ごとの人数差は、同じ人々を追跡した結果ではありません。10年の間に年齢区分を移った人や、転入・転出、出生・死亡などが含まれます。</p>
      </section>

      <section id="limits" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">人口の増減だけでは、理由までは分からない。</h2>
        <p>住民基本台帳の人数は基準日に登録されている人の数です。この人数の差だけから、転出が原因なのか、出生や死亡がどの程度影響したのか、開発が地域の変化を生んだのかを特定することはできません。因果関係を調べるには、別の資料が必要です。</p>
        <p>また、今回の比較対象191町丁は、確認できた区域変更関連の地域を除いた範囲です。地理的な境界が残る全地域で10年間不変だったと証明したものではなく、全市人口の代わりにもなりません。</p>
      </section>

      <section id="method" className={`${card} scroll-mt-6 space-y-4`}>
        <h2 className="text-2xl font-bold text-slate-900">方法・再現性・出典</h2>
        <p>八王子市の「町丁別世帯数及び人口」と「町丁別年齢別人口」を使い、2016年9月末と2026年9月末を比較しました。市全体の推移も各年9月末にそろえています。人口は日本人と外国人の合計です。国勢調査人口は混ぜていません。</p>
        <p>町名は明示した文字表記の正規化で対応し、曖昧な地理照合は行いません。比較から外した区域変更関連8町丁のうち、4町丁は変更を確認し、4町丁は施行日を確認できませんでした。市の住所・本籍変更事業一覧で確認できた範囲は2024年8月10日までで、町の区域変更全体を網羅する資料ではありません。</p>
        <p>2025年と2026年の人口CSVはExcelより各9人多く、2024年はCSVが3人少ない差がありました。差の原因は未確認です。主集計は11年のExcel系列と年齢Excelの町丁・全市合計が一致することを根拠にExcelへ統一しました。これは同じ市が公表した資料間の内部整合であり、独立した正確性確認ではありません。CSVを使った場合の2026年全市値は559,329人、2016年からの差は−3,998人で、10年比較の減少方向は変わりません。地域別の全順位が同じとは確認していません。</p>
        <p>地域別では、除外前の減少上位に西寺方町・美山町が含まれます。除外後の191町丁小計は2016年530,676人、2026年528,044人です。これは全市総数563,327人・559,320人とは別の範囲です。</p>
        <p>利用条件：八王子市の人口・年齢データはCC BY 4.0。原本のExcel/CSVは公開配布せず、正規化データと集計値を公開します。<strong>出典：「町丁別世帯数及び人口」「町丁別年齢別人口」、八王子市、CC BY 4.0。改変：文字表記の正規化、町丁対応、集計・図表化。</strong></p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-sky-800"><li><a className="underline" href="https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/index.html">八王子市：町丁別世帯数及び人口</a></li><li><a className="underline" href="https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/index.html">八王子市：町丁別年齢別人口</a></li><li><a className="underline" href="https://www.city.hachioji.tokyo.jp/contents/open/001/p005861.html#ccby">八王子市：オープンデータ利用条件（CC BY 4.0）</a></li><li><a className="underline" href="https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/001a/p032860.html">八王子市：住所・本籍変更事業一覧</a></li><li><a className="underline" href="https://www.city.hachioji.tokyo.dbsr.jp/index.php/734981?Id=6155&Template=document">八王子市議会：町区域変更の会議録</a></li><li><a className="underline" href="/data/hachioji-population/source-manifest.json">資料の版・取得記録・利用条件とデータhash</a></li><li><a className="underline" href="/data/hachioji-population/hachioji-population-2026-10-24.r1.json">記事の集計JSON</a></li><li><a className="underline" href="/data/hachioji-population/annual-population.csv">年次人口CSVをダウンロード</a></li><li><a className="underline" href="/data/hachioji-population/csv-2026-discrepancies.csv">2026年CSV差の8町丁を確認</a></li><li><a className="underline" href="/data/hachioji-population/retained-region-comparison.csv">比較対象191町丁CSVをダウンロード</a></li><li><a className="underline" href="/data/hachioji-population/excluded-region-reference.csv">比較対象外8町丁の参考人口CSVをダウンロード</a></li><li><a className="underline" href="/data/hachioji-population/age-2016-09.csv">2016年年齢別CSVをダウンロード</a></li><li><a className="underline" href="/data/hachioji-population/age-2026-09.csv">2026年年齢別CSVをダウンロード</a></li></ul>
        <p className="text-xs text-slate-600">再現手順と検算コードはリポジトリの <code>docs/task/issue-410</code> と <code>scripts/hachioji-population</code> にあります。公開前に、採用した公式資料が更新されていないか再取得して確認します。</p>
      </section>

      <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9"><p className="text-sm font-bold tracking-widest text-cyan-200">次回の候補</p><h2 className="mt-2 text-2xl font-bold">地価・高齢化・学生の街も、数字から確かめられる。</h2><p className="mt-3 text-sm text-slate-200">次に扱うテーマは別の記事で検討します。このシリーズでは、問いごとに一次資料と比較できる範囲を丁寧に確かめていきます。</p><p className="mt-5"><Link href="/labs/hachioji-climate" className="font-semibold text-cyan-200 underline underline-offset-4">気候データを読んだ記事も見る →</Link></p><p className="mt-3"><Link href="/labs" className="font-semibold text-cyan-200 underline underline-offset-4">Labsの記事一覧 →</Link></p></section>
    </article>
    <PublicSiteFooter />
  </main>;
}
