# Issue #344 Workers/OpenNext staging・本番切替runbook

## 原則

- secret実値、Access token、JWTをこの文書・Issue・PR・ログへ残さない。
- `workers_dev: false` と `preview_urls: false` を維持する。
- stagingはhostname全体をCloudflare Accessで保護してからdeployする。
- productionは既存PagesのDNS/CNAMEとprojectを維持し、その前段へWorkers Routeを追加する。
- production切替時にWorkers Custom DomainへDNSを移さない。rollbackはRoute削除でPagesへ戻す。
- deploy、Access、Route、Pages停止はそれぞれ別ゲートとし、対象を画面上で再確認する。

## Gate 5: staging

対象は `staging.bearworks.uk`、Workerは `bearworks-portal-staging` とする。

### deploy前のCloudflare確認

1. Zero Trust > Access > Applicationsで `staging.bearworks.uk/*` 全体を保護するApplicationを作成する。
2. 許可policyと利用者を確認し、公開bypass policyがないことを確認する。
3. DNSに同名CNAMEが既にないことを確認する。既存レコードがある場合はdeployせず競合を解消する。
4. productionの `bearworks.uk` 用Access Applicationを変更していないことを確認する。

### secretとdeploy

実値は対話入力し、shell履歴やログへ展開しない。

```powershell
npx wrangler secret put DASHBOARD_API_TOKEN --env staging
npm run cf:build
npx wrangler deploy --env staging
npx wrangler deployments list --env staging
```

`wrangler.jsonc` の `env.staging.routes` はCustom Domainである。deployによりDNSと証明書が作られるため、Access設定より先に実行しない。

### staging受け入れ

- 未認証アクセスはrootを含む全pathでAccess loginへ遷移する。
- 認証後に `/`、`/toukei`、有効なguide/problem slugが200、存在しないrouteが404になる。
- `/api/dashboard-data` はAccess通過後だけ到達し、Access headerなしの直接試験は401になる。
- `/` と `/toukei/**` だけにCI用または確認用publisher IDが出力され、`/about` と404には出力されない。
- `/ads.txt` はproduction publisher IDを返す。stagingはAccessで遮断するためクローラー公開対象にしない。
- canonical、metadataBase、robots、sitemapは意図的に `https://bearworks.uk` を指す。
- `/_next/static/*` の `Cache-Control` を実測する。`public/_headers` はWorkers Static Assetsでもサポートされるが、OpenNext生成物への反映は実環境で確認する。
- Worker logにsecret、JWT、upstream bodyがない。

1項目でも満たさない場合はGate 6へ進まない。stagingの停止はCloudflare dashboardでCustom Domainを削除し、必要ならWorker deploymentを残したまま調査する。

## Gate 6: production事前準備

### Pagesと公開状態の記録

次の応答header、status、確認時刻をwalkthroughへ保存する。

```powershell
curl.exe -I https://bearworks.uk/
curl.exe -I https://bearworks.uk/toukei
curl.exe -I https://bearworks.uk/dashboard
curl.exe -I https://bearworks.uk/ads.txt
```

Cloudflare dashboardで次を記録する。

- Pages projectが存在し、最新成功deploymentが利用可能である。
- `bearworks.uk` の現在のproxied DNS recordとPages custom domain状態。
- `bearworks.uk/dashboard*` と `bearworks.uk/api/dashboard-data` を保護するAccess Application/policy。
- rollback操作者とcutover開始時刻。

### production Workerを非公開状態で準備

```powershell
npx wrangler secret put DASHBOARD_API_TOKEN
npm run cf:build
npx wrangler deploy
npx wrangler deployments list
npx wrangler secret list
```

top-level設定にはroute/custom domainがなく、`workers_dev` とpreview URLも無効のため、この時点では公開経路を追加しない。

## Cutover

1. Cloudflare dashboard > Workers & Pages > `bearworks-portal` > Settings > Domains & Routesを開く。
2. Workers Routeとして `bearworks.uk/*` を追加する。Custom Domainは追加せず、既存Pages DNS/CNAMEを変更・削除しない。
3. 追加時刻を記録し、5分以内にsmoke testを開始する。
4. 10分以内に次をすべて完了する。
   - `/`、`/toukei`、有効なdynamic slugが200。
   - 不存在routeが404。
   - dashboardとAPIのAccess保護、API 401/405/no-storeを確認。
   - `/ads.txt`、metadata、robots、sitemapを確認。
   - `/` と `/toukei/**` のみAdSenseあり、`/about` と404にはなし。
   - runtime error、TLS error、secret/JWT/upstream body漏洩がない。

## Rollback

### 即時rollback条件

- root/主要route/dynamic slugの5xxが連続3回、または30秒以上継続。
- 意図しない404、Access迂回、dashboardデータ露出、secret/JWT漏洩、広告境界違反、TLS不整合を1件検出。
- cutover開始から10分以内にsmoke testを完了できない。

### Pagesへ戻す操作

1. Cloudflare dashboard > Workers & Pages > `bearworks-portal` > Settings > Domains & Routesで `bearworks.uk/*` のWorkers Routeだけを削除する。
2. Pages project、Pages custom domain、既存DNS recordは変更しない。
3. 1〜2分待ち、上記4本の `curl.exe -I` を再実行する。
4. 記録済みPages応答との差分、Pages deployment、公開HTMLを確認して復帰を判定する。
5. 必要な場合だけキャッシュpurgeを行う。purgeは別の外部書き込みとして対象zoneを再確認する。

Route削除で復帰しない場合のみ、cutover前に記録したDNS/Pages custom domain状態と比較して復元する。自動的にDNSが戻るとは仮定しない。

### Worker versionだけ戻す操作

Routeを維持したまま直前Worker versionへ戻す場合に限り、deployment IDを確認して実行する。

```powershell
npx wrangler deployments list
npx wrangler rollback <DEPLOYMENT_ID>
```

Access迂回、漏洩、DNS/TLS障害ではversion rollbackを選ばず、Workers Route削除でPagesへ戻す。secret漏洩時はRoute削除後に該当secretを無効化・再登録する。

## Gate 7

cutover後24時間以上、主要route、Access、API、AdSense境界、Worker errorを観測する。問題がない場合もPages停止は自動実行せず、ユーザーの別途承認を得る。Pages project削除はさらに後段とする。
