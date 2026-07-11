import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ArrowRight, Lightbulb } from "lucide-react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { guides } from "./guide-data";

export const metadata: Metadata = {
  title: "統計検定2級 学習ガイド一覧 | bearworks.uk",
  description:
    "統計検定2級の出題範囲に対応した、各分野のつまずきやすいポイントや計算・判断のコツをまとめた学習ガイド一覧です。",
};

export default function GuidesPage() {
  return (
    <main className="max-w-5xl w-full mx-auto px-4 py-8 md:py-16">
      <PublicSiteHeader />
      <div className="mb-6">
        <Link
          href="/toukei"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          統計検定2級トップに戻る
        </Link>
      </div>

      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3">
            <BookOpen className="text-accent-blue" size={24} />
          </div>
          <p className="text-sm font-bold tracking-[0.2em] text-accent-blue">
            STUDY GUIDES
          </p>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight">
          統計検定2級 学習ガイド
        </h1>
        <p className="mt-5 text-muted text-lg leading-relaxed max-w-3xl">
          統計検定2級で問われやすい概念や、公式の適用条件、計算問題のつまずきポイントを解説する学習ガイドです。
          本ガイドは個人開発による独自の解説・架空データ例で構成されており、公式問題や過去問の転載ではありません。公式テキストや問題集での演習と合わせて、理解の補助ツールとしてご活用ください。
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/toukei/guides/${guide.slug}`}
            className="group block bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-100"
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-xs font-bold text-accent-blue bg-blue-50 border border-blue-100 rounded-md px-2 py-1 inline-block mb-4">
                  {guide.slug === "learning-roadmap" || guide.slug === "cbt-time-management"
                    ? "学習戦略"
                    : "統計学基礎"}
                </p>
                <h2 className="text-xl font-bold text-primary group-hover:text-accent-blue transition-colors mb-3">
                  {guide.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {guide.description}
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                  <div className="flex gap-2 items-start text-xs text-primary font-bold mb-1">
                    <Lightbulb size={14} className="text-accent-yellow mt-0.5" />
                    <span>読者の問い</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {guide.question}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-primary pt-2 border-t border-gray-50">
                <span className="text-muted/70">最終更新: {guide.reviewedAt}</span>
                <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  ガイドを読む
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <PublicSiteFooter />
    </main>
  );
}
