import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Flame, Moon, Sun } from "lucide-react";
import Link from "@/components/InternalLink";
import ContentProvenance from "@/components/ContentProvenance";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  AnnualTrendChart,
  CoolingRateComparison,
  HourlyCaseChart,
  RecentHeatBars,
} from "@/components/HeatCharts";
import { hachiojiHeatProvenance } from "@/lib/content-provenance";
import { fmt, heatBundle, heatLock, summary } from "@/lib/hachioji-heat-publication";

const canonicalUrl = "https://bearworks.uk/labs/hachioji-heat";
const title = "八王子の夏は本当に暑いのか ― 猛暑の昼と、熱帯夜の夜 ―";
const card = "rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description:
    "八王子は本当に都心より暑い？ 気象庁アメダスデータで検証。猛暑日（35℃以上）の多さと熱帯夜の少なさ、24時間の冷却カーブから、統計検定2級の視点と5つの確認問題で読み解きます。",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title,
    description: "昼の灼熱、夜の涼風。八王子と都心の夏を、統計でほどく。",
    siteName: "bearworks.uk",
    images: ["/images/hachioji-heat/hero-illustration.webp"],
  },
};

const quizzes = [
  {
    title: "猛暑日が多い地域ほど、熱帯夜も必ず多い？",
    question:
      "「八王子は昼の猛暑日（35℃以上）が都心より圧倒的に多いのだから、夜の熱帯夜（25℃以上）も都心より多いはずだ」と言えるでしょうか。",
    answer:
      "言えません。観測データのとおり、八王子は猛暑日が都心より年約7日多い一方、日最低25℃以上は都心より年約27日も少なくなっています。昼の最高気温（日射・内陸盆地）と夜の最低気温（放射冷却・山風 vs 都市蓄熱ヒートアイランド）は支配する気候要因が異なります。2つの異なる変数を勝手に同一視しないことが統計の基本です。",
  },
  {
    title: "「日最低気温25℃以上」と「熱帯夜」は同じ？",
    question:
      "気象庁の統計指標「日最低気温25℃以上の日」と、一般的な用語「熱帯夜（夜間の最低気温が25℃以上）」は完全に一致するでしょうか。",
    answer:
      "厳密には一致しません。「日最低気温」は0時〜24時の24時間全体での最低気温です。夜間（18時〜翌朝6時）が25℃を下回らなくても、午後の夕立で一時的に24℃台に下がったり、翌日の夜23時台に冷え込んだりすると「日最低25℃以上」には数えられません。変数の定義域（24時間か夜間か）を確認することが大切です。",
  },
  {
    title: "代表的な1日の推移で、全体の法則が決まる？",
    question:
      "本記事で示した2018年7月23日の24時間グラフを見て、「八王子は夏の毎日、必ず夕方以降に都心より急激に冷える」と結論づけてよいでしょうか。",
    answer:
      "結論づけてはいけません。これは典型的な晴天猛暑日の1事例（記述的観察）です。曇天や雨天、南からの強風が吹き続ける夜などでは放射冷却が効かず、冷え込みが鈍い日もあります。目立つ事例だけで全体を語る「セレクションバイアス（選択の偏り）」に注意が必要です。",
  },
  {
    title: "夜間の毎時冷却データを、そのまま単回帰分析してよい？",
    question:
      "夕方18時から翌朝5時までの毎時気温データ（n=12）を使い、時間tを説明変数、気温Tを目的変数として単回帰分析を行い、冷却速度の有意性を検定したい。何が問題になるでしょうか。",
    answer:
      "時系列データの「自己相関（系列相関）」が問題になります。1時間前の気温と次の時間の気温は強く連続しており、誤差項が独立という回帰分析の前提を満たしません。自己相関を無視して通常の検定を行うと、標準誤差を過小評価し、p値が不当に小さく出てしまいます。",
  },
  {
    title: "「都心より夜涼しい」から「八王子は避暑地」？",
    question:
      "「八王子は都心に比べて熱帯夜が大幅に少ない」という事実だけをもって、「八王子は夏を涼しく快適に過ごせる理想の街だ」と主張できますか。",
    answer:
      "主張できません。夜間は都心より涼しくなりやすい反面、昼間の猛暑日（35℃以上）は都心を大幅に上回っており、昼の熱中症リスクは極めて高くなります。「特定の指標（夜の最低気温）」だけを都合よく切り取って全体の評価を下すのは、統計のチェリーピッキング（偏った抽出）です。",
  },
];

function Lesson({
  title: lessonTitle,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
      <p className="text-xs font-bold tracking-wider text-indigo-700">統計検定2級の視点</p>
      <h3 className="mt-2 text-lg font-bold text-indigo-950">{lessonTitle}</h3>
      <div className="mt-3 space-y-3 text-sm leading-7 text-indigo-950">{children}</div>
    </aside>
  );
}

export default function HachiojiHeatPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: "2026-09-17",
    dateModified: "2026-09-17",
    mainEntityOfPage: canonicalUrl,
    image: "https://bearworks.uk/images/hachioji-heat/hero-illustration.webp",
    author: { "@type": "Person", name: "kuma" },
    publisher: { "@type": "Organization", name: "bearworks.uk", url: "https://bearworks.uk" },
    isBasedOn: heatBundle.attribution.source_url,
  };

  const hRecent = summary.recent_averages_2020_2025;

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />

      <article className="space-y-10 leading-relaxed">
        {/* Hero Section */}
        <header className="overflow-hidden rounded-[2rem] bg-slate-900 text-white">
          <div className="grid items-center lg:grid-cols-2">
            <div className="p-7 md:p-10">
              <p className="mb-4 text-sm font-semibold tracking-widest text-orange-300">
                街のうわさを、統計でほどく · 03
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                昼は灼熱。<br />夜は熱帯夜？<br />
                <span className="text-orange-300">それって、本当？</span>
              </h1>
              <p className="mt-6 text-xl font-semibold">{title}</p>
              <p className="mt-4 text-slate-200">
                「全国最高気温ランキング」の常連・八王子。昼の駅前は猛烈な暑さですが、夜まで都心と同じように息苦しいのでしょうか。
                アメダス八王子と東京都心（大手町/北の丸公園）のデータを突き合わせ、夏の暑さの構造を解き明かします。
              </p>
              <p className="mt-5 text-sm text-orange-200">
                変数の分離・セレクションバイアス・時系列の自己相関。統計検定2級の視点で読み解く夏の気候分析です。
              </p>
            </div>
            <figure>
              <Image
                src="/images/hachioji-heat/hero-illustration.webp"
                width={1536}
                height={1024}
                alt="夏の強い日差しに照らされる八王子の昼の街並みと、澄んだ星空のもと山風が吹く涼やかな夜の街並みの対比イラスト"
                unoptimized
                priority
                className="w-full"
              />
              <figcaption className="px-5 py-3 text-xs text-slate-300">
                導入用のAI生成イラスト。実在の観測機器や特定日時の再現ではありません。
              </figcaption>
            </figure>
          </div>
        </header>

        {/* Conclusion / Summary Cards */}
        <section id="conclusion" className={card} aria-labelledby="answer">
          <p className="text-sm font-bold text-orange-700">まず、データから言えること</p>
          <h2 id="answer" className={`${heading} mt-2`}>
            昼は都心より暑い。でも、夜は圧倒的に涼しい。
          </h2>
          <p className="mt-4">
            「八王子は暑い街」というイメージは、<strong>昼と夜で真っ二つに分かれます</strong>。
            直近6年間（2020〜2025年）の観測データを比較すると、明瞭な逆転現象が浮かび上がりました。
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 p-5 text-orange-800">
              <Sun size={24} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold">猛暑日が多い（昼）</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                {fmt(hRecent.heatstroke_days.hachioji)}
                <span className="ml-1 text-sm font-normal">日/年</span>
              </p>
              <p className="mt-1 text-xs">都心（{fmt(hRecent.heatstroke_days.tokyo)}日）より +6.9日多い</p>
              <p className="mt-3 text-xs text-orange-600">日最高気温35℃以上（2020〜2025年平均）</p>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-5 text-indigo-800">
              <Moon size={24} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold">最低25℃以上が少ない（夜）</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                {fmt(hRecent.min_temp_ge25_days.hachioji)}
                <span className="ml-1 text-sm font-normal">日/年</span>
              </p>
              <p className="mt-1 text-xs">都心（{fmt(hRecent.min_temp_ge25_days.tokyo)}日）より 27.0日少ない</p>
              <p className="mt-3 text-xs text-indigo-600">日最低気温25℃以上（熱帯夜相当）</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <Flame size={24} className="text-orange-400" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold">観測史上最高気温</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight text-orange-300 tabular-nums">
                {summary.all_time_record_high.hachioji.temp}
                <span className="ml-1 text-sm font-normal text-white">℃</span>
              </p>
              <p className="mt-1 text-xs text-slate-300">2018年7月23日 観測</p>
              <p className="mt-3 text-xs text-slate-400">都心歴代最高は 39.5℃（2004年7月20日）</p>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            ※「東京都心」は気象庁観測点「東京」（北の丸公園/旧大手町）を指します。23区全体の平均値ではありません。
            日最低気温25℃以上は24時間日別値による指標です。
          </p>
        </section>

        {/* Navigation */}
        <nav aria-label="記事の目次" className="flex flex-wrap gap-2 text-sm font-semibold text-blue-800">
          {[
            ["contrast", "01 昼と夜の逆転現象"],
            ["hourly", "02 猛暑日の24時間推移"],
            ["cooling", "03 夜間の冷却速度"],
            ["mechanism", "04 なぜ昼暑く夜涼しいのか"],
            ["trend", "05 36年の長期推移"],
            ["quiz", "06 5つの確認問題"],
            ["method", "方法と出典"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-blue-100 bg-white px-4 py-2 transition-colors hover:bg-blue-50"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Section 01: 昼と夜の逆転現象 */}
        <section id="contrast" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>01　「暑さ」を昼と夜に分けると、景色が一変する。</h2>
          <p>
            「八王子は暑い」と言われますが、それは<strong>昼の最高気温</strong>の話です。
            夜の指標である「日最低気温25℃以上（熱帯夜相当）」を並べると、東京都心との関係が完全に逆転します。
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <section className={card}>
              <p className="text-xs font-bold tracking-widest text-orange-700">DAYTIME · 日最高気温35℃以上</p>
              <h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">猛暑日の年間日数</h3>
              <RecentHeatBars metric="heatstroke_days" max={50} tone="warm" />
            </section>

            <section className={card}>
              <p className="text-xs font-bold tracking-widest text-indigo-700">NIGHTTIME · 日最低気温25℃以上</p>
              <h3 className="mb-6 mt-2 text-xl font-bold text-slate-900">最低25℃以上（熱帯夜相当）の日数</h3>
              <RecentHeatBars metric="min_temp_ge25_days" max={50} tone="cool" />
            </section>
          </div>

          <p>
            猛暑日は八王子が年平均<strong>{fmt(hRecent.heatstroke_days.hachioji)}日</strong>で4地点中トップ。
            しかし最低25℃以上の日数は、東京都心が<strong>{fmt(hRecent.min_temp_ge25_days.tokyo)}日</strong>（夏の半分以上が熱帯夜）であるのに対し、
            八王子はわずか<strong>{fmt(hRecent.min_temp_ge25_days.hachioji)}日</strong>しかありません。
          </p>

          <Lesson title="「ひとつの言葉」を測れる変数に分解する">
            <p>
              日常生活で「暑い街」と言うとき、私たちは昼の汗だくになる日差しと、夜の寝苦しい熱帯夜の両方を連想します。
              しかし統計的に分析するときは、「日最高気温」と「日最低気温」という独立した変数に分解することが不可欠です。
            </p>
            <p>
              変数を分けることで、「昼は八王子が厳しいが、夜の寝苦しさは都心のほうがはるかに過酷」という実態が初めて浮き彫りになります。
            </p>
          </Lesson>
        </section>

        {/* Section 02: 猛暑日の24時間推移 */}
        <section id="hourly" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>02　猛暑日の一日。気温はどう動くか。</h2>
          <p>
            では、猛暑の日に八王子と都心の気温は時間とともにどう変化しているのでしょうか。
            観測史上最高気温39.3℃を記録した2018年7月23日をはじめ、近年の猛暑日の1時間値時系列（アメダス観測値）を比較してみます。
          </p>

          <div className={card}>
            <HourlyCaseChart />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <h4 className="font-bold text-orange-900">昼：八王子が急上昇して都心を突き放す</h4>
              <p className="mt-2 text-sm text-orange-950">
                朝8〜9時頃から八王子の気温が急激に上昇。正午から14時頃にかけて38〜39℃前後に達し、都心を1〜3℃上回るピークを作ります。
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <h4 className="font-bold text-indigo-900">夕方〜未明：八王子は急降下、都心は高止まり</h4>
              <p className="mt-2 text-sm text-indigo-950">
                17時を過ぎると八王子は放射冷却と西の山風により急速に低下し、未明には25℃近くまで冷え込みます。
                一方、都心は蓄熱により下がらず、翌朝5時でも30℃近い超熱帯夜になる事例も見られます。
              </p>
            </div>
          </div>

          <Lesson title="代表事例の提示と「セレクションバイアス」">
            <p>
              ここでは「典型的な晴天猛暑日」の事例を提示しました。このような劇的なグラフを見ると、
              「八王子は夏なら毎日必ずこう動く」と思ってしまいがちです。
            </p>
            <p>
              しかし、これは「差が顕著に現れた特定の日」を意図して選んだものです。
              統計学ではこれを<strong>セレクションバイアス（選択の偏り）</strong>と呼びます。
              事例グラフはメカニズムの理解を助けますが、全体の平均的な傾向を評価するには、全期間の母集団データ（次節以降の長期データ）と併せて読む必要があります。
            </p>
          </Lesson>
        </section>

        {/* Section 03: 夜間の冷却速度 */}
        <section id="cooling" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>03　夜の冷え方。冷却速度を数字で比べる。</h2>
          <p>
            日没後の18時から翌朝5時までの11時間で、気温はどれだけ下がったのか。
            先ほどの猛暑日3事例について、「冷却量（℃）」と「1時間あたりの冷却速度（℃/h）」を計算しました。
          </p>

          <CoolingRateComparison />

          <p className="text-sm text-slate-600">
            2023年の事例では、八王子は11時間で<strong>9.3℃低下</strong>（毎時 −0.85℃）したのに対し、都心は<strong>3.1℃</strong>しか下がりませんでした。
            2024年の事例でも、都心はわずか0.8℃しか低下せず、都心ヒートアイランドによる夜間の蓄熱がいかに強固かが分かります。
          </p>

          <Lesson title="時系列データと自己相関">
            <p>
              1時間ごとの気温推移を分析する際、「ある時刻の気温」は「直前の時刻の気温」と強く関連しています。
              これを<strong>自己相関（系列相関）</strong>と呼びます。
            </p>
            <p>
              データが12時間分（12個の観測点）あるからといって、「独立な12個のサンプル」としてt検定や回帰分析にかけることはできません。
              自己相関が存在すると、標準誤差が過小評価され、統計的に有意でない差が有意に見えてしまう「偽りの有意」が生じます。
            </p>
          </Lesson>
        </section>

        {/* Section 04: なぜ昼暑く夜涼しいのか（気候メカニズム） */}
        <section id="mechanism" className={card}>
          <h2 className={heading}>04　なぜ昼は暑く、夜は涼しくなるのか。</h2>
          <p className="mt-4">
            この八王子特有の「昼の灼熱・夜の急降下」は、どのような地理的・気象的メカニズムで生じているのでしょうか。
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-orange-50 p-6">
              <span className="rounded-full bg-orange-200 px-3 py-1 text-xs font-bold text-orange-900">
                昼のメカニズム
              </span>
              <h3 className="mt-3 text-lg font-bold text-orange-950">盆地地形と海風到達の遅れ</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-orange-950">
                <li>
                  <strong>内陸の盆地地形:</strong>{" "}
                  八王子は西と南を山に囲まれた盆地状の地形で、熱がこもりやすく日射による地表面加熱が急激に進みます。
                </li>
                <li>
                  <strong>東京湾からの海風遅延:</strong>{" "}
                  夏の日中、都心には東京湾から比較的冷涼な「海風」がいち早く入り、気温上昇にブレーキがかかります。
                  しかし八王子は内陸深くにあるため海風前線の到達が遅れ、午後まで昇温が続きます。
                </li>
                <li>
                  <strong>西武・多摩の風の収束:</strong>{" "}
                  南風と東風がぶつかる内陸収束帯が形成され、暖気が滞留しやすいことも最高気温を押し上げます。
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-6">
              <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-bold text-indigo-900">
                夜のメカニズム
              </span>
              <h3 className="mt-3 text-lg font-bold text-indigo-950">放射冷却と山風 vs 都心のヒートアイランド</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-indigo-950">
                <li>
                  <strong>活発な放射冷却:</strong>{" "}
                  内陸で晴天の夜は、地表の熱が赤外線として宇宙空間へ逃げる「放射冷却」が強く働きます。
                </li>
                <li>
                  <strong>陣馬・高尾山系からの山風（冷気流）:</strong>{" "}
                  夜間に山頂や斜面で冷やされた重い空気が、谷沿いや川沿いを通って市街地へ流れ込みます。
                </li>
                <li>
                  <strong>都心のコンクリート蓄熱と人工排熱:</strong>{" "}
                  一方の都心は、高層ビルやアスファルトが昼間に蓄えた膨大な熱を夜間に放出し続け、エアコンの排熱も加わるため、夜になっても気温がほとんど下がりません。
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 05: 36年の長期推移 */}
        <section id="trend" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>05　過去36年で、夏の暑さはどう変わったか。</h2>
          <p>
            気象庁の1990年から2025年までの36年間の日別観測データから、八王子と東京都心の「猛暑日」と「最低25℃以上日」の推移をたどります。
          </p>

          <div className={card}>
            <AnnualTrendChart />
          </div>

          <p>
            1990年代は八王子でも猛暑日は年10日前後でしたが、近年は年20〜30日超が常態化し、2025年には過去最多の<strong>46日</strong>を記録しました。
            一方、最低25℃以上（熱帯夜）に関しては、36年間の一貫した傾向として<strong>東京都心が八王子を常に大きく上回っています</strong>。
          </p>

          <Lesson title="長期傾向と観測環境の「均質性」">
            <p>
              30年以上の長期データを比較するとき、忘れてはならないのが<strong>観測環境の均質性（ホモジニティ）</strong>です。
            </p>
            <p>
              気象庁の「東京」地点は、2014年12月に大手町から北の丸公園へ移設されました。
              緑豊かな公園へ移ったことで、移設直後は都心の気温がやや低めに出る環境変化がありました。
              長期の時系列グラフを見る際は、単に地球温暖化や都市化だけでなく、観測点自体の移設や周辺環境の変化も考慮する必要があります。
            </p>
            <Link href="/toukei/guides/sampling-and-bias" className="inline-block font-semibold text-blue-800 underline">
              観測データの偏りとサンプリングを復習する →
            </Link>
          </Lesson>
        </section>

        {/* Section 06: 確認問題（5問） */}
        <section id="quiz" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>06　グラフの読み方を、5問で確かめる。</h2>
          <p>
            データから言えることと、言ってはいけないこと。
            統計検定2級の考え方に基づいて、5つの問いを考えてみましょう。
          </p>

          {quizzes.map((quiz, index) => (
            <section key={quiz.title} className={card}>
              <p className="text-sm font-bold text-orange-700">QUESTION {String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{quiz.title}</h3>
              <p className="mt-3">{quiz.question}</p>
              <details className="mt-4 rounded-xl bg-slate-50 p-4">
                <summary className="cursor-pointer font-semibold text-blue-800">答えと考え方を見る</summary>
                <p className="mt-3 text-sm leading-7 text-slate-700">{quiz.answer}</p>
              </details>
            </section>
          ))}
        </section>

        {/* 方法・再現性・出典 */}
        <section id="method" className={`${card} scroll-mt-6`}>
          <h2 className={heading}>方法・再現性・出典</h2>
          <p className="mt-4">
            気象庁アメダス八王子（地点番号44112）および東京官署（地点番号44132）の公式オープンデータ（1990年〜2025年の日別値、および代表日の1時間値）を使用しています。
            データはビルド時にSHA-256ハッシュおよび集計整合性を検証しています。
          </p>

          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm">
            <li>集計には気象庁の品質コード8（正常値）を採用しています。</li>
            <li>直近6年平均は2020〜2025年の暦年集計の単純算術平均です。</li>
            <li>
              「熱帯夜」の学術的定義は「夜間の最低気温が25℃以上」ですが、長期日別統計では「日最低気温が25℃以上の日」を熱帯夜相当指標として用いています。
            </li>
            <li>
              24時間推移データは気象庁「過去の気象データ・ダウンロード」の公式1時間値CSVより取得し、固定JSONバンドルとして収録しています。
            </li>
          </ul>

          <details className="mt-6 rounded-2xl bg-slate-50 p-5">
            <summary className="cursor-pointer font-bold text-slate-900">固定データのバージョンと検証情報</summary>
            <dl className="mt-4 space-y-3 break-all text-sm">
              <div>
                <dt className="font-bold">データ版 / スキーマ</dt>
                <dd>
                  {heatLock.bundle_version} / {heatLock.bundle_schema_version}
                </dd>
              </div>
              <div>
                <dt className="font-bold">SHA-256</dt>
                <dd className="font-mono text-xs">{heatLock.bundle_sha256}</dd>
              </div>
              <div>
                <dt className="font-bold">ファイルサイズ</dt>
                <dd className="font-mono text-xs">{heatLock.bundle_byte_size.toLocaleString()} bytes</dd>
              </div>
            </dl>
          </details>

          <p className="mt-6 text-sm">出典：{heatBundle.attribution.processing_ja}。</p>
          <ul className="mt-4 space-y-2 text-sm font-semibold text-blue-800">
            <li>
              <a className="underline" href={heatBundle.attribution.source_url}>
                気象庁：過去の気象データ・ダウンロード
              </a>
            </li>
            <li>
              <a className="underline" href="https://www.toukei-kentei.jp/grade/grade2/">
                統計検定2級：出題範囲（学習分野の参照）
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://github.com/kumakit/bearworks-portal/blob/main/scripts/validate-hachioji-heat-bundle.mjs"
              >
                公開データの検証コード（GitHub）
              </a>
            </li>
          </ul>
        </section>

        {/* ContentProvenance */}
        <ContentProvenance provenance={hachiojiHeatProvenance} />

        {/* シリーズ回遊セクション */}
        <section className="overflow-hidden rounded-3xl bg-slate-900 text-white">
          <div className="p-7 md:p-10">
            <p className="text-sm font-bold tracking-wider text-orange-300">街のうわさを、統計でほどく シリーズ</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">八王子の気候を、もっと深く知る</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/labs/hachioji-climate"
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500"
              >
                <p className="text-xs font-bold text-orange-300">第1弾</p>
                <h3 className="mt-1 text-base font-bold group-hover:text-orange-200">
                  八王子は本当に夏暑く、冬寒いのか →
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  昼夜の気温差、冬日の頻度、府中・青梅との4地点比較を検証したシリーズ原点。
                </p>
              </Link>

              <Link
                href="/labs/hachioji-snow"
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500"
              >
                <p className="text-xs font-bold text-sky-300">第2弾</p>
                <h3 className="mt-1 text-base font-bold group-hover:text-sky-200">
                  雪のニュース。また、八王子だ。 →
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  「都心は雨、八王子は雪」の真相を降水時時間値・箱ひげ図・大雪4事例で検証。
                </p>
              </Link>

              <Link
                href="/labs/takao-gear"
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500"
              >
                <p className="text-xs font-bold text-emerald-300">第4弾</p>
                <h3 className="mt-1 text-base font-bold group-hover:text-emerald-200">
                  高尾山に山装備は本当に必要か →
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  標高599mの体感温度ギャップ、年間装備必須日数を判定するシミュレーター。
                </p>
              </Link>

              <Link
                href="/labs/takao-weather-shift"
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500"
              >
                <p className="text-xs font-bold text-amber-300">第5弾</p>
                <h3 className="mt-1 text-base font-bold group-hover:text-amber-200">
                  高尾山頂はなぜガスるのか？ →
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  平野晴天でも山頂は濃霧。「見せかけの晴れ（年34日）」と午後急変リスクを解明。
                </p>
              </Link>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/toukei"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50"
          >
            統計検定2級の学習トップへ
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </article>

      <PublicSiteFooter />
    </main>
  );
}
