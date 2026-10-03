# 公開前の依存関係警告の評価

2026-10-04、記事commit `9be6c0251b64da86faf1b5dcde02cff2b8315db4`。`npm audit --omit=dev` でNext.js 16.3.0（critical）、sharp 0.35.3（high）、baseline-browser-mapping 2.10.27（moderate）の既存警告を確認。今回のPRは依存関係を変更していない。警告は解消済みではない。

## 本番への適用条件

|勧告|確認した条件と今回の構成|
|---|---|
|[Next.js Windows filesystem RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36)|Windowsでホストするサーバーの条件。本番はCloudflare Workers/workerd。ローカルNext.jsプレビューは127.0.0.1に限定し、公開前に停止した。|
|[Next.js AVIF image optimizer](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)、[sharp/libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)|ネイティブsharp/libheifでの画像デコードが条件。OpenNext Cloudflare 1.20.2の画像ハンドラーはsharpを呼ばず、IMAGES未設定時は先頭バイトによる形式確認後に元画像を返す。IMAGES使用時もCloudflare Images経由。|
|[Next.js next/og ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)|Node版ImageResponseで攻撃者が制御するSVG等を扱う条件。app/components/lib/workersでnext/og、ImageResponseの使用は見つからない。|
|[baseline-browser-mapping](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)|ブラウザー対象のビルド用依存。利用者入力を渡すアプリの処理は見つからない。Linux CIと本番向けbuildは成功。|

`/_next/image` は通常のローカルPNGに対する公開GETで200を返したため、エンドポイント自体が存在しないとは判断しない。アプリ内のnext/imageはunoptimizedで使用。画像ハンドラー実装は `node_modules/@opennextjs/cloudflare/dist/cli/templates/images.js`、SHA-256 `392c7babd5f4872979030636dad29a3ac2f082ea29fd0a059c942bb4ac56333d`。この実装とビルドで生成される画像処理経路を根拠とする。

リポジトリの本番wrangler設定にIMAGES bindingなし。公開直前の実配信version `1e0cd158-0ea7-4e6f-b2d6-6427406c860e` も `wrangler versions view --json` のbinding名・種類だけで確認し、ASSETS、既存secret、TOUKEI_ORIGINのみだった。secret実値は表示・記録していない。

## 判断と残る範囲

司令塔とLunaによる読み取り専用点検で、上記RCE勧告の条件に当たる公開処理経路は確認できなかった。この構成に限り、既存警告を記録して記事公開を進める判断とした。脆弱バージョンそのものを安全と認定するものではなく、攻撃入力による実証試験は実施していない。

依存関係の修正版への更新は別途必要。画像処理、next/og、ホスティング方式などの変更時には今回の判断を再利用せず、勧告の条件を再評価する。この記事公開に伴う依存更新、Route/DNS/Access/secretの変更は実施していない。
