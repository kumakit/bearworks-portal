# Issue #344 Phase 3-0 Workers/OpenNext移行タスク

## 計画

- [x] Issue #344の最新body・comments・state・labels・assignees・milestone・更新日時・URLを確認する
- [x] target/control repoのGit root・branch・HEAD・dirty状態を確認する
- [x] OpenNext・Cloudflare・npmの現行互換要件を確認する
- [x] LM Studio Gemmaのgit-statusを起動する（`uv` cache初期化失敗のためモデル未到達、直接Gitへフォールバック）
- [x] Antigravity計画レビューを起動する（`agy models` が空のためモデル未到達）
- [x] 読み取り専用CodexレビューのP1/P2を計画へ反映する

## 実装

- [ ] Next.js / eslint-config-nextを15.5.21へ更新する
- [ ] `@cloudflare/next-on-pages` を削除する
- [ ] `@opennextjs/cloudflare@1.20.2` と `wrangler@4.114.0` を導入する
- [ ] `next.config.mjs` をOpenNext開発初期化へ変更する
- [ ] `open-next.config.ts` と `wrangler.jsonc` を追加する
- [ ] Workers用npm scriptsを追加し、`pages:build` を削除する
- [ ] `export const runtime = "edge"` をすべて削除する
- [ ] `.open-next`、`.dev.vars`、生成型のignoreとexample envを追加する
- [ ] `public/_headers` を追加する
- [ ] 2つのdynamic slug page/metadataをNext.js 15のPromise paramsへ適合する
- [ ] dashboard upstream fetchにtimeoutを追加する
- [ ] Linux clean checkout用のbuild-only workflowを追加する
- [ ] READMEをWorkers/OpenNext運用へ更新する

## 受け入れ条件

- [ ] `npm run build` が成功する
- [ ] `npm run cf:build` が成功する
- [ ] Worker bundleのdry-runと圧縮後サイズ確認が成功する
- [ ] Workers previewで公開route・404・metadata・ads.txt・sitemap・robotsが正常
- [ ] `/api/dashboard-data` のtoken/Access/upstream/timeout/非GET失敗系がfail-closedする
- [ ] API response/logにtoken・Access header・upstream bodyが漏れない
- [ ] 広告対象だけにAdSense情報があり、非対象と404にはない
- [ ] 最終ブラウザ遷移・Network・console確認が成功する
- [ ] `next-on-pages` とEdge Runtime指定が残っていない
- [ ] 実装後レビューの重大指摘が解消される
- [ ] Linux clean checkoutで通常build、Workers build、dry-run、preview QAが成功する

## 外部変更境界

- [ ] Cloudflare deploy/uploadはユーザーの別途承認後にのみ実行する
- [ ] custom domain切替前にPagesとの競合回避・rollback手順を作る
- [ ] pushとIssue更新はユーザーの明示承認後にのみ実行する
