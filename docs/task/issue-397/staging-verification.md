# Issue #397 staging配備確認

確認日: 2026-10-08（JST）。ユーザーがPortal staging配備と時計設定5秒/30秒を承認。本番配備・Apps本番反映・merge・Issue更新は実施していない。

## 配備と根拠

| 項目 | 結果 |
| --- | --- |
| 対象 | bearworks-portal-staging / staging.bearworks.uk |
| ソースhead | b7f024c922d5bb64ae5102a73e7cf50ab2fe3925 |
| Linux CI | [37712756628](https://github.com/kumakit/bearworks-portal/actions/runs/37712756628)、全工程成功 |
| 使用bundle | 上記CIのworkers-staging-b7f024c922d5bb64ae5102a73e7cf50ab2fe3925。preview検証成功後に保存した.open-next |
| 配備時刻 | 2026-10-08T01:28:45.042021Z（10:28:45 JST） |
| Workers version | 0b394d64-6736-4e4c-a994-47cc2f7210a2 |
| deployment | 61df7cd0-ced9-4206-be69-6806aa0e338e |
| 時計設定 | DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS=5 / DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS=30。配備後のbindingでも確認 |
| 認証 | 既存DASHBOARD_API_TOKENのsecret_text bindingを保持。値は表示・保存していない |

実行は `npx opennextjs-cloudflare deploy --env staging --keep-vars`。stagingのvarsだけに時計2設定を追加。既存の認証bindingを保持した。

Windowsのwebpack buildは成功したが、OpenNext buildはstandalone内のpages-manifest.json欠落で失敗した。不完全な出力を保存し、成功したLinux CI artifactへ切り替えた。Linux artifactのstaging dry-run成功後に配備した。Windows成功をWorkers受入れ根拠にしていない。

artifact保存は既存Workers CIのpreview成功後に追加した。CIのAdSense clientはテスト用値であり、このbundleはstaging専用。本番用bundleの代用にしない。

## 配備後の確認

- 匿名APIはCloudflare Accessへ302、no-store。認証境界を保持。
- ユーザー認証後のCloudflare画面に、新しい「データ状態」と「セキュリティ・トラフィックの兆候」の2軸が表示された。
- 旧形式データは対象7件すべて未確認。「収集処理の出力形式を確認する」を案内。旧数値・固定500上限・モックグラフによる正常補完を表示していない。
- 危険度は「危険度判定は次段階」、Pagesは「利用枠は未確認」。WAF処理、パス、ASNについての事実説明も表示。
- 「再読込」操作後、読込中・接続失敗・時計警告の表示がなく、未確認7件の表示へ戻った。後続の画面確認でも同じ表示を保持した。
- ブラウザーが捕捉した配備時刻以降のstaging由来のconsole errorは0件。配備前のAccess認証ページのログは対象外とした。
- 確認画面をローカル証跡として保存。認証情報やAPI本文は記録していない。

## 未確認と受入れ範囲

staging配備・設定反映・認証後の旧形式表示を確認済み。表示に時計警告がないことだけでは、servedAtや実測RTTの正確性を証明しない。

認証後APIへの直接ナビゲーションはブラウザー側で拒否された。制限回避やcookie取り出しは行わず、servedAt・同期RTT・実際の30秒間隔の通信は未確認。上限超過、復帰、期限切れの自動テストはLinux CIで成功したが、staging実データでの再現は未実施。

Apps本番はまだ旧形式を出力している。新形式の実データ、取得正常/部分取得、validUntil経過、Digestとの一致、次回cron/timer継続成功は次の受入れに残る。

## 本番と戻し方

配備後の本番Workersは事前と同じdeployment b2f73568-dec6-4ad4-8a90-bf83ebc26786、version f0551790-912b-4369-a399-0d8f8ea58318。時計2設定はなし。本番の設定・実行コードは変更していない。

stagingの直前versionは43a2f090-cd03-4ee4-90a1-cb18775bc391。戻す必要が生じた場合は現在の配備一覧と比較し、stagingを明示する。旧版ではモック補完が戻るため、その影響も判断する。rollbackは未実施。

NEXT MODEL: Luna evidence / Root Codex final acceptance
NEXT TASK: verification/live-clock-and-production-readiness
BLOCKERS: 認証後の同期RTT、新形式実データの受入れ、収集側の許容遅延方針、本番反映の別承認。危険度・履歴・前期間比は次段階。
