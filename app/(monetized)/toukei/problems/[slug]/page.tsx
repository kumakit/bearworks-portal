import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { problems } from "../problem-data";
import { guides } from "../../guides/guide-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return problems.map((prob) => ({
    slug: prob.slug,
  }));
}

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: PageProps) {
  const problem = problems.find((p) => p.slug === params.slug);
  if (!problem) return {};

  return {
    title: `${problem.title} | 統計検定2級 オリジナル例題`,
    description: problem.description,
    alternates: {
      canonical: `/toukei/problems/${problem.slug}`,
    },
  };
}

export default function ProblemDetailPage({ params }: PageProps) {
  const problem = problems.find((p) => p.slug === params.slug);
  if (!problem) {
    notFound();
  }

  // Resolve related guides and perform safety runtime check
  const relatedGuides = problem.relatedGuideSlugs
    .map((slug) => {
      const g = guides.find((guide) => guide.slug === slug);
      if (!g) {
        console.warn(`Warning: Related guide with slug "${slug}" not found for problem "${problem.slug}".`);
      }
      return g;
    })
    .filter((g): g is typeof guides[0] => !!g);

  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      <PublicSiteHeader />
      <div className="mb-6">
        <Link
          href="/toukei/problems"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          例題一覧に戻る
        </Link>
      </div>

      <article className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-soft border border-gray-100 mb-6">
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {problem.concepts.map((concept) => (
              <span
                key={concept}
                className="text-xs font-bold text-accent-purple bg-purple-50 border border-purple-100 rounded-md px-2.5 py-1"
              >
                {concept}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-primary mb-4 leading-tight">
            {problem.title}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted/80">
            <span className="flex items-center gap-1">
              <User size={14} />
              作成者: {problem.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              公開日: {problem.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              最終確認日: {problem.reviewedAt}
            </span>
          </div>
        </header>

        {/* Question Text */}
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">問題文</h2>
          <div className="bg-purple-50/30 rounded-3xl p-6 md:p-8 border border-purple-100/50">
            <p className="text-primary text-base md:text-lg leading-relaxed whitespace-pre-line font-medium">
              {problem.question}
            </p>
          </div>
        </section>

        {/* Given Values */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-3">与えられた条件</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 font-bold text-primary w-1/2">項目</th>
                  <th className="py-2 font-bold text-primary w-1/2">値</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {problem.givenValues.map((val) => (
                  <tr key={val.label}>
                    <td className="py-2.5 text-muted">{val.label}</td>
                    <td className="py-2.5 font-bold text-primary">{val.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Solution Steps */}
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">解答・途中計算</h2>
          <div className="space-y-6">
            {problem.solutionSteps.map((step, idx) => (
              <div key={idx} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-purple-100 last:before:hidden">
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-xs font-bold text-accent-purple">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-primary mb-2 text-base">{step.label}</h3>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2 font-mono text-sm overflow-x-auto text-primary">
                  {step.expression}
                </div>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final Answer */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-3">最終結論</h2>
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
            <div className="flex gap-2 items-center text-emerald-800 font-bold mb-2">
              <Lightbulb className="text-accent-yellow fill-accent-yellow" size={20} />
              <span className="text-base">結論</span>
            </div>
            <p className="text-primary font-bold leading-relaxed">
              {problem.finalAnswer}
            </p>
          </div>
        </section>

        {/* Distractors & Common Mistakes */}
        <section className="mb-8 border-l-4 border-accent-pink bg-pink-50/30 rounded-r-3xl p-6 border-y border-r border-pink-100/40">
          <div className="flex gap-2 items-center text-accent-pink font-bold mb-4">
            <AlertTriangle size={20} />
            <h2 className="text-lg">誤答しやすい考え方</h2>
          </div>
          <div className="space-y-4">
            {problem.distractors.map((dis, idx) => (
              <div key={idx} className="space-y-1">
                <p className="font-bold text-primary text-sm">典型的な誤り：{dis.value}</p>
                <p className="text-muted text-sm leading-relaxed">理由・解説：{dis.reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* References */}
        <section className="mb-8 pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-primary mb-3">参照資料</h2>
          <ul className="space-y-2">
            {problem.references.map((ref, idx) => (
              <li key={idx} className="text-sm">
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent-blue hover:underline font-medium"
                >
                  {ref.title}
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* App Links */}
        <section className="mb-8 bg-gray-50 rounded-3xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-primary mb-3">この概念をアプリで練習する</h2>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            統計検定2級の演習・復習アプリ機能です。実際に手を動かして理解を深めましょう。
          </p>
          <div className="flex flex-wrap gap-3">
            {problem.appLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
              >
                {link.title}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </section>

        {/* Problem Policy link */}
        <section className="mb-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-muted leading-relaxed">
              本サイトの例題はすべて架空のデータを元に独自に作成されたものです。出題意図や難易度調整の基準については問題作成方針をご確認ください。
            </p>
            <Link
              href="/toukei#question-policy"
              className="inline-flex items-center gap-1 text-xs font-bold text-accent-purple hover:underline shrink-0"
            >
              問題作成方針を見る
              <ChevronRight size={14} />
            </Link>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-primary mb-1">解説のフィードバック</h2>
              <p className="text-xs text-muted leading-relaxed">
                解説の誤りや分かりにくい点についてのフィードバックは、お問い合わせフォームよりお寄せください。
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary hover:bg-gray-50 transition-colors shrink-0"
            >
              <MessageSquare size={14} />
              お問い合わせ
            </Link>
          </div>
        </section>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <footer className="pt-6 border-t border-gray-100">
            <h2 className="text-sm font-bold text-primary mb-3">関連する学習ガイド</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((rel, idx) => (
                <Link
                  key={idx}
                  href={`/toukei/guides/${rel.slug}`}
                  className="group block rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:border-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs text-accent-blue font-bold mb-1">
                    <BookOpen size={12} />
                    <span>学習ガイド</span>
                  </div>
                  <p className="text-sm font-bold text-primary group-hover:text-accent-blue transition-colors">
                    {rel.title}
                  </p>
                </Link>
              ))}
            </div>
          </footer>
        )}
      </article>
      <PublicSiteFooter />
    </main>
  );
}
