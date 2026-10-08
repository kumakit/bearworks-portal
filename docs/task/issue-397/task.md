# Issue #397 工程・受入条件

更新日: 2026-10-08（JST）

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
| Verification | IN_PROGRESS | 両repoのローカル・Linux CI成功。運用値と本番確認が未了 |
| Release | PENDING | 司令塔Codex。操作ごとの承認・反映確認 |

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

- [ ] U01（収集間隔・許容遅延・時刻同期等）を確認する。
- [ ] U02（月境界・Pages対象・契約）を確認し、未確認ルールは無効にする。
- [ ] 反映順・戻し方・配備版を確認する。
- [ ] commit・push・CI・配備をそれぞれ承認範囲内で行う。
- [ ] 実データ、取得状態、2軸表示の一致を確認する。
- [ ] 初回の受入結果を記録し、#397を継続する。

## 次段階

- [ ] セキュリティ・トラフィック危険度の判定根拠と必要データを定義する。
- [ ] 履歴・前期間比・閾値の必要性と実装範囲を判断する。
- [ ] Issue全体の受入条件が揃うまでDone/closeにしない。

限定commit・push・ドラフトPR作成と依存最小更新を承認範囲内で実施。[CI確認記録](ci-verification.md)を参照。Appsの対象Linuxテスト137 PASS、既存CIも全job PASS。Portalも依存更新後のWorkers CI全工程PASS。

NEXT ACTOR: ROOT CODEX / HUMAN
NEXT MODEL: Luna evidence / Root Codex final acceptance  
NEXT TASK: verification/operational-readiness
BLOCKERS: 自動検証の阻害要因は解消。収集は毎時0分、NTP同期を確認。[運用確認と反映案](operational-readiness.md)を作成。遅延許容方針・認証後RTT・staging確認が残る。既存本番Digest修正を保持し、merge・配備・設定変更は別承認。危険度等は次段階。
