# Issue #344 Phase 3-0 Workers/OpenNext移行セッションプロンプト

## Antigravity Gemini/Sonnet 計画レビュー用

対象repoは `C:\Users\kumat\dev\bearworks-portal`、司令塔repoは `C:\Users\kumat\hub\mission-control` です。対象branchは `codex/issue-344-phase3-ads-scope`、移行開始HEADは `fe4bd1cc7b0741ebc56d2ebddf750347e5f5301d` です。

`C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\task.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\session-prompts.md` と現行Cloudflare設定を読み、Issue #344 Phase 3-0のCloudflare Workers/OpenNext移行計画をレビューしてください。

まだ実装は始めません。コード修正は行わないでください。目的は計画の妥当性確認です。特に `@opennextjs/cloudflare@1.20.2` とNext.js 15.5.21の互換性、Edge Runtime除去、Wrangler/OpenNext設定、dashboard APIのfail-closed維持、AdSenseの複数root layout、Windows/Linux検証境界、deploy/custom domainを今回の実装から分離できているかを確認してください。レビュー結果だけを標準出力へ返し、ファイル作成・変更、Git/GitHub操作、外部サービス書き込みは行わないでください。

LM Studio MCPが利用可能な場合も読み取り専用で1件ずつ使い、最大90秒待機してください。失敗時は連続再試行せず、利用メソッド・所要時間・失敗理由を結果へ記録し、直接ファイル確認へフォールバックしてください。

## Gemini 3.5 Flash 実装用

対象repoは `C:\Users\kumat\dev\bearworks-portal` です。このrepoだけをworkspace/cwdとして扱い、司令塔repo `C:\Users\kumat\hub\mission-control` や他repoを編集しないでください。対象branchは `codex/issue-344-phase3-ads-scope` です。

`C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md` と `C:\Users\kumat\dev\bearworks-portal\docs\task\task.md` のWorkers/OpenNext移行だけを実装してください。

必須要件:

- Next.js / eslint-config-nextを15.5.21へ更新し、React 18は維持する。
- `@cloudflare/next-on-pages`、`pages:build`、`setupDevPlatform()` を削除する。
- `@opennextjs/cloudflare@1.20.2` と互換Wranglerを導入する。
- `next.config.mjs` で `initOpenNextCloudflareForDev()` を呼ぶ。
- `open-next.config.ts`、`wrangler.jsonc`、`.dev.vars.example`、`public/_headers` を追加する。
- すべての `export const runtime = "edge"` を削除する。
- `.open-next`、`.dev.vars`、生成型をignoreする。
- Next.js 15の型エラーは挙動を変えない最小変更で修正する。
- READMEをWorkers/OpenNext構成へ更新する。
- AdSense対象、公開URL、metadata、noindex、sitemap、robots、ads.txt、dashboard APIのsecurity boundaryを変更しない。
- Cloudflare deploy/upload、DNS、custom domain、Pages削除、Git/GitHub操作を行わない。

対象repo内のファイル読み書きと必要なローカル検証だけを行ってください。commit、push、gh、PR/Issue更新、認証、外部サービス書き込みは行わないでください。`--dangerously-skip-permissions` は使用しないでください。

## Antigravity Gemini/Sonnet 実装後レビュー用

対象repoは `C:\Users\kumat\dev\bearworks-portal`、司令塔repoは `C:\Users\kumat\hub\mission-control` です。対象branchは `codex/issue-344-phase3-ads-scope` です。

未コミットのWorkers/OpenNext移行差分と `C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\task.md` を読み取り専用でレビューしてください。コード修正、ファイル作成、コマンド実行、Git/GitHub操作、MCP利用、外部サービス書き込みは行わず、レビュー結果だけを標準出力へ返してください。

次を重点確認してください。

- OpenNext / Next.js / Wranglerの互換版と設定が公式要件を満たすか
- next-on-pagesとEdge Runtime指定が完全に除去されているか
- dashboard APIのfail-closed、Access header、no-store、405が維持されるか
- AdSense対象/非対象、404、公開URL、metadata、noindex、sitemap、robots、ads.txtに回帰がないか
- secrets、deploy、custom domain、既存Pagesとの切替境界が安全か
- Workers build、dry-run、preview、ブラウザQAが受け入れ条件を証明するか

重大度、根拠ファイル、必要な修正、残余リスクを明記してください。
