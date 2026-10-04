import type { Metadata } from "next";
import Link from "@/components/InternalLink";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { BookOpen, BarChart3, Target, ArrowRight } from "lucide-react";
import { guides } from "./toukei/guides/guide-data";
import { problems } from "./toukei/problems/problem-data";
import { siteContent } from "../site-content";

const analysisCount = siteContent.filter((item) => item.pathname.startsWith("/labs/")).length;

export const metadata: Metadata = {
  title: "統計検定2級の学習支援 | bearworks.uk",
  description: "Toukei Kentei Drillの模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを案内する統計検定2級の学習サポートサイトです。",
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
            <span className="text-accent-purple">解いて、納得して、身につける。</span>
          </h1>
          <p className="mt-6 text-muted text-lg leading-relaxed">
            Toukei Kentei Drill（統計検定ドリル）へようこそ。ここは、統計検定2級（CBT方式）の合格を目指す方のための個人開発の学習サポートサイトです。
            本番さながらの模擬試験や分野別ドリルをはじめ、弱点を可視化する学習分析、すきま時間に頼れるチートシートや暗記カードまで、一人ひとりの学習リズムに寄り添うツールを揃えました。
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            お届けしている演習問題はすべて、公式の出題範囲や頻出テーマを丁寧に研究して作成したオリジナル問題です。公式問題をそのまま転載するのではなく、「なぜこの式を使うのか」「どこでつまずきやすいのか」を自分の手で確かめられるよう、設定や数値のひとつひとつにこだわって設計しています。
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            このサイトでは、{guides.length}本の学習ガイドで基礎の考え方を整理し、{problems.length}問の例題で計算プロセスや誤答の理由をじっくり確認できます。さらに{analysisCount}本の気象・統計の分析記事など、身近なデータを題材に「統計を使って考える面白さ」を体験できる読みものも用意しています。
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
              模擬試験に挑戦してみる
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="content-path-heading" className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <h2 id="content-path-heading" className="text-2xl font-bold text-primary">学ぶ、解く、実データを読む</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">気になるところから、気軽に始めてみてください。すべての教材をこのサイト内ですぐにお読みいただけます。</p>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-primary">1. 考え方を学ぶ</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">「p値って結局何？」「仮説検定は何を前提にしているの？」そんな疑問を、身近でコンパクトな例を通してすっきり整理します。</p>
            <Link href="/toukei/guides/hypothesis-testing-basics" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-purple hover:underline">仮説検定のガイドを読む <ArrowRight size={14} /></Link>
            <div><Link href="/toukei/guides" className="mt-2 inline-block text-xs text-muted hover:underline">ガイド{guides.length}本の一覧</Link></div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-primary">2. 例題で確かめる</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">正解の導き方はもちろん、「なぜ他の選択肢は違うのか」という誤答の理由や途中計算まで丁寧に追えます。</p>
            <Link href="/toukei/problems/bayes-theorem-screening" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-pink hover:underline">ベイズの例題を解く <ArrowRight size={14} /></Link>
            <div><Link href="/toukei/problems" className="mt-2 inline-block text-xs text-muted hover:underline">例題{problems.length}問の一覧</Link></div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-primary">3. 実データで読む</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">「雨の日は本当に増えた？」「秋は短くなった？」八王子の実際の気候データを手引きに、比較期間や集計定義の確かめ方を体験できます。</p>
            <Link href="/labs/hachioji-climate" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-blue hover:underline">気候分析を読む <ArrowRight size={14} /></Link>
            <div><Link href="/toukei/methodology" className="mt-2 inline-block text-xs text-muted hover:underline">データと制作方針</Link></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="new-climate-articles" className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8">
        <h2 id="new-climate-articles" className="text-xl font-bold text-primary">八王子の気候シリーズに、二つの問い。</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link href="/labs/hachioji-rain" className="rounded-2xl border border-sky-100 bg-sky-50 p-5 transition hover:border-sky-400">
            <p className="text-xs font-bold text-sky-800">第7弾 · 降る日数と、降る量</p>
            <h3 className="mt-2 font-bold text-slate-900">八王子は都心より雨が多い？ →</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">年ごとの降水量や上位5日への集中度、同じ日に雨が降る割合などを、実際の観測データから読み解きます。</p>
          </Link>
          <Link href="/labs/hachioji-autumn" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 transition hover:border-emerald-400">
            <p className="text-xs font-bold text-emerald-800">第8弾 · 気温で数える秋</p>
            <h3 className="mt-2 font-bold text-slate-900">八王子の秋は本当に短くなった？ →</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">気温の区切りや年を切り替えながら、日数の変化や連続性、データ採用の基準を丁寧に確かめます。</p>
          </Link>
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
              本番と同じ90分の制限時間で手応えを試せるCBT模擬試験と、苦手な分野をピンポイントで何度でもやり直せる分野別ドリル。本番前の総仕上げにも日々の復習にも役立ちます。
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
              解答履歴や分野別の正答率、演習の積み重ねをわかりやすくグラフで可視化。自分の弱点を一目で把握できるので、「次にどこを復習すべきか」に迷いません。
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
              つまずきやすい公式や確率分布の性質、検定ルールの早見表（チートシート）に加え、すきま時間にサクサク回せる一問一答の暗記カードを用意しています。
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
        <h2 className="text-2xl font-bold text-primary mb-6">おすすめの学習ステップ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">1</div>
            <div>
              <h4 className="font-bold text-primary mb-2">1. 現在地と時間配分を知る</h4>
              <p className="text-muted text-sm leading-relaxed">まずは90分の模擬試験にチャレンジ。CBT試験特有のペース配分を体感し、現時点での正答状況や実力を確かめましょう。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">2</div>
            <div>
              <h4 className="font-bold text-primary mb-2">2. 弱点をドリルで集中的につぶす</h4>
              <p className="text-muted text-sm leading-relaxed">学習分析で浮き彫りになった正答率の低い分野を、分野別ドリルで重点的に復習。理解が曖昧な論点を着実に自信へと変えていきます。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary text-sm">3</div>
            <div>
              <h4 className="font-bold text-primary mb-2">3. すきま時間で知識を定着させる</h4>
              <p className="text-muted text-sm leading-relaxed">押さえておきたい公式や検定の定義などは、暗記カードを使って毎日の移動時間や空き時間にコツコツ復習。本番で迷わない確かな記憶をつくります。</p>
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
        <h3 className="text-xs font-bold tracking-wider text-muted uppercase mb-4">その他の制作物・研究ノート</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/labs/hachioji-climate" className="hover:text-primary transition-colors">
            八王子の気候を一次データで検証
          </Link>
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
