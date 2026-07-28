# Issue #344 Phase 3-0 実装ウォークスルー

## 実装概要

- `app/(monetized)` と `app/(non-monetized)` を独立したroot layoutにし、公開URLを変えず広告境界を分離した。
- `/` と `/toukei/**` だけを広告rootへ配置した。
- `/about`、`/ai-news`、`/contact`、`/dashboard/**`、`/privacy`、`/weather` を非広告rootへ配置した。
- 共通metadata、Inter font、body classを `app/root-layout-config.ts` へ抽出した。
- 広告rootでだけ、`NEXT_PUBLIC_ADSENSE_CLIENT_ID` を使った `next/script` の `beforeInteractive` AdSense codeを出力する。
- `app/site-content.ts` のimportだけを移動後パスへ更新し、sitemapの公開URL集合を維持した。

## 検証結果

### 成功

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-9560028085973137` をbuild前に設定した `npm run build`
- `/` と代表的な `/toukei/**` のHTTP 200、およびhead内Next.js script queueのpublisher ID / AdSense URL
- `/about`、`/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy` のAdSense情報なし
- `/toukei/guides/not-found-for-qa`、`/toukei/problems/not-found-for-qa`、任意404のHTTP 404とAdSense情報なし
- `/ads.txt` のpublisher ID / DIRECT行
- `/sitemap.xml` の21 URLとroute group名の非露出
- `/robots.txt` のallow / disallow / sitemap
- 代表ページのtitle、description、canonical、および `/ai-news`・`/weather` の `noindex,nofollow`
- 初回版でのブラウザ遷移行列、script個数、console errorなし。ただしこの確認後にhead配置へ修正したため、最終版のNetwork確認とは扱わない。

### 未完了

- `npm run pages:build`: Vercel変換がroute group配下のLambdaを検出できず失敗
- 最終 `beforeInteractive` 版のブラウザNetwork、対象間遷移、対象/非対象境界、戻る・進む
- 本番反映と公開URL上の受け入れ確認

## 外部レビュー状況

Antigravity runnerの対象repo、branch、HEAD、権限境界を事前確認したが、`agy models` が空でモデルへ到達しなかった。外部レビュー成功とは扱わず、Codexの読み取り専用レビューへフォールバックした。

## 次の判断

Cloudflareの現行方針に合わせてWorkers / OpenNextへ移行するか、Pages / next-on-pagesを維持して複数root layout互換性を追加調査するかを決める。どちらの場合もCloudflare build成功後に最終ブラウザQAを実施し、その後に本番反映とAdSense再審査可否を判断する。
