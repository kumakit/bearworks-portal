import type { MetadataRoute } from "next";
import { guides } from "./toukei/guides/guide-data";

type SitemapEntry = Omit<MetadataRoute.Sitemap[number], "url"> & {
  pathname: string;
};

const staticPaths: SitemapEntry[] = [
  {
    pathname: "/",
    lastModified: new Date("2026-07-11"),
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
    pathname: "/privacy",
    lastModified: new Date("2026-07-11"),
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

const guidePaths: SitemapEntry[] = guides.map((guide) => ({
  pathname: `/toukei/guides/${guide.slug}`,
  lastModified: new Date(guide.reviewedAt),
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

export const siteContent: SitemapEntry[] = [...staticPaths, ...guidePaths];
