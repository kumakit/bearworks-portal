import Script from "next/script";
import { rootBodyClassName, rootMetadata } from "../root-layout-config";
import "../globals.css";

export const metadata = rootMetadata;

export default function MonetizedRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ja">
      <body className={rootBodyClassName}>
        {children}
        {clientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
            strategy="beforeInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
