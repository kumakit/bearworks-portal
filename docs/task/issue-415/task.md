# タスク管理: Issue #415

- **Issue**: [#415 [Phase 1 / bearworks-portal] /ai-news のクライアント最新JSON取得化・スキーマ互換検証・月別アーカイブ閲覧導線](https://github.com/kumakit/mission-control/issues/415)
- **親Issue**: [#414](https://github.com/kumakit/mission-control/issues/414)
- **ブランチ**: `feature/issue-415-ai-news-client-fetch`

## タスク進捗

- [x] 1. 計画作成とユーザー承認
  - [x] 1.1 要件分析と既存コード調査（`page.tsx`, `data/news-data.json`, `workers-build.yml`）
  - [x] 1.2 作業ブランチ `feature/issue-415-ai-news-client-fetch` の作成
  - [x] 1.3 `implementation_plan.md` と `task.md` の作成・レビュー反映と承認完了
- [x] 2. ユーティリティ・バリデータ実装 (`lib/aiNewsUtils.ts`)
  - [x] 2.1 型定義 (`Article`, `NewsGroup`, `ArchiveIndex`)
  - [x] 2.2 スキーマ検証および URL サニタイズ関数 (`validateNewsData`, `sanitizeArticleUrl`, `validateArchiveIndex` - 不正記事スキップ・同日重複排除・日付形式チェック)
  - [x] 2.3 日付ベース鮮度比較関数 (`shouldAdoptFetchedNews`)
  - [x] 2.4 クライアント取得関数 (`fetchLatestAiNews`, `fetchArchiveIndex`, `fetchMonthlyArchive` - AbortController + setTimeout)
- [x] 3. 単体テスト作成と互換性検証 (`tests/ai-news-utils.test.mjs`, `package.json`, CI)
  - [x] 3.1 `package.json` に `test:ai-news` 追加（`--experimental-strip-types` 利用）
  - [x] 3.2 実ファイル `data/news-data.json` の互換性テスト（URL/日付の欠落ゼロ検証）
  - [x] 3.3 境界値・スキーマ検証テスト（空配列、不正構造、javascriptスキーム等の除外、不正記事スキップ）
  - [x] 3.4 鮮度比較ロジックの単体テスト（新14日 vs 旧30日、同日件数比較等）
  - [x] 3.5 取得関数のモックテスト（200, 404, タイムアウト）
  - [x] 3.6 `.github/workflows/workers-build.yml` に `npm run test:ai-news` 追加
- [x] 4. クライアントコンポーネント実装 (`components/AiNewsFeedClient.tsx`)
  - [x] 4.1 ヘッダー（最新データ日付）とフッター（総件数）の連動管理
  - [x] 4.2 マウント時の最新データ取得・鮮度比較による自動更新
  - [x] 4.3 取得失敗・タイムアウト時のフォールバック維持
  - [x] 4.4 月別アーカイブ切替UIおよびオンデマンド取得（404時は静かに非表示）
- [x] 5. ページ修正 (`app/(non-monetized)/ai-news/page.tsx`)
  - [x] 5.1 SSG 初期データ読み込み（最新14グループ制限: `INITIAL_SSG_GROUPS_LIMIT = 14`）
  - [x] 5.2 Server Component の AdSense 非掲載境界とメタデータ維持
  - [x] 5.3 `<AiNewsFeedClient initialGroups={initialGroups} />` へのデータ引き渡し
- [x] 6. ドキュメント更新 (4ファイル)
  - [x] 6.1 `docs/operations/deployment.md` のAIニュース反映方式更新
  - [x] 6.2 `README.md` の運用記述更新
  - [x] 6.3 `AGENTS.md` のAIニュース自動更新に関する記述更新
  - [x] 6.4 `GEMINI.md` のAIニュース記述更新
- [x] 7. ビルド・静的解析・CI検証
  - [x] 7.1 `npm run lint` (合格)
  - [x] 7.2 `npm run test:ai-news` (合格: 6/6 pass)
  - [x] 7.3 `npm run build` (合格)
- [x] 8. PR作成およびCI結果確認
  - [x] 8.1 リモートブランチへの push (`feature/issue-415-ai-news-client-fetch`)
  - [x] 8.2 PR 作成 ([#42](https://github.com/kumakit/bearworks-portal/pull/42))
  - [x] 8.3 GitHub Actions `Workers build` のパス確認 (合格: 1m44s)
  - [x] 8.4 完了報告と本番公開承認ゲートの提示
