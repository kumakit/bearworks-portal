# Issue #397 運用確認と反映案

## 2026-10-08 本番反映追補

以下は後続の承認済み反映後の状態であり、下記の事前確認表・未実施欄より新しい。本番反映・受入れは実施済みだが、取得データが部分状態のためIssue全体の完了ではない。

| 項目 | 実施・確認結果 |
| --- | --- |
| Portal PR #20 | squash merge済み。main commit `380f8a4a6f42db01fdc950d364088715cc6f972c` |
| Portal本番 | deployment `5d09a09b-e754-47b6-967c-2feb88ef9095`、version `2f98e684-82f6-45b4-868b-22edabb1aa25`、100% traffic。公開画面の2軸表示とAPIの302/no-storeを確認 |
| Portal設定 | `DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS=5`、`DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS=30`。既存認証binding保持 |
| Apps PR #14 | squash merge済み。main commit `3d5fb1344406aca4d6bbbc6dd709f2f7f8ba4249`、post-merge workflow 37715116022成功 |
| Apps本番反映 | 指定した5つの実行ファイルのみを反映。既存のdirty変更を保管し、checkout全体のpull/resetは実施せず |
| Apps PR #15 | Pages一覧を1ページ10件とする修正をsquash merge済み。main commit `3912f9cb2cc70d11b6572bc031be535e94a232d7`。対象59テスト、PRの両CI、mainのValidate Streamlitが成功 |
| Pages修正の本番反映 | 旧collectorがPR #14のGit blobと一致することを確認。現行collectorと公開JSON・課金キャッシュを非公開領域へ退避し、`dashboard/cloudflare_collect.py`の1ファイルだけをPR #15のGit blobと完全一致する内容へ原子的に差し替えた。所有者・権限を維持。checkout全体・設定・他の実行コードは変更していない |
| 収集期限 | 既存`.env`へ `CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS=4200` を追加。既存設定を保持 |
| 初回cron収集 | 2026-10-08 02:00:01 UTCに実行。`traffic24h=LIVE/OK/FULL`。WAF系5項目は`LIVE/ERROR/UNKNOWN/ACCESS_DENIED`、`pagesMonth`は`LIVE/ERROR/UNKNOWN/UPSTREAM_ERROR`。失敗項目にデータ・有効期限なし |
| 初回本番UI | `traffic24h`を取得正常、残り6項目を判定不能と表示。危険度とPages利用枠は未確認。偽の0件・上限値なし。Pages修正後の認証済みUIは別途確認 |
| Digest定期実行 | 02:13:47 UTCにtimer起動、02:13:55 UTCに`Result=success`で終了。公開状態は`partial`、last_success時刻あり、Cloudflare未取得フラグ・固定案内あり。Pages値はnull |
| 継続観測 | 10:00:02 UTCのcronでも同じ項目別状態。10:29:08 UTCのDigest timerは10:29:18 UTCに成功終了し、公開状態は`partial`、`stale=false`、Cloudflare未取得フラグと固定案内を維持 |
| Pages修正後の手動収集 | 1回実行し、2026-10-08 13:30:54 UTCに検証済み一時JSONを公開ファイルへ原子的に切替。`traffic24h`と`pagesMonth`は`LIVE/OK/FULL`、WAF系5項目は`ERROR/ACCESS_DENIED`でデータ・有効期限なし。7項目のrunId一致、Pages件数が非負整数、`scopeConfirmed=false`、利用枠・使用率はnull、JSON有効、所有者・権限維持を確認 |
| Pages修正後の定期運転 | 次のcronとDigestは未観測。手動収集1回の成功を継続運転の証拠にしない |
| Portal PR #22 | コードレビュー資料のLiquid構文衝突だけを修正してsquash merge。GitHub Pages自動ビルドと公開ジョブは成功。Portal Workersの追加配備は行っていない |

WAF系は、収集と同じGraphQL要求がHTTP 200で返り、`errors`内に認可失敗の表現が1件あった。Cloudflareの`settings.firewallEventsAdaptiveGroups.enabled`は、このトークン・ゾーンの組合せで`false`。無効理由（権限か提供範囲か）は未確定。認証値と応答本文は記録せず、API tokenの権限変更も行っていない。

Pagesの旧`UPSTREAM_ERROR`は、実装が一覧APIへ`per_page=100`を指定し、APIがHTTP 400を返すためと特定した。同じ認証・APIで`per_page=10`を指定すると、2プロジェクトの全19ページを正常取得できた。修正と回帰テストを分離したAppsの[PR #15](https://github.com/kumakit/bearworks-apps/pull/15)はsquash merge済み。対象テスト59件とPRのDashboard tests/Validate Streamlit CIが成功し、独立レビューでP1/P2指摘なし。本番collectorの限定反映後、手動収集でPagesの取得正常を確認した。Pagesの対象・契約・利用枠は依然未確認のため、デプロイ件数をビルド枠消費や安全判定として扱わない。

Cloudflareの現行公式資料では、GraphQL Analyticsの認可エラーは対象アカウント/ゾーンへの権限不足を示す場合があり、該当リソースの`Analytics Read`を確認するよう案内している。今回のWAF系失敗も認可表現を含むが、必要な権限・データセットの提供範囲はまだ特定していない。Pages一覧APIは`Pages Read`または`Pages Write`を受け付け、今回の件数10の読み取りは成功した。権限を推測で広げず、対象リソースと契約の範囲を確認する。

参考: [GraphQL Analyticsの権限エラー](https://developers.cloudflare.com/analytics/graphql-api/errors/)、[Settings node](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/)、[API token permission一覧](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)、[Pagesプロジェクト一覧APIの許可権限](https://developers.cloudflare.com/api/go/resources/pages/subresources/projects/methods/list/)。

既存の収集・Digestファイルにあったユーザー変更は反映前に退避した。保管先はOCI上のprivate backup directory。環境ファイルのバックアップも同じ保護領域にある。値は報告・文書へ記録していない。

## 反映前の確認記録

以下は本番反映直前の状態を残す履歴であり、現状は上記追補に置き換わっている。

確認日: 2026-10-08（JST）。当時は本番を読み取りのみで確認し、承認済みのPortal staging配備と時計設定5秒/30秒を実施済み。merge・本番配備・本番設定変更・収集の手動実行・Issue更新は未実施だった。[staging確認記録](staging-verification.md)を参照。

## 確認済み

以下の表は本番反映前の基準状態であり、実施後の事実は「本番反映追補」を参照。

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

## 設定候補と反映状態

この表は反映前の選択肢の記録。現在値は「本番反映追補」を参照。

| 設定 | 候補 | 条件 |
| --- | --- | --- |
| CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS | 4200秒（70分） | 毎時収集＋遅延許容10分という運用方針をユーザーが選ぶ場合。5分許容なら3900秒。許容遅延は確認依頼中 |
| DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS | staging承認済み5秒、反映済み | 認証後RTTの実測は未確認。本番値は未承認・未設定 |
| DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS | staging承認済み30秒、反映済み | 実際の定期通信の間隔は未確認。本番値は未承認・未設定 |

【反映前時点】設定がないまま新コードを配備しても鮮度は未確認になる。本番値を推測で入れて取得正常と見せない。匿名アクセスの測定はログイン画面への往復であり、認証後の同期RTTの根拠にしない。

## 推奨手順

以下は実施前に作成した手順の履歴。Portal PR #20とApps PR #14のmerge、本番反映、初回cron/Digest確認は上記追補の通り実施済み。残課題の対処は権限・対象を確認してから進める。

### 1. stagingでPortalを確認する（配備・旧形式表示を確認済み）

- 配備前に現在のstaging版・binding・Access保護・data到達経路を読み取り確認する。
- 既存の認証設定・bindingを保持し、Portal PR #20の候補版と時計設定5秒/30秒をstagingへ反映する。秘密値をコピー表示せず、既存の正規の設定経路を使う。
- 旧形式を未確認として表示できること、認証後のservedAt/RTT、非広告境界、失敗時に値を消すことを確認する。
- 配備・設定反映・認証後の旧形式未確認表示を確認済み。servedAt/RTTと新形式実データの受入れは残る。[staging確認記録](staging-verification.md)に反映版と確認範囲を記録。

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

以下は反映前の一覧。現在のブロッカーは「本番反映追補」と[工程・受入条件](task.md)冒頭の現状に整理した。

反映前の残件: 遅延許容方針、認証後RTT、新形式実データ、実際のPython/依存、更新中のcron/Digest競合回避、Pages契約境界、本番の反映・設定承認。stagingのbinding/Accessと旧形式表示を確認済み。自動検証の阻害要因は解消したが、当時は本番Release未実施だった。現在の反映後の残件は上記「本番反映追補」と[工程・受入条件](task.md)を参照。
