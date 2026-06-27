import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/toukei",
  "/ai-news",
  "/weather",
  "/privacy",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-27");

  return routes.map((route) => ({
    url: `https://bearworks.uk${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/toukei" ? 0.9 : 0.6,
  }));
}
