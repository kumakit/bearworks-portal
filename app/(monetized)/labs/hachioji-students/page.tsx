import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, Home, School } from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import data from "@/public/data/hachioji-students/student-data.json";

const title = "八王子はまだ学生の街？";
const description = "市内の大学等で学ぶ学生数はどう変わった？ 2006～2023年の推移、キャンパス移転、学生の居住地と定住意向を八王子市の公表資料で確かめます。";
const canonical = "https://bearworks.uk/labs/hachioji-students";
const imagePath = "/images/hachioji-students/hero-illustration.webp";
const image = `https://bearworks.uk${imagePath}`;
const imageAlt = "緑に囲まれた大学キャンパスへ向かう学生たちのイラスト";

export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`,
  description,
  alternates: { canonical },
  openGraph: {
    type: "article", url: canonical, title, description, siteName: "bearworks.uk",
    images: [{ url: image, width: 1536, height: 1024, alt: imageAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl";
const textLink = "font-semibold text-teal-900 underline underline-offset-4";
const n = new Intl.NumberFormat("ja-JP").format;
const day = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "UTC" });
const rows = data.trend.rows;
const first = rows[0];
const previous = rows[rows.length - 2];
const last = rows[rows.length - 1];
const scope = data.schoolScope;
const survey = data.survey;
const decrease = (earlier: number) => earlier - last.students;
const percentDecrease = (earlier: number) => (decrease(earlier) / earlier * 100).toFixed(1);
const surveyResults = [
  { label: "調査時点で八王子市内に住んでいた", percent: survey.residentPercent },
  { label: "卒業後に市内に住みたい、または住む予定", percent: survey.intendsToLivePercent },
];
const topics = [
  { id: "trend", Icon: GraduationCap, title: "学生数の推移", caption: "18年分の数字とキャンパス移転" },
  { id: "schools", Icon: School, title: "学校の集計範囲", caption: "市内21校と加盟25校の関係" },
  { id: "residence", Icon: Home, title: "学生の居住地", caption: "学生アンケートから分かること" },
];

function StudentTrend() {
  const x = (year: number) => 63 + (year - first.year) / (last.year - first.year) * 468;
  const y = (students: number) => 206 - students / 120000 * 168;
  return (
    <figure className={card}>
      <figcaption className="font-bold text-slate-900">市内の大学等で学ぶ学生数（{first.year}～{last.year}年）</figcaption>
      <svg viewBox="0 0 560 244" className="mt-2 h-auto w-full" role="img" aria-labelledby="student-trend-title">
        <title id="student-trend-title">市内の大学等の学生数の折れ線。縦軸は0人から12万人。年別の値は後続の表に掲載。</title>
        <text x="63" y="23" fontSize="16" fill="#475569">人</text>
        {[0, 30000, 60000, 90000, 120000].map((value) => (
          <g key={value}>
            <line x1="63" x2="531" y1={y(value)} y2={y(value)} stroke="#cbd5e1" strokeDasharray="3 5" />
            <text x="54" y={y(value) + 5} textAnchor="end" fontSize="16" fill="#475569">{value === 0 ? "0" : `${value / 10000}万`}</text>
          </g>
        ))}
        {data.moves.map(({ date }) => {
          const year = Number(date.slice(0, 4));
          return <line key={date} x1={x(year)} x2={x(year)} y1="35" y2="206" stroke="#b45309" strokeDasharray="4 5" />;
        })}
        <polyline points={rows.map(({ year, students }) => `${x(year)},${y(students)}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" />
        {rows.map(({ year, students }) => <circle key={year} cx={x(year)} cy={y(students)} r="3.5" fill="white" stroke="#0f766e" strokeWidth="2" />)}
        {[first.year, 2010, 2015, 2020, last.year].map((year) => <text key={year} x={x(year)} y="230" textAnchor="middle" fontSize="16" fill="#334155">{year}</text>)}
      </svg>
      <p className="text-sm leading-6 text-slate-600">茶色の縦の点線は、下記のキャンパス再編・移転があった年です。</p>
      <details className="mt-4 rounded-xl bg-slate-50 p-4">
        <summary className="cursor-pointer font-semibold text-teal-900">18年分の数値表</summary>
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">市内の大学等で学ぶ学生数（人）</caption>
          <thead><tr><th scope="col" className="p-2 text-left">年</th><th scope="col" className="p-2 text-right">学生数（人）</th></tr></thead>
          <tbody>{rows.map(({ year, students }) => (
            <tr key={year} className="border-t border-slate-200">
              <th scope="row" className="p-2 text-left font-normal">{year}年</th>
              <td className="p-2 text-right tabular-nums">{n(students)}</td>
            </tr>
          ))}</tbody>
        </table>
      </details>
    </figure>
  );
}

export default function HachiojiStudentsPage() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "bearworks.uk" },
    image,
    isBasedOn: [data.trend.source, survey.source, scope.rosterSource, ...data.referenceCounts.map(({ source }) => source)],
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
      <PublicSiteHeader />
      <article className="mx-auto max-w-5xl space-y-12 text-base leading-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
          <div className="grid items-center gap-8 px-6 pb-8 pt-8 sm:px-10 sm:pt-12 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.15em] text-teal-200">八王子を数字で読み解く · 第5弾</p>
              <h1 className="mt-5 text-3xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.4]">八王子はまだ<span className="block">学生の街？</span></h1>
              <p className="mt-5 text-balance text-lg font-semibold text-amber-200 sm:text-2xl">学生が減っても「学園都市」？</p>
              <p className="mt-5 text-slate-200">八王子には多くの大学があります。そこで学ぶ学生は何人いて、どこに住んでいるのでしょうか。市の資料をもとに、キャンパスの学生数と学生アンケートを読み解きます。</p>
              <p className="mt-5 text-xs leading-6 text-slate-300">学生数の推移：2006～2023年 · 参考値：2025年まで · 学生アンケート：2023年</p>
            </div>
            <figure className="min-w-0">
              <Image src={imagePath} width={1536} height={1024} alt={imageAlt} unoptimized preload className="h-auto w-full rounded-2xl" />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">AI生成イラスト。八王子の風景を参考に、架空のキャンパスを描いています。</figcaption>
            </figure>
          </div>
          <nav aria-label="記事の目次" className="grid border-t border-white/10 bg-white/5 sm:grid-cols-3">
            {topics.map(({ id, Icon, title, caption }) => (
              <a key={id} href={`#${id}`} className="flex items-center gap-4 border-b border-white/10 px-6 py-5 last:border-0 hover:bg-white/10 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-teal-200 sm:border-b-0 sm:border-r">
                <Icon size={28} className="shrink-0 text-teal-200" aria-hidden="true" />
                <span><span className="block font-bold">{title}</span><span className="block text-xs text-slate-300">{caption}</span></span>
              </a>
            ))}
          </nav>
        </header>

        <section aria-labelledby="findings" className="space-y-5">
          <h2 id="findings" className={heading}>市内の学生数は、17年間で約14％減った</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-950"><p className="text-sm font-bold">市内の大学等で学ぶ学生</p><p className="mt-2 text-3xl font-bold">{n(last.students)}<span className="ml-1 text-sm">人</span></p><p className="mt-2 text-sm">{last.year}年のキャンパス学生数</p></div>
            <div className="rounded-2xl bg-sky-50 p-5 text-sky-950"><p className="text-sm font-bold">{first.year}年からの変化</p><p className="mt-2 text-3xl font-bold">{percentDecrease(first.students)}<span className="ml-1 text-sm">％減</span></p><p className="mt-2 text-sm">{last.year}年までに{n(decrease(first.students))}人減少</p></div>
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-950"><p className="text-sm font-bold">アンケートで市内在住と回答</p><p className="mt-2 text-3xl font-bold">{survey.residentPercent}<span className="ml-1 text-sm">％</span></p><p className="mt-2 text-sm">2023年のWeb調査、{n(survey.responses)}人の回答</p></div>
          </div>
          <p><Link href="/labs/hachioji-city-center" className={textLink}>前回の中心市街地の記事</Link>では、住む人、歩く人、商いを分けて街を見ました。今回は、八王子で学ぶ人と、八王子に暮らす学生に目を向けます。</p>
        </section>

        <section id="trend" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>学生数はいつ減った？</h2>
          <p>市の「学園都市ビジョン」によると、市内の大学等で学ぶ学生数は{first.year}年の{n(first.students)}人から{last.year}年の{n(last.students)}人に減りました。{previous.year}年から{last.year}年だけでも{n(decrease(previous.students))}人（{percentDecrease(previous.students)}％）減っています。</p>
          <StudentTrend />
          <div className={card}>
            <h3 className="font-bold text-slate-900">キャンパスが変わった年</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6">
              {data.moves.map(({ date, school, detail, source }) => (
                <li key={date}><span className="font-semibold text-slate-900">{date.slice(0, 4)}年{Number(date.slice(5))}月</span>　<a href={source} className={textLink}>{school}</a>　{detail}</li>
              ))}
            </ul>
          </div>
          <p>移転と学生数が減った年は重なります。市のグラフは複数校の合計なので、移転が減少にどれだけ影響したかを知るには、大学・キャンパス別の同じ基準の数値が必要です。</p>
          <aside className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">2024年・2025年は別資料で見る</h3>
            <p className="mt-2">市の「八王子市の概要」にも、市内の大学・短大・高専の学生数が掲載されています。</p>
            <ul className="mt-2 list-disc pl-5">
              {data.referenceCounts.map(({ date, schools, students, source, page }) => (
                <li key={date}>{day.format(new Date(date))}時点　{schools}校・{n(students)}人（<a href={source} className={textLink}>市の概要 {page}ページ</a>）</li>
              ))}
            </ul>
            <p className="mt-2">キャンパスや大学院の扱いが学園都市ビジョンの集計と同じか、公開資料からは確認できません。上の折れ線とは別に示し、2023年との差から増減を判断することは控えます。</p>
          </aside>
        </section>

        <section id="schools" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>市内21校とコンソーシアム加盟25校</h2>
          <p>{scope.year}年度の市の資料では、市内の大学・短大・高専は{scope.citySchools}校です。大学コンソーシアム八王子は市外の学校も参加する連携組織で、市内{scope.citySchools}校を含む{scope.consortiumSchools}校を集計しています。</p>
          <figure className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
            <figcaption className="font-bold text-sky-950">コンソーシアム加盟校　{scope.consortiumSchools}校・約{scope.consortiumApproxStudents / 10000}万人</figcaption>
            <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-950"><p className="font-bold">うち、市内に立地する学校　{scope.citySchools}校・約{scope.cityApproxStudents / 10000}万人</p></div>
            <p className="mt-3 text-xs leading-6 text-slate-600">{scope.year}年度の集計範囲。枠の大きさは学生数に比例しません。</p>
          </figure>
          <p className="text-sm">{day.format(new Date(scope.rosterDate))}時点の<a href={scope.rosterSource} className={textLink}>加盟校一覧</a>には、町田市・多摩市に所在する学校や、市境をまたぐキャンパスも載っています。</p>
        </section>

        <section id="residence" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>学生は八王子に住んでいる？</h2>
          <p>八王子市は{day.format(new Date(survey.start))}から{day.format(new Date(survey.end))}まで、メールと市広報SNSで大学生向けWeb調査を案内し、{n(survey.responses)}人から回答を得ました。住んでいる場所と、卒業後に住みたい場所についても尋ねています。</p>
          <figure className={card}>
            <figcaption className="font-bold text-slate-900">2023年の学生アンケート（回答者{n(survey.responses)}人）</figcaption>
            <ul className="mt-4 space-y-5 text-sm leading-6">
              {surveyResults.map(({ label, percent }) => (
                <li key={label}>
                  <div className="flex items-baseline justify-between gap-3"><span>{label}</span><strong className="shrink-0 tabular-nums text-teal-950">{percent}％</strong></div>
                  <div className="mt-1 h-3 rounded-full bg-slate-100" aria-hidden="true"><div className="h-3 rounded-full bg-teal-700" style={{ width: `${percent}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-6 text-slate-600">棒の全幅は100％。二つは別々の質問への回答です。</p>
          </figure>
          <p>この割合は回答した学生の結果です。学生全体の居住割合を推計するには回答者の代表性の確認が、卒業後の転居を知るには追跡調査が必要です。</p>
        </section>

        <section aria-labelledby="conclusion" className="space-y-5">
          <h2 id="conclusion" className={heading}>八王子はまだ学生の街？</h2>
          <p>{last.year}年度の八王子では、{first.year}年より学生数が減ったあとも、市内{scope.citySchools}校で約{scope.cityApproxStudents / 10000}万人が学んでいました。八王子で学ぶ学生がどこで暮らし、卒業後も街とどう関わるかを考えると、「学生の街」の姿を人数だけより具体的に捉えられます。</p>
        </section>

        <section id="method" className={`${card} space-y-4`}>
          <h2 className={heading}>調査方法・出典</h2>
          <p className="text-sm leading-7">市の学園都市ビジョン{data.trend.printedPage}ページの「{data.trend.scope}」の点を年ごとに転記し、原図と照合しました。増減率は、減った人数を比較の起点の学生数で割って小数第1位に丸めています。都市間比較には、学校・キャンパスの範囲と調査時点をそろえた数値が必要です。</p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            <li><a href={data.trend.source} className={textLink}>八王子市「第2期はちおうじ学園都市ビジョン」第2章（{data.trend.printedPage}ページ）</a></li>
            <li><a href={survey.source} className={textLink}>八王子市「学園都市ビジョン アンケート集計結果」（1・25・31ページ）</a></li>
            <li><a href="/data/hachioji-students/student-data.json" className={textLink}>集計データと出典（JSON）</a></li>
          </ul>
        </section>

        <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-2">
          <Link href="/labs/hachioji-international" className={`${card} hover:bg-teal-50 sm:col-span-2`}><span className="block text-xs font-bold text-teal-800">次回・第6弾</span><span className="mt-2 block font-semibold text-slate-900">八王子は国際的になってきている？ →</span></Link>
          <Link href="/labs/hachioji-city-center" className={`${card} hover:bg-teal-50`}><span className="block text-xs font-bold text-teal-800">前回・第4弾</span><span className="mt-2 block font-semibold text-slate-900">八王子の中心市街地は発展しつつある？ →</span></Link>
          <Link href="/labs" className={`${card} hover:bg-teal-50`}><span className="font-semibold text-teal-900">Labsの記事一覧へ →</span></Link>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
