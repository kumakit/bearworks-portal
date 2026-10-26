import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import LandPriceMap from "@/components/LandPriceMap";
import { LandPriceDistribution, LandPriceHistory } from "@/components/LandPriceCharts";
import { landPriceBundle as data, landYen as n, landMan as m, landPercent as percent } from "@/lib/hachioji-land-prices-publication";

const title = "八王子は本当に土地が安い？";
const canonical = "https://bearworks.uk/labs/hachioji-land-prices";
const description = "2026年の住宅地の公示地価を八王子・立川・町田・日野・府中・青梅で比較。124地点の地図と2016年との比較から、平均の安さと市内の幅を確かめます。";
export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`, description,
  alternates: { canonical },
  openGraph: { type: "article", url: canonical, title, description, siteName: "bearworks.uk", images: [{ url: "https://bearworks.uk/images/hachioji-land-prices/og.png", width: 1200, height: 630, alt: "近隣6市の住宅地標準地の平均価格、2026年1月1日" }] },
};
const card = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const th = "whitespace-nowrap p-3 text-right font-semibold";
const td = "whitespace-nowrap p-3 text-right tabular-nums";
const file = (name: string) => `/data/hachioji-land-prices/${name}`;

export default function HachiojiLandPricesPage() {
  const hachioji = data.cities[0];
  const points = data.points.filter(p => p.year === 2026 && p.cityCode === "13201");
  const low = points.reduce((a, b) => a.price < b.price ? a : b);
  const high = points.reduce((a, b) => a.price > b.price ? a : b);
  const ome = data.cities.find(c => c.code === "13205")!;
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, description, mainEntityOfPage: canonical, datePublished: "2026-10-26", dateModified: "2026-10-26", author: { "@type": "Organization", name: "bearworks.uk" }, isBasedOn: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html" }) }} />
    <PublicSiteHeader />
    <article className="mx-auto max-w-5xl space-y-10 text-base leading-8">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white sm:p-10">
        <p className="mb-4 text-sm font-semibold tracking-widest text-cyan-200">八王子を数字で読み解く · 第2弾</p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">八王子は本当に<br className="sm:hidden" />土地が安い？</h1>
        <p className="mt-6 text-xl font-semibold text-cyan-100">近隣6市と124の地点から見る、「安さ」の幅。</p>
        <p className="mt-4 max-w-3xl text-slate-200">同じ東京都でも、土地の値段にはずいぶん差がありそうです。では、八王子は近くの街より安いのでしょうか。住宅地の公示地価を使って、市ごとの平均、市内の地点分布、10年前からの変化を順に確かめます。</p>
        <p className="mt-5 text-xs text-slate-300">主な価格時点：2026年1月1日 · 過去比較：2016年1月1日 · 単位：円/㎡（図では万円/㎡）</p>
      </header>

      <section className="space-y-5" aria-labelledby="answer">
        <p className="text-xs font-bold tracking-widest text-cyan-800">まず、今回の数字から</p>
        <h2 id="answer" className="text-2xl font-bold leading-relaxed text-slate-900">平均は低め。でも、八王子のどこでも安いわけではありません。</h2>
        <p>2026年の住宅地標準地の平均は、八王子が{m(hachioji.current.mean)}万円/㎡。比較した6市では青梅に次いで低く、立川・町田・日野・府中を下回りました。ただし、これは調査地点の平均です。売り出されている土地の相場や、市内の全ての土地の平均ではありません。</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-cyan-50 p-5"><h3 className="text-sm font-semibold">八王子の平均</h3><p className="mt-3 text-3xl font-bold text-cyan-950">{m(hachioji.current.mean)}<span className="ml-1 text-sm font-normal">万円/㎡</span></p><p className="mt-2 text-sm">住宅地124地点の単純平均</p></div>
          <div className="rounded-2xl bg-sky-50 p-5"><h3 className="text-sm font-semibold">真ん中の価格（中央値）</h3><p className="mt-3 text-3xl font-bold text-sky-950">{m(hachioji.current.median)}<span className="ml-1 text-sm font-normal">万円/㎡</span></p><p className="mt-2 text-sm">平均より低い、{n(hachioji.current.median)}円/㎡</p></div>
          <div className="rounded-2xl bg-amber-50 p-5"><h3 className="text-sm font-semibold">市内の価格の幅</h3><p className="mt-3 text-2xl font-bold text-amber-950">{m(low.price)}〜{m(high.price)}<span className="ml-1 text-sm font-normal">万円/㎡</span></p><p className="mt-2 text-sm">最も高い地点は低い地点の約{(high.price / low.price).toFixed(1)}倍</p></div>
        </div>
        <p className="text-xs text-slate-600">対象：2026年1月1日の八王子市の住宅地標準地。面積で重みを付けない平均です。公示価格は実際の売買価格とは異なります。</p>
      </section>

      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-sky-800">{[["cities", "近隣6市"], ["map", "八王子の地図"], ["average", "平均の落とし穴"], ["history", "10年の変化"], ["limits", "安い＝お得？"], ["method", "方法・出典"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-sky-200 underline-offset-4">{label}</a>)}</nav>

      <section id="cities" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">近隣6市を、同じ年・同じ住宅地で比べる。</h2>
        <p>比べるのは八王子・立川・町田・日野・府中・青梅の住宅地341地点です。商業地や工業地は含めません。点を並べると、市ごとの価格帯に違いがありながら、重なる部分もあることが分かります。</p>
        <LandPriceDistribution cities={data.cities} points={data.points} />
        <div className={`${card} overflow-x-auto`}><table className="w-full text-sm"><caption className="mb-3 text-left font-semibold">2026年の住宅地標準地（円/㎡）。平均は1円に丸めて表示</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-3 text-left">市</th>{["地点数", "平均", "中央値", "最小", "最大"].map(t => <th scope="col" key={t} className={th}>{t}</th>)}</tr></thead><tbody>{data.cities.map(c => <tr key={c.code} className="border-b border-slate-100"><th scope="row" className="p-3 text-left font-medium">{c.name}</th>{[c.current.count, c.current.mean, c.current.median, c.current.min, c.current.max].map((v, i) => <td key={i} className={td}>{n(v)}</td>)}</tr>)}</tbody></table></div>
        <p className="text-sm">平均だけなら八王子は低い側ですが、最高地点の{m(high.price)}万円/㎡は、日野市の最高地点（33万円/㎡）より高い値です。市名だけで価格を言い切ると、こうした重なりを見落とします。土地条件をそろえた物件比較ではない点にも注意が必要です。</p>
      </section>

      <section id="map" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">八王子の中にも、違う価格帯がある。</h2>
        <p>124地点を地図上に置きました。気になる点を選ぶか、所在地の一覧から選ぶと価格を確認できます。標準地がない場所の価格は推定していません。</p>
        <LandPriceMap points={points} />
        <div className="grid gap-4 sm:grid-cols-2"><div className={card}><h3 className="font-bold text-slate-900">今回最も高かった地点</h3><p className="mt-2 text-3xl font-bold text-cyan-900">{m(high.price)}万円/㎡</p><p className="mt-2 text-sm">{high.address.replace("東京都　", "")}（{high.id}）</p><p className="text-sm">原典の最寄り駅：{high.station}、道路距離{n(high.roadDistance!)}m</p></div><div className={card}><h3 className="font-bold text-slate-900">今回最も低かった地点</h3><p className="mt-2 text-3xl font-bold text-cyan-900">{m(low.price)}万円/㎡</p><p className="mt-2 text-sm">{low.address.replace("東京都　", "")}（{low.id}）</p><p className="text-sm">原典の最寄り駅：{low.station}、道路距離{n(low.roadDistance!)}m</p></div></div>
        <p className="text-sm">子安町の最高地点は八王子駅からの道路距離400m、戸吹町の最低地点は秋川駅から3,100mと記録されています。駅への距離のほか、用途や道路、土地の形状なども違います。この2地点だけで、価格差の原因を駅距離だと決めることはできません。</p>
        <details className={card}><summary className="cursor-pointer font-semibold text-sky-900">124地点の所在地と価格を表で見る</summary><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><caption className="mb-2 text-left">八王子市の住宅地標準地、2026年1月1日、円/㎡</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-2 text-left">標準地番号</th><th scope="col" className="p-2 text-left">所在地</th><th scope="col" className={th}>価格</th></tr></thead><tbody>{points.map(p => <tr key={p.id} className="border-b border-slate-100"><th scope="row" className="whitespace-nowrap p-2 text-left font-normal">{p.id}</th><td className="min-w-[220px] p-2">{p.address.replace("東京都　", "")}</td><td className={td}>{n(p.price)}</td></tr>)}</tbody></table></div></details>
      </section>

      <section id="average" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">「平均が安い」と「どこでも安い」は、違う。</h2>
        <p>八王子の平均は{m(hachioji.current.mean)}万円/㎡、中央値は{m(hachioji.current.median)}万円/㎡です。中央値は価格順に並べた真ん中の2地点の平均。高い地点も含めて足し合わせる平均とは、答えている問いが少し違います。</p>
        <p>約{(high.price / low.price).toFixed(1)}倍の幅がある124地点を、一つの平均だけで説明するのは難しいことが分かります。さらに、この標本は市内の全筆を数えたものではなく、面積や世帯数に比例して地点が選ばれたわけでもありません。平均が低い理由を、市の広さや郊外の多さだけで説明することも、この集計からはできません。</p>
        <div className="rounded-2xl bg-amber-50 p-5"><h3 className="font-bold text-slate-900">100㎡なら？ あくまで掛け算の例</h3><p className="mt-2">中央値の{n(hachioji.current.median)}円/㎡に100㎡を掛けると、{n(hachioji.current.median * 100)}円です。これは公示価格による仮計算で、その値段の100㎡の土地が売られているという意味ではありません。建物、仲介手数料、税金、造成などの費用も含みません。</p></div>
      </section>

      <section id="history" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">10年前と比べても、見方は一つではない。</h2>
        <p>まず、各年に選ばれた全住宅地標準地の平均を比べます。八王子は{m(hachioji.past.mean)}万円/㎡から{m(hachioji.current.mean)}万円/㎡へ、{percent(hachioji.meanChangePercent)}の変化でした。ただし、地点数は125から124へ変わっています。この数字を、そのまま「同じ土地が14.7%値上がりした」とは読めません。</p>
        <LandPriceHistory cities={data.cities} />
        <details className={card}><summary className="cursor-pointer font-semibold text-sky-900">2016年の全地点の分布も見る（2026年の図と同じ横軸）</summary><div className="mt-4"><LandPriceDistribution cities={data.cities} points={data.points} year={2016} /></div></details>
        <div className={`${card} overflow-x-auto`}><table className="w-full text-sm"><caption className="mb-3 text-left font-semibold">各年の全住宅地標準地の比較（円/㎡、各年1月1日）</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-3 text-left">市</th>{["2016件数", "2016平均", "2026件数", "2026平均", "平均価格の差率"].map(t => <th scope="col" className={th} key={t}>{t}</th>)}</tr></thead><tbody>{data.cities.map(c => <tr key={c.code} className="border-b border-slate-100"><th scope="row" className="p-3 text-left font-medium">{c.name}</th><td className={td}>{c.past.count}</td><td className={td}>{n(c.past.mean)}</td><td className={td}>{c.current.count}</td><td className={td}>{n(c.current.mean)}</td><td className={td}>{percent(c.meanChangePercent)}</td></tr>)}</tbody></table></div>
        <h3 className="text-xl font-bold text-slate-900">次に、継続を確認できた地点だけで比べる。</h3>
        <p>年ごとの選定・属性変更履歴と両年の原典を使い、所在地・地積・利用現況の変更などが確認されない地点に絞りました。八王子では124地点のうち{hachioji.matched.count}地点がこの条件を満たし、各地点の10年変化率を平均すると{percent(hachioji.matched.meanChangePercent)}でした。継続地点の全てを網羅する集計ではなく、条件を厳しくした一部の地点の比較です。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full text-sm"><caption className="mb-3 text-left font-semibold">同地点と確認できた部分標本の10年変化。各地点の（2026価格÷2016価格−1）×100を集計</caption><thead><tr className="border-b border-slate-300"><th scope="col" className="p-3 text-left">市</th>{["採用地点数", "平均変化率", "変化率の中央値", "最小", "最大"].map(t => <th scope="col" className={th} key={t}>{t}</th>)}</tr></thead><tbody>{data.cities.map(c => <tr key={c.code} className="border-b border-slate-100"><th scope="row" className="p-3 text-left font-medium">{c.name}</th><td className={td}>{c.matched.count} / {c.current.count}</td><td className={td}>{percent(c.matched.meanChangePercent)}</td><td className={td}>{percent(c.matched.medianChangePercent)}</td><td className={td}>{percent(c.matched.min)}</td><td className={td}>{percent(c.matched.max)}</td></tr>)}</tbody></table></div>
        <p>青梅では、全標本の平均価格は{percent(ome.meanChangePercent)}なのに対し、採用した{ome.matched.count}地点の平均変化率は{percent(ome.matched.meanChangePercent)}でした。「平均価格の差」と「各地点の変化率の平均」は、対象も計算も違います。差の全てを地点の入れ替わりの効果とみなすことはできません。</p>
        <p className="text-sm text-slate-600">採用は6市で{data.continuity.count}地点、2026年341地点のうち116地点は同地点比較から除外。番号変更を推測で接続せず、所在地等の変更がある地点も保守的に除外しています。住宅地の市場全体の価格指数ではありません。</p>
      </section>

      <section id="limits" className="scroll-mt-6 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">安い＝お得、まで言えるだろうか。</h2>
        <p>今回分かったのは、八王子の住宅地標準地の平均が近隣4市より低いことと、市内にも大きな価格の幅があることです。交通、通勤・通学時間、坂道、土地の形、建てられる建物、造成や建築の費用、生活に必要な施設までは、この価格表一つで比較できません。</p>
        <p>地価公示は、毎年1月1日時点の標準的な土地の正常な価格を示す制度です。個々の土地の実際の売買価格は、取引時期や土地条件などによって異なります。公示価格だけで購入の有利不利や住みやすさは判断できません。</p>
        <h3 className="text-lg font-bold text-slate-900">残った疑問</h3><p>同じ駅距離や土地条件にそろえても市ごとの差は残るのか。標準地の配置を変えると、平均はどの程度変わるのか。今回はそこまで検証していません。駅距離の全地点散布図と取引価格の分析は見送り、出典に記録された2地点の距離の紹介にとどめました。</p>
      </section>

      <section id="method" className={`${card} scroll-mt-6 space-y-4`}>
        <h2 className="text-2xl font-bold text-slate-900">データと方法・再現するには</h2>
        <p>国土交通省「国土数値情報（地価公示）」東京都データを2026年10月26日に取得しました。価格時点は2016年・2026年の各1月1日。用途コード000の住宅地だけを取り出し、各年の標準地を等しく1件として集計しています。7月1日時点の都道府県地価調査、商業地、実際の取引価格は混ぜていません。</p>
        <p>件数・最小・最大は、国土交通省「第6表 東京圏の市区の住宅地の平均価格等」と6市・両年とも一致。平均は同表の100円単位に丸めると一致しました。本文の平均は元データから計算し、表は1円、万円表示は小数点以下2桁、率は小数点以下1桁に丸めています。中央値は価格順の中央、偶数件なら中央2値の平均です。</p>
        <p>同地点比較の条件：{data.continuity.method} 正確な地点境界を確定するための照合ではありません。所在地・面積・価格が一致しても履歴で継続を確認できない地点は含めません。原典の2016年価格履歴が0の年は未選定であり、「地価0円」として扱いません。</p>
        <p>出典・利用条件：2026年は個別データに記載されたCC BY 4.0、2016年は「商用可」の旧利用約款に従います。広告表示を含む商用利用に対応する条件です。<strong>国土交通省「国土数値情報（地価公示）」をもとにbearworks.ukが住宅地抽出・正規化・集計・図表化しました。国が作成した分析ではありません。</strong> データの位置精度や標本の偏りという限界も引き継いでいます。</p>
        <p>地図は標準地の代表点です。敷地境界、売地の位置、地点のない地域の価格を示しません。2016年座標はJGD2000、2026年はJGD2011で、両年の座標差をそのまま土地の移動量と解釈しません。背景地図は国土地理院の淡色タイルを表示時に読み込み、出典を地図の下に表示します。</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-sky-800">
          <li><a className="underline" href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html">国土交通省：地価公示の原本・データ辞書・年別ダウンロード</a></li>
          <li><a className="underline" href="https://www.mlit.go.jp/tochi_fudousan_kensetsugyo/content/001986139.pdf">2026年 第6表（PDF・1ページ目で6市を照合）</a></li>
          <li><a className="underline" href="https://www.mlit.go.jp/common/001212283.pdf">2016年 第6表（PDF・1ページ目で6市を照合）</a></li>
          <li><a className="underline" href="https://www.city.hachioji.tokyo.jp/kurashi/zeikin/002/003/p035547.html">八王子市：地価公示と基準地価格の制度説明</a></li>
          <li><a className="underline" href="https://nlftp.mlit.go.jp/ksj/other/agreement_02.html">2016年データの旧利用約款（商用可・出典・加工表示・適用限界）</a></li>
          <li><a className="underline" href="https://nlftp.mlit.go.jp/ksj/other/agreement_01.html">2026年データの個別利用規約・CC BY 4.0互換の説明</a></li>
          <li><a className="underline" href={file("source-manifest.json")}>原本URL・取得日・SHA256・計算コード版・利用条件</a></li>
          <li><a className="underline" href={file("hachioji-land-prices-2026-10-26.r1.json")}>全集計・地点データ（JSON）</a></li>
          <li><a className="underline" href={file("points.csv")}>6市・両年の685地点をCSVでダウンロード</a></li>
          <li><a className="underline" href={file("continuity-audit.csv")}>同地点比較の採用・除外理由（341地点）</a></li>
          <li><a className="underline" href={file("README.txt")}>公開データから再計算する手順</a> · <a className="underline" href={file("generate_bundle.py")}>集計コード</a> · <a className="underline" href={file("normalized-inputs.json")}>固定入力データ</a></li>
        </ul>
        <p className="text-sm">再計算はPython 3.12以上で、集計コードと固定入力を同じフォルダに保存し、次のコマンドで実行できます。取得・正規化した入力から各平均・中央値・同地点判定と公開集計を再生成します。</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-100 p-4 text-xs leading-6"><code>python generate_bundle.py --input normalized-inputs.json --output reproduced</code></pre>
      </section>

      <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9"><p className="text-sm font-bold tracking-widest text-cyan-200">八王子を数字で読み解く</p><h2 className="mt-2 text-2xl font-bold">人口も、見る範囲で違って見える。</h2><p className="mt-3 text-sm text-slate-200">第1弾では、市全体・地域別・年齢別に人口の変化を確かめました。</p><p className="mt-5"><Link href="/labs/hachioji-population" className="font-semibold text-cyan-200 underline underline-offset-4">八王子の人口は本当に減っている？ →</Link></p><p className="mt-3"><Link href="/labs" className="font-semibold text-cyan-200 underline underline-offset-4">Labsの記事一覧 →</Link></p></section>
    </article>
    <PublicSiteFooter />
  </main>;
}
