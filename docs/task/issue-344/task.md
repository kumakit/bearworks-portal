# Issue #344 Workers/OpenNext 本番移行タスク

## 再開確認

- [x] Issue #344の最新body、comments、state、labels、assignees、milestone、更新日時、URLを取得
- [x] Issueへ `Status: In Progress` を反映
- [x] 対象repoと司令塔repoのbranch、HEAD、dirty状態を確認
- [x] feature branchと最新mainの差分を確認
- [x] Lunaへmain同期・Linux CI・本番切替論点の読み取り専用監査を委譲
- [x] 司令塔側でLuna結果を再検証

## 手動計画レビュー

- [x] issue固有の本番移行計画を作成
- [x] Sonnet/Gemini Pro向け `plan-review-request.md` を作成
- [x] ユーザーが手動計画レビューを実行
- [x] レビュー結果をhistoryへ保存
- [x] 指摘の採否を決定し計画へ反映
- [x] dashboard APIの `NODE_ENV` 依存を廃止し全環境でAccess headerを必須化
- [x] `wrangler.jsonc` にAccess先行型の `env.staging` を定義
- [x] productionをWorkers Routeで切り替えるcutover/rollback runbookを作成
- [x] LunaへSonnet指摘とGate別修正時期の独立監査を委譲
- [x] Linux CIへstatic asset header、ads.txt内容、一時ファイルcleanupを反映

## main同期

- [x] remote mainの最新HEADを再確認（`cbbc77a0c99457c13350b47793782e160c3f269b`）
- [x] `origin/main` を通常merge（`f38da71`、競合なし）
- [x] `data/news-data.json` の構文、日付・URL重複、記事スキーマを確認
- [x] `/ai-news` の最新日 `2026-08-02` とHTTP 200を確認
- [x] production cutover前に `origin/main` の後続AIニュース6commit（latest `d26b232`）を通常merge（`2206e3a`、競合なし）
- [x] 再同期後のJSONを43日・546記事、最新日 `2026-08-08`、追加6日・60記事として検証
- [x] Next 16 Linux CI前に `origin/main` のAIニュース更新1commit（`1f40644`）を通常merge（`4b2dcd1`、競合なし）
- [x] 最新JSONを44日・556記事、最新日 `2026-08-09`、日付重複0として検証

## ローカル検証

- [x] `npm ci`
- [x] `npm run build`
- [x] `npm run cf:build`
- [x] `npx wrangler deploy --dry-run --env=""`
- [x] `npx wrangler deploy --dry-run --env staging`
- [x] `git diff --check`
- [x] secret、生成物、想定外変更の非混入
- [x] AdSense境界とdashboard API 401/405/no-storeの再確認
- [x] OpenNext previewでstatic assetのimmutable Cache-Controlを確認
- [x] `npm audit --omit=dev` を実行
- [x] production切替前に依存監査を再実行（high 4件: Nano ID、Next.js同梱PostCSS、Sharp）
- [x] Next.js 16.3.0へ更新し、Nano ID 3.3.18、PostCSS 8.5.23、Sharp 0.35.3へ解決
- [x] `npm audit --omit=dev` でproduction依存0件を確認
- [x] `next lint` をESLint 9 CLI / flat configへ移行し、既存内部linkを`next/link`へ修正
- [x] Next 16.3で `npm ci`、lint、Turbopack build、OpenNext build、production/staging dry-runを確認
- [x] Linux workflowへstaging dry-runと `/ai-news`・`/dashboard`・`/weather` の200/AdSense非掲載回帰を追加
- [ ] Next 16.3更新後のLinux clean-checkout CIを実行

## GitHub / Linux CI

- [x] push前にユーザーの明示承認を得る
- [x] feature branchをpush
- [x] main向けDraft PR #4を作成
- [x] Linux workflowを実行
- [x] OpenNext SSG cache未設定によるdynamic slug 404を修正
- [x] dynamic guide/problemの有効slugが2回とも200、無効slugが404
- [x] route、404、AdSense、API smokeが成功
- [x] Actions run `30752064048` の成功結果を記録
- [x] header iconの直接配信とIMAGES binding警告非発生をLinux CIで確認
- [x] Actions run `30859325094` の成功結果を記録
- [x] 最新HEAD `0d2560a` のActions run `30859487822` 成功を確認
- [x] main再同期後のHEAD `bc16db0` でLinux clean-checkout Actions run `31260322740` 成功を確認
- [x] CI結果記録後のdocs-only HEAD `3228cde` でActions run `31260451402` 成功を確認
- [ ] Next 16.3更新commitをpushし、明示的lint stepを含むLinux CIを確認

## Workers staging

- [x] staging方式を `env.staging` / `bearworks-portal-staging` / `staging.bearworks.uk` に確定
- [x] hostname全体のAccess ApplicationをCloudflare上で確認
- [x] Access policyを先に設定
- [x] staging Worker/environmentとsecretを設定
- [x] staging custom domain、DNS、証明書、routeを確認
- [x] 初回staging公開QAとlog非露出確認（Worker errors 0、secret/JWT/upstream本文なし）
- [x] `env.IMAGES binding is not defined` の原因をheader iconの最適化経路と特定
- [x] 課金bindingを増やさずiconを `unoptimized` 化しLinux CI回帰検査を追加
- [x] 修正版をstagingへ再deploy（version `bc471f8f-69e5-4564-9907-bb49c8be52d1`）
- [x] rootが直接 `/icon.png` を参照し、`/_next/image` が0件であることを認証済みブラウザで確認
- [x] 公開route、dynamic slug、404、AdSense掲載・非掲載境界を認証済みstagingで確認
- [x] dashboardと `/api/dashboard-data` の正常200を確認
- [x] 新versionのWorker logでIMAGES warning、exception、non-ok、5xx、秘密値露出が0件
- [x] Access JWTがlogでREDACTED、未認証アクセスが302であることを確認

## Production cutover

- [ ] cutover前のPages正常状態を記録
- [ ] production Worker version、secret、Access、routeを再確認
- [x] rollback操作と判断基準をrunbookへ書面化
- [ ] cutover直前にrollback操作者と判断基準を再確認
- [ ] ユーザーの本番切替承認を得る
- [ ] Workers custom domain/routeを有効化
- [ ] 公開route、API、AdSense、metadata、robots、sitemapを検証
- [ ] 観測期間を完了
- [ ] 別途承認後にPagesを停止

## 完了報告

- [x] walkthroughへLuna担当、検証、未検証事項を記録
- [ ] Issue #344へ結果をコメント
- [ ] Phase 3-0の完了条件を満たした場合のみ完了扱いにする
