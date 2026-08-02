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
- [/] ユーザーが手動計画レビューを実行
- [ ] レビュー結果をhistoryへ保存
- [ ] 指摘の採否を決定し計画へ反映

## main同期

- [ ] remote mainの最新HEADを再確認
- [ ] `origin/main` を通常merge
- [ ] `data/news-data.json` の構文、重複、記事スキーマを確認
- [ ] `/ai-news` の最新日付と表示回帰を確認

## ローカル検証

- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm run cf:build`
- [ ] `npx wrangler deploy --dry-run`
- [ ] `git diff --check`
- [ ] secret、生成物、想定外変更の非混入
- [ ] AdSense境界とdashboard API failure pathの再確認

## GitHub / Linux CI

- [ ] push前にユーザーの明示承認を得る
- [ ] feature branchをpush
- [ ] main向けPRを作成
- [ ] Linux workflowを実行
- [ ] dynamic guide/problemが200
- [ ] route、404、AdSense、API smokeが成功
- [ ] Actions logと結果を記録

## Workers staging

- [ ] staging方式を手動レビューで確定
- [ ] Access policyを先に設定
- [ ] staging Worker/environmentとsecretを設定
- [ ] staging custom domain、DNS、証明書、routeを確認
- [ ] staging公開QAとlog非露出確認

## Production cutover

- [ ] cutover前のPages正常状態を記録
- [ ] production Worker version、secret、Access、routeを再確認
- [ ] rollback操作と判断基準を再確認
- [ ] ユーザーの本番切替承認を得る
- [ ] Workers custom domain/routeを有効化
- [ ] 公開route、API、AdSense、metadata、robots、sitemapを検証
- [ ] 観測期間を完了
- [ ] 別途承認後にPagesを停止

## 完了報告

- [ ] walkthroughへLuna担当、検証、未検証事項を記録
- [ ] Issue #344へ結果をコメント
- [ ] Phase 3-0の完了条件を満たした場合のみ完了扱いにする
