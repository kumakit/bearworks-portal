"use client";

import React, { useEffect, useState } from "react";
import Link from "@/components/InternalLink";
import {
  Article,
  NewsGroup,
  ArchiveIndex,
  fetchLatestAiNews,
  fetchArchiveIndex,
  fetchMonthlyArchive,
  shouldAdoptFetchedNews,
} from "@/lib/aiNewsUtils";

interface AiNewsFeedClientProps {
  initialGroups: NewsGroup[];
}

export default function AiNewsFeedClient({ initialGroups }: AiNewsFeedClientProps) {
  const [latestGroups, setLatestGroups] = useState<NewsGroup[]>(initialGroups);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [archiveIndex, setArchiveIndex] = useState<ArchiveIndex | null>(null);
  const [archiveCache, setArchiveCache] = useState<Record<string, NewsGroup[]>>({});
  const [isLoadingLatest, setIsLoadingLatest] = useState<boolean>(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState<boolean>(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isLiveUpdated, setIsLiveUpdated] = useState<boolean>(false);

  // マウント時にクライアント側で最新ニュースおよびアーカイブインデックスを取得
  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      setIsLoadingLatest(true);
      try {
        const fetched = await fetchLatestAiNews();
        if (isMounted && fetched && shouldAdoptFetchedNews(initialGroups, fetched)) {
          setLatestGroups(fetched);
          setIsLiveUpdated(true);
        }
      } catch (err) {
        console.warn("Failed to fetch live AI news from GitHub Raw:", err);
      } finally {
        if (isMounted) {
          setIsLoadingLatest(false);
        }
      }

      // アーカイブインデックスの取得（存在しない場合は静かにスキップ）
      try {
        const index = await fetchArchiveIndex();
        if (isMounted && index) {
          setArchiveIndex(index);
        }
      } catch {
        // アーカイブが存在しない場合は何もしない
      }
    }

    loadLiveData();

    return () => {
      isMounted = false;
    };
  }, [initialGroups]);

  // 月別アーカイブ選択ハンドラ
  const handleSelectMonth = async (month: string) => {
    if (selectedMonth === month) return;

    setSelectedMonth(month);
    setArchiveError(null);

    if (archiveCache[month]) {
      return;
    }

    setIsLoadingArchive(true);
    try {
      const data = await fetchMonthlyArchive(month);
      if (data && data.length > 0) {
        setArchiveCache((prev) => ({ ...prev, [month]: data }));
      } else {
        setArchiveError(`${month} のアーカイブデータが見つかりませんでした。`);
      }
    } catch {
      setArchiveError(`${month} のアーカイブ取得中にエラーが発生しました。`);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleSelectLatest = () => {
    setSelectedMonth(null);
    setArchiveError(null);
  };

  // 表示対象のグループデータ
  const currentGroups = selectedMonth ? (archiveCache[selectedMonth] || []) : latestGroups;
  const sortedGroups = [...currentGroups].sort((a, b) => b.date.localeCompare(a.date));

  // 最新データ日付と総記事数（クライアント更新時に連動）
  const latestDate = sortedGroups[0]?.date;
  const totalArticles = currentGroups.reduce((acc, curr) => acc + (curr.articles?.length || 0), 0);

  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3 select-none">
        <div className="flex items-center gap-3">
          <Link
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
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {latestDate && (
            <span className="text-xs text-gray-400">
              {selectedMonth ? `アーカイブ: ${selectedMonth}` : `最新データ: ${latestDate}`}
            </span>
          )}
          {isLiveUpdated && !selectedMonth && (
            <span
              className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-mono"
              title="GitHub Raw から最新データを反映済み"
            >
              Live
            </span>
          )}
          {isLoadingLatest && (
            <span className="text-[10px] text-zinc-400 animate-pulse font-mono">
              [更新確認中...]
            </span>
          )}
        </div>
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
        {/* アーカイブ読込中インジケータ */}
        {isLoadingArchive && (
          <div className="py-8 text-center text-zinc-400 select-none">
            <p className="text-sm font-semibold">アーカイブデータを読み込み中...</p>
            <span className="inline-block w-2 h-4 bg-green-600 animate-pulse align-middle mt-2"></span>
          </div>
        )}

        {/* アーカイブエラー表示 */}
        {archiveError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-sans">
            {archiveError}
          </div>
        )}

        {/* ニュース表示エリア */}
        {!isLoadingArchive && sortedGroups.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 select-none">
            <p className="text-lg font-bold">No news available.</p>
            <p className="text-xs mt-2">データが存在しないか、読み込みを待機しています。</p>
            <span className="inline-block w-2 h-4 bg-green-600 animate-pulse align-middle mt-4"></span>
          </div>
        ) : (
          !isLoadingArchive && (
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

                  {/* その日の注目ニュース総括（初期状態で展開） */}
                  {group.daily_summary && (
                    <details
                      open
                      className="group rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-zinc-700 shadow-sm"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-sm font-bold text-blue-700 select-none [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">[+]</span>
                        <span className="hidden group-open:inline">[-]</span>
                        <span>今日の注目ニュース・まとめ</span>
                      </summary>
                      <p className="mt-3 whitespace-pre-wrap border-t border-blue-100 pt-3 font-sans text-sm leading-relaxed text-zinc-800">
                        {group.daily_summary}
                      </p>
                    </details>
                  )}

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
                              <span className="sm:hidden text-[10px] text-zinc-400 font-mono font-medium flex flex-wrap items-center gap-1 mt-1">
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-md font-sans">
                                  {article.category ?? "その他"}
                                </span>
                                <span>
                                  {article.source}
                                  {article.published_at && ` • ${article.published_at.substring(5)}`}
                                </span>
                              </span>
                            </div>
                          </div>
                          <span className="hidden sm:flex text-xs text-zinc-400 shrink-0 select-none font-mono font-medium mt-0.5 flex-wrap items-center gap-2 text-right justify-end">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-md font-sans">
                              {article.category ?? "その他"}
                            </span>
                            <span>
                              {article.source}
                              {article.published_at && ` • ${article.published_at.substring(5)}`}
                            </span>
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
                                  className="text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-1 font-medium font-sans break-all"
                                >
                                  <span>🔗 元記事を読む</span>
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
          )
        )}

        {/* タイムライン下部: 表示期間および月別アーカイブ切替UI */}
        <div className="mt-12 pt-6 border-t border-dashed border-green-100 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
            <div>
              <span>表示期間: </span>
              <span className="font-medium text-zinc-600">
                {selectedMonth ? `${selectedMonth} 月別アーカイブ` : "直近の配信データ（最新）"}
              </span>
            </div>

            {/* 月別アーカイブ切替UI（archiveIndexが存在する場合のみ表示） */}
            {archiveIndex && archiveIndex.months.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-400 mr-1">アーカイブ:</span>
                <button
                  type="button"
                  onClick={handleSelectLatest}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedMonth === null
                      ? "bg-green-700 text-white font-semibold"
                      : "bg-gray-100 text-zinc-600 hover:bg-gray-200"
                  }`}
                >
                  最新
                </button>
                {archiveIndex.months.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleSelectMonth(month)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedMonth === month
                        ? "bg-green-700 text-white font-semibold"
                        : "bg-gray-100 text-zinc-600 hover:bg-gray-200"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-300 py-4 font-sans select-none">
        <p>
          Data collected by OCI • Summaries by Gemini API • Total {totalArticles} news items
        </p>
      </footer>
    </main>
  );
}
