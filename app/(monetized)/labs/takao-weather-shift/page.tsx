import type { Metadata } from "next";
import InternalLink from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { TakaoWeatherRiskMeter } from "@/components/TakaoWeatherRiskMeter";
import { takaoWeatherShiftProvenance } from "@/lib/content-provenance";

const title = "高尾山の天気をどう読む？ 市街地との差と確率の分母";
const description = "市街地の晴れと山の天気を混同しないために、地形による雲の発生、観測と再解析の違い、条件付き確率の分母を学ぶ。";

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description,
  alternates: { canonical: "https://bearworks.uk/labs/takao-weather-shift" },
  openGraph: {
    title,
    description,
    url: "https://bearworks.uk/labs/takao-weather-shift",
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "article",
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
    dateModified: "2026-10-03",
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk" },
    mainEntityOfPage: "https://bearworks.uk/labs/takao-weather-shift",
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 text-slate-900 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />
      <article className="mx-auto max-w-4xl space-y-10">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
          <p className="text-xs font-bold tracking-wide text-amber-700">街のうわさを、統計でほどく · 気象の読み方</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-5 leading-relaxed text-slate-700">
            市街地で晴れていても、山の同じ時刻・場所の天気までは分かりません。高尾山を題材に、地形による雲の発生と、過去データから何が言えるかを順に確かめます。
          </p>
          <p className="mt-4 text-sm text-slate-600">執筆：kuma / bearworks.uk · 初出：2026年9月17日 · 改訂：2026年10月3日</p>
        </header>

        <section aria-labelledby="correction-heading" className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 id="correction-heading" className="text-xl font-bold text-amber-950">旧版の数値について</h2>
          <p className="mt-3 leading-relaxed text-amber-950">
            旧版は2024年の時間別再解析データを観測値と呼び、本文と図で異なる降水割合を掲載しました。また、年間の同時発生日数を「晴れた日の条件付き確率」と説明していました。取得原本が保存されていないため、旧集計から元の時刻別データを独立に再計算できません。旧版の発生日数、降水割合、危険度点数は本稿の根拠として使用しません。
          </p>
        </section>

        <section aria-labelledby="terrain-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="terrain-heading" className="text-2xl font-bold">1. 山で雲ができる仕組み</h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            湿った空気が山の斜面に沿って上昇すると、膨張して冷え、水蒸気が凝結して雲になることがあります。気象庁の教材もこの仕組みを説明しています。ただし、風向、空気の湿り具合、上空の状態は日ごとに変わるため、「南風なら必ず高尾山頂で霧が出る」とは言えません。
          </p>
          <p className="mt-3 leading-relaxed text-slate-700">
            相対湿度が高いことは霧そのものの観測ではありません。視程や雲の状態を直接確認せずに「濃霧の日数」と数えることもできません。市街地の天気と山の天気を比べるときは、同じ時刻の地点、標高、測定項目をそろえます。
          </p>
        </section>

        <section aria-labelledby="data-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="data-heading" className="text-2xl font-bold">2. 観測・再解析・予報を分ける</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="mb-3 text-left text-slate-600">天気データの種類と読み方</caption>
              <thead className="bg-slate-100"><tr><th scope="col" className="p-3">種類</th><th scope="col" className="p-3">何を表すか</th><th scope="col" className="p-3">注意点</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                <tr><th scope="row" className="p-3 font-semibold">地点観測</th><td className="p-3">観測所で測った値</td><td className="p-3">その地点の値であり、山頂の値とは限らない</td></tr>
                <tr><th scope="row" className="p-3 font-semibold">再解析</th><td className="p-3">観測と数値モデルを組み合わせて推定した過去の値</td><td className="p-3">格子の大きさと地形表現に限界がある</td></tr>
                <tr><th scope="row" className="p-3 font-semibold">予報</th><td className="p-3">これから先の天気の見通し</td><td className="p-3">更新されるため、出発前と行動中に確認する</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            旧版の取得スクリプトは両地点ともOpen-MeteoのHistorical Weather APIに問い合わせていました。八王子のアメダス実測値を直接読み込んだものではありません。同APIの再解析値は観測とモデルを組み合わせた推定値で、山頂の視程や登山道の状態を直接観測した記録でもありません。
          </p>
        </section>

        <section aria-labelledby="probability-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="probability-heading" className="text-2xl font-bold">3. 「年間の割合」と「晴れた日の割合」は違う</h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            次は計算方法を学ぶためだけの仮想例です。100日のうち市街地が晴れた日が30日、そのうち山頂で高湿度だった日が12日だったとします。高湿度は霧の観測を意味しません。
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-sky-50 p-5"><h3 className="font-bold">全日を分母にする</h3><p className="mt-2 text-lg font-semibold">12 ÷ 100 = 12%</p><p className="mt-1 text-sm">「市街地が晴れ、かつ山頂が高湿度」の同時割合です。</p></div>
            <div className="rounded-xl bg-amber-50 p-5"><h3 className="font-bold">市街地が晴れた日を分母にする</h3><p className="mt-2 text-lg font-semibold">12 ÷ 30 = 40%</p><p className="mt-1 text-sm">「市街地が晴れたときに山頂が高湿度」の条件付き割合です。</p></div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            同じ12日でも分母が違えば意味が変わります。過去の頻度を求めても、それだけで明日の発生確率や登山の安全性は判定できません。
          </p>
          <InternalLink href="/toukei/guides/distribution-selection" className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline">関連する確率分布のガイドを見る</InternalLink>
        </section>

        <section aria-labelledby="conditions-heading">
          <h2 id="conditions-heading" className="mb-4 text-2xl font-bold">4. 条件を変えて、確認する情報を考える</h2>
          <TakaoWeatherRiskMeter />
        </section>

        <section aria-labelledby="quiz-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="quiz-heading" className="text-2xl font-bold">理解度チェック</h2>
          <div className="mt-5 space-y-4">
            <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Q1. 市街地の相対湿度と山頂の相対湿度がともに90%なら、山頂で濃霧を観測したと断定できる？</summary><p className="mt-3 text-sm leading-relaxed">できません。湿度だけでは視程が分からず、霧の直接観測にはなりません。</p></details>
            <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Q2. 上の仮想例で「市街地が晴れた日に山頂が高湿度」の割合はいくつ？</summary><p className="mt-3 text-sm leading-relaxed">12 ÷ 30 = 40%です。分母は全100日ではなく、市街地が晴れた30日です。</p></details>
            <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Q3. 過去の再解析で得た割合を、翌日の山頂の予報確率として使える？</summary><p className="mt-3 text-sm leading-relaxed">使えません。過去の頻度と将来の予報は別です。最新の予報や防災情報を確認します。</p></details>
          </div>
        </section>

        <section aria-labelledby="sources-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="sources-heading" className="text-2xl font-bold">資料と制作情報</h2>
          <ul className="mt-4 space-y-3">
            {sourceLinks.map((source) => (
              <li key={source.url} className="text-sm leading-relaxed">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-700 hover:underline">{source.title}</a>
                <span className="block text-slate-600">確認する内容：{source.purpose}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p>執筆：{takaoWeatherShiftProvenance.writtenBy}</p>
            <p>検証：{takaoWeatherShiftProvenance.checkedBy}</p>
            <p>最終確認：{takaoWeatherShiftProvenance.finalReviewedBy}</p>
          </div>
        </section>

        <nav aria-label="関連教材" className="flex flex-wrap gap-4 text-sm font-semibold">
          <InternalLink href="/toukei/guides" className="text-amber-700 hover:underline">統計ガイド一覧</InternalLink>
          <InternalLink href="/toukei/problems" className="text-amber-700 hover:underline">例題一覧</InternalLink>
          <InternalLink href="/labs/hachioji-climate" className="text-amber-700 hover:underline">八王子の気候分析</InternalLink>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
