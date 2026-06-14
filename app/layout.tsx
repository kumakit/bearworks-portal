import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bearworks.uk"),
  title: "bearworks.uk",
  description: "Personal Hub Site and Digital Garden",
  openGraph: {
    title: "bearworks.uk",
    description: "Personal Hub Site and Digital Garden",
    url: "https://bearworks.uk",
    siteName: "bearworks.uk",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "bearworks.uk",
    description: "Personal Hub Site and Digital Garden",
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
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-screen p-4 md:p-8 flex justify-center`}>
        {children}
      </body>
    </html>
  );
}

