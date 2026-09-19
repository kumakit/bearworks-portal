import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, ArrowDown, Moon, Sun } from "lucide-react";
import Link from "@/components/InternalLink";
import ContentProvenance from "@/components/ContentProvenance";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { AnnualTrendChart, CoolingRateComparison, HourlyCaseChart, RecentDifferenceChart, RecentHeatBars } from "@/components/HeatCharts";
import { hachiojiHeatProvenance } from "@/lib/content-provenance";
import { caseCooling, fmt, heatBundle, heatLock, hourlyCases, recentDifference, recentYears, summary } from "@/lib/hachioji-heat-publication";

const canonicalUrl = "https://bearworks.uk/labs/hachioji-heat";
const title = "八王子の夏は本当に暑いのか ― 昼の猛暑と、夜の冷え方 ―";
const card = "min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";
const lesson2023 = caseCooling(hourlyCases[1]);

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description: "八王子と東京都心の猛暑日・日最低25℃以上の日数を比較。年ごとのばらつき、猛暑3事例の時間別気温と気温差から、夜の冷え方を統計検定2級の視点で読み解きます。",
  alternates: { canonical: canonicalUrl },
  openGraph: { type: "article", url: canonicalUrl, title, description: "昼に暑い街は、夜も暑い？ 年平均と時間別の観測を分けて、八王子の夏を読み解く。", siteName: "bearworks.uk", images: ["/images/hachioji-heat/hero-illustration.webp"] },
};

const quizzes = [
  {
    title: "23.7 − 16.8 なのに、平均差は6.8日？",
    question: "6年間の猛暑日の合計は、八王子142日・東京都心101日。各地点の表示は23.7日と16.8日です。差を小数第1位まで求めるなら、どの順序で計算しますか。",
    answer: "年別値から (142 − 101) ÷ 6 = 6.833… を計算し、最後に丸めて6.8日とします。先に丸めた23.7 − 16.8 = 6.9では丸め誤差が入ります。同じ6年を同じ重みで平均すると、平均の差と差の平均は、丸める前なら一致します。",
  },
  {
    title: "別の変数なら、統計的に独立？",
    question: "日最高気温と日最低気温は、異なる指標です。このことだけで、2変数が統計的に独立だと言えますか。",
    answer: "言えません。変数の定義が異なることと、一方の値を知っても他方の分布が変わらないという独立性は別です。両方が同じ気象条件の影響を受ける可能性もあります。猛暑日数だけから日最低25℃以上の日数を決めることもできません。",
  },
  {
    title: "9.3℃冷えたら、都心より9.3℃低い？",
    question: "2023年の事例では八王子が18時35.5℃から翌5時26.2℃へ低下。東京都心の翌5時は27.6℃でした。八王子の冷却量と、翌5時の地点間差を求めてください。",
    answer: "冷却量は35.5 − 26.2 = 9.3℃。翌5時の気温差（八王子 − 都心）は26.2 − 27.6 = −1.4℃です。時間方向の差と、同時刻の地点間の差を区別します。大きく冷えていても、八王子の気温は25℃を上回っています。",
  },
  {
    title: "毎時12点なら、独立な標本が12個？",
    question: "18時から翌5時までの気温12点で時間と気温の回帰直線を描き、そのまま通常の検定をすれば冷却傾向を確かめられますか。",
    answer: "直線を記述的な要約として描くことと、通常の標準誤差やp値を使うことは別です。残差の自己相関やモデルの妥当性を確認せず、独立な標本として検定することはできません。正の自己相関を無視すると標準誤差を過小評価する場合があります。本記事は2時刻の差を11時間で割った区間平均を示し、有意差検定は行いません。",
  },
  {
    title: "3事例で冷えた。山風が原因と決まる？",
    question: "選んだ3事例すべてで、八王子の18時→翌5時の低下量が東京都心より大きくなりました。「夏はいつもそうで、原因は山風」と結論づけられますか。",
    answer: "どちらも結論づけられません。無作為に選んだ3夜ではなく、夏全体の頻度を推定できません。また、気温差だけでは風・雲量・放射・都市化などの寄与を分離できません。一般化には対象期間と選び方を定めた多数の夜の比較が、原因の検証には追加の観測や分析設計が必要です。",
  },
];

function Lesson({ title: lessonTitle, children }: { title: string; children: ReactNode }) {
  return <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
    <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
    <h3 className="mt-2 text-lg font-bold text-indigo-950">{lessonTitle}</h3>
    <div className="mt-3 space-y-3 text-sm leading-7 text-indigo-950">{children}</div>
  </aside>;
}

export default function HachiojiHeatPage() {
  const recent = summary.recent_averages_2020_2025;
  const differences = recentYears.map(row => row.hachioji.heatstroke_days - row.tokyo.heatstroke_days);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: title,
    datePublished: "2026-09-17", dateModified: "2026-09-18", mainEntityOfPage: canonicalUrl,
    image: "https://bearworks.uk/images/hachioji-heat/hero-illustration.webp",
    author: { "@type": "Person", name: "kuma" }, publisher: { "@type": "Organization", name: "bearworks.uk", url: "https://bearworks.uk" },
    isBasedOn: heatBundle.attribution.source_url,
  };

  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <PublicSiteHeader />
    <article className="space-y-10 leading-relaxed">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 text-white">
        <div className="grid items-center lg:grid-cols-2">
          <div className="p-7 md:p-10">
            <p className="mb-4 text-sm font-semibold tracking-widest text-orange-300">街のうわさを、統計でほどく · 03</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">昼は暑い。<br />夜も暑い？<br /><span className="text-orange-300">数字で確かめる。</span></h1>
            <p className="mt-6 text-xl font-semibold">八王子の夏は<span className="block sm:inline">本当に暑いのか</span></p>
            <p className="mt-4 text-slate-200">昼の暑さを伝えるニュース。でも、夜まで同じように暑いのでしょうか。年間日数と、ある一日の気温。その2つの時間の長さから、八王子と東京都心を比べます。</p>
            <p className="mt-5 text-sm text-orange-200">平均とばらつき・同時刻の差・時系列。統計検定2級の知識で、グラフの一歩先を読む記事です。</p>
          </div>
          <figure className="min-w-0">
            <Image src="/images/hachioji-heat/hero-illustration.webp" width={1536} height={1024} alt="夏の街を、日差しのある昼と青い夜で対比したイラスト" unoptimized priority className="w-full" />
            <figcaption className="px-5 py-3 text-xs text-slate-300">導入用のAI生成イラスト。特定日時の観測や、風の流れを再現したものではありません。</figcaption>
          </figure>
        </div>
      </header>

      <section id="conclusion" className={card} aria-labelledby="answer">
        <p className="text-sm font-bold text-orange-700">まず、データから言えること</p>
        <h2 id="answer" className={`${heading} mt-2`}>猛暑日は多い。最低25℃以上の日は少ない。</h2>
        <p className="mt-4">2020〜2025年の平均では、八王子と東京都心の関係は指標によって逆転します。ただし、これだけで「夜はいつも涼しい」とは言えません。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-orange-50 p-5 text-orange-950"><Sun size={24} aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">猛暑日 · 八王子が多い</h3><p className="mt-3 text-4xl font-bold tabular-nums">+{fmt(recentDifference("heatstroke_days"))}<span className="ml-1 text-sm font-normal">日/年</span></p><p className="mt-3 text-sm">八王子 {fmt(recent.heatstroke_days.hachioji)}日<br />東京都心 {fmt(recent.heatstroke_days.tokyo)}日</p><p className="mt-3 text-xs">日最高気温35℃以上</p></div>
          <div className="rounded-2xl bg-blue-50 p-5 text-blue-950"><Moon size={24} aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">最低25℃以上 · 八王子が少ない</h3><p className="mt-3 text-4xl font-bold tabular-nums">−{fmt(-recentDifference("min_temp_ge25_days"))}<span className="ml-1 text-sm font-normal">日/年</span></p><p className="mt-3 text-sm">八王子 {fmt(recent.min_temp_ge25_days.hachioji)}日<br />東京都心 {fmt(recent.min_temp_ge25_days.tokyo)}日</p><p className="mt-3 text-xs">夜間だけの「熱帯夜」とは別の指標</p></div>
          <div className="rounded-2xl bg-slate-900 p-5 text-white"><ArrowDown size={24} className="text-orange-300" aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">大きく冷えても、低温とは限らない</h3><p className="mt-3 text-4xl font-bold tabular-nums text-orange-300">{fmt(lesson2023.hachioji.to)}<span className="ml-1 text-sm font-normal">℃</span></p><p className="mt-3 text-sm text-slate-200">八王子 · 2023年7月17日5時<br />前日18時から{fmt(lesson2023.hachioji.drop)}℃低下</p><p className="mt-3 text-xs text-slate-300">こちらは年間平均ではなく、1事例の値</p></div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">日数差は年別の値から計算し、最後に丸めています。「東京都心」は気象庁の観測地点「東京」で、23区平均ではありません。気温は各観測地点の値で、市内全域や室内の暑さを表しません。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-2 text-sm font-semibold text-blue-800">{[
        ["contrast", "01 暑さの指標"], ["variation", "02 平均と年ごとの差"], ["hourly", "03 時間別の気温差"], ["cooling", "04 冷えた量と朝の気温"], ["trend", "05 比較条件と原因"], ["quiz", "06 確認問題"], ["method", "方法と出典"],
      ].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-blue-100 bg-white px-4 py-2 hover:bg-blue-50">{label}</a>)}</nav>

      <section id="contrast" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>01　「暑い」を、何で測ろう。</h2>
        <p>最高気温が35℃に届く日と、一日を通じて25℃を下回らない日。前者は昼の厳しい暑さ、後者は最低気温の高さを捉える指標です。両方を、同じ目盛りで並べます。</p>
        <div className="grid gap-5 md:grid-cols-2">
          <section className={card}><p className="text-xs font-bold tracking-widest text-orange-700">DAILY MAXIMUM</p><h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">猛暑日 · 日最高35℃以上</h3><RecentHeatBars metric="heatstroke_days" max={50} /></section>
          <section className={card}><p className="text-xs font-bold tracking-widest text-blue-700">DAILY MINIMUM</p><h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">日最低25℃以上の日</h3><RecentHeatBars metric="min_temp_ge25_days" max={50} /></section>
        </div>
        <p>八王子の猛暑日は東京都心より多いものの、4地点では青梅の<strong>{fmt(recent.heatstroke_days.ome)}日/年</strong>が八王子を上回ります。「都心より多い」と「地域で一番」は別の問いです。</p>
        <Lesson title="別の指標と、独立な変数は違う。"><p>日最高気温と日最低気温は別の変数ですが、統計的に独立だとは限りません。ひとつの「暑さ」という言葉を、何℃以上・どの時間帯・どの期間かに分解すると、比較の意味がはっきりします。</p><p>熱帯夜は夜間の最低気温が25℃以上の夜を指します。本記事の年間日数は日別値から数えた「日最低25℃以上」で、熱帯夜の日数や、夜の平均気温を直接測ったものではありません。</p></Lesson>
        <details className={card}><summary className="cursor-pointer font-bold text-slate-900">閾値を30℃にすると？ 真夏日も比べる</summary><div className="mt-5 max-w-xl"><RecentHeatBars metric="midsummer_days" max={100} /></div><p className="mt-4 text-sm">八王子{fmt(recent.midsummer_days.hachioji)}日、東京都心{fmt(recent.midsummer_days.tokyo)}日。35℃の猛暑日より平均日数が近く、どの閾値を使うかで見える差が変わります。真夏日は猛暑日を含みます。</p></details>
      </section>

      <section id="variation" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>02　平均の差にも、6つの夏がある。</h2>
        <p>平均で{fmt(recentDifference("heatstroke_days"))}日多い。その内訳を、同じ年の「八王子 − 東京都心」で見てみましょう。指標を切り替えると、差の向きとばらつきを比較できます。</p>
        <div className={card}><RecentDifferenceChart /></div>
        <div className="grid gap-3 sm:grid-cols-3">{[["猛暑日差の最小", `${Math.min(...differences)}日`, "2022・2023年"], ["6年平均の差", `${fmt(recentDifference("heatstroke_days"))}日`, "年別の差を等しい重みで平均"], ["猛暑日差の最大", `${Math.max(...differences)}日`, "2025年"]].map(([label, value, note]) => <div key={label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></div>)}</div>
        <Lesson title="対応をそろえる。丸めるのは、最後に。"><p>同じ年同士を比べることで、年の違いと地点の違いを混ぜずに読めます。6年分の差は7、3、1、1、12、17日。合計41日を6で割ると6.833…日です。表示済みの23.7 − 16.8ではなく、丸め前の値から計算します。</p><p>この6点は年ごとの観測結果です。独立・同分布の無作為標本とはみなさず、信頼区間やp値は付けていません。2024年の八王子は366日中363日が有効で、欠測分の補正はしていません。</p></Lesson>
      </section>

      <section id="hourly" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>03　一日の中で、2地点の差は入れ替わる。</h2>
        <p>年間日数から、時間別の気温へ。2018・2023・2024年の3事例を比べます。上段で温度そのものを、下段で<strong>同じ時刻の気温差</strong>を見てください。</p>
        <div className={card}><HourlyCaseChart /></div>
        <Lesson title="選んだ3日と、夏全体を分ける。"><p>この3事例は無作為抽出ではなく、既存記事で選んだ夏の高温日の例です。図から「この日時には差があった」と読めても、「夏の何割の夜に起こるか」は推定できません。気温と降水量だけで、晴天や山風の発生も確認していません。</p><p>毎正時の観測には、時刻の間に生じた極値が含まれないことがあります。例えば2018年7月23日の日最高39.3℃と、この時間値系列の最大38.3℃は集計の定義が異なります。</p></Lesson>
      </section>

      <section id="cooling" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>04　よく冷えた夜は、涼しい夜？</h2>
        <p>18時から翌5時までの11時間をそろえて、2時刻の温度の差を取ります。ここでいう低下量は「夕方の温度 − 翌朝の温度」。夜間の最大と最小の差ではありません。18時を日没時刻として扱ってもいません。</p>
        <CoolingRateComparison />
        <div className="grid gap-6 rounded-3xl bg-slate-900 p-6 text-white md:grid-cols-2 md:p-8"><div><p className="text-sm font-bold text-orange-300">2023年の事例を、2つの差で読む</p><h3 className="mt-3 text-2xl font-bold">大きく下がった。<br />それでも、朝は26.2℃。</h3><p className="mt-4 text-sm leading-7 text-slate-200">八王子は18時の時点で都心より4.8℃高温でした。低下量の差が6.2℃あっても、翌朝の地点間差は1.4℃です。スタートの温度を落とすと、読み取りが変わってしまいます。</p></div><div className="space-y-4 self-center"><div className="rounded-2xl bg-white/10 p-5"><p className="text-sm text-slate-300">八王子の時間方向の差</p><p className="mt-2 text-xl font-bold tabular-nums">35.5 − 26.2 ＝ 9.3℃の低下</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="text-sm text-slate-300">翌5時の地点間の差</p><p className="mt-2 text-xl font-bold tabular-nums">26.2 − 27.6 ＝ −1.4℃</p></div></div></div>
        <Lesson title="区間平均の低下率は、回帰の傾きではない。"><p>9.3℃ ÷ 11時間 ≈ 0.85℃/hは、始点と終点から求めた区間平均です。毎時間0.85℃ずつ一定に下がったことや、全12点に当てはめた回帰直線の傾きは意味しません。</p><p>毎時の気温には時間的なつながりがあります。通常の検定に進むには残差の自己相関などを考慮する必要があるため、ここでは観測値の記述的な比較にとどめます。</p></Lesson>
      </section>

      <section id="trend" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>05　長い記録ほど、比べ方をていねいに。</h2>
        <p>1990〜2025年の記録には、観測環境の変化が含まれます。第一弾と同じ比較可能な区間に分け、境界をまたぐ線を描かずに年ごとの値を示します。</p>
        <div className={card}><AnnualTrendChart /></div>
        <p>どの区間でも、平均では八王子の猛暑日が多く、日最低25℃以上の日は少なくなっています。これは<strong>区間内の記述比較</strong>です。全期間を通じた上昇率、都市化の効果、将来の暑さを推定したものではありません。</p>
        <section id="mechanism" className={card}><p className="text-xs font-bold tracking-wider text-blue-700">観測された差と、考えられる理由</p><h3 className="mt-2 text-xl font-bold text-slate-900">ヒートアイランドは、どこまで説明できる？</h3><p className="mt-4">気象庁は、人工被覆による蓄熱、建物による放射冷却の弱まり、人工排熱などを都市の高温の要因として説明しています。ただし、これらの一般論と、今回の2地点差の原因を確かめることは別です。</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-blue-50 p-5"><h4 className="font-bold text-blue-950">このデータで比べたこと</h4><p className="mt-2 text-sm leading-7">定義した年間日数、同時刻の気温差、18時から翌5時の低下量。いずれも観測値から計算できます。</p></div><div className="rounded-2xl bg-slate-50 p-5"><h4 className="font-bold text-slate-900">追加の証拠が必要なこと</h4><p className="mt-2 text-sm leading-7">山風・海風・雲量・放射・土地利用がそれぞれ何℃分寄与したか。2地点の気温だけでは、原因ごとの効果を分離できません。</p></div></div>
          <a className="mt-5 inline-block text-sm text-blue-800 underline" href="https://www.jma.go.jp/jma/kishou/know/cpdinfo/himr_faq/02/qa.html">気象庁：ヒートアイランド現象の要因</a>
        </section>
        <Lesson title="観察された差は、そのまま因果効果にはならない。"><p>地点間には地形・標高・周辺環境など、都市化以外の違いもあります。「もし都市がなかったら」という比較条件を、八王子の観測値がそのまま代わりに満たすわけではありません。相関・差・原因を分けて読むことが大切です。</p><Link href="/toukei/guides/regression-interpretation" className="inline-block text-blue-800 underline">回帰と因果の解釈を復習する →</Link></Lesson>
      </section>

      <section id="quiz" className="scroll-mt-6 space-y-4"><h2 className={heading}>06　見えたつもり、を確かめる5問。</h2><p>数字の計算と、そこから言えること。答えを開く前に考えてみてください。</p>{quizzes.map((quiz, i) => <section key={quiz.title} className={card}><p className="text-xs font-bold tracking-widest text-orange-700">QUESTION {String(i + 1).padStart(2, "0")}</p><h3 className="mt-2 text-lg font-bold text-slate-900">{quiz.title}</h3><p className="mt-3">{quiz.question}</p><details className="mt-4 rounded-xl bg-indigo-50 p-4"><summary className="cursor-pointer font-semibold text-indigo-950">答えと考え方</summary><p className="mt-3 text-sm leading-7 text-indigo-950">{quiz.answer}</p></details></section>)}<div className="flex flex-wrap gap-4 text-sm text-blue-800 underline"><Link href="/toukei/guides/sampling-and-bias">標本と偏り</Link><Link href="/toukei/guides/hypothesis-testing-basics">仮説検定の前提</Link><Link href="/toukei/problems/confidence-interval">信頼区間の例題</Link></div></section>

      <section id="method" className={card}><h2 className={heading}>方法・再現性・出典</h2>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm leading-6"><caption className="mb-3 text-left text-slate-600">年間集計と時間別事例では、採用条件と分析単位が異なります。</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-3">項目</th><th scope="col" className="p-3">年間集計</th><th scope="col" className="p-3">時間別の3事例</th></tr></thead><tbody>{[
          ["対象", "1990〜2025年。最近の参考比較は2020〜2025年。4観測地点。", "2018/7/23、2023/7/16、2024/7/29の各1時〜翌6時。2観測地点。"],
          ["品質", "第一弾と同じ品質8（正常値）・5（準正常値）。指標ごとに有効日90%以上。", "気温の品質8（正常値）のみ。各事例30時刻のペア。"],
          ["単位", "暦年の日数。各年を等しい重みで平均。欠測補正なし。", "毎正時の気温。冷却量は18時と翌5時の差。"],
          ["比較条件", "2003年で分割し、境界年2008・2014年を区間比較から除外。", "既存記事の選択事例。無作為標本ではなく、夏全体の頻度は推定しない。"],
        ].map(([label, annual, hourly]) => <tr key={label} className="border-b border-slate-100"><th scope="row" className="whitespace-nowrap p-3 align-top">{label}</th><td className="p-3 align-top">{annual}</td><td className="p-3 align-top">{hourly}</td></tr>)}</tbody></table></div>
        <div className="mt-5 space-y-3 text-sm leading-7"><p>年間値は第一弾の固定公開データ（2026-08-11.r1）から引き継いでいます。改訂では元のJSONを変更せず、4地点・36年の年間値を元データと全件照合し、平均・地点間差・冷却量を再計算しています。第一弾の仮説判定も変更していません。</p><p>2026年9月18日、3事例×30時刻×2地点の計180気温値を、気象庁の公開表12ページと別の読み取り処理で照合し、全件一致を確認しました。気象庁表の24時は翌日0時として照合しています。照合対象は気温で、降水量や原因の検証ではありません。</p><p>固定データには当初取得したCSV原本が同梱されていません。今回の照合記録は取得先・取得日時・応答ハッシュ・照合値を保存しています。ハッシュ検証はファイルの同一性を確認するもので、観測内容の正しさを単独で保証するものではありません。</p><p>熱帯夜の日数、暑さの体感、健康への影響、原因別の寄与は推定していません。第1・2弾と合わせ、観測地点・指標・期間の範囲内で読んでください。</p></div>
        <details className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><summary className="cursor-pointer font-bold">固定データのバージョンと検証情報</summary><dl className="mt-4 space-y-3"><div><dt className="font-semibold">第三弾データ</dt><dd>{heatBundle.bundle_version} ／ {heatLock.bundle_byte_size.toLocaleString()} bytes</dd></div><div><dt className="font-semibold">SHA-256</dt><dd className="break-all font-mono text-xs">{heatLock.bundle_sha256}</dd></div><div><dt className="font-semibold">年間値の出典：第一弾データ SHA-256</dt><dd className="break-all font-mono text-xs">8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd</dd></div></dl></details>
        <ul className="mt-5 space-y-2 text-sm text-blue-800">{[
          ["気象庁：過去の気象データ・ダウンロード", heatBundle.attribution.source_url],
          ["気象庁：品質情報と均質番号", "https://www.data.jma.go.jp/risk/obsdl/top/help3"],
          ["気象庁：2018年7月の八王子の日別値（日最高39.3℃）", "https://www.data.jma.go.jp/stats/etrn/view/daily_a1.php?prec_no=44&block_no=0366&year=2018&month=7&day=&view=a1"],
          ["気象庁：気温に関する用語", "https://www.jma.go.jp/jma/kishou/know/yougo_hp/kion.html"],
          ["公開データの検証コード", "https://github.com/kumakit/bearworks-portal/blob/main/scripts/validate-hachioji-heat-bundle.mjs"],
        ].map(([label, url]) => <li key={url}><a href={url} className="underline">{label}</a></li>)}</ul>
      </section>

      <ContentProvenance provenance={hachiojiHeatProvenance} />
      <section className="overflow-hidden rounded-3xl bg-slate-900 p-7 text-white md:p-10"><p className="text-sm font-bold tracking-wider text-orange-300">街のうわさを、統計でほどく シリーズ</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">問いが変わると、見るデータも変わる。</h2><div className="mt-6 grid gap-5 md:grid-cols-2">{[
        ["hachioji-climate", "第1弾 · 気候の全体像", "夏は暑い。冬は寒い。それって、本当？", "昼夜の気温差と冬日。4地点比較で、八王子の気候を見渡します。", "hachioji-climate"],
        ["hachioji-snow", "第2弾 · 雪と気温", "雪のニュース。また、八王子だ。", "気温が低いことと、雪が多いこと。分布と相関から問い直します。", "hachioji-snow"],
      ].map(([slug, label, name, description, image]) => <Link key={slug} href={`/labs/${slug}`} className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-800"><Image src={`/images/${image}/hero-illustration.webp`} width={1536} height={1024} alt="" unoptimized className="aspect-[3/1] w-full object-cover" /><div className="p-5"><p className="text-xs font-bold text-orange-200">{label}</p><h3 className="mt-2 text-lg font-bold group-hover:text-orange-200">{name} →</h3><p className="mt-2 text-sm text-slate-300">{description}</p></div></Link>)}</div><div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-200"><Link href="/labs/hachioji-chill" className="underline font-bold text-cyan-300">第4弾：八王子の朝はなぜ寒い？（冬の冷え込み） →</Link><Link href="/labs/takao-gear" className="underline">第5弾：高尾山の装備 →</Link><Link href="/labs/takao-weather-shift" className="underline">第6弾：高尾山の天候 →</Link></div></section>
      <div className="text-center"><Link href="/toukei" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50">統計検定2級の学習へ<ArrowRight size={18} aria-hidden="true" /></Link></div>
    </article>
    <PublicSiteFooter />
  </main>;
}
