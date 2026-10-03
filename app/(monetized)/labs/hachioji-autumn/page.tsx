import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import { Leaf, CalendarRange, Thermometer, SlidersHorizontal } from "lucide-react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import ContentProvenance from "@/components/ContentProvenance";
import ClimateSeriesNav from "@/components/ClimateSeriesNav";
import { ClimateDownloads, ClimateLesson, ClimateQuizzes, ClimateSection } from "@/components/ClimateArticleParts";
import AutumnCharts from "@/components/AutumnCharts";
import { autumnBundle as bundle, autumnLock, climateNumber as n } from "@/lib/hachioji-rain-autumn-publication";
import { autumnArticleProvenance } from "@/lib/hachioji-series-provenance";

const title = "八王子の秋は本当に短くなった？ 気温の区切りを変えて確かめる";
const canonical = "https://bearworks.uk/labs/hachioji-autumn";
export const metadata: Metadata = { title: `${title} | bearworks.uk`, description: "八王子の2009〜2025年、9〜11月の日平均気温を分析。中間の気温の日数、年変動、連続日数と品質条件による違いを、操作できる図とカレンダーで確かめます。", alternates: { canonical }, openGraph: { type: "article", title, url: canonical, siteName: "bearworks.uk" } };
const main = bundle.main.comparison[1]; const sensitivity = bundle.sensitivity_quality5.comparison[1];
const card = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const quizzes = [
  { question: "「中間の日」が42.5日なら、秋が42.5日続いた？", answer: "そうは言えません。42.5日は複数年の日数の平均です。それぞれの年でも、条件に合う日が連続しているとは限りません。合計日数、最長連続日数、開始日から終了日までの長さは別の指標です。" },
  { question: "日平均気温が15℃ちょうど、25℃ちょうどなら？", answer: "基本の定義は15℃以上25℃未満なので、15℃は中間、25℃は高温側に入ります。境界を両方に含めると重複が生じます。各日が必ず一つの区分に入るよう、先に定義を固定します。" },
  { question: "5.1日少ない。95％信頼区間も5.1日？", answer: "違います。5.1日は、二つの対象期間における採用年の平均日数の差です。推定の不確実性を表す区間ではなく、有意差検定の結果でもありません。日別データをすべて独立な標本とみなして、安易に標準誤差を計算することもできません。" },
  { question: "三つの温度帯で減ったなら、秋の短縮が確定？", answer: "今回試した三つの定義では、最近の期間の日数が少ないことは確認できます。ただし、それ以外の定義でも同じとは限りません。紅葉、服装の快適さ、四季の変化全体を直接測った結果ではありません。" },
  { question: "準正常値を加えると差が3.2日。都合のよい方だけ載せてよい？", answer: "よくありません。どの品質条件を主集計にするかを先に決め、条件変更で結果がどう動くかも示します。今回は2021年が平均に加わるため、差が変わります。欠けた1日の値だけの影響ではありません。" },
];

export default function HachiojiAutumnPage() {
  return <main className="mx-auto w-full max-w-5xl px-4 pb-12 text-slate-800 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, dateModified: "2026-10-04", author: { "@type": "Person", name: "kuma" }, mainEntityOfPage: canonical }) }} />
    <PublicSiteHeader />
    <article className="mx-auto max-w-4xl space-y-10 text-base leading-8">
      <header className="relative overflow-hidden rounded-3xl bg-emerald-950 p-7 text-white sm:p-12">
        <Leaf aria-hidden="true" size={190} strokeWidth={0.7} className="pointer-events-none absolute -right-6 top-12 -rotate-12 text-emerald-700/60 sm:right-4" />
        <div className="relative max-w-2xl"><p className="text-xs font-bold tracking-widest text-emerald-200">街のうわさを、統計でほどく · 08</p><h1 className="mt-6 text-3xl font-bold leading-snug sm:text-5xl">夏が終わると、<br />もう冬。<br /><span className="text-amber-200">秋はどこへ？</span></h1><p className="mt-5 font-semibold text-emerald-100">八王子の秋は、本当に短くなった？</p><p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100">半袖の出番が長くなり、気づけば上着が手放せない。その感覚を調べるために、まず「秋をどう数えるか」を決めます。日々の気温を三つに分け、数え方を変えながら、17年の記録を見てみましょう。</p><p className="mt-6 text-xs text-emerald-200">八王子の地点観測 · 2009〜2025年の9〜11月 · 2026年10月4日作成</p></div>
      </header>

      <section aria-labelledby="autumn-answer" className="space-y-5"><p className="text-xs font-bold tracking-widest text-emerald-800">まず、定義した範囲での答え</p><h2 id="autumn-answer" className="text-2xl font-bold leading-relaxed text-slate-900">中間の気温の日は、最近の期間で少ない。<br className="hidden sm:block" />ただし、差の大きさは数え方による。</h2><p>日平均気温15℃以上25℃未満の日数は、2009〜2013年の平均{n(main.early.middle)}日から、2021〜2025年のうち採用した4年では{n(main.late.middle)}日へ。主集計の差は{n(Math.abs(main.middle_difference))}日でした。準正常値も採用した5年同士では、差は{n(Math.abs(sensitivity.middle_difference))}日になります。</p>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-emerald-50 p-5"><CalendarRange aria-hidden="true" className="text-emerald-800" /><h3 className="mt-3 text-sm font-semibold">最初の期間 · 採用5年</h3><p className="mt-3 text-3xl font-bold text-emerald-950">{n(main.early.middle)}<span className="ml-1 text-sm font-normal">日</span></p><p className="mt-2 text-xs text-slate-600">2009〜2013年の平均</p></div><div className="rounded-2xl bg-emerald-50 p-5"><Thermometer aria-hidden="true" className="text-emerald-800" /><h3 className="mt-3 text-sm font-semibold">最近の期間 · 採用4年</h3><p className="mt-3 text-3xl font-bold text-emerald-950">{n(main.late.middle)}<span className="ml-1 text-sm font-normal">日</span></p><p className="mt-2 text-xs text-slate-600">2022〜2025年の平均</p></div><div className="rounded-2xl bg-emerald-950 p-5 text-white"><SlidersHorizontal aria-hidden="true" className="text-amber-200" /><h3 className="mt-3 text-sm font-semibold">準正常値も含めた差</h3><p className="mt-3 text-3xl font-bold text-amber-100">−{n(Math.abs(sensitivity.middle_difference))}<span className="ml-1 text-sm font-normal">日</span></p><p className="mt-2 text-xs text-emerald-200">2021年も採用 · 5年対5年</p></div></div>
        <p className="text-sm leading-7 text-slate-600">「中間」は本記事で決めた気温の区分です。秋の公式な定義や、万人が快適に感じる温度ではありません。紅葉期間や服装の適否も判定していません。</p>
      </section>
      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-emerald-800">{[["definition", "01 秋の数え方"], ["explore", "02 図で確かめる"], ["sensitivity", "03 結果の動き"], ["limits", "04 言える範囲"], ["quiz", "05 確認問題"], ["method", "方法・出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-emerald-200 underline-offset-4 hover:decoration-emerald-800">{label}</a>)}</nav>

      <ClimateSection id="definition" number="01" title="「秋が短い」を、測れる問いに置き換える。"><p>今回は毎年9月1日〜11月30日の91日を固定し、日平均気温で区分します。この91日は毎年同じ長さです。変わるのは、その中にどんな気温の日が何日あるかです。</p>
        <div className="grid gap-3 sm:grid-cols-3">{[["15℃未満", "低温側", "bg-blue-50 text-blue-900"], ["15℃以上25℃未満", "中間 · 主指標", "bg-emerald-50 text-emerald-950"], ["25℃以上", "高温側", "bg-orange-50 text-orange-950"]].map(([range, label, style]) => <div key={range} className={`rounded-2xl p-5 ${style}`}><p className="text-xs font-semibold">{label}</p><p className="mt-3 font-bold">{range}</p><p className="mt-2 text-xs">日平均気温</p></div>)}</div>
        <ClimateLesson title="結果を見る前に、指標を決める。"><p>体感的な「秋」には日差し、湿度、風、服装なども関わります。ここでは問いを日平均気温の日数へ絞りました。主定義の15〜25℃に加えて、境界を1℃ずつずらした14〜24℃と16〜26℃も確認します。都合のよい区切りだけを探すことを避けるため、これらは集計前に固定しています。</p></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="explore" number="02" title="区切りを動かす。年を変える。見え方を確かめる。"><p>基本の定義では、中間の日数が減る一方、25℃以上の日数は{n(main.early.warm)}日から{n(main.late.warm)}日へ増えています。下の図は、季節全体を一つの平均気温で表す代わりに、91日の内訳を見せます。</p><AutumnCharts data={bundle.main} />
        <ClimateLesson title="日数の合計と、続いた長さは別の変数。"><p>条件に合う日を足した値と、途切れずに続いた日数は一致しません。寒い日を挟んで暖かさが戻ることもあります。最初に条件を満たした日から最後の日までをそのまま「秋の長さ」と呼ぶと、この行き来を見落とします。</p></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="sensitivity" number="03" title="少なくなった方向は同じ。でも、差は動く。"><p>三つの温度帯で最近の期間の中間日数が少なくなるかを確かめました。さらに、気象庁が一部の観測不足を示す「準正常値」（品質5）を加えた場合も比較しています。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[550px] text-right text-sm"><caption className="mb-4 text-left">最近の期間 − 最初の期間：中間の日数の平均差（日）</caption><thead><tr className="border-b"><th scope="col" className="py-3 text-left">日平均気温の範囲</th><th scope="col">正常値のみ<br /><span className="font-normal">最初5年・最近4年</span></th><th scope="col">準正常値も含む<br /><span className="font-normal">最初5年・最近5年</span></th></tr></thead><tbody>{bundle.main.comparison.map((row, i) => <tr key={row.low} className="border-b border-slate-100"><th scope="row" className="py-3 text-left font-normal">{row.low}℃以上{row.high}℃未満</th><td>{n(row.middle_difference)}</td><td>{n(bundle.sensitivity_quality5.comparison[i].middle_difference)}</td></tr>)}</tbody></table></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">なぜ、1日の品質条件で平均差が変わる？</h3><p className="mt-3 text-sm leading-7">2021年9月13日が準正常値のため、正常値だけでは2021年の秋全体を主集計から除外します。準正常値を加えると2021年の91日がそろい、この年全体が最近の期間の平均に入ります。{n(Math.abs(main.middle_difference))}日と{n(Math.abs(sensitivity.middle_difference))}日の違いは、1日を数えるかどうかだけでは説明できません。</p></div>
        <ClimateLesson title="条件を変えた結果の幅は、信頼区間ではない。"><p>この表は、定義やデータの採用条件を変えたときの結果を並べたものです。母集団の値が入る確率を計算した区間ではありません。方向が共通していても、あらゆる定義・期間で成り立つとは言えません。</p><Link href="/toukei/guides/sampling-and-bias" className="font-semibold underline">標本と偏りのガイドへ →</Link></ClimateLesson>
      </ClimateSection>

      <ClimateSection id="limits" number="04" title="ここまでで言えること、まだ言えないこと。"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-emerald-50 p-5"><h3 className="font-bold text-emerald-950">観測から確認できたこと</h3><p className="mt-3 text-sm leading-7">八王子のこの観測地点・季節・期間では、設定した三つの温度帯のいずれでも、最近の採用年の平均日数が少なくなりました。準正常値を追加しても方向は同じでした。</p></div><div className="rounded-2xl bg-slate-100 p-5"><h3 className="font-bold text-slate-900">この集計だけでは決められないこと</h3><p className="mt-3 text-sm leading-7">毎年一様に秋が短くなったか、市内のどこでも同じか、変化の原因は何か、来年は何日になるか。この17年の比較だけで、長期的な気候傾向や将来を確定することはできません。</p></div></div><p>「秋が消えた」と一言でまとめるより、何を数えて、どれだけ変わり、条件を変えるとどう動くかを見る。そのほうが、日々の実感とデータを丁寧につなげられます。</p></ClimateSection>

      <ClimateSection id="quiz" number="05" title="「秋が短い」の読み方を、5問で確かめる。"><ClimateQuizzes items={quizzes} /></ClimateSection>
      <ClimateSection id="method" number="資料" title="方法・再現性・出典"><div className="space-y-4 text-sm leading-7"><p>2026年10月4日取得の気象庁・八王子の日平均気温を使用。2009〜2025年の9〜11月、各91日を対象とします。2009年の開始は既存の観測環境の境界（2008年）より後に置き、今回取得した範囲でも日平均気温の均質番号が一定であることを確認しています。</p><p>主集計は正常値（品質8）のみ。2014年10月20日、2018年10月10日、2021年9月13日が条件を満たさず、該当する秋を年別指標から除外しました。正常値が91日そろうのは17年中14年です。日別カレンダーには各年の正常値を残し、不採用日は欠測として表示します。</p><p>期間比較は、取得範囲の最初の5年（2009〜2013年）と最後の5年（2021〜2025年）を集計前に指定。主集計では後者が4年になるため、採用数を明記しています。準正常値（品質5）を含める別集計では全17年の秋がそろいます。年を等しい重みで平均し、欠測値の補間・日数補正は行いません。</p><p>日平均気温は最高と最低の単純平均から作った値ではなく、気象庁が提供する日平均気温を使用しました。検定、信頼区間、因果推定、将来予測は実施していません。温度帯の日数は連続期間ではなく、気象庁の公式な秋の長さの指標でもありません。</p></div>
        <ul className="space-y-2 text-sm text-emerald-800"><li><a className="underline" href="https://www.data.jma.go.jp/risk/obsdl/">気象庁：過去の気象データ・ダウンロード</a></li><li><a className="underline" href="https://www.data.jma.go.jp/risk/obsdl/top/help3.html">気象庁：品質情報・均質番号の説明</a></li><li><a className="underline" href="https://www.data.jma.go.jp/stats/etrn/index.php?prec_no=44&block_no=0366">気象庁：八王子の過去の気象データ検索</a></li></ul><ClimateDownloads hash={autumnLock.sha256} version={bundle.version} />
      </ClimateSection>
      <ContentProvenance provenance={autumnArticleProvenance} /><ClimateSeriesNav current="hachioji-autumn" />
    </article><PublicSiteFooter />
  </main>;
}
