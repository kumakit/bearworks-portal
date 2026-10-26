# Issue #415 実装・検証記録 (Walkthrough)

- **Issue**: [#415 [Phase 1 / bearworks-portal] /ai-news のクライアント最新JSON取得化・スキーマ互換検証・月別アーカイブ閲覧導線](https://github.com/kumakit/mission-control/issues/415)
- **親Issue**: [#414](https://github.com/kumakit/mission-control/issues/414)
- **対象リポジトリ**: `kumakit/bearworks-portal`
- **作業ブランチ**: `feature/issue-415-ai-news-client-fetch`
- **実施日**: 2026-10-26

---

## 1. 変更内容のサマリー

| ファイル | 種別 | 内容 |
|---|---|---|
| `lib/aiNewsUtils.ts` | 新規 | 実データ準拠の型定義 (`Article`, `NewsGroup`, `ArchiveIndex`)、実行時スキーマ検証 (`validateNewsData`)、URL サニタイズ (`sanitizeArticleUrl`)、日付ベース鮮度判定 (`shouldAdoptFetchedNews`)、クライアント取得関数 (`fetchLatestAiNews`, `fetchArchiveIndex`, `fetchMonthlyArchive`) の実装 |
| `components/AiNewsFeedClient.tsx` | 新規 | `"use client"` コンポーネント。マウント時に最新データを非同期取得し、日付・総件数・記事一覧をシームレスに同期更新。タイムライン下部に月別アーカイブ切替UIおよびオンデマンド取得導線を実装 |
| `app/(non-monetized)/ai-news/page.tsx` | 変更 | Server Component として `metadata` と AdSense 非掲載境界を維持。ビルド時初期データ（最新14グループ）を抽出して `<AiNewsFeedClient />` へ引き渡し |
| `tests/ai-news-utils.test.mjs` | 新規 | Node.js 標準テストランナー (`node --experimental-strip-types --test`) による単体テスト。実データ `data/news-data.json` との互換性（URL・日付の欠落ゼロ）、空配列・不正構造の除外、鮮度比較（古い30日データが新しい14日データを上書きしない保証）、fetch モックテストを網羅 |
| `package.json` | 変更 | `"test:ai-news": "node --experimental-strip-types --test tests/ai-news-utils.test.mjs"` を追加 |
| `.github/workflows/workers-build.yml` | 変更 | CI パイプラインに `npm run test:ai-news` ステップを追加 |
| `eslint.config.mjs` | 変更 | プラグイン設定の調整およびローカルリサーチディレクトリの除外 |
| `AGENTS.md` / `GEMINI.md` / `README.md` / `docs/operations/deployment.md` | 変更 | AIニュースがクライアント側最新JSON取得により自動反映される旨、ドキュメント4ファイルの運用記述を同期更新 |

---

## 2. 検証結果

### 2.1 単体テスト (`npm run test:ai-news`)
```
✔ sanitizeArticleUrl allows http and https, and strips invalid schemes (0.5009ms)
✔ validateNewsData validates real repository news-data.json with zero loss of url/published_at (13.9245ms)
✔ validateNewsData handles edge cases: empty array, non-array, and partial corrupted items (0.3233ms)
✔ shouldAdoptFetchedNews ensures newer fetched date adopts, older fetched date does NOT overwrite SSG (0.1944ms)
✔ validateArchiveIndex parses valid archive indices correctly (0.7095ms)
✔ fetchLatestAiNews, fetchArchiveIndex, fetchMonthlyArchive mock tests (0.5906ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
```
- 実データ（122グループ・1346記事）に対して、1件の URL も published_at も欠落することなくパース成功を確認。
- `shouldAdoptFetchedNews` において、記事数の多寡に関わらず日付基準で新旧を判定し、古い30日データが新しい14日SSGデータを上書きしないことを実証。

### 2.2 静的解析 (`npm run lint`)
- 新規・修正ファイルについて ESLint エラー・警告ともに 0 件で合格。

### 2.3 Next.js ビルド (`npm run build`)
- バンドル検証テスト群が全パス。
- `app/(non-monetized)/ai-news/page.tsx` が ○ (Static) として正常にプリレンダリング完了。

### 2.4 prefetch ポリシー検証
- `git grep -l 'from "next/link"' -- '*.tsx'` の結果が `components/InternalLink.tsx` のみであることを確認（CIの prefetch ポリシーに準拠）。

---

## 3. 受入条件（Acceptance Criteria）の達成状況

- [x] `Article` 型および実行時バリデータが実データ（`title`, `content`, `source`, `published_at`, `url`, `category`）と完全一致し、`article.url` に対して `http:` / `https:` スキーム検証を行うこと。
- [x] リポジトリ内の実ファイル `data/news-data.json` を読み込む互換性単体テスト (`npm run test:ai-news`) で、既存記事の `url` や `published_at` が1件も欠落しないこと。
- [x] クライアント取得データの採用判定に「総記事数」を使わず、最新日付 (`fetchedMaxDate >= initialMaxDate`) 基準で判定し、古い30日データが新しい14日SSGデータを上書きしないことがテストで保証されていること。
- [x] クライアント更新時に、記事一覧だけでなくヘッダーの「最新データ日付」とフッターの「Total N news items」も連動して更新されること。
- [x] `data/archive/index.json` が存在する場合、過去の月別アーカイブ (`data/archive/news-YYYY-MM.json`) をオンデマンドで切り替えて閲覧できるUI導線があること。
- [x] ローカル `npm run build` がパスし、AdSense 非掲載境界が維持されていること。
