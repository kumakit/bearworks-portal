# Issue #344 Workers/OpenNext本番移行 手動計画レビュー依頼

## レビュー先

SonnetまたはGemini Proで、以下を読み取り専用レビューしてください。実装、Git/GitHub操作、Cloudflare変更、デプロイは行わないでください。

## 背景

`bearworks.uk` は現在Cloudflare Pages上のNext.js/next-on-pages構成で公開されています。AdSense掲載範囲を `/` と `/toukei/**` に限定する変更と、Cloudflare Workers/OpenNextへの移行コードはfeature branchへ実装・push済みです。

- Issue: `kumakit/mission-control#344`
- repo: `kumakit/bearworks-portal`
- branch: `codex/issue-344-phase3-ads-scope`
- feature HEAD: `a8c376d1e880af1e80c3c213b7558d4fd377e8cd`
- latest main: `cbbc77a0c99457c13350b47793782e160c3f269b`
- main側の後発変更: `data/news-data.json` のAIニュース更新5件のみ

## 実装済み

- Next.js 15.5.21 / OpenNext Cloudflare 1.20.2 / Wrangler 4.114.0
- `@cloudflare/next-on-pages` とEdge Runtime指定を削除
- monetized/non-monetized root layout分離
- `workers_dev: false` / `preview_urls: false`
- dashboard APIのfail-closed、no-store、405、10秒timeout、generic error
- Linux build-only workflowとWorkers preview smoke
- ローカルbuild、OpenNext build、Wrangler dry-run、ブラウザAdSense境界、API failure path確認

未完了なのはLinux CI、staging、secret/Access/custom domain/DNS、production cutover、rollback、公開QAです。

## 計画

`docs/task/issue-344/implementation_plan.md` をレビューしてください。

実行順序案:

1. 本レビュー完了
2. feature branchへ最新mainを通常merge
3. ローカル再検証
4. ユーザー承認後にpush
5. PRでLinux CI
6. Access保護済みstaging hostnameへWorkersを展開
7. staging公開QA
8. production Worker/secret/Access/rollback再確認
9. root custom domain/route切替
10. 即時公開QAと観測
11. 問題時はPagesへrollback
12. 安定確認・別途承認後にPages停止

## 必須レビュー観点

### 1. staging方式

- `workers_dev` とversion preview URLを無効化したまま、どのWorker environment/hostnameでstaging受け入れを行うべきか
- staging hostnameへCloudflare Accessを先に適用できるか
- stagingとproductionのWorker名、route、secretを誤接続しない構成か

### 2. Cloudflare Access

- `/dashboard/**` と `/api/dashboard-data` の保護がcustom domain切替後も維持されるか
- `cf-access-jwt-assertion` の存在確認だけに依存せず、Accessを外側の認証境界として保証できるか
- Access対象外の公開入口が残らないか

### 3. Secret

- `DASHBOARD_API_TOKEN` の登録、更新、rollback、ログ非露出手順
- staging/production secretの分離
- AdSense IDをsecretと誤認しないbuild-time設定

### 4. custom domain / DNS

- Workers routeとPages custom domainの競合
- route優先順位、CNAME/DNS、証明書、TTL
- rootとサブパスの切替単位
- 切替中に到達不能や二重配信が起きない手順

### 5. rollback

- Workers route解除またはversion rollbackからPages復帰までの具体的操作
- rollbackに必要なPages設定を保持しているか
- キャッシュ影響と復帰確認URL
- どの症状・閾値で即時rollbackするか

### 6. 公開QA

- root、統計route、dynamic slug、非広告route、404
- AdSense対象/非対象境界
- dashboard API正常系、401/405/500、no-store、秘密値非露出
- metadata、canonical、robots/noindex、sitemap、ads.txt
- HTTPS、証明書、Access redirect、console/log

### 7. Pages停止

- Workers安定確認前にPagesを停止しない計画か
- 必要な観測期間と完了条件
- Pages停止とproject削除を分離しているか

## 回答形式

日本語で次を返してください。

1. P0/P1/P2指摘
2. 欠けている前提またはCloudflare設定
3. staging方式の推奨
4. cutoverとrollbackの修正版手順
5. 実行開始可否（承認 / 条件付き承認 / 差し戻し）

機密情報、token、secret実値は回答へ含めないでください。
