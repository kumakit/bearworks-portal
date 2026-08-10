# Issue #344 Workers/OpenNext移行再開 walkthrough

## 対象

- Issue: `kumakit/mission-control#344`
- repo: `C:\Users\kumat\dev\bearworks-portal`
- branch: `codex/issue-344-phase3-ads-scope`
- 実施日: 2026-08-02

## 計画レビュー反映

Sonnetの条件付き承認を `20260802_issue#344_plan_review.md` に保存し、司令塔Codexが実ファイルとCloudflare公式仕様で採否を判断した。

- stagingは `env.staging` / `bearworks-portal-staging` / `staging.bearworks.uk` とした。
- staging hostname全体へのCloudflare Accessをdeploy前提条件とした。
- dashboard APIは `NODE_ENV` に依存せず、全環境でAccess headerを必須にした。
- productionはWorkers Custom DomainへDNS移行せず、既存Pages DNSの前段へWorkers Routeを追加する方針へ変更した。
- Route削除でPagesへ戻すcutover/rollback runbookと、10分の判断期限を作成した。
- 現行Workers Static Assetsは `_headers` をサポートするため、削除せず実レスポンスを検証対象とした。

## Luna担当

Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へSonnet P1/P2、Wrangler環境継承、API環境判定、CI cleanup、`ads.txt`、`_headers`、canonicalを読み取り専用で監査させた。

Lunaの指摘を受け、CIへ次を追加した。

- hashed static assetの200とimmutable `Cache-Control`
- `ads.txt` のproduction publisher行
- preview終了時の `.dev.vars` と `/tmp` 一時ファイルcleanup

Lunaはファイル編集、commit、push、GitHub更新、deployを行っていない。採否と差分は司令塔Codexが再確認した。

## main同期

- fetch後の `origin/main`: `cbbc77a0c99457c13350b47793782e160c3f269b`
- 分岐後の5コミットは `data/news-data.json` だけを変更
- `git merge --no-ff origin/main` を実行し、merge commit `f38da71` を作成
- 競合なし、rebase/force pushなし
- JSONは37日分、486記事、日付重複なし、提供URL重複なし、最新日 `2026-08-02`

## ローカル検証

成功:

- `npm ci`
- `npm run build`（Next.js 15.5.21、32 static pages）
- `npm run cf:build`（OpenNext 1.20.2、Windows非完全互換warningのみ）
- `npx wrangler deploy --dry-run --env=""`
- `npx wrangler deploy --dry-run --env staging`
- production Next serverでroot 200、dynamic guide 200、不存在route 404、`/ai-news` 200・最新日表示
- rootだけAdSenseあり、`/about` と404にAdSenseなし
- `/ads.txt` のpublisher ID、dashboard API 401/405/no-store、token非露出
- OpenNext previewでhashed CSS 200、`Cache-Control: public, max-age=31536000, immutable`
- workflow YAML parse、`git diff --check`

検証用 `.env.local` はdummy publisher IDだけを入れたgitignored一時ファイルとして使用し、検証後に削除した。previewの3100/8788 listenerも停止済み。

## 依存監査

`npm audit --omit=dev` はhigh 3件を報告した。

- Next.js 15.5.21内部のPostCSS 8.4.31
- optional Sharp 0.34.5

npmの自動fix提案はNext.js 9.3.3へのmajor downgradeであり不適切なため実行していない。Next.js 15.5.22も同じPostCSS指定とSharp `^0.34.3` のため、未検証overrideも行っていない。production cutover前にadvisory、runtime到達性、公式修正版を再確認し、未評価のまま進めない。

## Linux CIとOpenNext SSG修正

branchをpushしてDraft PR #4を作成した。最初のLinux clean-checkout Actions run `30751272134` では、Next.js build、OpenNext build、Wrangler dry-runまでは成功したが、Workers previewの `/toukei/guides/learning-roadmap` が404となった。

OpenNext公式Issue #695と現行のSSG cache構成を照合し、`generateStaticParams()` で生成したページをWorkers Static Assetsから読み出すincremental cacheが未設定であることを原因と判断した。`open-next.config.ts` へ次を追加した。

- `static-assets-incremental-cache`
- `enableCacheInterception: true`

repo内にISR、時間ベース再検証、`revalidatePath`、`revalidateTag` の利用がないため、再検証をサポートしない読み取り専用cacheで要件を満たす。将来ISRを導入する場合はR2、Queue、Tag Cacheを含む構成へ見直す。

Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` にこの判断を読み取り専用で再監査させ、採用可、リスク中、Linux clean-checkout必須との判定を得た。司令塔Codexは依存解決、全差分、ローカルbuild、dry-run、preview routeを独立に確認した。

再発防止としてLinux CIへ次を追加した。

- 有効なguide/problem slugを2回取得し、cache interception後も200であること
- 無効なguide/problem slugが404であること
- 無効slugの404にAdSense client IDが含まれないこと

修正commit `0cd431d` をpush後、Actions run `30752064048` は1分50秒で成功した。Next.js build、OpenNext build、Wrangler dry-run、Workers previewのroute、AdSense境界、static asset header、dashboard API 401/405/no-storeがすべて通過した。

外部のCloudflare Pages checkは失敗したままだが、これは削除済みのPages build commandを参照する旧Pages連携であり、GitHub ActionsのWorkers buildとは分離した。既存production Pagesの停止・削除、本番Workers deploy、route変更は行っていない。

## 未実施

- Issue #344への今回のpush・Linux CI結果コメント
- Cloudflare Access/DNS/secretの画面確認
- staging deployと受け入れ
- production Worker deploy、Workers Route追加、公開QA
- Pages停止・削除

次のゲートはCloudflare Accessを先行設定したstaging deployと受け入れであり、本番切替には改めてユーザー承認が必要である。

## 2026-08-04 staging初回受け入れとIMAGES warning修正

Cloudflare Accessをhostname全体へ先行設定し、`bearworks-portal-staging` を `staging.bearworks.uk` へdeployした。確認時のWorker versionは `7422e1a4-9d1b-4284-8905-5ef9011ac0a6`。dashboard API用secretはbinding名だけを確認し、値は表示・記録していない。

Access経由のstaging受け入れでは、公開route、AdSense境界、dashboard API、Worker observabilityを確認した。Worker errorsは0で、secret、Access JWT、upstream本文のlog非露出も確認した。一方、header iconのリクエストごとに `env.IMAGES binding is not defined` が記録された。画像自体はOpenNextのfallbackで表示されるが、Cloudflare Images bindingは設定されていなかった。

Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へ、`next/image` 利用箇所、OpenNext fallback、課金を伴わない最小修正、Linux CI回帰条件を読み取り専用で監査させた。repo内の `next/image` はheader iconの1箇所だけで、静的な `public/icon.png` にはcomponent単位の `unoptimized` が適切との判定を得た。Lunaはファイル編集、Git操作、deploy、外部サービス更新を行っていない。

司令塔Codexは `components/PublicSiteHeader.tsx` のiconだけを `unoptimized` 化し、Linux CIへ次の回帰検査を追加した。

- root HTMLが `src="/icon.png"` を直接参照する
- root HTMLに `/_next/image` が含まれない
- `/icon.png` が200かつ `image/png` である
- preview logに `env.IMAGES binding is not defined` が出ない

修正後、`npm run build`、`npm run cf:build`、production/staging両方のWrangler dry-runに成功した。Next/OpenNext生成物でも直接 `/icon.png` を参照し、`/_next/image` を使用しないことを確認した。commit `7e7662a` に対するLinux clean-checkout Actions run `30859325094` も1分43秒で成功し、追加したicon直接配信とpreview warning非発生の回帰検査を通過した。stagingの再deployと実環境でのwarning消失確認は次ゲートとして未実施である。

## 2026-08-08 staging再deployと受け入れ

作業再開時にIssue #344、Draft PR #4、branch、Cloudflare認証、DNS、Access 302、staging secret binding名を再確認した。Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へ再deploy後のAccess、画像経路、API、AdSense、log、rollback条件を読み取り専用で再監査させ、HEAD `0d2560a` のstaging再deployはGO、実環境受け入れ完了まではproduction NO-GOとの判定を得た。

公開AdSense IDをbuild時だけ設定して `npm run cf:build` を実行し、OpenNext bundleとstaging dry-runを再確認した。`bearworks-portal-staging` だけを再deployし、custom domainは `staging.bearworks.uk` のまま、新version `bc471f8f-69e5-4564-9907-bb49c8be52d1` へ100%切り替わった。production Worker `bearworks-portal` は存在せず、既存 `https://bearworks.uk/` はHTTP 200を維持している。

認証済みstagingで次を確認した。

- root header iconは `src="/icon.png"`、`/_next/image` 利用0件
- rootと `/toukei`、有効guide/problemはAdSense scriptあり
- `/about`、一般404、無効guide/problemはAdSense scriptなし
- 有効dynamic slugは正しいtitle/h1、無効slugは404
- dashboardが実データを表示し、Worker log上の `/api/dashboard-data` は200
- 未認証アクセスはAccessへ302、認証済みrequestのAccess JWT/cookie/emailはtail上でREDACTED

新versionのtail 9イベントを集計し、IMAGES binding warning 0、exception 0、non-ok outcome 0、5xx 0、`DASHBOARD_API_TOKEN` 文字列0、Bearer文字列0を確認した。旧versionのeventは0件だった。ブラウザconsoleには既知のRecharts width/height warningが1件残るが、IMAGES binding修正とは無関係で、dashboard表示とAPI成功を妨げていない。採取した一時logは確認後に削除し、QA用tailプロセスもすべて停止した。

再開時のfetchで `origin/main` は `d26b232` まで進んでおり、前回基準 `cbbc77a` 以降の6commitはすべて `data/news-data.json` のAIニュース更新だった。production cutover前に通常merge、Linux clean-checkout CI、依存監査の再評価を行う。今回、production route、Pages、DNS、Issue、PR、remote branchは変更していない。

## 2026-08-08 main再同期とcutover前検証

Issue #344の最新状態とbranchを再確認し、Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へ `origin/main` 同期の競合、AIニュースJSON、AdSense・Access・Workers境界への影響を読み取り専用で監査させた。Lunaは通常mergeをGOと判定し、ファイル編集、Git/GitHub操作、deploy、Cloudflare操作を行っていない。

`cbbc77a` 以降のmain側6commitが `data/news-data.json` だけを変更し、feature側は同ファイルを変更していないことを司令塔Codexが再確認した。`git merge --no-ff origin/main` を実行し、merge commit `2206e3a` を作成した。競合、rebase、force pushはない。

再同期後のJSONは次のとおり検証した。

- 43日分、546記事、最新日 `2026-08-08`
- 日付降順、日付重複なし
- URLのある464記事はすべてHTTP(S)形式、URL重複なし
- 追加日 `2026-08-03` から `2026-08-08` は6日・60記事
- 追加分は各日10記事で、title、content、source、published_at、url、categoryがすべて存在
- 追加分のpublished_atは所属日付と一致
- 旧記事に存在する任意fieldの省略は、`NewsGroup` / `Article` の型定義上許容されるため変更していない

ローカルでは公開AdSense IDをprocess環境だけへ設定し、`npm run build`、`npm run cf:build`、production/staging両方のWrangler dry-run、`git diff --check` に成功した。sandbox内のOpenNext/Wrangler初回実行はWindowsのディレクトリアクセス拒否とWrangler log作成EPERMで停止したが、同じコマンドの権限付き再実行は成功したため、アプリ・設定の失敗ではない。Linux clean-checkout CIを最終判定にする。

`npm audit --omit=dev` はhigh 4件を報告した。内訳は直接依存のNano ID 3系、Next.js 15.5.21同梱PostCSS、Sharpである。監査の自動fixは一部でNext.js 16.3.0へのbreaking changeを含むため実行していない。本番切替判断ではruntime到達性と公式修正版を再確認する。production deploy、route、Pages、DNS、staging、Issue、PR metadataは変更していない。

main同期と検証記録を含むHEAD `bc16db0` を通常pushし、Draft PR #4の `pull_request` synchronizeでLinux clean-checkout Actions run `31260322740` を起動した。runは1分51秒で成功し、`npm ci`、Next.js build、OpenNext Workers bundle、Wrangler bundle検証、Workers preview route回帰検査がすべて通過した。`actions/checkout@v4` と `actions/setup-node@v4` のNode.js 20 deprecation annotationが1件あるが、job失敗ではなく将来のActions runtime更新事項として分離する。

このCI結果だけを記録したdocs-only HEAD `3228cde` でもActions run `31260451402` が1分46秒で成功し、同じLinux clean-checkout検査を完走した。

## 2026-08-09 Next.js 16.3依存修正

production cutover前の依存監査high 4件を解消するため、Next.jsを15.5.21から16.3.0へ更新した。Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へ、削除API、async request API、OpenNext互換性、動的route、CI検証範囲の読み取り専用監査を委譲した。Lunaはファイル編集、Git/GitHub操作、deploy、Cloudflare操作を行っていない。

司令塔Codexは公式Next.js 16移行ガイド、npm package metadata、repo内コードを再確認し、次の最小範囲を採用した。

- `next`: 15.5.21から16.3.0
- `eslint-config-next`: 15.5.21から16.3.0
- `eslint`: 8系から9.39.5
- 削除された `next lint` を `eslint .` と `eslint.config.mjs` へ移行
- 内部root link 3箇所を `next/link` へ移行
- Next 16で新規検出された既存のeffect内state更新はwarningとして可視化し、dashboardの非同期処理変更は別変更へ分離
- `next build` がlintを実行しないため、Linux workflowへ明示的lint stepを追加
- Next 16が必須更新した `tsconfig.json` の `jsx: react-jsx` と `.next/dev/types/**/*.ts` を採用

React 18.2以上はNext 16.3.0のpeer範囲内で、現行buildも成功した。今回の目的はproduction依存high 4件の解消とNext 16.3移行であるため、React 19へのmajor更新は同時に含めていない。OpenNext 1.20.2はNext `>=16.2.11` をpeer範囲に含むため維持した。

ローカル検証結果:

- Node.js 24.14.1 / npm 11.11.0で `npm ci` 成功
- `npm run lint` 成功（error 0、既存warning 4）
- Next.js 16.3.0 Turbopack build成功（31 static/SSG pages、dashboard API dynamic）
- OpenNext 1.20.2 Workers bundle生成成功
- production/staging両方のWrangler dry-run成功（gzip 1573.51 KiB）
- Nano ID 3.3.18、PostCSS 8.5.23、Sharp 0.35.3へ解決
- `npm audit --omit=dev` は0件
- 全依存監査はdev-onlyでlow 1、moderate 2、high 2が残る。Wrangler/miniflare/undici、esbuild、build tooling経路であり、production runtime依存0件と分離して記録した
- `git diff --check` はerrorなし

WindowsのOpenNext runtimeは引き続き非完全互換である。Next 16.3更新後のAdSense境界、dynamic slug 2回取得、404、API 401/405/no-store、static asset header、IMAGES warning非発生は、push承認後のLinux clean-checkout CIを最終判定とする。この作業ではpush、Issue/PR更新、deploy、Cloudflare、production route、Pages、DNSを変更していない。

push前にLunaへcommit `95ff273` とLinux workflowを再監査させ、package/peer整合とpush readinessはGO、Linux CI未実行のためproductionはNO-GOとの判定を得た。司令塔Codexは指摘を実workflowと照合し、今回Linkを変更した `/ai-news`、`/dashboard`、`/weather` のHTTP 200とAdSense非掲載、ならびにstaging設定のWrangler dry-runをLinux workflowへ追加した。認証済みdashboard API 200はsecretと実Accessを必要とするためCIへ持ち込まず、staging実環境の別ゲートとして維持する。

push直前のfetchで `origin/main` が `1f40644` へ進んでいることを検出した。追加1commitは `data/news-data.json` のAIニュース更新だけで、Next 16変更とは非重複だった。JSONを44日・556記事、最新日 `2026-08-09`、日付重複0として検証し、rebaseやforce pushを使わず通常merge `4b2dcd1` で取り込んだ。最新main込みのNext 16.3 Turbopack buildは31ページを正常生成した。

Next 16.3更新、Linux CI拡張、最新main同期、検証記録を含むHEAD `eff46bf` を既存branchへ通常pushした。Draft PR #4の `pull_request` synchronizeでLinux clean-checkout Actions run `31296166925` が起動し、1分15秒で成功した。

- Node.js 22で `npm ci` とESLint flat config lintに成功
- Next.js 16.3.0 Turbopack buildとOpenNext 1.20.2 bundle生成に成功
- production/staging両方のWrangler dry-runに成功
- root、dynamic guide/problem、無効slug、404、ads.txt、robots、sitemapを確認
- `/about`、`/ai-news`、`/dashboard`、`/weather` の200とAdSense非掲載を確認
- icon直接配信、static asset immutable header、dashboard API 401/405/no-store、token非露出、IMAGES warning非発生を確認

annotationはGitHub Actions v4のNode.js 20 runtime非推奨と、既存の統計ページ内 `<img>` warningの2件で、job failureではない。CI成功はproduction cutover承認ではなく、Next 16.3移行のLinux build/preview gate通過として扱う。

## 2026-08-09 Next.js 16.3 staging再deployと受け入れ

Next.js 16.3更新後のstaging実環境ゲートを進めた。Luna task `019fc2ae-34be-7151-ac8d-26355f135c26` へ、staging設定、Access、secret binding、検証route、rollback条件を読み取り専用で再監査させた。Lunaはstaging限定deployを条件付きGO、productionをNO-GOと判定し、ファイル編集、Git/GitHub操作、deploy、Cloudflare操作は行っていない。

司令塔Codexはsecret値を取得せずbindingの存在だけを確認した。deploy前の未認証HTTP確認ではroot、`/dashboard`、`/api/dashboard-data` がCloudflare Accessへ302となり、staging hostname全体の保護を確認した。公開AdSense IDはprocess環境だけへ設定し、Next.js 16.3 / OpenNext 1.20.2のbundleを再生成した。staging dry-run成功後、`bearworks-portal-staging` だけを再deployした。既存staging versionをrollback基準として保持し、production Worker、production route、Pages、DNS、Issue、PRは変更していない。

認証済みstagingで次を確認した。

- root、`/toukei`、有効guide/problemは正しいtitle/h1を表示し、AdSense scriptあり
- 有効guide/problemは同一slugを2回取得して正常表示、無効slugは404かつAdSense scriptなし
- `/about`、`/ai-news`、`/dashboard`、`/weather`、`/contact`、`/privacy` は正常表示かつAdSense scriptなし
- `/ai-news` は最新日 `2026-08-09` を表示
- dashboardはloadingやfallbackに留まらず実データ画面まで表示
- rootは `/icon.png` を直接参照し、`/_next/image` を使用しない
- fresh tabでroot、dashboard、dynamic guide、about、weatherを再確認し、deploy切替時に旧tabで一度発生したRSC payload失敗は再現しなかった

fresh tabのconsoleには既知のRecharts width/height warningと、外部weather API失敗時にmock fallbackを使った記録が残った。どちらも画面表示を妨げていないが、weather実データ経路は別の運用確認事項として残す。ブラウザ側のブロッカーにより `/ads.txt`、`/robots.txt`、`/sitemap.xml` の直接navigationは確認できなかったため、最終HEADのLinux clean-checkout Actions run `31296262750` で通過した内容・status検査を根拠とした。

Worker tailは2回起動して主要routeへrequestを発生させたが、今回のセッションではイベントを取得できなかった。そのため、Next.js 16.3版についてIMAGES warning、exception、5xx、secret・Access情報非露出のlog検査は未確認であり、production cutover前の残ゲートとする。Access bypass、5xx、主要画面不成立は観測されなかったためstagingはrollbackせず維持するが、productionは引き続きNO-GOである。

## 2026-08-09 Next.js 16 RSC prefetch増幅の検出と抑制

Linux CI成功後にWorker tailを再試行したところ、認証済みstagingはアプリ画面ではなくCloudflareのplan limit画面を返した。未認証の単発HTTP確認はAccessへ302となる一方、認証済みrequestはWorker到達前に停止されるため、Wrangler tailにはイベントが出なかった。

Cloudflare管理画面を設定変更なしで読み取り確認し、Free planのaccount-wide request枠が `487,177 / 100,000`、staging Worker単体が約487k invocation・約481k asset requestとなっていることを確認した。新staging versionのメトリクスはinvocation error 0、asset 4xx/5xx 0だったが、request rateは約180 req/sまで増加していた。これは機能成功ではなく、可用性と利用量の重大な回帰として扱う。

Workers Observabilityは日次イベント上限超過により1% samplingへ縮退していた。取得済みイベントではroot、`/toukei`、`/toukei/guides`、`/toukei/problems`、`/dashboard/gcp`、`/dashboard/cloudflare` への `?_rsc=` GETが短時間に反復し、error eventは `Network connection lost.` だった。secret、JWT、Bearer、IMAGES binding warningは表示中のsampleにはなかったが、全量観測ではないため非露出・warningなしの最終証明には使用しない。

開いたままの前回QA tabを確認すると、rootとdashboardの2tabが残っており、Observabilityの2系統のRSC request集合と一致した。両tabを閉じ、上限リセット後に同じclientが自動prefetchを再開しないよう停止した。Cloudflare plan、billing、Worker、Access、DNS、domain、deploy設定は変更していない。

repo内には `router.prefetch`、`router.refresh`、timer/polling loopがなく、反復routeはviewport内の `next/link` 集合と一致した。Next.js 16はnavigation/prefetch方式を変更し、公式移行ガイドでも個々のprefetch requestが増える場合があるとしている。公式のresource使用量抑制手段である `prefetch={false}` を全内部Linkの既定値とする `components/InternalLink.tsx` を追加し、既存Link importをこの共通componentへ置き換えた。クリック時のclient-side navigationは維持し、自動RSC prefetchだけを停止する。

再発防止としてLinux workflowへ次を追加した。

- `next/link` の直接importを `components/InternalLink.tsx` だけに限定
- 共通componentの `prefetch = false` とNextLinkへのprop伝播を検査
- Next build生成RSC payloadに `"prefetch":false` が含まれることを検査

ローカルではESLint error 0（既存warning 4）、Next.js 16.3 Turbopack build、OpenNext 1.20.2 bundle、staging Wrangler dry-runに成功した。生成RSC payloadでも全内部Linkの `prefetch:false` を確認した。production cutoverはNO-GOのままであり、次はLinux clean-checkout CI、Cloudflare日次枠リセット後のstaging deploy、単一tab・無操作10分でRSC requestが収束すること、tail/Observabilityの秘密値非露出とruntime warning非発生を確認する。

commit `468206e` を既存feature branchへ通常pushし、Draft PR #4のsynchronizeでLinux clean-checkout Actions run `31311829518` を実行した。runは1分14秒で成功し、`npm ci`、ESLint、Next.js 16.3 build、internal Link prefetch policy、OpenNext bundle、production/staging dry-run、Workers preview route回帰をすべて通過した。

新しいpolicy stepでは、`next/link` の直接importが共通componentだけであること、`prefetch = false` の既定値とprop伝播、生成RSC payloadの `"prefetch":false` を確認した。annotationはActions v4のNode.js 20 runtime非推奨と、既存の統計ページ内 `<img>` warningの2件で、今回のprefetch抑制失敗ではない。CI成功はquota reset後のstaging runtime受け入れやproduction cutover承認を代替しない。

## 2026-08-10 request枠回復後のstaging再deployとアイドル観測

Cloudflare Access認証後の `staging.bearworks.uk` がplan limit画面ではなくアプリrootを返すことを確認し、日次request枠の遮断が解消したと判断した。commit `761dea7` をfeature branchへpushし、Draft PR #4で起動したLinux clean-checkout Actions run `31387999437` は、prefetch policyを含む全stepに成功した。

staging secretは名前の存在だけを確認して値を取得せず、`wrangler deploy --dry-run --env staging`、Next.js 16.3 / OpenNext 1.20.2 buildを通した。続いて `--env staging` を明示して `bearworks-portal-staging` のみにdeployした。production Worker、route、DNS、Pages、Access policy、billing設定は変更していない。

認証済みrootを単一tabで再読込し、11分7秒無操作で保持した。Worker tailには観測開始後の追加requestイベント、error、反復 `?_rsc=` requestが出ず、root画面も観測終了時まで正常だった。観測開始前のCloudflare Access OAuth遷移で発生したbrowser consoleの中断記録は、stagingアプリruntimeのerrorとは分離した。

runtime smokeではroot、AIニュース、weather、有効guideの表示と無効guideの404を確認し、smoke中のWorker errorは0件だった。dashboardはページ到達とtitleまでを確認し、非公開データ本文は読み取っていない。tailに通常event自体が出なかったため、Observability eventでのIMAGES warning、exception、5xx、secret/JWT/Bearer非露出の再確認は残ゲートとする。RSC prefetch増幅の再発は確認されなかったが、production cutoverは引き続きNO-GOである。

その後Cloudflare Worker Observabilityの通常eventを読み取り確認した。1時間表示ではRSC反復群と唯一の `Network connection lost.` errorが新version切替直前に集中し、切替後はrootの単発requestと実施済みsmoke routeだけだった。Worker概要の直近24時間metricsもinvocationが前日比96.74%減、error 0を示した。

直近15分へ絞ると、dashboard、AIニュース、weather、有効guide、無効guide、favicon、rootの7件がSuccess、Errors 0だった。表示event内の `?_rsc=`、IMAGES warning、exception、`Network connection lost.`、secret、JWT、Bearer、Authorizationはいずれも0件で、prefetch抑制版への切替後にRSC増幅とruntime errorは再発していない。秘密値そのものは取得・表示していない。これによりstagingのprefetch回帰ゲートは完了とするが、production Pages baseline、production Worker/secret/Access/route preflight、rollback再確認、ユーザー承認は未完了のためproduction cutoverはNO-GOを維持する。

staging受け入れ記録commit `7afb66d` はfeature branchへ通常pushし、Draft PR #4で起動したLinux clean-checkout Actions run `31389639132` も全stepに成功した。

## 2026-08-10 production cutover事前確認

staging Observability受け入れ記録を含むHEAD `011fa45` をfeature branchへ通常pushした。GitHub上のbranch HEADが同じcommitを指すことを確認し、Draft PR #4のsynchronizeで起動したLinux clean-checkout Actions run `31390194200` は、ESLint、Next.js 16.3 build、internal Link prefetch policy、OpenNext Workers bundle、production/staging bundle、Workers preview routeの全stepに成功した。

既存production Pagesを切替前baselineとして読み取り確認した。root、AIニュース、weather、有効guideは200、無効guideは404、dashboardとdashboard APIはCloudflare Accessへ302かつ `Cache-Control: no-store` だった。`ads.txt`、`robots.txt`、`sitemap.xml` は200で、publisher行、production sitemap参照、production originを確認した。秘密値、Access token、内部IDは取得・記録していない。

現行PagesのHTMLは、rootと `/toukei` 系だけでなく、AIニュース、weather、contact、privacy、無効guideの404を含む確認対象すべてでAdSense scriptを出力していた。これはcutover後の期待状態ではなく、Workers版で非対象routeと404からscriptが消えることを確認するための差分baselineとして記録する。

Cloudflare dashboardではproduction Workers Routeが未設定で、既存Accessのself-hosted applicationが `/dashboard` と `/api/dashboard-data` を保護していることを読み取り確認した。Wranglerでもproduction Workerは未作成のため、production secret bindingはまだ登録・確認できない。既存Pages、DNS、Access policy、production Worker、secret、routeには変更を加えていない。

Lunaの独立監査と司令塔Codexの再検証はいずれも、`011fa45` のpush scopeはGO、production cutoverはNO-GOで一致した。次の安全な順序は、別途本番変更承認後にproduction Workerをrouteなしでdeployし、version・secret binding・Access・rollback担当を再確認した後、さらにroute追加の実行条件を満たしてから `bearworks.uk/*` を接続することである。
