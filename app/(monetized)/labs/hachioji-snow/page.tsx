import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { Distribution, TemperatureScatter, CaseChart } from "@/components/SnowCharts";
import { snowBundle as data, snowLock, percent, regression } from "@/lib/hachioji-snow-publication";

const title = "八王子は本当に雪が降りやすいのか";
export const metadata: Metadata = {
  title: `${title} | bearworks.uk`,
  description: "雪中継の定番・八王子を気象庁データで検証。箱ひげ図、散布図、大雪時の気温変化から、統計検定2級の記述統計・推定・相関を学びます。",
  alternates: { canonical: "https://bearworks.uk/labs/hachioji-snow" },
  openGraph: { type: "article", title, images: ["/images/hachioji-snow/hero-illustration.webp"] },
};
const card = "rounded-3xl border border-slate-200 bg-white p-5 md:p-8";
const heading = "text-2xl md:text-3xl font-bold tracking-tight text-slate-900";
const periods = ["1990/91〜2013/14冬", "2015/16〜2024/25冬"];
const caseNames = ["2014年2月8日の大雪", "2014年2月14〜15日の大雪", "2018年1月22日の大雪", "2024年2月5〜6日の大雪"];
const sources = [
  ["気象庁：過去の気象データ・ダウンロード", "https://www.data.jma.go.jp/risk/obsdl/"],
  ["気象庁：CSVの品質情報・均質番号の説明", "https://www.data.jma.go.jp/risk/obsdl/top/help3"],
  ["気象庁：2014年2月の天候", "https://www.jma.go.jp/jma/press/1403/03b/tenko1402.html"],
  ["気象庁：2018年1月22日からの大雪等", "https://www.data.jma.go.jp/stats/data/bosai/report/2018/20180131/20180131.html"],
  ["気象庁：2024年2月の天候", "https://www.data.jma.go.jp/cpd/longfcst/monthly/202402/202402m.html"],
  ["八王子市：平成26年2月大雪（14・15日）八王子の記録", "https://www.city.hachioji.tokyo.jp/emergency/bousai/m12873/006/p005665_d/fil/ooyuki_kiroku.pdf"],
];
const quizzes = [
  ["平均が中央値より低い。外れ値がある？", "学習用の仮想データです。平均が中央値より低いと分かったとき、低温側に外れ値が必ずあると言えるでしょうか。", "言えません。平均と中央値だけでは、外れ値の有無や分布全体の形は断定できません。箱ひげ図やヒストグラム、元の値も確認します。"],
  ["95%信頼区間は、95%の観測が入る範囲？", "学習用の仮想例です。前提を満たす方法で母平均差の95%信頼区間が［−2.1, −1.5］℃になりました。今後のイベントの95%が入りますか。", "入りません。同じ標本抽出・区間推定を繰り返したとき、得られる区間の約95%が母平均差を含むという手順の性質です。個別の観測の分布や予測区間とは異なります。"],
  ["1,000時間あれば、独立な標本が1,000個？", "学習用の仮想例です。同時刻の2地点の差を1,000時間分作ると、強い正の自己相関がありました。そのまま対応t検定に入れてよいでしょうか。", "差を独立な1,000観測と数える前提が満たされていません。正の系列相関を無視すると標準誤差を過小評価する場合があります。イベントごとの集約だけでも独立性は保証されません。"],
  ["相関0.92なら、都心が八王子を暖めている？", "学習用の仮想例です。2地点の気温の相関係数がr=0.92でした。直接の因果関係を示しますか。", "示しません。強い正の直線的関連を表しますが、共通の気象条件や時間帯などの影響と直接の因果は相関だけでは判別できません。高相関でも平均気温差はあり得ます。"],
  ["条件付き割合の分母はどこ？", "学習用の仮想例です。両方判定できた160時間のうち、都心が雨の150時間で練習用指標A成立が30時間、都心が雪の10時間でA成立が10時間でした。都心が雨のときのA成立割合は？ Aは降雪判定ではありません。", "30÷150＝20%です。「都心が雨」の行だけを分母にします。30÷160（全体割合）や30÷40（逆向きの条件）とは異なります。将来の降雪確率を推定した結果ではありません。"],
];

export default function SnowPage() {
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <PublicSiteHeader />
    <article className="space-y-10 leading-relaxed">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 text-white">
        <div className="grid items-center lg:grid-cols-2">
          <div className="p-7 md:p-10">
            <p className="mb-4 text-sm font-semibold tracking-widest text-sky-200">街のうわさを、統計でほどく · 02</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">雪のニュース。<br />また、八王子だ。</h1>
            <p className="mt-6 text-xl font-semibold">{title}</p>
            <p className="mt-4 text-slate-200">白くなる駅前、傘をさす人、雪の中の中継。「都心は雨なのに、八王子は雪」というイメージを、観測データで確かめてみます。</p>
            <p className="mt-5 text-sm text-sky-200">箱ひげ図・相関・信頼区間の読み方まで。統計検定2級の知識を、身近な街の問いに使う記事です。</p>
          </div>
          <figure><Image src="/images/hachioji-snow/hero-illustration.webp" width={1536} height={1024} alt="雪の駅前広場と中継カメラを描いたイラスト" unoptimized priority className="w-full" /><figcaption className="px-5 py-3 text-xs text-slate-300">導入用のAI生成イラスト。実際の災害写真や特定日時の再現ではありません。</figcaption></figure>
        </div>
      </header>

      <section className={card} id="answer"><p className="text-sm font-bold text-blue-700">まず、データから言えること</p><h2 className={`${heading} mt-2`}>降水時は低温。でも、雪の多さは別の問い。</h2>
        <p className="mt-4">同時刻に比べると、冬の降水時に八王子のほうが低温だった割合は、比較可能な2区間で次のとおりでした。これは<strong>観測できた降水時の記述割合</strong>で、降雪確率ではありません。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{data.primary.segments.map((s, i) => <div key={s.id} className="rounded-2xl bg-blue-50 p-6"><p className="font-semibold">{periods[i]}</p><p className="my-2 text-5xl font-bold tracking-tight text-blue-700">{percent(s.lower_temperature_fraction)}</p><p className="text-sm">八王子が低温 ／ {s.wet_pairs.toLocaleString()}時刻ペア<br />気温差の中央値：{s.median_delta_c.toFixed(1)}℃</p></div>)}</div>
        <p className="mt-5 text-sm">東京都心は気象庁の観測地点「東京」（44132）を指します。東京都全域や23区平均ではありません。観測の均質性が変わるため2区間を分け、2014/15冬を除外しました。この差をそのまま年代変化とは解釈できません。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-3 text-sm font-semibold text-blue-700">{[["mechanism", "雨と雪の境目"], ["distribution", "気温差を図で読む"], ["correlation", "相関・回帰"], ["cases", "大雪の4事例"], ["humidity", "湿度の壁"], ["quiz", "5つの確認問題"], ["method", "方法と出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-blue-100 px-4 py-2 hover:bg-blue-50">{label}</a>)}</nav>

      <section className={card} id="mechanism"><h2 className={heading}>01　空から地面まで。雪の運命は途中で変わる。</h2><p className="mt-4">関東の雪で話題になる南岸低気圧。南から水分が運ばれても、地上まで雪のまま届くかは、途中の空気の温度や湿度などに左右されます。地上の気温ひとつで雨・雪を線引きするのは難しいのです。</p>
        <figure className="mt-6 rounded-2xl bg-slate-50 p-3 md:p-6"><div className="overflow-x-auto"><svg viewBox="0 0 720 310" role="img" aria-label="雨雪の概念図。上空から降る雪が、途中の空気の温度や湿度の影響を受けて地上に届く" className="min-w-[540px] w-full"><rect width="720" height="310" rx="20" fill="#eff6ff"/><path d="M0 250 L105 200 L190 250 L720 250 L720 310 L0 310" fill="#cbd5e1"/><text x="360" y="38" textAnchor="middle" fontSize="20" fill="#1e3a8a">上空から降る雪</text>{[160,360,560].map(x => <g key={x}><text x={x} y="95" textAnchor="middle" fontSize="38" fill="#2563eb">＊</text><path d={`M${x} 110 v60 l-8 -10 m8 10 l8 -10`} fill="none" stroke="#2563eb" strokeWidth="3"/></g>)}<rect x="200" y="130" width="320" height="64" rx="15" fill="#fff7ed" stroke="#fdba74"/><text x="360" y="156" textAnchor="middle" fontSize="18">途中の空気の温度・湿度</text><text x="360" y="181" textAnchor="middle" fontSize="15">融け方などが変わる</text><text x="160" y="237" textAnchor="middle" fontSize="19">雪のまま？</text><text x="550" y="237" textAnchor="middle" fontSize="19">雨に変わる？</text><text x="360" y="289" textAnchor="middle" fontSize="17">地上の気温だけで、雪とは決めない</text></svg></div><figcaption className="mt-2 text-sm">仕組みを考えるための概念図です。実際の高度・地形・雨雪分布や予報を示す図ではありません。</figcaption></figure>
        <p className="mt-4">そこで、まず直接比較できる「降水時の気温差」を調べ、雨雪の判別や積雪は別の証拠で考えます。</p>
      </section>

      <section id="distribution" className="space-y-5"><h2 className={heading}>02　平均だけで終わらない。気温差の形を見る。</h2><p>同じ時刻の差を <strong>ΔT＝八王子の気温 − 東京都心の気温</strong> とします。負なら八王子が低温です。どちらか一方で1時間降水量0.5mm以上、両地点の気温・降水量が正常値の時間を使いました。</p>
        {data.primary.segments.map((s, i) => <section key={s.id} className={card}><h3 className="text-xl font-bold">{periods[i]} · {s.winters.length}冬</h3><div className="mt-5"><Distribution values={s.points.map(p => Number(p[3]))} id={s.id} /></div><p className="mt-5">中央の線は中央値 <strong>{s.median_delta_c.toFixed(1)}℃</strong>。箱の幅は中央50%のばらつきを示します。ひげの外の点も観測値であり、自動的に誤測定になるわけではありません。</p><div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">降水イベント単位でも確認：{s.eligible_events}イベントのうち、平均気温差が負だった割合は<strong>{percent(s.negative_event_fraction)}</strong>。イベント平均差を同じ重みで平均すると{s.mean_event_delta_c.toFixed(2)}℃でした。</div></section>)}
        <aside className="rounded-2xl bg-indigo-50 p-6"><h3 className="font-bold text-indigo-900">統計検定2級の視点：SDとSEを分ける</h3><p className="mt-2">標準偏差SDは観測値の散らばり、標準誤差SEは推定量のばらつきです。独立・同分布の標本では平均のSEを s / √n で推定します。さらに正規母集団など、t区間を使う前提が満たされれば、母平均の区間は x̄ ± t × s / √n（自由度n−1）です。ところが天気は時間的につながっています。</p><p className="mt-3">今回の時刻ペアをすべて独立とみなした信頼区間やp値は表示していません。イベントにまとめても独立性が保証されるわけではありません。<Link className="text-blue-700 underline" href="/toukei/problems/confidence-interval">信頼区間の例題</Link>で、計算の前提を確認できます。</p></aside>
      </section>

      <section id="correlation" className="space-y-5"><h2 className={heading}>03　一緒に動くことと、同じ温度は違う。</h2><p>横軸は東京都心、縦軸は八王子。点が等温線より下なら八王子のほうが低温です。寒暖が連動するかは相関、どれだけずれるかは差の分布で読みます。</p>
        {data.primary.segments.map((s, i) => { const fit = regression(s.points.map(p => p.map(Number))); return <div key={s.id} className={card}><h3 className="text-xl font-bold">{periods[i]}</h3><TemperatureScatter points={s.points} /><p className="mt-4">全{s.wet_pairs.toLocaleString()}ペアのPearson相関係数 <strong>r＝{fit.r.toFixed(3)}</strong>。最小二乗の記述的回帰式は、八王子の気温 ≈ {fit.slope.toFixed(3)} × 東京都心の気温 {fit.intercept < 0 ? "−" : "+"} {Math.abs(fit.intercept).toFixed(3)}（℃）。点は間引かず、重なりを透過表示しています。</p></div>; })}
        <p className="rounded-2xl bg-amber-50 p-6">共通の気象条件や時間帯などが両地点に影響します。相関や回帰式だけで「都心が八王子の気温を変える」とは言えません。この式は対象データの要約で、降雪予報モデルではありません。<Link href="/toukei/guides/regression-interpretation" className="text-blue-700 underline">回帰の解釈を復習する</Link></p>
      </section>

      <section id="cases" className="space-y-5"><h2 className={heading}>04　大雪の日、2地点の気温はどう動いた？</h2><p>記録的な雪の4事例を、時系列でたどります。雪で知られる事例を選んだため、これだけで「普通の南岸低気圧より差が大きい」とは判定できません。線の上下と、0℃付近にいた時間を見比べてください。</p>
        {data.cases.map((item, i) => <details key={item.id} className={card} open={i === 3}><summary className="cursor-pointer text-lg font-bold">{caseNames[i]}</summary><CaseChart item={item} /><details className="mt-3"><summary className="cursor-pointer text-sm text-blue-700">時間別の観測表を見る</summary><div className="mt-3 max-h-80 overflow-auto"><table className="w-full min-w-[650px] text-right text-sm"><caption className="text-left">正常値のみ。— は欠測・非観測・品質条件で不採用。0と区別します。天気は都心の観測時刻のみです。</caption><thead><tr>{["日時（JST）", "八王子℃", "都心℃", "八王子mm", "都心mm", "都心の天気", "都心積雪cm"].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{item.series.map(r => <tr key={r.at} className="border-t border-slate-100"><td className="whitespace-nowrap p-2">{r.at.slice(5, 16).replace("T", " ")}</td>{[r.h, r.t, r.precip_h, r.precip_t].map((v, j) => <td key={j}>{v ?? "—"}</td>)}<td>{r.weather_t === null ? "—" : ({10:"雨",11:"みぞれ",12:"雪"} as Record<number,string>)[r.weather_t] ?? `符号${r.weather_t}`}</td><td>{r.depth_t ?? "—"}</td></tr>)}</tbody></table></div></details></details>)}
        <aside className="rounded-3xl bg-slate-900 p-7 text-white"><p className="text-sm text-sky-200">もうひとつの観測：市の災害記録</p><p className="mt-2 text-4xl font-bold">50.5<span className="ml-1 text-xl">cm</span></p><p className="mt-3">2014年2月15日4時、八王子市役所本庁舎北側の観測場で、市職員が手作業で測った積雪深です。気象庁八王子地点の値でも、駅前や市全域の平均でもありません。</p><p className="mt-3 text-sm text-slate-200">市の記録には道路の雪や建物・農業施設などの被害も記されています。積雪の影響を知る証拠になりますが、この1事例で都心より被害が大きい傾向を示したことにはなりません。<a className="underline" href={sources[5][1]}>八王子市の記録（PDF、本文1ページ）</a></p></aside>
      </section>

      <section id="humidity" className={card}><h2 className={heading}>05　「都心は雨、八王子は雪」を数えられる？</h2><p className="mt-4">ここでデータの壁にぶつかります。八王子の過去の湿度や直接の雨雪観測は、この長期比較にはそろいません。近隣地点の湿度で穴埋めしたり、気温だけを使って雪だったことにしたりすると、問いと答えがずれてしまいます。</p>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[450px] text-left text-sm"><thead><tr><th className="p-2">比較したい項目</th><th>今回の扱い</th></tr></thead><tbody>{[["気温・降水量", "2地点の長期時間値で直接比較"], ["八王子の湿度", "2025年1〜2月の短期データを探索"], ["八王子の雨・雪・積雪", "長期の直接比較はできない"], ["近隣地点・市の記録", "独立した参考情報。代用して結合しない"]].map(([a,b]) => <tr key={a} className="border-t"><td className="p-2">{a}</td><td>{b}</td></tr>)}</tbody></table></div>
        <p className="mt-5">2025年1〜2月に、東京都心の天気が「雨」（符号10）で、八王子の気温・湿度も正常値だったのは<strong>{data.humidity.tokyo_rain_paired_hours}時間</strong>でした。以下はその点だけの探索図です。1時間降水量が0でも、観測時刻の天気が雨という組はあります。</p>
        <div className="overflow-x-auto"><svg viewBox="0 0 620 320" role="img" aria-label="都心の天気が雨だった12時刻の八王子の気温と相対湿度。雪判定の境界線は設定していない" className="mt-5 min-w-[480px] w-full">{[0,5,10,15].map(v => <g key={v}><line x1={60+v*32} x2={60+v*32} y1="30" y2="265" stroke="#e2e8f0"/><text x={60+v*32} y="285" textAnchor="middle" fontSize="13">{v}</text></g>)}{[0,25,50,75,100].map(v => <g key={v}><line x1="60" x2="540" y1={265-v*2.2} y2={265-v*2.2} stroke="#e2e8f0"/><text x="48" y={270-v*2.2} textAnchor="end" fontSize="13">{v}</text></g>)}{data.humidity.points.map((p,i) => <circle key={i} cx={60+Number(p.h)*32} cy={265-Number(p.rh_h)*2.2} r="5" fill="#0284c7" opacity=".6"/>)}<text x="60" y="19" fontSize="13">八王子の相対湿度（%）</text><text x="300" y="313" textAnchor="middle" fontSize="13">八王子の気温（℃）</text></svg><p className="text-xs sm:hidden">図は横にスクロールできます。</p></div>
        <details><summary className="cursor-pointer text-blue-700">12時刻の値を見る</summary><table className="mt-3 w-full text-sm"><thead><tr><th>日時（JST）</th><th>気温℃</th><th>相対湿度%</th></tr></thead><tbody>{data.humidity.points.map(p => <tr key={p.at} className="text-center"><td>{p.at.slice(0,16).replace("T"," ")}</td><td>{p.h}</td><td>{p.rh_h}</td></tr>)}</tbody></table></details>
        <p className="mt-4 font-semibold">12時間を雪になり得た時間とは数えていません。検証済みの雨雪判別方法と十分な対象期間がないため、雪の条件付き確率は算出しません。</p>
      </section>

      <section className={card}><h2 className={heading}>4つの仮説の到達点</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[["H1 · 冬の降水時は低温", "今回の比較範囲で支持", "2区間とも、低温の時間割合・イベント平均差が負の割合が事前基準60%を超えました。"], ["H2 · 都心が雨でも雪の条件", "直接検証できず", "八王子の直接の雨雪観測と長期の湿度がそろわず、雪判定は行いません。"], ["H3 · 南岸低気圧で差が強まる", "データ不足", "4つの選択事例だけでは、雪にならなかった低気圧との比較ができません。"], ["H4 · 早く雪になり、影響も大きい", "一般的な傾向は直接検証できず", "市の積雪記録は事例の証拠。2地点の開始時刻や被害規模の比較系列はありません。"]].map(([h,status,body]) => <div key={h} className="rounded-2xl bg-slate-50 p-5"><h3 className="font-bold">{h}</h3><p className="my-2 font-semibold text-blue-700">{status}</p><p className="text-sm">{body}</p></div>)}</div></section>

      <section id="quiz" className="space-y-4"><h2 className={heading}>06　見えたつもり、を確かめる5問。</h2><p>以下はすべて学習用の仮想例です。八王子の実測結果と分けて考えてください。</p>{quizzes.map(([q,body,answer], i) => <div key={q} className={card}><h3 className="text-lg font-bold">Q{i+1}　{q}</h3><p className="mt-3">{body}</p><details className="mt-4 rounded-xl bg-indigo-50 p-4"><summary className="cursor-pointer font-semibold text-indigo-900">答えと考え方</summary><p className="mt-3">{answer}</p></details></div>)}<div className="flex flex-wrap gap-4 text-blue-700 underline"><Link href="/toukei/guides/hypothesis-testing-basics">仮説検定の基礎</Link><Link href="/toukei/problems/contingency-table">分割表の例題</Link><Link href="/toukei/guides/sampling-and-bias">標本と偏り</Link></div></section>

      <section id="method" className={card}><h2 className={heading}>方法・再現性・出典</h2><div className="mt-5 space-y-4 text-sm"><p>対象候補は1990/91〜2024/25の35冬（12〜2月）。主解析は気象庁の品質情報8（正常値）のみ。冬全体の気温・降水量のペア有効率95%以上を条件とし、均質性が冬の途中で変わる2014/15を除いた34冬を使いました。均質番号は取得単位をまたいで単純比較せず、重複区間の値を照合して接続しています。</p><p>降水イベントは6時間連続の無降水で区切り、不明な降水や観測条件の境界で中断します。前後の区切りを確認できたイベントのうち、降水が3時間以上、気温ペア有効率90%以上を採用。H1の支持基準は5冬・30イベント以上、かつ低温の時間割合と負のイベント平均差の割合がともに60%以上です。有意差検定の基準ではありません。</p><p>準正常値を含める、区切りを12時間にする、両地点とも降水した時間に絞る、冬の有効率を90%にする感度分析でも、2区間のH1判定は変わりませんでした。</p><p>CSV原本のバイト数・SHA-256・要求した全時間の被覆を確認し、取得境界の3,264レコードを照合しました。主解析とは別のCSV読み取り・イベント集約による170組の照合も通過しています。</p><p>データ版：{data.version} ／ bundle：{snowLock.bytes.toLocaleString()} bytes<br /><span className="break-all">SHA-256：{snowLock.sha256}</span></p><p>AIは構成、解析・実装補助、レビュー補助と導入イラストに使用しました。記事設計にGeminiのレビューを反映しています。運営者が記事プレビューを確認し、2026年9月15日に公開を承認しました。</p></div><ul className="mt-5 space-y-2 text-sm text-blue-700">{sources.map(([label,url]) => <li key={url}><a href={url} className="underline">{label}</a></li>)}</ul></section>
      <section className="rounded-3xl bg-blue-50 p-7">
        <h2 className="text-xl font-bold">八王子の気候シリーズ</h2>
        <p className="mt-3">雪の日だけを選ぶと見えない、普段の気候や夏の猛暑。他の分析記事もあわせてご覧ください。</p>
        <div className="mt-4 flex flex-wrap gap-5 font-semibold text-blue-700">
          <Link href="/labs/hachioji-climate">第1弾：八王子は本当に夏暑く、冬寒いのか →</Link>
          <Link href="/labs/hachioji-heat">第3弾：八王子の夏は本当に暑いのか（猛暑・熱帯夜） →</Link>
          <Link href="/labs/takao-gear">第4弾：高尾山に山装備は本当に必要か（装備シミュレーター） →</Link>
          <Link href="/toukei">統計検定2級の学習へ →</Link>
        </div>
      </section>
    </article><PublicSiteFooter />
  </main>;
}
