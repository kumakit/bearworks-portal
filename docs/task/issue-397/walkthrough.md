# Issue #397 初回実装・ローカル検証

更新日: 2026-10-07（JST）

## 範囲と基点

初回は取得状態、必要な操作、WAFの事実説明。危険度判定・履歴・前期間比は次段階で、#397全体は継続する。commit、push、Issue更新、CI起動、本番反映、Cloudflare設定変更は未実施。

- portal: main / `030b0f7b74bd21bc4cd809e4d34edd38af98cca5`。既存#397文書を保持。追跡参照より1コミット遅れ（AI newsデータ更新）。
- apps: feature/issue-389-phase1-gemini / `3ca59154020c818ff7ba1805b1ab9a4f9548d285`。変更前clean。通常のGit読取は拒否されたため昇格読取で確認。
- ブランチ切替・既存変更の破棄はしていない。

## 実装

### 収集・Digest

- 新しいcloudflare_collect.py / cloudflare_contract.pyに、今回のdata・runId・取得状態・期間・期限をまとめる。失敗はnull、旧数値へ戻らない。
- 主要WAF集計と補助項目を6つの独立GraphQL照会に分離。HTTP200のerrors、data=nullの権限エラー、Pagesの途中失敗・上限到達を明示する。1実行最大64 API要求。
- 24h/7d、UTC月初、windowEndと実行開始の一致、最大24hの期限、巨大数値・未知のenum（配列等も含む）を検証する。
- mainを新処理へ接続。互換の旧CF helpersは残るがmainでは使わない。固定500上限からの旧Pages利用率生成は停止。
- --mockはMOCK/DEMO。設定不足の旧互換モック経路では、新CFはMISSING_CONFIG/data=nullとなり、新画面・Digestに旧モック値を渡さない。
- DigestはCFだけを新契約から読み、他サービスの有効な値と警告を保持。実際の取得障害はcollector errorと既存partialへ伝える。
- 利用枠・危険度の未評価は取得失敗と分け、正常収集のlast_success更新を恒常的に止めない。Pages利用率はnull。
- CF未取得・未評価時のsummary/actionsは決定論的に構成する。汎用dashboard読取失敗と中核監視失敗時のstale fallbackでも、旧CF値と自由文の操作を引き継がない。
- 対象pytest・合成fixture・manifest、運用README・設定例、PR/manualの対象dashboard CIを追加。CIは未実行。

### portal

- 欠損の0/モック補完と旧数値の利用を廃止。
- 2軸で「データ状態」と「危険度判定は次段階」を表示。対象・期間・推計・欠損件数・操作を確認できる。
- summaryとtimelineのグラフを独立表示。失敗した項目を0グラフにせず、欠けた時間へ0を補わない。詳細一覧も保持。
- API応答直前のservedAtと運用時刻ポリシーを付与し、既存Access条件・token・no-store・405を維持。
- 単調時計、RTT、許容誤差で保守的に期限評価。復帰・定期再同期・期限・失敗を扱い、古い値を残さない。
- 正本fixtureとmanifestをコピーし、SHA-256を検証。対象NodeテストをWorkers CIにも追加。

## 分担

- Luna: CF→Digest経路、テスト基盤の調査と2回の読み取り専用一次レビュー。rootが根拠を確認して修正。
- Sol分担: portalの契約・時刻・表示・Nodeテスト。利用制限中断後に再開。
- 司令塔Codex: appsの全変更、両契約照合、レビュー指摘の採否、最終案内文と検証、CI導線、全差分確認。
- 各repoの書き手は1つ。portal担当終了後に司令塔が最終修正・文書更新。

## 検証

| 確認 | 結果・範囲 |
| --- | --- |
| apps対象pytest | **135 PASS**。CF契約・収集・Digest＋既存ai_operations/GCP credits/billing |
| portal対象Node | 18 PASS。fixture、enum、zero/null、partial/demo、期間・時計、API境界、描画・復帰・失敗時操作 |
| 型検査 | PASS。最終webpack buildにも含む |
| 全体lint | exit 0、0 errors、既存3 warnings（toukeiのimg、GCP画面・dashboardトップのeffect）。対象は警告0 |
| publication bundles | 既存7系統の整合検証PASS |
| 通常Turbopack build | 初回フォント取得失敗。ネットワーク取得を含む再試行はWindows CSS子プロセス起動のpanic。成功扱いにしない |
| 通常webpack build | PASS。設定・依存は変えず`npm run build -- --webpack`。全64ページ生成 |
| IAB画面 | 合成データだけでPC1280px/mobile390pxを確認。横はみ出しなし、partialで主要WAFを保持、failureで値なし、legacyで旧999999値なし、demoを明示 |
| 全dashboardの広い確認 | その時点の195 PASS / 4 FAIL。既存catalog配備ファイル欠落。対象結果と分離 |
| Linux/Python3.12・Workers CI | 未実行。Windows通常buildで代替しない |
| 本番・実データ | 未確認 |

Windowsのvenv起動はアプリ制御で拒否された。セキュリティ設定を変えず、同じuv Python3.14.3の基底実行ファイルと既存venvライブラリでpytestを実行。.env読込は無効化し、外部API/LLM/サービスはモック。Linux CIはPython3.12とuv.lockで別に再現する。

広いテストの4失敗は以下の参照先欠落。基点HEADにも存在しないことをgit ls-treeで確認した。今回これらのテスト・構成は変更していない。

- systemd/architecture-catalog-debounce.service
- systemd/architecture-catalog-worker.service
- .github/workflows/architecture-catalog-dispatch.yml
- .github/workflows/architecture-catalog-proposal.yml

全走査には既存の同名test_gemini_clientの衝突もあったため、広い確認は--import-mode=importlibを使用。新CIは対象4グループを明示して実行する。

IAB検証は一時的なloopback限定previewと合成API proxy。sandbox内previewへ到達できなかったため、同じ127.0.0.1限定helperを通常ホストで起動し、設定変更なしで確認した。検証用タブとhelperは終了。画面確認後の短い見出し・接続失敗案内はSSRと最新buildで再検証。

## 運用設定と残る工程

本番値を推測で設定していない。確認済みの収集間隔・遅延・時刻同期から以下を決める。未設定/不正では鮮度を取得正常にしない。

- apps: CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS（正整数、最大86400秒）
- portal: DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS
- portal: DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS

2026-10-07に独立コードレビューを受領。承認可能、P1/P2なし。R01/R02は運用説明へ反映し、コード変更不要と判断。静的確認と本番検証を区別した。採否は[code-review-resolution.md](code-review-resolution.md)。

残る工程はLinux受入れ、運用条件確認、別々のRelease承認。危険度判定が残るため#397をcloseしない。具体的な次工程は[verification-plan.md](verification-plan.md)。

レビュー用は[code-review-request.md](code-review-request.md)と[code-review-bundle.md](code-review-bundle.md)。
