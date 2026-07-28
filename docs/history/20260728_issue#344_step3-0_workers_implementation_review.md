# Issue #344 Phase 3-0 Workers/OpenNext移行 実装後レビュー

## 結論

P0なし。初回レビューで検出した公開Worker入口のP1は解消した。コードは条件付き承認とするが、Linux clean checkoutのworkflowが未実行であるため、まだリリース可能とは判定しない。

## レビュー方法

- 対象repoと司令塔repoのGit root、branch、HEAD、dirty状態を確認してから正規のAntigravity runnerを起動した。
- `agy models` が空で外部モデルへ到達しなかったため、外部レビュー成功とは扱わず、読み取り専用Codexレビューへフォールバックした。
- 依存、OpenNext/Wrangler設定、route runtime、dynamic params、dashboard API、AdSense境界、workflow、README、検証結果を確認した。

## P1と修正

初回 `wrangler.jsonc` は `routes`、`workers_dev`、`preview_urls` を定義していなかった。Wranglerの既定で公開される `workers.dev` またはversion preview URLが、custom domain側のCloudflare Accessを迂回する入口になり得るため、deploy前必須のP1と判定した。

次のとおり修正した。

- `workers_dev: false`
- `preview_urls: false`
- Access適用済みcustom domain routeは、本番切替を別途承認した時だけ設定する
- API内のJWT header確認は署名検証ではなく存在確認であることをコメントとREADMEに明記する

修正後のWrangler dry-runは成功した。

## P2と修正

1. Linux smokeへ有効dynamic slugのAdSenseあり、404のAdSenseなしを追加した。
2. Wrangler 4.114.0の要件に合わせ、`package.json` とREADMEへNode.js 22以上を明記した。
3. workflowのpreview検証内容、JWT存在確認、完了済みローカルQAに合わせてREADMEとtask文書を更新した。
4. 新規ファイルがcommit対象に含まれることをcommit直前に確認する。

## 残余ゲート

- GitHub ActionsのLinux clean checkoutで `npm ci`、通常build、Workers build、dry-run、preview HTTP/API smokeを成功させる。
- 特にWindows OpenNext変換で404となった有効dynamic guide/problemがLinuxで200になることを確認する。
- 本番切替前にAccess適用済みcustom domain route、Worker secret、実upstream正常200、rollback手順を検証する。
- deploy/upload、custom domain、DNS、Pages停止、push、Issue更新は本レビューでは実行しない。

## 判定

P0/P1のコード指摘は解消。Linux workflow成功まではPhase 3-0のリリースゲートを閉じない。
