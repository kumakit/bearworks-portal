import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, CloudRain, Flame, Snowflake, Sun, Thermometer, Wind } from "lucide-react";
import Link from "@/components/InternalLink";
import ContentProvenance from "@/components/ContentProvenance";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  ConditionComparisonChart, HourlyProfileChart,
  MorningGapCalendarHeatmap, MorningGapDistributionChart,
  WinterDiurnalRangeBoxPlot,
} from "@/components/ChillCharts";
import { hachiojiChillProvenance } from "@/lib/content-provenance";
import {
  chillBundle, chillLock, fmt, representativeCases, signed, summary,
} from "@/lib/hachioji-chill-publication";

const canonicalUrl = "https://bearworks.uk/labs/hachioji-chill";
const title = "八王子の朝はなぜ寒い？ ―― 冬の冷え込みと放射冷却をデータで検証する";
const card = "min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description:
    "八王子と東京都心の冬の気温を気象庁データ（2014-2026年・12シーズン・1,078日分）で比較。朝7時の気温差中央値−3.4℃、24時間の時間構造、日較差、放射冷却条件（静穏・非降水）との関係を統計検定2級の視点で検証します。",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title,
    description: "八王子の朝はなぜ都心より寒いのか？ 24時間の気温推移と放射冷却条件を実測データで検証。",
    siteName: "bearworks.uk",
  },
};

const quizzes = [
  {
    title: "朝7時の気温差、平均値ではなく「中央値」を使う理由は？",
    question:
      "12シーズン・1,078日の朝7時差は、中央値−3.4℃、平均値−3.3℃、最大差−10.1℃でした。冷え込みの代表値として中央値を優先する理由は何でしょうか。",
    answer:
      "気象データには南岸低気圧や強烈な寒波のような極端な外れ値が含まれやすく、分布が完全な左右対称（正規分布）にならないためです。平均値は外れ値の影響を強く受けますが、中央値は順位に基づく頑健（ロバスト）な統計量であり、典型的な朝の実感をより正確に表します。本記事では両方の数値を併記し、透明性を担保しています。",
  },
  {
    title: "雲量の直接観測がなくても、「放射冷却」を検証できるか？",
    question:
      "アメダス八王子では雲量や赤外放射量の観測がありません。このとき「放射冷却」をどう実証的に扱えばよいでしょうか。",
    answer:
      "直接測定できない潜在変数（放射冷却の強度）に対し、理論的に連動する観測可能な変数（夜間の平均風速、降水の有無、前日の日照）を「代理指標（Proxy）」として設定します。ただし、代理指標による分析は『放射冷却が強まりやすい条件と気温差の対応関係』を示すものであり、『放射冷却が○℃分の原因である』という因果分解を証明したわけではないという制約を明示することが統計的に誠実な態度です。",
  },
  {
    title: "朝7時に3℃低かったら、昼14時も3℃低いと言えるか？",
    question:
      "八王子の朝7時の気温が都心より3℃低かったとします。この日、昼14時の気温も都心より3℃低いと推測してよいでしょうか。",
    answer:
      "推測できません。実測データが示す通り、八王子と都心の気温差は夜間から明け方に最大（中央値−3.3〜−3.4℃）となり、日中には−0.2〜−0.5℃程度まで急縮小します。時刻ごとの地点間差には強い日周変動（日変化）があり、ある一時点の差を1日全体に外挿することはできません。この時間構造こそが、八王子の大きな日較差を生み出しています。",
  },
  {
    title: "静穏な朝に気温差が広がった。原因は放射冷却だけで確定？",
    question:
      "夜間風速1.5m/s未満の静穏日に朝7時の気温差が大きく拡大しました。「この差の要因は100%放射冷却によるものだ」と結論づけてよいでしょうか。",
    answer:
      "結論づけられません。静穏時には地表の放射冷却が促進されるだけでなく、盆地地形による冷気の滞留（冷気湖）や山風の影響も同時に起きやすくなります。さらに東京都心側では人工排熱や高比熱アスファルトによる夜間冷却阻害（ヒートアイランド現象）が起きています。複数の物理メカニズムが同一条件下で複合的に作用するため、単一の要因にすべてを帰定することはできません。",
  },
  {
    title: "アメダス八王子の観測値は、八王子市全域を代表しているか？",
    question:
      "八王子観測地点のデータが氷点下を示しているとき、「八王子市全体が同じ気温である」とみなしてよいでしょうか。",
    answer:
      "みなせません。アメダス八王子観測所は浅川沿いの市街地低地（標高123m）に位置しています。八王子市は高尾山系（標高599m）から多摩丘陵、谷戸地形まで多様な起伏を含んでおり、標高・斜面・森林被覆・谷底か尾根かによって局地気候（ミクロ気候）が大きく異なります。観測値は特定地点の露場環境を代表するものであり、市全域の均一な気温ではないことを意識する必要があります。",
  },
];

function Lesson({ title: lessonTitle, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
      <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
      <h3 className="mt-2 text-lg font-bold text-indigo-950">{lessonTitle}</h3>
      <div className="mt-3 space-y-3 text-sm leading-7 text-indigo-950">{children}</div>
    </aside>
  );
}

export default function HachiojiChillPage() {
  const m7 = summary.morning_7am;
  const dRange = summary.diurnal_range_winter;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: "2026-09-18",
    dateModified: "2026-09-18",
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk", url: "https://bearworks.uk" },
    isBasedOn: chillBundle.attribution.source_url,
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />

      <article className="space-y-10 leading-relaxed">
        {/* Header / Hero */}
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-7 md:p-12 shadow-xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold tracking-widest text-cyan-300">街のうわさを、統計でほどく · 04</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              八王子の朝は、<br />
              なぜ寒い？<br />
              <span className="text-cyan-300">冬の冷え込みをデータで解く。</span>
            </h1>
            <p className="mt-6 text-xl font-semibold text-slate-100">
              冬の明け方の気温差と、日較差・放射冷却の構造
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              冬の朝、八王子駅に降り立つと都心より明らかに寒く感じる――。生活実感としてよく語られるこの「朝の寒さ」は、実際に何℃違い、1日のいつ生まれ、どんな気象条件で強まるのでしょうか。気象庁の12シーズン・1,078日分の実測データから、その時間構造とメカニズムを検証します。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-cyan-200">
              <span className="inline-flex items-center gap-1.5">
                <Snowflake size={16} /> 冬季12シーズン（2014-2026年）
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Thermometer size={16} /> 計25,920観測点の実測ペア
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wind size={16} /> 夜間風速・降水条件分析
              </span>
            </div>
          </div>
        </header>

        {/* Section 1: KPI Summary */}
        <section id="summary" className={card} aria-labelledby="summary-heading">
          <p className="text-sm font-bold text-cyan-700">まず、データから言えること</p>
          <h2 id="summary-heading" className={`${heading} mt-2`}>
            朝は都心より約3.4℃低く、昼には差がほぼ消える。
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            2014年12月〜2026年2月の冬季12シーズン（1,078日）の実測値を比較した結果、八王子は冬の朝の**96.5%**で東京都心より低温であり、朝7時の気温差中央値は**−3.4℃**に達していました。しかし、この大きな気温差は日中まで持続せず、昼14時には**−0.4℃**まで縮小します。
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-blue-50 p-5 text-blue-950 border border-blue-100">
              <span className="text-xs font-bold text-blue-800">朝7時の気温差（中央値）</span>
              <p className="mt-2 text-4xl font-bold tabular-nums text-blue-950">
                {signed(m7.median_gap)}
                <span className="ml-1 text-sm font-normal">℃</span>
              </p>
              <p className="mt-2 text-xs text-blue-800">平均 {signed(m7.mean_gap)}℃ · 四分位範囲 −4.5〜−2.0℃</p>
              <p className="mt-3 text-[11px] text-slate-500">八王子が都心より低い朝：{m7.pct_hachioji_colder}%</p>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-5 text-indigo-950 border border-indigo-100">
              <span className="text-xs font-bold text-indigo-800">3℃以上八王子が低い日</span>
              <p className="mt-2 text-4xl font-bold tabular-nums text-indigo-950">
                {m7.pct_gap_le_minus3}
                <span className="ml-1 text-sm font-normal">%</span>
              </p>
              <p className="mt-2 text-xs text-indigo-800">5℃以上低い朝：{m7.pct_gap_le_minus5}%</p>
              <p className="mt-3 text-[11px] text-slate-500">冬の朝の約6割で3℃以上の差が開く</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <span className="text-xs font-bold text-cyan-300">昼14時の気温差（中央値）</span>
              <p className="mt-2 text-4xl font-bold tabular-nums text-cyan-300">
                {signed(summary.afternoon_14pm.median_gap)}
                <span className="ml-1 text-sm font-normal">℃</span>
              </p>
              <p className="mt-2 text-xs text-slate-300">昼間は都心とほぼ同等の気温</p>
              <p className="mt-3 text-[11px] text-slate-400">朝の冷え込みが日中まで続くわけではない</p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-5 text-orange-950 border border-orange-100">
              <span className="text-xs font-bold text-orange-800">冬季の日較差（36年中央値）</span>
              <p className="mt-2 text-4xl font-bold tabular-nums text-orange-950">
                +{fmt(dRange.difference_median)}
                <span className="ml-1 text-sm font-normal">℃大</span>
              </p>
              <p className="mt-2 text-xs text-orange-800">八王子 11.5℃ vs 都心 7.4℃</p>
              <p className="mt-3 text-[11px] text-slate-500">朝冷え・昼並みのため寒暖差が顕著</p>
            </div>
          </div>
        </section>

        {/* Section 2: Hourly Profile */}
        <section id="hourly-profile" className={card} aria-labelledby="hourly-heading">
          <p className="text-sm font-bold text-cyan-700">01 · 時間構造の分析</p>
          <h2 id="hourly-heading" className={`${heading} mt-2`}>
            何時に差が広がり、何時に縮まるのか？
          </h2>
          <p className="mt-4 leading-relaxed">
            八王子と東京都心の気温差は、終日一様に存在するわけではありません。冬の24時間の気温推移を調べると、日没後の18時頃から徐々に地点間差が拡大し始め、深夜から日の出直後の**早朝4〜7時にかけて最も差が大きく（中央値−3.3〜−3.4℃差）**なります。
          </p>
          <p className="mt-3 leading-relaxed">
            しかし、日が昇って日射が始まると状況は一変します。午前8時から急激に差が縮まり、**正午から15時にかけては都心と八王子の気温差はわずか0.2〜0.5℃**にまで縮小します。
          </p>

          <div className="mt-6">
            <HourlyProfileChart />
          </div>

          <div className="mt-6">
            <Lesson title="一時点の差を、1日全体に外挿しない">
              <p>
                「八王子の朝は都心より3〜4℃寒い」という事実から、「八王子は日中も3〜4℃寒いに違いない」と推論することは誤りです。
              </p>
              <p>
                気温差は時間帯に依存する条件付き分布を持っています。通勤通学時の「朝の極端な寒さ」の実感と、日中の「日差しがあれば都心と大差ない暖かさ」の両立は、この24時間の時間構造によって統計的に説明されます。
              </p>
            </Lesson>
          </div>
        </section>

        {/* Section 3: Distribution at 7am */}
        <section id="distribution" className={card} aria-labelledby="distribution-heading">
          <p className="text-sm font-bold text-cyan-700">02 · 朝の気温差のばらつき</p>
          <h2 id="distribution-heading" className={`${heading} mt-2`}>
            朝7時、実際に何℃違う日が多いのか？
          </h2>
          <p className="mt-4 leading-relaxed">
            通勤・通学時間帯である朝7時における気温差（八王子 − 東京都心）の頻度分布を見ると、最頻値（最も多い階級）は**−3〜−4℃低い朝（24.1%）**です。
          </p>
          <p className="mt-3 leading-relaxed">
            全1,078日中、八王子が都心より寒かった朝は**96.5%（1,040日）**に達しており、都心と同温または暖かい朝（0℃以上）はわずか3.5%（38日）しかありませんでした。また、約5日に1日（18.5%）は**5℃以上も低い強烈な冷え込み**を記録しています。
          </p>

          <div className="mt-6">
            <MorningGapDistributionChart />
          </div>

          <div className="mt-6">
            <Lesson title="代表値の選択：平均値と中央値の使い分け">
              <p>
                朝7時差の分布は左右対称ではなく、左側（低温側）に裾が長く伸びています。南岸低気圧大雪後の快晴など、稀に−8℃〜−10℃という極端な外れ値が発生するためです。
              </p>
              <p>
                外れ値を含む歪んだ分布では、全データを足して割る算術平均（−3.3℃）よりも、順位の中央に位置する中央値（−3.4℃）のほうが「通常の冬の朝の典型的な体感」を歪みなく捉えることができます。
              </p>
            </Lesson>
          </div>
        </section>

        {/* Section 4: Calendar Heatmap */}
        <section id="calendar" className={card} aria-labelledby="calendar-heading">
          <p className="text-sm font-bold text-cyan-700">03 · 日々の冷え込みの推移</p>
          <h2 id="calendar-heading" className={`${heading} mt-2`}>
            朝7時の気温差カレンダー
          </h2>
          <p className="mt-4 leading-relaxed">
            冬の3ヶ月間（12月・1月・2月）を通じて、地点間の気温差はどのように推移しているのでしょうか。近年の冬季シーズンごとの日別朝7時気温差をヒートマップで可視化しました。
          </p>
          <p className="mt-3 leading-relaxed">
            濃い青色のセル（−4.5℃〜−6℃以下）が何日も連続して帯状に現れる時期（冬型の気圧配置が安定し晴天が続いた時期）と、急に水色やオレンジ色になって差が消える日（低気圧通過や雨の日）のコントラストが明瞭に確認できます。
          </p>

          <div className="mt-6">
            <MorningGapCalendarHeatmap />
          </div>
        </section>

        {/* Section 5: Diurnal Range */}
        <section id="diurnal-range" className={card} aria-labelledby="diurnal-heading">
          <p className="text-sm font-bold text-cyan-700">04 · 寒暖差の比較</p>
          <h2 id="diurnal-heading" className={`${heading} mt-2`}>
            八王子は日較差（1日の寒暖差）も大きい
          </h2>
          <p className="mt-4 leading-relaxed">
            「朝は都心より4℃近く低いが、昼は都心とほぼ同じ」という時間構造は、1日の中での気温の振れ幅（日較差 = 日最高気温 − 日最低気温）に直結します。
          </p>
          <p className="mt-3 leading-relaxed">
            1990年から2025年までの36年間（35冬季シーズン）の冬季集計データを比較すると、東京都心の日較差中央値が**7.4℃**であるのに対し、八王子は**11.5℃**に達し、八王子の方が**4.1℃も寒暖差が大きい**ことがわかります。近隣の青梅（11.6℃）や府中（10.7℃）と比較しても、多摩地域特有の大きな日較差が際立っています。
          </p>

          <div className="mt-6">
            <WinterDiurnalRangeBoxPlot />
          </div>

          <div className="mt-6">
            <Lesson title="「最低気温の低さ」と「日較差の大きさ」の独立性">
              <p>
                「日最低気温が低い地域」が必ずしも「日較差が大きい地域」になるとは限りません。例えば、寒冷地であっても昼間も一貫して気温が上がらなければ、日較差は小さくなります。
              </p>
              <p>
                八王子の特徴は、「冬の晴天率が高く昼は日射でしっかり暖まる」一方で「夜間から早朝にかけて急速に熱が逃げて底冷えする」という両面性にあるため、日較差が極めて大きくなります。2つの変数の関係を分解して把握することが重要です。
              </p>
            </Lesson>
          </div>
        </section>

        {/* Section 6: Radiation Cooling & Conditions */}
        <section id="mechanism" className={card} aria-labelledby="mechanism-heading">
          <p className="text-sm font-bold text-cyan-700">05 · 冷え込みの条件</p>
          <h2 id="mechanism-heading" className={`${heading} mt-2`}>
            放射冷却が強まりやすい条件と、冷え込みの対応関係
          </h2>
          <p className="mt-4 leading-relaxed">
            なぜ八王子の朝はこれほど冷え込むのでしょうか。一般に気象学では、以下の3つの要因が重なるときに局地的な冷え込み（放射冷却現象）が最大化すると説明されます：
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="font-bold text-slate-900 block">① 晴天（雲がない）</span>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                地表から宇宙空間へ向けて放出される赤外線（長波放射）を遮る雲がないため、熱が急速に逃げる。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="font-bold text-slate-900 block">② 静穏（風が弱い）</span>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                風による上下の大気混合が起きず、地表付近の冷気がその場に滞留して冷却が進む。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="font-bold text-slate-900 block">③ 盆地・谷底地形</span>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                周囲の丘陵・山地で冷やされた重い空気が斜面を滑り降り、低地に溜まる（冷気湖の形成）。
              </p>
            </div>
          </div>

          <p className="mt-5 leading-relaxed">
            実測データにおいて、このメカニズムに対応する関係が見られるかを検証するため、夜間（0〜6時）の平均風速と降水有無によって朝7時の気温差を分類しました。
          </p>

          <div className="mt-6">
            <ConditionComparisonChart />
          </div>

          <p className="mt-5 leading-relaxed">
            分析の結果、夜間に風速1.5m/s未満の静穏状態かつ非降水の日は、朝7時差の中央値が**−3.4℃**、3℃以上低い日が**62.4%**に達しました。一方、夜間に風速2.5m/s以上の強風が吹いた日は差の中央値が**−2.4℃**に縮小し、さらに雲に覆われ雨や雪が降った日は中央値**−0.7℃**、3℃以上低い日はわずか**8.6%**にとどまりました。
          </p>

          <div className="mt-6">
            <Lesson title="観測事実と気象メカニズムの区別">
              <p>
                本検証で直接確認できたのは、**「夜間静穏・非降水という放射冷却が強まりやすい条件下で、八王子と都心の朝の気温差が顕著に拡大する」という統計的な対応関係**です。
              </p>
              <p>
                「八王子の気温低下のうち、放射冷却が何℃分で、盆地地形が何℃分、都心のヒートアイランドによる保温が何℃分か」といった因果関係の数値的分解は、アメダスの地上観測値だけからは確定できません。理論モデルの説明と、実測データから直接導かれた事実を混同しないことが不可欠です。
              </p>
            </Lesson>
          </div>
        </section>

        {/* Section 7: Case Studies */}
        <section id="cases" className={card} aria-labelledby="cases-heading">
          <p className="text-sm font-bold text-cyan-700">06 · 特徴的な事例</p>
          <h2 id="cases-heading" className={`${heading} mt-2`}>
            実測データから見る、特徴的な3つの朝
          </h2>
          <p className="mt-4 leading-relaxed">
            12シーズンの全記録から、典型的な放射冷却の朝、積雪が加わった極端事例、そして雲に覆われて差が消えた朝の3事例をピックアップしました。
          </p>

          <div className="mt-6 space-y-4">
            {representativeCases.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {c.condition}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
                  <span className="text-orange-800 font-bold">八王子（7時）: {fmt(c.hachioji_7am)}℃</span>
                  <span className="text-blue-800 font-bold">東京都心（7時）: {fmt(c.tokyo_7am)}℃</span>
                  <span className="text-indigo-900 font-bold">地点間差: {signed(c.delta_7am)}℃</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Quizzes */}
        <section id="quizzes" className={card} aria-labelledby="quizzes-heading">
          <p className="text-sm font-bold text-cyan-700">07 · 理解度チェック</p>
          <h2 id="quizzes-heading" className={`${heading} mt-2`}>
            確認問題5問 ―― 統計検定2級の視点で読む
          </h2>
          <p className="mt-4 leading-relaxed">
            気象データを正しく読み解き、日常の会話やニュースの背後にある統計的落とし穴に気づくための確認問題です。各問題をクリックして解説を確認してください。
          </p>

          <div className="mt-6 space-y-3">
            {quizzes.map((q, idx) => (
              <details key={idx} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors open:bg-white open:shadow-sm">
                <summary className="cursor-pointer list-none font-bold text-slate-900 flex items-center justify-between">
                  <span>
                    問{idx + 1}: {q.title}
                  </span>
                  <span className="text-xs text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-slate-700 font-medium">{q.question}</p>
                <div className="mt-3 rounded-xl bg-indigo-50/70 p-4 text-xs sm:text-sm leading-6 text-indigo-950 border border-indigo-100">
                  <span className="font-bold block mb-1">【解説】</span>
                  {q.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Section 9: Methodology & Limits */}
        <section id="methodology" className={card} aria-labelledby="methodology-heading">
          <p className="text-sm font-bold text-slate-500">方法論・データソース・分析上の限界</p>
          <h2 id="methodology-heading" className="text-xl font-bold text-slate-900 mt-2">
            データ作成仕様と制約
          </h2>
          <div className="mt-4 space-y-3 text-xs leading-6 text-slate-600">
            <p>
              <strong>一次データ出典：</strong> 気象庁（JMA）「過去の気象データ・ダウンロード」より取得したアメダス八王子（地点記号 a0366, block 0366）および気象官署東京（地点記号 s47662, block 47662）の1時間値観測データ。
            </p>
            <p>
              <strong>対象期間と均質性：</strong> 東京観測所は2014年12月2日に大手町から北の丸公園へ移転しました。観測環境の同一性を確保するため、1時間値の比較対象期間は移転完了直後の2014年12月1日から2026年2月28日までの冬季（12月〜2月、計12シーズン・1,078日）を採用しています。長期の日較差比較（36年間）については、既存の検証済み固定データ（1990〜2025年）を参照しています。
            </p>
            <p>
              <strong>品質フラグと欠測処理：</strong> 気象庁の品質情報フラグが8（正常値）または5（準正常値）のペアのみを集計に採用しています。欠測値や疑わしい値を0℃や平均値で埋める補完は一切行っていません。
            </p>
            <p>
              <strong>「東京都心」の定義：</strong> 本記事における「東京都心」は、気象庁「東京」観測地点（北の丸公園）の実測値を指し、東京23区全体や特定駅前の平均値を意味するものではありません。
            </p>
            <p>
              <strong>分析上の限界と制約：</strong> アメダス八王子では日照時間・風速・降水量は観測されていますが、雲量・湿度・赤外放射量は観測項目に含まれません。そのため、本分析では夜間風速と降水有無を放射冷却の代理指標として用いており、放射収支の直接測定や街区レベルのヒートアイランド因果分解は行っていません。
            </p>

            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-900">
                固定データ・バンドル検証情報（再現性・SHA-256）
              </summary>
              <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-600">
                <p>ファイル名: {chillLock.bundle_file}</p>
                <p>バージョン: {chillLock.bundle_version}</p>
                <p>ファイルサイズ: {chillLock.bundle_byte_size.toLocaleString()} bytes</p>
                <p className="break-all">SHA-256: {chillLock.bundle_sha256}</p>
                <p>生成日時: {chillLock.generated_at}</p>
                <p className="font-sans text-slate-500 pt-1">
                  ※本データは `scripts/validate-hachioji-chill-bundle.mjs` により毎ビルド時にハッシュと生データからの集計値が独立検証（fail-closed）されます。
                </p>
              </div>
            </details>
          </div>
        </section>

        {/* Section 10: Content Provenance */}
        <ContentProvenance provenance={hachiojiChillProvenance} />

        {/* Section 11: Series Navigation */}
        <nav aria-label="八王子気候データ分析シリーズ" className={card}>
          <p className="text-xs font-bold tracking-wider text-slate-400">SERIES</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">街のうわさを、統計でほどく</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/labs/hachioji-climate"
              className="group rounded-2xl border border-slate-200 p-4 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>01 · 気候基礎</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">八王子の気候検証</h3>
              <p className="mt-1 text-xs text-slate-500">夏暑く冬寒い？36年分の気温データを徹底検証</p>
            </Link>

            <Link
              href="/labs/hachioji-snow"
              className="group rounded-2xl border border-slate-200 p-4 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>02 · 降雪・雪中継</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">八王子の雪検証</h3>
              <p className="mt-1 text-xs text-slate-500">南岸低気圧でなぜ雪中継の舞台になるのか？</p>
            </Link>

            <Link
              href="/labs/hachioji-heat"
              className="group rounded-2xl border border-slate-200 p-4 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>03 · 猛暑と夜間冷却</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">八王子の夏検証</h3>
              <p className="mt-1 text-xs text-slate-500">昼は猛暑、夜は涼しい？都心ヒートアイランド比較</p>
            </Link>

            <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-white">
              <span className="text-xs text-cyan-300 font-bold">04 · 冬の朝と放射冷却（本記事）</span>
              <h3 className="mt-2 text-sm font-bold">八王子の朝検証</h3>
              <p className="mt-1 text-xs text-slate-300">朝7時の気温差と24時間の時間構造をデータで検証</p>
            </div>
          </div>
        </nav>

        {/* Section 12: Learning Link (Toukei CTA) */}
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-700 tracking-wider">STATISTICAL LEARNING</p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                実データで学ぶ、統計検定2級の思考法
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                中央値と平均値の使い分け、代理指標（Proxy）の限界、時間構造と外挿の誤謬など、気象データ分析で使われた統計概念を体系的に学べます。
              </p>
            </div>
            <Link
              href="/toukei"
              className="inline-flex items-center justify-center gap-2 shrink-0 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <span>統計検定2級 ガイド＆問題演習へ</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </article>

      <PublicSiteFooter />
    </main>
  );
}
