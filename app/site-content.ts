import type { MetadataRoute } from "next";

type SitemapEntry = Omit<MetadataRoute.Sitemap[number], "url"> & {
  pathname: string;
};

export const siteContent: SitemapEntry[] = [
  {
    pathname: "/",
    lastModified: new Date("2026-06-28"),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    pathname: "/about",
    lastModified: new Date("2026-06-28"),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    pathname: "/toukei",
    lastModified: new Date("2026-06-28"),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    pathname: "/privacy",
    lastModified: new Date("2026-06-15"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    pathname: "/contact",
    lastModified: new Date("2026-06-15"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];
