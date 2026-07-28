# Issue #344 Phase 3-0 Workers/OpenNext移行計画

## 目的

AdSense配信範囲を分離した複数root layout構成を維持したまま、Cloudflare Pages向けの `@cloudflare/next-on-pages` からCloudflare Workers向けの `@opennextjs/cloudflare` へ移行する。Workers互換buildとローカルpreviewを成功させ、Phase 3-0の未解決リリースゲートを解消する。

## 対象

- 司令塔Issue: `kumakit/mission-control#344`
- 対象repo: `C:\Users\kumat\dev\bearworks-portal`
- 司令塔repo: `C:\Users\kumat\hub\mission-control`
- 対象branch: `codex/issue-344-phase3-ads-scope`
- 移行開始HEAD: `fe4bd1cc7b0741ebc56d2ebddf750347e5f5301d`
- 司令塔branch / HEAD: `main` / `0eb393d3ba51ebb76112fa5b24ef4729fe21a549`

## 現状と移行理由

- 通常のNext.js buildは成功するが、`@cloudflare/next-on-pages` の変換は複数root layout配下で `Unable to find lambda for route` となる。
- Cloudflare公式はfull-stack Next.jsの配信先としてWorkersとOpenNext adapterを案内している。
- 現行 `@opennextjs/cloudflare@1.20.2` のpeer dependencyはNext.js `>=15.5.21 <16` または `>=16.2.11` であり、現行Next.js 14.2.3は対象外。
- OpenNextはNext.js Node.js Runtimeを利用し、`export const runtime = "edge"` をサポートしない。
- 現在のPages固有設定は `@cloudflare/next-on-pages`、`pages:build`、`setupDevPlatform()`、複数のEdge Runtime指定で構成される。

## 変更方針

1. `next` と `eslint-config-next` を15.5.21へ更新する。React 18はNext.js 15.5.21のpeer範囲内なので本タスクでは維持する。
2. `@cloudflare/next-on-pages` を削除し、`@opennextjs/cloudflare@1.20.2` と `wrangler@4.114.0` を導入する。OpenNext 1.20.2がruntimeで直接importするため `esbuild@0.27.7` も明示依存として固定する。Next、eslint-config、OpenNext、Wrangler、esbuild、lockfileを同一変更単位で更新し、peer warningがないことを確認する。
3. `next.config.mjs` の `setupDevPlatform()` を `initOpenNextCloudflareForDev()` へ置き換える。
4. `open-next.config.ts` を追加し、まず外部R2/D1を必要としない最小構成にする。永続ISR cacheは本サイトの現行要件にないため追加しない。
5. `wrangler.jsonc` にWorker entrypoint、static assets、`nodejs_compat`、`global_fetch_strictly_public`、observabilityを定義する。`workers_dev` と `preview_urls` は明示的に無効化し、Access対象外の公開入口を作らない。既存カスタムドメインへの切替はローカル実装と分離し、route設定やdeployは行わない。
6. `package.json` に `cf:build`、`preview`、`deploy`、`upload`、`cf-typegen` を追加し、`pages:build` を削除する。`deploy` と `upload` はコマンド定義だけ行い、本タスクでは実行しない。
7. すべての `export const runtime = "edge"` を削除し、Next.js Node.js Runtimeへ統一する。
8. `.open-next/`、`.dev.vars*`、生成型をGit管理対象外にし、変数名とダミー値だけを含む `.dev.vars.example` を追加する。生成型がないclean checkoutでも通常buildとWorkers buildが成功する構成にする。
9. `public/_headers` に `/_next/static/*` のimmutable cache headerを追加する。この設定はstatic assets限定とし、SSR/APIのcache/security headerは個別HTTP検査で確認する。
10. Next.js 15対応として、2つのdynamic slug pageと `generateMetadata` を `params: Promise<{ slug: string }>` / `await params` へ必ず変更する。
11. `/api/dashboard-data` のupstream fetchへ10秒のtimeoutを追加し、timeoutを含む失敗時にgeneric errorだけを返すfail-closed動作を維持する。
12. Linuxのclean checkoutでWorkers buildを再現するbuild-only GitHub Actions workflowを追加する。Workers previewを起動して公開route、動的slug、404、AdSense境界、API failure pathも検査する。deploy、実secret、Cloudflare認証は含めない。
13. READMEをCloudflare Workers/OpenNext構成とローカル・Linux CI検証コマンドへ更新する。

## 維持する境界

- AdSense対象は `/` と `/toukei/**` だけとする。
- `/about`、`/ai-news`、`/weather`、`/dashboard/**`、`/contact`、`/privacy`、`/api/*`、404は広告対象に追加しない。
- `/api/dashboard-data` のtoken必須、production時のCloudflare Access header必須、no-store、405制御を維持する。
- 公開URL、metadata、canonical、noindex、sitemap、robots、ads.txtを変更しない。
- Cloudflare Accessの管理画面設定、DNS、custom domain、Pages project削除は行わない。
- Access適用済みcustom domain routeを設定するまで `workers.dev` とversion preview URLは公開しない。

## QA

1. clean checkout相当で `npm ci` を実行し、peer warningなし、生成型なしで依存解決できることを確認する。
2. `npm run build` でNext.js 15のlint/type/buildを確認する。
3. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` なしと検証用publisher IDありの各buildを実行する。値は必ず `npm run cf:build` の前に設定する。
4. `npm run cf:build` で `.open-next/worker.js` と `.open-next/assets` を生成する。
5. `wrangler deploy --dry-run` 相当でWorker bundle、互換フラグ、圧縮後サイズを確認し、外部deployが発生しないことを確認する。
6. `npm run preview` をローカルWorker runtimeで起動し、URL/status、title、description、canonical、robots/noindex、sitemap、robots.txt、ads.txt、静的asset、画像、dashboard 3ページ、dynamic slug正常系/404を移行前の期待値と比較する。
7. `/api/dashboard-data` について、token未設定、Access header未設定、upstream 4xx/5xx/timeout、非GETを検査し、fail-closed、generic error、`Cache-Control: no-store`、405、token/headerのレスポンス・ログ非露出を確認する。実tokenを使う正常200、実Access policy、実upstream到達性は本番切替前の別受け入れとする。
8. publisher IDあり/なしの各成果物でAdSense対象・非対象・404を確認し、最終版を実ブラウザで対象間遷移、root境界、戻る・進む、Network、console errorまで確認する。
9. OpenNext公式のWindows非対応を前提に、Linux clean checkoutまたはCIで `npm ci`、通常build、Workers build、dry-run、preview HTTP/API確認を必須完了条件とする。Windowsだけの成功・失敗では完了扱いにしない。

## 非目標

- Cloudflareへのdeploy、upload、DNS変更、custom domain切替
- Pages projectの削除
- R2/D1/QueueによるISR cacheの導入
- Cloudflare Access policyの変更
- AdSense再審査申請
- Phase 3-1以降のコンテンツ変更
- push、PR、Issueコメント

## リスクと対策

- Next.js 14から15への更新: 通常buildと代表routeのHTTP/metadata比較で回帰を検出する。
- EdgeからNode.js Runtimeへの変更: API fail-closed、外部fetch、no-storeをpreviewで実測する。
- Workers bundle size: dry-runのgzip sizeを記録し、プラン上限を超える場合はdeployしない。
- 既存Pagesとの切替競合: repo変更ではcustom domain routeを設定せず、deploy前に別途切替手順を作る。
- Windows非対応: OpenNext公式の制約に従い、ローカル失敗を無理に回避せずLinux buildを受け入れ条件にする。
- secrets混入: `.dev.vars` と生成env型をignoreし、例示ファイルに実値を置かない。

## 完了条件

- `next-on-pages` の依存・script・設定・Edge Runtime指定が残っていない。
- Next.js 15通常buildとOpenNext Workers buildが成功する。
- Worker bundleのdry-runが成功し、サイズを確認できる。
- Linux clean checkoutのWorkers build・dry-run・previewが成功する。
- Workers previewで主要route、API failure path、AdSense境界、metadata関連の回帰がない。
- 実ブラウザ最終QAが成功する。
- 実装後レビューの重大指摘が解消される。

## 公式参照

- Cloudflare Next.js Workers guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- OpenNext Cloudflare Get Started: https://opennext.js.org/cloudflare/get-started
- OpenNext Cloudflare CLI: https://opennext.js.org/cloudflare/cli
- OpenNext Cloudflare supported runtimes/versions: https://opennext.js.org/cloudflare
