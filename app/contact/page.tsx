export const runtime = "edge";

import Link from "next/link";

export default function Contact() {
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

      <div className="max-w-2xl mx-auto space-y-10 text-muted leading-relaxed text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-12 text-primary">
          お問い合わせ
        </h1>
        <p className="text-lg">
          bearworks.uk、および提供している各サービスに関するお問い合わせ、不具合報告、改善のご提案などは、以下のメールアドレスにて受け付けております。
        </p>

        <div className="py-14 px-8 border border-gray-100 rounded-[2.5rem] bg-white shadow-soft">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            メールでのお問い合わせ
          </h2>
          <p className="mb-6 text-sm text-muted/60">
            ※ 件名にサービス名等をご記載いただけますとスムーズに対応可能です。
          </p>
          <a
            href="mailto:contact@bearworks.uk"
            className="text-2xl font-bold text-accent-cyan hover:text-cyan-600 hover:underline transition-colors mt-2 inline-block"
          >
            contact@bearworks.uk
          </a>
          <p className="mt-8 pt-8 border-t border-gray-100 text-sm">
            回答には数日お時間をいただく場合がございます。あらかじめご了承ください。
          </p>
        </div>
      </div>
    </div>
  );
}
