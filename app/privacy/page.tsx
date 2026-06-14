export const runtime = "edge";

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16">
      {/* 戻るボタン */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          ホームに戻る
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-primary text-center">
          プライバシーポリシー
        </h1>

        <div className="space-y-10 text-muted leading-relaxed">
          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary transition-colors">
              1. 広告の配信について
            </h2>
            <p className="mb-3">
              当サイト（bearworks.uk およびそのサブドメインのサービス）では、第三者配信 of 広告サービス「Google AdSense」を利用しています。
            </p>
            <p className="mb-3">
              広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。これによってユーザーのブラウザを識別できるようになりますが、個人を特定するものではありません。
            </p>
            <p>
              Cookie（クッキー）を無効にする設定およびGoogleアドセンスに関する詳細は「
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan hover:text-cyan-600 hover:underline transition-colors"
              >
                広告 – ポリシーと規約 – Google
              </a>
              」をご覧ください。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary transition-colors">
              2. アクセス解析ツールについて
            </h2>
            <p className="mb-3">
              当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。
            </p>
            <p>
              このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary transition-colors">
              3. 免責事項
            </h2>
            <p className="mb-3">
              当サイトのコンテンツ・情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、誤情報が入り込んだり、情報が古くなっていることもございます。
            </p>
            <p className="mb-3">
              当サイト、および当サイトが提供する各種サブドメインのサービスに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
            </p>
            <p>
              また、当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。
            </p>
          </section>

          <section className="group">
            <h2 className="text-xl font-bold mb-4 text-primary transition-colors">
              4. 著作権について
            </h2>
            <p className="mb-3">
              当サイトで掲載している文章や画像などにつきましては、無断転載することを禁止します。
            </p>
            <p>
              当サイトは著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、お問い合わせページよりご連絡ください。迅速に対応いたします。
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100">
            <p className="text-sm font-mono text-muted/60">
              初出掲載日：2026年6月14日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
