import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileCheck2,
  Snowflake,
  Sun,
  ThermometerSun,
} from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  climateBundle,
  climateLock,
  deltaRange,
  recentStationSummaries,
} from "@/lib/hachioji-climate-publication";

const canonicalUrl = "https://bearworks.uk/labs/hachioji-climate";

export const metadata: Metadata = {
  title: "八王子は本当に夏暑く、冬寒いのか | bearworks.uk",
  description:
    "気象庁の1990〜2025年の日別観測値を使い、八王子・府中・青梅・東京の暑さ、寒さ、日較差を5つの事前仮説で比較しました。",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "八王子は本当に夏暑く、冬寒いのか",
    description: "気象庁の一次データで、八王子の暑さと寒さを4地点比較しました。",
    siteName: "bearworks.uk",
  },
};

const hypotheses = [
  {
    id: "H1",
    title: "昼の厳しい暑さは東京より多い",
    body: "八王子の猛暑日は、比較可能な全区間で東京を年3.0〜5.8日上回りました。",
    icon: ThermometerSun,
    color: "text-accent-pink",
    background: "bg-pink-50 border-pink-100",
  },
  {
    id: "H2",
    title: "夜は東京より涼しい",
    body: "日最低気温25℃以上の日は東京のほうが年22.0〜36.6日多く、八王子では少ない結果でした。",
    icon: Sun,
    color: "text-accent-yellow",
    background: "bg-yellow-50 border-yellow-100",
  },
  {
    id: "H3",
    title: "冬日は東京より大幅に多い",
    body: "八王子の冬日は、比較可能な全区間で東京を年49.3〜61.6日上回りました。",
    icon: Snowflake,
    color: "text-accent-blue",
    background: "bg-blue-50 border-blue-100",
  },
  {
    id: "H4",
    title: "4地点で最も寒いとは限らない",
    body: "青梅の冬日は八王子より年3.9〜10.0日多く、「多摩で八王子が最も寒い」という一般化は支持されません。",
    icon: AlertTriangle,
    color: "text-accent-purple",
    background: "bg-purple-50 border-purple-100",
  },
  {
    id: "H5",
    title: "昼夜の気温差が大きい",
    body: "八王子の日較差中央値は、夏季・冬季とも東京より1.5〜4.3℃大きい結果でした。",
    icon: Database,
    color: "text-accent-green",
    background: "bg-green-50 border-green-100",
  },
];

const format = (value: number) => value.toFixed(1);

export default function HachiojiClimatePage() {
  const qualityWarning = climateBundle.warnings.find(
    (warning) => warning.code === "semi_normal_values_included",
  );
  const qualityCounts = qualityWarning?.counts_by_station;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "八王子は本当に夏暑く、冬寒いのか",
    datePublished: "2026-08-12",
    dateModified: "2026-08-12",
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk", url: "https://bearworks.uk" },
    isBasedOn: climateBundle.attribution.source_url,
  };

  return (
    <main className="max-w-5xl w-full mx-auto px-4 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
          <ArrowLeft size={16} />
          bearworks.uk に戻る
        </Link>
      </div>

      <article className="space-y-8">
        <header className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-soft md:p-14">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold tracking-[0.2em] text-accent-purple">PRIMARY DATA LAB</p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-primary md:text-5xl">
              八王子は本当に<br className="hidden sm:block" />夏暑く、冬寒いのか
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              気象庁の1990〜2025年の日別観測値を使い、八王子・府中・青梅・東京の4地点を比較しました。
              先に5つの仮説と判定基準を固定し、観測環境が変わった境界をまたがない区間ごとに確かめています。
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold text-muted">
              <span className="rounded-full bg-gray-100 px-4 py-2">対象 1990-01-01〜2025-12-31</span>
              <span className="rounded-full bg-gray-100 px-4 py-2">4地点</span>
              <span className="rounded-full bg-gray-100 px-4 py-2">5仮説</span>
              <span className="rounded-full bg-gray-100 px-4 py-2">更新 2026-08-12</span>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 md:p-8" aria-labelledby="conclusion">
          <h2 id="conclusion" className="flex items-center gap-2 text-xl font-bold text-primary">
            <CheckCircle2 className="text-amber-600" size={22} />
            結論：八王子は「昼に暑く、夜と冬は冷えやすい」
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            ただし、4地点の中では青梅の冬日が八王子より多く、八王子を地域で最も寒い地点とは言えません。
            これは観測地点同士の比較であり、市域全体の気候、原因、将来の変化を示すものではありません。
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2" aria-label="5つの仮説の結果">
          {hypotheses.map(({ id, title, body, icon: Icon, color, background }) => {
            const result = climateBundle.hypotheses.find((item) => item.hypothesis_id === id);
            const range = deltaRange(id);
            return (
              <div key={id} className={`rounded-[2rem] border p-6 ${background}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white ${color}`}><Icon size={22} /></div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">{id} 支持</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                <p className="mt-3 text-xs text-muted/80">
                  bundle差分範囲 {format(range.min)}〜{format(range.max)} / 公開判定 {result?.permission}
                </p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-soft md:p-10" aria-labelledby="recent-comparison">
          <h2 id="recent-comparison" className="text-2xl font-bold text-primary">直近6年（2020〜2025年）の年平均</h2>
          <p className="mt-3 leading-relaxed text-muted">年ごとの集計値を6年分平均した参考表です。順位や長期トレンドの判定には使用していません。</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-right text-sm">
              <caption className="sr-only">2020年から2025年までの4地点の気温指標年平均</caption>
              <thead>
                <tr className="border-b border-gray-200 text-xs text-muted">
                  <th scope="col" className="px-3 py-3 text-left">地点</th>
                  <th scope="col" className="px-3 py-3">猛暑日</th>
                  <th scope="col" className="px-3 py-3">真夏日</th>
                  <th scope="col" className="px-3 py-3">最低25℃以上</th>
                  <th scope="col" className="px-3 py-3">冬日</th>
                  <th scope="col" className="px-3 py-3">日較差中央値</th>
                </tr>
              </thead>
              <tbody>
                {recentStationSummaries.map((row) => (
                  <tr key={row.key} className="border-b border-gray-100 last:border-0">
                    <th scope="row" className="px-3 py-4 text-left font-bold text-primary">{row.name}</th>
                    <td className="px-3 py-4">{format(row.heatstrokeDays)}日</td>
                    <td className="px-3 py-4">{format(row.midsummerDays)}日</td>
                    <td className="px-3 py-4">{format(row.tropicalNightEquivalentDays)}日</td>
                    <td className="px-3 py-4">{format(row.winterDays)}日</td>
                    <td className="px-3 py-4">{format(row.dailyRange)}℃</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-soft">
            <h2 className="text-xl font-bold text-primary">指標の定義</h2>
            <dl className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
              <div><dt className="font-bold text-primary">猛暑日</dt><dd>日最高気温35℃以上。</dd></div>
              <div><dt className="font-bold text-primary">真夏日</dt><dd>日最高気温30℃以上。</dd></div>
              <div><dt className="font-bold text-primary">最低25℃以上</dt><dd>日最低気温25℃以上。夜間だけを切り出した「熱帯夜」と同一ではありません。</dd></div>
              <div><dt className="font-bold text-primary">冬日</dt><dd>暦年内の日最低気温0℃未満の日数。</dd></div>
              <div><dt className="font-bold text-primary">日較差</dt><dd>日最高気温と日最低気温の差。夏は6〜8月、冬は12〜2月の中央値。</dd></div>
            </dl>
          </div>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-soft">
            <h2 className="text-xl font-bold text-primary">品質と比較ルール</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>気象庁の品質コード8（正常値）と5（準正常値）を集計対象にしました。</li>
              <li>各指標は有効日が期待日数の90%以上ある期間だけ公開対象です。</li>
              <li>
                品質5の採用件数は府中{qualityCounts?.fuchu}、八王子{qualityCounts?.hachioji}、青梅{qualityCounts?.ome}、東京{qualityCounts?.tokyo}です。
              </li>
              <li>八王子・府中・青梅は2003年と2008年、東京は2014年の観測環境境界を考慮しました。</li>
              <li>境界をまたぐ単一のトレンド、順位、因果関係は主張しません。</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-purple-100 bg-purple-50 p-7 md:p-9" aria-labelledby="expectation-gap">
          <h2 id="expectation-gap" className="text-xl font-bold text-primary">事前予想との差をどう読むか</h2>
          <p className="mt-4 leading-relaxed text-muted">
            事前登録した5つの仮説は、定義した閾値、coverage条件、共通均質区間の範囲ですべて支持されました。
            今回の分析では事前予想への反証となる結果は確認されていません。支持は閾値との整合を示すだけで、原因の証明ではありません。
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            一方で、日常的な印象として広げられがちな「八王子が多摩で最も寒い」という主張は、今回の4地点比較では青梅の冬日が多いため支持されませんでした。
          </p>
        </section>

        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-7 shadow-soft md:p-10" aria-labelledby="reproducibility">
          <h2 id="reproducibility" className="flex items-center gap-2 text-2xl font-bold text-primary"><FileCheck2 className="text-accent-green" />再現性と出典</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-bold text-primary">固定した公開データ</h3>
              <dl className="mt-3 space-y-2 break-all text-sm text-muted">
                <div><dt className="font-bold text-primary">bundle</dt><dd>{climateLock.bundle_version}</dd></div>
                <div><dt className="font-bold text-primary">schema</dt><dd>{climateLock.bundle_schema_version}</dd></div>
                <div><dt className="font-bold text-primary">SHA-256</dt><dd className="font-mono text-xs">{climateLock.bundle_sha256}</dd></div>
                <div><dt className="font-bold text-primary">Apps commit</dt><dd className="font-mono text-xs">{climateLock.apps_production_commit}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="font-bold text-primary">一次情報と実装</h3>
              <div className="mt-3 flex flex-col items-start gap-3 text-sm font-bold">
                <a href={climateBundle.attribution.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-purple hover:underline">気象庁 過去の気象データ・ダウンロード <ArrowUpRight size={14} /></a>
                <a href={`https://github.com/kumakit/bearworks-apps/tree/${climateLock.apps_production_commit}/streamlit/hachioji_climate`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-purple hover:underline">分析コードとデータ契約 <ArrowUpRight size={14} /></a>
                <a href="https://apps.bearworks.uk/Hachioji_Climate" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-purple hover:underline">操作できる分析アプリ <ArrowUpRight size={14} /></a>
              </div>
            </div>
          </div>
          <p className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm leading-relaxed text-muted">
            出典：{climateBundle.attribution.processing_ja}。公開JSONはビルド時にbyte sizeとSHA-256を検証し、不一致なら公開処理を停止します。
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-7">
            <h2 className="text-xl font-bold text-primary">AIと人の役割</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              AIは仮説・分析手順の整理、実装補助、文章の推敲、レビューに使用しました。人が気象庁データを取得し、公式画面との照合、独立計算、品質判断、公開内容の最終確認を行っています。専門家による査読ではありません。
            </p>
          </div>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-7">
            <h2 className="text-xl font-bold text-primary">対象外と限界</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              降雪・積雪は今回の対象外です。観測地点の移設や測器変更を含む均質性の境界があるため、1990〜2025年を一本の連続トレンドとして扱いません。結果は4観測地点の定義済み指標に限られます。
            </p>
          </div>
        </section>

        <section className="px-2 py-4 text-sm text-muted">
          <h2 className="font-bold text-primary">更新履歴</h2>
          <p className="mt-2">2026-08-12：初版公開用記事を作成（bundle {climateBundle.bundle_version}）。</p>
          <p className="mt-2">誤りや再検証のご連絡は <Link href="/contact" className="font-bold text-accent-purple hover:underline">お問い合わせページ</Link> からお願いします。</p>
        </section>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
