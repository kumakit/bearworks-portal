export const runtime = "edge";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  RotateCcw,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Toukei Kentei Drill | 統計検定2級 学習アプリ",
  description:
    "統計検定2級向けのCBT模擬試験、分野別ドリル、学習分析、チートシート、暗記カードをまとめた学習アプリの紹介ページです。",
};

const features = [
  {
    title: "CBT模擬試験",
    description:
      "90分の制限時間、数値入力、見直しフラグを備えた試験形式で、時間配分を確認できます。",
    icon: Clock,
    tone: "text-accent-pink bg-pink-50 border-pink-100",
  },
  {
    title: "分野別ドリル",
    description:
      "記述統計、確率、推定、仮説検定、回帰分析など、10分野から演習できます。",
    icon: Target,
    tone: "text-accent-blue bg-blue-50 border-blue-100",
  },
  {
    title: "学習分析",
    description:
      "解答履歴、正答率、演習量、苦手分野を可視化し、次に復習すべき領域を見つけやすくします。",
    icon: BarChart3,
    tone: "text-accent-green bg-green-50 border-green-100",
  },
  {
    title: "暗記カード",
    description:
      "公式、検定統計量、分布の性質などを一問一答で確認し、復習状況を記録できます。",
    icon: RotateCcw,
    tone: "text-accent-purple bg-purple-50 border-purple-100",
  },
];

const categories = [
  "記述統計",
  "確率",
  "確率分布",
  "標本分布",
  "推定",
  "仮説検定",
  "カイ二乗検定",
  "分散分析",
  "回帰分析",
  "データ収集",
];

export default function ToukeiPage() {
  return (
    <main className="max-w-5xl w-full mx-auto px-4 py-8 md:py-16">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          ホームに戻る
        </Link>
      </div>

      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-accent-purple mb-4">
              TOUKEI KENTEI DRILL
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight">
              統計検定2級の演習と復習を、毎日続けやすくする学習アプリ
            </h1>
            <p className="mt-5 text-muted text-lg leading-relaxed">
              Toukei Kentei Drill は、統計検定2級の CBT 対策を想定した個人開発の
              学習アプリです。模擬試験、分野別ドリル、チートシート、
              暗記カード、学習分析をひとつの流れで使えるようにしています。
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://toukei.bearworks.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                アプリを開く
                <ArrowRight size={16} />
              </a>
              <a
                href="https://toukei.bearworks.uk/exam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-primary hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                模擬試験を見る
                <Clock size={16} />
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-purple-100 bg-[#F5F3FF] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-2xl bg-white p-3 shadow-soft">
                <Brain className="text-accent-purple" size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-900/50">
                  STUDY LOOP
                </p>
                <h2 className="font-bold text-primary">学習の流れ</h2>
              </div>
            </div>
            <ol className="space-y-4 text-sm text-purple-950/70">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 text-accent-purple" size={18} />
                <span>模擬試験または分野別ドリルで現在地を確認する。</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 text-accent-purple" size={18} />
                <span>間違えた分野をダッシュボードで確認する。</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 text-accent-purple" size={18} />
                <span>チートシートと暗記カードで要点を復習する。</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 text-accent-purple" size={18} />
                <span>次の演習で時間配分と正答率を見直す。</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`rounded-[2rem] border p-6 shadow-soft ${feature.tone}`}
            >
              <Icon size={28} className="mb-5" />
              <h2 className="text-xl font-bold text-primary mb-2">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-soft">
          <BookOpen className="text-accent-blue mb-4" size={28} />
          <h2 className="text-2xl font-bold text-primary mb-3">
            対象としている学習範囲
          </h2>
          <p className="text-muted leading-relaxed mb-5">
            統計検定2級で頻出する基礎概念、計算問題、検定手順を中心に、
            以下の分野を演習対象にしています。
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-gray-50 border border-gray-100 px-3 py-1.5 text-xs font-bold text-muted"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-soft">
          <h2 className="text-2xl font-bold text-primary mb-3">
            bearworks.uk から案内している理由
          </h2>
          <p className="text-muted leading-relaxed">
            bearworks.uk は、公開している個人開発サービスの入口です。
            リンク先のアプリを開く前に、サービスの目的、機能、対象ユーザー、
            学習の進め方を確認できるように、この紹介ページを用意しています。
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="https://toukei.bearworks.uk/cheatsheet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-blue px-5 py-3 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              チートシートを見る
              <ArrowRight size={16} />
            </a>
            <a
              href="https://toukei.bearworks.uk/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-primary hover:bg-gray-50 transition-colors"
            >
              学習分析を見る
              <BarChart3 size={16} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
