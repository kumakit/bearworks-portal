# Issue #397 運用確認と反映案

確認日: 2026-10-08（JST）。本番は読み取りのみ。merge・配備・設定変更・収集の手動実行・Issue更新は未実施。

## 確認済み

| 項目 | 結果 |
| --- | --- |
| 文書push | 前回のGitHub障害から復旧。014c40c5f0632d887f7379975eda532e7a7518a9を反映済み |
| Portal PR #20 | draft/open。[文書反映後のCI 37711096171](https://github.com/kumakit/bearworks-portal/actions/runs/37711096171)も成功 |
| Apps PR #14 | draft/open。240df461f9f1a07553cf3c387c6a17ce33be93c4の対象テストと既存CIが成功 |
| 本番収集cron | 毎時0分。repo内で作業ディレクトリを変えて収集スクリプトを呼ぶ。明示mock・max-age代入はなし |
| 本番時刻同期 | NTPSynchronized=yes（確認時点） |
| 配信data.json | 旧形式。cloudflareCollectionなし。更新時刻は取得できたが継続的な収集成功の証明ではない |
| 収集側の.env | CLOUDFLARE_COLLECTION_MAX_AGE_SECONDSの代入なし。秘密値を出力していない |
| Digest timer/service | timer active/waiting、serviceの直近Result=success。1回の状態で継続成功とは判断しない |
| 本番Apps checkout | feature/issue-389-phase1-gemini、HEAD aa7bc666fbeb1994ee76b5316a17f0c6a7e10a66 |
| 既存手動変更 | collect_metrics.pyとgenerate_digest.pyがmodified。LF正規化SHA-256はorigin/mainの復旧済みコードと一致、mode 0664。変更を破棄しない |
| 本番Workersの時刻2設定 | 現在の配備版にはどちらもなし |
| 本番の既存binding | DASHBOARD_API_TOKENはsecret_text、TOUKEI_ORIGINはplain_text。値は資料へ保存していない |
| 公開APIのAccess境界 | redirectを追わないGETは302、Cloudflare Accessのログイン先、no-store。認証後のAPI応答・データ・servedAtは未確認 |
| stagingの既存状態 | 配備版43a2f090-cd03-4ee4-90a1-cb18775bc391（2026-09-04T14:44:15.902054Z）。API token bindingあり、時刻2設定なし。匿名APIはAccessへ302/no-store。認証後の到達経路は未確認 |

最新確認時のWorkers配備は2026-10-04T06:56:22.086737Z、配備ID b2f73568-dec6-4ad4-8a90-bf83ebc26786、100%の版はf0551790-912b-4369-a399-0d8f8ea58318。実行直前に再取得し、古い記録をrollback対象として固定しない。

Digest環境ファイルは一般ユーザーでは読めなかった。権限拡大やsudoをせず未確認とした。cron・環境ファイル原文、トークン、API本文、アカウント識別子は記録していない。

## 設定候補（未承認・未設定）

| 設定 | 候補 | 条件 |
| --- | --- | --- |
| CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS | 4200秒（70分） | 毎時収集＋遅延許容10分という運用方針をユーザーが選ぶ場合。5分許容なら3900秒。許容遅延は確認依頼中 |
| DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS | staging候補5秒 | 本番の認証後RTTを測っていない。stagingで同期・RTT・上限超過時の未確認表示を確認し、その結果から本番値を決める |
| DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS | staging候補30秒 | 15秒タイムアウトと同時fetchのキャンセルがある設計で再同期を確認する。負荷・実挙動をstagingで見てから本番値を決める |

設定がないまま新コードを配備しても鮮度は未確認になる。本番値を推測で入れて取得正常と見せない。匿名アクセスの測定はログイン画面への往復であり、認証後の同期RTTの根拠にしない。

## 推奨手順

### 1. stagingでPortalを確認する（次の承認対象候補）

- 配備前に現在のstaging版・binding・Access保護・data到達経路を読み取り確認する。
- 既存の認証設定・bindingを保持し、Portal PR #20の候補版と時計設定5秒/30秒をstagingへ反映する。秘密値をコピー表示せず、既存の正規の設定経路を使う。
- 旧形式を未確認として表示できること、認証後のservedAt/RTT、非広告境界、失敗時に値を消すことを確認する。
- 本番値・反映版・承認範囲を記録する。stagingの配備・設定も未実施で、実行承認が必要。

### 2. 本番Portalを先行する（別承認）

- 本番binding、Access保護、配備版を直前に再確認。Portalを先行反映し、旧JSONを未確認として扱えることを確認する。
- clockの2値はstaging確認結果に基づいて反映。既存認証secretとplain bindingを保持する。
- Portalを旧版へ戻すと以前のモック補完が再導入される。障害時は未確認表示を維持する修正を優先し、旧版復帰の必要性・影響を個別判断する。

### 3. Appsの対象ファイルを反映する（別承認）

本番checkoutは古い基点で既存修正があるため、一括pull/resetや未確認のbranch切替を手順に含めない。事前に変更対象を別の保護された保存先へコピーし、ハッシュ・mode・所有者を記録する。公開成果物へ.envやデータを含めない。

反映する実行コードは次の5ファイルに限定する。README・tests・workflowを本番の実行コードとして転送する必要はない。依存追加はないが、実行Python/既存依存の対応を配備前に確認する。

- dashboard/cloudflare_contract.py
- dashboard/cloudflare_collect.py
- dashboard/fetch_dashboard_data.py
- dashboard/ai_operations/collect_metrics.py
- dashboard/ai_operations/generate_digest.py

cronとDigestが部分更新を読むのを避ける実行時間・更新手順を先に確定する。停止が必要なら停止/再開も承認範囲に含め、状態を記録する。既存2ファイルの手動修正は復旧済みmainに一致するが、配備直前に再比較する。

読取側2ファイルが使う新contractを先に配置し、旧JSONは未確認とする。writerを更新した後、次の承認済み収集で新JSONが生成され、Digestが読むまで一時的な未確認/partialを許容する。設定のmax-ageは収集側.envへ対象キーだけを反映し、他設定を保持する。

### 4. 初回受入れ

- cron経由の新JSON、runId、status、期間、validUntilが同じ取得結果を示すことを確認する。
- Portalで取得正常と危険度未評価を区別する。欠損/失敗/部分取得/期限切れは偽の0や正常にしない。
- Digestが他サービスの監視値を保持し、CF未評価の固定案内を示すことを確認する。
- 初回の成功と、次回以降のcron/timer継続成功を分けて記録する。
- Pagesの利用枠・危険度・履歴・前期間比は次段階。初回受入れで#397をcloseしない。

## 戻し方

- Apps writerだけを戻して新Portal/新Digestを維持する場合、旧JSONは未確認となる。
- contractモジュールを利用中の読取側より先に削除しない。元のファイル・権限・所有者・既存手動修正を保持する。
- 収集・Digest出力を戻す場合、旧Cloudflare値を新契約の正常値として扱わない。前回値を正常表示する復旧はしない。
- Workersの版復帰は実行直前の配備一覧と比較し、旧画面のモック補完が戻る影響を承認範囲へ含める。

## 残る確認

遅延許容方針、認証後RTT、stagingの実binding/Access、実際のPython/依存、更新中のcron/Digest競合回避、Pages契約境界、本番の反映・設定承認。自動検証の阻害要因は解消したが、本番Releaseは未完了。
