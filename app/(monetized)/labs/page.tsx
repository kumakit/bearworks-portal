import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { labArticles } from "@/app/site-content";

export const metadata: Metadata = {
  title: "Labs｜公開データを読み解く | bearworks.uk",
  description: "八王子の気候や人口など、公開データを使った分析記事の一覧です。",
  alternates: { canonical: "https://bearworks.uk/labs" },
};

export default function LabsPage() {
  const groups = labArticles.reduce<Record<string, typeof labArticles>>((result, article) => {
    (result[article.series] ??= []).push(article);
    return result;
  }, {});
  return <main className="mx-auto w-full max-w-6xl px-4 py-6 text-slate-800 sm:px-6">
    <PublicSiteHeader />
    <section className="mx-auto max-w-5xl space-y-8 py-8">
      <header><p className="text-sm font-bold tracking-widest text-sky-800">公開データを読み解く</p><h1 className="mt-2 text-3xl font-bold">Labs</h1><p className="mt-3 max-w-3xl text-slate-600">身近な疑問を、データの出典と比べ方を確かめながら丁寧に読み解く記事です。</p></header>
      {Object.entries(groups).map(([series, articles]) => <section key={series} aria-labelledby={`series-${series}`} className="space-y-4">
        <h2 id={`series-${series}`} className="text-xl font-bold">{articles[0]?.seriesTitle}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <li key={article.pathname}><Link href={article.pathname} className="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"><span className="text-xs font-bold text-sky-800">{article.seriesTitle}</span><h3 className="mt-2 font-bold text-slate-900">{article.title} →</h3><p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p></Link></li>)}</ul>
      </section>)}
    </section>
    <PublicSiteFooter />
  </main>;
}
