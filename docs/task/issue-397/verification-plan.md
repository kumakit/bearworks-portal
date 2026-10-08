# Issue #397 Linux受入れと運用確認の進め方

更新日: 2026-10-07（JST）。独立コードレビューは承認可能、P3は資料へ反映。限定commit・push・ドラフトPR作成とCI実行は承認を受け実施済み。結果は[CI確認記録](ci-verification.md)。本番操作は未実施。

## 1. Linuxの受入れ

ローカルのWSL一覧コマンドは失敗し、利用可能なLinux環境を確認できなかった。Dockerコマンドも見つからない。OS・セキュリティ・ネットワーク設定を変えず、既存GitHub CIで確認する。

| repo | 対象 | 受入条件 |
| --- | --- | --- |
| bearworks-apps | .github/workflows/dashboard-tests.yml | Linux/Python3.12、uv.lock、CF/Digest/GCPの対象テスト成功。秘密値・実APIを使わない |
| bearworks-portal | .github/workflows/workers-build.yml | 既存の依存監査、fixture・契約テスト、lint、Next build、Workers build、dry-run、previewと既存ルート・認証/no-store・非広告境界の成功 |

appsの新workflowとportalの既存workflowはPR/manual向け。pushだけを検証完了としない。appsの新workflowがdefault branchにない場合はmanual dispatchを前提にせず、PRで検証する。

対象差分を確認して新しいcodex/issue-397-*ブランチへ限定commit・pushし、CI検証用のドラフトPRを作成する方法を推奨する。先に両repoの最新参照・基点を取得し、既存issue-389等の無関係な差分をPRへ混ぜない。必要な基点への移し替えがあれば既存作業を保全し、対象テストと差分を再確認する。

### Git・CIに必要な承認

- 両repoの#397対象ファイルだけのcommit。
- 対象ブランチのpush。
- CI検証用ドラフトPRの作成と、それに伴うCIの実行。

これはmerge、配備、設定値の変更、Issue更新・closeの承認を含まない。結果はworkflow名・対象SHA・PASS/FAIL/未確認で記録し、credentialや生の例外を資料へ転記しない。

## 2. 反映前の運用値（R01/R02）

| 設定 | 決める根拠 | 未設定/不正の結果 |
| --- | --- | --- |
| CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS | 実際のcron間隔＋許容遅延。正整数、最大86400秒 | validUntil=null。portalでは期限未確認、Digestは当該CF値を利用せず固定error |
| DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS | 時刻同期状況・要求のRTT・許容する誤差 | 時刻同期を確認できず、portalの鮮度を取得正常としない |
| DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS | 再同期頻度と運用上許容する負荷・時刻変化 | 時刻の利用期限を設定できず、portalの鮮度を取得正常としない |

本番値を推測で設定しない。cron、時刻同期、実際の応答遅延を確認してから設定変更を別承認する。RTTが許容値を超えるとsyncClockはnullになり未確認とする。頻発した場合は遅延や時刻矛盾を調べ、必要なら許容値を根拠付きで見直す。未確認を消すためだけに値を大きくしない。

## 3. 本番反映と初回受入れ（Linux成功後の別段階）

1. 反映対象SHA、設定、読取側先行の順序、戻し方を確認する。
2. merge・配備・設定の変更をそれぞれ承認範囲内で実施する。
3. 実データとrunId・取得状態・期間・更新期限が同じ結果を表すことを確認する。
4. 2軸表示、失敗/期限切れ/未評価の表示、Digestの他監視保持、既存のAccess/no-store・非広告境界を確認する。
5. Pagesの対象・契約・月境界は確認できるまで利用枠未確認を維持する。
6. 初回の受入れを記録し、危険度判定等が残る#397を継続する。

本番確認はCLIで得られるものをCodexが先に行い、ログイン等が必要な場合だけ小さな手動操作を一つずつ引き継ぐ。秘密値を返答へ含めない。
