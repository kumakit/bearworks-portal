import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bearworks.uk"),
  title: "bearworks.uk",
  description: "統計検定2級の模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを案内する統計学習ハブサイトです。",
  openGraph: {
    title: "bearworks.uk",
    description: "統計検定2級の模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを案内する統計学習ハブサイトです。",
    url: "https://bearworks.uk",
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "bearworks.uk",
    description: "統計検定2級の模擬試験、分野別ドリル、学習分析、チートシート、暗記カードを案内する統計学習ハブサイトです。",
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-screen p-4 md:p-8 flex justify-center`}>
        {children}
      </body>
    </html>
  );
}

