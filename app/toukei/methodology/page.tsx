import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { ArrowLeft, ShieldCheck, HelpCircle, FileText, CheckCircle2, History, User } from "lucide-react";

export const metadata: Metadata = {
  title: "編集・作問方針 | bearworks.uk",
  description:
    "統計検定2級向けの学習補助サービス『Toukei Kentei Drill』におけるオリジナル問題の編集・作問方針、確認プロセス、更新履歴について。",
};

export default function MethodologyPage() {
  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      <PublicSiteHeader />
      <div className="mb-6">
        <Link
          href="/toukei"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          統計検定2級 学習アプリ紹介に戻る
        </Link>
      </div>

      <article className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <div className="flex flex-col gap-4 mb-10 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-accent-purple">
            METHODOLOGY
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            編集・作問方針
          </h1>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">
            当サイト（bearworks.uk）が提供する統計検定2級学習アプリ「Toukei Kentei Drill」およびオリジナル例題における、問題作成の方針や確認体制について公開しています。
          </p>
        </div>

        <div className="space-y-10 text-muted leading-relaxed">
          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <HelpCircle className="text-accent-blue" size={22} />
              1. 対象範囲と非公式性
            </h2>
            <p className="mb-3">
              当サイトが提供する問題や解説は、一般財団法人統計質保証推進協会が実施する「統計検定2級」の受験学習を補助するための個人開発ツールです。
            </p>
            <p>
              本サービスは公式のものではなく、統計検定を主催・運営・監修する機関とは一切関係がありません。また、公式の教科書や学習資料を代替するものではありませんので、学習の際は必ず公式の案内や標準的なテキストを併せてご利用ください。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <FileText className="text-accent-green" size={22} />
              2. 参照の扱い
            </h2>
            <p className="mb-3">
              オリジナル問題の作成にあたっては、以下の公式情報を参照しています。
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>統計検定2級の公式出題範囲</li>
              <li>過去の公式問題集</li>
            </ul>
            <p>
              これらは、試験で問われる論点、出題形式、難易度感、および計算の範囲を正しく理解し、学習効果の高い設問を設計するために参照しています。
            </p>
            <p className="font-semibold text-primary mt-2">
              ※著作権保護の観点から、公式問題の文面、選択肢、および解説をそのまま転載・複製することはありません。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <ShieldCheck className="text-accent-purple" size={22} />
              3. オリジナル問題の作成
            </h2>
            <p className="mb-3">
              出題範囲の中から特に理解が求められる重要論点（記述統計、確率、標本分布、推定・検定、回帰分析など）を抽出し、以下の方針で問題を作成しています。
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>
                <strong>独自の題材と数値設定：</strong>
                実務や日常でイメージしやすい独自のデータや題材を設定し、計算プロセスが適切に機能するよう数値を設計しています。
              </li>
              <li>
                <strong>解説の充実：</strong>
                単に正解を示すだけでなく、なぜその選択肢が正しいのかという論拠に加え、間違えやすいポイントや統計記号の解釈についても丁寧に説明します。
              </li>
            </ul>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <CheckCircle2 className="text-accent-pink" size={22} />
              4. 確認工程
            </h2>
            <p className="mb-3">
              作成した問題および解説は、公開前に以下の手順で自主確認を行っています。
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                計算結果および数式プロセスの数学的な正当性の再検証
              </li>
              <li>
                問題文の条件設定と選択肢・解答との間に矛盾や曖昧さがないかの整合性チェック
              </li>
              <li>
                解説の結論と提示している正解が一致しているかの確認
              </li>
            </ul>
            <p className="mt-3">
              ※本サイトは個人（運営者: kuma）による自主確認の上で運営されており、大学教授等の学術関係者や専門家による第三者監修・査読を経たものではありません。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <History className="text-accent-yellow" size={22} />
              5. 訂正と更新履歴
            </h2>
            <p className="mb-3">
              問題の不備や解説の誤字・誤りについてご連絡をいただいた場合、速やかに再検証を行い、必要に応じて修正します。修正を行った場合は、その履歴を日付とともに本ページまたは各該当ページに記録します。
            </p>
            <p className="mb-4">
              ご指摘や誤りのお問い合わせは、<Link href="/contact" className="text-accent-purple font-bold hover:underline">お問い合わせページ</Link> よりご連絡をお願いいたします。
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-primary mb-3">更新履歴</h3>
              <ul className="space-y-2 text-sm font-mono">
                <li className="flex gap-4">
                  <span className="text-muted/80">2026年7月12日</span>
                  <span className="text-primary font-sans font-medium">編集・作問方針を公開</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <User className="text-accent-blue" size={22} />
              6. 運営者情報
            </h2>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm space-y-2">
              <p>
                <strong className="text-primary">運営者:</strong> kuma
              </p>
              <p>
                <strong className="text-primary">活動内容:</strong> 本サービスおよびオリジナル問題の企画、作問、動作確認、およびお問い合わせ窓口の運営
              </p>
              <p>
                <strong className="text-primary">連絡先:</strong> 不具合や誤りのご報告は、<Link href="/contact" className="text-accent-purple font-bold hover:underline">お問い合わせページ</Link> より承っております。
              </p>
            </div>
          </section>
        </div>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
