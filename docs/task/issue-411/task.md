# Issue #411 作業チェックリスト

- [x] `origin/main` から分離した専用branch/worktreeを確認する。
- [x] GitHub Advisoryの影響範囲と修正版 `undici@7.30.1` を確認する。
- [x] `miniflare` 配下だけに限定したoverrideとlockfile更新を確認する。
- [x] 保存済みローカル検証と証拠ログを確認する。
- [x] Lunaの読み取り専用差分レビューを完了する。
- [x] 検証範囲を超えた本番バンドル・到達可能性の断定を修正する。
- [x] 変更をcommitして専用branchをpushし、`main` 向け独立PR #38を作成する。
- [x] GitHub Actions run 89（Ubuntu / Node 22）の必須jobがすべて通過したことを確認する。
- [ ] マージ後、Issue #410 のPR #35〜#37へ更新済み`main`を取り込み、CIを再評価する。
