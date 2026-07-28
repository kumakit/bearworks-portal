import type { Metadata } from "next";
import type { ReactNode } from "react";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "パーソナル天気ダッシュボード | bearworks.uk",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WeatherLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
