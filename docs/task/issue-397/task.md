# Issue #397 工程・受入条件

更新日: 2026-10-08（JST）

## 現在の反映状況（2026-10-08追補）

- Portal PR #20 / Apps PR #14: merge済み。両方のmain CI成功。
- Portal: 本番配備済み。取得状態と危険度の2軸表示、APIのAccess/no-store境界、時計設定5秒/30秒を確認。
- Apps: 承認された5実行ファイルを本番へ反映。収集期限4200秒を設定。checkout全体のpull/resetはせず、既存変更は保全。
- 初回cron: traffic24hは`LIVE/OK/FULL`。WAF系5項目が`ACCESS_DENIED`、Pages当月件数が`UPSTREAM_ERROR`で`ERROR/UNKNOWN`。Portalは6/7項目を判定不能と表示し、取得正常に見せていない。
- Digest timerは02:13:47 UTCに起動し、02:13:55 UTCに`Result=success`で終了。公開状態は`partial`、last_successあり、Cloudflare未取得フラグと固定案内あり、Pages値はnull。継続運転は次回以降も観測が必要。
- 10:00 UTCのcronと10:29 UTCのDigestまで継続を確認。Digestは`partial`・`stale=false`・Cloudflare未取得案内を維持。
- Pagesの失敗原因は一覧APIへの`per_page=100`（HTTP 400）。件数10なら全ページを取得でき、修正したAppsの[PR #15](https://github.com/kumakit/bearworks-apps/pull/15)はsquash merge済み（main commit `3912f9cb2cc70d11b6572bc031be535e94a232d7`）。対象59テスト・PRの両CI成功、独立レビューP1/P2なし。本番collectorは未反映。WAF系はGraphQLのHTTP 200内に認可失敗表現があり、settings nodeの`firewallEventsAdaptiveGroups.enabled=false`を確認。権限・データセットの提供範囲は未確定。
- Pagesの対象・契約は未確定。権限変更や契約推定は行っていない。
- Issue #397は未更新・未クローズ。危険度判定・履歴・前期間比は次段階。

NEXT MODEL: Root Codex（Lunaの証拠確認済み）
NEXT TASK: release/pages-collector-hotfix-and-waf-access-follow-up
BLOCKERS: PR #15修正の本番collectorへの限定反映と再収集、WAF系の認可条件、Pagesの対象・契約境界、clock運転の継続観測。これらを確認するまでは該当データを未確認のまま維持。

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
| Verification | IN_PROGRESS | 両repoのCIと本番配備を確認。traffic24hの新形式とPortal表示は一致。Digest timerはpartial success。PagesのHTTP 400原因を特定し、PR #15をmerge。本番認証RTTの継続観測、WAF認可条件、新形式全項目の受入れが未了 |
| Release | PARTIAL | PR #20/#14/#15をmergeし、Portal本番とAppsの初回対象5ファイルを反映。PR #15の修正は本番未反映。初回cronとDigestは実行されたが、6項目はERROR/UNKNOWNのため全項目受入れは保留 |

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
- [ ] WAF系の読み取り権限・提供範囲を確認し、merge済みのPages修正を本番へ限定反映した後に再受入れする。
- [ ] 認証後RTT・clock再同期の実運用観測と次回cron/Digest継続成功を確認する。

## 次段階

- [ ] セキュリティ・トラフィック危険度の判定根拠と必要データを定義する。
- [ ] 履歴・前期間比・閾値の必要性と実装範囲を判断する。
- [ ] Issue全体の受入条件が揃うまでDone/closeにしない。

## Phase 2（2026-10-12 追補）

- [x] Free 実環境で前24時間、現行・前7日、現行30日の取得可能範囲と集計値を読み取り確認する。
- [x] 7日・30日の時間別・国別・全体値の整合、精度区分、失敗時の分離を Apps と Portal に実装する。
- [x] 24時間・7日・30日の表示切り替えと、24時間・7日の前期間比較を実装する。
- [x] 30日比較と履歴保存を別フェーズに分け、画面でも未対応と示す。
- [x] 両 repo の共通 fixture、対象テスト、Portal 型検査・lint をローカルで確認する。
- [ ] Phase 2 の Portal / Apps draft PR と CI を確認する。
- [ ] Portal を先に配備し、Apps 配備・機能有効化後に定期収集、Digest、認証済み PC / スマートフォン表示を確認する。

## Phase 2 定期収集の診断証跡（2026-10-12 追補）

- [x] 20時台の30日2項目 `PARTIAL_RESPONSE`、再収集での回復、21～23時台 Digest の `ok` / `partial` / `ok` を確認する。
- [x] 翌00:00 JST の定期収集で必須10項目がすべて `OK` になったことを確認する。続く Digest は未確認。
- [x] 収集・Digest の既存判定とログ保存場所を調査し、[診断証跡計画](diagnostic-evidence-plan_20261012.md)と[手動レビュー依頼](diagnostic-evidence-review-request_20261012.md)を作成する。
- [x] ユーザーがレビュー依頼の5確認点をすべて採用し、計画へ記録する。独立した外部レビューは未実施。
- [x] Sonnetの条件付きレビューを受領し、[指摘の採否](../../history/20261013_issue397_diagnostic_review.md)を記録する。
- [x] Apps の状態のみの収集・Digest ログをローカル実装し、診断失敗の隔離・実際の実行ID伝播・秘密値非出力を含む対象テスト108件、CIと同じdashboard環境の全対象テスト182件を通す。
- [ ] 対象差分、CI、限定配備、定期実行と Digest の相関を個別の承認境界で確認する。

限定commit・push・ドラフトPR作成と依存最小更新を承認範囲内で実施。[CI確認記録](ci-verification.md)と[本番反映追補](operational-readiness.md#2026-10-08-本番反映追補)を参照。Appsの対象Linuxテスト137 PASS、post-merge main workflow成功。PortalもWorkers CI全工程PASS、本番100% traffic。

NEXT ACTOR: ROOT CODEX / HUMAN
NEXT MODEL: Root Codex（Lunaの本番証跡レビュー済み）
NEXT TASK: release/pages-collector-hotfix-and-waf-access-follow-up
BLOCKERS: PR #15修正の本番collectorへの限定反映と再収集、GraphQL WAF系の認可条件、Pagesの契約・対象範囲、clock運転確認。Issue更新・closeは未実施。危険度・履歴・前期間比は次段階。

## Phase 3A 画面整理（2026-10-14 追補）

上の旧 NEXT TASK と未チェック欄には、更新前の Issue に基づく履歴が含まれる。現行の範囲判断は [Phase 3A 計画](phase3-display-plan_20261014.md)と Issue #397 の更新後要件を優先する。

- [x] 認証済み本番画面で 24 時間・7 日・30 日のアクセス推移、国別表示、残っている旧カードを確認する。
- [x] 最新 main から画面整理用ブランチを作り、Portal に限る変更計画と[手動レビュー依頼](phase3-display-review-request_20261014.md)を作成する。
- [x] Sonnet の手動計画レビューを受領し、[採否](../../history/20261014_issue397_phase3_display_review.md)を現行コードと照合する。
- [x] 旧 WAF・危険度・Pages 利用枠の通常表示を撤去し、アクセス関連と Pages の取得状態を「データについて」に整理する。
- [x] 契約・表示テスト31件、型検査、lint、webpack本番ビルド、合成データのローカルPC・スマートフォン表示、Workers CI、キーボード・フォーカスを確認する。
- [x] 対象差分をレビューし、commit、push、PR #28、CI、merge、本番配備をそれぞれ確認する。
- [/] セキュリティ参考系列を実測で調査し、意味・欠測・推計を確定してから採否を決める。30 日比較と履歴保持は別フェーズとする。

実装と検証の範囲は[Phase 3A 作業記録](../../history/20261014_issue397_phase3_display_walkthrough.md)を参照。

## Phase 3B 参考系列の調査（2026-10-15 追補）

- [x] 22:00 JST の定期収集で必須10項目すべて利用可能、22:20 JST の Digest が同じ実行番号を参照し、公開状態が正常・期限内・エラー0件と確認する。この1回だけの証跡として扱う。
- [x] Free 実環境でセキュリティ時間別系列の24時間・7日・30日照会と抽出状況、処理種別の可否を読み取り確認する。
- [x] [Phase 3B 計画案](phase3b-security-trend-plan_20261015.md)に採用条件と未解決点を整理する。
- [x] [読み取り専用の計画レビュー依頼](phase3b-security-trend-review-request_20261015.md)に対する結果を受領し、[指摘の採否](../../history/20261015_issue397_phase3b_plan_review.md)を現行コード・公式資料と照合して計画へ反映する。
- [x] Firewall イベントという名称と、空白時間・取得遅延・抽出の扱いを定め、合格条件A〜Eに基づく参考表示を採用した。
- [/] Apps・Portal の独立した任意契約と参考表示をローカル実装した。対象テストと型検査は通過。差分レビュー、CI、本番反映、定期運転は別々に確認する。

## Phase 3B 表示文言の改善（2026-10-16 追補）

- [x] スマートフォン表示の利用者確認を受領する。
- [x] 「返却値」が示す対象と推計の扱いを画面で説明し、列見出しを平易にする。
- [x] 変更後の対象テストと lint、差分を確認する。
- [ ] Portal PR の CI を確認し、承認された範囲でマージ・本番反映を進める。

変更内容と確認結果は[表示文言の作業記録](../../history/20261016_issue397_firewall_wording_walkthrough.md)を参照。
