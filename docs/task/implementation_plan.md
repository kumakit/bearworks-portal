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
- Next.js App Router の Route Group はURLへグループ名を含めないため、公開URLを保ったまま共通レイアウトを限定適用できる。

## 変更方針

1. `C:\Users\kumat\dev\bearworks-portal\app\layout.tsx` から広告scriptの直接出力と不要になった `<head>` を外す。
2. `C:\Users\kumat\dev\bearworks-portal\app\(monetized)\layout.tsx` を追加し、環境変数がある場合だけAdSense scriptをSSR出力する。
3. `C:\Users\kumat\dev\bearworks-portal\app\page.tsx` を `C:\Users\kumat\dev\bearworks-portal\app\(monetized)\page.tsx` へ移動する。
4. `C:\Users\kumat\dev\bearworks-portal\app\toukei` を `C:\Users\kumat\dev\bearworks-portal\app\(monetized)\toukei` へ移動する。
5. Route Group はURLセグメントにならないため、`/` と `/toukei/**` のURL、リンク、sitemap項目を維持する。

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

1. Next.jsがリクエストURLを解決する。
2. `/` と `/toukei/**` だけが `(monetized)` レイアウトを通る。
3. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` が設定されているときだけ、そのレイアウトがpublisher ID付きscriptをHTMLへ出力する。
4. その他のルートはroot layoutのみを通り、AdSense scriptを出力しない。
5. `public/ads.txt` は既存publisher IDのまま静的配信する。

## QA

### 静的確認

- ルートレイアウトに `adsbygoogle` / `NEXT_PUBLIC_ADSENSE_CLIENT_ID` が残っていない。
- 広告専用レイアウト以外にAdSense scriptがない。
- `public/ads.txt` のpublisher IDが `pub-9560028085973137` である。
- `app/site-content.ts`、`app/sitemap.ts`、`app/robots.ts`、各ページmetadata/noindexに意図しない差分がない。

### ビルドとHTTP確認

1. `npm run build`
2. 検証用に `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-9560028085973137` を設定して本番サーバーを起動する。
3. 広告対象URLがHTTP 200で、HTMLに `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` と `ca-pub-9560028085973137` を含むことを確認する。
4. `/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/about` が期待するHTTP応答を返し、HTMLに上記script URLとpublisher IDを含まないことを確認する。
5. `/ads.txt` がHTTP 200で、publisher IDとDIRECT行を返すことを確認する。
6. `/sitemap.xml` と `/robots.txt` がHTTP 200で、既存方針に回帰がないことを確認する。

`/dashboard` はCloudflare Accessで本番保護される別境界を持つため、ローカルQAではページ生成と広告script非出力だけを確認し、本番Access設定の変更は行わない。

## リスクと対策

- Route Group移動によるルート重複: ビルドで検出し、同一URLを提供する別pageがないことを確認する。
- 相対import破損: `toukei` subtreeは一括移動して内部相対関係を保ち、ビルドで確認する。
- scriptがクライアント遷移時に重複する可能性: レイアウト境界に1回だけ置き、ページ単位では重複配置しない。
- 環境変数未設定時の誤配信: 既存どおり条件付き出力を維持する。

## LM Studio利用規律

- LM Studio MCP/APIは読み取り専用の一次要約に限り、常に1件ずつ最大90秒で実行する。
- `Transport closed`、HTTP 500、timeout、90秒超過時は同一要求を再試行せず、直接Git・ファイル確認へフォールバックする。
- 実装判断、差分確認、検証、Git操作はCodexが行う。

## 完了条件

- 広告対象と非対象がRoute Groupで明確に分離されている。
- 対象ページだけがpublisher ID付きAdSense scriptを出力する。
- 非対象ページにAdSense scriptが出力されない。
- 公開URL、ビルド、HTTP、metadata、noindex、sitemap、robots、ads.txtに回帰がない。
- 実装後レビューの重大指摘が解消されている。
