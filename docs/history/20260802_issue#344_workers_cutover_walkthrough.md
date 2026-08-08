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
