import InternalLink from "@/components/InternalLink";
import { rootBodyClassName } from "./root-layout-config";
import "./globals.css";

export const metadata = {
  title: "ページが見つかりません | bearworks.uk",
  description: "指定されたページは見つかりませんでした。",
};

export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body className={rootBodyClassName}>
        <main className="flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            404
          </p>
          <h1 className="text-3xl font-bold">ページが見つかりません</h1>
          <p className="text-gray-600">
            URLをご確認いただくか、トップページから目的のページをお探しください。
          </p>
          <InternalLink
            href="/"
            className="rounded-full bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            トップページへ戻る
          </InternalLink>
        </main>
      </body>
    </html>
  );
}
