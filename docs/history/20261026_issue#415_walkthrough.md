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
| `lib/aiNewsUtils.ts` | 新規 | 実データ準拠の型定義 (`Article`, `NewsGroup`, `ArchiveIndex`)、実行時スキーマ検証 (`validateNewsData`)、URL サニタイズ (`sanitizeArticleUrl`)、日付ベース鮮度判定 (`shouldAdoptFetchedNews`)、クライアント取得関数 (`fetchLatestAiNews`, `fetchArchiveIndex`, `fetchMonthlyArchive`) の実装。5分バケットキャッシュバスターによりエッジキャッシュと協調 |
| `components/AiNewsFeedClient.tsx` | 新規 | `"use client"` コンポーネント。マウント時に最新データを非同期取得し、日付・総件数・記事一覧をシームレスに同期更新。リクエスト競合防止 (`activeFetchMonthRef`)、タイムライン下部に月別アーカイブ切替UIおよびオンデマンド取得導線を実装 |
| `app/(non-monetized)/ai-news/page.tsx` | 変更 | Server Component として `metadata` と AdSense 非掲載境界を維持。ビルド時初期データ（最新14グループ）を抽出して `<AiNewsFeedClient />` へ引き渡し |
| `tests/ai-news-utils.test.mjs` | 新規 | Node.js 標準テストランナー (`node --experimental-strip-types --test`) による単体テスト。実データ `data/news-data.json` との互換性（URL・日付・タイトル・コンテンツの欠落ゼロ）、空配列・不正構造の除外、鮮度比較（古い30日データが新しい14日データを上書きしない保証）、`AbortController` による実中断タイムアウトテストを網羅 |
| `package.json` | 変更 | `"test:ai-news": "node --experimental-strip-types --test tests/ai-news-utils.test.mjs"` を追加 |
| `.github/workflows/workers-build.yml` | 変更 | CI パイプラインに `npm run test:ai-news` ステップを追加 |
| `AGENTS.md` / `GEMINI.md` / `README.md` / `docs/operations/deployment.md` | 変更 | AIニュースがクライアント側最新JSON取得により自動反映される旨、ドキュメント4ファイルの運用記述を同期更新（`deployment.md` 内の将来改善候補も維持・復元） |

---

## 2. 検証結果

### 2.1 単体テスト (`npm run test:ai-news`)
```
✔ sanitizeArticleUrl allows http and https, and strips invalid schemes (0.5046ms)
✔ validateNewsData validates real repository news-data.json with zero loss of url, published_at, title, and content (15.1663ms)
✔ validateNewsData handles edge cases: empty array, non-array, and partial corrupted items (0.2462ms)
✔ shouldAdoptFetchedNews ensures newer fetched date adopts, older fetched date does NOT overwrite SSG (0.16ms)
✔ validateArchiveIndex parses valid archive indices correctly (0.6377ms)
✔ fetchLatestAiNews, fetchArchiveIndex, fetchMonthlyArchive mock tests with real AbortController timeout (26.7423ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
```
- 実データ（122グループ・1346記事）に対して、1件の URL・published_at・title・content も欠落することなくパース成功を確認。
- `shouldAdoptFetchedNews` において、記事数の多寡に関わらず日付基準で新旧を判定し、古い30日データが新しい14日SSGデータを上書きしないことを実証。
- `AbortController` による実遅延リクエストの中断動作を検証。

### 2.2 静的解析 (`npx eslint app components lib`)
- 対象ディレクトリ（`app`, `components`, `lib`）について ESLint エラー 0 件。

### 2.3 Next.js ビルド (`npm run build`)
- バンドル検証テスト群が全パス。
- `app/(non-monetized)/ai-news/page.tsx` が ○ (Static) として正常にプリレンダリング完了。

### 2.4 prefetch ポリシー検証
- `git grep -l 'from "next/link"' -- '*.tsx'` の結果が `components/InternalLink.tsx` のみであることを確認（CIの prefetch ポリシーに準拠）。

---

## 3. 受入条件（Acceptance Criteria）の達成状況

- [x] `Article` 型および実行時バリデータが実データ（`title`, `content`, `source`, `published_at`, `url`, `category`）と完全一致し、`article.url` に対して `http:` / `https:` スキーム検証を行うこと。
- [x] リポジトリ内の実ファイル `data/news-data.json` を読み込む互換性単体テスト (`npm run test:ai-news`) で、既存記事の `url`, `published_at`, `title`, `content` が1件も欠落しないこと。
- [x] クライアント取得データの採用判定に「総記事数」を使わず、最新日付 (`fetchedMaxDate >= initialMaxDate`) 基準で判定し、古い30日データが新しい14日SSGデータを上書きしないことがテストで保証されていること。
- [x] クライアント更新時に、記事一覧だけでなくヘッダーの「最新データ日付」とフッターの「Total N news items」も連動して更新されること。
- [x] `data/archive/index.json` が存在する場合、過去の月別アーカイブ (`data/archive/news-YYYY-MM.json`) をオンデマンドで切り替えて閲覧できるUI導線があること。
- [x] ローカル `npm run build` がパスし、AdSense 非掲載境界が維持されていること。

---

## 4. 本番デプロイおよび実URL検証記録

- **マージコミット**: `6549347c69cb965e1d48e5b91b8a4fa97096f593` (PR [#42](https://github.com/kumakit/bearworks-portal/pull/42))
- **公開日時**: 2026-10-26 21:18 JST (`2026-10-26T12:18:37.279Z`)
- **公開 Version ID**: `2e18eea9-faf4-4952-8d3c-9a4a5ab32ab9`
- **直前 Version ID (復旧先)**: `1fbf5e80-7fb3-452b-bbb8-243cf04d1785`
- **本番環境変数**: `NEXT_PUBLIC_ADSENSE_CLIENT_ID="ca-pub-9560028085973137"`

### 実URL検証結果
1. **トップページ (`https://bearworks.uk/`)**: HTTP 200、本番 AdSense ID (`ca-pub-9560028085973137`) 正常描画確認。
2. **AIニュース (`https://bearworks.uk/ai-news`)**:
   - HTTP 200 正常応答。
   - 初期SSGデータ（最新日付 `2026-10-26`、まとめ、10記事）が正常描画。
   - AdSense パブリッシャー ID およびスクリプトが**一切含まれていないこと**を確認（AdSense 非掲載境界の維持）。
3. **その他非広告ページ**: `/about`, `/weather`, `/privacy`, `/contact` すべて HTTP 200、広告コード一切なし。
4. **404 ページ (`/not-found-test-slug`)**: HTTP 404 応答、広告コード一切なし。
5. **認証・保護確認**: `/dashboard` および `/api/dashboard-data` への未認証アクセス時に Cloudflare Access (`bearworks-uk.cloudflareaccess.com`) へ 302 リダイレクトされることを確認。
6. **関連ファイル**:
   - `https://bearworks.uk/ads.txt`: HTTP 200、`google.com, pub-9560028085973137, DIRECT, f08c47fec0942fa0` 確認。
   - `https://bearworks.uk/robots.txt` & `https://bearworks.uk/sitemap.xml`: HTTP 200 正常取得確認。

