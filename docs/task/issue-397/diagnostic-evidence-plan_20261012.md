# Issue #397 定期収集の診断証跡計画（2026-10-12）

## 2026-10-13 の判断と進捗

ユーザーは手動レビュー依頼の5つの確認点をすべて採用し、Apps PR #20、Portal PR #27 を作成した。両PRの初回CIは成功した。続いてユーザーから Sonnet の読み取りレビューを受領し、条件付き承認の指摘を [レビュー記録](../../history/20261013_issue397_diagnostic_review.md) に整理した。診断の失敗が本処理に影響しない保護、機能フラグの共通判定、実際の収集結果による `runId` テストなどを追補した。追補後の対象テスト108件と、CIと同じdashboard環境での全対象テスト181件は成功。追補のPR/CI、merge、本番反映、定期運転は別に確認する。

## 目的と現状

Phase 2 の期間別表示は本番で稼働している。2026-10-12 20:00 JST の定期収集では `trafficSeries30d` と `countryTraffic30d` が `PARTIAL/INCOMPLETE/PARTIAL_RESPONSE` となり、同日20:04の Digest も `partial` となった。20:15頃の同一区間の再照会と再収集は成功し、退避した元ファイルを保持して正常データを反映した。21時台の Digest は `ok`、22時台は `partial`、23時台は `ok` だった。22時台にどの入力が不十分だったかは、現存する公開状態と通常ログからは確定できない。

2026-10-13 00:00 JST の定期収集は00:00:37に出力を更新し、直後に確認した必須10項目はすべて `OK`。この時点で次回 Digest は00:29頃の予定で、まだ実行結果を確認していない。

毎時の出力先 `data.json` と Digest の公開状態は次回実行で上書きされる。失敗時の契約は正しく表示を止めているが、後から対象ブロックと理由を照合できない。取得成功と定期運転の安定性を区別して判断するため、値を持たない実行単位の診断行を既存ログへ残す。

## 範囲

- 対象は `bearworks-apps` の収集と Digest の診断ログ。Portal の表示・API契約、Cloudflare API照会、集計・失敗判定、機能フラグ、cron/timer間隔は変更しない。
- `fetch_dashboard_data.py` が実データの `collect_cloudflare()` を終えた直後、v2収集結果から**1実行につき1行**の構造化INFOを出す。必須候補10項目（`traffic24h`、`pagesMonth`、`trafficSeries`、`countryTraffic`、Phase 2 の6項目）について、有効項目の名称、`status`、`coverage`、`errorCode`、利用可否を許可リストで記録する。無効項目は `disabled` に明示し、失敗として数えない。モック・設定不足で収集へ進まない回は診断行を出さない。
- `collect_metrics.py` は現行の `required_cf` と `usable_data()` の結果を使い、Digest実行ごとに1行、同じ `runId`、必須項目名、利用不可の項目名と正規化した状態・エラーコード、Cloudflare必須項目をすべて使えたかの真偽値を journal に記録する。この真偽値は Digest 全体の最終判定ではない。収集結果が欠けた場合の `runId` は空値とし、任意文字列をログに転写しない。Digest の既存 `CLOUDFLARE_DATA_UNAVAILABLE` 判定と公開形式は維持する。
- 収集・Digest とも正常時も異常時も同じ形式で1行残す。診断の組み立てや出力で例外が起きても、本来の収集・Digest を失敗に変えない。
- ログにアクセス件数、国、IP、GraphQL応答、例外本文、認証情報、Zone/Account ID、環境変数値を含めない。任意文字列をそのまま連結せず、項目名と状態は固定した許可リストから選ぶ。

## 変更対象と安全境界

| 対象 | 変更 |
| --- | --- |
| `dashboard/fetch_dashboard_data.py` | 収集後の状態のみを記録。モックと設定不足は `LIVE` の成功と混同しない。 |
| `dashboard/ai_operations/collect_metrics.py` | Digest の必須集合・利用可否を記録。判定ロジックは変更しない。 |
| `dashboard/cloudflare_diagnostics.py` | 許可された項目・状態だけのログ生成、共通の有効項目判定、診断失敗の隔離。 |
| `docs/operations/ai-operations-digest.md` | 収集ログとjournalを同じ実行識別番号で照合する読み取り手順。 |
| `.github/workflows/dashboard-tests.yml` | 新しい診断テストを既存のPR検証へ追加。配備動作は追加しない。 |
| 対象テスト | 24時間・7日・30日、無効化、部分取得、期限切れ、Digest の相関と秘密情報非出力を確認。 |

本番の `cron.log` が ubuntu 所有で存在し、収集ジョブの設定行に同ファイルへのリダイレクトがあること、`dashboard/*.log` が週次・8世代でローテーションされる設定と8月23日までの既存世代、Digest の標準出力が journal に流れることを読み取り確認した。journal の実際の保持日数は未確認。永続履歴や新規DBはこの変更に含めない。ログの実行IDは内部相関用で、GitHubコメントや外部レビュー資料に生のIDを転記しない。

## 検証・受入条件

1. 模擬収集で30日2項目のみ `PARTIAL_RESPONSE` としたとき、収集ログ1行に当該2項目の状態とエラーコードが残り、他の項目が成功として識別できる。
2. Digestログの利用不可項目は `usable_data()` の結果と一致し、収集ログと `runId` で対応できる。期限切れと無効化を区別する。
3. 正常時は必須集合の利用不可件数0、異常時は既存 Digest が `partial` を維持する。公開JSON・Portal表示・旧WAF 5項目の必須監視対象外という契約を変えない。
4. ログにはアクセス件数、国コード、認証情報、Zone/Account ID、GraphQL本文、例外本文が現れない。`usableCount` はアクセス件数ではなく利用可能な項目の数。単体テストと対象回帰テスト、差分検査を通す。
5. 本番反映後、定期収集とその後の Digest のログを同じ `runId` で照合し、少なくとも正常1回と次の失敗時の識別可能性を確認する。単発成功を継続安定の証拠としない。

## 配備と戻し方

Apps の実装・PR・CI を進める。push、merge、本番配備は既存の個別承認境界に従う。反映対象は変更したAppsファイルだけとし、OCIの他の変更・資格情報を保持する。問題時は既存ファイルを直前版へ戻し、新規の `dashboard/cloudflare_diagnostics.py` と `dashboard/tests/test_cloudflare_diagnostics.py` は旧版に存在しないことを確認して除外する。追加ログ行の停止はコードの差し戻しで行い、既に記録したログの削除はこの手順に含めない。

## 未確定事項

- 20時の `PARTIAL_RESPONSE` がCloudflareの一時応答、Adaptive推計の別集計間の不一致、または別の原因かは未確定。取得値の一致条件や再試行は、状態ログの証拠を得てから別判断する。
- 22時台の Digest `partial` がCloudflare由来かは未確定。公開状態が上書きされ、当時の個別エラーを復元できない。
- ログの保持日数と閲覧権限を運用設定で確認する。診断期間に不足する場合は、個人情報を含まない状態のみの別保存方式を再設計する。
