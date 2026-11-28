import type { Metadata } from "next";
import Image from "next/image";
import { BarChart3, Globe2, Map, MapPin } from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  InternationalTrendCharts,
  NationalityContributionCharts,
  NearbyCitiesScatterChart,
  PopulationDecompositionChart,
  TownForeignMap,
  type InternationalAnalysisProp,
  type TownMapProp,
} from "@/components/hachioji/InternationalCharts";
import data from "@/public/data/hachioji-international/population.json";
import analysisJson from "@/public/data/hachioji-international/analysis.json";
import townMapJson from "@/public/data/hachioji-international/town-map.json";

const analysis = analysisJson as InternationalAnalysisProp;
const townMap = townMapJson as TownMapProp;

const title = "八王子は国際的になってきている？";
const description =
  "八王子の外国人住民はどれくらい増えた？ 2013～2026年の住民基本台帳から人口変化の内訳、増加ペースの推移、国籍・地域別の寄与、町丁別の変化地図まで確かめます。";
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
  ["https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv.html", "八王子市「町丁別世帯数及び人口（CSV）」CC BY 4.0"],
  ["https://www.e-stat.go.jp/gis/statmap-search?type=2", "政府統計の総合窓口（e-Stat）「令和2年国勢調査 町丁・字等境界データ」"],
  [data.residence.source, "八王子市議会「市内在住外国人の現状について」3ページ"],
  ["https://www.moj.go.jp/isa/applications/status/student.html", "出入国在留管理庁「在留資格 留学」"],
];

export const metadata: Metadata = {
  title: title + " | 八王子を数字で読み解く | bearworks.uk",
  description,
  alternates: { canonical },
  openGraph: {
    type: "article",
    url: canonical,
    title,
    description,
    siteName: "bearworks.uk",
    images: [{ url: image, width: 1536, height: 1024, alt: imageAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl";
const subheading = "text-xl font-bold leading-relaxed text-slate-900";
const linkClass = "font-semibold text-teal-900 underline underline-offset-4";
const n = new Intl.NumberFormat("ja-JP").format;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${n(Math.abs(v))}`;
const dateLabel = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "UTC" });
const { annual, residence } = data;
const first = annual[0];
const last = annual[annual.length - 1];
const rateLabel = (row: { foreign: number; total: number }) =>
  ((row.foreign / row.total) * 100).toFixed(2) + "％";
const { decomposition, indexSummary, yoySummary, nationalitySummary, nearbySummary } = analysis;
const china = nationalitySummary.categories.find((c) => c.name === "中国")!;
const other = nationalitySummary.categories.find((c) => c.name === "この5区分以外")!;
const vietnam = nationalitySummary.categories.find((c) => c.name === "ベトナム")!;
const nepal = nationalitySummary.categories.find((c) => c.name === "ネパール")!;
const myanmar = nationalitySummary.categories.find((c) => c.name === "ミャンマー")!;
const topTown = townMap.top10Increase[0];

const topics = [
  { id: "trend", label: "人口変化とペース", caption: "内訳・指数・停滞と再加速", Icon: BarChart3 },
  { id: "composition", label: "国籍・地域の広がり", caption: "寄与率と14年間の構成比", Icon: Globe2 },
  { id: "area-map", label: "市内の地域別地図", caption: "199町丁の変化と割合", Icon: Map },
  { id: "nearby", label: "近隣6市と在留資格", caption: "同日比較と2025年4月資料", Icon: MapPin },
];

export default function HachiojiInternationalPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: canonical,
    image,
    author: { "@type": "Organization", name: "bearworks.uk" },
    isBasedOn: sourceLinks.map(([url]) => url),
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PublicSiteHeader />
      <article className="mx-auto max-w-5xl space-y-12 text-base leading-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
          <div className="grid items-center gap-8 px-6 pb-8 pt-8 sm:px-10 sm:pt-12 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.15em] text-teal-200">
                八王子を数字で読み解く · 第6弾
              </p>
              <h1 className="mt-5 text-3xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.4]">
                八王子は国際的に<span className="block">なってきている？</span>
              </h1>
              <p className="mt-5 text-balance text-lg font-semibold text-amber-200 sm:text-2xl">
                外国人住民が増えた街を、数字と地図で見る
              </p>
              <p className="mt-5 text-slate-200">
                八王子に暮らす外国人住民は、この13年間でどれくらい増えたのでしょうか。住民基本台帳をもとに、日本人住民との対比、増え方のペース、出身地域の広がり、市内の地域差まで確かめます。
              </p>
              <p className="mt-5 text-xs leading-6 text-slate-300">
                住民基本台帳：2013～2026年の各10月1日 · 町丁別CSV：2024年4月末・2026年10月末 · 在留資格：2025年4月
              </p>
            </div>
            <figure className="min-w-0">
              <Image
                src={imagePath}
                width={1536}
                height={1024}
                alt={imageAlt}
                unoptimized
                preload
                className="h-auto w-full rounded-2xl"
              />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">
                AI生成イラスト。八王子の風景を参考に、架空の駅前広場を描いています。
              </figcaption>
            </figure>
          </div>
          <nav aria-label="記事の目次" className="grid border-t border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map(({ id, label, caption, Icon }) => (
              <a
                key={id}
                href={"#" + id}
                className="flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-0 hover:bg-white/10 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-teal-200 lg:border-b-0 lg:border-r"
              >
                <Icon size={26} aria-hidden="true" className="shrink-0 text-teal-200" />
                <span>
                  <span className="block text-sm font-bold">{label}</span>
                  <span className="block text-xs text-slate-300">{caption}</span>
                </span>
              </a>
            ))}
          </nav>
        </header>

        <section aria-labelledby="findings" className="space-y-5">
          <h2 id="findings" className={heading}>
            外国人住民は13年間で{n(decomposition.foreignDiff)}人増え、{indexSummary.foreignRatio}倍になった
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-950">
              <p className="text-sm font-bold">外国人住民</p>
              <p className="mt-2 text-3xl font-bold">
                {n(last.foreign)}
                <span className="ml-1 text-sm">人</span>
              </p>
              <p className="mt-2 text-sm">
                2013年の{indexSummary.foreignRatio}倍（年平均 +{indexSummary.foreignCagrPercent.toFixed(2)}％）
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-5 text-sky-950">
              <p className="text-sm font-bold">総人口に占める割合</p>
              <p className="mt-2 text-3xl font-bold">{rateLabel(last)}</p>
              <p className="mt-2 text-sm">2013年は{rateLabel(first)}（総人口 {n(last.total)}人）</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-950">
              <p className="text-sm font-bold">2025年4月の在留資格別</p>
              <p className="mt-2 text-3xl font-bold">{residence.groups[0].percent}％</p>
              <p className="mt-2 text-sm">市議会資料で「留学」に該当</p>
            </div>
          </div>
        </section>

        <section id="trend" className="scroll-mt-6 space-y-6">
          <h2 className={heading}>総人口はほぼ横ばい、でも中身が大きく動いた</h2>
          <p>
            2013年から2026年にかけて、八王子市の総人口は{n(first.total)}人から{n(last.total)}人へと
            {signed(decomposition.totalDiff)}人（{decomposition.totalChangePercent.toFixed(2)}％）で、一見すると大きく変わっていないように見えます。ところが内訳を見ると、日本人住民が{" "}
            <strong>{signed(decomposition.japaneseDiff)}人</strong>減った一方で、外国人住民が{" "}
            <strong>{signed(decomposition.foreignDiff)}人</strong>増えています。
          </p>

          <PopulationDecompositionChart analysis={analysis} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">内訳のグラフの読み方</h3>
            <p className="mt-2">
              赤い棒（日本人住民の減少）と緑の棒（外国人住民の増加）を足し合わせた結果が、右端の灰色の棒（総人口の変化）です。算数の上では、日本人住民の減少分の約7割（
              <strong>{decomposition.offsetRatioPercent.toFixed(1)}％</strong>）を外国人住民の増加が補う形になっており、「人口規模は大きく変わらないまま住民の構成が変わっている」ことが分かります。
            </p>
          </div>

          <h3 className={subheading}>増え方のスピードと「停滞期・再加速」</h3>
          <p>
            下のグラフでは、左上で人数・右上では割合の推移を、下段では「2013年＝100 指数」と「年ごとの増加人数」を切り替えられます。2013年を100とした指数で見ると、2026年の日本人住民が{" "}
            {indexSummary.series.at(-1)!.japaneseIndex.toFixed(1)}（年平均 {indexSummary.japaneseCagrPercent.toFixed(2)}％）なのに対し、外国人住民は{" "}
            <strong>{indexSummary.series.at(-1)!.foreignIndex.toFixed(1)}</strong>（年平均成長率 <strong>+{indexSummary.foreignCagrPercent.toFixed(2)}％</strong>）です。年平均成長率は「もし毎年同じ割合で増えたとしたら何％か」を示す目安です。
          </p>

          <InternationalTrendCharts analysis={analysis} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">増え方の波から分かること・分からないこと</h3>
            <p className="mt-2">
              「年ごとの増加人数」に切り替えると、増加のスピードがずっと一定ではなかったことがはっきり見えます。2014～2019年は年平均{" "}
              +{n(yoySummary.periods.pre2020.avgForeignDiff)}人ペースでしたが、2020年（−239人）・2021年（+17人）に一時足踏みしたあと、2022～2026年は年平均{" "}
              <strong>+{n(yoySummary.periods.post2022.avgForeignDiff)}人</strong>（コロナ前の約{" "}
              {yoySummary.periods.post2022.ratioToPre2020Avg.toFixed(1)}倍、最も多い{yoySummary.periods.post2022.maxYear}年は+
              {n(yoySummary.periods.post2022.maxDiff)}人）へとペースが上がりました。
            </p>
            <p className="mt-2">
              2020～2021年の停滞には出入国制限などの外部環境が考えられますが、住民基本台帳の人数表だけでは具体的な理由まで証明することはできません。また、直近の伸びをそのまま未来へ延ばして「今後何人で何万人になる」と予測することも控えます。
            </p>
          </div>
        </section>

        <section id="composition" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>増えた1万人超の中身：中国が最多のまま、出身地域が広がった</h2>
          <p>
            全14年間で同じ区分名で比較できる5つの国・地域と「この5区分以外」を比べると、増加した
            {n(decomposition.foreignDiff)}人のうち最も増えた人数が多いのは「{other.name}」（+{n(other.diff)}人・増加全体の{" "}
            {other.contributionPercent.toFixed(1)}％）、次いで中国（+{n(china.diff)}人・{china.contributionPercent.toFixed(1)}％）でした。中国は{n(china.from)}人から{n(china.to)}人に増えましたが、外国人住民全体に占める割合は{" "}
            {china.fromShare.toFixed(1)}％から{china.toShare.toFixed(1)}％へ下がっています。
          </p>

          <NationalityContributionCharts analysis={analysis} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">寄与率と100％積み上げグラフの読み方</h3>
            <p className="mt-2">
              「寄与率」とは、全体の増加（+{n(decomposition.foreignDiff)}人）のうち、その区分が何％分を占めたかを示す数字です。伸び率（倍率）で見るとベトナム（
              {vietnam.ratio.toFixed(1)}倍・+{n(vietnam.diff)}人）、ネパール（{nepal.ratio.toFixed(1)}倍・+{n(nepal.diff)}人）、ミャンマー（{myanmar.ratio.toFixed(1)}倍・+{n(myanmar.diff)}人）が急増しており、この3区分だけで増加全体の{" "}
              <strong>{nationalitySummary.threeEmerging.contributionPercent.toFixed(1)}％</strong>（+{n(nationalitySummary.threeEmerging.diffSum)}人）を担いました。
            </p>
            <p className="mt-2">
              「構成比の推移（100％）」タブを見ると、特定の1か国に偏っていた状態から複数の国・地域へ広がっている様子が読み取れます。ただし、国籍・地域の統計から個人の暮らしぶりや来日の目的を推測することはできません。
            </p>
          </div>
        </section>

        <section id="area-map" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>八王子のどの地域で増えた？―町丁別マップで見る</h2>
          <p>
            市全体の数字だけでなく、八王子市が公表している町丁別の住民基本台帳CSV（全{townMap.counts.totalTowns}町丁）と、国勢調査の統計用境界を重ねて地域ごとの違いを確認しました。2024年4月末から2026年10月末の約2年半で、市全体（月末集計）では{" "}
            {n(townMap.cityTotals.from.foreign)}人（{townMap.cityTotals.from.share.toFixed(2)}％）から{" "}
            {n(townMap.cityTotals.to.foreign)}人（{townMap.cityTotals.to.share.toFixed(2)}％）に増えています。
          </p>

          <TownForeignMap townMap={townMap} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">地図の読み方とプライバシー・比較上の注意</h3>
            <p className="mt-2">
              面積が広い町丁は人数が少なくても色が目立ちやすいため、この地図では「その町丁の総人口に占める外国人住民の割合」と、2時点での「ポイント差（割合が何％ポイント動いたか）」を主指標にしています。比較可能な{" "}
              {townMap.counts.comparableTowns}町丁では、{topTown.name}（+{topTown.sharePointDiff!.toFixed(2)}pt）や明神町、追分町、滝山町周辺など、駅周辺や市街地・大学に近い地域で割合の上昇や人数の増加が目立ちますが、地域によって増減の向きは異なります。
            </p>
            <p className="mt-2">
              なお、外国人住民が10人未満または総人口が100人未満の{townMap.counts.suppressedTowns}町丁は、少人数による誤差の振れとプライバシーへの配慮から個別数値を非表示にしています。また、2024年8月の区画整理で住所変更があった4町丁（上野町・小門町・台町３丁目・台町４丁目）も前後比較の対象から外しています。町丁別の国籍データも公表されていません。
            </p>
          </div>
        </section>

        <section id="nearby" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>人数と割合で、近隣市との違いを見る</h2>
          <p>
            同じ2026年10月1日の住民基本台帳で近隣6市を比べると、外国人住民の人数では八王子市（{n(last.foreign)}人）が最多、総人口に占める割合では立川市（
            {nearbySummary.cities.find((c) => c.code === "13202")!.share.toFixed(2)}％）が八王子市（{rateLabel(last)}）をわずかに上回りました。6市の割合の中央値（真ん中の値）は{" "}
            <strong>{nearbySummary.medianShare.toFixed(2)}％</strong>で、八王子市と立川市・青梅市がこれを上回っています。
          </p>

          <NearbyCitiesScatterChart analysis={analysis} />

          <p className="text-sm text-slate-600">
            同じ6市でも総人口が12万人台から55万人台まで異なるため、人数順と割合順では見え方が変わります。この表は6市の同日比較に限ったもので、都内や全国の順位を一般化するものではありません。
          </p>
        </section>

        <section id="residence" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>在留資格から見える「留学」と「永住者」</h2>
          <p>
            八王子市議会の資料では、2025年4月時点の在留資格で「留学」と「永住者」の割合が近くなっています。
          </p>
          <figure className={card}>
            <figcaption className="font-bold text-slate-900">市議会資料に掲載された在留資格のうち3区分</figcaption>
            <p className="text-xs text-slate-600">{residence.period} · 公表値 · 棒の全幅は100％</p>
            <ul className="mt-4 space-y-4 text-sm leading-6">
              {residence.groups.map(({ name, percent }) => (
                <li key={name}>
                  <p className="flex justify-between gap-3">
                    <span>{name}</span>
                    <strong className="shrink-0 tabular-nums">{percent}％</strong>
                  </p>
                  <div className="h-3 rounded bg-slate-100" aria-hidden="true">
                    <div className="h-3 rounded bg-amber-700" style={{ width: percent + "%" }} />
                  </div>
                </li>
              ))}
            </ul>
          </figure>
          <p>
            在留資格の「留学」には、大学だけでなく日本語教育機関などで学ぶ人も含まれ得ます。
            <Link href={previous} className={linkClass}>
              第5弾のキャンパス学生数
            </Link>
            は市内の大学・短大・高専で学ぶ人を数えた別の統計です。対象と時点が違うため、二つの人数を使って留学生の割合を計算することはできません。
          </p>
        </section>

        <section aria-labelledby="conclusion" className="space-y-5">
          <h2 id="conclusion" className={heading}>数字から見える変化と、暮らしを知るために必要なこと</h2>
          <p>
            住民基本台帳の数字を追うと、八王子市では日本人住民が減るなかで外国人住民が13年間で2倍以上に増え、2022年以降に増加ペースが上がったこと、中国だけでなくベトナム・ネパール・ミャンマーなどへ出身地域が広がっていること、市内でも地域によって割合の変化に濃淡があることが確かめられました。
          </p>
          <p>
            一方で、人口統計だけから「街の国際交流がどれだけ進んだか」や「暮らしやすさがどう変わったか」を結論づけることはできません。市は多言語での案内や相談窓口を設けており、住民同士の交流や行政サービスの使われ方を知るには、人口数に加えて別の調査が必要です。
          </p>
        </section>

        <section id="method" className={card + " space-y-4"}>
          <h2 className={heading}>調査方法・分析の限界・出典</h2>
          <p className="text-sm leading-7">
            時系列と近隣6市の比較は、東京都の住民基本台帳（各年10月1日現在）を使い、外国人人口を総人口（日本人＋外国人）で割って割合を算出しました。2012年に外国人の集計制度が切り替わったため、2013年以降を比較対象としています。年平均成長率は13年間の幾何平均、寄与率は2013→2026年の総増加数（+10,964人）に対する各区分の増加数の割合です。
          </p>
          <p className="text-sm leading-7">
            国籍・地域別の原表は上位掲載の区分が年によって変わります。全14年に同名で掲載された5区分を採用し、残りを総数から再計算しました。町丁別地図は八王子市公表の各月末CSV（2024年4月末・2026年10月末、CC BY 4.0）を e-Stat「令和2年国勢調査 町丁・字等境界データ」と全199町丁で照合・加工しています。取得日 {dateLabel.format(new Date(data.retrievedOn))}（地図・分析データ生成日 {townMap.generatedOn}）。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            {sourceLinks.map(([href, label]) => (
              <li key={href}>
                <a href={href} className={linkClass}>
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a href={dataPath} className={linkClass}>
                集計データと各年の出典（JSON）
              </a>
            </li>
            <li>
              <a href="/data/hachioji-international/analysis.json" className={linkClass}>
                統計指標の検算結果（JSON）
              </a>
            </li>
            <li>
              <a href="/data/hachioji-international/town-map.json" className={linkClass}>
                町丁別地図データ（JSON）
              </a>
            </li>
          </ul>
        </section>

        <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-2">
          <Link href={previous} className={card + " hover:bg-teal-50"}>
            <span className="block text-xs font-bold text-teal-800">前回・第5弾</span>
            <span className="mt-2 block font-semibold text-slate-900">八王子はまだ学生の街？ →</span>
          </Link>
          <Link href="/labs" className={card + " hover:bg-teal-50"}>
            <span className="font-semibold text-teal-900">Labsの記事一覧へ →</span>
          </Link>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
