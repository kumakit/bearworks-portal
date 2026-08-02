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
- [ ] production切替前にNext.js同梱PostCSS/Sharpのhigh 3件を再評価

## GitHub / Linux CI

- [ ] push前にユーザーの明示承認を得る
- [ ] feature branchをpush
- [ ] main向けPRを作成
- [ ] Linux workflowを実行
- [ ] dynamic guide/problemが200
- [ ] route、404、AdSense、API smokeが成功
- [ ] Actions logと結果を記録

## Workers staging

- [x] staging方式を `env.staging` / `bearworks-portal-staging` / `staging.bearworks.uk` に確定
- [ ] hostname全体のAccess ApplicationをCloudflare上で確認
- [ ] Access policyを先に設定
- [ ] staging Worker/environmentとsecretを設定
- [ ] staging custom domain、DNS、証明書、routeを確認
- [ ] staging公開QAとlog非露出確認

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

- [ ] walkthroughへLuna担当、検証、未検証事項を記録
- [ ] Issue #344へ結果をコメント
- [ ] Phase 3-0の完了条件を満たした場合のみ完了扱いにする
