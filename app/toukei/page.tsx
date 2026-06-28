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
  History,
  Lightbulb,
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

const screenshots = [
  {
    title: "CBT模擬試験",
    description: "90分・35問の試験概要を確認してから、本番に近い形式で演習できます。",
    src: "/screenshots/toukei-exam.png",
    alt: "統計検定2級 CBT模擬試験の開始画面",
    href: "https://toukei.bearworks.uk/exam",
  },
  {
    title: "分野別ドリル",
    description: "出題分野、難易度、問題数を選び、苦手な領域を短時間で反復できます。",
    src: "/screenshots/toukei-drill.png",
    alt: "統計検定2級 分野別ドリルの設定画面",
    href: "https://toukei.bearworks.uk/drill",
  },
  {
    title: "学習分析",
    description: "解答数、正答率、継続日数、分野別の状態をまとめて確認できます。",
    src: "/screenshots/toukei-dashboard.png",
    alt: "統計検定2級 学習分析ダッシュボードの画面",
    href: "https://toukei.bearworks.uk/dashboard",
  },
  {
    title: "暗記カード",
    description: "公式や検定統計量を一問一答で復習し、理解度を記録できます。",
    src: "/screenshots/toukei-flashcard.png",
    alt: "統計学 暗記カードの画面",
    href: "https://toukei.bearworks.uk/cheatsheet/flashcard",
  },
];

const categories = [
  {
    name: "記述統計",
    description: "代表値、散布度、標準化、相関など、計算問題の土台になる分野。",
  },
  {
    name: "確率",
    description: "条件付き確率、独立性、ベイズの考え方を確認する分野。",
  },
  {
    name: "確率分布",
    description: "二項分布、正規分布、ポアソン分布などの性質と使い分け。",
  },
  {
    name: "標本分布",
    description: "標本平均、標準誤差、中心極限定理、t分布の扱い。",
  },
  {
    name: "推定",
    description: "点推定、区間推定、信頼区間の正しい解釈。",
  },
  {
    name: "仮説検定",
    description: "帰無仮説、対立仮説、有意水準、p値、検定統計量の判断。",
  },
  {
    name: "カイ二乗検定",
    description: "適合度検定、独立性検定、母分散の検定。",
  },
  {
    name: "分散分析",
    description: "一元配置分散分析、平方和、自由度、F値の読み方。",
  },
  {
    name: "回帰分析",
    description: "単回帰、決定係数、回帰係数の検定、残差の見方。",
  },
  {
    name: "データ収集",
    description: "標本抽出、調査設計、バイアス、データの取り方。",
  },
];

const studySteps = [
  {
    title: "1. まず90分の模擬試験で時間感覚をつかむ",
    description:
      "統計検定2級のCBTでは、知識だけでなく計算速度と見直しの優先順位が重要です。最初に模擬試験を使い、どの分野で時間を使いすぎるかを確認します。",
  },
  {
    title: "2. 間違えた分野をドリルで短く反復する",
    description:
      "分野別ドリルでは、記述統計、推定、仮説検定、回帰分析などを切り分けて練習できます。広く解くより、苦手分野を短い単位で戻す使い方を想定しています。",
  },
  {
    title: "3. 公式・判断ルールは暗記カードで戻す",
    description:
      "検定統計量、分布の期待値と分散、信頼区間の解釈など、取り違えやすい知識は暗記カードで復習します。学習分析から復習対象を見つける流れにしています。",
  },
];

const updates = [
  {
    date: "2026-06",
    title: "学習分析と暗記カード復習の連携を強化",
    description:
      "模擬試験やドリルで間違えた内容を、暗記カードの復習候補として扱えるようにしました。",
  },
  {
    date: "2026-06",
    title: "CBT模擬試験と分野別ドリルをCloudflare Pagesで公開",
    description:
      "統計検定2級の演習、模擬試験、チートシートをブラウザだけで使える構成にしました。",
  },
  {
    date: "2026-05",
    title: "bearworks.uk からの案内ページを整備",
    description:
      "ルートドメイン側でサービスの目的、対象範囲、学習の進め方を確認できるようにしました。",
  },
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
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-primary">100</p>
                <p className="text-xs font-bold text-muted">演習問題</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-primary">10</p>
                <p className="text-xs font-bold text-muted">対象分野</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-primary">74</p>
                <p className="text-xs font-bold text-muted">暗記カード</p>
              </div>
            </div>
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

      <section className="bg-white rounded-[2.5rem] p-7 md:p-10 shadow-soft border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-accent-blue mb-3">
              SCREENSHOTS
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              実際の画面
            </h2>
            <p className="mt-3 text-muted leading-relaxed max-w-2xl">
              模擬試験、分野別ドリル、学習分析、暗記カードをブラウザ上で使えます。
              それぞれの画面から、演習、復習、進捗確認へ移動できます。
            </p>
          </div>
          <a
            href="https://toukei.bearworks.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-gray-50 transition-colors"
          >
            アプリ全体を見る
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {screenshots.map((screenshot) => (
            <a
              key={screenshot.src}
              href={screenshot.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-video overflow-hidden bg-white">
                <img
                  src={screenshot.src}
                  alt={screenshot.alt}
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-primary group-hover:text-accent-blue transition-colors">
                  {screenshot.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {screenshot.description}
                </p>
              </div>
            </a>
          ))}
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((category) => (
              <div key={category.name} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-primary">{category.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {category.description}
                </p>
              </div>
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

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-soft">
          <Lightbulb className="text-accent-yellow mb-4" size={28} />
          <h2 className="text-2xl font-bold text-primary mb-3">
            おすすめの学習方針
          </h2>
          <div className="space-y-5">
            {studySteps.map((step) => (
              <div key={step.title} className="border-l-4 border-yellow-300 pl-4">
                <h3 className="font-bold text-primary">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-soft">
          <History className="text-accent-green mb-4" size={28} />
          <h2 className="text-2xl font-bold text-primary mb-3">更新履歴</h2>
          <div className="space-y-5">
            {updates.map((update) => (
              <div key={`${update.date}-${update.title}`}>
                <p className="text-xs font-bold tracking-[0.16em] text-muted">
                  {update.date}
                </p>
                <h3 className="mt-1 font-bold text-primary">{update.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {update.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
