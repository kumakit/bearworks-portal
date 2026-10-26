import type { MetadataRoute } from "next";
import { guides } from "./(monetized)/toukei/guides/guide-data";
import { problems } from "./(monetized)/toukei/problems/problem-data";

type SitemapEntry = Omit<MetadataRoute.Sitemap[number], "url"> & {
  pathname: string;
  title?: string;
  summary?: string;
  series?: string;
  seriesTitle?: string;
};

type LabArticle = SitemapEntry & { title: string; summary: string; series: string; seriesTitle: string };

const staticPaths: SitemapEntry[] = [
  {
    pathname: "/labs/hachioji-land-prices",
    title: "八王子は本当に土地が安い？",
    summary: "近隣6市の住宅地と124地点の地図、10年前との比較から価格の幅を確かめます。",
    series: "population",
    seriesTitle: "八王子を数字で読み解く",
    lastModified: new Date("2026-10-26"),
    changeFrequency: "yearly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-rain",
    title: "八王子は都心より雨が多い？",
    summary: "年ごとの雨量や日数、上位5日への集中を観測から読みます。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-04"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-autumn",
    title: "八王子の秋は本当に短くなった？",
    summary: "気温の区切りを動かし、秋の日数と連続性を比べます。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-04"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/takao-weather-shift",
    title: "高尾山の天気をどう読む？",
    summary: "観測と再解析の違い、条件付き確率の分母を学びます。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/takao-gear",
    title: "高尾山の装備をどう決める？",
    summary: "現地情報、最新の天気、行動時間から準備を考えます。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-chill",
    title: "八王子の朝はなぜ寒い？",
    summary: "時間ごとの気温差と弱風・放射冷却の条件を検証します。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-heat",
    title: "八王子の夏は本当に暑いのか",
    summary: "昼の猛暑日と夜の気温を東京都心と比較します。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-09-18"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-snow",
    title: "雪のニュース。また、八王子だ。",
    summary: "雪の量と気温、過去の大雪事例を確かめます。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-09-14"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs",
    lastModified: new Date("2026-10-24"),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    pathname: "/",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    pathname: "/about",
    lastModified: new Date("2026-07-11"),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    pathname: "/toukei",
    lastModified: new Date("2026-07-11"),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    pathname: "/toukei/guides",
    lastModified: new Date("2026-07-11"),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    pathname: "/toukei/problems",
    lastModified: new Date("2026-09-04"),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    pathname: "/toukei/methodology",
    lastModified: new Date("2026-07-12"),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    pathname: "/labs/hachioji-climate",
    title: "夏は暑く、冬は寒い？",
    summary: "八王子・府中・青梅・東京都心の気温を比較します。",
    series: "climate",
    seriesTitle: "八王子の気候を一次データで検証",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/labs/hachioji-population",
    title: "八王子の人口は本当に減っている？",
    summary: "全市・地域別・年齢別の3つの視点から、2016年と2026年の人口を比べます。",
    series: "population",
    seriesTitle: "八王子を数字で読み解く",
    lastModified: new Date("2026-10-24"),
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    pathname: "/privacy",
    lastModified: new Date("2026-10-03"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    pathname: "/contact",
    lastModified: new Date("2026-07-11"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export const labArticles: LabArticle[] = staticPaths.filter(
  (entry): entry is LabArticle => Boolean(entry.title && entry.summary && entry.series && entry.seriesTitle),
);

const guidePaths: SitemapEntry[] = guides.map((guide) => ({
  pathname: `/toukei/guides/${guide.slug}`,
  lastModified: new Date(guide.reviewedAt),
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

const problemPaths: SitemapEntry[] = problems.map((problem) => ({
  pathname: `/toukei/problems/${problem.slug}`,
  lastModified: new Date(problem.reviewedAt),
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

export const siteContent: SitemapEntry[] = [
  ...staticPaths,
  ...guidePaths,
  ...problemPaths,
];
