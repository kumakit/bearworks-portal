import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import AiNewsFeedClient from "@/components/AiNewsFeedClient";
import { NewsGroup, validateNewsData } from "@/lib/aiNewsUtils";

export const metadata: Metadata = {
  title: "AIニュースフィード | bearworks.uk",
  robots: {
    index: false,
    follow: false,
  },
};

/** ビルド時にバンドルする初期グループ数（直近2週間分） */
const INITIAL_SSG_GROUPS_LIMIT = 14;

export default async function AiNewsPage() {
  const filePath = path.join(process.cwd(), "data", "news-data.json");
  let initialGroups: NewsGroup[] = [];

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContent);
    const validated = validateNewsData(parsed);
    if (validated && validated.length > 0) {
      initialGroups = validated.slice(0, INITIAL_SSG_GROUPS_LIMIT);
    }
  } catch (error) {
    console.error("Failed to read or validate news-data.json at build time:", error);
    initialGroups = [];
  }

  return <AiNewsFeedClient initialGroups={initialGroups} />;
}
