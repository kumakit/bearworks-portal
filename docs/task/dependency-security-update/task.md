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
- [ ] 第1段階：同一SHAのUbuntu/Node 22 Workers CI
- [ ] Issue登録（文案保存済み、3段階を同じIssueで追跡）
- [ ] 承認済み範囲で第1段階をpush/PR/merge/公開・実URL確認
- [ ] 第2段階：公開ツール・修正可能な開発用依存を更新・検証
- [ ] 第3段階：braces修正版/代替とCSS移行案を確定
- [ ] 第3段階：ブラウザー要件・移行差分の受入を確認
- [ ] 全体監査0、例外なし、Linux CI・公開後確認

第1段階のローカル更新・検証は完了。production監査3→0、全体監査19→17。本番未反映。Linux CI・push・Issue/PR登録・merge・deployは未実施。詳細は `phase-1-walkthrough.md`。第2段階は第1段階の受入・反映後に進める。
