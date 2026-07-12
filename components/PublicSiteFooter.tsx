import Link from "next/link";

export default function PublicSiteFooter() {
  return (
    <footer className="w-full mt-16 py-8 border-t border-gray-100 text-center text-sm text-muted">
      <nav aria-label="フッターナビゲーション" className="mb-4">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs md:text-sm font-medium">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              bearworks.uk
            </Link>
          </li>
          <li>
            <Link href="/toukei" className="hover:text-primary transition-colors">
              統計検定2級
            </Link>
          </li>
          <li>
            <Link href="/toukei/guides" className="hover:text-primary transition-colors">
              学習ガイド
            </Link>
          </li>
          <li>
            <Link href="/toukei/problems" className="hover:text-primary transition-colors">
              オリジナル例題
            </Link>
          </li>
          <li>
            <Link href="/toukei#question-policy" className="hover:text-primary transition-colors">
              問題作成方針
            </Link>
          </li>
          <li>
            <Link href="/about#operating-policy" className="hover:text-primary transition-colors">
              運営方針
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              プライバシーポリシー
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-primary transition-colors">
              お問い合わせ
            </Link>
          </li>
        </ul>
      </nav>
      <p className="text-xs text-muted/60 font-medium">
        © 2026 bearworks. All Rights Reserved.
      </p>
    </footer>
  );
}
