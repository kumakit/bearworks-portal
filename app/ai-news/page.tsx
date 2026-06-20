import { promises as fs } from "fs";
import path from "path";

interface Article {
  title: string;
  content: string;
  source: string;
  published_at?: string;
  url?: string;
}

interface NewsGroup {
  date: string;
  articles: Article[];
}

export default async function AiNewsPage() {
  const filePath = path.join(process.cwd(), "data", "news-data.json");
  let newsGroups: NewsGroup[] = [];

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      newsGroups = parsed as NewsGroup[];
    }
  } catch (error) {
    console.error("Failed to read news-data.json:", error);
    newsGroups = [];
  }

  // 日付を降順でソート (新しい日付が上)
  const sortedGroups = [...newsGroups].sort((a, b) => b.date.localeCompare(a.date));

  // 総記事数の算出
  const totalArticles = newsGroups.reduce((acc, curr) => acc + (curr.articles?.length || 0), 0);

  return (
    <div className="w-full max-w-4xl bg-white rounded-[2.5rem] p-6 md:p-10 shadow-soft border border-gray-100 font-mono text-green-700">
      {/* ターミナル風ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/85"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400/85"></div>
          <div className="w-3 h-3 rounded-full bg-green-400/85"></div>
          <span className="text-xs text-zinc-400 ml-2 font-medium">bear-term ~ ai-news</span>
        </div>
        <span className="text-xs text-zinc-400">bash 5.1</span>
      </div>

      {/* ログイン・プロンプト情報 */}
      <div className="space-y-1 mb-6 text-sm">
        <p className="text-zinc-400">Last login: {new Date().toLocaleString("ja-JP")}</p>
        <p className="text-zinc-600 font-bold">
          <span className="text-blue-600 font-medium">guest@bearworks</span>:
          <span className="text-purple-600 font-medium">~/news</span>$ <span className="text-green-700">cat ./ai-news.log</span>
        </p>
      </div>

      {/* ニュース表示エリア */}
      {sortedGroups.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 select-none">
          <p className="text-lg font-bold">No news available.</p>
          <p className="text-xs mt-2">Waiting for feed updates from N100PC...</p>
          <span className="inline-block w-2 h-4 bg-green-600 animate-pulse align-middle mt-4"></span>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* 日付ヘッダー */}
              <div className="flex items-center gap-4 text-green-800 font-bold border-b border-dashed border-green-100 pb-1 select-none">
                <span>[ {group.date} ]</span>
                <div className="h-px bg-green-100 flex-grow"></div>
                <span className="text-xs font-normal text-zinc-400">
                  {group.articles?.length || 0} item(s)
                </span>
              </div>

              {/* ニュースリスト */}
              <div className="space-y-2.5">
                {group.articles?.map((article, idx) => (
                  <details
                    key={idx}
                    className="group border border-gray-100 hover:border-green-200 rounded-2xl p-4 transition-colors bg-white hover:bg-green-50/10 shadow-sm hover:shadow-soft"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center gap-3 pr-4 overflow-hidden">
                        <span className="text-green-600 font-bold group-open:hidden shrink-0">[+]</span>
                        <span className="text-green-700 font-bold hidden group-open:inline shrink-0">[-]</span>
                        <span className="truncate text-zinc-800 group-hover:text-green-700 font-semibold transition-colors font-sans">
                          {article.title}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0 select-none font-mono font-medium">
                        {article.source}
                      </span>
                    </summary>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-zinc-650 font-sans leading-relaxed pl-6 space-y-3 bg-[#F0FDF4]/30 rounded-xl p-4 border border-[#F0FDF4]/80">
                      <p className="whitespace-pre-wrap">{article.content}</p>
                      {(article.url || article.published_at) && (
                        <div className="pt-2 font-mono text-xs flex flex-wrap gap-4 text-zinc-400">
                          {article.published_at && (
                            <span>Published: {article.published_at}</span>
                          )}
                          {article.url && (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <span>🔗 Go to source</span>
                              <span className="text-zinc-400 font-normal">({article.url})</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フッター */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-zinc-400 flex justify-between items-center select-none">
        <span>Total: {totalArticles} news items</span>
        <div className="flex items-center gap-1 font-bold">
          <span className="text-zinc-500">guest@bearworks:~$</span>
          <span className="inline-block w-2 h-4 bg-green-600 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}
