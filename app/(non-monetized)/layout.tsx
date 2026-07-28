import { rootBodyClassName, rootMetadata } from "../root-layout-config";
import "../globals.css";

export const metadata = rootMetadata;

export default function NonMonetizedRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={rootBodyClassName}>{children}</body>
    </html>
  );
}
