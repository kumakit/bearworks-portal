# Issue #344 Phase 3-0 Workers/OpenNext移行 ウォークスルー

## 実装概要

- Next.js / eslint-config-nextを15.5.21へ更新し、React 18を維持した。
- `@cloudflare/next-on-pages` を削除し、`@opennextjs/cloudflare@1.20.2`、`wrangler@4.114.0`、`esbuild@0.27.7` を固定した。
- OpenNext設定、Worker entrypoint、static assets、互換フラグ、observabilityを追加した。
- `workers.dev` とversion preview URLを無効化し、Access対象外の公開入口を作らない設定にした。
- 全Edge Runtime指定を削除し、dynamic guide/problemのpageとmetadataをNext.js 15のPromise paramsへ適合した。
- dashboard upstreamへ10秒timeoutを追加し、失敗時のgeneric response、no-store、秘密値非露出を維持した。
- Linux build-only workflowへclean install、通常build、Workers build、Wrangler dry-run、Workers preview route/API smokeを追加した。deployやCloudflare認証は含めていない。

## ローカル検証結果

### 成功

- `npm ci --no-audit --no-fund`
- `npm run build`（Next.js 15.5.21、lint/type、32 static generation）
- publisher IDあり/なしの `npm run cf:build`
- `npx wrangler deploy --dry-run`
  - static assets: 87 files
  - upload: 5676.79 KiB
  - gzip: 1165.32 KiB
  - binding: `ASSETS`
- Workers previewで `/`、`/toukei`、`/about`、`/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/ads.txt`、`/robots.txt`、`/sitemap.xml`、iconが200
- 任意の不存在routeと不存在slugが404
- dashboard APIのtoken未設定500、Access headerなし401、upstream失敗500、POST 405、全失敗responseのno-storeとgeneric body
- publisher IDあり成果物では `/` と `/toukei` だけにAdSense情報があり、非対象routeと404にはない
- publisher IDなし成果物では対象routeにもAdSense情報がない
- 実ブラウザDOMで対象routeのscript 1件、非対象routeのscript 0件、戻る/進むを含む境界遷移、console errorなし
- `next-on-pages`、`pages:build`、`setupDevPlatform`、実行コード中のEdge Runtime指定が残っていない

### Windows固有の未解決結果

OpenNext Workers previewでは、有効な `/toukei/guides/learning-roadmap` と `/toukei/problems/confidence-interval` がWindows上だけ404となった。同じ `.next` を `next start` で配信すると両方200であり、`.open-next` の生成cache/tag pathにWindows区切りが含まれていた。OpenNext公式のWindows非対応とも整合するため、Linux workflowでの200確認を必須ゲートにした。

## 外部レビュー状況

- LM Studio Gemmaは `uv` cache初期化失敗でモデル未到達となり、直接Git確認へフォールバックした。
- Antigravityの計画レビュー、実装、実装後レビューは `agy models` が空で外部モデルへ到達しなかった。
- 外部モデルによる成功とは扱わず、Codexで計画レビュー、実装、実装後レビューを完了した。

## 未実行

- GitHub Actions上のLinux clean checkout検証
- push、PR、Issueコメント
- Cloudflare deploy/upload、custom domain/DNS切替、Pages停止
- 実Worker secret、実Access policy、実upstream正常200、本番公開URLの受け入れ
- AdSense再審査申請

## 次の判断

ユーザー承認後にbranchをpushし、Linux workflowを実行する。workflow成功後も直ちに本番切替はせず、custom domain切替とrollback計画をレビューしてから別途承認を得る。
