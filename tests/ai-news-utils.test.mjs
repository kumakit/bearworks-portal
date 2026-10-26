import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  sanitizeArticleUrl,
  validateNewsData,
  validateArchiveIndex,
  shouldAdoptFetchedNews,
  fetchLatestAiNews,
  fetchArchiveIndex,
  fetchMonthlyArchive,
} from "../lib/aiNewsUtils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("sanitizeArticleUrl allows http and https, and strips invalid schemes", () => {
  assert.equal(sanitizeArticleUrl("https://example.com/article"), "https://example.com/article");
  assert.equal(sanitizeArticleUrl("http://example.com/article"), "http://example.com/article");
  assert.equal(sanitizeArticleUrl("javascript:alert(1)"), undefined);
  assert.equal(sanitizeArticleUrl("data:text/html,<h1>bad</h1>"), undefined);
  assert.equal(sanitizeArticleUrl("ftp://example.com"), undefined);
  assert.equal(sanitizeArticleUrl("not-a-url"), undefined);
  assert.equal(sanitizeArticleUrl(""), undefined);
  assert.equal(sanitizeArticleUrl(null), undefined);
});

test("validateNewsData validates real repository news-data.json with zero loss of url, published_at, title, and content", async () => {
  const filePath = path.join(__dirname, "..", "data", "news-data.json");
  const rawContent = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(rawContent);

  const validated = validateNewsData(parsed);
  assert.ok(validated, "validated result should not be null");
  assert.equal(validated.length, parsed.length, "groups length should match real file groups length");

  // 元データ内の全有効記事の url, published_at, title, content の総数をカウント
  let rawUrlCount = 0;
  let rawPubCount = 0;
  let rawTitleCount = 0;
  let rawContentCount = 0;

  for (const group of parsed) {
    for (const art of group.articles || []) {
      if (art.title && art.title.trim()) rawTitleCount++;
      if (art.content && art.content.trim()) rawContentCount++;
      if (art.url) rawUrlCount++;
      if (art.published_at) rawPubCount++;
    }
  }

  let validatedUrlCount = 0;
  let validatedPubCount = 0;
  let validatedTitleCount = 0;
  let validatedContentCount = 0;

  for (const group of validated) {
    for (const art of group.articles) {
      if (art.title) validatedTitleCount++;
      if (art.content) validatedContentCount++;
      if (art.url) validatedUrlCount++;
      if (art.published_at) validatedPubCount++;
    }
  }

  assert.equal(validatedTitleCount, rawTitleCount, "All valid titles must be retained");
  assert.equal(validatedContentCount, rawContentCount, "All valid contents must be retained");
  assert.equal(validatedUrlCount, rawUrlCount, "All valid article URLs must be retained without loss");
  assert.equal(validatedPubCount, rawPubCount, "All valid published_at timestamps must be retained without loss");

  // 各記事のタイトルとコンテンツが実データと厳密に一致することをサンプルおよび全件走査で検証
  for (let i = 0; i < parsed.length; i++) {
    const rawG = parsed[i];
    const valG = validated.find((g) => g.date === rawG.date);
    assert.ok(valG, `Group for date ${rawG.date} must exist`);
    assert.equal(valG.articles.length, rawG.articles.length);
    for (let j = 0; j < rawG.articles.length; j++) {
      assert.equal(valG.articles[j].title, rawG.articles[j].title.trim());
      assert.equal(valG.articles[j].content, rawG.articles[j].content.trim());
    }
  }
});

test("validateNewsData handles edge cases: empty array, non-array, and partial corrupted items", () => {
  assert.equal(validateNewsData([]), null);
  assert.equal(validateNewsData(null), null);
  assert.equal(validateNewsData("not an array"), null);
  assert.equal(validateNewsData([{}]), null);

  // 不正な記事（title欠落）はスキップされ、正常な記事のみ残る
  const mixedData = [
    {
      date: "2026-10-26",
      daily_summary: "Summary for today",
      articles: [
        { title: "Good 1", content: "Content 1", source: "Source 1", url: "https://example.com" },
        { title: "", content: "Content bad", source: "Source" }, // bad: empty title
        { content: "No title", source: "Source" }, // bad: no title
        { title: "Good 2", content: "Content 2", source: "Source 2", url: "javascript:evil()" }, // bad url
      ],
    },
  ];

  const res = validateNewsData(mixedData);
  assert.ok(res);
  assert.equal(res.length, 1);
  assert.equal(res[0].articles.length, 2, "Only valid articles should be retained");
  assert.equal(res[0].articles[0].url, "https://example.com");
  assert.equal(res[0].articles[1].url, undefined, "javascript: scheme should be sanitized to undefined");
});

test("shouldAdoptFetchedNews ensures newer fetched date adopts, older fetched date does NOT overwrite SSG", () => {
  const initialNew14 = [
    {
      date: "2026-10-26",
      articles: [{ title: "T1", content: "C1", source: "S1" }],
    },
    {
      date: "2026-10-25",
      articles: [{ title: "T2", content: "C2", source: "S2" }],
    },
  ];

  const fetchedOld30 = [
    {
      date: "2026-10-24", // Latest date in fetched is older than SSG's 2026-10-26
      articles: [
        { title: "Old 1", content: "C", source: "S" },
        { title: "Old 2", content: "C", source: "S" },
        { title: "Old 3", content: "C", source: "S" },
      ],
    },
    {
      date: "2026-10-23",
      articles: [{ title: "Old 4", content: "C", source: "S" }],
    },
  ];

  // 古い30日データが新しい14日SSGデータを上書きしないこと
  assert.equal(
    shouldAdoptFetchedNews(initialNew14, fetchedOld30),
    false,
    "Older fetched news must not overwrite newer SSG news regardless of count"
  );

  // fetched の方が新しい日付の場合（2026-10-27 vs 2026-10-26）
  const fetchedNewer = [
    {
      date: "2026-10-27",
      articles: [{ title: "Newer 1", content: "C", source: "S" }],
    },
  ];
  assert.equal(
    shouldAdoptFetchedNews(initialNew14, fetchedNewer),
    true,
    "Newer fetched date must be adopted"
  );

  // 同一日付で記事数が同じ、または fetched の方が多い場合
  const fetchedSameDateMoreArticles = [
    {
      date: "2026-10-26",
      articles: [
        { title: "T1", content: "C1", source: "S1" },
        { title: "T1-new", content: "C1-new", source: "S1" },
      ],
    },
  ];
  assert.equal(
    shouldAdoptFetchedNews(initialNew14, fetchedSameDateMoreArticles),
    true,
    "Same latest date with >= articles must be adopted"
  );

  // 同一日付で fetched の記事数が少ない場合
  const fetchedSameDateFewerArticles = [
    {
      date: "2026-10-26",
      articles: [],
    },
  ];
  assert.equal(
    shouldAdoptFetchedNews(initialNew14, fetchedSameDateFewerArticles),
    false,
    "Same latest date with fewer articles must not be adopted"
  );
});

test("validateArchiveIndex parses valid archive indices correctly", () => {
  assert.equal(validateArchiveIndex(null), null);
  assert.equal(validateArchiveIndex({}), null);
  assert.equal(validateArchiveIndex({ months: [] }), null);
  assert.equal(validateArchiveIndex({ months: ["invalid-format"] }), null);

  const valid = validateArchiveIndex({
    months: ["2026-09", "2026-10", "2026-08"],
    updated_at: "2026-10-26T00:00:00Z",
  });
  assert.ok(valid);
  assert.deepEqual(valid.months, ["2026-10", "2026-09", "2026-08"], "months should be sorted descending");
  assert.equal(valid.updated_at, "2026-10-26T00:00:00Z");
});

test("fetchLatestAiNews, fetchArchiveIndex, fetchMonthlyArchive mock tests with real AbortController timeout", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // 正常系テスト
    globalThis.fetch = async (url) => {
      if (url.includes("news-data.json")) {
        return {
          ok: true,
          json: async () => [
            {
              date: "2026-10-26",
              articles: [{ title: "T", content: "C", source: "S" }],
            },
          ],
        };
      }
      if (url.includes("archive/index.json")) {
        return {
          ok: true,
          json: async () => ({ months: ["2026-10"] }),
        };
      }
      if (url.includes("news-2026-10.json")) {
        return {
          ok: true,
          json: async () => [
            {
              date: "2026-10-15",
              articles: [{ title: "Archive T", content: "C", source: "S" }],
            },
          ],
        };
      }
      return { ok: false, status: 404 };
    };

    const latest = await fetchLatestAiNews();
    assert.ok(latest);
    assert.equal(latest[0].date, "2026-10-26");

    const index = await fetchArchiveIndex();
    assert.ok(index);
    assert.deepEqual(index.months, ["2026-10"]);

    const monthly = await fetchMonthlyArchive("2026-10");
    assert.ok(monthly);
    assert.equal(monthly[0].date, "2026-10-15");

    // 異常系: 404 HTTPエラー
    globalThis.fetch = async () => {
      return { ok: false, status: 404 };
    };

    assert.equal(await fetchLatestAiNews(), null);
    assert.equal(await fetchArchiveIndex(), null);
    assert.equal(await fetchMonthlyArchive("2026-10"), null);

    // 異常系: 実際に AbortSignal のタイムアウトで中断される動作のテスト
    globalThis.fetch = (url, options) => {
      return new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (signal?.aborted) {
          return reject(new DOMException("The operation was aborted", "AbortError"));
        }
        signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    };

    // タイムアウトを短い時間 (10ms) に指定して実行し、AbortController で安全に中断されることを検証
    const timeoutLatest = await fetchLatestAiNews(10);
    assert.equal(timeoutLatest, null, "Should return null on AbortError timeout");

    const timeoutArchive = await fetchMonthlyArchive("2026-10", 10);
    assert.equal(timeoutArchive, null, "Should return null on AbortError timeout");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
