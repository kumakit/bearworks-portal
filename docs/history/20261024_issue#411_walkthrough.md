# Issue #411 Workersビルド用npm依存の脆弱性対応（ローカル実装・検証）

Issue #410 のPR #35〜#37のCIで検出された full audit 4件（high 1 / moderate 3）を調査した。原因は `wrangler@4.148.0 → miniflare@5.20261006.0-alpha` が固定指定する開発用間接依存 `undici@7.29.1` の3勧告（GHSA-xjj6-f33q-929c、GHSA-4qv8-2p9j-2685、GHSA-f72v-6w45-q472）であり、production監査は0件。今回の対象は開発依存だが、production監査だけで本番Workers配信物の内容を直接確認したわけではないため、配信物への収録有無は断定しない。

npmが提示する `wrangler@4.35.0` / `@opennextjs/cloudflare@1.8.4` へのダウングレードは Next 16.4.3 と非互換であり、上流最新 `wrangler@4.152.0` でも `miniflare` が `undici@7.29.1` を固定しているため、`package.json` の `overrides` で `miniflare` 配下の `undici` を同7系の公式修正版 `7.30.1` へ限定overrideした。

`origin/main` から分離した専用作業ツリー `.wrangler/issue411-undici-audit`（`codex/issue-411-undici-audit`）にて、`npm ci`、production/full監査0件、監査ゲート20テスト、Cloudflare 35テスト、Lint、Next/OpenNext build、production/staging dry-run、Workers preview（例題・ガイド・雨/秋記事・広告/404/API境界・18並列要求）の通過を確認した。詳細と証拠は `docs/task/issue-411/walkthrough.md` および `docs/task/issue-411/evidence/` に記録した。
