# Issue #377 トラックA 第1バッチ

- [x] 添付指示・手動レビュー・最新Issue・既存設計・作業状態の確認
- [x] 最新origin/mainから指定ブランチ作成
- [x] Lunaによる8観点の品質棚卸し
- [x] 追加5問とバッチ専用provenance実装
- [x] 独立計算検証と誤答経路確認
- [x] lint / Next.js build
- [x] OpenNext build / Wrangler dry-run（Windows）
- [x] 新規5ページ・sitemap27URL・広告境界の確認（Next.js）
- [x] 問7の人数表のdesktop/mobile表示確認
- [x] 差分レビュー・walkthrough作成
- [x] ユーザーによる次工程（commit・push・PR・Linux CI）への進行承認（2026-09-04）
- [x] 対象差分だけをcommit・pushし、draft PR #8を作成（実装commit c1ea7c5）
- [x] Linux clean-checkout CIでWorkers実配信の確認（run 33852993690、全ステップ成功）
- [ ] 最終公開内容の承認と公開日の確定、merge・本番デプロイ（別ゲート）

トラックBの既存計画は別成果物。未追跡の統合計画を今回のcommitへ含めない。

結果: `docs/history/20260904_issue#377_walkthrough.md`。実装とLinux Workers技術検証は完了。最終公開内容・merge・本番デプロイは別ゲート。

PR: https://github.com/kumakit/bearworks-portal/pull/8
Linux CI: https://github.com/kumakit/bearworks-portal/actions/runs/33852993690
