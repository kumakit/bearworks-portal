# Issue登録文案（登録済み）

登録結果：[Issue #17](https://github.com/kumakit/bearworks-portal/issues/17)。以下は初回登録時点の文案。第1段階公開後の進捗はIssue本文と `release-result.md` に反映。

登録先：公開リポジトリ `kumakit/bearworks-portal`。重複するopen Issueはconnector検索で返されなかった。成熟度：3段階の実装計画作成済み、第1段階のみローカル検証完了。Issue番号は未確定。以下を同じIssueで追跡し、段階ごとに再登録しない。

タイトル：依存関係の既知の警告を段階的に解消する

---

本番用依存の監査3件、開発・ビルド用を含む監査19件を段階的に解消する。本番用更新を先行し、公開ツール、修正版のないbraces関連を別段階で扱う。警告件数のみを減らすforce更新・Lint無効化は行わない。

- [x] 現状監査・公式修正版・依存経路を調査し、3段階の計画を作成
- [x] 第1段階：Next/Lint 16.3.8、sharp 0.35.5、baseline 2.11.27へ更新
- [x] 第1段階：本番用監査0、全体17、ローカルLint/build/画面/route/dry-run合格
- [x] production監査ゲート、全体監査保存、Linux native sharp確認をCIに追加
- [ ] 第1段階：同一SHAでUbuntu/Node 22 Workers CI合格
- [ ] 第1段階：merge・本番deploy・公開後確認
- [ ] 第2段階：Wrangler/esbuild等の修正可能な開発用警告を解消
- [ ] 第2段階：残件限定と新規警告のCI判定を追加
- [ ] 第3段階：bracesの上流修正版/互換代替、CSS移行とブラウザー方針を確定
- [ ] 本番用・全体監査0、例外なし、Linux CI・本番確認を完了

受入条件：production監査0を維持し、既存記事・例題・ガイド・広告・認証・API・画像に回帰がないこと。全警告の解消は両監査0、例外なし、必要な本番確認まで。修正版のない依存の期限付き例外は全体完了と扱わない。

非目標：記事本文・固定集計、React世代、Next major/minor、Route/DNS/Access/secret、新規インフラの変更。

未確認：同一SHAのLinux Workers実動作、本番反映後の確認、CSS移行のブラウザー要件、braces代替の実用性。登録時点では本番未反映。

計画・証拠：`docs/task/dependency-security-update/implementation_plan.md`、`phase-1-walkthrough.md`、`evidence/phase-1/`。状態は進行中とし、残件を同じIssueに引き継ぐ。
