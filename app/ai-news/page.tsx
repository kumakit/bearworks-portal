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
    <main className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 select-none">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            bearworks.uk
          </a>
        </div>
        {sortedGroups[0] && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              最新データ: {sortedGroups[0].date}
            </span>
          </div>
        )}
      </header>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
          🤖 AI ニュースフィード
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium font-sans">
          ネットから収集された最新の AI トピックと要約
        </p>
      </div>

      {/* Content Box (Bento Card style) */}
      <div className="w-full bg-white rounded-[2.5rem] p-6 md:p-10 shadow-soft border border-gray-100 font-mono text-green-700">
        
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
                      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="text-green-600 font-bold group-open:hidden shrink-0 mt-0.5">[+]</span>
                          <span className="text-green-700 font-bold hidden group-open:inline shrink-0">[-]</span>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-zinc-800 group-hover:text-green-700 font-semibold transition-colors font-sans break-words text-sm sm:text-base leading-snug">
                              {article.title}
                            </span>
                            <span className="sm:hidden text-[10px] text-zinc-400 font-mono font-medium">
                              {article.source}
                            </span>
                          </div>
                        </div>
                        <span className="hidden sm:inline text-xs text-zinc-400 shrink-0 select-none font-mono font-medium mt-0.5">
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
                                className="text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-1 font-medium font-sans"
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
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-300 py-4 font-sans select-none">
        <p>
          Data collected by N100PC • Summaries by Gemini API • Total {totalArticles} news items
        </p>
      </footer>
    </main>
  );
}
