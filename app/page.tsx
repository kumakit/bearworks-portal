export const runtime = "edge";

import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { BookOpen, BarChart3, Target, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "統計検定2級の学習支援 | bearworks.uk",
  description: "Toukei Kentei Drillの模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを案内する統計検定2級の学習支援サイトです。",
};

export default function Home() {
  return (
    <main className="max-w-5xl w-full flex flex-col gap-8 pb-12">
      <PublicSiteHeader />

      {/* Hero Section */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100 flex flex-col justify-center">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
            統計検定2級の学習を、<br />
            <span className="text-accent-purple">解いて理解する。</span>
          </h1>
          <p className="mt-6 text-muted text-lg leading-relaxed">
            Toukei Kentei Drill（統計検定ドリル）は、統計検定2級のCBT試験対策を目的とした個人開発の学習支援アプリです。
            模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを組み合わせて、効率的な復習ループを回せるように設計されています。
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            掲載している演習問題は、公式問題集や出題範囲を研究し、頻出論点や計算プロセスを網羅するように独自に作成したオリジナル問題です。公式問題のそのままの転載ではなく、本質的な考え方を練習できるように数値や題材を設計しています。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/toukei"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Toukei Kentei Drill について
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://toukei.bearworks.uk/exam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-primary hover:bg-gray-50 transition-colors"
            >
              模擬試験に挑戦する
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-accent-pink mb-6">
              <Target size={24} className="text-accent-pink" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">模擬試験・分野別ドリル</h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
              本番に近い90分の制限時間で行うCBT模擬試験と、特定の苦手分野をピンポイントで反復演習できる分野別ドリルを提供しています。
            </p>
          </div>
          <Link
            href="/toukei"
            aria-label="模擬試験・分野別ドリルの詳細を Toukei Kentei Drill ページで確認する"
            className="text-accent-pink hover:underline font-bold text-sm inline-flex items-center gap-1"
          >
            ドリル機能の詳細を確認する <ArrowRight size={14} />
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-accent-purple mb-6">
              <BarChart3 size={24} className="text-accent-purple" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">学習分析ダッシュボード</h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
              解答履歴や正答率、分野別の演習量をグラフで可視化。自分の弱点を一目で把握し、次にどの分野を学習すべきかを明確にします。
            </p>
          </div>
          <a
            href="https://toukei.bearworks.uk/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Toukei Kentei Drill の学習分析ダッシュボードを新しいタブで開く"
            className="text-accent-purple hover:underline font-bold text-sm inline-flex items-center gap-1"
          >
            学習分析ダッシュボードを開く <ArrowRight size={14} />
          </a>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-accent-blue mb-6">
              <BookOpen size={24} className="text-accent-blue" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">チートシート・暗記カード</h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
              試験によく出る公式や各種確率分布の性質、検定の判断ルールをすばやく確認できるチートシートと、一問一答形式の暗記カードを用意しています。
            </p>
          </div>
          <a
            href="https://toukei.bearworks.uk/cheatsheet"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Toukei Kentei Drill の暗記カード・チートシートを新しいタブで開く"
            className="text-accent-blue hover:underline font-bold text-sm inline-flex items-center gap-1"
          >
            暗記カード・チートシートを開く <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* Study Loop Section */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <h2 className="text-2xl font-bold text-primary mb-6">効果的な学び方</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">1</div>
            <div>
              <h4 className="font-bold text-primary mb-2">実力と時間感覚の把握</h4>
              <p className="text-muted text-sm leading-relaxed">まずは90分の模擬試験を受け、CBT試験での時間配分と、現在の正答状況を確認します。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">2</div>
            <div>
              <h4 className="font-bold text-primary mb-2">苦手分野の集中演習</h4>
              <p className="text-muted text-sm leading-relaxed">学習分析で判明した正答率の低い分野を、分野別ドリルで重点的に復習します。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">3</div>
            <div>
              <h4 className="font-bold text-primary mb-2">要点の暗記と知識定着</h4>
              <p className="text-muted text-sm leading-relaxed">公式や検定の定義などは、暗記カードを用いて隙間時間に反復してインプットします。</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <Link href="/toukei#study-flow" className="text-sm font-medium text-muted hover:text-primary inline-flex items-center gap-1 transition-colors">
            おすすめの学習方針の詳細を確認する <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Other Projects Section */}
      <section className="py-6 border-t border-gray-100">
        <h3 className="text-xs font-bold tracking-wider text-muted uppercase mb-4">その他の制作物</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <a href="https://docs.bearworks.uk/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            Data Science Docs (MkDocs)
          </a>
          <a href="https://apps.bearworks.uk/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            AI Apps (Streamlit + Ollama)
          </a>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
