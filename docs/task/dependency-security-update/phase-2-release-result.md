# 第2段階の公開結果

2026-10-04。開発・公開ツールの修正可能な依存警告を更新し、Linux CI、merge、本番公開と公開後確認まで完了した。全体監査17→7、本番用0を維持。残るbraces由来7件は未解消で、全警告解消としてIssue #17をcloseしない。

## 反映した変更と根拠

- [PR #19](https://github.com/kumakit/bearworks-portal/pull/19)：Wrangler 4.147.0、direct esbuild 0.28.2と修正可能な間接依存を更新。Next/OpenNext/React/Tailwindの世代は維持。
- [Linux Workers CI](https://github.com/kumakit/bearworks-portal/actions/runs/37184035678)：Ubuntu・アプリNode 22で全step成功。production監査0、native sharp 0.35.5、17監査ゲートテスト、全体7件の限定例外、Next/OpenNext build、両環境dry-run、Workers preview、既存ルートと18回の並列応答確認を通過。
- PR head `85008fe5bd03d80feb07b4fca7dc7f9654bf473a`、CI checkout `bd94f8ff467c8f7b18076164c800b169f38de797`、公開main `e534cc8dc28d8daed5c4c94de1b434e3870ca332`。CI checkoutとmainのGit treeはともに `c2f09ea66b3ab2bb456ce1932751f69135a93bd6`。
- Lunaが依存差分と監査ゲートを読み取り専用でレビューし、critical検査の不足を修正後に再確認。詳細は `phase-2-walkthrough.md`。

## 本番公開

公開直前の実配信版を公式Wrangler CLIで確認し、復旧先に固定。既存 `npm run deploy` で実広告IDをbuild環境へ設定して公開した。

|項目|結果|
|---|---|
|Worker|bearworks-portal|
|新version|f0551790-912b-4369-a399-0d8f8ea58318|
|新deployment|b2f73568-dec6-4ad4-8a90-bf83ebc26786|
|作成時刻|2026-10-04T06:56:22.086737Z|
|配信割合|100%|
|直前の復旧先|ce390af0-fd25-41bd-8794-76a07fed29a7|
|直前deployment|9926ac9b-5109-4f69-91aa-b85c01a6ba34|

binding名・種類（ASSETS/assets、DASHBOARD_API_TOKEN/secret_text、TOUKEI_ORIGIN/plain_text）とruntime設定が前後で一致。Route/DNS/Access/secretに変更はない。公式Worker tailを自分の専用ヘッダー付き確認要求だけに限定し、公開URL `/labs/hachioji-autumn` が新versionでstatus200・outcome okになることを確認して接続を閉じた。認証ファイルからの抽出や直接APIへの資格情報転用は行わず、証拠は必要な項目だけ保存。

## 公開後確認

- 公開URLの12ルート検証：シリーズ8記事・原本2・トップ/sitemapの本文、schema、canonical、データhash、リンク・確認問題を検査し成功。
- 別の21確認：本番広告ID（テストIDなし）、非広告・404境界、ads.txt、sitemap54、画像、static assetのimmutableとローカル公開buildのSHA-256一致、dashboard/APIの未認証Access302 redirectを確認し成功。
- IABで雨の指標切替と確認問題、秋の温度帯・2021年・9/13不採用・確認問題を操作し成功。公開2記事は実幅501pxで横溢れなし、browser error0。ローカルでは秋1280px/390px、雨390pxも確認済み。公開画像は `evidence/phase-2/public-autumn.png`。
- 本番の認証済みAPIは未確認。401/405とno-storeはLinux Workers previewで確認済み。Access redirectをAPI成功とは扱わない。
- previewの18要求は通常応答と生存確認であり、途中キャンセル耐性は未検証。

## 残件と次の受入

全体監査のhigh7件は、修正版がないbracesの1勧告と依存連鎖。版・経路・重要度・修正可否を固定した開発用限定例外で管理し、**2026-10-18 09:00 JST**までに上流修正版と互換代替を再評価する。期限後はCIが失敗し、無条件延長しない。Tailwind 4単独移行ではNext Lint側の経路が残るため、ブラウザー方針と両経路の対処を確認して第3段階を設計する。

脆弱性監査とは別に、既存のLint warning4、npm ciのglob/node-domexception廃止予定表示、GitHub Actions v4のNode 20 runtime廃止予定表示、OpenNext公開時の環境未指定/Node 24 DEP0190表示がある。今回の公開は成功し、これらを解消済みとは扱わない。Actionsの実行runtimeはrunnerがNode 24へ切り替えており、アプリ検証のNode 22とは別。今後のツール保守対象として記録する。

5xx・描画・広告/認証境界の回帰が起きた場合は上記直前versionへ復旧し、旧依存警告が戻る点も記録する。全警告0、例外なし、必要な公開確認まで完了してからIssueをcloseする。

証拠：`evidence/phase-2/production-before.json`、`production-after.json`、`production-deploy.log`、`linux-ci-highlights.log`、`public-routes-check.json`、`public-worker-route-proof.json`。
