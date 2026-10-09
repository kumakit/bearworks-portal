# Issue #397 工程・受入条件

更新日: 2026-10-09（JST）

## 現在の反映状況（2026-10-08追補）

- Portal PR #20 / Apps PR #14: merge済み。両方のmain CI成功。
- Portal: 本番配備済み。取得状態と危険度の2軸表示、APIのAccess/no-store境界、時計設定5秒/30秒を確認。
- Apps: 承認された5実行ファイルを本番へ反映。収集期限4200秒を設定。checkout全体のpull/resetはせず、既存変更は保全。
- 初回cron: traffic24hは`LIVE/OK/FULL`。WAF系5項目が`ACCESS_DENIED`、Pages当月件数が`UPSTREAM_ERROR`で`ERROR/UNKNOWN`。Portalは6/7項目を判定不能と表示し、取得正常に見せていない。
- Digest timerは02:13:47 UTCに起動し、02:13:55 UTCに`Result=success`で終了。公開状態は`partial`、last_successあり、Cloudflare未取得フラグと固定案内あり、Pages値はnull。継続運転は次回以降も観測が必要。
- 10:00 UTCのcronと10:29 UTCのDigestまで継続を確認。Digestは`partial`・`stale=false`・Cloudflare未取得案内を維持。
- Pagesの失敗原因は一覧APIへの`per_page=100`（HTTP 400）。件数10へ修正したAppsの[PR #15](https://github.com/kumakit/bearworks-apps/pull/15)をmergeし、本番collectorの1ファイルだけを退避・ハッシュ照合後に差し替えた。手動収集1回ではPagesとtrafficが`LIVE/OK/FULL`、WAF系5項目が`ERROR/ACCESS_DENIED`。Pages利用枠・危険度は未評価。WAFの権限・データセット提供範囲は未確定。
- Portal [PR #22](https://github.com/kumakit/bearworks-portal/pull/22)のmerge後、GitHub Pagesのビルド・公開ジョブは成功。Portal Workersの追加配備はなし。
- Pages修正後の14:00 UTC定期cronはログ上の出力成功と公開JSON更新を確認。Pages/trafficの`LIVE/OK/FULL`、WAF系5項目の`ERROR/ACCESS_DENIED`、共通runIdと利用枠未評価を再確認した。次のDigestと認証済みUIは未確認。
- 続く2026-10-08 14:38 UTCと2026-10-09 12:36 UTCのDigest timerは成功し、公開JSONの生成・最終成功時刻が更新。2026-10-09 13:00 UTCの収集出力もPages/trafficが`OK`、WAF系5項目が`ERROR/ACCESS_DENIED`、共通runIdで更新。本人ログイン後の本番画面は「一部未取得 5/7」と表示し、WAF数値を補完しない。詳細は[継続確認](operational-readiness.md#2026-10-09-継続確認)。
- 修正前のDigestはtrafficとPagesだけでCloudflareの取得可否を判定しており、WAF 5項目の失敗を`collector_errors`へ伝えなかった。このためWAF失敗中でも`status=ok`、`errors=[]`だった。Appsの[PR #16](https://github.com/kumakit/bearworks-apps/pull/16)で修正と回帰テストを提示してsquash merge。main commit `4e5515335c3c51808eb10db0a8d062f1a8a50434`。対象80テスト、PRのDashboard testsとValidate Streamlit、mainのValidate StreamlitはPASS、独立レビューでP1/P2残存なし。修正前の`ok`はCloudflare全体の取得正常を意味しない。
- PR #16の`collect_metrics.py`だけを現行ファイル退避・ハッシュ照合後に本番へ原子的に差し替えた。手動Digestは2026-10-09 13:45 UTCに終了コード0。公開状態は`partial`、`errors=[CLOUDFLARE_DATA_UNAVAILABLE]`、`stale=false`となり、`last_success_at`は直前の成功実行のまま。正常なtraffic、Google、サーバー指標は保持。次の定期実行は未確認。
- Cloudflare管理画面では対象ゾーンのセキュリティイベントが表示され、期間選択に7日がある。GraphQL収集主体の権限とデータセット提供条件は未確定で、権限は変更していない。
- Pagesの対象・契約は未確定。権限変更や契約推定は行っていない。
- Issue #397は未更新・未クローズ。危険度判定・履歴・前期間比は次段階。

NEXT MODEL: Root Codex（Lunaの証拠確認済み）
NEXT TASK: scheduled-verification/digest-waf-error-propagation
BLOCKERS: PR #16反映後の定期Digest継続確認、WAF系データセットの認可・提供条件、Pagesの対象・契約境界、認証後RTTとclock再同期の実測。未評価の項目は未確認のまま維持。

正本Issue: https://github.com/kumakit/mission-control/issues/397  
設計: [implementation_plan.md](implementation_plan.md) v4  
レビュー採否: [review-resolution.md](review-resolution.md)

## 初回提供範囲

- [x] 収集側の取得状態追加を計画範囲に含める。
- [x] 取得状態・必要な操作・WAFの事実説明を初回とする段階提供をユーザー承認。
- [x] 危険度判定・履歴・前期間比は次段階とし、#397全体を継続する。

## 工程状態

| 工程 | 状態 | 推奨担当・証跡 |
| --- | --- | --- |
| Planning | COMPLETED | Astra。設計v3と初回範囲承認 |
| Plan Review | COMPLETED | 条件付き承認を受領、F1〜F12の採否・設計修正、範囲承認をCodexが確認 |
| Implementation | COMPLETED | Solのportal分担＋司令塔の収集側。初回ローカル実装 |
| Editorial Rewrite | COMPLETED | CodexがUI説明を整理。外部Geminiリライトは未使用 |
| Semantic Fact Check | COMPLETED | Codexが期間・集計単位・推計・未評価範囲を照合 |
| Editorial Fix | COMPLETED | API失敗の案内と短い見出しを修正 |
| Code Review | COMPLETED | 独立レビュー承認可能。P1/P2なし。R01/R02の資料補足と採否を記録 |
| Verification | IN_PROGRESS | 両repoのCIと本番配備を確認。Pages修正後の定期収集とDigest成功、認証済み画面の2軸表示を確認。WAF 5項目はERROR。DigestのWAF実失敗伝達、本番認証RTT、WAF認可条件が未了 |
| Release | PARTIAL | PR #20/#14/#15/#22をmerge。Portal本番とAppsの初回対象5ファイルに加え、PR #15のcollector1ファイルを限定反映。手動収集は成功したが、WAF系5項目の取得と定期運転の受入れは保留 |

Plan Review完了は受領条件の反映とCodexによる採否判断を表す。外部レビュアーによるv3再承認、実装・テスト合格、本番状態の確認を意味しない。

## 初回の実装・検証

- [x] 実装の指示を受領する。
- [x] 両repoのbranch・HEAD・dirty状態と既存変更を確認。PR作成時に最新mainへ対象commitだけを載せ替えた。
- [x] 新data、runId、取得状態・有効組合せ表を実装する。
- [x] 旧形式・モック・失敗を正常にしない2軸表示を実装する。
- [x] API応答時刻・単調時計による鮮度評価を実装する。
- [x] DigestのCF入力検証・unavailable・既存partial伝達を実装する。
- [x] 共通fixture・対象ローカルケースを検証する（範囲はwalkthrough参照）。
- [x] 説明文の編集・意味照合を完了する。
- [x] 独立コードレビューを完了する（初回範囲の静的確認）。
- [x] R01/R02を運用確認項目へ反映する（コード変更なし）。
- [x] 対象テスト・lint・Linux build/Workers previewと既存境界を確認する。

## 初回の本番反映

- [x] U01の許容遅延方針を毎時cron＋10分の遅延許容（4200秒）として選び、Portalの5秒/30秒時計設定を本番反映する。
- [ ] U02（月境界・Pages対象・契約）を確認し、未確認ルールは無効にする。
- [x] 反映順・戻し方・配備版を確認する。
- [x] commit・push・CI・配備をそれぞれ承認範囲内で行う。
- [x] 初回実データの取得状態と2軸表示が一致し、欠損項目が正常表示されないことを確認する。
- [x] 初回の部分受入れ結果を記録し、#397を継続する。
- [x] merge済みのPages修正を本番collectorへ限定反映し、手動再収集で取得状態と未評価境界を確認する。
- [ ] WAF系の読み取り権限・提供範囲を確認し、取得状態を再受入れする。
- [x] Pages修正後の定期収集とDigestの継続成功、認証済み画面の取得状態表示を確認する。
- [x] WAF実失敗をDigestの`collector_errors`と`partial`へ伝える修正と回帰テストをPR #16で検証する。
- [x] PR #16をmergeし、mainのCI成功を確認する。
- [x] PR #16の対象コードを本番反映し、手動Digestで`partial`への伝達を確認する。
- [ ] 次の定期Digestで`partial`への伝達が続くことを確認する。
- [ ] 認証後RTT・clock再同期の実運用値を確認する。

## 次段階

- [ ] セキュリティ・トラフィック危険度の判定根拠と必要データを定義する。
- [ ] 履歴・前期間比・閾値の必要性と実装範囲を判断する。
- [ ] Issue全体の受入条件が揃うまでDone/closeにしない。

限定commit・push・ドラフトPR作成と依存最小更新を承認範囲内で実施。[CI確認記録](ci-verification.md)と[本番反映追補](operational-readiness.md#2026-10-08-本番反映追補)を参照。Appsの対象Linuxテスト137 PASS、post-merge main workflow成功。PortalもWorkers CI全工程PASS、本番100% traffic。

NEXT ACTOR: ROOT CODEX / HUMAN
NEXT MODEL: Root Codex（Lunaの本番証跡レビュー済み）
NEXT TASK: scheduled-verification/digest-waf-error-propagation
BLOCKERS: PR #16反映後の定期Digest継続確認、GraphQL WAF系の認可・提供条件、Pagesの契約・対象範囲、認証後RTTとclock再同期の実測。Issue更新・closeは未実施。危険度・履歴・前期間比は次段階。
