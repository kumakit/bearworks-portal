# Issue #397 PR・Linux CI確認

更新日: 2026-10-08（JST）。ユーザー承認により限定commit・push・ドラフトPR作成、依存最小更新・再CIを実施。merge・配備・設定変更・Issue更新は未実施。

## ブランチと変更範囲

- 両repo: `codex/issue-397-cloudflare-collection`。
- 最新参照を取得し、対象commitのみをmainへrebase。既存Issue389ブランチを保持し、無関係な履歴をPRへ含めていない。
- [Apps PR #14](https://github.com/kumakit/bearworks-apps/pull/14): 収集・Digest・fixture・対象CI。
- [Portal PR #20](https://github.com/kumakit/bearworks-portal/pull/20): 表示・API・fixture・設計とレビュー記録・既存CIへの契約テスト追加。

## 初回実行

| 対象 | head SHA | 実行 | 結果 |
| --- | --- | --- | --- |
| Apps Dashboard tests | f3f4f51e789a5fb4f23208eaa4d713a63df93b73 | [37640136951](https://github.com/kumakit/bearworks-apps/actions/runs/37640136951) | Ubuntu/Python3.12.14、137 PASS |
| Apps Validate Streamlit | 同上 | [37640136806](https://github.com/kumakit/bearworks-apps/actions/runs/37640136806) | Digest PASS。気候テストのworkflow一覧検査FAIL |
| Portal Workers build | 9db3b90c0ac48cd09780860653c6a1853ec9637d | [37640147515](https://github.com/kumakit/bearworks-portal/actions/runs/37640147515) | production依存監査FAIL。契約テスト・build・dry-run・previewは未実施 |

PR CIはheadとmainの合成commitをcheckoutする。Portalの初回合成SHAは48f5e5784abc1982fdb5dd63671a70f5b93555f4。

## 発見と対応

1. Portalをrebaseした際、WindowsのCRLF変換でfixtureのbyte hash検査が失敗した。`.gitattributes`へ対象JSONの`text eol=lf`を追加し、内容・期待ハッシュを変えず18テストPASS。9db3b90にcommitしpush済み。
2. Appsの既存安全性テストはすべてのworkflowを明示的な一覧へ登録する。追加した`dashboard-tests.yml`が未登録だったため失敗した。一覧のみを追加し、既存SSH・秘密値の検査を保持。240df461f9f1a07553cf3c387c6a17ce33be93c4にcommitしpush、[再CI 37640625108](https://github.com/kumakit/bearworks-apps/actions/runs/37640625108)のDigestとStreamlitの全jobがPASS。[Dashboard再CI 37640625061](https://github.com/kumakit/bearworks-apps/actions/runs/37640625061)もPASS。ローカルの当該単独検査はPyYAMLがないため実行できず、Linux CIを根拠とする。
3. 初回Portalのpackage-lock.jsonはmainと同一。production監査でsource-map-jsのhigh 1件、全体でcritical 1/high 12/moderate 2を確認。既存braces例外7件以外の依存更新をユーザーが追加承認。4依存の修正版を固定し再CIを実施した。例外は変更していない。詳細は[依存更新記録](dependency-update.md)。

## 依存更新後のPortal Linux受入れ

- 実装head: `3a1f246040c22840410367c3a5c39cc27e963b56`。
- 実行: [Workers build 37642130747](https://github.com/kumakit/bearworks-portal/actions/runs/37642130747)、全job/step PASS。
- production監査0件、full auditは期限付きの従来7例外だけに一致。警告の解決を意味しない。
- Linux native sharp 0.35.5、公開bundle、lint、Cloudflare契約18テスト、Next標準build/型検査、Workers build、default/staging dry-run、Workers previewすべてPASS。
- previewで既存route・広告境界・API認証401/no-store・POST405と18回の並行リクエストを確認。本番へのアクセスや配備はしていない。
- この成功後に追加する変更は検証結果の文書記録のみ。受入根拠は上記実装headのCIとし、文書commitのCIと混同しない。

## 受入判断

Appsは最新headの対象Linuxテストと既存CI全jobが成功。Portalも依存更新後の実装headでLinux受入れが成功。両repoの自動検証を完了とする。本番運用値・実データ確認、merge・配備・設定変更は別工程で未実施。

Lunaは読み取り専用でCI安全性と一覧修正を照合。CIの合否は司令塔がGitHubのjob/stepを確認して判断した。依存例外は変更していない。
