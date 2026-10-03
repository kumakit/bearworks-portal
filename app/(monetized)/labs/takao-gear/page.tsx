import type { Metadata } from "next";
import InternalLink from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { takaoGearProvenance } from "@/lib/content-provenance";

const title = "高尾山の装備をどう決める？ ルート・天気・行動時間の確認手順";
const description = "高尾山へ行く前に、現地の登山道情報、最新の天気、行動時間を確認するための教材。過去の気象頻度から装備の必要性を断定しない。";

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description,
  alternates: { canonical: "https://bearworks.uk/labs/takao-gear" },
  openGraph: {
    title,
    description,
    url: "https://bearworks.uk/labs/takao-gear",
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "article",
  },
};

const sources = [
  {
    title: "東京都 高尾ビジターセンター：グループ登山Q&A",
    url: "https://takaovc.ces-net.jp/?page_id=273",
    note: "服装・持ち物と現地での確認事項",
  },
  {
    title: "八王子市：高尾山",
    url: "https://www.city.hachioji.tokyo.jp/kankobunka/001/004/p003393.html",
    note: "登山道の通行止めや服装に関する案内",
  },
  {
    title: "高尾登山電鉄：登山コース",
    url: "https://www.takaotozan.co.jp/course/",
    note: "予定コースと経路の確認",
  },
  {
    title: "気象庁：防災情報",
    url: "https://www.jma.go.jp/bosai/",
    note: "最新の予報、警報・注意報、雨雲や雷の情報",
  },
];

export default function TakaoGearPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: "2026-09-17",
    dateModified: "2026-10-03",
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk" },
    mainEntityOfPage: "https://bearworks.uk/labs/takao-gear",
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 text-slate-900 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />
      <article className="mx-auto max-w-4xl space-y-10">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
          <p className="text-xs font-bold tracking-wide text-amber-700">街のうわさを、統計でほどく · 装備の考え方</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-5 leading-relaxed text-slate-700">
            「高尾山なら軽装でよい」「冬は必ず特定の靴が要る」といった一律の判断は、予定するコース、天候、時間、本人の経験を落とします。公的・現地の案内を出発前にどう確認するかを整理します。
          </p>
          <p className="mt-4 text-sm text-slate-600">執筆：kuma / bearworks.uk · 初出：2026年9月17日 · 改訂：2026年10月3日</p>
        </header>

        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-950">旧版の「装備必須日数」について</h2>
          <p className="mt-3 leading-relaxed text-amber-950">
            旧版は過去のモデル値に独自の閾値を当て、「年間何日、特定の装備が必須」と表示しました。取得原本と装備判断の妥当性を独立に確認できず、気象条件だけで個人ごとの必要装備を決められません。旧版の年間日数、事故確率、点数式のシミュレーターは本稿の判断根拠として使用しません。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">1. まず現地の案内を見る</h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            高尾ビジターセンターは、けがを防ぐ服装、滑りにくい靴、両手が空くザック、雨具などを案内しています。八王子市はコースが工事や天候で通行止めになる場合があると説明しています。予定しているルートが通れるか、現地の最新情報で確かめるところから始めましょう。
          </p>
          <p className="mt-3 leading-relaxed text-slate-700">
            これらは現地施設の一般的な案内です。特定の靴や衣服だけで安全を保証するものではありません。季節、足元、距離、同行者の経験によって準備は変わります。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">2. 出発前に照合する四つの条件</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-bold">予定ルート</h3><p className="mt-2 text-sm leading-relaxed">コース図、通行情報、足元の状態、移動距離を確認します。ケーブルカーの利用予定も区別します。</p></div>
            <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-bold">最新の気象情報</h3><p className="mt-2 text-sm leading-relaxed">出発前の予報と警報・注意報を見ます。行動中も雨雲や雷の情報の更新時刻を確かめます。</p></div>
            <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-bold">行動時間</h3><p className="mt-2 text-sm leading-relaxed">開始・終了の予定、日没、休憩や遅れが出た場合の余裕を考えます。</p></div>
            <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-bold">人と持ち物</h3><p className="mt-2 text-sm leading-relaxed">同行者の経験、歩きやすい靴、雨具、連絡手段などを現地案内と照合します。</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">3. 過去の頻度から「必須」を決められない理由</h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            仮に過去の気温がある閾値を下回った日数を正しく数えられても、それは「その測定方法で閾値を下回った日数」です。ある人が、あるコースで、ある服装を必要とした日数ではありません。閾値の選び方を変えれば集計も変わり、気象の頻度は事故の確率にも変換できません。
          </p>
          <p className="mt-3 leading-relaxed text-slate-700">
            データに基づく装備の議論をするなら、元データ、欠測、集計の単位、閾値の根拠、対象とする人・コースを示す必要があります。旧版はその条件を満たせていないため、本稿では数字で装備を採点しません。
          </p>
          <InternalLink href="/labs/takao-weather-shift" className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline">観測・再解析・予報の違いを学ぶ</InternalLink>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">確認問題</h2>
          <div className="mt-5 space-y-4">
            <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Q1. 昨年の気温の閾値超過日数だけで、明日の装備を一律に指定できる？</summary><p className="mt-3 text-sm leading-relaxed">できません。過去の頻度、明日の予報、予定ルート、本人の条件は別です。</p></details>
            <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Q2. 出発前にコース図を見た後、何を更新して確認する？</summary><p className="mt-3 text-sm leading-relaxed">現地の通行情報と最新の気象情報です。工事や天候で状況が変わり得ます。</p></details>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">参照資料と制作情報</h2>
          <ul className="mt-4 space-y-3">
            {sources.map((source) => (
              <li key={source.url} className="text-sm leading-relaxed">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-700 hover:underline">{source.title}</a>
                <span className="block text-slate-600">確認する内容：{source.note}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p>執筆：{takaoGearProvenance.writtenBy}</p>
            <p>検証：{takaoGearProvenance.checkedBy}</p>
            <p>最終確認：{takaoGearProvenance.finalReviewedBy}</p>
          </div>
        </section>

        <nav aria-label="関連教材" className="flex flex-wrap gap-4 text-sm font-semibold">
          <InternalLink href="/labs/takao-weather-shift" className="text-amber-700 hover:underline">高尾山の天気の読み方</InternalLink>
          <InternalLink href="/labs/hachioji-rain" className="text-amber-700 hover:underline">第7弾：雨の日数と量</InternalLink>
          <InternalLink href="/labs/hachioji-autumn" className="text-amber-700 hover:underline">第8弾：気温で数える秋</InternalLink>
          <InternalLink href="/toukei/guides/sampling-and-bias" className="text-amber-700 hover:underline">標本と偏りのガイド</InternalLink>
          <InternalLink href="/toukei/problems" className="text-amber-700 hover:underline">例題一覧</InternalLink>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
