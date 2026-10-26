# 実装計画: Issue #415

- **Issue**: [#415 [Phase 1 / bearworks-portal] /ai-news のクライアント最新JSON取得化・スキーマ互換検証・月別アーカイブ閲覧導線](https://github.com/kumakit/mission-control/issues/415)
- **親Issue**: [#414](https://github.com/kumakit/mission-control/issues/414)
- **対象リポジトリ**: `kumakit/bearworks-portal`
- **作業ブランチ**: `feature/issue-415-ai-news-client-fetch`

---

## 1. 概要・背景

現在、AIニュースは OCI のワーカーによって日次で `kumakit/bearworks-portal` の `main` ブランチ (`data/news-data.json`) へコミット・push されています。しかし、Cloudflare Workers はビルド時にデータを静的にバンドル（SSG）しているため、`npm run deploy` でサイト全体を手動再デプロイしない限り、本番サイト（`https://bearworks.uk/ai-news`）に最新ニュースが反映されませんでした。

本タスク（Phase 1）では、以下を実現します：
1. **クライアント側での最新データ自動取得**: 初回表示はビルド時の軽量初期データ（直近14日分）を即時描画しつつ、ブラウザ側から GitHub Raw の `data/news-data.json` を非同期取得して最新データに自動更新する。
2. **安全なスキーマ検証・サニタイズ**: 取得したデータに対して実行時スキーマ検証を行い、空配列や不正データによる上書きを防止。不正な記事は個別にスキップして有効記事のみ保持し、同日グループの重複を排除する。`url` の `http:` / `https:` スキーム検証を行い、不正スキームは `undefined` へサニタイズする。
3. **日付基準の鮮度判定**: 古いデータや少ないデータで新しいデータが上書きされないよう、日付降順の最新日基準（`fetchedMaxDate >= initialMaxDate`）で判定する（総記事数の多寡は判定に使わない）。
4. **ヘッダー・フッター・記事一覧の連動更新**: 最新データ取得時に、日付・件数・記事一覧がシームレスに同期更新される。
5. **月別アーカイブ閲覧導線**: Phase 2 で導入される月別アーカイブ（`data/archive/index.json` および `data/archive/news-YYYY-MM.json`）に対応し、アーカイブが存在する場合に UI 上で月別アーカイブを切り替え閲覧できるようにする（404時は静かに非表示）。
6. **AdSense 非掲載境界の維持**: `(non-monetized)` 配下の Server Component 構成およびメタデータ設定を厳格に維持。

---

## 2. 変更・新規作成ファイル詳細

### 2.1 `lib/aiNewsUtils.ts`（新規作成）

- **型定義**:
  - `Article`: `{ title: string; content: string; source: string; published_at?: string; url?: string; category?: string; }`
  - `NewsGroup`: `{ date: string; daily_summary?: string; articles: Article[]; }`
  - `ArchiveIndex`: `{ months: string[]; updated_at?: string; }`
- **検証関数**:
  - `sanitizeArticleUrl(rawUrl: unknown): string | undefined`: `http:` または `https:` のみ許可。不正URL・他スキーム（`javascript:` 等）は `undefined` にサニタイズ。
  - `validateNewsData(input: unknown): NewsGroup[] | null`:
    - 配列でない、または空配列 `[]` の場合は `null`。
    - `date` の `YYYY-MM-DD` 形式検証。
    - 不正な記事（title/content/source欠落）は個別スキップし、有効記事のみ保持。
    - 同一日のグループが存在する場合は重複排除（title基準でマージ）。
    - 有効なグループが1件も残らない場合は `null`。
    - 最終結果は日付降順ソート。
  - `validateArchiveIndex(input: unknown): ArchiveIndex | null`:
    - `months` 配列の各要素が `^\d{4}-\d{2}$` 形式であることを検証し、降順ソートして重複排除。
- **鮮度判定関数**:
  - `shouldAdoptFetchedNews(initialGroups: NewsGroup[], fetchedGroups: NewsGroup[]): boolean`:
    - 総記事数やグループ数での比較を行わない。
    - 日付降順ソート後の最新日 `fetchedMaxDate` と `initialMaxDate` を比較。
    - `fetchedMaxDate > initialMaxDate` → `true`
    - `fetchedMaxDate === initialMaxDate` かつ fetched の最新日記事数 >= initial の最新日記事数 → `true`
    - それ以外（`fetchedMaxDate < initialMaxDate` または同日かつ記事数減） → `false`
- **クライアント取得関数**:
  - `fetchWithTimeout(url: string, timeoutMs: number)`:
    - `AbortController` + `setTimeout` + `clearTimeout` による確実なタイマー管理。
  - `fetchLatestAiNews(timeoutMs = 8000)`: GitHub Raw から `cache: "no-store"` で取得。
  - `fetchArchiveIndex(timeoutMs = 8000)`: アーカイブインデックスを取得（404等は静かに `null`）。
  - `fetchMonthlyArchive(month: string, timeoutMs = 8000)`: 指定月のアーカイブを取得。

### 2.2 `components/AiNewsFeedClient.tsx`（新規作成）

- `"use client"` コンポーネント。
- プロパティ: `initialGroups: NewsGroup[]`
- 状態管理:
  - `latestGroups`: 最新データ（初期値 `initialGroups`）
  - `selectedMonth`: `string | null`（選択中のアーカイブ月、最新時は `null`）
  - `archiveIndex`: `ArchiveIndex | null`
  - `archiveCache`: `Record<string, NewsGroup[]>`
  - `isLoadingLatest`: 初回取得中フラグ
  - `isLoadingArchive`: アーカイブ取得中フラグ
  - `archiveError`: アーカイブ取得失敗時メッセージ
- マウント時処理 (`useEffect`):
  - `fetchLatestAiNews()` を実行し、`shouldAdoptFetchedNews` で判定して更新。
  - `fetchArchiveIndex()` を実行し、インデックスが存在すれば保持。
- レンダリング:
  - ヘッダー右上の `最新データ: {latestDate}`、フッターの `Total {totalArticles} news items` を同期描画。
  - Bento Card スタイルのデザイン（details/summary、展開トグル、カテゴリバッジ、URLリンク）を踏襲。
  - タイムライン下部に「表示期間」およびアーカイブ切替ボタン（インデックス存在時）を表示。
  - 取得失敗・タイムアウト時は初期表示を維持。

### 2.3 `app/(non-monetized)/ai-news/page.tsx`（修正）

- Server Component として `metadata` エクスポートと `(non-monetized)` の AdSense 非掲載境界を維持。
- ビルド時（SSG）に `data/news-data.json` を読み込み、`validateNewsData` で検証後、最新14グループ（`INITIAL_SSG_GROUPS_LIMIT = 14`）を取り出して `<AiNewsFeedClient initialGroups={initialGroups} />` に渡す。

### 2.4 `tests/ai-news-utils.test.mjs`（新規作成）

- Node.js 標準テストランナー (`node --experimental-strip-types --test`) によるテスト。
- 実データ `data/news-data.json` を用いた互換性テスト（URL・published_at・title・content の欠落ゼロを検証）。
- スキーマ検証境界値テスト（空配列、不正構造、URLサニタイズ、不正記事スキップ）。
- 鮮度比較ロジックテスト（新14日 vs 旧30日、同日件数比較など）。
- 取得関数のモックテスト（200、404、AbortController によるタイムアウト中断挙動）。

### 2.5 ドキュメント4ファイルの更新

- `docs/operations/deployment.md`: AIニュースのクライアント最新取得方式、将来改善候補の記録保持。
- `README.md`: AIニュース自動更新のクライアント取得方式への更新。
- `AGENTS.md`: AIニュース自動反映の運用安全規約の更新。
- `GEMINI.md`: ガイドライン記述の更新。

---

## 3. 検証・品質計画

1. **単体テスト**:
   - `npm run test:ai-news` (`node --experimental-strip-types --test tests/ai-news-utils.test.mjs`)
2. **静的解析・型検査**:
   - `npm run lint`
3. **ビルド検証**:
   - `npm run build`
4. **CI 検証**:
   - GitHub Actions `Workers build`（`workers-build.yml`）の全ステップ合格確認。
   - `assert_no_ads /ai-news` および HTTP 200 の確認。

---

## 4. 安全規約・承認ゲート（AGENTS.md 遵守）

- **自律作業範囲**:
  - 作業ブランチでのコード・テスト・ドキュメント作成
  - ローカルビルド・テスト検証
  - ブランチ push および PR 作成
- **承認必須ゲート（明示承認なしに実行しない）**:
  - `main` ブランチへのマージ
  - 本番デプロイ (`npm run deploy`)
  - Cloudflare 設定の変更
