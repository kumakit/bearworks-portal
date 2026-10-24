# Issue #411：Workersビルド用npm依存の脆弱性4件の調査・ローカル対応（2026-10-24）

## 1. 調査結果（Advisory・導入経路・到達可能性）

- **基準ブランチ**: `origin/main`（`1396c14171d9206d09277741896d7c35a6d17b37`）
- **専用作業ツリー**: `C:/Users/kumat/dev/bearworks-portal/.wrangler/issue411-undici-audit`（ブランチ `codex/issue-411-undici-audit`）
  - 親作業ツリー（`codex/issue-408-radar-feasibility`）および Issue #410 の作業ツリー（`codex/issue-410-*`）には一切変更を加えていない。
- **Production監査 (`npm audit --omit=dev`)**: 更新前後とも **0件**。今回の該当パッケージは開発依存としてlockfileに記録されている。production監査の結果だけでWorkers配信物の内容を直接検査したものではないため、本番バンドルへの収録有無はこの記録では断定しない。
- **Full監査 (`npm audit`)**: 更新前は **4件（high 1 / moderate 3）**。
  - 直接の原因パッケージは `node_modules/miniflare/node_modules/undici@7.29.1`（high）の1箇所のみ。
  - 残り3件（`miniflare@5.20261006.0-alpha` → `wrangler@4.148.0` → `@opennextjs/cloudflare@1.20.13`）はすべて `undici@7.29.1` の連鎖報告（`via`）。
  - トップレベルの `node_modules/undici` は6系の公式修正版 `6.29.1` が解決済みであり対象外。

### 各Advisoryの内容と到達可能性

| Advisory / CVE | 深刻度 | 7系影響範囲 | 修正版 | 内容と到達可能性 |
| --- | --- | --- | --- | --- |
| [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) (`CVE-2026-109869`) | High (7.5) | `>=7.18.0 <7.30.1` | `7.30.1` | 5つを超える `Content-Encoding` を返すサーバーがボディ送信前に切断した際、内部ストリームの未処理エラーでNodeプロセスが終了するDoS。対象は開発依存の `miniflare` 配下。実際の到達可能性はこの変更と保存済みテストだけでは網羅評価していない。 |
| [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) (`CVE-2026-109924`) | Moderate (5.9) | `>=7.0.0 <7.30.1` | `7.30.1` | `EventSource` パーサーが区切りなしの大量 `data:` フィールドや未完了行でメモリを無制限保持するDoS。対象は開発依存の `miniflare` 配下。未信頼サーバーに対する `EventSource` の実行有無はこの記録では確定していない。 |
| [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472) (`CVE-2026-109841`) | Moderate (5.9) | `>=7.15.0 <7.30.1` | `7.30.1` | `fetch()` のSRI (`integrity`) 検証で大文字混じりのアルゴリズムトークンがスキップされる問題。対象は開発依存の `miniflare` 配下。影響する形式の `integrity` を使う呼び出しの有無はこの記録では確定していない。 |

## 2. 採用した修正内容と互換性

- `npm audit` が提示する `fixAvailable`（`wrangler@4.35.0` / `@opennextjs/cloudflare@1.8.4`）は、`miniflare` が `undici` 7系を使用する前の古い版への破壊的ダウングレードであり、Next.js `16.4.3`（`preview-props.json` 対応等）と非互換のため採用しない。
- npm registry 上の最新 `wrangler@4.152.0`（`miniflare@5.20261019.2-beta`）でも、`miniflare` が `"undici": "7.29.1"` を固定指定しているため、`wrangler` の更新だけでは解消しない。
- `package.json` の `overrides` に `miniflare` 配下の `undici` 限定override（`"miniflare": { "undici": "7.30.1" }`）を追加し、同7系の公式修正版 `7.30.1` を解決した。
- `package-lock.json` ではoverride後の依存経路を `miniflare` の依存指定とネストした `undici` の `version` / `resolved` / `integrity` に反映した。npm 10.9.9 が `npm ci` 時に整合と判定することをローカルのdry-runでも確認した。
- 上流 `miniflare` / `wrangler` が `undici >= 7.30.1` を通常解決するようになった段階でこの override を除去する。

## 3. ローカル検証結果

証拠フォルダー：`docs/task/issue-411/evidence/`（Node 24.14.1 / npm 11.11.0 / Windows）。Ubuntu・Node 22 の GitHub Actions CI の代替にはしない。

| 確認項目 | 結果 | 証拠ファイル |
| --- | --- | --- |
| 更新前 production / full 監査 | production 0件 / full 4件（high 1, moderate 3） | `audit-production-before.json`, `audit-full-before.json` |
| 更新後 production / full 監査 | 両方 **0件**（exit 0）、`check-dependency-audit.mjs` 合格 | `audit-production-after.json`, `audit-full-after.json` |
| `npm ci` / `npm ls --all` | exit 0、`miniflare` 配下 `undici@7.30.1` 解決確認 | `undici-compatibility.json` |
| npm 10.9.9 の `npm ci --dry-run` | exit 0、lockfile整合確認（Node 24 / Windows、audit・scripts無効） | `npm10-ci-dry-run.log` |
| 監査ゲート単体テスト | 20テスト成功 | `audit-gate-tests.log` |
| Cloudflare 収集・表示テスト | 35テスト成功 | `cloudflare-tests.log` |
| Lint (`npm run lint`) | exit 0（error 0、既存warning 3） | `lint.log` |
| 固定bundle検証・Next.js build | exit 0、全64ページ生成・型検査完了 | `next-build.log` |
| OpenNext Workers build (`npm run cf:build`) | exit 0 | `workers-build.log` |
| Wrangler dry-run（production / staging） | 両方 exit 0 | `production-dry-run.log`, `staging-dry-run.log` |
| Workers preview ルート・境界検証 | 例題30・ガイド8・雨/秋12ルート・24境界（広告/非広告/404/API 401・405・no-store・icon・immutable static asset・ads.txt/robots/sitemap）・18並列反復リクエストすべて PASS | `toukei-preview.log`, `rain-autumn-preview.log`, `preview-boundaries.json` |

## 4. 次のステップ（Codex 引き継ぎ事項）

1. [x] 専用作業ツリーの変更をcommit・pushし、`main` 向けのdraft PR #38を作成した。
2. [ ] GitHub Actions（Ubuntu / Node 22 `Workers build`）の必須job通過を確認する。初回runはnpm 10.9.9のlockfile整合エラーで失敗し、lockfileと依存参照を修正済み。
3. [ ] マージ後の `origin/main` を Issue #410 の各ブランチ（PR #35 `codex/issue-410-data`、PR #36 `codex/issue-410-article`、PR #37 `codex/issue-410-navigation`）へ取り込み、draft PR のCIを再評価する。
