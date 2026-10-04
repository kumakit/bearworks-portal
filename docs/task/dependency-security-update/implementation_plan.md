# 依存関係警告の解消計画

2026-10-04作成・更新。状態：第1段階は本番公開まで完了、第2段階はローカル更新・検証・レビューまで完了。対象：`C:\Users\kumat\dev\bearworks-portal`。Issue #17、PR #18で先行更新を反映した。第2段階のLinux CI・公開、第3段階と全警告解消は未完了。結果は `release-result.md`、`phase-2-walkthrough.md`。

## 目的と方針

本番用依存の既知の警告3件を先に解消し、LinuxのCloudflare Workers環境で正常動作を確認して公開する。開発・ビルド用も対象に含め、修正可能な警告を順に除去する。修正版がない依存は、警告を消したように扱わず、代替・上流修正・残存リスクを管理する。

実装は3段階・原則3PRに分ける。本番用更新を、WranglerやCSSの大きな変更待ちにしない。記事本文、固定集計、原本、広告・認証設定は維持する。Reactの世代変更、Next.jsのmajor/minor変更、Route/DNS/Access/secretや新規インフラは今回の更新範囲に含めない。

## 更新前の確認結果

基準HEAD：`8918313ed9e9de89ed646064be798884f699b2d3`（ローカルmain、調査開始時clean）。lockfile SHA-256：`53898b3122495eb857beaa9bd3062fa5877c9b6f6d529919dee3f732d9708a6f`。ローカルNode v24.14.1、npm 11.11.0。既存CIはUbuntu・Node 22なので、更新後の最終受入は同じCI環境で行う。

|監査|critical|high|moderate|low|合計|
|---|---:|---:|---:|---:|---:|
|`npm audit --omit=dev --json`|1|1|1|0|3|
|`npm audit --json`（開発用も含む）|1|14|2|2|19|

19はnpmが警告対象として数えたパッケージ件数。依存連鎖による親パッケージの警告も含むため、独立した脆弱性が19種類あるという意味ではない。

原本：`evidence/npm-audit-production-before.json`、`evidence/npm-audit-full-before.json`。配布版と互換条件の読取結果：`evidence/registry-candidates.json`。監査情報は変化するため、実装開始時に取り直す。

## 第1段階：本番用の3件を先行解消

候補ブランチ：`codex/dependency-security-runtime`。

|対象|現在|更新候補・方法|確認すること|
|---|---|---|---|
|Next.js|16.3.0|16.3.8をexact指定|同じ16.3系列。既知のRCE修正版16.3.6以降を含み、追加のセキュリティ修正も含む|
|eslint-config-next|16.3.0|16.3.8をexact指定|Next.jsと同じ版へ。ESLint 9と既存設定の互換性|
|sharp（本番側）|0.35.3|Next.js経由で0.35.4以降へ解決|16.3.8のoptionalDependenciesは`sharp: ^0.35.4`。Linux用ネイティブ依存も確認|
|baseline-browser-mapping|2.10.27|許容範囲内で2.11.0以降へlock更新|Next.jsの指定`^2.9.19`が修正版を許容。lockが旧版を保持していないこと|

現OpenNext 1.20.2のpeer指定は`next: >=15.5.21 <16 || >=16.2.11`、`wrangler: ^4.86.0`。候補は宣言上許容される。実動作の互換性は未検証なのでCI合格が必要。adapterはこの段階では1.20.2を維持する。

実装時はNext.jsとLint設定を指定更新し、sharp・baselineの解決版を確認する。不足する場合だけ該当依存を既存semver範囲内で更新する。sharpを不要な直接依存として追加しない。無関係な直接依存の一括更新やlockfile削除・再生成は行わない。依存ツリー、配布元、integrity、peer conflict、想定外の新規依存を差分レビューする。

この段階の合格条件：`npm audit --omit=dev` が警告0・exit 0、既存Linux CIと画面操作が成功。全体監査には開発用の警告が残り得るため、残件を別表へ更新して明記する。第2・3段階の完了と混同しない。

## 第2段階：ビルド・公開ツールと修正可能な間接依存

候補ブランチ：`codex/dependency-security-toolchain`。第1段階の合格・反映後に進める。

|対象|候補と方法|注意点|
|---|---|---|
|Wrangler 4.114.0|監査推奨の安定版4.147.0を候補にし、修正を満たす4系列で固定|miniflare・undici・Wrangler側sharpの警告を親更新で解消。候補はMiniflare 5.20261001.0-alphaを含むため、peer範囲が合うだけで承認せず、build/dry-run/preview・公開コマンドへの影響を精査|
|esbuild 0.27.7|0.28.2を候補に固定|0.xの系列変更なので既存検証スクリプトとOpenNext出力を確認。ネストした別版はその版の勧告適用範囲も調べる|
|brace-expansion|各1/2/5系列の修正版へ範囲内更新|複数コピーを個別に追跡。異なるmajorへ全体overrideしない|
|browserslist、js-yaml、qs、postcss-selector-parser|親の許容範囲内の修正版へ選択更新|更新後の全体監査から修正を確認。ブラウザー対象やCSS生成結果の変化も点検|

原則は親パッケージの修正版と通常の依存解決を使う。上流の固定指定で更新できない場合だけ、互換根拠・期限・除去条件を付けた限定overrideを検討する。公開ツールの候補がCIを通らない場合は、必要な修正を含む別の4系列候補かOpenNextの同系列修正版を調査し、変更範囲を更新する。広いmajor更新で押し切らない。

合格条件：対象警告の解消、production監査0を維持、既存CI成功、新しいcritical/highを追加しない。残るbraces依存連鎖は第3段階へ明示して引き継ぐ。

## 第3段階：修正版のないbracesとCSS移行の判断

2026-10-04の公式勧告ではbraces <=3.0.3が対象、修正版は「None」。npmの最新版も3.0.3。現在はchokidar 3.6.0とmicromatch 4.0.8から使われ、Tailwind 3.4.19・fast-glob・NextのESLint plugin側へ警告が伝播する。

`npm audit` はTailwind 4.3.3やeslint-config-next 14.2.35を自動修正候補に示すが、そのまま採用しない。Next.js 16とLint設定14の組合せへの後退は行わない。Next ESLint plugin 16.3.8もfast-glob 3.3.1を保持するため、Tailwind 4移行だけで全警告がなくなるとは判断できない。

1. 上流の修正版・bracesを使わない互換代替が公開されたか、実装時点で再確認する。
2. Tailwind 4を選ぶ場合は独立PRで、PostCSS plugin、CSS import、テーマ設定、必要なclass互換修正をまとめる。色、余白、枠線、影、図表・表・スマホ配置を更新前画像と比較する。
3. Tailwind 4の対応ブラウザー（Safari 16.4+、Chrome 111+、Firefox 128+）がサイト方針に合うか、着手前に決める。古いブラウザー維持が必要なら移行案を再設計する。
4. ESLint側の残る依存も追跡し、上流修正版・互換代替の有無を確認する。Lintルールの無効化やNext pluginの単純削除で件数だけ減らさない。
5. 修正版・安全な代替が得られない場合、現在の呼び出し箇所と外部入力の到達性を改めて評価する。勧告ID・対象版・使用工程・緩和策・担当・再評価期限を限定した例外記録にし、全警告解消の項目は未完了のまま残す。

例外の初回再評価期限は実装時の記録日から14日以内に設定する。これは計画上の管理期限で、監視自動化の登録ではない。依存情報の誤検知と判定する場合にも公式根拠を必要とする。

## 共通の検証とCI改善

各段階で基準SHA・lockfile・監査JSONを保存し、更新後の同じSHAで以下を行う。

1. 新規checkout相当の`npm ci`、`npm ls`で再現性・peer・各コピーを確認。
2. `npm audit --omit=dev --json` と全体 `npm audit --json` を保存。productionは0件を必須とする。修正対象の消失と新規警告を勧告ID/依存経路単位で比較する。
3. 固定bundle全検証、lint、型検査を含むNext.js build、内部リンク方針を確認。既存Lint警告の件数だけで比較せず、内容も記録する。
4. Ubuntu・Node 22の既存Workers build workflowで、OpenNext build、production/staging dry-run、Workers previewを検証する。Windowsのbuild成功だけを本番受入にしない。
5. 既存例題30・ガイド8・sitemap54、シリーズ8記事、原本配布、広告/非広告/404境界、APIの401/405とno-store、静的アセットのimmutableを既存検証で確認する。新しいテストは回帰リスクに必要なものだけ追加する。
6. プレビューでトップ、代表例題/ガイド、雨・秋のグラフ切替/カレンダー/確認問題、PC/スマホ表示とブラウザーerrorを確認。CSS移行では全8記事と代表的な表・図の画像比較を広げる。

CIにはproduction監査の失敗判定と、全体監査JSONの保存を追加する。全体監査に修正版のない残件がある間は、勧告ID・版・経路・期限を限定した例外との差分で判定する案を採用する。新規critical/highや期限切れを見逃すための全体無効化・dev一律除外はしない。第3段階で全警告0となった場合は例外を削除して全体監査もexit 0を必須にする。

## 変更ファイルの見込み

- 第1段階：`package.json`、`package-lock.json`、`.github/workflows/workers-build.yml`、計画・検証記録。production監査ゲート、全体監査の証拠保存、Linuxネイティブ画像処理の確認は第1段階の受入に必要なので、この段階へ前倒しした。
- 第2段階：上記と必要な監査差分検証。全体監査の残件限定・新規警告判定はこの段階で追加する。adapter設定変更は互換問題が確認された場合に限定。
- 第3段階：上記と `postcss.config.mjs`、`tailwind.config.ts`、`app/globals.css`、移行に必要な限定class修正。実際の変更一覧は移行案確定後に更新する。

## 公開と復旧

第1段階だけでも受入を通したら先行公開できる。実装完了時に差分・監査結果・同一SHAのLinux CIを提示し、push/PR、merge、本番deployの承認範囲を明確にする。前回の記事公開の承認は今回の依存更新の外部操作へ流用しない。

deploy直前に最新mainの追加変更、実配信deployment/versionとbinding名・種類を再確認して復旧対象を固定する。前回記事のversionを自動で復旧先にせず、直前に配信されている版を使う。現在の公開広告IDをbuild前に設定し、既存 `npm run deploy` で公開。Route/DNS/Access/secretは変更しない。

公開後は2記事用12ルート検証、代表ルート/広告境界、sitemap/ads.txt、実画像、Accessの未認証リダイレクト（追跡せず確認）、画面操作を確認する。本番の認証済みAPI確認は既存セッションが利用できる場合に限定し、JWTやsecretを出力しない。

5xx、描画エラー、データ/画像欠落、広告境界・認証境界の回帰が出た場合は受入を止め、記録した直前のWorker versionへ復旧する。依存の旧lockfileと更新版を混在させず、ソースのrevertは検証結果と対応付ける。復旧対象には旧依存の警告が戻ることも記録する。

## 完了の区分

- 本番用3件の解消：第1段階の監査0、Linux CI、公開後確認まで。
- ビルド用の修正可能な警告の解消：第2段階の対象一覧が消え、検証合格。
- 全警告の解消：production・全体の両監査0、期限付き例外なし、必要な移行と公開確認まで。修正版のない残件を例外管理しただけでは、この区分を完了にしない。

第1段階でNext.js/Lint設定16.3.8、sharp 0.35.5、baseline-browser-mapping 2.11.27へ解決し、本番用監査0、全体17件を確認した。Ubuntu/Node 22のWorkers CIと本番公開後の確認は完了。未確認：CSS移行時のブラウザー方針、braces代替の実用性、本番の認証済みAPI（未認証のAccess境界は確認済み）。GitHub connectorで重複するopen Issueが返されないことを確認し、保存済み文案からIssue #17を登録した。同じIssueで残る段階を追跡する。

## 一次資料

- [Next.js 16.3.8リリース](https://github.com/vercel/next.js/releases/tag/v16.3.8)
- [Next.js Windows filesystem](https://github.com/advisories/GHSA-p293-qw3h-jr36)、[AVIF optimizer](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)、[next/og](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
- [sharp/libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)、[baseline-browser-mapping](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)
- [braces：修正版なし](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [OpenNext Cloudflare手順](https://opennext.js.org/cloudflare/get-started)、[Tailwind 4移行手順](https://tailwindcss.com/docs/upgrade-guide)
- npm公式registryメタデータは`npm view`で2026-10-04に読取。実装開始時には監査とともに再取得する。
