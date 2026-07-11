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
} from "lucide-react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { guides } from "../guide-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: PageProps) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) return {};

  return {
    title: `${guide.title} | 統計検定2級 学習ガイド`,
    description: guide.description,
    alternates: {
      canonical: `/toukei/guides/${guide.slug}`,
    },
  };
}

export default function GuideDetailPage({ params }: PageProps) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) {
    notFound();
  }

  const relatedGuideObjects = guide.relatedGuides
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is typeof guides[0] => !!g);

  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      <PublicSiteHeader />
      <div className="mb-6">
        <Link
          href="/toukei/guides"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          ガイド一覧に戻る
        </Link>
      </div>

      <article className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-soft border border-gray-100 mb-6">
        {/* Article Header */}
        <header className="mb-8 pb-6 border-b border-gray-100">
          <p className="text-xs font-bold text-accent-blue bg-blue-50 border border-blue-100 rounded-md px-2 py-1 inline-block mb-4">
            {guide.slug === "learning-roadmap" || guide.slug === "cbt-time-management"
              ? "学習戦略"
              : "統計学基礎"}
          </p>
          <h1 className="text-2xl md:text-4xl font-bold text-primary mb-4 leading-tight">
            {guide.title}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted/80">
            <span className="flex items-center gap-1">
              <User size={14} />
              作成者: {guide.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              公開日: {guide.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              最終確認日: {guide.reviewedAt}
            </span>
          </div>
        </header>

        {/* Reader's Question Box */}
        <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 mb-8">
          <div className="flex gap-2 items-center text-primary font-bold mb-2">
            <Lightbulb className="text-accent-yellow" size={20} />
            <h2 className="text-lg">読者の問い</h2>
          </div>
          <p className="text-muted leading-relaxed">
            {guide.question}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 mb-8 text-muted leading-relaxed">
          {guide.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">
                {section.heading}
              </h2>
              {section.text.split("\n\n").map((para, pIdx) => (
                <p key={pIdx} className="mb-4 last:mb-0 whitespace-pre-line">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Common Mistakes Alert */}
        <section className="border-l-4 border-accent-pink bg-pink-50/40 rounded-r-3xl p-6 border-y border-r border-pink-100/40 mb-8">
          <div className="flex gap-2 items-center text-accent-pink font-bold mb-3">
            <AlertTriangle size={20} />
            <h2 className="text-lg">よくある誤りとその理由</h2>
          </div>
          {guide.commonMistakes.map((mistake, idx) => (
            <div key={idx} className="space-y-2 text-sm">
              <p className="font-bold text-primary">誤り：{mistake.mistake}</p>
              <p className="text-muted leading-relaxed">理由：{mistake.reason}</p>
            </div>
          ))}
        </section>

        {/* References */}
        <section className="mb-8 pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-primary mb-3">参照資料</h2>
          <ul className="space-y-2">
            {guide.references.map((ref, idx) => (
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

        {/* App Links (Internal / App Navigation) */}
        <section className="mb-8 bg-gray-50 rounded-3xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-primary mb-4">関連する学習機能</h2>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            本ガイドに関連する統計検定2級の演習・復習アプリ機能です。実際に手を動かして理解を深めましょう。
          </p>
          <div className="flex flex-wrap gap-3">
            {guide.appLinks.map((link, idx) => (
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

        {/* Contact Navigation */}
        <section className="mb-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-primary mb-1">内容の誤りやフィードバックについて</h2>
              <p className="text-xs text-muted leading-relaxed">
                解説に誤りがある場合やご意見がある場合は、お問い合わせフォームよりご指摘いただけますと幸いです。
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
        {relatedGuideObjects.length > 0 && (
          <footer className="pt-6 border-t border-gray-100">
            <h2 className="text-sm font-bold text-primary mb-3">関連する学習ガイド</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuideObjects.map((rel, idx) => (
                <Link
                  key={idx}
                  href={`/toukei/guides/${rel.slug}`}
                  className="group block rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:border-blue-100 transition-colors"
                >
                  <p className="text-xs text-accent-blue font-bold mb-1">学習ガイド</p>
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
