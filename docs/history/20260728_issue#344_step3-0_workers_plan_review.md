# Issue #344 Phase 3-0 Workers/OpenNext移行 計画レビュー

## 実行状況

- `invoke_antigravity.py --phase plan-review` は対象repo `26d7023`、司令塔repo `0eb393d`、両repo cleanを確認した。
- `agy models` が空で、Antigravityの外部モデルには到達しなかった。
- 同一外部要求は再試行せず、読み取り専用Codexレビューへフォールバックした。

## レビュー結論

P0なし。依存関係の組合せ、OpenNext設定、Edge Runtime除去、deployを今回行わない境界は妥当。P1 4件、P2 4件を計画へ反映後に実装可能と判定した。

## P1と反映内容

1. Next.js 15のdynamic params対応を条件付きでなく必須化し、guide/problemのpageとmetadataをPromise paramsへ変更する。
2. Windows結果だけで完了扱いにせず、Linux clean checkoutの通常build、Workers build、dry-run、previewを必須にする。
3. dashboard APIのtoken、Access header、upstream失敗、timeout、405、cache、秘密値非露出を具体的に検証する。
4. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` をWorkers build前に設定し、値あり/なしの両成果物を検証する。

## P2と反映内容

1. Wranglerは互換範囲だけでなく4.114.0へ固定し、lockfileとpeer warningを確認する。
2. `public/_headers` はstatic assets限定とし、SSR/API headerは個別HTTP検査する。
3. 生成型なしのclean checkoutでもbuildできることを確認し、example envへ秘密値を置かない。
4. Next.js 15移行回帰をURL/status、metadata、static asset、dashboard、API、dynamic slug、AdSense遷移の行列で比較する。

## 残余リスク

実Workers環境のsecret/binding、Cloudflare Access、custom domain/DNS、実upstream正常200、実トラフィック下のcacheはローカルpreviewでは証明できない。本番切替前の別受け入れとして管理する。
