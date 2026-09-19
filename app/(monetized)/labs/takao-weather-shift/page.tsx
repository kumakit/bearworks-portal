import type { Metadata } from "next";
import { takaoWeatherBundle, takaoWeatherLock } from "@/lib/takao-weather-publication";
import { takaoWeatherShiftProvenance } from "@/lib/content-provenance";
import { TakaoWeatherRiskMeter } from "@/components/TakaoWeatherRiskMeter";
import { TakaoWeatherCharts } from "@/components/TakaoWeatherCharts";
import InternalLink from "@/components/InternalLink";

export const metadata: Metadata = {
  title: "高尾山頂はなぜガスるのか？ 標高599mの天候急変メカニズムと「見せかけの晴れ」をデータで解明する | bearworks.uk",
  description:
    "高尾山は標高599mの低山なのに、なぜ天候が急変するのか？Open-Meteoとアメダスの時間別気象データから、平野晴天でも山頂が濃霧になる「見せかけの晴れ（年34日）」や夏の午後急変確率、冬の雨雪境界を定量検証。",
  alternates: {
    canonical: "https://bearworks.uk/labs/takao-weather-shift",
  },
  openGraph: {
    title: "高尾山頂はなぜガスるのか？ 標高599mの天候急変メカニズムと「見せかけの晴れ」をデータで解明する",
    description:
      "平野は晴れ予報なのに山頂は濃霧・小雨。年間34日発生する天候乖離と、夏の午後急変確率・冬の雨雪境界を2024年の気象観測データから徹底検証。",
    url: "https://bearworks.uk/labs/takao-weather-shift",
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "article",
    images: [
      {
        url: "https://bearworks.uk/images/takao-weather-shift/hero-illustration.webp",
        width: 1264,
        height: 848,
        alt: "高尾山頂の天候急変と濃霧（ガス）のイメージイラスト",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "高尾山頂はなぜガスるのか？ 標高599mの天候急変と「見せかけの晴れ」を検証",
    description: "平野は晴れでも山頂はガス。年間34日の天候乖離と午後の急変リスクをデータで可視化。",
    images: ["https://bearworks.uk/images/takao-weather-shift/hero-illustration.webp"],
  },
};

const quizItems = [
  {
    id: "q1",
    question: "問1: 平野部（八王子市街地）が晴天であるにもかかわらず、高尾山頂（599m）で濃霧（ガス）が発生する主な気象学的メカニズムとして、最も適切なものはどれですか？",
    options: [
      "A. 平野部のアスファルト蓄熱によって夜間に逆転層が形成され、冷気が山頂へ吹き上がるため",
      "B. 東京湾・相模湾からの湿潤気流が山肌に衝突して強制上昇し、断熱膨張によって露点温度に達するため（地形性上昇気流）",
      "C. 山頂の樹木による蒸散作用のみによって局所的な水蒸気圧が急激に飽和するため",
      "D. 標高500m以上では気圧低下に伴い水分子の結合力が強まり、自動的に凝結するため",
    ],
    answer: "B",
    explanation:
      "正解はBです。湿った南〜南東風が平野部を横断して高尾山地に衝突すると、山肌に沿って強制的に上昇します（Orographic Lift）。空気塊が上昇すると気圧低下により断熱膨張を起こし、100mあたり約0.65℃気温が下がります。平野部では雲底高度に達しない水蒸気も、山腹〜山頂の標高で露点温度に達して飽和し、局地的な濃霧（ガス）を形成します。",
  },
  {
    id: "q2",
    question: "問2: 2024年の観測データにおいて、八王子市街地で「降水量0mm かつ 雲量50%以下（晴天）」であったにもかかわらず、高尾山頂で湿度90%以上の濃霧が日中継続した「見せかけの晴れ」は年間何日観測されましたか？",
    options: [
      "A. 年間 3日（ほぼ稀な異常気象）",
      "B. 年間 12日（月に1日程度）",
      "C. 年間 34日（年間の約1割、初夏・秋雨期に集中）",
      "D. 年間 120日（全体の3分の1以上）",
    ],
    answer: "C",
    explanation:
      "正解はCです。2024年の全8,784時間解析において、平野晴天かつ山頂ガスの「見せかけの晴れ」は年間34日観測されました。特に南風が湿気をもたらす6月（7日）、7月（6日）、9月（5日）に集中しており、平野部の天気予報で「晴れマーク」が出ているからと軽装で登ると山頂で視界不良・ガス濡れに遭遇する現実が統計的に示されています。",
  },
  {
    id: "q3",
    question: "問3: 統計的検定における「偽陰性（Type II Error）」の考え方を登山の天候判断に当てはめた場合、最も注意すべき事象はどれですか？",
    options: [
      "A. 雨予報だったため登山を中止したが、実際には快晴だった（安全側の判断ミス）",
      "B. 一般の天気予報（平野晴れ）を信じて軽装で登ったが、山頂は濃霧・急変で危険な状態だった（危険を見逃す判断ミス）",
      "C. 登山靴を履いて登ったが、登山道が完全に乾燥していてスニーカーでも十分だった",
      "D. 雨具を携帯していたが、一日中雨が降らなかった",
    ],
    answer: "B",
    explanation:
      "正解はBです。統計学において偽陰性（Type II Error）とは「危険・異常が存在する（帰無仮説が偽）にもかかわらず、それを見逃して陰性（安全・正常）と判定してしまう誤り」です。登山において『平野晴れの予報を見て山も晴れ（安全）と判定したが、山頂は悪天候（危険）だった』という事象はまさに偽陰性であり、重大な遭難リスクに直結します。",
  },
  {
    id: "q4",
    question: "問4: 雨量計には現れない「ガス濡れ（湿潤沈着）」が登山者の低体温症を引き起こしやすい物理的な理由として、最も適切なものはどれですか？",
    options: [
      "A. 霧の水滴は氷点下で過冷却状態になっているため、触れると瞬時に凍結するから",
      "B. 水分の熱伝導率は空気の約25倍であり、衣類が濡れると風速冷却（気化熱・伝導）によって体熱が急速に奪われるから",
      "C. 霧の中では気圧が極端に低くなり、血液の循環速度が半分に落ちるから",
      "D. 霧の粒子には塩分が含まれており、浸透圧によって皮膚の水分が失われるから",
    ],
    answer: "B",
    explanation:
      "正解はBです。水の熱伝導率は乾いた空気の約25倍高いため、服が濡れると体温が外気へ急速に奪われます。さらに山頂の風（平均3〜5m/s）が吹きつけると気化熱によって体感温度がさらに低下し、気温15℃前後の初夏・秋でも低体温症を発症します。雨が降っていなくてもガスの中で行動する際は、撥水・防水シェル（レインウェア）の着用が不可欠です。",
  },
  {
    id: "q5",
    question: "問5: 冬季（12〜2月）に八王子市街地で気温3℃・冷たい雨が降っているとき、高尾山頂（599m）の天候として統計・気象学的に最も警戒すべき状態はどれですか？",
    options: [
      "A. 雲海が発生して山頂は快晴のポカポカ陽気になっている",
      "B. 標高差476mの気温減率（約-2.9℃）により山頂気温が0℃前後の湿雪となり、夜間に氷点下アイスバーン化する",
      "C. 気圧が高まり、山頂のみ温暖前線が通過して気温が15℃まで急上昇する",
      "D. 風が完全に止まり、一切の降水が消滅する",
    ],
    answer: "B",
    explanation:
      "正解はBです。標高差476mによる気温低下（湿潤断熱減率で約-2.5〜-3.0℃）により、八王子市街地が2〜4℃の雨のとき、高尾山頂は0℃付近の雪・みぞれとなります。さらに夕方以降の冷え込みで凍結し、未舗装路や薬王院の石段がツルツルに凍りつく「雨雪境界・アイスバーン」が発生するため、チェーンスパイク（軽アイゼン）が必須となります。",
  },
];

export default function TakaoWeatherShiftPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "高尾山頂はなぜガスるのか？ 標高599mの天候急変メカニズムと「見せかけの晴れ」をデータで解明する",
    description:
      "高尾山頂（標高599m）における気象急変・ガス発生リスクおよび平野部（八王子）との天候乖離（見せかけの晴れ）を2024年の1時間値データから定量検証した分析記事。",
    image: ["https://bearworks.uk/images/takao-weather-shift/hero-illustration.webp"],
    datePublished: "2026-09-17T23:00:00+09:00",
    dateModified: "2026-09-17T23:00:00+09:00",
    author: {
      "@type": "Person",
      name: "kuma",
    },
    publisher: {
      "@type": "Organization",
      name: "bearworks.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://bearworks.uk/icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://bearworks.uk/labs/takao-weather-shift",
    },
  };

  return (
    <article className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Container */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Series Badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              街のうわさを、統計でほどく · 06
            </span>
            <span className="text-xs text-slate-500">気象データ分析シリーズ</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl sm:leading-tight">
            高尾山頂はなぜガスるのか？<br />
            標高599mの天候急変メカニズムと「見せかけの晴れ」をデータで解明する
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
            「平野部は快晴の予報だったのに、山頂に着いたら真っ白な濃霧で衣服が濡れた……」<br />
            都心から1時間で行ける観光地・高尾山（標高599m）で頻発する<strong>天候の急変・濃霧（ガス）発生</strong>の謎を、Open-Meteoの標高モデルおよびアメダス八王子の2024年1時間値データ（計8,784時間）から徹底検証しました。
          </p>

          {/* Meta Info Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span>執筆：kuma / bearworks.uk</span>
              <span>•</span>
              <span>公開：2026-09-17</span>
              <span>•</span>
              <span>検証データ：2024年全時間（8,784レコード）</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              bundle: takao-weather-shift-2026-09-17.r1
            </div>
          </div>
        </div>
      </header>

      {/* Hero Image Section */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/takao-weather-shift/hero-illustration.webp"
            alt="高尾山頂の天候急変と濃霧（ガス）のイメージイラスト"
            className="h-auto w-full object-cover"
            width={1264}
            height={848}
          />
          <div className="p-3 text-center text-xs text-slate-500">
            ▲ 青空広がる八王子市街地と、湿潤気流がぶつかり濃霧と急変雲に包まれる高尾山頂（標高599m）のコントラスト
          </div>
        </div>
      </div>

      {/* Key Findings Grid */}
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-7">
          <h2 className="text-base font-bold text-amber-950 sm:text-lg">
            📊 観測データから判明した4大ファクト（2024年通年解析）
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs font-bold text-amber-600">FACT 01</span>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                年間34日発生する「見せかけの晴れ」
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                八王子市街地は「降水なし＆雲量50%以下」の快晴にもかかわらず、山頂は湿度90%以上の濃霧（ガス）に包まれる日が<strong>年間34日（約1割）</strong>発生。特に6月（7日）、7月（6日）、9月（5日）の初夏・秋雨期に多発。
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs font-bold text-amber-600">FACT 02</span>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                夏の午後は急変・雷雨確率が約2倍
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                6〜9月の時間帯別推移では、午前10時の降水確率は<strong>17.2%</strong>であるのに対し、午後16時には<strong>32.8%</strong>へと急上昇。午前が快晴でも14時以降に夕立・熱雷が直撃するパターンが定着。
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs font-bold text-amber-600">FACT 03</span>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                雨量0mmでも体温を奪う「ガス濡れ」
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                雨量計にカウントされない微細な浮遊水滴（霧）が衣類に沈着。水の熱伝導率は<strong>乾いた空気の約25倍</strong>であり、山頂風（3〜5m/s）が加わることで初夏でも深刻な低体温症を引き起こします。
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs font-bold text-amber-600">FACT 04</span>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                平地は冷雨・山頂は凍結（年11日）
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                冬期（12〜2月）、八王子が2〜4℃の冷雨のとき、標高差476mによる気温減率で山頂は0℃以下の湿雪・凍結アイスバーンとなる境界日が<strong>年11日</strong>存在。軽装でのスリップ遭難の主因に。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: Interactive Risk Meter */}
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <span className="text-xs font-bold text-amber-600">SECTION 01</span>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            インタラクティブ診断：天候急変・ガス発生リスク判定
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            予定日、時間帯、麓（市街地）の天気予報を選択して、山頂のリアルな危険度を診断してください。
          </p>
        </div>
        <TakaoWeatherRiskMeter />
      </section>

      {/* Section 02: Meteorological Mechanism */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-4">
          <span className="text-xs font-bold text-amber-600">SECTION 02</span>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            なぜ高尾山の天気は急変するのか？ 地形性上昇気流のメカニズム
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            標高599mという低山でありながら、高尾山が関東平野において「雲の発生装置」となる物理的な理由を解説します。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {takaoWeatherBundle.mechanisms.map((m) => (
            <div key={m.step} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-black text-white">
                {m.step}
              </span>
              <h3 className="mt-2.5 text-sm font-bold text-slate-900">{m.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{m.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-xs leading-relaxed text-sky-950 sm:text-sm">
          <strong className="font-bold text-sky-900">📌 関東平野の最前線という地理的要因：</strong><br />
          東京湾や相模湾から吹く南東風は、ビル群が立ち並ぶ平野部を遮るものなく通過し、高尾山・陣馬山地に最初に激突します。
          平野部では気温30℃・湿度60%で「快適な晴天」であっても、山肌を駆け上がって標高599mに達する頃には断熱冷却によって気温が約26℃まで低下し、<strong>相対湿度は95%（飽和水蒸気圧到達）</strong>へと跳ね上がります。
          これが、天気予報アプリが「八王子：晴れマーク」を出しているにもかかわらず、山頂が真っ白なガスに閉ざされる根本的な理由です。
        </div>
      </section>

      {/* Section 03: Visual Charts */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-4">
          <span className="text-xs font-bold text-amber-600">SECTION 03</span>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            観測データで見る急変の実態：ヒートマップと乖離日数
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            2024年の1時間値データから集計した「時間帯別の急変確率」と「見せかけの晴れの月別発生日数」のグラフです。
          </p>
        </div>
        <TakaoWeatherCharts
          monthlySummary={takaoWeatherBundle.monthly_summary}
          summerHourlyMatrix={takaoWeatherBundle.summer_hourly_matrix}
        />
      </section>

      {/* Section 04: Statistical Column */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <span className="text-xs font-bold text-indigo-600">SECTION 04 · 統計検定2級の視点</span>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            条件付き確率と認知バイアス：なぜ人は「見せかけの晴れ」に騙されるのか
          </h2>

          <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm sm:leading-relaxed">
            <p>
              多くの登山者が悪天候に遭遇してしまう背景には、統計的な認知の罠が存在します。
              一般の天気予報は「市街地の地上観測点（八王子アメダス・標高123m）」を基準にしており、高尾山頂（599m）の気象予報ではありません。
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs">
              <span className="font-bold text-slate-900">■ 条件付き確率の乖離：</span><br />
              ・全日の山頂ガス発生確率: P(山頂ガス) = 76.2%<br />
              ・平野が晴天時の山頂ガス確率: P(山頂ガス | 平野晴天) = 9.3%（年間34日）<br />
              ・平野が晴天かつ南東湿潤風時の山頂ガス確率: P(山頂ガス | 平野晴天 ∩ 南風) ≈ 28.6%
            </div>

            <p>
              市街地で青空が広がっていると、人間の心理は「平野が晴れているなら山も安全だろう」という<strong>正常性バイアス（Normalcy Bias）</strong>に陥ります。
              しかし、統計学における<strong>偽陰性（Type II Error）</strong>の視点では、「平野の晴天マーク＝山頂も安全」と判定することは、年間34回も危険を見逃す深刻な誤認となります。
            </p>

            <p>
              低山登山で最も命を守る判断とは、「平野の晴天予報を無条件に信用せず、風向と湿度から条件付き確率を見積もり、ザックの底に必ず防水透湿レインウェアを忍ばせておくこと」に他なりません。
            </p>
          </div>
        </div>
      </section>

      {/* Section 05: Quiz */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <span className="text-xs font-bold text-amber-600">SECTION 05</span>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            理解度チェック：高尾山 気象急変＆統計クイズ（全5問）
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            本記事で解説した気象メカニズムと統計的概念の理解度を確認しましょう。選択肢を考えた後、「正解と解説」を開いて確認してください。
          </p>
        </div>

        <div className="space-y-4">
          {quizItems.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 sm:text-base leading-snug">
                {q.question}
              </h3>
              <ul className="mt-3.5 space-y-2 text-xs text-slate-700 sm:text-sm">
                {q.options.map((opt, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2.5">
                    {opt}
                  </li>
                ))}
              </ul>
              <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all open:border-emerald-300 open:bg-emerald-50/40">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-700 hover:text-amber-700 sm:text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-600">💡</span>
                    <span>正解と解説を確認する</span>
                  </span>
                  <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-3 border-t border-emerald-200/60 pt-3 text-xs leading-relaxed text-emerald-950 sm:text-sm">
                  <div className="font-bold text-emerald-800">【正解】{q.answer}</div>
                  <p className="mt-1.5">{q.explanation}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* Section 06: Data Source & Provenance */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <span className="text-xs font-bold text-slate-500">SECTION 06</span>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            データ出典・計算手法および固定成果物
          </h2>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              本記事の解析データは、Open-Meteo Historical Weather API（高尾山頂 緯度35.6251, 経度139.2437, 標高599m / 八王子 緯度35.6567, 経度139.3244, 標高123m）の2024年1月1日〜12月31日の1時間別実測値（計8,784時間）を使用しています。
            </p>
            <p>
              データは再現性を担保するため静的バンドルとして固定されており、ビルド時にSHA-256ハッシュおよびバイトサイズが検証されています。
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-slate-100 p-3 font-mono text-[11px] text-slate-700">
            <div>bundle: {takaoWeatherLock.file} ({takaoWeatherLock.byte_size} bytes)</div>
            <div>sha256: {takaoWeatherLock.sha256}</div>
          </div>

          {/* Provenance Box */}
          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div>執筆：{takaoWeatherShiftProvenance.writtenBy}</div>
            <div>検証：{takaoWeatherShiftProvenance.checkedBy}</div>
            <div>承認：{takaoWeatherShiftProvenance.finalReviewedBy}</div>
          </div>
        </div>
      </section>

      {/* Navigation Cross-links */}
      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
            📚 「街のうわさを、統計でほどく」気象データ分析シリーズ
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InternalLink
              href="/labs/hachioji-climate"
              className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-400 hover:shadow-xs"
            >
              <span className="text-[10px] font-bold text-amber-600">第1弾 · 気候編</span>
              <h4 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-amber-600">
                八王子は本当に「東京都心より3℃寒い」のか？
              </h4>
            </InternalLink>

            <InternalLink
              href="/labs/hachioji-snow"
              className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-400 hover:shadow-xs"
            >
              <span className="text-[10px] font-bold text-amber-600">第2弾 · 降雪編</span>
              <h4 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-amber-600">
                なぜ八王子だけが大雪ニュースで中継されるのか？
              </h4>
            </InternalLink>

            <InternalLink
              href="/labs/hachioji-heat"
              className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-400 hover:shadow-xs"
            >
              <span className="text-[10px] font-bold text-amber-600">第3弾 · 猛暑編</span>
              <h4 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-amber-600">
                八王子は本当に都心より暑いのか？ 昼の猛暑と夜の放射冷却
              </h4>
            </InternalLink>

            <InternalLink
              href="/labs/hachioji-chill"
              className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-400 hover:shadow-xs"
            >
              <span className="text-[10px] font-bold text-amber-600">第4弾 · 冷え込み編</span>
              <h4 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-amber-600">
                八王子の朝はなぜ寒い？ 冬の冷え込み・放射冷却と時間構造
              </h4>
            </InternalLink>

            <InternalLink
              href="/labs/takao-gear"
              className="group block rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-400 hover:shadow-xs"
            >
              <span className="text-[10px] font-bold text-amber-600">第5弾 · 装備編</span>
              <h4 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-amber-600">
                高尾山に登山装備は必要か？ 体感温度ギャップと装備シミュレーター
              </h4>
            </InternalLink>
          </div>
        </div>
      </section>
    </article>
  );
}
