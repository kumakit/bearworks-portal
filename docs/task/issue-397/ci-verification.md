# Issue #397 PR・Linux CI確認

更新日: 2026-10-07（JST）。ユーザー承認により限定commit・push・ドラフトPR作成を実施。merge・配備・設定変更・Issue更新は未実施。

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
3. Portalのpackage-lock.jsonはmainと同一。読取専用のproduction監査でsource-map-jsのhigh 1件を確認。全体監査はcritical 1/high 12/moderate 2。既存braces例外7件に加えて新しい指摘がある。依存の最小更新を#397へ含めるかユーザー確認中であり、依存変更・例外変更は行っていない。

## 受入判断

Appsは最新headの対象Linuxテストと既存CI全jobが成功。Portalは依存監査で止まっておりWorkersの受入れは未完了。監査基準を緩めず、依存更新の範囲を確定してから再検証する。本番運用値・実データ確認はLinux受入れ後の別工程。

Lunaは読み取り専用でCI安全性と一覧修正を照合。CIの合否は司令塔がGitHubのjob/stepを確認して判断した。依存例外は変更していない。
