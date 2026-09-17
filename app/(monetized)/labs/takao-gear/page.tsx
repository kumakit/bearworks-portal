import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Compass, ShieldAlert, Sparkles, Thermometer, Wind } from "lucide-react";
import Link from "@/components/InternalLink";
import ContentProvenance from "@/components/ContentProvenance";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { ApparentTempGapChart, GearDaysCountChart } from "@/components/TakaoGearCharts";
import TakaoGearSimulator from "@/components/TakaoGearSimulator";
import { takaoGearProvenance } from "@/lib/content-provenance";
import {
  fmt,
  gearDaysSummary,
  monthlyComparison,
  routes,
  takaoGearBundle,
  takaoGearLock,
} from "@/lib/takao-gear-publication";

const canonicalUrl = "https://bearworks.uk/labs/takao-gear";
const title = "高尾山に山装備は本当に必要か ― 気象データとルートで判定する装備シミュレーター ―";
const card = "rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl font-bold tracking-tight text-slate-900 md:text-3xl";

export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description:
    "「スニーカーで登れる？ 本格登山靴が必要？」 高尾山（標高599m）の気象データ（Open-Meteo標高モデル・アメダス八王子）から、風速冷却・標高減率・年間装備必須日数を定量化。ルート別装備シミュレーターと統計検定2級の視点で読み解きます。",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title,
    description: "街の軽装と、山の現実。高尾山の気候ギャップを、統計とデータでほどく。",
    siteName: "bearworks.uk",
    images: ["/images/takao-gear/hero-illustration.webp"],
  },
};

const quizzes = [
  {
    title: "「標高599mの低山だから気温は街とほぼ同じ」と言える？",
    question:
      "高尾山は標高599mとスカイツリー（634m）より低いため、麓（八王子駅前や都心）と気温や体感温度はほとんど変わらないと言えるでしょうか。",
    answer:
      "言えません。気温減率（約0.6℃/100m）により標高差476mで約2.9℃気温が低下します。さらに山頂は開けており平均3〜5m/sの風が吹くため、風速冷却（1m/sあたり体感約1℃低下）が加わり、麓との体感温度差は年間を通じて4〜6℃（悪天候時は8℃以上）も低くなります。街が20℃の過ごしやすい陽気でも、山頂は13℃前後の冷え込みとなります。",
  },
  {
    title: "「1号路でスニーカーで登れたから、6号路もスニーカーで平気」？",
    question:
      "以前、晴天の日に1号路を普通のスニーカーで快適に登頂できました。同じ感覚で6号路や稲荷山コースもスニーカーで問題なく登れると判断してよいでしょうか。",
    answer:
      "判断してはいけません。1号路は全線がアスファルトやコンクリートで舗装されていますが、6号路は沢沿いの未舗装路で飛び石やぬかるみがあり、稲荷山コースは木の根と赤土（関東ローム層）の山道です。「同じ山だから路面条件も同じ」と仮定するのは、交絡要因（路面舗装率・地質）を無視した誤った一般化（オーバーゼネラライゼーション）です。",
  },
  {
    title: "雨が止んで晴れていれば、登山靴は不要？",
    question:
      "前日に大雨が降りましたが、登山当日は快晴です。雨が降っていないならレインウェアや防水登山靴は持たずに身軽に出発してよいでしょうか。",
    answer:
      "よくありません。未舗装の山道（特に稲荷山コースや6号路）は、前日の雨が地中に保水され、翌日の日中も赤土が粘土状にぬかるみます。また、日陰や沢沿いは乾きにくく、晴れていてもスニーカーでは猛烈にスリップして転倒事故につながります。天候判断は「当日の現在値」だけでなく「前日降水量（ラグ効果）」を加味する必要があります。",
  },
  {
    title: "「過去に軽装でトラブルがなかった人」の体験談は信頼できる？",
    question:
      "SNSで「冬の高尾山にスニーカーと薄手のパーカーで行ったけど全然余裕だった」という投稿を複数見かけました。これは安全性の根拠として十分でしょうか。",
    answer:
      "不十分です。これは典型的な「生存者バイアス（Survivorship Bias）」です。天候が極めて穏やかだった幸運な事例や、無事に帰還できた人の声だけが可視化されており、同じ軽装で低体温症寸前になったり怪我・救助要請に至った事例、途中で引き返した事例はSNSで語られにくい傾向があります。意思決定の根拠には主観的体験談ではなく母集団の気象確率データを使うべきです。",
  },
  {
    title: "高尾山で最も遭難・救助要請が多い原因は滑落・転落？",
    question:
      "日本アルプスのような険しい山岳と同様に、高尾山でも滑落・転落が最大の遭難要因でしょうか。",
    answer:
      "異なります。東京都心近郊の低山で非常に多い遭難原因は「日没による行動不能（道迷い・暗闇）」と「軽装による疲労・低体温・下山困難」です。麓が明るいため遅い時間に出発し、山中の日没の早さ（樹林帯は16時で急速に暗転）や寒暖差を想定できず、ヘッドランプや防寒具を持たずに下山できなくなる事例が多発しています。",
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
    <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 md:p-6">
      <p className="text-xs font-bold tracking-wider text-emerald-800">統計検定2級の視点</p>
      <h3 className="mt-2 text-lg font-bold text-emerald-950">{lessonTitle}</h3>
      <div className="mt-3 space-y-3 text-sm leading-7 text-emerald-950">{children}</div>
    </aside>
  );
}

export default function TakaoGearPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: "2026-09-17",
    dateModified: "2026-09-17",
    mainEntityOfPage: canonicalUrl,
    image: "https://bearworks.uk/images/takao-gear/hero-illustration.webp",
    author: {
      "@type": "Person",
      name: "kuma",
      url: "https://bearworks.uk/about",
    },
    publisher: {
      "@type": "Organization",
      name: "bearworks.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://bearworks.uk/images/bearworks-badge.webp",
      },
    },
    description:
      "高尾山の気象データ（標高599m・風速冷却・標高減率）に基づく装備シミュレーターとデータ検証記事。",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicSiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-slate-700">高尾山装備シミュレーター</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            街のうわさを、統計でほどく · 04
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl md:leading-[1.15]">
            高尾山に山装備は本当に必要か
            <span className="mt-2 block text-xl font-bold text-emerald-700 md:text-3xl">
              ― 気象データとルートで判定する装備シミュレーター ―
            </span>
          </h1>

          <p className="text-base leading-relaxed text-slate-600 md:text-lg">
            ミシュラン三ツ星の観光地として親しまれ、世界最多の登山者数を誇る高尾山（標高599m）。
            「スニーカーや普段着で登れるのか？ それとも本格的な登山装備が必要なのか？」という議論は絶えません。
            Open-Meteoの標高指定気象モデルとアメダス八王子の実測データから、標高減率・風速による体感温度低下・泥濘化リスクを定量化し、
            あなたの登山計画に最適な装備とレイヤリングを判定します。
          </p>

          <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <Image
              src="/images/takao-gear/hero-illustration.webp"
              width={1536}
              height={1024}
              alt="賑わう高尾山の麓の観光参道と、防寒・登山装備で山頂から富士山を望む登山者の対比イラスト"
              unoptimized
              priority
              className="w-full"
            />
            <figcaption className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">
              麓の観光地的な雰囲気（スニーカー・軽装）と、風速冷却・急坂・泥濘が待つ山頂・山道エリアの環境対比
            </figcaption>
          </figure>
        </header>

        {/* 結論サマリーカード */}
        <section className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-900 p-6 text-white md:p-8">
          <p className="text-xs font-bold tracking-widest text-emerald-300">
            DATA SUMMARY · 3つの結論
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-emerald-800/80 p-4">
              <span className="text-xs font-bold text-emerald-300">① 体感温度ギャップ</span>
              <p className="mt-1 text-2xl font-black text-white">-4℃ 〜 -6℃</p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100">
                標高差476mによる気温減率（約-2.9℃）と山頂の平均風速（3〜5m/s）により、麓より常に1枚分以上寒い環境です。
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-800/80 p-4">
              <span className="text-xs font-bold text-emerald-300">② 防寒着が必要な日</span>
              <p className="mt-1 text-2xl font-black text-white">年 167 日（46%）</p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100">
                山頂の昼体感温度が10℃を下回る日は年間45.6%に達し、11月〜4月は防寒シェルや中間着の携行が必須です。
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-800/80 p-4">
              <span className="text-xs font-bold text-emerald-300">③ 靴の境界線</span>
              <p className="mt-1 text-2xl font-black text-white">舗装路 vs 未舗装路</p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100">
                1号路はスニーカーOKですが、6号路（沢・増水）や稲荷山（赤土粘土質）は前日の雨で猛烈に滑るため登山靴が不可欠です。
              </p>
            </div>
          </div>
        </section>

        {/* セクション01: インタラクティブ装備シミュレーター */}
        <section className="mt-12 space-y-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              01
            </span>
            <h2 className={heading}>高尾山 装備チェッカー（シミュレーター）</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            予定している登山月、時間帯、登るルート、天候を選択してください。
            気象モデルの標高補正値に基づき、山頂の予想体感温度、おすすめレイヤリング、必要な持ち物チェックリストをリアルタイムに算出します。
          </p>

          <TakaoGearSimulator initialMonth={10} />
        </section>

        {/* セクション02: データ検証① 体感温度ギャップ */}
        <section className={`mt-12 space-y-6 ${card}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              02
            </span>
            <h2 className={heading}>標高599mと風速がつくる「体感温度ギャップ」</h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            高尾山は標高599m。東京スカイツリー（634m）より低い低山ですが、気象学的な環境は平地とは明確に異なります。
            物理的な気温差と体感温度の低下をもたらす2大要因を分解してみましょう。
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Thermometer className="h-5 w-5" />
                <h3 className="font-bold">1. 気温減率（標高効果）</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                大気は上空ほど気圧が低く膨張冷却するため、乾燥断熱減率（約1℃/100m）と湿潤断熱減率（約0.5℃/100m）の間で平均して
                <strong>100mにつき約0.6℃〜0.65℃低下</strong>します。
                八王子市街地（標高123m）から山頂（599m）までの標高差476mでは、常に<strong>約2.9℃〜3.1℃</strong>気温が低くなります。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Wind className="h-5 w-5" />
                <h3 className="font-bold">2. 風速冷却（ミスナール効果）</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                山頂は開けた地形のため、平地よりも平均風速が強くなります。オーストラリア気象局(BOM)やミスナールの体感温度式が示す通り、
                <strong>風速1m/sごとに体感温度は約1℃低下</strong>します。山頂で風速4m/sが吹くと、体感温度は気温よりさらに約3〜4℃奪われます。
              </p>
            </div>
          </div>

          <ApparentTempGapChart />

          <Lesson title="気温と体感温度：2つの異なるスケールを混同しない">
            <p>
              「天気予報で八王子は18℃だから、長袖Tシャツ1枚で大丈夫だろう」と出発し、山頂で寒さに震える人が後を絶ちません。
              これは、天気予報の<strong>「百葉箱（地上1.5m・無風・日陰）の気温」</strong>と、
              人間が野外で感じる<strong>「風速・日射・湿度を含んだ体感温度（Apparent Temperature）」</strong>を混同する認知的錯誤です。
            </p>
            <p>
              グラフのとおり、4月や10月の行楽シーズンであっても、麓が18℃前後の快適な気候のとき、山頂の体感温度は10℃〜12℃まで低下します。
              立ち止まって休憩すると汗冷えも重なり、実質的な体感は一桁台まで落ち込みます。「麓の気温からマイナス5℃」を標準装備の前提とすることが安全の第一歩です。
            </p>
          </Lesson>
        </section>

        {/* セクション03: データ検証② 年間何日山装備が必要か */}
        <section className={`mt-12 space-y-6 ${card}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              03
            </span>
            <h2 className={heading}>「山装備が必要な日」は年間何日あるか？</h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            「本格的な山装備が必要になるのは厳冬期や嵐の日だけ」と思われがちです。
            しかし、高尾山頂の通年データ（366日）から各装備の必要基準を判定したところ、驚くべき結果が得られました。
          </p>

          <GearDaysCountChart />

          <div className="space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              <strong>1. 防寒着必須日（年間167日・45.6%）:</strong>
              11月から4月上旬にかけては、晴れていても山頂の体感温度が10℃を下回る日が集中します。
              特に12月〜2月はほぼ100%の日で防寒着（フリースや軽量ダウン）が必須となります。
            </p>
            <p>
              <strong>2. レインウェア必須日（年間174日・47.5%）:</strong>
              日降水量1mm以上を観測した日は年間174日に上ります。山の天気は変わりやすく、都心では降っていなくても山沿い特有の局地的な降水や霧雨が発生します。
              レインウェアは雨を防ぐだけでなく、強風時の防風シェルとしても機能するため、携行率100%が望まれます。
            </p>
            <p>
              <strong>3. 軽アイゼン警戒日（年間22日・6.0%）:</strong>
              「高尾山でアイゼン？」と驚く方も多いですが、12月〜2月の降雪・降水後に氷点下へ冷え込むと、日陰の階段や木の根、舗装路の吹き溜まりがカチカチに凍結します。
              年に約20日前後はチェーンスパイクや軽アイゼンがないと安全に下山できない「アイスバーン日」が発生しています。
            </p>
          </div>
        </section>

        {/* セクション04: ルート別環境解剖 */}
        <section className={`mt-12 space-y-6 ${card}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              04
            </span>
            <h2 className={heading}>ルート別環境解剖 ― なぜ未舗装路でスニーカーが破綻するのか</h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            高尾山には複数の登山コースがあり、それぞれ路面性状やリスク要因が全く異なります。
            「スニーカーで登れる」という言説が当てはまるのは、実は全ルート中ごく一部に過ぎません。
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {routes.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                    r.difficulty === "beginner"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.difficulty === "intermediate"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {r.difficulty === "beginner" ? "初級" : r.difficulty === "intermediate" ? "中級" : "上級"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2">
                    <span className="text-slate-400">距離</span>
                    <p className="font-bold text-slate-800">{r.distance_km}km</p>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="text-slate-400">舗装率</span>
                    <p className="font-bold text-slate-800">{(r.paved_ratio * 100).toFixed(0)}%</p>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="text-slate-400">標準タイム</span>
                    <p className="font-bold text-slate-800">約{r.estimated_time_up_min}分</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-slate-700"><strong>通常時:</strong> {r.footwear_normal}</p>
                  <p className="text-rose-700"><strong>雨天・雨後:</strong> {r.footwear_rain}</p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">{r.features}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-xs leading-relaxed text-amber-950">
            <h4 className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              赤土（関東ローム層）の罠に注意
            </h4>
            <p className="mt-1">
              高尾山の未舗装コース（特に稲荷山コース）は、火山灰由来の赤土（関東ローム層）で覆われています。
              この土質砂質土と異なり、水を含むと極めて粘り気が強くなり、靴底の浅いスニーカーの溝を一瞬で埋め尽くします。
              溝が埋まったスニーカーは摩擦係数が極端に低下し、濡れた粘土の上で氷のように滑ります。下り坂での転倒・骨折事故の多くがこのメカニズムで発生しています。
            </p>
          </div>
        </section>

        {/* セクション05: 統計検定2級の視点 / 認知バイアス */}
        <section className={`mt-12 space-y-6 ${card}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              05
            </span>
            <h2 className={heading}>統計思考で防ぐ、登山の認知バイアス</h2>
          </div>

          <div className="space-y-4">
            <Lesson title="1. 正常性バイアスとアンカリング効果">
              <p>
                「駅前にコンビニがあり、ケーブルカーが動いている」という光景は、人間に「ここは街の延長である」という強烈な<strong>アンカリング（初頭認知の固定化）</strong>を植え付けます。
                その結果、山頂の急激な気象変化や日没の暗闇といった客観的リスクを「大したことない」と過小評価する<strong>正常性バイアス</strong>が作動します。
              </p>
              <p>
                「観光地的高尾山」と「自然山岳の高尾山」は物理的に地続きです。標高400mを超えれば、気温減率や風速冷却といった自然の物理法則は日本アルプスと何ら変わりません。
              </p>
            </Lesson>

            <Lesson title="2. 条件付き確率の急変：P(事故 | 軽装 ∩ 雨後)">
              <p>
                晴天・舗装路（1号路）における事故発生率 P(事故 | 晴天 ∩ 舗装路) は極めて微小です。
                しかし、条件が「未舗装路（6号路・稲荷山）」かつ「前日降水あり」かつ「スニーカー」となった瞬間、
                条件付き確率 P(事故 | 雨後 ∩ 未舗装 ∩ スニーカー) は何桁も跳ね上がります。
              </p>
              <p>
                「無事故だった経験」の多くは、最も安全な条件（晴天・1号路）という特定の前提に支えられた記述的観察に過ぎません。前提条件が変わったときに確率がどう遷移するかを計算するのが統計的リスク管理です。
              </p>
            </Lesson>
          </div>
        </section>

        {/* セクション06: 確認問題（5問） */}
        <section className={`mt-12 space-y-6 ${card}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              06
            </span>
            <h2 className={heading}>理解度をチェックする確認問題（5問）</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            高尾山の気象特性、装備の必要性、統計的リスク判断に関する確認問題です。各設問をクリックすると解説が表示されます。
          </p>

          <div className="space-y-4">
            {quizzes.map((quiz, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                      Q{idx + 1}
                    </span>
                    {quiz.title}
                  </span>
                  <span className="text-xs text-slate-400 group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900">{quiz.question}</p>
                  <div className="mt-3 rounded-xl bg-white p-4 text-xs leading-relaxed text-slate-600 border border-slate-100">
                    <p className="font-bold text-emerald-800 mb-1">【解説】</p>
                    {quiz.answer}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* データ出典・検証コード */}
        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-900">データ出典と計算の透明性</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            本記事およびシミュレーターで使用している気象指標は、Open-Meteo Historical Weather API（高尾山頂 緯度35.6251, 経度139.2437, 標高599m）および気象庁アメダス八王子観測所のデータに基づき算出・集計しています。
            集計データは固定JSONバンドル（{takaoGearLock.bundle_file}、バイト数: {takaoGearLock.bundle_byte_size} bytes、SHA-256: {takaoGearLock.bundle_sha256.slice(0, 16)}...）としてリポジトリ内で固定管理され、毎回のビルド時に整合性テストが実施されています。
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-emerald-800">
            <li>
              <a
                className="underline hover:text-emerald-950"
                href="https://github.com/kumakit/bearworks-portal/blob/main/scripts/validate-takao-gear-bundle.mjs"
              >
                公開データの検証コード（GitHub）
              </a>
            </li>
            <li>
              <a
                className="underline hover:text-emerald-950"
                href="https://open-meteo.com/"
              >
                Open-Meteo Weather API
              </a>
            </li>
          </ul>
        </section>

        {/* ContentProvenance */}
        <div className="mt-10">
          <ContentProvenance provenance={takaoGearProvenance} />
        </div>

        {/* シリーズ回遊セクション */}
        <section className="mt-12 overflow-hidden rounded-3xl bg-slate-900 text-white">
          <div className="p-7 md:p-10">
            <p className="text-sm font-bold tracking-wider text-emerald-300">街のうわさを、統計でほどく シリーズ</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">八王子の気候と統計を、もっと深く知る</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
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
                href="/labs/hachioji-heat"
                className="group block rounded-2xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-500"
              >
                <p className="text-xs font-bold text-amber-300">第3弾</p>
                <h3 className="mt-1 text-base font-bold group-hover:text-amber-200">
                  八王子の夏は本当に暑いのか →
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  昼の猛暑日と夜の放射冷却。都心ヒートアイランドとの冷却カーブ対比を検証。
                </p>
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/toukei"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50"
          >
            統計学習コンテンツ（toukei）一覧へ戻る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
