import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, CloudSun, ExternalLink, Layers3, MapPin, TriangleAlert } from "lucide-react";
import InternalLink from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { TakaoWeatherRiskMeter } from "@/components/TakaoWeatherRiskMeter";
import { takaoWeatherShiftProvenance } from "@/lib/content-provenance";

const title = "高尾山の天気をどう読む？ 市街地との差と確率の分母";
const description = "市街地の晴れと山の天気を混同しないために、地形による雲の発生、観測と再解析の違い、条件付き確率の分母を学ぶ。";
const canonicalUrl = "https://bearworks.uk/labs/takao-weather-shift";
const heroImage = "/images/takao-weather-shift/hero-illustration-v2.webp";
const card = "min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";

const dataTypes = [
  { Icon: MapPin, title: "地点観測", meaning: "観測所で測った値", note: "その地点の値であり、山頂の値とは限らない", tone: "border-sky-100 bg-sky-50 text-sky-800" },
  { Icon: Layers3, title: "再解析", meaning: "観測と数値モデルを組み合わせて推定した過去の値", note: "格子の大きさと地形表現に限界がある", tone: "border-indigo-100 bg-indigo-50 text-indigo-800" },
  { Icon: CloudSun, title: "予報", meaning: "これから先の天気の見通し", note: "更新されるため、出発前と行動中に確認する", tone: "border-emerald-100 bg-emerald-50 text-emerald-800" },
];

const seriesArticles = [
  { number: "01", href: "/labs/hachioji-climate", title: "夏は暑く、冬は寒い？" },
  { number: "02", href: "/labs/hachioji-snow", title: "雪のニュース。また、八王子だ。" },
  { number: "03", href: "/labs/hachioji-heat", title: "八王子の夏は本当に暑いのか" },
  { number: "04", href: "/labs/hachioji-chill", title: "八王子の朝はなぜ寒い？" },
  { number: "05", href: "/labs/takao-gear", title: "高尾山の装備をどう決める？" },
  { number: "06", href: "/labs/takao-weather-shift", title: "高尾山の天気をどう読む？" },
  { number: "07", href: "/labs/hachioji-rain", title: "八王子は都心より雨が多い？" },
  { number: "08", href: "/labs/hachioji-autumn", title: "八王子の秋は本当に短くなった？" },
];

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "article",
    images: [heroImage],
  },
};

const sourceLinks = [
  {
    title: "雲ができる仕組み（気象庁・仙台管区気象台）",
    url: "https://www.data.jma.go.jp/sendai/knowledge/kyouiku/yoho/kumo.pdf",
    purpose: "山に沿って空気が上昇し、冷えて雲ができる仕組み",
  },
  {
    title: "急な大雨や雷・竜巻から身を守るために（気象庁）",
    url: "https://www.jma.go.jp/jma/kishou/know/tenki_chuui/tenki_chuui_p6.html",
    purpose: "最新の気象情報とナウキャストの確認",
  },
  {
    title: "雷ナウキャストとは（気象庁）",
    url: "https://www.jma.go.jp/jma/kishou/know/toppuu/thunder2-1.html",
    purpose: "雷の解析・短時間予測の範囲と限界",
  },
  {
    title: "Historical Weather API / Data Sources（Open-Meteo）",
    url: "https://open-meteo.com/en/docs/historical-weather-api#data-sources",
    purpose: "旧版で使った再解析データの種類を説明する資料。新しい数値の取得には使用していない",
  },
];

export default function TakaoWeatherShiftPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: "2026-09-17",
    dateModified: "2026-10-25",
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk" },
    mainEntityOfPage: canonicalUrl,
    image: `https://bearworks.uk${heroImage}`,
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />
      <article className="space-y-10 leading-relaxed">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 text-white md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-4 text-sm font-semibold tracking-widest text-sky-200">街のうわさを、統計でほどく · 06</p>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                高尾山の天気を<br />どう読む？
                <span className="mt-4 block text-xl leading-snug text-sky-200 md:text-2xl"><span className="inline-block">市街地との差と、</span><span className="inline-block">確率の分母。</span></span>
              </h1>
              <p className="mt-5 text-slate-200">
                市街地で晴れていても、山の同じ時刻・場所の天気までは分かりません。高尾山を題材に、地形による雲の発生と、過去データから何が言えるかを順に確かめます。
              </p>
              <p className="mt-5 text-xs leading-6 text-slate-300"><span className="inline-block">執筆：kuma / bearworks.uk</span>{" · "}<span className="inline-block">初出：2026年9月17日</span><br /><span className="inline-block">本文改訂：2026年10月3日</span></p>
            </div>
            <figure className="min-w-0">
              <Image src={heroImage} width={1536} height={1024} alt="木々に囲まれた展望場所で、薄い雲のかかる山並みと日差しのある市街地を眺めながら情報を確認する登山者のイラスト" unoptimized priority className="h-auto w-full rounded-2xl" />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">導入用のAI生成イラスト。実在の眺望や特定日時の観測・予報を再現したものではありません。</figcaption>
            </figure>
          </div>
        </header>

        <section aria-labelledby="correction-heading" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-8">
          <div className="flex items-start gap-3"><TriangleAlert size={22} aria-hidden="true" className="mt-1 shrink-0 text-amber-700" /><h2 id="correction-heading" className="text-xl font-bold text-amber-950">旧版の数値について</h2></div>
          <p className="mt-3 text-sm leading-7 text-amber-950">
            旧版は2024年の時間別再解析データを観測値と呼び、本文と図で異なる降水割合を掲載しました。また、年間の同時発生日数を「晴れた日の条件付き確率」と説明していました。取得原本が保存されていないため、旧集計から元の時刻別データを独立に再計算できません。旧版の発生日数、降水割合、危険度点数は本稿の根拠として使用しません。
          </p>
        </section>

        <nav aria-label="記事の目次" className="flex flex-wrap gap-2 text-sm font-semibold text-sky-800">
          {[["terrain", "01 山と雲"], ["data", "02 データの種類"], ["probability", "03 確率の分母"], ["conditions", "04 条件を変える"], ["quiz", "05 確認問題"], ["sources", "参照資料"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-sky-100 bg-white px-4 py-2 transition-colors hover:bg-sky-50">{label}</a>)}
        </nav>

        <section id="terrain" aria-labelledby="terrain-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-sky-700">01 · 山と市街地</p>
          <h2 id="terrain-heading" className={`${heading} mt-2`}>山で雲ができる仕組み。</h2>
          <p className="mt-4">
            湿った空気が山の斜面に沿って上昇すると、膨張して冷え、水蒸気が凝結して雲になることがあります。気象庁の教材もこの仕組みを説明しています。ただし、風向、空気の湿り具合、上空の状態は日ごとに変わるため、「南風なら必ず高尾山頂で霧が出る」とは言えません。
          </p>
          <aside className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
            <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
            <h3 className="mt-2 text-lg font-bold text-indigo-950">観測したものと、推測したものを分ける。</h3>
            <p className="mt-3 text-sm leading-7 text-indigo-950">相対湿度が高いことは霧そのものの観測ではありません。視程や雲の状態を直接確認せずに「濃霧の日数」と数えることもできません。市街地の天気と山の天気を比べるときは、同じ時刻の地点、標高、測定項目をそろえます。</p>
          </aside>
        </section>

        <section id="data" aria-labelledby="data-heading" className="scroll-mt-6">
          <p className="text-sm font-bold text-sky-700">02 · データの種類</p>
          <h2 id="data-heading" className={`${heading} mt-2`}>観測・再解析・予報を分ける。</h2>
          <p className="mt-4 text-sm text-slate-600">天気データの種類と読み方</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {dataTypes.map(({ Icon, title: dataTitle, meaning, note, tone }) => <div key={dataTitle} className={`rounded-2xl border p-5 md:p-6 ${tone}`}><Icon size={25} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold">{dataTitle}</h3><p className="mt-3 text-xs font-semibold">何を表すか</p><p className="mt-1 text-sm leading-7 text-slate-700">{meaning}</p><div className="mt-4 border-t border-current/10 pt-4"><p className="text-xs font-semibold">注意点</p><p className="mt-1 text-sm leading-7 text-slate-700">{note}</p></div></div>)}
          </div>
          <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7">
            旧版の取得スクリプトは両地点ともOpen-MeteoのHistorical Weather APIに問い合わせていました。八王子のアメダス実測値を直接読み込んだものではありません。同APIの再解析値は観測とモデルを組み合わせた推定値で、山頂の視程や登山道の状態を直接観測した記録でもありません。
          </p>
        </section>

        <section id="probability" aria-labelledby="probability-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-sky-700">03 · 確率の分母</p>
          <h2 id="probability-heading" className={`${heading} mt-2`}>「年間の割合」と「晴れた日の割合」は違う。</h2>
          <p className="mt-4">
            次は計算方法を学ぶためだけの仮想例です。100日のうち市街地が晴れた日が30日、そのうち山頂で高湿度だった日が12日だったとします。高湿度は霧の観測を意味しません。
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sky-950"><h3 className="text-sm font-semibold">全日を分母にする</h3><p className="mt-4 text-3xl font-bold tabular-nums">12 ÷ 100 = 12%</p><p className="mt-3 text-sm leading-7">「市街地が晴れ、かつ山頂が高湿度」の同時割合です。</p></div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-amber-950"><h3 className="text-sm font-semibold">市街地が晴れた日を分母にする</h3><p className="mt-4 text-3xl font-bold tabular-nums">12 ÷ 30 = 40%</p><p className="mt-3 text-sm leading-7">「市街地が晴れたときに山頂が高湿度」の条件付き割合です。</p></div>
          </div>
          <aside className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
            <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
            <h3 className="mt-2 text-lg font-bold text-indigo-950">分母が変わると、答える問いも変わる。</h3>
            <p className="mt-3 text-sm leading-7 text-indigo-950">同じ12日でも分母が違えば意味が変わります。過去の頻度を求めても、それだけで明日の発生確率や登山の安全性は判定できません。</p>
          </aside>
          <InternalLink href="/toukei/guides/distribution-selection" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 underline underline-offset-4">関連する確率分布のガイドを見る<ArrowRight size={16} aria-hidden="true" /></InternalLink>
        </section>

        <section id="conditions" aria-labelledby="conditions-heading" className="scroll-mt-6">
          <p className="text-sm font-bold text-sky-700">04 · 条件を変える学習</p>
          <h2 id="conditions-heading" className={`${heading} mt-2`}>条件を変えて、確認する情報を考える。</h2>
          <div className="mt-5"><TakaoWeatherRiskMeter /></div>
        </section>

        <section id="quiz" aria-labelledby="quiz-heading" className="scroll-mt-6">
          <p className="text-sm font-bold text-sky-700">05 · 理解度チェック</p>
          <h2 id="quiz-heading" className={`${heading} mt-2`}>天気データの読み方を、3問で確かめる。</h2>
          <div className="mt-5 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><summary className="cursor-pointer font-semibold text-slate-900 marker:text-sky-700">Q1. 市街地の相対湿度と山頂の相対湿度がともに90%なら、山頂で濃霧を観測したと断定できる？</summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7">できません。湿度だけでは視程が分からず、霧の直接観測にはなりません。</p></details>
            <details className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><summary className="cursor-pointer font-semibold text-slate-900 marker:text-sky-700">Q2. 上の仮想例で「市街地が晴れた日に山頂が高湿度」の割合はいくつ？</summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7">12 ÷ 30 = 40%です。分母は全100日ではなく、市街地が晴れた30日です。</p></details>
            <details className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><summary className="cursor-pointer font-semibold text-slate-900 marker:text-sky-700">Q3. 過去の再解析で得た割合を、翌日の山頂の予報確率として使える？</summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7">使えません。過去の頻度と将来の予報は別です。最新の予報や防災情報を確認します。</p></details>
          </div>
        </section>

        <section id="sources" aria-labelledby="sources-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-sky-700">方法と出典</p>
          <h2 id="sources-heading" className={`${heading} mt-2`}>資料と制作情報</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {sourceLinks.map((source) => (
              <li key={source.url} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 font-semibold text-sky-800 underline underline-offset-4">{source.title}<ExternalLink size={15} aria-hidden="true" className="mt-1.5 shrink-0" /></a>
                <p className="mt-2 text-slate-600">確認する内容：{source.purpose}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-5 border-t border-slate-200 pt-6 text-sm md:grid-cols-3">
            {[["執筆", takaoWeatherShiftProvenance.writtenBy], ["検証", takaoWeatherShiftProvenance.checkedBy], ["最終確認", takaoWeatherShiftProvenance.finalReviewedBy]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-semibold text-slate-900">{label}</dt><dd className="mt-2 leading-7 text-slate-600">{value}</dd></div>)}
          </dl>
        </section>

        <section aria-labelledby="series-heading" className="rounded-[2rem] bg-slate-900 p-6 text-white md:p-8">
          <p className="text-sm font-semibold tracking-widest text-sky-200">街のうわさを、統計でほどく</p>
          <h2 id="series-heading" className="mt-2 text-2xl font-bold">八王子の気候データシリーズ</h2>
          <nav aria-label="気候シリーズの記事" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {seriesArticles.map((article) => article.href === "/labs/takao-weather-shift" ? <div key={article.href} aria-current="page" className="rounded-2xl border border-sky-300/50 bg-sky-950 p-4"><p className="text-xs font-bold text-sky-200">{article.number} · 本記事</p><h3 className="mt-2 text-sm font-semibold leading-6">{article.title}</h3></div> : <InternalLink key={article.href} href={article.href} className="rounded-2xl border border-slate-600 bg-slate-800 p-4 transition-colors hover:border-sky-300 hover:bg-slate-700"><p className="text-xs font-bold text-sky-200">{article.number}</p><h3 className="mt-2 text-sm font-semibold leading-6">{article.title}</h3></InternalLink>)}
          </nav>
        </section>

        <nav aria-label="統計の学習教材" className="flex flex-wrap gap-4 text-sm font-semibold text-sky-800">
          <InternalLink href="/toukei/guides" className="underline underline-offset-4">統計ガイド一覧</InternalLink>
          <InternalLink href="/toukei/problems" className="underline underline-offset-4">例題一覧</InternalLink>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
