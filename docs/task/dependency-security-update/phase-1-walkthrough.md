# 本番用依存更新：ローカル検証結果

2026-10-04。状態：ローカル検証完了・Linux CI待ち。本番には未反映。

## 変更と理由

Next.jsとLint設定を同じ16.3系列の修正版へ更新し、本番用間接依存も通常の許容範囲で更新した。記事・集計・React・Tailwind・OpenNext・Wrangler・認証・広告・インフラ設定は変更していない。

|依存|更新後|
|---|---|
|Next.js / eslint-config-next|16.3.8|
|sharp（本番側）|0.35.5|
|baseline-browser-mapping|2.11.27|
|OpenNext / Wrangler|1.20.2 / 4.114.0（維持）|
|React / Tailwind|18.3.1 / 3.4.19（維持）|

`npm install --save-exact next@16.3.8`、Lint設定のexact更新、`npm update baseline-browser-mapping`を実行。sharpを直接依存へ追加していない。force更新・override・lock削除は使っていない。lock差分42エントリーはNext/SWC関連・sharp/libvipsの各OS用optional依存・baselineの更新。追加削除・無関係な親依存の変更はない。

基準main：`8918313ed9e9de89ed646064be798884f699b2d3`。ブランチ：`codex/dependency-security-runtime`。更新後lock SHA-256：`50cbb0ef820a88f21cbad3adf9c274f0399abdb4e27137df9ac430c34540d2d0`。

CIではproduction監査を失敗判定へ追加し、依存ツリーと全体監査JSONを14日保存する。Linux上で実際にsharpを読み込み、lockの版と一致し通常の1px PNGを生成できることも確認する。第1段階の受入に必要なので計画上のCI改善の一部を前倒しした。全体監査は現段階では証拠保存であり、残件限定・新規警告比較の判定は第2段階で追加する。

## 監査

|対象|更新前|更新後|更新後の内訳|
|---|---:|---:|---|
|本番用（omit=dev）|3|0|exit 0|
|全体|19|17|critical 0、high 14、moderate 1、low 2。exit 1|

件数はnpmの警告対象パッケージ数で、独立した勧告数ではない。Wrangler側に残るsharp 0.35.2は開発用で、次段階の親更新で扱う。残る公開ツール/CSS/ESLintの警告を解消済みとは扱わない。全体監査と残件一覧の原本は `evidence/phase-1/audit-full-after.json`。

## ローカル検証

Windows、Node 24.14.1、npm 11.11.0。テスト広告IDとローカル用ダミートークンを使用。Linuxの検証を代替するものではない。

|確認|結果|
|---|---|
|`npm ci` / `npm ls --all --json`|PASS、peer不整合なし|
|通常PNGのnative sharp処理|PASS、0.35.5、90bytes|
|全固定bundle検証・Next build|PASS、64ページ生成・型検査成功|
|`npm run lint`|PASS、0 errors・既存4 warnings（画像1、dashboard effect3）|
|雨/秋記事検証|PASS、12ルート|
|Toukei既存検証|PASS、例題30・ガイド8・sitemap54・非広告6・不正ルート3|
|API/画像/静的asset|PASS、401/405、no-store、icon PNG、asset immutable|
|画面操作|PASS、雨の指標/順位切替・秋の温度帯/年切替・確認問題展開|
|PC/スマホ|PASS、1280/390幅で雨/秋に横はみ出しなし|
|トップ・代表ガイド/例題|PASS、正常表示|
|ブラウザーerror|操作確認の開始以降0件|
|`npm run cf:build`|PASS、OpenNext Worker生成|
|Wrangler production / staging dry-run|PASS、外部公開なし|
|CI YAML parse / `git diff --check`|PASS|

証拠は `evidence/phase-1/`。ログはGit保存用に行末の空白と末尾の空行を正規化した（診断内容は維持）。画面証拠：`autumn-desktop.jpg`、`autumn-mobile.jpg`、`rain-mobile.jpg`。確認用サーバーと一時ブラウザータブは終了し、公開記事のタブを保持した。

初回の `opennextjs-cloudflare build --skipNextBuild` は、通常Next buildにstandalone出力がなく `pages-manifest.json` 不在で失敗した。失敗記録を `workers-build-local.log` に保持。公式の `npm run cf:build` でNext buildを含めて実行し正常終了した（`workers-build-local-full.log`）。架空のmanifest生成や互換性チェックの無効化は行っていない。

production dry-runはトップレベル環境で成功したが、環境名を省略した旨のWrangler警告を記録している。既存Linux CIは `--env=""` / `--env staging` を明示して確認する。Browserslistデータの古さ、既存glob/node-domexception非推奨、Lint4件はこの段階で解消済みとしない。

## 独立レビューと残る確認

Lunaが読み取り専用で計画、依存差分、CI追加をレビュー。範囲の逸脱・重大な見落としなし。ただしUbuntu/Node 22での同一SHAのCI成功は未確認で、第1段階全体の受入完了ではない、との指摘を反映した。rootが実際の差分と証拠を確認した。手動外部モデルレビューは実施していない（同系列修正版・境界変更なしのため今回は追加しない）。

外部操作は未実施。Issue/PR文案を保存した。push承認後、同一SHAの既存Linux CIを実行・確認する。成功を条件にmerge・実広告IDでbuild・本番deploy・公開後確認へ進む。失敗時は修正し、変更したSHAで必要な検証をやり直す。CI未合格のまま公開しない。

第2段階のWrangler等更新は第1段階の受入・反映後。第3段階のbracesには修正版がなく、ブラウザー要件・代替を判断するまで全警告解消は未完了とする。deploy時は直前の本番versionを改めて固定し、必要ならその版へ復旧する。
