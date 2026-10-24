# Issue #411 実装計画

## 目的

Issue #410 のCIで検出された開発用依存 `miniflare` 配下の `undici@7.29.1` を、互換性を保ちながら修正版へ解決し、full audit の4件を解消する。

## 範囲

- `package.json` の `overrides` で `miniflare` 配下の `undici` だけを `7.30.1` に固定する。
- `package-lock.json` の対応するネスト依存だけを更新する。
- Advisory、依存経路、到達可能性の評価、証拠、検証結果を `docs/task/issue-411/` に記録する。

## 非目標

- 本番依存、Next.js、Wrangler、OpenNextのバージョン変更。
- Issue #410 の記事・データ・導線変更。
- このIssueだけを根拠とした実害または本番配信物への収録の断定。

## 検証

- ローカル検証の記録は `walkthrough.md` と `evidence/` を参照する。Windows / Node 24 の結果は Ubuntu / Node 22 CI の代替としない。
- PR のGitHub Actionsで full audit、型検査、テスト、lint、Next.js/Workers build、preview関連の必須jobを確認する。
- `undici` の上流依存が修正版へ移行したら、限定overrideを再評価して不要なら除去する。

## ロールバック

問題があれば本PRをrevertし、`package.json` と `package-lock.json` を一組で戻す。Issue #410 の各PRは独立して保ち、CI結果を再確認する。
