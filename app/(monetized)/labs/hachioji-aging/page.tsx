import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import AgingRegions from "@/components/AgingRegions";
import { agingBundle as data, agingNumber as n, agingShare as pct, agingSigned as signed } from "@/lib/hachioji-aging-publication";

const title = "八王子は高齢者の街になっている？";
const description = "65歳以上の人数と割合、75歳・85歳以上の内訳、近隣6市と199町丁を公式人口データで比較。2016年から2026年の年齢構成の変化を読み解きます。";
const canonical = "https://bearworks.uk/labs/hachioji-aging";
export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`, description,
  alternates: { canonical },
  openGraph: { type: "article", url: canonical, title, description, siteName: "bearworks.uk", images: [{ url: "https://bearworks.uk/images/hachioji-aging/hero-illustration.webp", width: 1536, height: 1024, alt: "丘陵の街並みを背景に、公園で散歩や会話を楽しむ人々のイラスト" }] },
};
const card = "rounded-2xl border border-slate-200 bg-white p-4 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900";
const colors = ["bg-cyan-600", "bg-slate-500", "bg-sky-800", "bg-amber-600", "bg-rose-800"];
const graphNote = "対象：八王子市全体 · 基準日：2016-09-30 / 2026-09-30 · 住民基本台帳、日本人と外国人の合計";

export default function HachiojiAgingPage() {
  const [before, after] = data.city;
  const older = data.metrics.find(r => r.key === "age65plus")!;
  const over75 = data.metrics.find(r => r.key === "age75plus")!;
  const over85 = data.metrics.find(r => r.key === "age85plus")!;
  const early = data.exclusiveGroups.find(r => r.label === "65〜74歳")!;
  const hachioji = data.comparison.find(r => r.code === "13201")!;
  const cityArea = data.comparison.find(r => r.code === "13200")!;
  const tokyo = data.comparison.find(r => r.code === "13000")!;
  const highest = data.regionalSummary.highest;
  const lowest = data.regionalSummary.lowest;
  const maxBin = Math.max(...data.ageBins.flatMap(r => [r.before, r.after]));
  const compareCities = [...data.comparison].sort((a,b) => b.age65plus*a.population-a.age65plus*b.population);
  return <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "Article", headline: title, description, mainEntityOfPage: canonical,
      datePublished: data.publishedDate, dateModified: data.publishedDate,
      image: "https://bearworks.uk/images/hachioji-aging/hero-illustration.webp",
      author: { "@type": "Organization", name: "bearworks.uk" },
      isBasedOn: ["https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/index.html", "https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26000001.htm"],
    }) }} />
    <PublicSiteHeader />
    <article className="mx-auto max-w-5xl space-y-10 text-base leading-8">
      <header className="overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="min-w-0">
        <p className="text-sm font-semibold tracking-widest text-cyan-200">八王子を数字で読み解く · 第3弾</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">八王子は<br className="hidden lg:block" />高齢者の街に<br className="hidden sm:block" />なっている？</h1>
        <p className="mt-5 text-xl font-semibold text-cyan-100">10年の年齢構成、近隣市、<br className="hidden lg:block" />市内の違いから確かめる</p>
        <p className="mt-5 max-w-3xl text-slate-200">「八王子は高齢者が多くなった」と感じることはありますか。市全体の割合が上がっていても、どの年齢層が増えたのか、住んでいる地域ではどうなのかは別の問いです。公式の年齢別人口を使い、人数と割合を分けて見ていきます。</p>
          </div>
          <figure className="min-w-0">
            <Image src="/images/hachioji-aging/hero-illustration.webp" width={1536} height={1024} alt="多摩丘陵の街並みを背景に、公園で散歩や会話を楽しむ高齢者と親子のイラスト" unoptimized priority className="h-auto w-full rounded-2xl" />
            <figcaption className="mt-3 text-xs leading-6 text-slate-300">導入用のAI生成イラスト。実在の場所や人物、人口・年齢構成の比率を再現したものではありません。</figcaption>
          </figure>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[[pct(before.share65plus), "2016年9月末 · 65歳以上"], [pct(after.share65plus), "2026年9月末 · 65歳以上"], [`+${older.points!.toFixed(1)}ポイント`, "10年の割合の変化"]].map(([value,label]) => <div key={label} className="rounded-2xl border border-white/20 bg-white/5 p-4"><p className="text-2xl font-bold tabular-nums text-cyan-100">{value}</p><p className="mt-1 text-xs text-slate-300">{label}</p></div>)}
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-300">市内比較：2016年・2026年の9月末 · 市間比較：2026年1月1日（別分析）<br />割合の分母は各時点・各地域の総人口。日本人と外国人の合計。公開：2026年10月26日</p>
      </header>

      <section aria-labelledby="findings" className="space-y-4">
        <p className="text-xs font-bold tracking-widest text-cyan-800">数字から分かったこと</p>
        <h2 id="findings" className={heading}>高齢化は進んでいます。ただし、年齢層でも地域でも一様ではありません。</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          <li className={card}><h3 className="font-bold text-slate-900">割合だけでなく、人数も増えた</h3><p className="mt-2">65歳以上は{n(older.before)}人から{n(older.after)}人へ、{n(older.delta)}人増加。総人口が{n(before.population-after.population)}人減った中で、割合は{older.points!.toFixed(1)}ポイント上がりました。</p></li>
          <li className={card}><h3 className="font-bold text-slate-900">75歳以上の増加が大きい</h3><p className="mt-2">75歳以上は{n(over75.delta)}人増える一方、65〜74歳は{n(Math.abs(early.delta))}人減少。65歳以上を一括りにすると、この違いを見落とします。</p></li>
          <li className={card}><h3 className="font-bold text-slate-900">近隣6市では高い側にある</h3><p className="mt-2">同じ2026年1月1日では、八王子の65歳以上割合は{pct(hachioji.share65plus)}。比較する6市では青梅に次ぎ、東京都市部の{pct(cityArea.share65plus)}も上回ります。</p></li>
          <li className={card}><h3 className="font-bold text-slate-900">市内にも大きな幅がある</h3><p className="mt-2">総人口100人以上の町丁では、65歳以上の割合は{pct(lowest.share65plus)}〜{pct(highest.share65plus)}。全市の{pct(after.share65plus)}だけで、自分の地域を表せるわけではありません。</p></li>
        </ul>
      </section>
      <nav aria-label="記事の目次" className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-slate-100 p-5 text-sm font-semibold text-sky-800">{[["change","10年の変化"],["structure","何歳の人が増えた？"],["cities","他市との比較"],["towns","町丁を調べる"],["limits","統計の読み方"],["method","方法・出典"]].map(([id,label]) => <a key={id} href={`#${id}`} className="underline underline-offset-4">{label}</a>)}</nav>

      <section id="change" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>65歳以上の「人数」と「割合」を別々に見る</h2>
        <p>割合が上がる理由は、65歳以上が増える場合も、総人口が減る場合もあります。今回は65歳以上の人数が増え、0〜14歳と15〜64歳の人数は減っています。「若い世代が減ったから、割合だけが上がった」という変化ではありません。</p>
        <div className="grid gap-4 md:grid-cols-2">{(["count","share"] as const).map(mode => <figure key={mode} className={card}>
          <figcaption className="font-bold text-slate-900">{mode === "count" ? "65歳以上の人数（人）" : "65歳以上の割合（%）"}</figcaption>
          <p className="mt-1 text-xs text-slate-500">{mode === "count" ? "横軸：0〜20万人。人数の比較で分母なし。" : "横軸：0〜100%。分母：各年の全市人口。"}</p>
          <div className="mt-6 space-y-6">{data.city.map((r,i) => <div key={r.targetDate}><div className="flex justify-between text-sm"><span>{r.targetDate.slice(0,4)}年9月末</span><strong className="tabular-nums text-slate-900">{mode==="count" ? `${n(r.age65plus)}人` : pct(r.share65plus)}</strong></div><div aria-hidden="true" className="mt-2 h-7 rounded bg-slate-100"><span className={`block h-7 rounded ${i ? "bg-sky-800" : "bg-cyan-600"}`} style={{width:`${mode==="count" ? r.age65plus/200000*100 : r.share65plus}%`}} /></div></div>)}</div>
          <p className="mt-4 text-sm font-semibold text-slate-900">{mode==="count" ? `${signed(older.delta)}人` : `${signed(older.points!,1)}ポイント`}の変化</p>
        </figure>)}</div>
        <p className="text-xs text-slate-500">{graphNote}。図はどちらも0を起点にしています。</p>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[700px] text-right text-sm">
          <caption className="mb-3 text-left font-semibold">人数・割合の10年比較。75歳以上と85歳以上は65歳以上の内数です。</caption><thead><tr>{["年齢区分","2016年（人）","2026年（人）","人数差","2016年割合","2026年割合","割合差"].map(h => <th scope="col" key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{data.metrics.map(r => <tr key={r.key} className="border-t border-slate-100"><th scope="row" className="p-2 text-left">{r.label}</th><td className="p-2">{n(r.before)}</td><td className="p-2">{n(r.after)}</td><td className="p-2">{signed(r.delta)}</td><td className="p-2">{pct(r.shareBefore)}</td><td className="p-2">{pct(r.shareAfter)}</td><td className="p-2">{signed(r.points!,1)}pt</td></tr>)}</tbody>
        </table><p className="mt-2 text-xs text-slate-500">ptはパーセントポイント。分母：各年の全市人口。基準日：2016-09-30 / 2026-09-30。</p></div>
      </section>

      <section id="structure" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>「65歳以上」の中身が変わった</h2>
        <p>65〜74歳は{n(early.before)}人から{n(early.after)}人へ減り、75歳以上は{n(over75.before)}人から{n(over75.after)}人へ増えました。85歳以上も{n(over85.before)}人から{n(over85.after)}人です。同じ人々を追跡した集計ではないため、加齢、転入出、死亡などの影響をこの数字だけで分けることはできません。</p>
        <figure className={card}><figcaption className="font-bold text-slate-900">年齢構成を、重ならない5区分に分ける</figcaption><p className="mt-1 text-xs text-slate-500">横軸0〜100%。分母：各年の全市人口。65〜74歳・75〜84歳・85歳以上は互いに重なりません。</p>
          <div className="mt-5 space-y-6">{(["before","after"] as const).map((field,index) => <div key={field}><p className="mb-2 font-semibold">{index ? "2026" : "2016"}年9月末</p><div className="flex h-9 overflow-hidden rounded-lg" role="img" aria-label={data.exclusiveGroups.map(g=>`${g.label} ${pct(index?g.shareAfter:g.shareBefore)}`).join("、")}>{data.exclusiveGroups.map((g,i) => <span key={g.label} className={colors[i]} style={{width:`${index?g.shareAfter:g.shareBefore}%`}} />)}</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">{data.exclusiveGroups.map((g,i)=><p key={g.label}><span aria-hidden="true" className={`mr-1 inline-block size-2 rounded-full ${colors[i]}`} />{g.label}<br /><strong>{pct(index?g.shareAfter:g.shareBefore)}</strong> · {n(g[field])}人</p>)}</div></div>)}</div>
        </figure>
        <figure className={card}><figcaption className="font-bold text-slate-900">5歳階級の人数を比べる</figcaption><p className="mt-1 text-xs text-slate-500">{graphNote}。横軸0〜{n(maxBin)}人、全階級・両年で共通の尺度。</p>
          <div className="mt-3 flex gap-5 text-xs"><span><span className="mr-1 inline-block size-2 bg-cyan-600" />2016年</span><span><span className="mr-1 inline-block size-2 bg-sky-800" />2026年</span></div>
          <div className="mt-4 space-y-3">{data.ageBins.map(r=><div key={r.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 text-xs"><span className="font-semibold text-slate-900">{r.label}</span><div className="space-y-1">{(["before","after"] as const).map((field,i)=><div key={field} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2"><div aria-hidden="true" className="h-2 rounded bg-slate-100"><span className={`block h-2 rounded ${i ? "bg-sky-800" : "bg-cyan-600"}`} style={{width:`${r[field]/maxBin*100}%`}} /></div><span className="text-right tabular-nums"><span className="sr-only">{i ? "2026年" : "2016年"}</span>{n(r[field])}</span></div>)}</div></div>)}</div>
          <p className="mt-4 text-sm">現在の人数が多い階級と、高齢層で増えた階級を同時に見る図です。年齢区分を移った人も含み、将来の人数を予測する図ではありません。</p>
        </figure>
      </section>

        <details className={card}><summary className="cursor-pointer font-semibold text-slate-900">年齢構成図の数値を表で見る</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-right text-sm"><caption className="mb-3 text-left">排他的5区分と5歳階級。2016年・2026年の9月末、単位：人。</caption><thead><tr><th scope="col" className="p-2 text-left">年齢区分</th><th scope="col" className="p-2">2016年（人）</th><th scope="col" className="p-2">2026年（人）</th></tr></thead><tbody>{[...data.exclusiveGroups, ...data.ageBins].map((r,i)=><tr key={i} className="border-t border-slate-100"><th scope="row" className="p-2 text-left">{i<5 ? "5区分：" : "5歳階級："}{r.label}</th><td className="p-2">{n(r.before)}</td><td className="p-2">{n(r.after)}</td></tr>)}</tbody></table></div></details>

      <section id="cities" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>近隣市と比べると、八王子は高い側</h2>
        <p>ここからは全市共通の東京都資料を使い、基準日を<strong>2026年1月1日</strong>にそろえます。八王子の65歳以上割合は{pct(hachioji.share65plus)}。東京都全体の{pct(tokyo.share65plus)}、東京都市部の{pct(cityArea.share65plus)}を上回り、今回の6市では青梅に次いで高い値です。</p>
        <p>一方、75歳以上の割合は町田が{pct(data.comparison.find(r=>r.code==="13209")!.share75plus)}、八王子が{pct(hachioji.share75plus)}で、順番が入れ替わります。「何歳以上を見るか」でも比較の姿は変わります。</p>
        <figure className={card}><figcaption className="font-bold text-slate-900">同じ日・同じ資料による65歳以上と75歳以上の割合</figcaption><p className="mt-1 text-xs text-slate-500">2026-01-01。分母：各市・各集団の総人口。横軸：0〜40%。75歳以上は65歳以上の内数。棒は重ねず別々に表示。</p>
          <div className="mt-4 flex gap-4 text-xs"><span><span className="mr-1 inline-block size-2 bg-sky-800" />65歳以上</span><span><span className="mr-1 inline-block size-2 bg-amber-600" />75歳以上（内数）</span></div>
          <div className="mt-5 space-y-4">{compareCities.map(r=><div key={r.code} className={r.code==="13201" ? "rounded-xl bg-sky-50 p-3" : "px-3"}><div className="flex flex-wrap justify-between gap-x-3 text-sm"><strong className="text-slate-900">{r.name}</strong><span className="text-xs text-slate-500">総人口 {n(r.population)}人</span></div>{(["share65plus","share75plus"] as const).map((key,i)=><div key={key} className="mt-1 grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-2"><div className="h-2 rounded bg-slate-100" aria-hidden="true"><span className={`block h-2 rounded ${i ? "bg-amber-600" : "bg-sky-800"}`} style={{width:`${r[key]/40*100}%`}} /></div><span className="text-right text-sm tabular-nums"><span className="sr-only">{i ? "75" : "65"}歳以上</span>{pct(r[key])}</span></div>)}</div>)}</div>
        </figure>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[670px] text-right text-sm"><caption className="mb-3 text-left">2026年1月1日の比較値。割合の分母は各地域の総人口。</caption><thead><tr>{["地域","総人口（人）","65歳以上（人）","65歳以上割合","75歳以上（人）","75歳以上割合","85歳以上（人）"].map(h=><th scope="col" key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{compareCities.map(r=><tr key={r.code} className="border-t border-slate-100"><th scope="row" className="p-2 text-left">{r.name}</th><td className="p-2">{n(r.population)}</td><td className="p-2">{n(r.age65plus)}</td><td className="p-2">{pct(r.share65plus)}</td><td className="p-2">{n(r.age75plus)}</td><td className="p-2">{pct(r.share75plus)}</td><td className="p-2">{n(r.age85plus)}</td></tr>)}</tbody></table></div>
        <p className="text-sm text-slate-600">東京都市部は八王子を含む26市の合計、東京都全体は区市町村を含む合計です。市の割合の単純平均ではありません。比較する6市は近隣例として選んだもので、東京都全体での順位を示していません。前の9月末の数字とは別分析です。</p>
      </section>

      <section id="towns" className="scroll-mt-6 space-y-5">
        <h2 className={heading}>同じ八王子でも、年齢構成は大きく違う</h2>
        <p>2026年9月末、総人口100人以上の町丁で65歳以上割合が最も高いのは{highest.name}の{pct(highest.share65plus)}（総人口{n(highest.population)}人、65歳以上{n(highest.age65plus)}人）、最も低いのは{lowest.name}の{pct(lowest.share65plus)}（総人口{n(lowest.population)}人、65歳以上{n(lowest.age65plus)}人）です。</p>
        <p>割合が高い地域と、高齢者の人数が多い地域は同じとは限りません。図を切り替えて、総人口も一緒に見てください。この統計から個々の住民の属性や、地域の暮らしやすさを推測することはできません。</p>
        <AgingRegions rows={data.regions} />
        <p className="rounded-xl bg-amber-50 p-4 text-sm">最新時点は全199町丁。総人口100人未満の{data.regionalSummary.small.join("・")}は順位と分けています。10年の変化は区域変更関連8町丁を除く191町丁、さらに両時点100人以上の{data.regionalSummary.changeEligible}町丁を変化順位の対象にします。</p>
        <details className={card}><summary className="cursor-pointer font-semibold text-slate-900">地図を使わない理由と、10年比較から外した地域</summary><div className="mt-4 space-y-3 text-sm">
          <p>2020年の統計用境界を前作で調べましたが、町名の一致だけでは2016年・2026年の同じ区域と認定できませんでした。区域変更等8町丁を除いた人口カバー率は2026年94.41%で、事前95%基準に届いていません。今回は地図を掲載せず、公式の町丁別集計を図と表で示しています。</p>
          <ul className="list-disc pl-5">{data.regions.filter(r=>r.exclusion).map(r=><li key={r.code}>{r.name}：{r.exclusion!.status==="exclude-confirmed-boundary-change" ? "2024年8月10日の区域変更を確認" : "区域変更の議決は確認、施行時点が未確認"}。<a className="text-sky-800 underline" href={r.exclusion!.evidenceUrl}>公式資料</a></li>)}</ul>
          <p>この8町丁も最新時点と全市集計には含みます。残る191町丁についても、境界が10年間不変だったと完全に証明したものではありません。</p>
        </div></details>
      </section>

      <section id="limits" className="scroll-mt-6 space-y-4">
        <h2 className={heading}>高齢化率だけで、まちの衰退は判断できない</h2>
        <p>高齢化率は「総人口に占める65歳以上の割合」です。率の高低だけで、健康状態、地域活動、買い物や交通の便利さ、医療・介護の利用状況は分かりません。「高齢者の街」とする単一の公式基準を置かず、今回は過去との変化、他市との比較、市内の地域差という3つの見方を使いました。</p>
        <p>25.5%から28.2%への変化は、約2.7<strong>パーセントポイント</strong>の上昇です。「2.7%の人数増」とは意味が違います。また、75歳以上・85歳以上を65歳以上に足すと、同じ人を重ねて数えることになります。</p>
        <p>小人口地域の割合は、少人数の転入出などでも動きやすくなります。地域の順位を固定した評価にせず、人数・基準日・比較範囲と一緒に読んでください。原因や今後を知るには、転入出、出生死亡、住宅、施設など別の資料が必要です。</p>
      </section>
      <section id="method" className={`${card} scroll-mt-6 space-y-4`}>
        <h2 className={heading}>出典・集計方法・再現手順</h2>
        <p>市内は八王子市「町丁別年齢別人口」の2016年9月末xlsと2026年9月末xlsxを使用。0〜4歳から100歳以上までの5歳階級をそろえ、全年齢・年齢3区分・男女・全199町丁の合計を照合しました。前作の町丁別人口・年齢3区分とも全199町丁で一致しています。市のCSVとExcelにあった前作の差を混ぜないため、今回もExcel系列に統一しています。</p>
        <p>近隣市は東京都「住民基本台帳による東京都の世帯と人口」2026年1月1日、第7表の総数を用い、日本人と外国人を含めています。2026年9月10日訂正版を2026年10月26日に取得しました。5歳階級を集計し、年齢3区分を第3-1表とも照合しています。東京都人数欄の「−」は公式注意書きの「皆無又は該当数値なし」に従って扱い、それ以外の空欄・欠損は0に補完しません。</p>
        <p>割合＝対象年齢人口÷同じ時点・同じ地域の総人口×100。採用した市全体・町丁・比較市には年齢不詳の集計残差はありません。人数差と、丸め前の割合の差から求めたポイント差を区別し、表示を四捨五入しています。国勢調査人口や将来推計は使っていません。</p>
        <p><strong>出典：八王子市「町丁別年齢別人口」、CC BY 4.0。改変：文字表記の正規化、年齢集計、図表化。</strong>東京都は公表された数値の事実を独自に集計し、原文・原表レイアウト・ロゴは転載していません。東京都資料全体にCCライセンスを付けるものではありません。原本は配布せず、集計値・正規化した数値入力・処理コード・出典記録を公開します。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-sky-800">{[
          ["https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p005910.html","八王子市：2016年町丁別年齢別人口"],
          ["https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p037124.html","八王子市：2026年町丁別年齢別人口"],
          ["https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html","八王子市：人口データとCC BY 4.0"],
          ["https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26000001.htm","東京都：2026年1月人口・統計表"],
          ["https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26qf0002.pdf","東京都：利用上の注意"],
          ["https://www.toukei.metro.tokyo.lg.jp/homepage/site-policy.htm","東京都：サイトポリシー"],
        ].map(([href,label])=><li key={href}><a className="underline" href={href}>{label}</a></li>)}</ul>
        <details className="rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold text-slate-900">集計データと再現方法を開く</summary><div className="mt-3 space-y-3 text-sm">
          <p>原本URL・取得日時・SHA256・加工条件は出典記録にあります。固定入力からの再生成はPython標準ライブラリだけで実行できます。詳しくは再現手順を参照してください。</p>
          <ul className="list-disc pl-5 text-sky-800">{[["source-manifest.json","出典・権利・検算の記録"],["city-ages.csv","全市の人数・割合CSV"],["comparison-cities.csv","同一基準日の市比較CSV"],["town-ages.csv","全199町丁CSV"],["hachioji-aging-2026-10-26.r1.json","記事と図表の固定JSON"],["README.txt","再現手順"],["normalized-inputs.json","固定数値入力"],["generate_bundle.py","再生成スクリプト"],["prepare_sources.py","原本取得・正規化スクリプト"],["retrieval.json","原本URL・hash・取得日時"],["region-exclusions.json","区域変更等の除外根拠"]].map(([file,label])=><li key={file}><a href={`/data/hachioji-aging/${file}`} className="underline">{label}</a></li>)}</ul>
        </div></details>
      </section>
      <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-2">
        <Link href="/labs/hachioji-population" className={`${card} font-semibold text-sky-800 hover:bg-sky-50`}>第1弾：八王子の人口は本当に減っている？ →</Link>
        <Link href="/labs/hachioji-land-prices" className={`${card} font-semibold text-sky-800 hover:bg-sky-50`}>第2弾：八王子は本当に土地が安い？ →</Link>
        <Link href="/labs" className="text-sm font-semibold text-sky-800 underline">Labsの記事一覧へ</Link>
      </nav>
    </article>
    <PublicSiteFooter />
  </main>;
}
