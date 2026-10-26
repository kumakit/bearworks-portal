/**
 * AIニュース関連の型定義、バリデータ、鮮度判定およびクライアント取得ユーティリティ
 */

export interface Article {
  title: string;
  content: string;
  source: string;
  published_at?: string;
  url?: string;
  category?: string;
}

export interface NewsGroup {
  date: string;
  daily_summary?: string;
  articles: Article[];
}

export interface ArchiveIndex {
  months: string[];
  updated_at?: string;
}

export const RAW_GITHUB_NEWS_URL =
  "https://raw.githubusercontent.com/kumakit/bearworks-portal/main/data/news-data.json";
export const RAW_GITHUB_ARCHIVE_INDEX_URL =
  "https://raw.githubusercontent.com/kumakit/bearworks-portal/main/data/archive/index.json";
export const RAW_GITHUB_ARCHIVE_BASE_URL =
  "https://raw.githubusercontent.com/kumakit/bearworks-portal/main/data/archive";

export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

/**
 * 記事のURLを検証し、http/httpsスキームのみ許可する。
 * 不正スキーム（javascript:等）や不正URLはundefinedにサニタイズする。
 */
export function sanitizeArticleUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return rawUrl;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 外部取得データ（JSON）を実行時検証・サニタイズする。
 * - 空配列や不正構造は null を返す。
 * - 不正な記事はスキップし、有効な記事のみ採用する。
 * - 同一日のグループが存在する場合は重複排除（マージ）する。
 * - 最終的に日付降順でソートした配列を返す。
 */
export function validateNewsData(input: unknown): NewsGroup[] | null {
  if (!Array.isArray(input) || input.length === 0) {
    return null;
  }

  const groupMap = new Map<string, { daily_summary?: string; articles: Article[] }>();

  for (const item of input) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const { date, daily_summary, articles } = item as Record<string, unknown>;

    // 日付フォーマット検証 (YYYY-MM-DD)
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      continue;
    }
    const trimmedDate = date.trim();

    if (!Array.isArray(articles) || articles.length === 0) {
      continue;
    }

    const validArticles: Article[] = [];
    for (const art of articles) {
      if (!art || typeof art !== "object") {
        continue;
      }

      const { title, content, source, published_at, url, category } = art as Record<string, unknown>;

      if (
        typeof title !== "string" || !title.trim() ||
        typeof content !== "string" || !content.trim() ||
        typeof source !== "string" || !source.trim()
      ) {
        continue;
      }

      const sanitizedUrl = sanitizeArticleUrl(url);

      validArticles.push({
        title: title.trim(),
        content: content.trim(),
        source: source.trim(),
        ...(typeof published_at === "string" && published_at.trim() ? { published_at: published_at.trim() } : {}),
        ...(sanitizedUrl ? { url: sanitizedUrl } : {}),
        ...(typeof category === "string" && category.trim() ? { category: category.trim() } : {}),
      });
    }

    if (validArticles.length === 0) {
      continue;
    }

    const existing = groupMap.get(trimmedDate);
    const summary =
      typeof daily_summary === "string" && daily_summary.trim()
        ? daily_summary.trim()
        : existing?.daily_summary;

    if (existing) {
      // 同日の記事が存在する場合は重複排除（title基準）して追記
      const existingTitles = new Set(existing.articles.map((a) => a.title));
      for (const a of validArticles) {
        if (!existingTitles.has(a.title)) {
          existing.articles.push(a);
          existingTitles.add(a.title);
        }
      }
      if (summary && !existing.daily_summary) {
        existing.daily_summary = summary;
      }
    } else {
      groupMap.set(trimmedDate, {
        daily_summary: summary,
        articles: validArticles,
      });
    }
  }

  if (groupMap.size === 0) {
    return null;
  }

  const result: NewsGroup[] = [];
  for (const [date, data] of groupMap.entries()) {
    result.push({
      date,
      ...(data.daily_summary ? { daily_summary: data.daily_summary } : {}),
      articles: data.articles,
    });
  }

  // 日付降順にソート (新しい日付が先頭)
  result.sort((a, b) => b.date.localeCompare(a.date));

  return result;
}

/**
 * アーカイブインデックス (archive/index.json) の検証関数
 */
export function validateArchiveIndex(input: unknown): ArchiveIndex | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const { months, updated_at } = input as Record<string, unknown>;
  if (!Array.isArray(months) || months.length === 0) {
    return null;
  }

  const validMonths: string[] = [];
  for (const m of months) {
    if (typeof m === "string" && /^\d{4}-\d{2}$/.test(m.trim())) {
      validMonths.push(m.trim());
    }
  }

  if (validMonths.length === 0) {
    return null;
  }

  // 降順ソート
  validMonths.sort((a, b) => b.localeCompare(a));

  return {
    months: Array.from(new Set(validMonths)),
    ...(typeof updated_at === "string" && updated_at.trim() ? { updated_at: updated_at.trim() } : {}),
  };
}

/**
 * 鮮度判定関数
 * - 総記事数やグループ数での比較を行わない
 * - 最新日付 fetchedMaxDate と initialMaxDate を比較
 * - fetchedMaxDate > initialMaxDate -> true
 * - fetchedMaxDate === initialMaxDate かつ fetched最新日の記事数 >= initial最新日の記事数 -> true
 * - fetchedMaxDate < initialMaxDate -> false
 */
export function shouldAdoptFetchedNews(
  initialGroups: NewsGroup[],
  fetchedGroups: NewsGroup[]
): boolean {
  if (!fetchedGroups || fetchedGroups.length === 0) {
    return false;
  }
  if (!initialGroups || initialGroups.length === 0) {
    return true;
  }

  const sortedInitial = [...initialGroups].sort((a, b) => b.date.localeCompare(a.date));
  const sortedFetched = [...fetchedGroups].sort((a, b) => b.date.localeCompare(a.date));

  const initialMaxGroup = sortedInitial[0];
  const fetchedMaxGroup = sortedFetched[0];

  const cmp = fetchedMaxGroup.date.localeCompare(initialMaxGroup.date);

  if (cmp > 0) {
    return true;
  }
  if (cmp < 0) {
    return false;
  }

  // 日付が同一の場合は、最新日の記事数で比較
  const initialCount = initialMaxGroup.articles?.length || 0;
  const fetchedCount = fetchedMaxGroup.articles?.length || 0;

  return fetchedCount >= initialCount;
}

/**
 * タイムアウト付き fetch ヘルパー（AbortController + setTimeout）
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 5分単位で丸めたキャッシュバスターを生成し、GitHub CDNのエッジキャッシュ（max-age=300）と
 * 協調して不要なレート制限・帯域消費を抑制する。
 */
function getCacheBuster(): number {
  return Math.floor(Date.now() / (5 * 60 * 1000));
}

/**
 * GitHub Raw から最新の AIニュースデータを取得・検証する
 */
export async function fetchLatestAiNews(
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<NewsGroup[] | null> {
  const url = `${RAW_GITHUB_NEWS_URL}?t=${getCacheBuster()}`;
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return validateNewsData(data);
  } catch {
    return null;
  }
}

/**
 * GitHub Raw からアーカイブインデックスを取得・検証する
 */
export async function fetchArchiveIndex(
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<ArchiveIndex | null> {
  const url = `${RAW_GITHUB_ARCHIVE_INDEX_URL}?t=${getCacheBuster()}`;
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return validateArchiveIndex(data);
  } catch {
    return null;
  }
}

/**
 * 指定月のアーカイブデータ (news-YYYY-MM.json) を取得・検証する
 */
export async function fetchMonthlyArchive(
  month: string,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<NewsGroup[] | null> {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }
  const url = `${RAW_GITHUB_ARCHIVE_BASE_URL}/news-${month}.json?t=${getCacheBuster()}`;
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return validateNewsData(data);
  } catch {
    return null;
  }
}
