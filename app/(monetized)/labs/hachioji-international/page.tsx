import type { Metadata } from "next";
import Image from "next/image";
import { BarChart3, Globe2, MapPin } from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import data from "@/public/data/hachioji-international/population.json";

const title = "八王子は国際的になってきている？";
const description = "八王子の外国人住民はどれくらい増えた？ 2013～2026年の住民基本台帳から、人口に占める割合、国籍・地域の構成、近隣市との違いを確かめます。";
const canonical = "https://bearworks.uk/labs/hachioji-international";
const imagePath = "/images/hachioji-international/hero-illustration.webp";
const image = "https://bearworks.uk" + imagePath;
const imageAlt = "緑の山並みを望む駅前広場で、街を歩いたりベンチで話したりする人々のイラスト";
const previous = "/labs/hachioji-students";
const dataPath = "/data/hachioji-international/population.json";
const sourceLinks = [
  ["https://www.toukei.metro.tokyo.lg.jp/juukim/jm-index.htm", "東京都「住民基本台帳による世帯と人口」月次"],
  ["https://www.toukei.metro.tokyo.lg.jp/gaikoku/2026/ga26010000.htm", "東京都「外国人人口」2026年（年度切替あり）"],
  ["https://www.city.hachioji.tokyo.jp/hachiouji/jinko/006/p037126.html", "八王子市「外国人住民 主要国籍・地域別人口」2026年"],
  [data.residence.source, "八王子市議会「市内在住外国人の現状について」3ページ"],
  ["https://www.moj.go.jp/isa/applications/status/student.html", "出入国在留管理庁「在留資格 留学」"],
];

export const metadata: Metadata = {
  title: title + " | 八王子を数字で読み解く | bearworks.uk",
  description, alternates: { canonical },
  openGraph: {
    type: "article", url: canonical, title, description, siteName: "bearworks.uk",
    images: [{ url: image, width: 1536, height: 1024, alt: imageAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl";
const linkClass = "font-semibold text-teal-900 underline underline-offset-4";
const n = new Intl.NumberFormat("ja-JP").format;
const dateLabel = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "UTC" });
const year = (date: string) => date.slice(0, 4);
const { annual, comparison, categories, residence } = data;
const first = annual[0];
const last = annual[annual.length - 1];
const rate = (row: { foreign: number; total: number }) => row.foreign / row.total * 100;
const rateLabel = (row: { foreign: number; total: number }) => rate(row).toFixed(2) + "％";
const increase = last.foreign - first.foreign;
const topics = [
  { id: "trend", label: "人数と割合", caption: "同じ基準日の14年分", Icon: BarChart3 },
  { id: "composition", label: "国籍・地域の構成", caption: "全期間で比べられる5区分", Icon: Globe2 },
  { id: "nearby", label: "近隣の市との比較", caption: "同じ日の6市を比較", Icon: MapPin },
];

function TrendChart({ share }: { share: boolean }) {
  const title = share ? "総人口に占める外国人住民の割合" : "外国人住民数";
  const unit = share ? "％" : "人";
  const maximum = share ? 4 : 20000;
  const x = (i: number) => 72 + i * 405 / (annual.length - 1);
  const y = (v: number) => 166 - v * 128 / maximum;
  return (
    <figure className={card}>
      <figcaption className="font-bold text-slate-900">{title}</figcaption>
      <p className="text-xs text-slate-600">各年10月1日 · 住民基本台帳</p>
      <svg className="mt-2 h-auto w-full" viewBox="0 0 500 206" role="img" aria-label={title + "の推移。年別の値は下の数値表を参照。"}>
        <text x="72" y="23" fontSize="17" fill="#475569">{unit}</text>
        {[0, 1, 2, 3, 4].map((step) => {
          const v = maximum * step / 4;
          return <g key={step}>
            <line x1="72" x2="477" y1={y(v)} y2={y(v)} stroke="#cbd5e1" strokeDasharray="3 4" />
            <text x="66" y={y(v) + 5} textAnchor="end" fontSize="17" fill="#475569">{n(v)}</text>
          </g>;
        })}
        <polyline points={annual.map((row, i) => x(i) + "," + y(share ? rate(row) : row.foreign)).join(" ")} stroke={share ? "#0369a1" : "#0f766e"} strokeWidth="3" fill="none" />
        {annual.map((row, i) => <circle key={row.date} cx={x(i)} cy={y(share ? rate(row) : row.foreign)} r="3" fill={share ? "#0369a1" : "#0f766e"} />)}
        {[0, 4, 8, 13].map((i) => <text key={i} x={x(i)} y="193" textAnchor="middle" fontSize="17" fill="#334155">{year(annual[i].date)}</text>)}
      </svg>
    </figure>
  );
}

const countryRows = categories.map((name, i) => ({
  name, from: first.counts[i], to: last.counts[i],
  fromShare: first.counts[i] / first.foreign * 100,
  toShare: last.counts[i] / last.foreign * 100,
}));

const nearby = [...comparison.cities].sort((a, b) => b.foreign - a.foreign);
const maxPeople = Math.ceil(Math.max(...nearby.map((row) => row.foreign)) / 5000) * 5000;
const maxRate = Math.ceil(Math.max(...nearby.map(rate)));

export default function HachiojiInternationalPage() {
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: title, description,
    mainEntityOfPage: canonical, image, author: { "@type": "Organization", name: "bearworks.uk" },
    isBasedOn: sourceLinks.map(([url]) => url),
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PublicSiteHeader />
      <article className="mx-auto max-w-5xl space-y-12 text-base leading-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
          <div className="grid items-center gap-8 px-6 pb-8 pt-8 sm:px-10 sm:pt-12 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.15em] text-teal-200">八王子を数字で読み解く · 第6弾</p>
              <h1 className="mt-5 text-3xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.4]">八王子は国際的に<span className="block">なってきている？</span></h1>
              <p className="mt-5 text-balance text-lg font-semibold text-amber-200 sm:text-2xl">外国人住民が増えた街を、数字で見る</p>
              <p className="mt-5 text-slate-200">八王子に暮らす外国人住民は、この十数年でどれくらい増えたのでしょうか。住民基本台帳をもとに、人数と割合、住民の構成、近隣市との違いを確かめます。</p>
              <p className="mt-5 text-xs leading-6 text-slate-300">住民基本台帳：2013～2026年の各10月1日 · 在留資格：2025年4月</p>
            </div>
            <figure className="min-w-0">
              <Image src={imagePath} width={1536} height={1024} alt={imageAlt} unoptimized preload className="h-auto w-full rounded-2xl" />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">AI生成イラスト。八王子の風景を参考に、架空の駅前広場を描いています。</figcaption>
            </figure>
          </div>
          <nav aria-label="記事の目次" className="grid border-t border-white/10 bg-white/5 sm:grid-cols-3">
            {topics.map(({ id, label, caption, Icon }) => (
              <a key={id} href={"#" + id} className="flex items-center gap-4 border-b border-white/10 px-6 py-5 last:border-0 hover:bg-white/10 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-teal-200 sm:border-b-0 sm:border-r">
                <Icon size={28} aria-hidden="true" className="shrink-0 text-teal-200" /><span><span className="block font-bold">{label}</span><span className="block text-xs text-slate-300">{caption}</span></span>
              </a>
            ))}
          </nav>
        </header>

        <section aria-labelledby="findings" className="space-y-5">
          <h2 id="findings" className={heading}>外国人住民は13年間で{n(increase)}人増えた</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-950"><p className="text-sm font-bold">外国人住民</p><p className="mt-2 text-3xl font-bold">{n(last.foreign)}<span className="ml-1 text-sm">人</span></p><p className="mt-2 text-sm">2026年10月1日</p></div>
            <div className="rounded-2xl bg-sky-50 p-5 text-sky-950"><p className="text-sm font-bold">総人口に占める割合</p><p className="mt-2 text-3xl font-bold">{rateLabel(last)}</p><p className="mt-2 text-sm">2013年は{rateLabel(first)}</p></div>
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-950"><p className="text-sm font-bold">2025年4月の在留資格別</p><p className="mt-2 text-3xl font-bold">{residence.groups[0].percent}％</p><p className="mt-2 text-sm">市議会資料で「留学」に該当</p></div>
          </div>
        </section>

        <section id="trend" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>人数と割合はどう変わった？</h2>
          <p>2013年の{n(first.foreign)}人から2026年の{n(last.foreign)}人へ、外国人住民は2倍を超えました。同じ期間に日本人住民は{n(first.japanese)}人から{n(last.japanese)}人に減り、総人口は{n(first.total)}人から{n(last.total)}人になりました。</p>
          <div className="grid gap-4 md:grid-cols-2"><TrendChart share={false} /><TrendChart share /></div>
          <details className={card}>
            <summary className="cursor-pointer font-semibold text-teal-900">14年分の人口と割合を表で見る</summary>
            <table className="mt-3 w-full text-sm leading-6">
              <caption className="sr-only">八王子市、各年10月1日。人数の単位は人</caption>
              <thead><tr><th scope="col" className="p-2 text-left">年</th><th scope="col" className="p-2 text-right">外国人</th><th scope="col" className="p-2 text-right">総人口</th><th scope="col" className="p-2 text-right">割合</th></tr></thead>
              <tbody>{annual.map((row) => <tr key={row.date} className="border-t border-slate-200">
                <th scope="row" className="p-2 text-left font-normal">{year(row.date)}</th><td className="p-2 text-right tabular-nums">{n(row.foreign)}</td><td className="p-2 text-right tabular-nums">{n(row.total)}</td><td className="p-2 text-right tabular-nums">{rateLabel(row)}</td>
              </tr>)}</tbody>
            </table>
          </details>
        </section>

        <section id="composition" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>中国籍の住民数は増え、構成比は下がった</h2>
          <p>中国は{n(countryRows[0].from)}人から{n(countryRows[0].to)}人に増えました。外国人住民全体に占める割合は{countryRows[0].fromShare.toFixed(1)}％から{countryRows[0].toShare.toFixed(1)}％に下がっています。ベトナム、ネパール、フィリピン、ミャンマーでも人数が増えました。</p>
          <figure className={card}>
            <figcaption className="font-bold text-slate-900">外国人住民に占める構成比</figcaption>
            <p className="text-xs text-slate-600">2013年10月1日・2026年10月1日 · 棒の全幅は100％</p>
            <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {countryRows.map(({ name, from, to, fromShare, toShare }) => (
                <li key={name} className="min-w-0 space-y-1 text-sm leading-6">
                  <p className="font-bold text-slate-900">{name}</p>
                  {[{ label: "2013", count: from, share: fromShare }, { label: "2026", count: to, share: toShare }].map(({ label, count, share }) => (
                    <div key={label}>
                      <p className="flex justify-between gap-2"><span>{label}</span><span className="tabular-nums">{n(count)}人（{share.toFixed(1)}％）</span></p>
                      <div className="h-2 rounded bg-slate-100" aria-hidden="true"><div className={"h-2 rounded " + (label === "2013" ? "bg-sky-600" : "bg-teal-700")} style={{ width: share + "%" }} /></div>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-6 text-slate-600">「この5区分以外」は各年の総数から同じ5区分を引いた残りです。国籍・地域の総数や、個人の背景はこの表から分かりません。</p>
          </figure>
        </section>

        <section id="nearby" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>人数と割合で、近隣市との違いを見る</h2>
          <p>比較した6市では八王子市の外国人住民数が最も多く、総人口に占める割合は立川市が八王子市を上回りました。人数と割合では、市の人口規模の影響が違います。</p>
          <figure className={card}>
            <figcaption className="font-bold text-slate-900">近隣6市の外国人住民数と総人口比</figcaption>
            <p className="text-xs text-slate-600">{dateLabel.format(new Date(comparison.date))} · 住民基本台帳 · 外国人住民数順</p>
            <table className="mt-4 w-full table-fixed text-sm leading-6">
              <caption className="sr-only">外国人住民数と、各市の総人口に占める割合</caption>
              <thead><tr><th scope="col" className="w-1/4 pr-2 text-left">市</th><th scope="col" className="px-2 text-left">人数</th><th scope="col" className="pl-2 text-left">総人口比</th></tr></thead>
              <tbody>{nearby.map((row) => (
                <tr key={row.code} className={row.code === "13201" ? "bg-teal-50" : "border-t border-slate-100"}>
                  <th scope="row" className="py-2 pr-2 text-left">{row.name}</th>
                  <td className="px-2 py-2 tabular-nums">{n(row.foreign)}人<div className="h-2 rounded bg-slate-100" aria-hidden="true"><div className="h-2 rounded bg-teal-700" style={{ width: row.foreign / maxPeople * 100 + "%" }} /></div></td>
                  <td className="py-2 pl-2 tabular-nums">{rateLabel(row)}<div className="h-2 rounded bg-slate-100" aria-hidden="true"><div className="h-2 rounded bg-sky-700" style={{ width: rate(row) / maxRate * 100 + "%" }} /></div></td>
                </tr>
              ))}</tbody>
            </table>
            <p className="mt-3 text-xs leading-6 text-slate-600">棒はそれぞれ0から表示。全幅は人数が{n(maxPeople)}人、割合が{maxRate}％です。</p>
          </figure>
        </section>

        <section id="residence" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>在留資格から見える「留学」と「永住者」</h2>
          <p>八王子市議会の資料では、2025年4月時点の在留資格で「留学」と「永住者」の割合が近くなっています。</p>
          <figure className={card}>
            <figcaption className="font-bold text-slate-900">市議会資料に掲載された在留資格のうち3区分</figcaption>
            <p className="text-xs text-slate-600">{residence.period} · 公表値 · 棒の全幅は100％</p>
            <ul className="mt-4 space-y-4 text-sm leading-6">{residence.groups.map(({ name, percent }) => (
              <li key={name}>
                <p className="flex justify-between gap-3"><span>{name}</span><strong className="shrink-0 tabular-nums">{percent}％</strong></p>
                <div className="h-3 rounded bg-slate-100" aria-hidden="true"><div className="h-3 rounded bg-amber-700" style={{ width: percent + "%" }} /></div>
              </li>
            ))}</ul>
          </figure>
          <p>在留資格の「留学」には、日本語教育機関などで学ぶ人も含まれ得ます。<Link href={previous} className={linkClass}>第5弾のキャンパス学生数</Link>は市内の大学・短大・高専で学ぶ人を数えた別の統計です。対象と時点が違うため、二つの人数を使って留学生の割合を計算することはできません。</p>
        </section>

        <section aria-labelledby="conclusion" className="space-y-5">
          <h2 id="conclusion" className={heading}>暮らしや交流を知るには</h2>
          <p>外国人住民が増え、国籍・地域の内訳も変わりました。市は多言語での案内や相談窓口を設けています。住民同士がどのように交流し、こうした取り組みが暮らしにどう役立っているかを知るには、人口統計に加えて別の調査が必要です。</p>
        </section>

        <section id="method" className={card + " space-y-4"}>
          <h2 className={heading}>調査方法・出典</h2>
          <p className="text-sm leading-7">外国人住民の割合は、同日・同じ市の外国人人口を住民基本台帳の総人口（日本人と外国人の合計）で割りました。2012年に外国人の集計制度が切り替わったため、2013年以降の各10月1日を比較しています。在留資格の割合は市議会資料が示す別時点の公表値です。</p>
          <p className="text-sm leading-7">国籍・地域別の原表は上位掲載の区分が年によって変わります。全14年に同名で掲載された5区分を採用し、残りを総数から再計算しました。都・市の公表値を基に本サイトで加工。取得日 {dateLabel.format(new Date(data.retrievedOn))}。</p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            {sourceLinks.map(([href, label]) => <li key={href}><a href={href} className={linkClass}>{label}</a></li>)}
            <li><a href={dataPath} className={linkClass}>集計データと各年の出典（JSON）</a></li>
          </ul>
        </section>

        <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-2">
          <Link href={previous} className={card + " hover:bg-teal-50"}><span className="block text-xs font-bold text-teal-800">前回・第5弾</span><span className="mt-2 block font-semibold text-slate-900">八王子はまだ学生の街？ →</span></Link>
          <Link href="/labs" className={card + " hover:bg-teal-50"}><span className="font-semibold text-teal-900">Labsの記事一覧へ →</span></Link>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
