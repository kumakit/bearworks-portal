# Issue #17 第3段階の本番公開・完了（2026-10-24）

## 結果

production・全体監査0件、期限付き例外なし、Ubuntu/Node 22 CI、本番公開と必要な公開後確認を完了。[Issue #17](https://github.com/kumakit/bearworks-portal/issues/17)をclosed / Status: Doneとし、`issue-17-braces` 定期追跡をPAUSEDにした。元の例外期限を延長して完了扱いにしたものではない。

bracesの公式勧告は10月23日に撤回。Tailwind 3とNext ESLintのdev経路にbraces自体は残るが、CSS移行や対応ブラウザー変更は不要となった。新規警告のNext/Lint 16.4.3、Zod 4.6.7、body-parser 2.4.0への更新、Next 16.4互換のOpenNext 1.20.13 / Wrangler 4.148.0、minifier配下に限定したglob 10.5.0修正版を採用した。

## ソースとLinux検証

- [PR #33](https://github.com/kumakit/bearworks-portal/pull/33)：検証head `93b639ec2a99fe5254b43d264acf438b6cd334c9`、merge後main `1396c14171d9206d09277741896d7c35a6d17b37`。
- [Workers CI #84](https://github.com/kumakit/bearworks-portal/actions/runs/40036494103)：Ubuntu、Node 22.23.3、native sharp、両監査0、監査20/Cloudflare35テスト、Next/Workers build、両環境dry-run、previewの404/API/広告/画像・18並列要求が成功。監査artifactの両JSON原本もtotal0。
- CI checkoutのmerge候補とPR head、merge後mainのGit treeは `6ea378e4f597758b6029cb5276f8a15d049548ac` で一致。
- [Production artifact CI](https://github.com/kumakit/bearworks-portal/actions/runs/40037009316)：上記main・本番AdSense IDで生成。artifact `12536504659`、ZIP SHA-256 `a87d40b33ef154495e2015aa9dc4d843dc3030f6bbe8b3477270afc6cc44e13e` を取得後に照合した。
- Linux成果物を隔離ディレクトリに展開し、mainのrouter/設定/package/lockとの一致、OpenNext標準の静的cache準備、dry-run、実広告IDのpreviewを確認。公開直前にもmain・artifact/準備済みtree hash・期限・直前配信版・ダミー設定削除を再確認した。

## 本番公開

ユーザーの「公開をお願い」を受け、検証済みLinux成果物に対して既存OpenNext標準deployを実行した。Windowsで再buildせず、標準cache準備とWrangler upload/deployへ進めた。

| 項目 | 確認結果 |
| --- | --- |
| 新Worker version | `5ac751ef-eb4e-4478-b013-2100ad69b4ca` |
| deployment | `f323fb38-efb5-48b0-ad4f-e1a8680dc9ca` |
| 配信割合 | 新版100%（deployment記録を照合） |
| 復旧先 | 直前の100%配信版 `22bd4196-2419-42aa-97c6-828bc6572b58` |
| bindings/runtime | 5つのbinding名・型、runtime、public varsが公開前と一致。既存secret binding保持 |
| 設定境界 | Route/DNS/Access/secretの変更なし。履歴表示フラグは無効のまま |

deployログには `No targets deployed` と出たが、この文言だけで公開失敗とは判断していない。直後のCloudflare deployment記録で上記versionの100%配信を確認した。

## 公開後確認

- 公開URLの12ルート：記事本文・schema・canonical・固定hash・原本配布・シリーズリンク/sitemapが成功。
- 別の24確認：実広告IDとダミーID不在、非広告ページ、4つの未存在ルート404、3つのAccess未認証302、画像、ads.txt/robots/sitemapが成功。
- iconと実際に公開ページが参照するstatic assetはLinux成果物のバイト列と一致。static assetのimmutableも確認。
- 6ルート×3回、18回の反復並列要求がすべて200・本文あり。
- 本番ブラウザーで雨の降水日数グラフ切替、秋の14〜24℃と2021年カレンダー切替が追随。PC/モバイル表示を確認し、確認中browser error0。
- versionメタデータでbinding名・型とruntime、public varsを公開前と比較した。secret値は取得・表示していない。

記録：`evidence/phase-3-release-2026-10-24/`。元の両監査・依存差分・ローカル検証は `evidence/phase-3-2026-10-24/`。

## 限界と判断

本番の認証済みAPI成功応答は、利用できるログイン状態がなかったため未確認。認証情報を新たに取得せず、Linux previewの401/405・no-storeと本番Access未認証302までを確認した。これは前段階から引き継ぐ明示的な検証範囲で、成功を主張しない。アプリ/API/認証設定の変更はない。

既存Lint警告3件や保守・廃止予定警告は依存監査0件と区別する。限定glob overrideは上流の通常解決が修正版へ進んだら除去する。今回の結果は公開時点の回帰確認であり、将来の継続稼働や新しい勧告が出ないことを保証するものではない。

Lunaが読み取り専用で差分・CI・artifact・受入項目を点検し、司令塔が実際の監査・公開・metadata・HTTP・画面の結果を確認した。追加の手動外部計画レビューは実施していない。Issueの完了条件を満たしたためcloseし、指定されていた定期追跡を停止した。
