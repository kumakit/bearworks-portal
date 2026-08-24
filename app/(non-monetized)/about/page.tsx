import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { ArrowLeft, Code2, Database, Mail, MapPin, RefreshCw, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "運営者情報 | bearworks.uk",
  description:
    "統計検定2級の学習アプリ『Toukei Kentei Drill』などを開発・運営する bearworks.uk の運営者 kuma の情報と運営方針について。",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      <PublicSiteHeader />
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
            bearworks.uk は、kuma が個人で運営している学習ツール、データ可視化、
            AI アプリケーションのハブサイトです。統計学習を継続しやすくするための
            Web アプリや、日常的に使う小さなダッシュボードを公開しています。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <Code2 className="text-accent-blue mb-3" size={24} />
            <h2 className="font-bold text-primary mb-2">運営者</h2>
            <p className="text-sm text-muted leading-relaxed">
              kuma。統計学習ツールの設計・運営と、公開データを用いた分析・可視化を個人開発として実践しています。
            </p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <Database className="text-accent-green mb-3" size={24} />
            <h2 className="font-bold text-primary mb-2">主な領域</h2>
            <p className="text-sm text-muted leading-relaxed">
              統計学習、データの取得・前処理・検算・可視化、Web アプリ開発、AI を使った小規模な業務改善。
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
              公開している実践
            </h2>
            <p className="mb-3">
              学習ツールの提供に加え、公的な実データを取得し、前処理、品質確認、計算、可視化、文章化までを追跡できる分析も公開しています。八王子気候分析では、気象庁の日別観測値を使い、4地点の暑さ・寒さ・日較差を比較しました。
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-bold">
              <Link href="/labs/hachioji-climate" className="text-accent-purple hover:underline">
                八王子気候分析を読む
              </Link>
              <a
                href="https://github.com/kumakit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                GitHubで公開コードを見る
              </a>
            </div>
          </section>

          <section id="operating-policy">
            <h2 className="text-xl font-bold text-primary mb-3">
              運営方針
            </h2>
            <p className="mb-3">
              公式情報や教科書の代替ではなく、日々の演習、復習、弱点確認を補助するための
              個人開発ツールとして運営しています。運営者の kuma が個人で問題の企画・作成・確認・訂正受付を行っています。掲載内容は必要に応じて自主的な見直しを行い、
              誤りや改善点が見つかった場合は更新していきます。
            </p>
            <p className="mb-3">
              模擬試験やドリルの問題は、公式問題集や公開されている出題範囲から
              出題傾向、論点、難易度感を研究したうえで作成したオリジナル問題です。
              公式問題を転載するのではなく、考え方や計算プロセスを練習できるように
              題材、数値、選択肢、解説を独自に設計しています。
            </p>
            <p>
              詳しい問題作成のプロセス、参照している情報、自主確認の体制については「<Link href="/toukei/methodology" className="text-accent-blue font-bold hover:underline">編集・作問方針</Link>」のページをご覧ください。
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

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">
              AIと人の役割
            </h2>
            <p className="mb-3">
              AIは、構成案の整理、実装補助、文章表現の点検、レビュー補助に使用する場合があります。AIの出力だけで問題の正解、分析結果、公開可否を決めることはありません。
            </p>
            <p>
              運営者が参照資料や一次データを確認し、数値・数式の再計算、データ品質の判断、本文と結論の整合確認、最終公開判断を行います。各ガイド・例題・分析記事では、制作担当と確認工程、公開できる検証記録を個別に表示します。
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <RefreshCw className="text-accent-green mb-3" size={24} />
              <h2 className="text-lg font-bold text-primary mb-2">
                改善の進め方
              </h2>
              <p className="text-sm leading-relaxed">
                学習分析、暗記カード、学習ガイドなど、公開している機能は小さく更新し、
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
      <PublicSiteFooter />
    </main>
  );
}
