# 第2段階：開発・公開ツールの更新

2026-10-04。Issue #17を継続。基準main `301518e1858c6336e7eacb5535cd2c4938568e3e`、ブランチ `codex/dependency-security-toolchain`。本番公開までの承認済み依存更新を継続し、Linux CI合格後に公開する。この記事作業の本文・固定集計・広告・認証設定は変更しない。

## 変更と監査

|対象|更新前|更新後|
|---|---|---|
|Wrangler|4.114.0|4.147.0（exact）|
|direct esbuild|0.27.7|0.28.2（exact）|
|Miniflare|4.20260722.0|5.20261001.0-alpha（Wrangler経由）|
|Wrangler/Miniflare側sharp|0.35.2|0.35.4|
|brace-expansion各系列|1.1.14 / 2.1.3 / 5.0.8,5.0.9|1.1.21 / 2.1.7 / 5.0.12|
|browserslist|4.28.2|4.29.3|
|js-yaml|4.3.1|4.3.2|
|qs|6.15.3|6.16.0|
|postcss-selector-parser|6.1.2|6.1.4|

選択した直接依存と、親の許容範囲内の間接依存を通常のnpm解決で更新した。lock削除、force修正、overrideは使っていない。ブラウザー情報のcaniuse-lite/electron-to-chromium/node-releases等の追従更新、Wrangler依存のrootへの配置変更を含む。全118エントリーの前後・integrity・依存指定は `evidence/phase-2/lock-diff.json` に保存。Next/Lint 16.3.8、OpenNext 1.20.2、React 18.3.1、Tailwind 3.4.19、本番sharp 0.35.5は維持。

production監査は0件を維持。全体は17件（high14/moderate1/low2）から7件（high7）へ減少した。残る7件は独立した7勧告ではなく、[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) のbracesと依存連鎖（braces/chokidar/micromatch/fast-glob/tailwindcss/@next/eslint-plugin-next/eslint-config-next）。公式勧告とnpm最新版を再確認した時点では修正版なし。全警告解消は未完了。

## 限定した例外と検出

`config/dependency-audit-exceptions.json` に担当kumakit、Issue #17、対象版・経路・勧告・重要度・修正可否・理由・緩和策を限定して記録。初回再評価期限は **2026-10-18 09:00 JST**（14日以内）。自動延長や監視登録は行わない。上流修正版・互換代替を確認し、修正可能になれば例外を除去する。期限後はCIが失敗する。Tailwind 4への移行はブラウザー方針とNext Lint側の経路を別途判断してから行う。

確認した用途はTailwindのcontent収集・watchとNext ESLintのroot glob処理。`tailwind.config.ts` のcontentはrepo内のpages/components/appの固定パターン。`eslint.config.mjs` に外部rootDir指定はなく、Next pluginはcwdを使う。Tailwindのcontent.jsはfast-glob/micromatch、chokidarはbraces.expand、Next plugin get-root-dirs.jsはfast-globを使用する。例外の運用条件として、要求パラメーター・アップロード・外部設定等の未信頼入力をこれらのパターンに渡さない。これは脆弱性の修正ではなく、現在の開発用途を限定する緩和策。

CIではproduction auditをexit 0必須にし、全体auditは例外との完全一致を検査する。新しい警告（low/moderateを含む）、版・経路・勧告・重要度・修正可否の変化、古くなった例外、実行/通信失敗、期限切れを拒否。例外はlock上dev===trueのみで、本番依存は許容しない。criticalは集計と実entry/leaf双方で禁止し、severity集計の整合性も検査する。

## ローカル検証とレビュー

- npm ci、npm ls --all：成功。production監査0、全体監査7、限定例外検査成功。
- 監査ゲートの17テスト：成功。新規警告・経路・版・修正可否・期限・production混入・通信/形式エラー・隠れたcriticalの拒否を確認。
- Lint：error0、既存warning4（img1、dashboardのeffect3）。規則の追加無効化はない。
- 固定bundle検証、型検査とNext buildを含むOpenNext build：成功。
- 本番/stagingのWrangler dry-run：成功（公開なし）。
- Nextのローカル公開ページ：シリーズ8記事＋原本2＋トップ/sitemapの12ルート、例題30・ガイド8・sitemap54、非広告/404境界の既存検証成功。
- IABで秋の温度帯切替、2021年選択と9/13不採用表示、雨の3指標、確認問題を操作。秋1280px/390px、雨390pxの表示で横溢れなし。browser error0。画像を証拠保存。

Windows sandboxでesbuildが親ディレクトリの読取を拒否した初回build/統計記事検証は、通常権限で同一コマンドを再実行して成功。アプリ設定や依存を回避目的で変更していない。Linux Workers previewはローカルWindows成功で代替せず、PR CIで受け入れる。

Lunaは読み取り専用で依存差分、監査・例外ゲート、CIをレビュー。metadataだけを信じるcritical検査の不足を指摘し、司令塔が実entry/leaf検査と回帰テストを追加。Lunaの再確認と司令塔の17テスト・実audit検証が成功した。書き手・Git・公開操作は司令塔だけ。

Wrangler候補に含まれるMiniflare alphaについて、[旧版のpreview停止報告](https://github.com/cloudflare/workers-sdk/issues/15451)を参考にCIへ6ルート×3回の並列応答とプロセス生存確認を追加した。これは通常応答の反復確認で、ブラウザーが途中のリクエストをキャンセルした場合の耐性までは証明しない。旧版報告を候補版の不具合と断定しない。

## 公開受入

Linux CI、merge、直前配信版の取得、本番deploy、実URL確認は本記録作成時点では未実施。実結果は第2段階の公開記録へ追記する。復旧は直前の配信版を使う。Route/DNS/Access/secretを変更しない。本番の認証済みAPIは、既存セッションが使える場合以外は未確認として保持する。

一次資料：[Wrangler 4.147.0](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.147.0)、[esbuild 0.28.2](https://github.com/evanw/esbuild/releases/tag/v0.28.2)。監査・registry・log・lock差分は `evidence/phase-2/`。
