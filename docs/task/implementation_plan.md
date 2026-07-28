# Issue #344 Phase 3-0 実装計画

## 目的

AdSense の広告配信用スクリプトをサイト全体のルートレイアウトから外し、統計学習コンテンツだけで読み込む。公開URL、既存metadata、noindex、robots、sitemapを変えずに、広告対象ページと非対象ページをコード構造で分離する。

## 対象

- 司令塔Issue: `kumakit/mission-control#344`
- 対象repo: `C:\Users\kumat\dev\bearworks-portal`
- 司令塔repo: `C:\Users\kumat\hub\mission-control`
- 対象branch: `codex/issue-344-phase3-ads-scope`
- 実装開始時の対象HEAD: `2f3831315f05d25baf6b25c52567b4093a25a559`
- 司令塔branch / HEAD: `main` / `0eb393d3ba51ebb76112fa5b24ef4729fe21a549`

## 背景と既存構成

- `C:\Users\kumat\dev\bearworks-portal\app\layout.tsx` が `NEXT_PUBLIC_ADSENSE_CLIENT_ID` の存在時に AdSense script を全ルートへSSR出力している。
- `/ai-news` と `/weather` はnoindexだが、noindexは広告掲載範囲を制御しない。
- 統計学習ページはトップページと `C:\Users\kumat\dev\bearworks-portal\app\toukei` 以下にまとまっている。
- Next.js App Router の Route Group はURLへグループ名を含めないため、公開URLを保ったまま複数root layoutへ分離できる。
- 単一root配下のnested layoutだけでは、広告ページから非広告ページへのsoft navigation後に読み込み済みAdSense実行環境が残る可能性がある。

## 変更方針

1. `C:\Users\kumat\dev\bearworks-portal\app\layout.tsx` を共通root layoutとして使う構成を廃止する。
2. `C:\Users\kumat\dev\bearworks-portal\app\(monetized)\layout.tsx` と `C:\Users\kumat\dev\bearworks-portal\app\(non-monetized)\layout.tsx` をそれぞれroot layoutとして追加する。境界間の遷移をNext.js仕様上のfull page loadにし、広告実行環境をブラウザ文書単位で分離する。
3. 共通metadata、Inter font、body classを `C:\Users\kumat\dev\bearworks-portal\app\root-layout-config.ts` へ抽出し、両root layoutから利用する。`globals.css` も両root layoutで読み込む。
4. `C:\Users\kumat\dev\bearworks-portal\components\AdSenseScript.tsx` を追加し、`NEXT_PUBLIC_ADSENSE_CLIENT_ID` がある場合だけ既存のnative `<script>` をSSR出力する。
5. `C:\Users\kumat\dev\bearworks-portal\app\page.tsx` と `C:\Users\kumat\dev\bearworks-portal\app\toukei` subtreeを `(monetized)` 配下へ移す。各正常pageから `AdSenseScript` を描画し、動的slugページでは `notFound()` 判定後のreturnだけに含める。
6. `about`、`ai-news`、`contact`、`dashboard`、`privacy`、`weather` の各page subtreeを `(non-monetized)` 配下へ移す。`app/api`、metadata route、共通module/componentsはroute group外に維持する。
7. `C:\Users\kumat\dev\bearworks-portal\app\site-content.ts` の統計データimportを移動後パスへ更新し、生成するsitemap URL値自体は変えない。
8. Route GroupはURLセグメントにならないため、既存の公開URLを維持する。

## 広告対象

- `/`
- `/toukei`
- `/toukei/guides`
- `/toukei/guides/*`
- `/toukei/problems`
- `/toukei/problems/*`
- `/toukei/methodology`

将来の `/labs/*` は公開時に `(monetized)` 配下へ置くが、本タスクでは未作成のコンテンツを追加しない。

## 広告対象外

- `/ai-news`
- `/weather`
- `/dashboard` とその配下
- `/api/*`
- `/contact`
- `/privacy`
- `/about`
- 404・エラーページ

`/about` はIssueコメントの広告掲載候補に含まれていないため、Phase 3-2で内容を強化しても本タスクでは非広告とする。

## 非目標

- 広告ユニットや自動広告設定の変更
- AdSense再審査の即時申請
- Phase 3-1の独自分析記事追加
- Phase 3-2の運営者情報・制作工程表示の追加
- Cloudflare、Search Console、AdSense管理画面の変更
- commit以外のGitHub書き込み、push、PR作成

## データフロー

1. Next.jsがリクエストURLを広告rootまたは非広告rootへ解決する。
2. `/` と `/toukei/**` の正常pageだけが `AdSenseScript` を描画する。動的slugが存在しない場合は `notFound()` が先に終了するためscriptを描画しない。
3. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` がbuild時に設定されているときだけ、publisher ID付きnative scriptを対象pageのSSR HTMLへ出力する。
4. 非広告rootのpageはAdSense componentを参照せず、HTMLへscriptを出力しない。
5. 広告rootと非広告root間のクライアント操作はfull page loadになり、前の文書でロードされたAdSense実行環境を引き継がない。
6. `public/ads.txt` は既存publisher IDのまま静的配信する。

## QA

### 静的確認

- root layoutに `adsbygoogle` / `NEXT_PUBLIC_ADSENSE_CLIENT_ID` がない。
- AdSense scriptは共通componentと広告対象の正常pageだけから参照される。
- `public/ads.txt` のpublisher IDが `pub-9560028085973137` である。
- `app/site-content.ts` は移動後import以外のURL集合に差分がなく、`app/sitemap.ts`、`app/robots.ts`、各ページmetadata/noindexに意図しない差分がない。

### ビルドとHTTP確認

1. build前に検証用 `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-9560028085973137` を設定する。
2. `npm run build`
3. `npm run pages:build`
4. 同じbuild時環境変数を使って本番サーバーを起動する。
5. 広告対象URLがHTTP 200で、HTMLのnative script `src` に `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` と `ca-pub-9560028085973137` を含むことを確認する。
6. `/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/about` が期待するHTTP応答を返し、HTMLに上記script URLとpublisher IDを含まないことを確認する。
7. `/toukei/guides/not-found-for-qa`、`/toukei/problems/not-found-for-qa`、任意404が404を返し、HTMLにAdSense scriptを含まないことを確認する。
8. `/ads.txt` がHTTP 200で、publisher IDとDIRECT行を返すことを確認する。
9. `/sitemap.xml` のURL集合、`/robots.txt` のallow/disallow、代表URLのtitle/description/robots metaを変更前の期待値と比較する。`/ai-news` と `/weather` は `noindex,nofollow` を確認する。
10. ブラウザで「対象→対象」「非対象→対象」「対象→非対象」「戻る・進む」を確認し、対象文書だけにscriptが1個あり、非対象文書では0個で、root境界間がfull page loadになることを確認する。

`/dashboard` はCloudflare Accessで本番保護される別境界を持つため、ローカルQAではページ生成と広告script非出力だけを確認し、本番Access設定の変更は行わない。

## リスクと対策

- Route Group移動によるルート重複: ビルドで検出し、同一URLを提供する別pageがないことを確認する。
- 相対import破損: subtreeは一括移動して内部相対関係を保ち、外部からの `site-content.ts` importだけを明示更新してビルド確認する。
- scriptの残留・重複: 広告/非広告を別rootにして境界間をfull reloadにし、正常page内の共通componentを各pageで1回だけ描画する。ブラウザ遷移行列でも確認する。
- 複数root間の共通設定ドリフト: metadata/font/body classを共通module化する。
- 環境変数未設定時の誤配信: 既存どおり条件付き出力を維持する。

## LM Studio利用規律

- LM Studio MCP/APIは読み取り専用の一次要約に限り、常に1件ずつ最大90秒で実行する。
- `Transport closed`、HTTP 500、timeout、90秒超過時は同一要求を再試行せず、直接Git・ファイル確認へフォールバックする。
- 実装判断、差分確認、検証、Git操作はCodexが行う。

## 完了条件

- 広告対象と非対象が別root layoutで明確に分離されている。
- 対象の正常pageだけがpublisher ID付きnative AdSense scriptをSSR出力する。
- 非対象pageと404にAdSense scriptが出力されず、対象から非対象への遷移後にも広告実行環境が残らない。
- 公開URL、通常build、Cloudflare build、HTTP、metadata、noindex、sitemap、robots、ads.txtに回帰がない。
- 実装後レビューの重大指摘が解消されている。

## 参照した公式仕様

- Next.js 14 Pages and Layouts: https://nextjs.org/docs/14/app/building-your-application/routing/pages-and-layouts
- Next.js 14 Route Groups: https://nextjs.org/docs/14/app/building-your-application/routing/route-groups
- Next.js 14 Script Optimization: https://nextjs.org/docs/14/app/building-your-application/optimizing/scripts
