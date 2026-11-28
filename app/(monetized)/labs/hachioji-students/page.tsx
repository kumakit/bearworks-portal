import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, Home, MapPin, School } from "lucide-react";
import Link from "@/components/InternalLink";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  CampusLocationMap,
  StudentSurveyConfidenceChart,
  StudentTrendAndIndexChart,
  StudentYoYChart,
  type CampusLocationsProp,
  type StudentAnalysisProp,
} from "@/components/hachioji/StudentsCharts";
import data from "@/public/data/hachioji-students/student-data.json";
import analysisJson from "@/public/data/hachioji-students/analysis.json";
import campusJson from "@/public/data/hachioji-students/campus-locations.json";

const analysis = analysisJson as StudentAnalysisProp;
const campusData = campusJson as CampusLocationsProp;

const title = "八王子はまだ学生の街？";
const description =
  "市内の大学等で学ぶ学生数はどう変わった？ 2006～2023年の推移を指数・前年差・区間傾向で読み解き、加盟25校の位置図やアンケート誤差幅とあわせて確かめます。";
const canonical = "https://bearworks.uk/labs/hachioji-students";
const imagePath = "/images/hachioji-students/hero-illustration.webp";
const image = `https://bearworks.uk${imagePath}`;
const imageAlt = "緑に囲まれた大学キャンパスへ向かう学生たちのイラスト";

export const metadata: Metadata = {
  title: `${title} | 八王子を数字で読み解く | bearworks.uk`,
  description,
  alternates: { canonical },
  openGraph: {
    type: "article",
    url: canonical,
    title,
    description,
    siteName: "bearworks.uk",
    images: [{ url: image, width: 1536, height: 1024, alt: imageAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl";
const subheading = "text-xl font-bold leading-relaxed text-slate-900";
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
const percentDecrease = (earlier: number) => ((decrease(earlier) / earlier) * 100).toFixed(1);
const { indexSummary, yoySummary, regressionSummary, surveySummary } = analysis;

const topics = [
  { id: "trend", Icon: GraduationCap, title: "学生数の推移", caption: "指数・前年差・減少のペース" },
  { id: "schools", Icon: MapPin, title: "学校の範囲と地図", caption: "21校と25校・移転3件の位置" },
  { id: "residence", Icon: Home, title: "学生の居住地", caption: "アンケートの誤差幅を読む" },
];

export default function HachiojiStudentsPage() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "bearworks.uk" },
    image,
    isBasedOn: [
      data.trend.source,
      survey.source,
      scope.rosterSource,
      ...data.referenceCounts.map(({ source }) => source),
    ],
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 text-slate-700 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }}
      />
      <PublicSiteHeader />
      <article className="mx-auto max-w-5xl space-y-12 text-base leading-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
          <div className="grid items-center gap-8 px-6 pb-8 pt-8 sm:px-10 sm:pt-12 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.15em] text-teal-200">
                八王子を数字で読み解く · 第5弾
              </p>
              <h1 className="mt-5 text-3xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.4]">
                八王子はまだ<span className="block">学生の街？</span>
              </h1>
              <p className="mt-5 text-balance text-lg font-semibold text-amber-200 sm:text-2xl">
                学生が減っても「学園都市」？
              </p>
              <p className="mt-5 text-slate-200">
                八王子には多くの大学があります。そこで学ぶ学生は何人いて、減り方にはどんな特徴があるのでしょうか。市の資料をもとに、推移のペース、キャンパスの場所、アンケートの誤差幅まで読み解きます。
              </p>
              <p className="mt-5 text-xs leading-6 text-slate-300">
                学生数の推移：2006～2023年 · 参考値：2025年まで · 加盟校一覧：2025年5月 · 学生アンケート：2023年
              </p>
            </div>
            <figure className="min-w-0">
              <Image
                src={imagePath}
                width={1536}
                height={1024}
                alt={imageAlt}
                unoptimized
                preload
                className="h-auto w-full rounded-2xl"
              />
              <figcaption className="mt-3 text-xs leading-6 text-slate-300">
                AI生成イラスト。八王子の風景を参考に、架空のキャンパスを描いています。
              </figcaption>
            </figure>
          </div>
          <nav aria-label="記事の目次" className="grid border-t border-white/10 bg-white/5 sm:grid-cols-3">
            {topics.map(({ id, Icon, title: itemTitle, caption }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-4 border-b border-white/10 px-6 py-5 last:border-0 hover:bg-white/10 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-teal-200 sm:border-b-0 sm:border-r"
              >
                <Icon size={28} className="shrink-0 text-teal-200" aria-hidden="true" />
                <span>
                  <span className="block font-bold">{itemTitle}</span>
                  <span className="block text-xs text-slate-300">{caption}</span>
                </span>
              </a>
            ))}
          </nav>
        </header>

        <section aria-labelledby="findings" className="space-y-5">
          <h2 id="findings" className={heading}>
            市内の学生数は、17年間で約14％（7人に1人分）減った
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-950">
              <p className="text-sm font-bold">市内の大学等で学ぶ学生</p>
              <p className="mt-2 text-3xl font-bold">
                {n(last.students)}
                <span className="ml-1 text-sm">人</span>
              </p>
              <p className="mt-2 text-sm">{last.year}年のキャンパス学生数</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-5 text-sky-950">
              <p className="text-sm font-bold">{first.year}年からの変化</p>
              <p className="mt-2 text-3xl font-bold">
                {percentDecrease(first.students)}
                <span className="ml-1 text-sm">％減</span>
              </p>
              <p className="mt-2 text-sm">
                {n(decrease(first.students))}人減（年平均 {indexSummary.cagrPercent.toFixed(2)}％）
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-950">
              <p className="text-sm font-bold">アンケートで市内在住と回答</p>
              <p className="mt-2 text-3xl font-bold">
                {survey.residentPercent}
                <span className="ml-1 text-sm">％</span>
              </p>
              <p className="mt-2 text-sm">
                {n(survey.responses)}人調査 · 目安の幅 {surveySummary.resident.ciLow.toFixed(1)}～
                {surveySummary.resident.ciHigh.toFixed(1)}％
              </p>
            </div>
          </div>
          <p>
            <Link href="/labs/hachioji-city-center" className={textLink}>
              前回の中心市街地の記事
            </Link>
            では、住む人、歩く人、商いを分けて街を見ました。今回は、八王子で学ぶ人の数が「ふだんの年」と比べていつ大きく動いたのか、キャンパスの位置やアンケートのぶれ幅とあわせて確かめます。
          </p>
        </section>

        <section id="trend" className="scroll-mt-6 space-y-6">
          <h2 className={heading}>学生数はじわじわではなく、節目の年に階段状に減った</h2>
          <p>
            市の「学園都市ビジョン」によると、市内の大学等で学ぶ学生数は{first.year}年の
            {n(first.students)}人から{last.year}年の{n(last.students)}人に減りました。
            {previous.year}年から{last.year}年だけでも{n(decrease(previous.students))}人（
            {percentDecrease(previous.students)}％）減っています。
          </p>

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">1つ目のグラフの読み方（指数と2つの傾き）</h3>
            <p className="mt-2">
              上のボタンで「2006年＝100 指数」に切り替えると、出発点を100にそろえて増減の大きさを比べられます。
              {indexSummary.peakYear}年に{indexSummary.peakIndex2006.toFixed(1)}（
              {n(indexSummary.peakStudents)}人）でピークを付けたあと、{last.year}年には
              {indexSummary.latestIndex2006.toFixed(1)}まで下がりました。17年間でおよそ7人に1人分が減り、1年あたりの平均変化率（年平均変化率）は{" "}
              <strong>{indexSummary.cagrPercent.toFixed(2)}％</strong>です。
            </p>
            <p className="mt-2">
              「学生数と区間傾向」の点線は、データの傾向を1本の直線で表した「線形回帰の傾き」です。2006～2014年は1年あたり{" "}
              <strong>{regressionSummary.period1.slope.toFixed(1).replace("-", "−")}人</strong>とほぼ横ばいでしたが、2015～2023年は1年あたり{" "}
              <strong>{regressionSummary.period2.slope.toFixed(1).replace("-", "−")}人</strong>へペースが速まりました。ただし、この直線は過去の動きを整理するためのもので、今後の人数を予測するものではありません。
            </p>
          </div>

          <StudentTrendAndIndexChart data={data} analysis={analysis} />

          <h3 className={subheading}>ふだんの年と比べると、減少が大きい年がはっきり見える</h3>
          <p>
            下の棒グラフは「1年前から何人増減したか」を並べたものです。薄いグレーの帯は、全17年の増減を小さい順に並べたときの真ん中半分にあたる「ふだんの年の増減幅（四分位範囲）」で、
            {n(yoySummary.q1)}人から+{n(yoySummary.q3)}人のあいだに収まります（中央値は{n(yoySummary.median)}人）。
          </p>

          <StudentYoYChart analysis={analysis} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">この数字から言えること・言えないこと</h3>
            <p className="mt-2">
              キャンパス再編・移転があった2015年（−3,206人）、2016年（−3,606人）、2023年（−5,060人）は、いずれもグレーの帯を大きく下回りました。一方で2017～2022年は{" "}
              {n(yoySummary.stable2017to2022Range.minDiff)}人から+{n(yoySummary.stable2017to2022Range.maxDiff)}人のあいだに落ち着いており、毎年同じように減り続けたわけではありません。
            </p>
            <p className="mt-2">
              ただし、移転のない2012年にも−4,855人の減少があり、市の統計は複数校の合計です。そのため「時期が重なっていること」は確認できますが、<strong>「移転が減少の原因」と単独で断定することはできません</strong>。大学・キャンパスごとの同じ基準の時系列が公開されていないためです。
            </p>
          </div>

          <div className={card}>
            <h3 className="font-bold text-slate-900">キャンパスが変わった年</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6">
              {data.moves.map(({ date, school, detail, source }) => (
                <li key={date}>
                  <span className="font-semibold text-slate-900">
                    {date.slice(0, 4)}年{Number(date.slice(5))}月
                  </span>
                  　
                  <a href={source} className={textLink}>
                    {school}
                  </a>
                  　{detail}
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">2024年・2025年は別資料で見る</h3>
            <p className="mt-2">
              市の「八王子市の概要」にも、市内の大学・短大・高専の学生数が掲載されています。
            </p>
            <ul className="mt-2 list-disc pl-5">
              {data.referenceCounts.map(({ date, schools, students, source, page }) => (
                <li key={date}>
                  {day.format(new Date(date))}時点　{schools}校・{n(students)}人（
                  <a href={source} className={textLink}>
                    市の概要 {page}ページ
                  </a>
                  ）
                </li>
              ))}
            </ul>
            <p className="mt-2">
              キャンパスや大学院の扱いが学園都市ビジョンの集計と同じか、公開資料からは確認できません。上のグラフでも線では結ばず参考点として分けており、2023年との差から増減を判断することは控えます。
            </p>
          </aside>
        </section>

        <section id="schools" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>市内21校とコンソーシアム加盟25校、キャンパスはどこにある？</h2>
          <p>
            {scope.year}年度の市の資料では、市内の大学・短大・高専は{scope.citySchools}校です。大学コンソーシアム八王子は市外の学校も参加する連携組織で、市内
            {scope.citySchools}校を含む{scope.consortiumSchools}校を集計しています。
          </p>
          <figure className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
            <figcaption className="flex items-center gap-2 font-bold text-sky-950">
              <School size={18} aria-hidden="true" />
              コンソーシアム加盟校　{scope.consortiumSchools}校・約{scope.consortiumApproxStudents / 10000}万人
            </figcaption>
            <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-950">
              <p className="font-bold">
                うち、市内に立地する学校　{scope.citySchools}校・約{scope.cityApproxStudents / 10000}万人
              </p>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-600">
              {scope.year}年度の集計範囲。枠の大きさは学生数に比例しません。
            </p>
          </figure>
          <p className="text-sm">
            {day.format(new Date(scope.rosterDate))}時点の
            <a href={scope.rosterSource} className={textLink}>
              加盟校一覧
            </a>
            には、町田市・日野市・多摩市に所在する学校や、市境をまたぐキャンパスも載っています。下の地図では、加盟25校の立地と、移転3件の移動先を確認できます。
          </p>

          <CampusLocationMap campusData={campusData} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">位置図から分かること・分からないこと</h3>
            <p className="mt-2">
              キャンパスはJR八王子駅などの中心部だけでなく、北部の滝山・丹木・宮下町周辺から南部の南大沢・鑓水・館町周辺まで市内の広い範囲に点在しています。移転した3件はいずれも、八王子市内から都心側（文京区）や三鷹市へ一部または特定学部が移った事例です。
            </p>
            <p className="mt-2">
              なお、加盟校一覧には学校別の学生数が載っておらず、大学・地域別の時系列データも公開資料では確認できていません。そのため、<strong>どの地域で何人学生が減ったかを地図上で色分けすることはできません</strong>。
            </p>
          </div>
        </section>

        <section id="residence" className="scroll-mt-6 space-y-5">
          <h2 className={heading}>学生は八王子に住んでいる？―アンケートの「ぶれ幅」も読む</h2>
          <p>
            八王子市は{day.format(new Date(survey.start))}から{day.format(new Date(survey.end))}まで、メールと市広報SNSで大学生向けWeb調査を案内し、
            {n(survey.responses)}人から回答を得ました。住んでいる場所と、卒業後に住みたい場所についても尋ねています。
          </p>

          <StudentSurveyConfidenceChart analysis={analysis} />

          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7">
            <h3 className="font-bold text-slate-900">誤差の幅（95％信頼区間）の読み方</h3>
            <p className="mt-2">
              {n(survey.responses)}人への調査では、たまたま誰が答えたかによる数字の「ぶれ幅」が生じます。仮に無作為に選んだと仮定した統計的な目安（Wilson 95％信頼区間）を計算すると、市内在住{" "}
              <strong>{survey.residentPercent}％</strong>には <strong>{surveySummary.resident.ciLow.toFixed(1)}～{surveySummary.resident.ciHigh.toFixed(1)}％</strong>（およそ±{surveySummary.resident.halfWidth.toFixed(1)}ポイント）、卒業後の居住意向{" "}
              <strong>{survey.intendsToLivePercent}％</strong>には <strong>{surveySummary.intendsToLive.ciLow.toFixed(1)}～{surveySummary.intendsToLive.ciHigh.toFixed(1)}％</strong>（およそ±{surveySummary.intendsToLive.halfWidth.toFixed(1)}ポイント）の幅があります。
            </p>
            <p className="mt-2">
              さらに、この調査はメールやSNSを通じたWeb回答であり、市内の全学生から均等に選ばれたかどうかは分かりません。回答者{n(survey.responses)}人の結果としては受け止められますが、市内の学生約9万人全体の割合にそのまま当てはめることは避けます。
            </p>
          </div>
        </section>

        <section aria-labelledby="conclusion" className="space-y-5">
          <h2 id="conclusion" className={heading}>八王子はまだ学生の街？</h2>
          <p>
            {last.year}年度の八王子では、{first.year}年より学生数が{percentDecrease(first.students)}％減ったあとも、市内
            {scope.citySchools}校で約{scope.cityApproxStudents / 10000}万人が学んでいました。年平均ではゆっくりした減少（{indexSummary.cagrPercent.toFixed(2)}％）に見えますが、実際には特定の節目の年に階段状に減り、それ以外の年は小さく上下しています。
          </p>
          <p>
            キャンパスが市内に広く点在していること、そしてアンケート回答者の中では市内在住が約3割にとどまることをあわせて見ると、人数だけでなく「どこで学び、どこで暮らしているか」を含めて街の姿が見えてきます。
          </p>
        </section>

        <section id="method" className={`${card} space-y-4`}>
          <h2 className={heading}>調査方法・分析の限界・出典</h2>
          <p className="text-sm leading-7">
            市の学園都市ビジョン{data.trend.printedPage}ページの「{data.trend.scope}」の点を年ごとに転記し、原図と照合しました。指数は2006年を100として算出し、年平均変化率は17年間の幾何平均、前後半の傾きは説明用の最小二乗法、ふだんの増減幅は前年差17点の四分位範囲（Q1〜Q3）で計算しています。アンケートの誤差幅は Wilson の95％信頼区間です。
          </p>
          <p className="text-sm leading-7">
            なお「市の総人口100人あたりの学生数」の計算は、学生数（年度別・2006～2023年）と住民基本台帳の市総人口（各年10月1日・2013年以降など）で期間と基準日が揃わないため見送りました。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            <li>
              <a href={data.trend.source} className={textLink}>
                八王子市「第2期はちおうじ学園都市ビジョン」第2章（{data.trend.printedPage}ページ）
              </a>
            </li>
            <li>
              <a href={survey.source} className={textLink}>
                八王子市「学園都市ビジョン アンケート集計結果」（1・25・31ページ）
              </a>
            </li>
            <li>
              <a href={scope.rosterSource} className={textLink}>
                八王子市「市内大学等一覧」（大学コンソーシアム八王子加盟25校）
              </a>
            </li>
            <li>
              <a href="/data/hachioji-students/student-data.json" className={textLink}>
                元データと出典（JSON）
              </a>
            </li>
            <li>
              <a href="/data/hachioji-students/analysis.json" className={textLink}>
                統計指標の検算結果（JSON）
              </a>
            </li>
            <li>
              <a href="/data/hachioji-students/campus-locations.json" className={textLink}>
                加盟25校と移転3件の位置データ（JSON）
              </a>
            </li>
          </ul>
        </section>

        <nav aria-label="八王子を数字で読み解くシリーズ" className="grid gap-4 sm:grid-cols-2">
          <Link href="/labs/hachioji-international" className={`${card} hover:bg-teal-50 sm:col-span-2`}>
            <span className="block text-xs font-bold text-teal-800">次回・第6弾</span>
            <span className="mt-2 block font-semibold text-slate-900">
              八王子は国際的になってきている？ →
            </span>
          </Link>
          <Link href="/labs/hachioji-city-center" className={`${card} hover:bg-teal-50`}>
            <span className="block text-xs font-bold text-teal-800">前回・第4弾</span>
            <span className="mt-2 block font-semibold text-slate-900">
              八王子の中心市街地は発展しつつある？ →
            </span>
          </Link>
          <Link href="/labs" className={`${card} hover:bg-teal-50`}>
            <span className="font-semibold text-teal-900">Labsの記事一覧へ →</span>
          </Link>
        </nav>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
