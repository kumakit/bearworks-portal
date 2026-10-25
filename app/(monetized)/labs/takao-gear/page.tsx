import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Backpack, Clock3, CloudSun, ExternalLink, Map, TriangleAlert } from "lucide-react";
import InternalLink from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { takaoGearProvenance } from "@/lib/content-provenance";

const title = "高尾山の装備をどう決める？ ルート・天気・行動時間の確認手順";
const description = "高尾山へ行く前に、現地の登山道情報、最新の天気、行動時間を確認するための教材。過去の気象頻度から装備の必要性を断定しない。";
const canonicalUrl = "https://bearworks.uk/labs/takao-gear";
const heroImage = "/images/takao-gear/hero-illustration-v2.webp";
const card = "min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";

const conditions = [
  { Icon: Map, title: "予定ルート", text: "コース図、通行情報、足元の状態、移動距離を確認します。ケーブルカーの利用予定も区別します。", tone: "border-emerald-100 bg-emerald-50 text-emerald-800" },
  { Icon: CloudSun, title: "最新の気象情報", text: "出発前の予報と警報・注意報を見ます。行動中も雨雲や雷の情報の更新時刻を確かめます。", tone: "border-sky-100 bg-sky-50 text-sky-800" },
  { Icon: Clock3, title: "行動時間", text: "開始・終了の予定、日没、休憩や遅れが出た場合の余裕を考えます。", tone: "border-amber-100 bg-amber-50 text-amber-800" },
  { Icon: Backpack, title: "人と持ち物", text: "同行者の経験、歩きやすい靴、雨具、連絡手段などを現地案内と照合します。", tone: "border-indigo-100 bg-indigo-50 text-indigo-800" },
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
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-4 text-sm font-semibold tracking-widest text-emerald-200">街のうわさを、統計でほどく · 05</p>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                高尾山の装備を<br />どう決める？
                <span className="mt-4 block text-xl leading-snug text-emerald-200 md:text-2xl"><span className="inline-block">ルート・天気・</span><span className="inline-block">行動時間の確認手順</span></span>
              </h1>
              <p className="mt-5 text-slate-200">
                「高尾山なら軽装でよい」「冬は必ず特定の靴が要る」といった一律の判断は、予定するコース、天候、時間、本人の経験を落とします。公的・現地の案内を出発前にどう確認するかを整理します。
              </p>
              <p className="mt-5 text-xs leading-6 text-slate-300"><span className="inline-block">執筆：kuma / bearworks.uk</span>{" · "}<span className="inline-block">初出：2026年9月17日</span><br /><span className="inline-block">本文改訂：2026年10月3日</span></p>
            </div>
            <figure className="min-w-0">
              <Image src={heroImage} width={1536} height={1024} alt="木漏れ日の差す高尾山をイメージした登山口で、地図とザックの中身を確認する二人のイラスト" unoptimized priority className="h-auto w-full rounded-2xl" />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">導入用のAI生成イラスト。実在のコースや当日の登山道・装備条件を再現したものではありません。</figcaption>
            </figure>
          </div>
        </header>

        <section aria-labelledby="revision-note" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-8">
          <div className="flex items-start gap-3"><TriangleAlert size={22} aria-hidden="true" className="mt-1 shrink-0 text-amber-700" /><h2 id="revision-note" className="text-xl font-bold text-amber-950">旧版の「装備必須日数」について</h2></div>
          <p className="mt-3 text-sm leading-7 text-amber-950">
            旧版は過去のモデル値に独自の閾値を当て、「年間何日、特定の装備が必須」と表示しました。取得原本と装備判断の妥当性を独立に確認できず、気象条件だけで個人ごとの必要装備を決められません。旧版の年間日数、事故確率、点数式のシミュレーターは本稿の判断根拠として使用しません。
          </p>
        </section>

        <nav aria-label="記事の目次" className="flex flex-wrap gap-2 text-sm font-semibold text-emerald-800">
          {[["local-guidance", "01 現地の案内"], ["conditions", "02 四つの条件"], ["limits", "03 データの限界"], ["quiz", "04 確認問題"], ["sources", "参照資料"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-emerald-100 bg-white px-4 py-2 transition-colors hover:bg-emerald-50">{label}</a>)}
        </nav>

        <section id="local-guidance" aria-labelledby="local-guidance-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-emerald-700">01 · 現地の確認</p>
          <h2 id="local-guidance-heading" className={`${heading} mt-2`}>まず、現地の案内を見る。</h2>
          <p className="mt-4">
            高尾ビジターセンターは、けがを防ぐ服装、滑りにくい靴、両手が空くザック、雨具などを案内しています。八王子市はコースが工事や天候で通行止めになる場合があると説明しています。予定しているルートが通れるか、現地の最新情報で確かめるところから始めましょう。
          </p>
          <p className="mt-3">
            これらは現地施設の一般的な案内です。特定の靴や衣服だけで安全を保証するものではありません。季節、足元、距離、同行者の経験によって準備は変わります。
          </p>
        </section>

        <section id="conditions" aria-labelledby="conditions-heading" className="scroll-mt-6">
          <p className="text-sm font-bold text-emerald-700">02 · 準備の組み立て</p>
          <h2 id="conditions-heading" className={`${heading} mt-2`}>出発前に照合する、四つの条件。</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {conditions.map(({ Icon, title: conditionTitle, text, tone }) => <div key={conditionTitle} className={`rounded-2xl border p-5 md:p-6 ${tone}`}><Icon size={25} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold">{conditionTitle}</h3><p className="mt-2 text-sm leading-7 text-slate-700">{text}</p></div>)}
          </div>
        </section>

        <section id="limits" aria-labelledby="limits-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-emerald-700">03 · データの読み方</p>
          <h2 id="limits-heading" className={`${heading} mt-2`}>過去の頻度から「必須」を決められない理由。</h2>
          <p className="mt-4">
            仮に過去の気温がある閾値を下回った日数を正しく数えられても、それは「その測定方法で閾値を下回った日数」です。ある人が、あるコースで、ある服装を必要とした日数ではありません。閾値の選び方を変えれば集計も変わり、気象の頻度は事故の確率にも変換できません。
          </p>
          <aside className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
            <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
            <h3 className="mt-2 text-lg font-bold text-indigo-950">数値を使う前に、対象と前提をそろえる。</h3>
            <p className="mt-3 text-sm leading-7 text-indigo-950">データに基づく装備の議論をするなら、元データ、欠測、集計の単位、閾値の根拠、対象とする人・コースを示す必要があります。旧版はその条件を満たせていないため、本稿では数字で装備を採点しません。</p>
          </aside>
          <InternalLink href="/labs/takao-weather-shift" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4">観測・再解析・予報の違いを学ぶ<ArrowRight size={16} aria-hidden="true" /></InternalLink>
        </section>

        <section id="quiz" aria-labelledby="quiz-heading" className="scroll-mt-6">
          <p className="text-sm font-bold text-emerald-700">04 · 確認問題</p>
          <h2 id="quiz-heading" className={`${heading} mt-2`}>装備を考える前提を、2問で確かめる。</h2>
          <div className="mt-5 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><summary className="cursor-pointer font-semibold text-slate-900 marker:text-emerald-700">Q1. 昨年の気温の閾値超過日数だけで、明日の装備を一律に指定できる？</summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7">できません。過去の頻度、明日の予報、予定ルート、本人の条件は別です。</p></details>
            <details className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><summary className="cursor-pointer font-semibold text-slate-900 marker:text-emerald-700">Q2. 出発前にコース図を見た後、何を更新して確認する？</summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7">現地の通行情報と最新の気象情報です。工事や天候で状況が変わり得ます。</p></details>
          </div>
        </section>

        <section id="sources" aria-labelledby="sources-heading" className={`${card} scroll-mt-6`}>
          <p className="text-sm font-bold text-emerald-700">方法と出典</p>
          <h2 id="sources-heading" className={`${heading} mt-2`}>参照資料と制作情報</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {sources.map((source) => (
              <li key={source.url} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 font-semibold text-emerald-800 underline underline-offset-4">{source.title}<ExternalLink size={15} aria-hidden="true" className="mt-1.5 shrink-0" /></a>
                <p className="mt-2 text-slate-600">確認する内容：{source.note}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-5 border-t border-slate-200 pt-6 text-sm md:grid-cols-3">
            {[["執筆", takaoGearProvenance.writtenBy], ["検証", takaoGearProvenance.checkedBy], ["最終確認", takaoGearProvenance.finalReviewedBy]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-semibold text-slate-900">{label}</dt><dd className="mt-2 leading-7 text-slate-600">{value}</dd></div>)}
          </dl>
        </section>

        <section aria-labelledby="series-heading" className="rounded-[2rem] bg-slate-900 p-6 text-white md:p-8">
          <p className="text-sm font-semibold tracking-widest text-emerald-200">街のうわさを、統計でほどく</p>
          <h2 id="series-heading" className="mt-2 text-2xl font-bold">八王子の気候データシリーズ</h2>
          <nav aria-label="気候シリーズの記事" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {seriesArticles.map((article) => article.href === "/labs/takao-gear" ? <div key={article.href} aria-current="page" className="rounded-2xl border border-emerald-300/50 bg-emerald-950 p-4"><p className="text-xs font-bold text-emerald-200">{article.number} · 本記事</p><h3 className="mt-2 text-sm font-semibold leading-6">{article.title}</h3></div> : <InternalLink key={article.href} href={article.href} className="rounded-2xl border border-slate-600 bg-slate-800 p-4 transition-colors hover:border-emerald-300 hover:bg-slate-700"><p className="text-xs font-bold text-emerald-200">{article.number}</p><h3 className="mt-2 text-sm font-semibold leading-6">{article.title}</h3></InternalLink>)}
          </nav>
        </section>

        <nav aria-label="統計の学習教材" className="flex flex-wrap gap-4 text-sm font-semibold text-emerald-800">
          <InternalLink href="/toukei/guides/sampling-and-bias" className="underline underline-offset-4">標本と偏りのガイド</InternalLink>
          <InternalLink href="/toukei/problems" className="underline underline-offset-4">例題一覧</InternalLink>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
