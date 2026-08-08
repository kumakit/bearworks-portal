# Issue #344 Workers/OpenNext本番移行 手動計画レビュー結果

レビュー日: 2026-08-02
対象: `docs/task/issue-344/implementation_plan.md`
branch: `codex/issue-344-phase3-ads-scope` (HEAD: `a8c376d`)

---

## 1. P0/P1/P2 指摘

### P0（ブロッカー）

なし。コード自体の安全境界は適切に実装されている。

---

### P1（本番移行前に必ず解消）

#### P1-1: staging方式が未確定のまま Gate 5 に進もうとしている

`implementation_plan.md` の Gate 5 は「手動レビューで承認された方式に従い」と記載しているが、**その方式がこの計画書には書かれていない**。`wrangler.jsonc` に `environments` ブロックが存在せず、staging Worker 名・custom domain・secret の登録先が定義されていない。Access 保護済みの staging hostname を作る具体的手順が実行時に初めて決まる状態であり、Gate 5 前に書面として決定しておく必要がある。

#### P1-2: dashboard API の JWT header 確認が production 環境変数依存

`route.ts` L35–50 の Access header チェックは `process.env.NODE_ENV === "production"` に依存している。Wrangler Workers のデプロイでは `NODE_ENV` は `"production"` になるが、staging environment（同一 Worker 名で別 environment）でも同じ制御になる。**staging の `.dev.vars` や environment variable に `NODE_ENV=production` がセットされない場合、staging では Access header チェックが skip される**。staging が Access 保護済みであっても、Worker ロジック上の保護が本番と異なる状態でテストすることになる。

#### P1-3: rollback 操作の具体的コマンドが未記載

Gate 6 の手順 6 に「Workers routeを解除しPagesへ戻す」とあるが、具体的に何をどの順序で実行するか記載がない。cutover 後に即時判断を要する局面で手順を考える時間はない。**実行前に操作コマンド（wrangler rollback / dashboard UI 操作 / DNS TTL 待ち時間）を書面化しておく必要がある**。

---

### P2（推奨修正・改善）

#### P2-1: `_headers` ファイルは Workers では機能しない

`public/_headers` に `/_next/static/*` の immutable キャッシュを設定しているが、**この形式は Cloudflare Pages 専用**の設定であり、Workers ではリクエストインターセプターを経由するため `_headers` は自動適用されない。OpenNext がアセット配信に使う `ASSETS` バインディングは Cloudflare の静的アセットサービスを経由するため、実際の挙動を staging で実測してキャッシュヘッダーが適切に付与されているか確認が必要。

#### P2-2: CI workflow が最後まで書かれているか確認が必要

`workers-build.yml` は 119 行で終わっているが、`cleanup` trap と `preview_pid` の kill がファイル末尾にあるか確認できなかった（ファイルが 119 行で完結している可能性 vs 切れている可能性）。CI が正常終了しても cleanup が走らずプロセスがゾンビになるケースがないか確認する。

#### P2-3: `ads.txt` に本番 publisher ID が平文でコミットされている

`public/ads.txt` の `pub-9560028085973137` は公開情報であり secret ではないが、**AdSense publisher ID は `NEXT_PUBLIC_ADSENSE_CLIENT_ID` と一致している必要がある**。CI workflow の `NEXT_PUBLIC_ADSENSE_CLIENT_ID: ca-pub-0000000000000000`（ダミー値）と `ads.txt` の実値が不一致のまま AdSense クローラーが検査した場合、AdSense 審査に影響する可能性がある。`ads.txt` は本番 domain でのみ有効であり CI 内では問題ないが、staging domain で Workers が `/ads.txt` を配信する際の挙動も確認しておく。

#### P2-4: `sitemap.ts` の base URL がハードコード

`sitemap.ts` と `root-layout-config.ts` の `metadataBase` が `https://bearworks.uk` ハードコードになっている。staging URL で canonical や sitemap が本番 URL を指すことは SEO 上許容範囲だが、staging QA で canonical が `bearworks.uk` を向いていることを意図として明示しておく（誤判断防止）。

#### P2-5: rollback 閾値に時間軸が設定されていない

`Rollback条件` の記載は症状の列挙として適切だが、「cutover 後 N 分以内に確認できなければロールバック」という時間軸がない。即時判断の基準を事前に決めておく。

---

## 2. 欠けている前提・Cloudflare 設定

### staging 方式の前提が未確定

下記のいずれかを Gate 5 前に決定し、wrangler.jsonc と Cloudflare dashboard の設定を書面化する。

- **方式 A（推奨）: staging environment を同一 Worker 名で定義**
  `wrangler.jsonc` に `[env.staging]` を追加し、`name`・`routes`・secret を分離する。staging は `bearworks-staging.bearworks.uk` 等の専用 custom domain に Cloudflare Access を先付けする。

- **方式 B: staging 専用 Worker 名（`bearworks-portal-staging`）**
  Worker 名が異なるため secret・routes・Access policy が明示的に分離される。管理上わかりやすいが production と 2 つのデプロイを維持する必要がある。

### Cloudflare Access の適用対象

現行 Pages の Access policy が `bearworks.uk/dashboard/**` と `bearworks.uk/api/dashboard-data` に設定されている場合、**Workers の custom domain 切替後に同じ policy が継続して機能するか dashboard で明示確認が必要**。Workers は Pages とは別サービスであり、Cloudflare Access の "Application" が `bearworks.uk` ドメイン全体に設定されているか、Pages サービス固有になっているかで挙動が変わる。

### DNS / 証明書

- `bearworks.uk` の現行 DNS レコードが Cloudflare Pages の CNAME か Cloudflare 管理の A レコードかを確認しておく。
- Workers custom domain を追加すると Cloudflare が自動で証明書をプロビジョニングするが、**DNS プロパゲーション中に Pages との競合が発生するウィンドウが存在する**。
- staging custom domain も事前に証明書が有効化された状態にしてから Gate 5 に進む。

### Worker secret の登録先

`wrangler secret put DASHBOARD_API_TOKEN` はデフォルトで production environment に登録される。staging environment を使う場合は `wrangler secret put DASHBOARD_API_TOKEN --env staging` と明示的に指定が必要。staging と production が同じ secret を参照しないよう、登録コマンドと environment 名を書面化する。

---

## 3. staging 方式の推奨

### 推奨: 方式 A（同一 Worker 名 + `env.staging` environment）

```jsonc
// wrangler.jsonc（追記部分のみ示す）
{
  "name": "bearworks-portal",
  // ... 共通設定 ...

  "env": {
    "staging": {
      "name": "bearworks-portal-staging",
      "routes": [
        { "pattern": "staging.bearworks.uk/*", "zone_name": "bearworks.uk" }
      ]
    }
  }
}
```

**理由:**

1. production の `wrangler.jsonc` ベース設定（互換フラグ・assets・observability）を継承しつつ、Worker 名・route・secret を分離できる。
2. `wrangler deploy --env staging` で staging デプロイ、`wrangler secret put --env staging` で secret を staging 専用に設定できる。
3. staging と production が完全に異なる Worker Script として Cloudflare 上に存在するため、routes・Access policy・secret の誤接続リスクが低い。

**staging 構築手順（Gate 5 前の事前確認）:**

1. Cloudflare dashboard で `staging.bearworks.uk` の DNS レコードと証明書を確認
2. Cloudflare Access で staging hostname へ Access policy を追加（production policy と同じ path 設定）
3. `wrangler secret put DASHBOARD_API_TOKEN --env staging` で staging secret を登録
4. `wrangler deploy --env staging` で staging Worker をデプロイ
5. staging URL に Access 経由でアクセスし、Access redirect → login → dashboard アクセスを確認

**`NODE_ENV` 問題への対処（P1-2）:**

staging environment にも `NODE_ENV=production` または専用フラグを設定し、Access header チェックが有効になることを確認する。あるいは環境変数チェックを `NODE_ENV` ではなく `WORKERS_ENV=production` のような明示的な変数に変更することを検討する。

---

## 4. cutover と rollback の修正版手順

### Cutover（Gate 6 修正版）

```
事前確認（cutover 着手前）
├─ 1. Pages の現在の正常応答を curl で記録し、スナップショットを保存
│     curl -I https://bearworks.uk/
│     curl -I https://bearworks.uk/toukei
│     curl -I https://bearworks.uk/dashboard（Access redirect を確認）
├─ 2. production Worker version を確認
│     wrangler deployments list
├─ 3. production secret が登録済みか確認
│     wrangler secret list（実値は表示されない）
├─ 4. Access policy が Workers custom domain に適用されているか dashboard で確認
├─ 5. rollback 担当者と判断基準を口頭確認

cutover 実行
├─ 6. Workers custom domain を Cloudflare dashboard で bearworks.uk に追加
│     （または wrangler.jsonc の routes を追加して wrangler deploy）
├─ 7. DNS TTL 待ち（最大 5 分、Cloudflare proxied の場合は即時〜数秒）
├─ 8. 即時 smoke test（cutover 後 5 分以内）
│     curl -I https://bearworks.uk/
│     curl -I https://bearworks.uk/toukei/guides/learning-roadmap
│     curl -I https://bearworks.uk/api/dashboard-data（401 を確認）
│     curl -I https://bearworks.uk/ads.txt
│     ブラウザで AdSense script の有無を確認（/ と /about）
└─ 9. 問題がなければ観測フェーズへ（最低 24 時間）

rollback 判断タイムライン
└─ cutover 後 10 分以内に smoke test が完了しない → 即時 rollback
```

### Rollback（修正版）

**症状別トリガー（具体的閾値）:**

| 症状 | 閾値 | 操作 |
|------|------|------|
| root/slug の 5xx | 連続 3 回 or 30 秒以上継続 | 即時 rollback |
| Access 迂回・dashboard データ露出 | 1 件検出 | 即時 rollback |
| secret/JWT 漏洩 | 1 件検出 | 即時 rollback + secret 無効化 |
| AdSense 非対象 route への出力 | 1 件検出 | 即時 rollback |
| DNS/証明書不整合 | TLS エラーが出る | 即時 rollback |
| smoke test 未完了 | cutover 後 10 分以内 | 即時 rollback |

**Rollback 操作手順:**

```
方法 A: Workers custom domain を削除して Pages へ戻す（推奨・最速）
├─ 1. Cloudflare dashboard > Workers & Pages > bearworks-portal > Custom Domains
│     > bearworks.uk を削除
├─ 2. DNS が Pages の CNAME に戻ることを確認（通常 1〜2 分）
├─ 3. curl -I https://bearworks.uk/ で Pages レスポンスを確認
├─ 4. CF-Ray ヘッダーまたはレスポンス差異で Pages 復帰を確認
└─ 5. 復帰確認後に原因調査

方法 B: wrangler rollback（Worker ロジックのバグの場合）
├─ wrangler rollback [deployment-id]
└─ custom domain は維持したまま前 version に戻る（Pages には戻らない）

Pages の設定保持確認（cutover 前に必ず実施）
└─ Cloudflare dashboard > Pages > bearworks-uk が削除されていないこと
   └─ Pages project が存在する限り custom domain を再付与すれば復帰可能

Cloudflare キャッシュへの影響
└─ Workers と Pages は共に Cloudflare エッジから配信されるため
   Purge All Cache を実行しておくと検証が正確になる
   （rollback 後に古いキャッシュが残ることを防ぐ）
```

---

## 5. 実行開始可否

**条件付き承認**

以下の条件を満たした後 Gate 1（main 同期）から実行を開始してよい。Gate 5（Workers staging）と Gate 6（production cutover）は下記の追加条件を満たしてから着手する。

### Gate 1〜4 の着手条件（満たされている）

- [x] `workers_dev: false` / `preview_urls: false` 実装済み
- [x] AdSense 境界が layout 分離で実装済み
- [x] dashboard API の fail-closed・no-store・405 実装済み
- [x] Linux CI workflow 実装済み（未実行）
- [x] 安全境界（非目標・rebase禁止・secret 分離）が文書化済み

### Gate 5（staging）着手前の追加条件

- [ ] `wrangler.jsonc` に `env.staging` ブロックを追加する（P1-1）
- [ ] staging environment の `NODE_ENV` または代替フラグを確認し、Access header チェックが staging でも有効になることを確認する（P1-2）
- [ ] staging custom domain（例: `staging.bearworks.uk`）に Cloudflare Access を事前設定する
- [ ] staging secret を `--env staging` で分離登録する手順を書面化する

### Gate 6（production cutover）着手前の追加条件

- [ ] cutover と rollback の具体的コマンドを確定する（P1-3、本レビューの修正版手順を採用するか独自に書面化する）
- [ ] Pages の Access policy が Workers custom domain に引き継がれることを dashboard で確認する
- [ ] staging QA が完全に成功していること
- [ ] rollback 閾値と担当操作者を確認していること

### 差し戻さない理由

コードの実装品質・安全境界・ゲート設計は適切。未確定事項は staging・cutover フェーズに限られており、その前の Gate 1〜4 はブロッカーなく進行可能。staging 方式と rollback 手順の書面化を並行して進め、Gate 5 直前に確定すれば全体スケジュールを遅らせずに対応できる。

---

*機密情報・token・secret 実値はこのレビューに含めていません。*

---

## 6. 司令塔Codexの採否判断

2026-08-02に実ファイルとCloudflare公式ドキュメントを再確認し、次のように判断した。

| 指摘 | 判断 | 反映 |
| --- | --- | --- |
| P1-1 staging方式 | 採用 | `env.staging`、`bearworks-portal-staging`、`staging.bearworks.uk` Custom Domainを `wrangler.jsonc` に定義。hostname全体のAccess設定をdeploy前提条件とした。 |
| P1-2 `NODE_ENV` 依存 | 採用・強化 | 環境変数を追加するのではなく、dashboard APIは全環境で `cf-access-jwt-assertion` を必須にした。stagingだけ保護が弱くなる分岐を廃止した。 |
| P1-3 rollback具体化 | 採用・方式変更 | productionはWorkers Custom DomainへDNS移行せず、既存Pages DNSの前段へ `bearworks.uk/*` Workers Routeを追加する。rollbackはRoute削除とし、Pages/DNSを維持するrunbookを作成した。 |
| P2-1 `_headers` | 指摘の前提は不採用、実測は採用 | 現行Cloudflare Workers Static Assetsは `_headers` を正式サポートしている。ただしOpenNext生成物への反映と実レスポンスはstagingで確認する。 |
| P2-2 CI cleanup | 部分採用 | zombie防止の `trap cleanup EXIT` は既にあった。一時 `.dev.vars` と `/tmp` 検証ファイルも終了時に削除するようcleanupを拡張した。 |
| P2-3 publisher ID | 採用 | CIのダミーIDは広告境界検査専用、`ads.txt` はproduction公開値という意図を明記。stagingはhostname全体をAccessで遮断する。 |
| P2-4 canonical | 採用 | stagingでもcanonical、metadataBase、robots、sitemapがproduction URLを指すことを意図としてQAへ明記。 |
| P2-5 時間軸 | 採用 | 5分以内にsmoke開始、10分以内に完了できなければrollback、症状別の即時閾値をrunbookへ記載。 |

参照した現行仕様:

- Cloudflare Workers Environments: https://developers.cloudflare.com/workers/wrangler/environments/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Workers Routes: https://developers.cloudflare.com/workers/configuration/routing/routes/
- Workers Static Assets headers: https://developers.cloudflare.com/workers/static-assets/headers/

結論はGate 1〜4の着手可を維持する。Gate 5はAccess Applicationの先行設定とsecret分離を画面・コマンドで確認するまで実行しない。Gate 6はstaging受け入れ完了とユーザーの本番切替承認まで実行しない。

### Luna独立監査

- task: `019fc2ae-34be-7151-ac8d-26355f135c26`
- 読み取り専用でP1/P2、Wrangler環境継承、`NODE_ENV`、CI cleanup、`ads.txt`、`_headers`、canonicalを監査した。
- `vars` とsecretがnamed environmentへ自動継承されない点を再確認し、staging secretの明示登録をrunbookへ反映した。
- CIへstatic assetのimmutable headerと `ads.txt` 内容検証を追加し、一時ファイルcleanupを拡張した。
- Lunaはファイル編集、Git/GitHub書き込み、deploy、外部サービス書き込みを行っていない。採否と最終差分は司令塔Codexが確認する。
