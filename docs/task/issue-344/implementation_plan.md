# Issue #344 Workers/OpenNext 本番移行計画

## 目的

Phase 3-0で実装済みのAdSense掲載範囲分離とCloudflare Workers/OpenNext構成を、既存Cloudflare Pagesの公開を維持したまま検証し、明示的な切替・受け入れ・rollback手順を経て `bearworks.uk` へ反映する。

## 現在地

- Issue: `kumakit/mission-control#344`（open、`Status: In Progress`）
- 対象repo: `C:\Users\kumat\dev\bearworks-portal`
- 対象branch: `codex/issue-344-phase3-ads-scope`
- feature HEAD: `a8c376d1e880af1e80c3c213b7558d4fd377e8cd`
- `origin/main`: `cbbc77a0c99457c13350b47793782e160c3f269b`
- 分岐点: `2f3831315f05d25baf6b25c52567b4093a25a559`
- feature作成後のmain変更: `data/news-data.json` のAIニュース更新5件のみ
- feature branchはpush済み。PR、Linux CI、Workers deploy、custom domain切替は未実施
- 公開 `bearworks.uk` は従来のCloudflare Pages版を継続配信中

既存の実装計画とローカルQAは次を参照する。

- `docs/task/implementation_plan.md`
- `docs/task/task.md`
- `docs/history/20260728_issue#344_step3-0_workers_walkthrough.md`
- `docs/history/20260728_issue#344_step3-0_workers_implementation_review.md`

## 非目標

- 手動計画レビュー完了前のbranch同期、push、PR作成、workflow実行
- Linux CI成功前のWorkers deploy
- Access適用前の公開Worker endpoint作成
- 同一操作でのPages停止とWorkers切替
- Pages projectの即時削除
- AdSense再審査申請
- Phase 3-1以降の一次情報コンテンツ実装

## 安全境界

1. `main`同期は履歴を書き換えない通常mergeとし、rebase/force pushを使わない。
2. push前にユーザーの明示承認を得る。
3. PRはLinux CIを起動するために作成し、CI成功だけでmerge・deployしない。
4. `workers_dev: false` と `preview_urls: false` を維持し、Access対象外の入口を作らない。
5. `DASHBOARD_API_TOKEN` はWorker secretとして扱い、tracked file、PR、Issue、ログへ実値を出さない。
6. AdSense publisher IDはbuild-timeの公開値であり、secretと混同しない。
7. Pagesをrollback先として維持し、Workers公開QAと観測期間が完了するまで停止・削除しない。
8. custom domain、DNS、Access、deployは各操作の対象とrollbackを確認してから実行する。

## 実行計画

### Gate 0: 手動計画レビュー

`plan-review-request.md` をSonnetまたはGemini Proへ渡し、次を確定する。

- Workers staging入口の作り方
- Cloudflare Accessを適用する順序と対象hostname/path
- Worker secretの登録・更新・rollback方法
- custom domain routeと既存Pagesの競合回避
- DNS、証明書、TTL、route優先順位
- Pagesへ戻す具体的操作
- 公開QA、観測時間、rollback判断基準

レビュー結果を `docs/history/YYYYMMDD_issue#344_plan_review.md` に記録し、指摘を反映するまでGate 1へ進まない。

### Gate 1: 最新mainの取り込み

1. remote `main` のHEADを再取得・確認する。
2. 対象branch上で `origin/main` を通常mergeする。
3. 競合がないこと、変更が期待したAIニュースJSONとmerge commitだけであることを確認する。
4. `data/news-data.json` のJSON構文、日付重複、記事スキーマを検証する。
5. `/ai-news` の最新日付と表示回帰を確認する。

### Gate 2: ローカル再検証

- clean install: `npm ci`
- Next.js build: `npm run build`
- Workers build: `npm run cf:build`
- bundle validation: `npx wrangler deploy --dry-run`
- `git diff --check`
- secret・生成物・想定外ファイルの非混入
- AdSense対象/非対象/404境界
- dashboard APIの500/401/405/no-store/秘密値非露出

Windows OpenNext previewのdynamic slug 404は既知の環境差であり、Linux CIを最終判定とする。

### Gate 3: branch更新とPR

1. 検証済みmerge commitの内容を確認する。
2. ユーザーの明示承認後にfeature branchをpushする。
3. `main`向けPRを作成してLinux workflowを起動する。
4. PRはCI検証用とし、Workers本番切替準備が完了するまでmergeしない。

### Gate 4: Linux CI

`.github/workflows/workers-build.yml` で次を確認する。

- Node.js 22 / `npm ci`
- Next.js build / OpenNext build / Wrangler dry-run
- 有効なguide/problem slugが200
- 不存在routeが404
- `/` と `/toukei/**` のみAdSenseあり
- `/about` と404にAdSenseなし
- dashboard APIがAccess headerなし401、非GET 405、no-store、token非露出

失敗時はmerge・deployへ進まず、Actions logと `/tmp/workers-preview.log` を確認してbranch上で修正する。

### Gate 5: Workers staging

手動レビューで承認された方式に従い、Accessで保護したstaging hostnameを使用する。候補は専用の `staging` environment / Worker名 / custom domainであり、production root routeはまだ設定しない。

- staging用Workerとproduction用Worker/環境を混同しない
- staging用secretを登録する
- Access policyを先に有効化する
- route・DNS・証明書を確認する
- 主要route、dynamic slug、404、AdSense境界、API正常/失敗、metadata、robots、sitemapを実環境で確認する
- Worker logにtoken、JWT、upstream bodyがないことを確認する

### Gate 6: production cutover

1. 現行PagesのURL、設定、直前正常応答を記録する。
2. production Worker version、secret、Access policy、route候補を再確認する。
3. rollback担当操作と判断基準を再確認する。
4. `bearworks.uk` のWorkers route/custom domainを有効化する。
5. HTTPS、主要route、dynamic slug、404、AdSense境界、API、metadata、robots、sitemapを即時検証する。
6. 重大失敗時はWorkers routeを解除しPagesへ戻す。
7. 観測期間中はPagesを維持する。

### Gate 7: 安定確認とPages停止

観測時間、error率、Access、API、広告境界、主要routeに問題がないことを確認してから、別途承認を得てPagesを停止する。Pages project削除はさらに後段とし、即時には行わない。

## Rollback条件

次のいずれかを検出した場合は切替を中止またはPagesへ戻す。

- root/主要route/dynamic slugの5xxまたは意図しない404
- Cloudflare Accessの迂回またはdashboardデータ露出
- dashboard API secret、JWT、upstream bodyの漏出
- AdSenseが非対象routeまたは404へ出力される
- canonical、robots/noindex、sitemap、ads.txtの重大回帰
- Worker bundle/runtime errorの継続
- route/DNS/証明書の不整合

## 完了条件

- main同期後のローカル検証が成功
- Linux CIが成功
- 手動計画レビューの重大指摘が解消
- stagingでWorkers runtimeの受け入れ成功
- Access、secret、custom domain、DNS、rollbackが実測確認済み
- production公開QAと観測が成功
- Phase 3-0結果をIssueへ記録
