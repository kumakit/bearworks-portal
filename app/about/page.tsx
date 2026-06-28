export const runtime = "edge";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2, Database, Mail, MapPin, RefreshCw, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "運営者情報 | bearworks.uk",
  description:
    "bearworks.uk と関連サービスの運営目的、公開しているサービス、連絡先について。",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          ホームに戻る
        </Link>
      </div>

      <article className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-bold tracking-[0.2em] text-accent-blue">
            ABOUT
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            bearworks.uk について
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            bearworks.uk は、KUMA が個人で運営している学習ツール、データ可視化、
            AI アプリケーションのハブサイトです。統計学習を継続しやすくするための
            Web アプリや、日常的に使う小さなダッシュボードを公開しています。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <Code2 className="text-accent-blue mb-3" size={24} />
            <h2 className="font-bold text-primary mb-2">運営者</h2>
            <p className="text-sm text-muted leading-relaxed">
              KUMA。データ分析、Web アプリ開発、学習支援ツールの設計に関心があります。
            </p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <Database className="text-accent-green mb-3" size={24} />
            <h2 className="font-bold text-primary mb-2">主な領域</h2>
            <p className="text-sm text-muted leading-relaxed">
              統計学習、データサイエンス、可視化、AI を使った小規模な業務改善。
            </p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <MapPin className="text-accent-pink mb-3" size={24} />
            <h2 className="font-bold text-primary mb-2">拠点</h2>
            <p className="text-sm text-muted leading-relaxed">
              東京都八王子市周辺。個人開発として継続的に改善しています。
            </p>
          </div>
        </div>

        <div className="space-y-8 text-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">
              このサイトで公開しているもの
            </h2>
            <p>
              中心となるサービスは、統計検定2級向けの学習アプリ
              「Toukei Kentei Drill」です。模擬試験、分野別ドリル、
              学習分析、チートシート、暗記カードを組み合わせ、
              試験対策の進み具合を確認しながら学べる構成にしています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">
              運営方針
            </h2>
            <p className="mb-3">
              公式情報や教科書の代替ではなく、日々の演習、復習、弱点確認を補助するための
              個人開発ツールとして運営しています。掲載内容は必要に応じて見直し、
              誤りや改善点が見つかった場合は更新していきます。
            </p>
            <p>
              模擬試験やドリルの問題は、公式問題集や公開されている出題範囲から
              出題傾向、論点、難易度感を研究したうえで作成したオリジナル問題です。
              公式問題を転載するのではなく、考え方や計算プロセスを練習できるように
              題材、数値、選択肢、解説を独自に設計しています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">
              Toukei Kentei Drill を作っている理由
            </h2>
            <p className="mb-3">
              統計検定2級の学習では、公式を覚えるだけでなく、
              問題文から適切な分布や検定方法を選ぶ練習が必要です。
              そのため、模擬試験、分野別ドリル、暗記カード、学習分析を分けずに、
              ひとつの学習サイクルとして扱えるツールを作っています。
            </p>
            <p>
              問題や説明は、日々の学習でつまずきやすい点を見直しながら改善しています。
              本番試験の出題内容を保証するものではありませんが、
              反復演習と弱点把握の補助として使えることを重視しています。
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <RefreshCw className="text-accent-green mb-3" size={24} />
              <h2 className="text-lg font-bold text-primary mb-2">
                改善の進め方
              </h2>
              <p className="text-sm leading-relaxed">
                学習分析、暗記カード、AI ニュースなど、公開している機能は小さく更新し、
                動作確認と本番反映を分けて進めています。
              </p>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <ShieldCheck className="text-accent-blue mb-3" size={24} />
              <h2 className="text-lg font-bold text-primary mb-2">
                プライバシーと連絡先
              </h2>
              <p className="text-sm leading-relaxed">
                Cookie や広告配信に関する説明はプライバシーポリシーに掲載し、
                不具合や内容の指摘は contact@bearworks.uk で受け付けています。
              </p>
            </section>
          </div>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">連絡先</h2>
            <p>
              サービスに関するお問い合わせ、不具合報告、内容の誤りの指摘は
              お問い合わせページから受け付けています。
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              <Mail size={16} />
              お問い合わせ
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}
