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
