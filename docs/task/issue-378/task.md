# Issue #378 進捗

正本: https://github.com/kumakit/mission-control/issues/378

計画: [implementation_plan.md](implementation_plan.md)

## 計画

- [x] 最新Issue本文・コメント・状態・labels・担当・milestone・日時を取得
- [x] Portalの現在branch/HEAD/dirty状態と最新側の既存記事を確認
- [x] Appsの日別データ取得・品質処理・固定bundle公開の仕組みを確認
- [x] 気象庁の観測所一覧で予備確認（時別実データ・期間は未確認）
- [x] Lunaの読み取り専用QA整理と主担当の確認
- [x] 実装計画・進捗ファイル作成
- [x] 統計検定2級の公式範囲と既存学習コンテンツへの対応を確認
- [x] ユーザーの画像・グラフ・学習連携要望を [記事設計](content-design.md) に反映
- [x] 記事設計を手動レビュー版r1として整理（読者・ページ順・未確定事項を追記）
- [x] Antigravityへ貼り付ける [レビュー依頼プロンプト](plan-review-request.md) を作成
- [x] ユーザーによるAntigravityへの手動受け渡し・レビュー結果受領
- [x] Codexによる指摘の採否判断・資料更新・履歴保存（Major 3件採用、Minor・設問を訂正）
- [x] レビュー後にGitHub Issueへ計画とレビュー結果を反映（[投稿確認済み](https://github.com/kumakit/mission-control/issues/378#issuecomment-5650095003)）
- [x] ユーザーの計画レビュー（「OK 次に進んでください」で実装着手了承）

## 実装

- [x] Portal最新mainを確認し専用branchを準備（`codex/issue-378-hachioji-snow`）
- [x] Apps分析作業環境を準備（同名専用branch、Python実行確認）
- [x] 既存記事の表示名・metadataを東京都心へ修正
- [x] 東京都心の定義注記を追加
- [x] 正式地点名・内部ID・既存bundle/lockの維持を確認
- [x] 公式HTML17件の可用性調査・SHA-256付き証拠を保存
- [x] 地点×項目×期間の可用性表と取得方法・制約を確定
- [x] H1〜H4の現段階の検証可否と代替案を明記（[可用性調査](data-availability.md)）
- [x] 分析期間・閾値・欠測規則・事例候補と検証不能時の扱いを結果集計前に固定（[分析設計r1](analysis-design.md)）
- [x] 公式CSV見本を取得し、実ヘッダー・品質・現象なしを検証
- [x] 時別parser・同時刻比較・入力整合性検証を実装、13テスト成功
- [x] raw snapshot・manifest取得
- [x] 時別正規化・品質検査・比較・仮説評価を実装
- [x] 観測値・推計・補助地点類推と非観測/欠測/0を区別
- [x] 独立検算・主要事例との照合
- [x] 固定publication bundleとPortal検証を追加
- [x] 雪記事・図表・出典・限界・複数事例を実装
- [x] 導入の雪景色画像と独自の気象説明図を制作・出典確認
- [x] 時系列・ヒストグラム・箱ひげ図・散布図と、条件を満たす推定・検定を表示
- [x] 手法名・式・読み取り・ミニ設問3〜5問と関連解説へのリンクを追加
- [x] /toukeiの「実データで学ぶ」導線を追加
- [x] 既存デザイン・導線・canonical・sitemap・provenanceを整備
- [x] データテスト・回帰テスト・lint・型検査・Next/OpenNext build
- [x] PC/モバイル表示・route/404・広告境界を確認
- [x] 検証結果・未検証事項・直接検証不能の理由を記録

## 公開前の残作業

- [ ] 運営者の本文・数値・画像レビュー
- [ ] pushの明示承認・remote反映
- [ ] 本番公開・実広告を含む公開後確認

2026-09-15更新：本取得・本解析・独立検算、雪記事と学習導線、18データテスト、lint/型検査、Next/OpenNext build、PC/モバイル確認を完了。推測統計は独立性を保証できないため実測のCI/p値を算出せず、仮想設問で説明する。広告はroute/layout境界を確認し、実広告は本番確認に残す。

[最新検証記録](../../history/20260915_issue-378_snow-article.md)。Appsの初期入力基盤はcommit `e57bdf6`。本解析はローカルcommit `f60e422` に保存済み。記事も本記録とともにローカルcommitへ保存。push・公開は未実施。
