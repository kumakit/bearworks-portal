import type { Metadata } from "next";
import { Building2, Footprints, Store } from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { CityPopulationCharts, CityWalkingTrend, CityPointChanges, CityVacancyCharts } from "@/components/CityCenterCharts";
import { cityCenterBundle as data, cityNumber as n, citySigned as signed, cityPercent as percent } from "@/lib/hachioji-city-center-publication";

const title = "八王子の中心市街地は発展しつつある？";
const description = "住む人は増えた。では、にぎわいは？ 八王子市の人口・歩行量・空き店舗を3つの視点で比較。平日と休日、23地点と全32地点で違う街の動きを確かめます。";
const canonical = "https://bearworks.uk/labs/hachioji-city-center";
const image = "https://bearworks.uk/images/hachioji-city-center/og.png";
export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`, description,
  alternates: { canonical },
  openGraph: { type: "article", url: canonical, title, description, siteName: "bearworks.uk", images: [{ url: image, width: 1200, height: 630, alt: "住む・歩く・商うの3つの視点で八王子の中心市街地を読む" }] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};
const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl";
const sourceBase = "https://www.city.hachioji.tokyo.jp/kurashi/sangyo/003/";
const sourceLinks = [
  [sourceBase + "hatioujichuusinn/p031516.html", "八王子市：中心市街地活性化基本計画〈第2期〉・フォローアップ一覧"],
  [sourceBase + "hatioujichuusinn/p031516_d/fil/follow-up2025.pdf", "2025年度定期フォローアップ（2026年5月公表）：人口p.1、歩行p.4–7、空き店舗p.14"],
  [sourceBase + "004/p014345.html", "八王子市：2023–2025年度の歩行量調査報告書"],
  [sourceBase + "004/p014345_d/fil/R7houkokusyo.pdf", "2025年度歩行量調査（2026年2月）：調査条件p.1、過去推移p.18–19、地点個票p.21–52"],
  [sourceBase + "hatioujichuusinn/p031516_d/fil/chukatsukeikaku_2_260821.pdf", "基本計画（2026年8月21日変更版）：人口p.5–7、空き店舗p.22、115ha区域p.66"],
  ["https://www.city.hachioji.tokyo.jp/jigyosha/005/10101/p029527.html", "八王子市：建築計画概要書の閲覧と、現況証明ではないことについて"],
  ["https://www.city.hachioji.tokyo.jp/987/p012154.html", "八王子市：著作権の扱い"],
];

export default function HachiojiCityCenterPage() {
  const s = data.summary;
  const latest = data.walking.plan23.at(-1)!;
  const mizuki = data.walking.pointChanges.find(p => p.id === "29")!;
  const station = data.walking.pointChanges.find(p => p.id === "13-1")!;
  const allLatest = data.walking.all32.at(-1)!;
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, description, mainEntityOfPage: canonical, datePublished: data.reviewedOn, dateModified: data.reviewedOn, author: { "@type": "Organization", name: "bearworks.uk" }, image, isBasedOn: sourceLinks.slice(0, 5).map(([url]) => url) }) }}/>
    <PublicSiteHeader/>
    <article className="mx-auto max-w-5xl space-y-12 text-base leading-8">
      <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
        <div className="px-6 pb-8 pt-8 sm:px-10 sm:pt-12">
          <p className="text-xs font-bold tracking-[0.15em] text-teal-200">八王子を数字で読み解く · 第4弾</p>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.4]"><span className="block sm:inline">八王子の</span><span className="block sm:inline">中心市街地は</span><span className="block">発展しつつある？</span></h1>
          <p className="mt-5 text-lg font-semibold text-amber-200 sm:text-2xl">住む人は増えた。では、にぎわいは？</p>
          <p className="mt-5 max-w-3xl text-slate-200">駅の周りを歩くと、マンションが増えているように感じます。街が発展している証拠なのでしょうか。「住む人」「歩く人」「店の使われ方」を分けて、市のデータから確かめます。</p>
          <p className="mt-5 text-xs leading-6 text-slate-400">主な実績：2025年度まで · 人口は各年12月末 · 歩行・空き店舗は年度別調査 · 資料確認日：{data.reviewedOn}</p>
        </div>
        <div className="grid border-t border-white/10 bg-white/5 sm:grid-cols-3">
          {[{ Icon: Building2, word: "住む", caption: "人口という、街の土台" }, { Icon: Footprints, word: "歩く", caption: "日と通りで違う、人の流れ" }, { Icon: Store, word: "商う", caption: "空き店舗から見える変化" }].map(({ Icon, word, caption }) => <div key={word} className="flex items-center gap-4 border-b border-white/10 px-6 py-5 last:border-0 sm:border-b-0 sm:border-r"><Icon size={28} className="shrink-0 text-teal-200" aria-hidden="true"/><div><p className="font-bold">{word}</p><p className="text-xs text-slate-300">{caption}</p></div></div>)}
        </div>
      </header>

      <section aria-labelledby="findings" className="space-y-5">
        <p className="text-xs font-bold tracking-widest text-teal-800">今回、分かったこと</p>
        <h2 id="findings" className={heading}>居住は増加。人通りは、見る場所によって答えが変わる。</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-teal-50 p-5"><p className="text-sm font-bold text-teal-900">住む人</p><p className="mt-3 text-3xl font-bold text-teal-950">{signed(s.population.delta)}<span className="ml-1 text-sm">人</span></p><p className="mt-2 text-sm">市掲載人口、{s.population.from}→{s.population.to}年末（{percent(s.population.percent)}）</p></div>
          <div className="rounded-2xl bg-sky-50 p-5"><p className="text-sm font-bold text-sky-900">歩行量の計画指標</p><p className="mt-3 text-3xl font-bold text-sky-950">{percent(s.planYearOnYear.weighted.percent)}</p><p className="mt-2 text-sm">23地点の2:5加重平均、2024→2025年度</p></div>
          <div className="rounded-2xl bg-amber-50 p-5"><p className="text-sm font-bold text-amber-900">空き店舗</p><p className="mt-3 text-3xl font-bold text-amber-950">{n(s.vacancies.last)}<span className="ml-1 text-sm">店舗</span></p><p className="mt-2 text-sm">2025年度。2021年度から{n(-s.vacancies.delta)}店舗減。売上の指標ではありません。</p></div>
        </div>
        <p>3つを並べると、街の変化を「発展した」「衰退した」の一言では片付けにくいことが分かります。人通りが増えた通りもあれば、減った通りもあります。空き店舗が減る理由も、入居だけとは限りません。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 p-5 text-sm font-semibold text-teal-900">{[["area", "どこを比べる？"], ["residents", "住む街"], ["walking", "歩く街"], ["shops", "商業の街"], ["conclusion", "街の変化をどう読む？"], ["method", "方法・出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-teal-200 underline-offset-4">{label}</a>)}</nav>

      <section id="area" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>「中心市街地」は、駅前だけではない。</h2>
        <p>市の基本計画は、JR八王子駅・京王八王子駅周辺と甲州街道の一部を含む約115haを対象にしています。駅の改札近くと、駅から離れた通りでは、人の流れも街の役割も違います。</p>
        <div className="grid gap-4 sm:grid-cols-2"><div className={card}><p className="text-sm font-bold text-teal-800">計画指標の23地点</p><p className="mt-2 text-sm">甲州街道、アイロード、みさき通りなど。市の活性化計画の歩行量指標は、この集合を使います。</p></div><div className={card}><p className="text-sm font-bold text-sky-800">調査全体の32地点</p><p className="mt-2 text-sm">計画の23地点に、駅の南北通路やマルベリーブリッジなどを加えた集合です。23地点の値とは混ぜません。</p></div></div>
        <p className="text-sm text-slate-600">人口の集計範囲には別の注意があります。基本計画の過去人口は17町丁の合計で、一部だけ計画区域にかかる町も含みます。この記事では市の掲載人口として読み、115ha内だけの人口や人口密度とは断定しません。歩行量の図表も地点別の実測値を比べるもので、周辺一帯のにぎわいを推定したものではありません。</p>
      </section>

      <section id="residents" className="scroll-mt-6 space-y-5">
        <p className="text-xs font-bold tracking-widest text-teal-800">01 · 住む街</p><h2 className={heading}>市の掲載人口は、3年間で{n(s.population.delta)}人増えた。</h2>
        <p>フォローアップ報告書の中心市街地人口は、{s.population.from}年末の{n(s.population.first)}人から、{s.population.to}年末の{n(s.population.last)}人へ。伸び率は{percent(s.population.percent)}です。直近の各年末の値は増えていますが、急増というより、増加を続けている形です。</p>
        <CityPopulationCharts data={data.population}/>
        <p>もう少し前を見ると、基本計画の17町丁合計は2012→2021年に{signed(s.historicalPopulation.delta)}人。同じ12月末の市全体は{signed(s.historicalCityPopulation.delta)}人でした。市全体と中心部に関連する地域が同じ方向に動くとは限らない、という一例です。ただし、これは上の新しい系列とは分けた過去の比較です。</p>
        <aside className="rounded-2xl border-l-4 border-teal-700 bg-teal-50 p-5"><h3 className="font-bold text-teal-950">マンションの「予定戸数」と「完成戸数」は違う。</h3><p className="mt-2 text-sm">市の基本計画p.7には集合住宅のグラフがありますが、事前協議に基づく<strong>建設予定戸数の累計</strong>です。近年完成したマンションの棟数・戸数として使うことはできません。今回、区域内の完成棟数・戸数をそろえた一次データは確定できませんでした。</p><p className="mt-2 text-sm">最新フォローアップは、八日町・八幡町付近のマンション建設と居住者増を背景として挙げています。これは市の説明として参照し、人口増のうち何人がマンション建設によるものか、独立に確かめられたとは扱いません。</p></aside>
      </section>

      <section id="walking" className="scroll-mt-6 space-y-5">
        <p className="text-xs font-bold tracking-widest text-sky-800">02 · 歩く街</p><h2 className={heading}>平日が増えた街と、平日が減った街。同じ八王子で両方が見える。</h2>
        <p>2025年度の計画23地点は、休日{n(latest.holiday)}、平日{n(latest.weekday)}。前年から休日は{signed(s.planYearOnYear.holiday.delta)}、平日も{signed(s.planYearOnYear.weekday.delta)}増えました。ところが、駅通路などを含む全32地点では、休日{n(allLatest.holiday)}に対し平日{n(allLatest.weekday)}で、平日は前年比{signed(s.allYearOnYear.weekday.delta)}。<strong>どの地点を数えるかで、増減の向きさえ変わります。</strong></p>
        <CityWalkingTrend data={data.walking}/>
        <p>23地点の加重平均は{n(latest.weighted)}で、前年から{percent(s.planYearOnYear.weighted.percent)}。市の基準値である2018〜2021年度平均{n(data.walking.baseline.weighted)}を上回ります。ただし、この基準にはコロナ期が入っています。2016年度の同じ23地点と比べると、加重平均は{percent(s.planSince2016.weighted.percent)}、平日は{percent(s.planSince2016.weekday.percent)}です。「コロナ前に全面回復した」とは言い切れません。</p>
        <div className="rounded-2xl bg-slate-100 p-5"><h3 className="font-bold text-slate-900">平休日平均は、2日を足して2で割る値ではない。</h3><p className="mt-2 text-sm">市の計画指標は<strong>（休日23地点合計×2＋平日23地点合計×5）÷7</strong>を四捨五入します。休日の2日と平日の5日を重みとした、調査値の指標です。年間を通じた毎日の実測平均ではありません。</p></div>
        <CityPointChanges points={data.walking.pointChanges}/>
        <p>たとえば休日のみずき通りは{n(mizuki.holiday.previous)}→{n(mizuki.holiday.current)}で{signed(mizuki.holiday.delta)}。一方、全32地点の中の八王子駅北口通路①は、平日{n(station.weekday.previous)}→{n(station.weekday.current)}で{signed(station.weekday.delta)}でした。通りの増加と大きな駅通路の減少が同時に起きていても不思議ではありません。</p>
        <p>市は、みずき通りの休日増について、いちょうホールの改修後の再開を背景の一つに挙げています。ただし、この調査は人の移動経路を追うものではありません。イベント・施設の稼働・天気などの影響を分離できず、特定の事業が何人増やしたかも分かりません。</p>
        <p className="text-sm text-slate-600">2025年度は11月23日(日)と25日(火)、9〜22時の調査。対象は中学生以上で、自転車に乗っている人は含みません。年ごとに違う日の断面なので、増減率に統計的な誤差幅を付けられる標本設計ではありません。</p>
      </section>

      <section id="shops" className="scroll-mt-6 space-y-5">
        <p className="text-xs font-bold tracking-widest text-amber-800">03 · 商業の街</p><h2 className={heading}>空き店舗は減った。ただし、減り方は一つではない。</h2>
        <p>市が数えた1階路面の空き店舗は、2021年度{n(s.vacancies.first)}店舗から2025年度{n(s.vacancies.last)}店舗へ、{n(-s.vacancies.delta)}店舗減りました。途中の2023年度には増えており、毎年一直線に減ったわけではありません。</p>
        <CityVacancyCharts data={data.vacancies}/>
        <div className="grid gap-4 sm:grid-cols-2"><div className={card}><h3 className="font-bold text-teal-900">店が入って、空き店舗が減る</h3><p className="mt-2 text-sm">これは店舗として使われるようになる変化です。報告書には、募集物件への入居や出店支援の実績が記載されています。</p></div><div className={card}><h3 className="font-bold text-amber-900">建物がなくなって、空き店舗が減る</h3><p className="mt-2 text-sm">報告書は、募集なしの物件が解体され、マンションへ建て替わる動きも記述しています。空き店舗の減少が、そのまま営業店舗の増加を意味するとは限りません。</p></div></div>
        <p>この数字は空き店舗の<strong>数</strong>であり、全店舗を分母にした空き店舗率ではありません。また、中心市街地の同じ範囲・同じ期間で比較できる売上や購買額は、今回の採用データにはありません。「住む人が増えたから商店の売上も増えた」と結論づける材料は足りません。</p>
      </section>

      <section id="conclusion" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>街の役割が、少しずつ組み替わっているのかもしれない。</h2>
        <p>確認できたのは、市の掲載人口の増加、23地点の歩行量の前年増加、路面の空き店舗数の減少です。その一方で、全32地点の平日は前年より少なく、23地点の計画指標も2016年度を下回っています。</p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[560px] text-sm"><caption className="bg-slate-50 p-4 text-left font-bold text-slate-900">3つの視点で、言えること・まだ言えないこと</caption><thead><tr className="border-b border-slate-200"><th scope="col" className="p-4 text-left">視点</th><th scope="col" className="p-4 text-left">データで確認できた変化</th><th scope="col" className="p-4 text-left">この数字だけでは分からないこと</th></tr></thead><tbody>{[["住む", "市掲載人口が2022→2025年末に増加", "マンション竣工の総数、建設の人口増への寄与"], ["歩く", "23地点と全32地点で平日の増減が異なる", "買い物目的の人数、実際の回遊経路、年間総人流"], ["商う", "路面の空き店舗数が2021→2025年度に減少", "売上、空き店舗率、営業店舗の総数"]].map(([view, fact, limit]) => <tr key={view} className="border-b border-slate-100"><th scope="row" className="p-4 text-left font-bold text-slate-900">{view}</th><td className="p-4">{fact}</td><td className="p-4">{limit}</td></tr>)}</tbody></table></div>
        <p>商業を中心とした街が、住む・食べる・歩く場も持つ街へ変わっている、という見方はできます。市の基本計画にも、住宅を柱とする複合的な市街地への転換という説明があります。ただし、ここでは<strong>複数の数字から考えられる仮説</strong>として受け止めます。</p>
        <p>「発展している？」への答えは、居住と一部の人通りには増加が見られる一方、商業の成長や回復の広がりまでは確定できない、となります。マンションが増えたように見える実感から出発しても、街全体を一色に塗らないことが、数字を読む面白さです。</p>
      </section>

      <section id="method" className={`${card} scroll-mt-6 space-y-5`}>
        <h2 className={heading}>方法・比較の限界・出典</h2>
        <p className="text-sm">出典は八王子市の基本計画、定期フォローアップ、歩行量調査です。2025年度資料を主に使い、過去の数値は2025年度報告書の同一地点行から2016〜2025年度を抽出しました。採用した32地点にはこの期間の欠測がありません。地点番号13-1・13-2の個別行と、その合計行を重複加算していません。23地点の合計をフォローアップの表、全32地点合計を過去表、2025年の値を各地点個票に照合しています。2023・2024年度の元報告書とも過去値を突合しました。</p>
        <p className="text-sm">この照合は市の資料間の整合確認で、独立した実測のやり直しではありません。同じ番号の観測行が存在しても、過去年の調査断面が完全に不変だったとまでは証明していません。2014〜2015年度以前には一部地点の欠測があるため、固定集合のグラフに接続していません。</p>
        <details className="rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold">調査日・丸め方・原資料の不整合</summary><div className="mt-3 space-y-3 text-sm">
          <ul className="list-disc space-y-2 pl-5">{Object.entries(data.survey.dates).map(([year, dates]) => <li key={year}>{year}年度：休日{dates.holiday}、平日{dates.weekday}。</li>)}<li>{data.survey.exceptions[0]}</li><li>2016〜2022年度は2025年度の過去表を使用。グラフでは年度を表示し、直近3年以外の正確な調査日を推測して付けていません。天候・イベント・コロナ期の条件差を含みます。</li><li>市の公表基準値{n(data.walking.baseline.weighted)}は、丸め済みの2018〜2021年度指標の平均を四捨五入すると再現します。丸め前の値から直接平均した場合とは1人相当の差が出るため、公表値との丸め順序を記録しています。</li><li>{data.discrepancies[0].description}</li></ul>
        </div></details>
        <p className="text-sm">人口の新旧系列は、区域・集計範囲の同一性が未確認のため別表示です。空き店舗も期間をまたぐ調査エリアの厳密な一致が未確認なので、別表示にしています。期間をまたぐ増減率を計算したり、面積で人口を按分したりしていません。空き店舗は巡回・目視による未活用の路面店舗で、マッチング制度の登録物件数とは異なります。</p>
        <p className="text-sm">数値の事実を独自に集計・図表化しています。原本PDF・原図・写真・地形図・原表のレイアウトは配布していません。人口オープンデータのCC BY表示を、今回使った全PDFの利用許諾へ広げるものではありません。この記事は市の公式評価とは独立した分析です。</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-teal-900">{sourceLinks.map(([href, label]) => <li key={href}><a href={href} className="underline underline-offset-4">{label}</a></li>)}</ul>
        <details className="rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold">集計データ・再現手順を開く</summary><div className="mt-3 space-y-3 text-sm"><p>出典URL・取得日時・SHA256・対象頁・処理方法は出典記録に保存しています。固定入力からの再生成はPython標準ライブラリだけで実行できます。原本PDFの取得は再生成に必要ありません。</p><ul className="list-disc space-y-1 pl-5 text-teal-900">{[["source-manifest.json", "出典・加工・権利・検算記録"], ["annual-counts.csv", "23/32地点の年次値CSV"], ["point-changes.csv", "全地点の2024→2025比較CSV"], ["population.csv", "別系列の人口CSV"], ["vacancies.csv", "別系列の空き店舗CSV"], ["hachioji-city-center-2026-10-27.r1.json", "本文と図表の固定JSON"], ["normalized-inputs.json", "固定数値入力"], ["generate_bundle.py", "オフライン再生成スクリプト"], ["prepare_sources.py", "ローカル原本抽出・照合スクリプト"], ["README.txt", "再現手順"]].map(([file, label]) => <li key={file}><a href={`/data/hachioji-city-center/${file}`} className="underline">{label}</a></li>)}</ul></div></details>
      </section>

      <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-3">{[["hachioji-population", "第1弾", "人口は本当に減っている？"], ["hachioji-land-prices", "第2弾", "本当に土地が安い？"], ["hachioji-aging", "第3弾", "高齢者の街になっている？"]].map(([slug, number, name]) => <Link key={slug} href={`/labs/${slug}`} className={`${card} hover:bg-teal-50`}><span className="block text-xs font-bold text-teal-800">{number}</span><span className="mt-2 block font-semibold text-slate-900">{name} →</span></Link>)}<Link href="/labs" className="text-sm font-semibold text-teal-900 underline">Labsの記事一覧へ</Link></nav>
    </article>
    <PublicSiteFooter/>
  </main>;
}
