import Image from "next/image";
import Link from "next/link";

export default function PublicSiteHeader() {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between py-6 px-4 md:px-0 border-b border-gray-100 mb-8 select-none">
      <div className="mb-4 md:mb-0 flex items-center justify-center md:justify-start">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary hover:opacity-85 transition-opacity">
          <Image
            src="/icon.png"
            alt="bearworks.uk"
            width={24}
            height={24}
            className="rounded-full"
            priority
          />
          <span>bearworks.uk</span>
        </Link>
      </div>
      <nav aria-label="主要ナビゲーション" className="w-full md:w-auto">
        <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-sm font-medium text-muted">
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
            <Link href="/contact" className="hover:text-primary transition-colors">
              お問い合わせ
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
