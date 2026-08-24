# Issue #344 Phase 3-3 再審査前確認計画

## 目的

Issue #344 の Phase 3-3 として、AdSense 再審査前の技術・コンテンツ・検索・運用条件を、公開中の一次証拠で確認する。

再審査を通過すると推測することではなく、現時点で確認できる事実、不明点、待機が必要な条件を分け、再審査申請をユーザー判断へ渡せる状態かを判定する。

## 正本と開始状態

- 正本: `kumakit/mission-control#344`
- 検索反映の追跡: `kumakit/mission-control#376`
- 対象repo: `C:\Users\kumat\dev\bearworks-portal`
- branch: `codex/issue-344-phase3-3-readiness`
- base: 2026-08-24取得時点の `origin/main` (`9f3b23c`)
- Issue #344: open / `Status: In Progress`
- Issue #376: open / `Status: In Progress`
- Phase 3-0: 広告範囲分離とWorkers移行を完了
- Phase 3-1: 八王子気候分析を公開し、Issue #372で完了
- Phase 3-2: 制作・検証情報をmainへ取り込み、本番公開QAを完了

## Phase 3-3 要件

1. 広告スクリプトの掲載範囲分離が本番反映済みである。
2. 非広告ページと404へAdSense scriptが出力されない。
3. 独自分析プロジェクトが少なくとも1件公開済みである。
4. 分析記事が外部アプリなしでも単独で有用である。
5. データ出典、前処理、分析方法、品質・限界、コード、AIと人の役割を確認できる。
6. Search Consoleで新規分析記事のクロール・インデックス状態を確認済みである。
7. 公開後の実利用、修正、更新の記録を確認できる。
8. 再審査直前に、目的のない大量追加や大規模変更を行わない。

## 非目標

- 本計画だけを根拠にAdSense再審査を申請しない。
- Search Consoleのサイトマップを再送信しない。
- 同一URLへのインデックス登録リクエストを繰り返さない。
- 未登録・未クロールだけを理由にコードや本文を変更しない。
- 記事数の水増し、一般記事の大量追加、広告範囲の拡大を行わない。
- Cloudflare、Workers、DNS、Access、Pages、secretを変更しない。
- AdSense合格や検索順位を保証しない。

## 判定ゲート

### Gate 0: 公開技術基準

- 対象公開routeがHTTP 200である。
- 広告対象と非対象、無効slug、一般404の境界が維持されている。
- canonical、robots、sitemap、ads.txtがproduction URLと一致する。
- dashboardとAPIのCloudflare Access保護が維持されている。

### Gate 1: 一次情報型コンテンツ

- `/labs/hachioji-climate` が単独記事として問い、データ、方法、結果、限界、出典を説明する。
- 固定publication bundle、version、byte size、SHA-256、source commitを追跡できる。
- 検証コードと公開履歴へ到達できる。
- 結果をIssue条件に合わせて捏造していない。

### Gate 2: 制作・運営透明性

- ガイド8件、例題5件、分析記事に制作・検証情報が表示される。
- AIを補助利用した工程と、人が確認・判断した工程が分離される。
- `/about` と `/toukei/methodology` に運営範囲、公開実績、訂正受付がある。
- 公開根拠のない資格、所属、第三者監修を主張しない。

### Gate 3: Search Console

サイトマップ状態と個別URL検査を分けて記録する。

- property、sitemap URL、送信日、最終読み込み、状態、検出URL数、エラー・警告
- URLの登録状態、クロール日時、取得結果、クロール可否、インデックス可否
- ユーザー指定canonical、Google選択canonical、参照元sitemap
- 必要な場合のライブテスト結果
- 既存の登録リクエスト結果と、再リクエストを行わなかったこと

サイトマップの「成功」は個別URLのインデックス登録を意味しない。公開URLが200、canonical、robots、sitemapとも正常で、未クロールだけの場合は待機とする。

### Gate 4: 公開後の運用実績

- 公開日以後のGit履歴、Actions、更新・訂正履歴を確認する。
- Search Consoleまたは利用可能な一次集計で、対象URLの表示・クリック等を確認する。
- 利用実績を確認できない場合は「0」または「不明」を事実として記録し、推測で補わない。
- 訂正がない場合は、存在しない訂正履歴を作らず「初版公開のみ」と記録する。

### Gate 5: 変更凍結と再審査判断

- 公開後の変更が、独自分析、制作透明性、必要な修正、通常のデータ更新に限定されていることを確認する。
- 目的のない大量ページ追加や広告範囲拡大がない。
- Gate 0〜4の証拠をまとめ、次のいずれかを判定する。
  - `READY_FOR_USER_DECISION`: 技術的問題がなく、検索・運用条件も確認でき、再審査をユーザー判断へ渡せる。
  - `HOLD`: 技術的問題はないが、クロール・インデックス・利用実績など時間経過が必要。
  - `STOP`: canonical、robots、Access、広告境界、データ整合性など具体的な不具合がある。

## データと安全境界

- 公開ページ、公開GitHub、Search Consoleの対象プロパティ、集計済みの利用指標だけを扱う。
- 認証情報、Access token、Cookie、個別ユーザー情報、Cloudflare内部IDを記録しない。
- Search Console確認は読み取り専用とし、送信、削除、インデックス登録リクエストを行わない。
- AdSense再審査申請は外部書き込みであり、判定後に別の明示承認を得る。
- Issueコメント、Status変更、close、commit、push、PRも個別の承認ゲートとする。

## 検証方法

### repoとGit

- Phase 3-0〜3-2の計画、task、walkthrough、merge commit、Linux CIを照合する。
- 2026-08-12以後の対象ファイル履歴を確認する。
- `git diff --check` と作業ツリーの対象範囲を確認する。

### 公開HTTP

- 広告対象route、非対象route、無効slug、一般404
- `/labs/hachioji-climate`、`/about`、`/toukei/methodology`
- canonical、robots.txt、sitemap.xml、ads.txt
- dashboard/APIの未認証Access 302

### Search Console

- `sc-domain:bearworks.uk` のサイトマップ状態を確認する。
- `https://bearworks.uk/labs/hachioji-climate` をURL検査する。
- インデックス登録レポートに通知がある場合は、理由、対象URL、最終更新日を確認し、意図した除外と公開URLの問題を分けて記録する。
- 対象URLの検索パフォーマンスが利用可能なら、期間と指標の意味を明記して集計値だけを記録する。

## 計画レビュー判定

SonnetまたはGemini Proによる手動計画レビューは不要と判定する。

本Phaseの現段階は読み取り専用の公開・Search Console監査と記録作成であり、認証、インフラ、データ、課金、公開APIを変更しない。AdSense再審査申請は本計画から分離し、明示承認後だけ実行する。

## ロールバック

読み取り専用確認にはロールバック操作はない。

記録内容に誤りがあれば、commit前は対象ファイルを修正し、commit後は対象記録だけをrevertする。本Phaseの判定のために公開コード、Search Console、Cloudflare、AdSenseの状態を変更しない。

## 実施順序

1. Issue #344/#376、最新main、既存記録を取り込む。
2. LunaへPhase 3-3ゲート監査を読み取り専用で委譲する。
3. 公開HTTPとGit履歴を確認する。
4. Search ConsoleのサイトマップとURL検査を読み取り専用で確認する。
5. 公開後の利用・更新記録を確認する。
6. Luna監査と司令塔Codexの実測を照合し、Gate 0〜5を判定する。
7. walkthroughとtaskへ確認済み事実、推論、不明点を記録する。
8. commit、push、PR、Issue更新、AdSense再審査をそれぞれ別ゲートで扱う。

## 開始時の未解決事項と確認結果

- 2026-08-12の初回URL検査では未登録・未クロールだったが、2026-08-24の再確認でクロール・取得・canonical・サイトマップ検出・インデックス登録が正常になったことを確認した。
- URL単位の検索パフォーマンスを確認でき、2026-08-22までに11表示・2クリックを記録していた。
- AdSenseの既存判定は「要確認 / 有用性の低いコンテンツ」のままで、画面上の最終更新は改善前の2026-07-23だった。
- Search Consoleのrobots通知は、検索対象外の `/dashboard` が公開 `robots.txt` の意図どおりブロックされた結果だった。八王子記事と広告対象routeへの影響はない。
- `/toukei/problems/sampling-bias` は公開HTTP 200、canonical、sitemap掲載が正常だが、Search Consoleでは未クロール・未認識だった。技術修正は行わず、次回の読み取り専用監視対象とする。
- 検索実績は小さい標本で、長期需要、再訪、AdSense合格を保証しない。AdSense画面のads.txt状態も「不明」であり、再審査後にどう更新されるかは未確認である。
