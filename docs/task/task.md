# Issue #344 Phase 3-0 Workers/OpenNext移行タスク

## 計画

- [x] Issue #344の最新body・comments・state・labels・assignees・milestone・更新日時・URLを確認する
- [x] target/control repoのGit root・branch・HEAD・dirty状態を確認する
- [x] OpenNext・Cloudflare・npmの現行互換要件を確認する
- [x] LM Studio Gemmaのgit-statusを起動する（`uv` cache初期化失敗のためモデル未到達、直接Gitへフォールバック）
- [x] Antigravity計画レビューを起動する（`agy models` が空のためモデル未到達）
- [x] 読み取り専用CodexレビューのP1/P2を計画へ反映する

## 実装

- [x] Next.js / eslint-config-nextを15.5.21へ更新する
- [x] `@cloudflare/next-on-pages` を削除する
- [x] `@opennextjs/cloudflare@1.20.2`、`wrangler@4.114.0`、`esbuild@0.27.7` を固定導入する
- [x] `next.config.mjs` をOpenNext開発初期化へ変更する
- [x] `open-next.config.ts` と `wrangler.jsonc` を追加する
- [x] `workers.dev` とversion preview URLを無効化する
- [x] Workers用npm scriptsを追加し、`pages:build` を削除する
- [x] `export const runtime = "edge"` をすべて削除する
- [x] `.open-next`、`.dev.vars`、生成型のignoreとexample envを追加する
- [x] `public/_headers` を追加する
- [x] 2つのdynamic slug page/metadataをNext.js 15のPromise paramsへ適合する
- [x] dashboard upstream fetchにtimeoutを追加する
- [x] Linux clean checkout用のbuild-only workflowとpreview smokeを追加する
- [x] READMEをWorkers/OpenNext運用へ更新する

## 受け入れ条件

- [x] `npm run build` が成功する
- [x] `npm run cf:build` が成功する
- [x] Worker bundleのdry-runと圧縮後サイズ確認が成功する
- [x] Windows Workers previewで公開route・404・metadata・ads.txt・sitemap・robotsを確認する（動的slugだけWindows固有404）
- [x] `/api/dashboard-data` のtoken/Access/upstream失敗/非GET失敗系がfail-closedする
- [x] API response/logにtoken・Access header・upstream bodyが漏れない
- [x] 広告対象だけにAdSense情報があり、非対象と404にはない
- [x] 最終ブラウザ遷移・DOM・console確認が成功する（localhost上の外部script通信成否は対象外）
- [x] `next-on-pages` とEdge Runtime指定が残っていない
- [x] 実装後レビューの重大指摘が解消される
- [ ] Linux clean checkoutで通常build、Workers build、dry-run、preview QAが成功する

## 外部変更境界

- [ ] Cloudflare deploy/uploadはユーザーの別途承認後にのみ実行する
- [ ] custom domain切替前にPagesとの競合回避・rollback手順を作る
- [ ] pushとIssue更新はユーザーの明示承認後にのみ実行する
