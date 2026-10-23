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
- [x] 2026-10-18：上流修正版、production・全体監査、固定版・経路、開発用限定の条件を再評価
- [x] 第3段階の選択肢と両依存経路、CSS移行の判断条件を整理
- [x] 2026-10-24：braces勧告の公式撤回を確認し、期限付き例外を削除
- [x] 第3段階：Tailwind 3・CSS・対応ブラウザーを維持する方針を確定（撤回によりCSS移行不要）
- [x] 新規警告を修正：Next/Lint 16.4.3、Zod 4.6.7、body-parser 2.4.0
- [x] Next 16.4互換対応：OpenNext 1.20.13、Wrangler 4.148.0、限定glob 10.5.0修正版
- [x] production・全体監査0、例外なし、全severityの警告を拒否する監査ゲート
- [x] clean install、依存ツリー、監査20テスト、Cloudflare35テスト、Lint、Next/Workers build、両環境dry-run
- [x] ローカルWorkersで記事・例題・ガイド・広告/404/画像/API境界、反復並列リクエスト、代表画面操作
- [x] push承認・PR #33の実装内容更新
- [x] 同じ変更のUbuntu/Node 22 Workers CI（native sharp・preview含む）
- [x] merge・本番deploy・公開後確認
- [x] Issue #17の完了条件を実証し、close・追跡停止

第1〜3段階は本番公開・公開後確認まで完了。2026-10-23にbraces勧告が公式撤回され、10月24日の実装で新規警告も修正した。両監査0・期限付き例外なし、Linux CIと本番の必要な確認が合格し、Issue #17を完了としてcloseした。定期追跡はPAUSED。認証済み本番API成功応答は既存ログイン状態がなく未確認で、Linux previewのAPI拒否・no-storeと本番Access境界までを確認済みとする。最終記録は `phase-3-release-result.md`。以前の計画・ローカル検証・10月18日の調査は時点を区別して履歴として保持する。
