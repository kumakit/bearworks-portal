# Issue #344 Phase 3-0 セッションプロンプト

## Antigravity Gemini/Sonnet 計画レビュー用

対象repoは `C:\Users\kumat\dev\bearworks-portal`、司令塔repoは `C:\Users\kumat\hub\mission-control` です。対象branchは `codex/issue-344-phase3-ads-scope`、計画作成前HEADは `2f3831315f05d25baf6b25c52567b4093a25a559` です。

`C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\task.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\session-prompts.md` を読み、Issue #344 Phase 3-0の計画をレビューしてください。

まだ実装は始めません。コード修正は行わないでください。目的は計画の妥当性確認です。特にNext.js 14 App RouterのRoute Groupで公開URLを維持できるか、nested layoutでAdSense scriptを対象ルートだけにSSR出力できるか、クライアント遷移時の挙動、metadata/noindex/sitemap/robotsへの回帰、QAの再現性を確認してください。レビュー結果だけを標準出力へ返し、ファイル作成・変更、Git/GitHub操作、外部サービス書き込みは行わないでください。

LM Studio MCPが利用可能な場合も読み取り専用で1件ずつ使い、最大90秒待機してください。失敗時は連続再試行せず、利用メソッド・所要時間・失敗理由を結果へ記録し、直接ファイル確認へフォールバックしてください。

## Gemini 3.5 Flash 実装用

対象repoは `C:\Users\kumat\dev\bearworks-portal` です。このrepoだけをworkspace/cwdとして扱い、`C:\Users\kumat\hub\mission-control` や他repoを編集対象に追加しないでください。司令塔repoは `C:\Users\kumat\hub\mission-control` ですが、参照や変更は行わないでください。対象branchは `codex/issue-344-phase3-ads-scope` です。

`C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md` と `C:\Users\kumat\dev\bearworks-portal\docs\task\task.md` のPhase 3-0だけを実装してください。

必須要件:

- top-level `app\layout.tsx` を廃止し、`app\(monetized)\layout.tsx` と `app\(non-monetized)\layout.tsx` をそれぞれroot layoutにする。
- metadata、Inter font、body classを共通module化し、両rootに同じ設定を適用する。
- `components\AdSenseScript.tsx` を追加し、環境変数がある場合だけ既存native scriptをSSR出力する。
- トップページと `app\toukei` subtreeを `(monetized)` 配下へ移し、正常pageからAdSense componentを1回だけ描画する。動的slugでは `notFound()` 判定後のreturnだけに置く。
- `/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/about` のpage subtreeを `(non-monetized)` 配下へ移す。`/api` はroute group外のままにする。
- `app\site-content.ts` の統計データimportを移動後パスへ更新し、sitemapのURL値は変えない。
- sitemap、robots、metadata、noindex、ads.txtを目的なく変更しない。
- Phase 3-1以降のコンテンツ追加や運営者情報変更を行わない。

対象repo内のファイル読み書きと必要なローカル検証だけを行ってください。commit、push、gh、PR/Issue更新、認証、外部サービス書き込みは行わないでください。`--dangerously-skip-permissions` は使用しないでください。

LM Studio MCPが利用可能な場合も読み取り専用で1件ずつ使い、最大90秒待機してください。失敗時は連続再試行せず、利用メソッド・所要時間・失敗理由を成果へ記録し、直接ファイル確認へフォールバックしてください。

## Antigravity Gemini/Sonnet 実装後レビュー用

対象repoは `C:\Users\kumat\dev\bearworks-portal`、司令塔repoは `C:\Users\kumat\hub\mission-control` です。対象branchは `codex/issue-344-phase3-ads-scope` です。

未コミットの実装差分と `C:\Users\kumat\dev\bearworks-portal\docs\task\implementation_plan.md`、`C:\Users\kumat\dev\bearworks-portal\docs\task\task.md` を読み取り専用でレビューしてください。コード修正、ファイル作成、コマンド実行、Git/GitHub操作、MCP利用、外部サービス書き込みは行わず、レビュー結果だけを標準出力へ返してください。

次を重点確認してください。

- AdSense scriptが対象ページだけにSSR出力されるか
- 非対象ページや統計ページ配下の404へ漏れないか
- Route Group移動で公開URL・相対import・metadata・noindex・sitemap・robotsに回帰がないか
- publisher IDとads.txtが一致するか
- 複数root境界のfull page loadにより、クライアント操作後もscriptの残留・重複がないか
- QA結果が受け入れ条件を十分に証明するか

重大度、根拠ファイル、必要な修正、残余リスクを明記してください。
