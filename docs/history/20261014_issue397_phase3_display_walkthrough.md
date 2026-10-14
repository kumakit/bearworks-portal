# Issue #397 Phase 3A 画面整理の作業記録

2026-10-14 JST。対象: bearworks-portal の `codex/issue-397-phase3-display`。最新 `origin/main` から作成。Apps、収集契約、API、Digest、Cloudflare 設定は変更していない。

## 変更

- Cloudflare の通常画面は既存の 24時間・7日・30日のアクセス推移と国別地図・一覧を中心にした。旧 WAF 詳細、危険度未実装、重複する24時間カード、Pages利用枠を主画面から撤去した。
- 「データについて」を初期状態が閉じた標準の開閉欄とし、利用しているアクセス項目と Digest で必須の Pages の取得状態を分けて表示した。取得失敗・期限切れ・デモ等は閉じた見出しでも「要確認」と分かる。
- 個別の失敗は既存の `assessBlock` の安全な説明を使う。API全体の失敗は既存の警告と値の非表示を保つ。期間・国別の値は既存の `CloudflareAccessView` に従い、ほかの期間や項目から補わない。
- 旧画面を前提としたテストを現在の要件へ更新し、推移と国別の独立失敗、Pages の失敗、期限切れを画面出力で確認した。

## レビューと検証

- ユーザーから Sonnet 5.5 の読み取り専用計画レビューを受領。[採否記録](20261014_issue397_phase3_display_review.md)に9件の判断と根拠を保存した。
- Luna は Portal の失敗・期限切れ表示、Apps Digest の必須集合を読み取り調査した。司令塔 Codex が同じコードを照合した。旧 WAF 5 項目は schema v2 の Digest 必須集合外、Pages は必須と確認した。本番の直近実行を再測定したものではない。
- `npm run test:cloudflare`: 31件成功。`npm run lint -- --quiet`: 成功。`npx tsc --noEmit`: 成功。`git diff --check`: 成功（改行コードの注意のみ）。
- `npm run build`: 通常環境では Google Fonts への接続失敗。接続可能な環境では Turbopack の CSS 処理で内部エラー。`npx next build --webpack`: 成功。Workers 固有の CI と変更後の認証済み本番画面は未確認。
- 127.0.0.1 限定の一時プロキシで合成 Phase 2 fixture を返し、ローカルの PC 幅と 390px 幅をブラウザー確認した。期間選択、推移、地図・国別一覧の縦並び、説明欄の初期閉状態・開閉、狭い画面での折り返しを確認した。実データをローカルへ取得していない。一時プロキシとサーバーは停止し、補助ファイルも削除した。

## 次の確認

開閉欄のフォーカス表示とキーボード操作を最終確認する。push 承認後の PR で Workers CI を確認する。マージ・本番配備と、その後の認証済み画面・定期収集・Digest は別々に判定する。
