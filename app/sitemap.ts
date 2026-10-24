import type { MetadataRoute } from "next";
import { siteContent } from "./site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteContent.map(({ pathname, lastModified, changeFrequency, priority }) => ({
    url: `https://bearworks.uk${pathname}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
