# 依存関係更新の進捗

- [x] 公開時の依存評価、現在の設定・cleanな作業ツリーを確認
- [x] productionと全体の監査結果を取得・保存
- [x] 公式勧告、配布版、親依存・peer条件を確認
- [x] 3段階の計画、受入条件、公開・復旧手順を作成
- [x] 実装開始時の最新main・監査・配布版を確認
- [x] 第1段階：Next.js/Lint設定と本番用間接依存を更新
- [x] 第1段階：clean install、production監査0、依存差分レビュー
- [x] 第1段階：ローカルLint/build/ルート/画面操作、OpenNext build、両環境dry-run
- [x] CIにproduction監査、全体監査保存、Linux sharp確認を追加
- [x] 第1段階：同一内容のUbuntu/Node 22 Workers CI
- [x] Issue #17登録（3段階を同じIssueで追跡）
- [x] 承認済み範囲で第1段階をpush/PR #18/merge/公開・実URL確認
- [x] 第2段階：公開ツール・修正可能な開発用依存のローカル更新・検証
- [x] 第2段階：残る7件の期限付き例外、新規警告検査と17テストを追加
- [x] 第2段階：同一内容のLinux CI・merge・本番公開・公開後確認
- [ ] 第3段階：braces修正版/代替とCSS移行案を確定
- [ ] 第3段階：ブラウザー要件・移行差分の受入を確認
- [ ] 全体監査0、例外なし、Linux CI・公開後確認

第1・2段階は本番公開・公開後確認まで完了。全体監査は当初19→17→7、productionは3→0を維持。braces連鎖7件は未解消で、再評価期限2026-10-18 09:00 JST。Issue #17を進行中のまま保持する。第3段階のbraces/CSS判断と全警告解消が残る。詳細は `phase-2-release-result.md`。
