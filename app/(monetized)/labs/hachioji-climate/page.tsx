import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Moon, Snowflake, Sun } from "lucide-react";
import Link from "@/components/InternalLink";
import ContentProvenance from "@/components/ContentProvenance";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { AnnualHeatChart, RecentClimateBars, SeasonalRangeCharts, SegmentComparison } from "@/components/ClimateCharts";
import { hachiojiClimateProvenance } from "@/lib/content-provenance";
import { climateBundle, climateLock, deltaRange, recentAnnualRows, recentStationSummaries } from "@/lib/hachioji-climate-publication";

const canonicalUrl = "https://bearworks.uk/labs/hachioji-climate";
const title = "八王子は本当に夏暑く、冬寒いのか";
const card = "rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";
const format = (value: number) => value.toFixed(1);

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description: "八王子は夏暑く、冬寒い？ 気象庁の4地点データをグラフで比較。平均・中央値・ばらつき・仮説検証を、統計検定2級の視点と5つの確認問題で読み解きます。",
  alternates: { canonical: canonicalUrl },
  openGraph: { type: "article", url: canonicalUrl, title, description: "昼の暑さと夜の涼しさ。4地点の気象データを、統計でほどく。", siteName: "bearworks.uk", images: ["/images/hachioji-climate/hero-illustration.webp"] },
};

const hypotheses = [
  { id: "H1", title: "昼の厳しい暑さは東京都心より多い", direction: "猛暑日：八王子 − 東京都心", unit: "日/年", threshold: "猛暑日の区間平均が、東京都心より年1日以上多い。" },
  { id: "H2", title: "最低気温25℃以上の日は東京都心より少ない", direction: "最低25℃以上：東京都心 − 八王子", unit: "日/年", threshold: "日最低気温25℃以上の日の区間平均が、東京都心より年5日以上少ない。" },
  { id: "H3", title: "冬日は東京都心より大幅に多い", direction: "冬日：八王子 − 東京都心", unit: "日/年", threshold: "冬日の区間平均が、東京都心より年10日以上多い。" },
  { id: "H4", title: "4地点で最も寒いとは限らない", direction: "冬日：青梅 − 八王子", unit: "日/年", threshold: "青梅の冬日が八王子以上で、八王子を厳密に上回る地点もある。" },
  { id: "H5", title: "夏も冬も、昼夜の気温差が大きい", direction: "季節別の日較差中央値の区間平均：八王子 − 東京都心", unit: "℃", threshold: "夏・冬とも、日較差中央値の区間平均が東京都心より1℃以上大きい。" },
];

const quizzes = [
  { title: "平均23.7日なら、毎年24日くらい？", question: "八王子の2020〜2025年の猛暑日は、19、5、17、23、32、46日。平均だけで、毎年ほぼ同じ暑さだったと言えますか。", answer: "言えません。合計142日 ÷ 6年 ≈ 23.7日ですが、最小5日・最大46日です。平均は中心を要約し、散らばりは別に確認します。中央値は並べ替えた中央の19日と23日の平均で、21日です。" },
  { title: "中央値を平均すれば、全日をまとめた中央値？", question: "学習用の仮想例です。ある年の日較差が［1, 2, 10］℃、別の年が［3, 4, 5］℃でした。各年の中央値の平均と、6日をまとめた中央値は一致しますか。", answer: "一致しません。各年の中央値は2℃と4℃なので、その平均は3℃です。全6日を並べると［1, 2, 3, 4, 5, 10］℃で、中央値は (3 + 4) ÷ 2 = 3.5℃。集計の順序が違うため、一般には同じ値ではありません。" },
  { title: "「3.0〜5.8日」は95%信頼区間？", question: "この記事の「猛暑日は東京都心より年3.0〜5.8日多い」という範囲は、母平均差の95%信頼区間でしょうか。", answer: "違います。比較可能な4区間の平均差のうち、最小と最大を示した記述的な範囲です。標本抽出の不確実性を評価した信頼区間ではありません。" },
  { title: "5つの仮説を支持。p < 0.05という意味？", question: "今回のH1〜H5がすべて「支持」なら、統計的に有意な差が確認できたと言えますか。", answer: "言えません。今回は事前に決めた差の大きさ・品質・比較区間の条件を満たすかを確認しました。有意差検定は実施していません。検定や信頼区間を使うなら、対象母集団、標本の取り方、独立性などを別途検討します。" },
  { title: "4地点の比較で、多摩全域の一番が決まる？", question: "今回の4地点で冬日が最も多い地点を、そのまま「多摩全域で最も寒い場所」と呼べますか。", answer: "呼べません。4観測地点は多摩全域の無作為標本ではなく、市内でも標高や周辺環境は異なります。「寒い」の定義も冬日・最低気温・体感で変わります。比較対象と指標を限定して結論を述べます。" },
];

function Lesson({ title: lessonTitle, children }: { title: string; children: ReactNode }) {
  return <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6"><p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p><h3 className="mt-2 text-lg font-bold text-indigo-950">{lessonTitle}</h3><div className="mt-3 space-y-3 text-sm leading-7 text-indigo-950">{children}</div></aside>;
}

export default function HachiojiClimatePage() {
  const qualityCounts = climateBundle.warnings.find(warning => warning.code === "semi_normal_values_included")?.counts_by_station;
  const hachioji = recentStationSummaries.find(row => row.key === "hachioji")!;
  const tokyo = recentStationSummaries.find(row => row.key === "tokyo")!;
  const heatValues = recentAnnualRows.filter(row => row.station_key === "hachioji").map(row => row.metrics.heatstroke_days);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: title,
    datePublished: "2026-08-12", dateModified: "2026-09-16", mainEntityOfPage: canonicalUrl,
    image: "https://bearworks.uk/images/hachioji-climate/hero-illustration.webp",
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk", url: "https://bearworks.uk" },
    isBasedOn: climateBundle.attribution.source_url,
  };
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <PublicSiteHeader />
    <article className="space-y-10 leading-relaxed">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 text-white">
        <div className="grid items-center lg:grid-cols-2">
          <div className="p-7 md:p-10">
            <p className="mb-4 text-sm font-semibold tracking-widest text-orange-200">街のうわさを、統計でほどく · 01</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">夏は暑い。<br />冬は寒い。<br /><span className="text-orange-200">それって、本当？</span></h1>
            <p className="mt-6 text-xl font-semibold">{title}</p>
            <p className="mt-4 text-slate-200">昼の駅前は暑いのに、夜は少しほっとする。冬の朝は、都心より冷える気がする。その実感を、八王子・府中・青梅・東京都心の観測データで確かめます。</p>
            <p className="mt-5 text-sm text-orange-200">平均・中央値・ばらつき・仮説検証。統計検定2級の知識を、いつもの街の気温に使う記事です。</p>
          </div>
          <figure>
            <Image src="/images/hachioji-climate/hero-illustration.webp" width={1536} height={1024} alt="同じ街路を夏の暑い昼と冬の冷たい朝で対比したイラスト" unoptimized priority className="w-full" />
            <figcaption className="px-5 py-3 text-xs text-slate-300">導入用のAI生成イラスト。実在の街路や特定日時の観測を再現したものではありません。</figcaption>
          </figure>
        </div>
      </header>

      <section id="conclusion" className={card} aria-labelledby="answer">
        <p className="text-sm font-bold text-orange-700">まず、データから言えること</p>
        <h2 id="answer" className={`${heading} mt-2`}>昼は暑い。夜と冬は、冷えやすい。</h2>
        <p className="mt-4">東京都心と比べると、猛暑日が多く、最低気温25℃以上の日は少なく、冬日は多い。比較可能な区間に分けても、この方向は共通していました。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[{ Icon: Sun, label: "猛暑日が多い", id: "H1", direction: "八王子 − 東京都心", style: "bg-orange-50 text-orange-800" }, { Icon: Moon, label: "最低25℃以上の日が少ない", id: "H2", direction: "東京都心 − 八王子", style: "bg-indigo-50 text-indigo-800" }, { Icon: Snowflake, label: "冬日が多い", id: "H3", direction: "八王子 − 東京都心", style: "bg-blue-50 text-blue-800" }].map(({ Icon, label, id, direction, style }) => {
            const range = deltaRange(id);
            return <div key={id} className={`rounded-2xl p-5 ${style}`}><Icon size={23} aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">{label}</h3><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{format(range.min)}〜{format(range.max)}</p><p className="mt-1 text-sm">日/年の差</p><p className="mt-3 text-xs">{direction}</p></div>;
          })}
        </div>
        <p className="mt-5 text-sm">数字の幅は、比較区間ごとの平均差の最小〜最大で、信頼区間ではありません。青梅の冬日は八王子より多く、「八王子が多摩で最も寒い」とは言えません。</p>
        <p className="mt-3 text-sm text-slate-600">対象は1990〜2025年の4観測地点。「東京都心」は気象庁「東京」地点で、東京都全域・23区の平均ではありません。第1・2節の4地点棒グラフは2020〜2025年の参考比較、上の結論は比較可能な全区間の判定です。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-2 text-sm font-semibold text-blue-800">
        {[["summer", "01 昼と夜の暑さ"], ["winter", "02 冬の冷え込み"], ["variation", "03 平均とばらつき"], ["daily-range", "04 日較差と中央値"], ["comparison", "05 比べ方のルール"], ["quiz", "06 確認問題"], ["method", "方法と出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-blue-100 bg-white px-4 py-2 transition-colors hover:bg-blue-50">{label}</a>)}
      </nav>

      <section id="summer" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>01　「暑い」を、昼と夜に分けてみる。</h2>
        <p>最高気温が35℃に届く昼と、最低気温が25℃を下回らない一日。同じ「暑い」でも、見ている側面は違います。</p>
        <div className="grid gap-5 md:grid-cols-2">
          <section className={card}><p className="text-xs font-bold tracking-widest text-orange-700">DAYTIME</p><h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">猛暑日 · 日最高気温35℃以上</h3><RecentClimateBars metric="heatstrokeDays" max={50} tone="warm" /></section>
          <section className={card}><p className="text-xs font-bold tracking-widest text-indigo-700">DAILY MINIMUM</p><h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">日最低気温25℃以上の日</h3><RecentClimateBars metric="tropicalNightEquivalentDays" max={50} tone="cool" /></section>
        </div>
        <p>八王子の猛暑日は年平均<strong>{format(hachioji.heatstrokeDays)}日</strong>で、東京都心の{format(tokyo.heatstrokeDays)}日より多い一方、最低25℃以上の日は<strong>{format(hachioji.tropicalNightEquivalentDays)}日</strong>で、東京都心の{format(tokyo.tropicalNightEquivalentDays)}日より少なくなっています。</p>
        <p className="text-sm text-slate-600">最低25℃以上は一日全体の最低気温による指標です。夜間だけを切り出す「熱帯夜」と同じではなく、すべての夜の平均気温を比べた結果でもありません。</p>
        <Lesson title="問いを、測れる指標に置き換える。"><p>「暑い街」という印象を、そのまま一つの数字にはできません。日最高気温を見るのか、最低気温を見るのか、閾値を何℃にするのか。変数の定義を先に決めると、比較の意味がはっきりします。</p><p>この2図はどちらも0〜50日/年の共通目盛りです。軸の範囲が違うグラフの棒の長さを、そのまま比較しないことも大切です。</p></Lesson>
        <details className={card}><summary className="cursor-pointer font-bold text-slate-900">30℃以上の「真夏日」でも見てみる</summary><div className="mt-6"><RecentClimateBars metric="midsummerDays" max={100} tone="warm" /></div><p className="mt-4 text-sm">35℃以上と30℃以上では、地点間の差の見え方が変わります。真夏日の図は0〜100日/年です。猛暑日の図との目盛りの違いにも注意してください。</p></details>
      </section>

      <section id="winter" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>02　冬の冷え込み。比べる相手を増やすと？</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}><h3 className="mb-6 text-xl font-bold text-slate-900">冬日 · 日最低気温0℃未満</h3><RecentClimateBars metric="winterDays" max={80} tone="cool" /></section>
          <div className="flex flex-col justify-center rounded-3xl bg-slate-900 p-7 text-white md:p-9"><Snowflake size={30} className="text-sky-200" aria-hidden="true" /><p className="mt-5 text-2xl font-bold">東京都心より寒い。<br />でも、地域の一番とは限らない。</p><p className="mt-5 text-slate-200">この6年の冬日は、八王子が年平均{format(hachioji.winterDays)}日、東京都心が{format(tokyo.winterDays)}日。さらに青梅を見ると、八王子より多くなります。</p><p className="mt-4 text-sm text-sky-200">「東京都心との比較」と「多摩で最も寒い」は、別の問いです。</p></div>
        </div>
        <p className="text-sm text-slate-600">冬日は1〜12月の暦年集計で、12〜2月だけの日数ではありません。上の6年平均は参考表示で、仮説の順位判定には使っていません。H4は後述の共通区間で確認しています。</p>
        <Lesson title="比較対象の選び方が、結論の範囲を決める。"><p>4地点の観測結果は、市内全域や多摩全域を代表する無作為標本ではありません。「この地点・この指標・この期間では」と範囲を明示するのが、観察データを読む基本です。</p><Link href="/toukei/guides/sampling-and-bias" className="inline-block font-semibold text-blue-800 underline">標本抽出と偏りを復習する →</Link></Lesson>
      </section>

      <section id="variation" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>03　平均の向こうに、6つの夏がある。</h2>
        <p>年平均{format(hachioji.heatstrokeDays)}日。それだけでは、毎年の暑さの違いが隠れます。八王子の猛暑日を1年ずつ並べてみましょう。</p>
        <div className={card}><AnnualHeatChart /><div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-4 text-center"><div><p className="text-xs text-orange-900">最も少ない年</p><p className="mt-1 text-2xl font-bold text-orange-800">{Math.min(...heatValues)}<span className="ml-1 text-sm">日</span></p></div><div><p className="text-xs text-orange-900">6年平均</p><p className="mt-1 text-2xl font-bold text-orange-800">{format(hachioji.heatstrokeDays)}<span className="ml-1 text-sm">日</span></p></div><div><p className="text-xs text-orange-900">最も多い年</p><p className="mt-1 text-2xl font-bold text-orange-800">{Math.max(...heatValues)}<span className="ml-1 text-sm">日</span></p></div></div></div>
        <Lesson title="中心と、散らばりをセットで読む。"><p>平均は「合計 ÷ 個数」。ここでの1個は1年です。最大と最小の差である範囲は{Math.max(...heatValues) - Math.min(...heatValues)}日。中心が同じでも、年ごとの変動が同じとは限りません。</p><p>標準偏差（SD）は値の散らばり、標準誤差（SE）は推定量のばらつきを表します。独立・同分布などの前提を確かめずに、6年分からSEや信頼区間を機械的に付けることはしていません。</p><Link href="/toukei/problems/confidence-interval" className="inline-block font-semibold text-blue-800 underline">信頼区間の例題で、前提を確認する →</Link></Lesson>
      </section>

      <section id="daily-range" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>04　昼と夜の差を、ひとつの変数に。</h2>
        <p>日較差は、同じ日の最高気温から最低気温を引いた値です。暑さと寒さを別々に見るだけでなく、「一日の気温の幅」に注目します。</p>
        <div className={card}>
          <figure className="mb-7 rounded-2xl bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-center"><div className="flex items-center gap-4"><div><p className="text-xs text-slate-500">日最高気温</p><p className="text-3xl font-bold text-orange-700">32℃</p></div><span className="text-2xl text-slate-400">−</span><div><p className="text-xs text-slate-500">日最低気温</p><p className="text-3xl font-bold text-blue-700">21℃</p></div></div><div className="flex items-center gap-4"><span className="text-2xl text-slate-400">＝</span><div><p className="text-xs text-slate-500">日較差</p><p className="text-3xl font-bold text-slate-900">11℃</p></div></div></div>
            <figcaption className="mt-4 text-center text-xs text-slate-600">計算方法を示す仮想例。特定の日の実測値ではありません。</figcaption>
          </figure>
          <SeasonalRangeCharts />
          <p className="mt-5 text-sm text-slate-600">冬Yは前年12月〜Y年2月。例えば2016冬は2015年12月〜2016年2月です。観測環境をそろえるため、表示した夏と冬では開始年が異なります。</p>
        </div>
        <Lesson title="「中央値の平均」と「全部まとめた中央値」を分ける。"><p>中央値は、値を小さい順に並べた中央の値です。個数が偶数なら中央2値を平均します。この図では、まず各年の夏・冬の日較差の中央値を計算し、次に比較区間の年数で平均しています。</p><p className="rounded-xl bg-white p-4 font-semibold">日々の最高 − 最低 → 季節ごとの中央値 → 区間内で年ごとに平均</p><p>そのため、全期間の日別データをひとまとめにした中央値とは一般に一致しません。日較差は一日の最高と最低の差で、日々の気温の標準偏差でもありません。</p></Lesson>
      </section>

      <section id="comparison" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>05　長いデータほど、比べ方をていねいに。</h2>
        <p>観測地点の移設や測器の変更があると、数字の変化に観測条件の違いが混ざることがあります。1990〜2025年を一本につなぐ前に、両地点で条件をそろえられる区間に分けました。</p>
        <div className={card}><h3 className="mb-5 text-xl font-bold text-slate-900">猛暑日は、どの比較区間でも八王子が多い</h3><SegmentComparison /></div>
        <Lesson title="仮説の「支持」と、有意差検定は違う。"><p>H1では「八王子の猛暑日が東京都心より年1日以上多い」と先に基準を決めました。上の4区間はいずれも基準を満たしています。これは記述的な比較で、p値による有意差判定ではありません。</p><p>同じ天候が両地点に影響し、日々の気温も時間的につながります。日数が多いからといって、すべてを独立な標本として検定できるわけではありません。また、気温差だけで標高や都市化などの原因を特定することもできません。</p><Link href="/toukei/guides/hypothesis-testing-basics" className="inline-block font-semibold text-blue-800 underline">p値・有意水準・信頼区間の違い →</Link></Lesson>
        <details className={card}><summary className="cursor-pointer text-lg font-bold text-slate-900">5つの事前仮説と判定基準を確認する</summary><p className="mt-4 text-sm">品質条件と共通均質区間の範囲で、H1〜H5はすべて支持されました。H4は「八王子が最も寒いとは限らない」という仮説です。事前予想への反証が得られた、という意味ではありません。</p><div className="mt-5 space-y-4">{hypotheses.map(hypothesis => { const range = deltaRange(hypothesis.id); return <section key={hypothesis.id} className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-blue-800">{hypothesis.id} · 今回の比較範囲で支持</p><h3 className="mt-1 font-bold text-slate-900">{hypothesis.title}</h3><p className="mt-2 text-sm">事前基準：{hypothesis.threshold}</p><p className="mt-2 text-sm">{hypothesis.direction}：<strong>{format(range.min)}〜{format(range.max)} {hypothesis.unit}</strong></p></section>; })}</div></details>
      </section>

      <section id="quiz" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>06　グラフの読み方を、5問で確かめる。</h2>
        <p>計算できることと、そこから言えること。答えを開く前に、少し考えてみてください。Q2は学習用の仮想データです。</p>
        {quizzes.map((quiz, index) => <section key={quiz.title} className={card}><p className="text-sm font-bold text-orange-700">QUESTION {String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 text-lg font-bold text-slate-900">{quiz.title}</h3><p className="mt-3">{quiz.question}</p><details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold text-blue-800">答えと考え方</summary><p className="mt-3 text-sm leading-7">{quiz.answer}</p></details></section>)}
      </section>

      <section id="method" className={`${card} scroll-mt-6`}>
        <h2 className={heading}>方法・再現性・出典</h2>
        <p className="mt-4">気象庁の1990年1月1日〜2025年12月31日の日別観測値を、固定した公開データから表示しています。今回の改訂では、元の観測データ・5仮説の判定・比較条件を維持し、図解と学習解説を加えました。</p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm">
          <li>品質コード8（正常値）と5（準正常値）を集計。指標ごとに有効日が期待日数の90%以上ある期間を公開対象としています。90%は本分析の基準です。</li>
          <li>品質5の採用件数：八王子{qualityCounts?.hachioji}、府中{qualityCounts?.fuchu}、青梅{qualityCounts?.ome}、東京都心{qualityCounts?.tokyo}。</li>
          <li>八王子・府中・青梅は2003年・2008年、東京都心は2014年の観測環境境界を考慮。期間の区切りと除外年は指標・季節によって異なります。</li>
          <li>年平均の参考比較は2020〜2025年の6年を等しい重みで平均。欠測分の推計・日数補正は行いません。年によって有効日数は異なります。</li>
          <li>結果は4観測地点・定義済み指標の範囲です。市域全体、原因、将来予測、境界をまたぐ単一のトレンドは示していません。降雪・積雪は本記事の対象外です。</li>
        </ul>
        <details className="mt-6 rounded-2xl bg-slate-50 p-5"><summary className="cursor-pointer font-bold text-slate-900">図の元になった6年平均を表で見る</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-right text-sm"><caption className="mb-3 text-left">2020〜2025年の各年集計の単純平均。日較差は各暦年の中央値を平均した値です。</caption><thead><tr className="border-b border-slate-300">{["地点", "猛暑日", "真夏日", "最低25℃以上", "冬日", "年間の日較差中央値の平均"].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead><tbody>{recentStationSummaries.map(row => <tr key={row.key} className="border-b border-slate-200"><th scope="row" className="p-3 text-left text-slate-900">{row.name}</th>{[row.heatstrokeDays, row.midsummerDays, row.tropicalNightEquivalentDays, row.winterDays].map((value, i) => <td key={i} className="p-2 tabular-nums">{format(value)}日</td>)}<td className="p-2 tabular-nums">{format(row.dailyRange)}℃</td></tr>)}</tbody></table></div></details>
        <details className="mt-4 rounded-2xl bg-slate-50 p-5"><summary className="cursor-pointer font-bold text-slate-900">固定データのバージョンと検証情報</summary><dl className="mt-4 space-y-3 break-all text-sm"><div><dt className="font-bold">データ版 / スキーマ</dt><dd>{climateLock.bundle_version} / {climateLock.bundle_schema_version}</dd></div><div><dt className="font-bold">SHA-256</dt><dd className="font-mono text-xs">{climateLock.bundle_sha256}</dd></div><div><dt className="font-bold">分析元のApps commit</dt><dd className="font-mono text-xs">{climateLock.apps_production_commit}</dd></div></dl><p className="mt-4 text-sm">公開データはビルド時にバイト数・SHA-256・集計値を照合し、不一致ならビルドを停止します。</p></details>
        <p className="mt-6 text-sm">出典：{climateBundle.attribution.processing_ja}。</p>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-blue-800">
          <li><a className="underline" href={climateBundle.attribution.source_url}>気象庁：過去の気象データ・ダウンロード</a></li>
          <li><a className="underline" href="https://www.data.jma.go.jp/risk/obsdl/top/help3">気象庁：品質情報・均質番号の説明</a></li>
          <li><a className="underline" href="https://www.toukei-kentei.jp/grade/grade2/">統計検定2級：出題範囲（学習分野の参照）</a></li>
          <li><a className="underline" href="https://github.com/kumakit/bearworks-portal/blob/main/scripts/validate-hachioji-climate-bundle.mjs">公開データの検証コード</a></li>
          <li><a className="underline" href="https://apps.bearworks.uk/Hachioji_Climate">操作できる分析アプリ</a></li>
        </ul>
      </section>

      <ContentProvenance provenance={hachiojiClimateProvenance} />

      <section className="overflow-hidden rounded-3xl bg-slate-900 text-white p-7 md:p-10">
        <p className="text-sm font-bold tracking-wider text-orange-200">街のうわさを、統計でほどく シリーズ</p>
        <h2 className="mt-2 text-2xl font-bold md:text-3xl">八王子の気候を、もっと深く知る</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/labs/hachioji-snow" className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500">
            <p className="text-xs font-bold text-sky-200">第2弾 · 雪の分析</p>
            <h3 className="mt-1 text-base font-bold group-hover:text-sky-200">雪のニュース。また、八王子だ。 →</h3>
            <p className="mt-2 text-xs text-slate-300">気温が低いことと雪が多いことは同じか。箱ひげ図・散布図・4大雪事例で検証。</p>
          </Link>
          <Link href="/labs/hachioji-heat" className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500">
            <p className="text-xs font-bold text-orange-300">第3弾 · 夏の猛暑と熱帯夜</p>
            <h3 className="mt-1 text-base font-bold group-hover:text-orange-200">八王子の夏は本当に暑いのか →</h3>
            <p className="mt-2 text-xs text-slate-300">昼の猛暑日の多さと夜の冷え方。都心との30時刻の気温推移・冷却量を比較。</p>
          </Link>
          <Link href="/labs/hachioji-chill" className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500">
            <p className="text-xs font-bold text-cyan-300">第4弾 · 冬の朝と放射冷却</p>
            <h3 className="mt-1 text-base font-bold group-hover:text-cyan-200">八王子の朝はなぜ寒い？ →</h3>
            <p className="mt-2 text-xs text-slate-300">朝7時の気温差中央値−3.4℃。24時間の時間構造と弱風・放射冷却条件を検証。</p>
          </Link>
          <Link href="/labs/takao-gear" className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500">
            <p className="text-xs font-bold text-emerald-300">第5弾 · 高尾山装備判定</p>
            <h3 className="mt-1 text-base font-bold group-hover:text-emerald-200">高尾山に山装備は本当に必要か →</h3>
            <p className="mt-2 text-xs text-slate-300">標高599mの体感温度ギャップ、年間装備必須日数を判定するシミュレーター。</p>
          </Link>
          <Link href="/labs/takao-weather-shift" className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500">
            <p className="text-xs font-bold text-amber-300">第6弾 · 天候急変とガス</p>
            <h3 className="mt-1 text-base font-bold group-hover:text-amber-200">高尾山頂はなぜガスるのか？ →</h3>
            <p className="mt-2 text-xs text-slate-300">平野晴天でも山頂は濃霧。「見せかけの晴れ（年34日）」と午後急変リスクを解明。</p>
          </Link>
        </div>
      </section>
      <div className="text-center"><Link href="/toukei" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50">統計検定2級の学習へ<ArrowRight size={18} aria-hidden="true" /></Link></div>
    </article>
    <PublicSiteFooter />
  </main>;
}
