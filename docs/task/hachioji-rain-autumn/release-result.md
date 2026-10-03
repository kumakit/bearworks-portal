# 第7・8弾 本番公開結果

2026-10-04 08:05 JST（2026-10-03 23:05 UTC）、既存Cloudflare Workerへ2記事を公開した。公開直後のHTTP確認とブラウザー操作は成功。

- [第7弾：八王子は都心より雨が多い？](https://bearworks.uk/labs/hachioji-rain)
- [第8弾：八王子の秋は本当に短くなった？](https://bearworks.uk/labs/hachioji-autumn)

## 許可とGit・CI

ユーザーが「はい、本番公開まで実施してください」と、提示済みのpush → PR → Linux検証 → merge → 公開を明示承認。新規Issue、認証・課金・Route/DNS/Access/secret設定の変更は行っていない。

- [PR #16](https://github.com/kumakit/bearworks-portal/pull/16)：GitHub connectorで作成・merge、Codexへ添付。
- 記事commit：`9be6c0251b64da86faf1b5dcde02cff2b8315db4`。push後にremote SHA確認。
- [Linux Workers build](https://github.com/kumakit/bearworks-portal/actions/runs/37160068060)：全工程成功。Node 22のclean install、固定bundle、lint、Next.js build、リンク方針、Workers build、production/staging dry-run、Workers previewで既存・新記事を検証。
- 公開対象main：`d94195f9e6cc83fc41777cde4c136f2ec8efb432`。
- CI対象と公開対象のGit tree：双方 `9b6fb21e181928d80367544bec9c09ab125a8365`。mergeでファイル内容は変わっていない。公開時の作業ツリーはcleanで、公開後に追加した文書・画面証拠はランタイムへ影響しない。

## 本番更新

`npm run deploy` を実行し、全固定bundle検証、Next.js build（64ページ）、OpenNext build、既存Workerへの公開を完了。ビルド時の公開広告IDは `ca-pub-9560028085973137`。ダミーIDの本番配信なし。

このWindows端末にはWSLがなく、OpenNextのWindows互換性警告が出る。先に同一内容のLinux CIを必須検証として通し、既存のWindows公開手順を使用した。Wranglerの「No targets deployed」は設定内に本番route定義がないための表示であり、既存の公開URLが更新されたことを以下の配信versionと実URLで別途確認した。

|項目|公開後|公開前の復旧対象|
|---|---|---|
|Worker|bearworks-portal|bearworks-portal|
|Deployment ID|82dcdbb9-db24-45af-b264-c8182c7a528a|8f9428f7-8c6d-4eff-a973-55b267b5f51c|
|Version ID|03588ad3-25ef-49a3-9829-739199e0eb4a|1e0cd158-0ea7-4e6f-b2d6-6427406c860e|
|配信割合|100%|更新前100%|
|Deployment時刻（UTC）|2026-10-03T23:05:12.546349Z|2026-10-03T11:44:46.557602Z|

公開前後のversion情報でbindingの名・種類を確認。ASSETS、既存DASHBOARD_API_TOKEN、TOUKEI_ORIGINが保持され、IMAGESなし。secret値は表示・記録せず、設定変更も行っていない。復旧は不要だった。

## 公開後の検証

|確認|結果|
|---|---|
|新記事用公開検証|12ルートPASS。本文、canonical、Article構造化データ、固定JSONのhash表示、承認、各5問、原本CSV・manifestのバイト一致、トップ・既存6記事・sitemapからの導線|
|代表ルートと境界|18確認PASS。トップ・新記事・統計トップ・代表例題/ガイドの200と正しいpublisher ID、一般6ページの非広告、3種の404の非広告、ads.txt、sitemap 54件|
|認証API|リダイレクトを追わないGETで302、bearworks-uk.cloudflareaccess.comへ。最初の確認ではリダイレクト後のログイン画面200をAPI応答と誤判定したため、直接応答で確認し直した。JWT等は送信・保存していない|
|第7弾の操作|降水量・降水日数・上位5日の割合の3指標で、選択状態と図の表示切替を確認。確認問題Q1の答えの開閉も確認|
|第8弾の操作|3気温帯の切替で比較値が更新。2021年の正常値90日・09-13の不採用表示、2025年への切替、確認問題Q1の答えを確認|
|初回描画と操作中のエラー|公開後の両タブでブラウザーerrorログ0件。公開画面を保存、タブは公開URLで保持|

証拠：`evidence/public-routes-check.json`、`evidence/public-browser-check.json`、`evidence/rain-public.jpg`、`evidence/autumn-public.jpg`。

## 残る既存警告

`npm audit --omit=dev` の既存警告は未解消。司令塔とLunaで公式勧告・アプリの利用箇所・OpenNext画像ハンドラー・実配信bindingを点検し、今回の構成で対象RCE条件に合う公開処理経路は確認できなかったため、記事を公開した。判断の根拠と限界は `dependency-review.md` に記録。依存更新は別途必要で、無警告・攻撃試験済みという報告ではない。

sitemapの配信を確認したが、検索エンジンの登録やAdSense審査承認を示すものではない。この作業ではそれらへの再申請を行っていない。
