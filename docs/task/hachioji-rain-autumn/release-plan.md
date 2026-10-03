# 第7・8弾 公開手順

対象ブランチ: `codex/hachioji-rain-autumn`。基点: `8113227`（AIニュース更新を含む最新取得のmain）。対象は2記事とその固定原本・生成/検証器・導線・制作記録。新しい広告設定、DNS、Access、Worker Route、secret設定は含まない。

## 現在の状態

原稿承認とローカル公開準備は許可済み。pushの明示承認は会話でまだ受けていない。pushは共通AGENTSの「pushはユーザーの明示承認後に行う」に従う。本番deployはREADMEと既存runbookの別ゲートに従う。完成済みの差分を先にローカルcommitへまとめる。

ローカルのlint/build、独立検算、公式HTMLの標本照合、PC/スマホ操作、新記事12ルート、例題30・ガイド8と54 URL sitemap・広告境界の検証は成功。Linux/Workersと公開URLの確認は未実施。

## 1. GitHubでのLinux検証

明示承認後、対象ブランチだけをpushし、main向けPRを作成する。PR本文は `pr-draft.md` を使用する。PRはCodexの添付へ登録する。

`Workers build` workflowはpull_request/manualのみ。push単独では本番公開されない。PRの最新commitについてUbuntuで下記を確認する。

1. clean checkout、Node 22、`npm ci`。
2. 全固定bundle検証、lint、Next.js build。
3. 内部リンクのprefetch方針。
4. Workers build、production/stagingのWrangler dry-run。
5. Workers previewで既存route/API/広告境界と、新記事用12ルートの検証。

CIが失敗したらログから原因を修正し、同じ公開対象の最新commitで再確認する。Windowsの成功だけでこの工程を代替しない。

## 2. mainと公開対象の確定

承認された範囲でPRをmergeし、mainを履歴書換えなしで同期する。他の変更がmainへ追加された場合は、実際にdeployするHEADの検証を再確認する。公開対象SHAを記録する。

## 3. 既存production Workerの更新

実deployの承認後、直前のdeployment/versionと復旧対象を読み取り専用で確認する。現在の公開広告IDを使い、ダミーIDを本番へ配信しない。secret実値は表示しない。

既存の `npm run deploy` はbundle検証、OpenNext build、Workerへの実デプロイを行う。WSL/Linuxが使えない場合、既存のWindows手順の制約を明示し、先に同一対象のLinux CI成功を確認する。Route/DNS/Access/secret変更を要求されたら、この記事リリースから切り離して確認する。

## 4. 公開後の検証

`node scripts/verify-hachioji-rain-autumn-pages.mjs https://bearworks.uk` で本文、承認表示、canonical、構造化データ、bundleハッシュ、原本配布、既存6記事/トップ/sitemapの導線を確認する。`--ads` はCI用ダミーIDの検査なので本番では付けない。

さらに2記事の初回表示と操作をブラウザーで確認し、実publisher ID、ads.txt、広告を出さない画面・404、代表的な既存routeの応答を確認する。deploy結果のVersion ID、公開時刻、公開対象SHA、応答を記録する。sitemapの配信成功を検索エンジンの登録・審査承認と解釈しない。

不具合時は更新前のWorker versionへの復旧を検討し、復旧操作も承認済み範囲内で実施する。既存のRoute削除による旧Pagesへの切替は、今回追加する記事の更新より大きな変更なので自動実行しない。
