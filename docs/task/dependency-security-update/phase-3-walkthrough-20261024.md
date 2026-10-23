# Issue #17 第3段階：ローカル実装・検証（2026-10-24）

公開完了後の追記：Linux CI・merge・本番公開・必要な公開後確認は完了し、Issue #17はclosed、定期追跡はPAUSED。最終結果は `phase-3-release-result.md` を正とする。以下は公開前のローカル検証時点の記録として保持する。

## 現在の結果

ローカルのproduction・全体監査はともに0件。期限付き例外ファイルを削除し、全体監査ゲートは例外を扱わず、全severityの警告を拒否するようにした。公開サイトはまだ更新していない。Linux CI・merge・deploy・公開後確認は未実施で、Issue #17は未完了。

基準は実装開始時の最新origin/main `245b9d6`。既存PR #33の専用作業ツリー `codex/issue-17-phase3-plan` へmainをmergeして実装した。親作業ツリーの `codex/issue-408-radar-feasibility` は開始・終了確認ともcleanで、他Issueの作業は変更していない。PR #33の既存の調査文書は履歴として保持し、現在の計画への注記を追加した。

## 更新内容と理由

| 対象 | 更新後 | 理由 |
| --- | --- | --- |
| Next.js / eslint-config-next | 16.4.3 | Nextのcritical/high勧告の修正版。React世代は維持 |
| Zod（開発用間接依存） | 4.6.7 | 親の許容範囲内で公式修正版4.6.6以降へ |
| body-parser（開発用間接依存） | 2.4.0 | 圧縮リクエストのDoS修正版。親の `^2.2.1` 内 |
| OpenNext Cloudflare / AWS | 1.20.13 / 4.1.12 | Next 16.4のpreview-props manifest対応とruntime修正 |
| Wrangler | 4.148.0 | OpenNext対応版のpeer最小条件に合わせる |
| @node-minify/core配下のglob | 10.5.0 | 上流core9.0.2の10.3.3固定指定に対する限定override。公式修正版を使う |

bracesの勧告GHSA-vfj7-8cjw-p6xmは10月23日に公式撤回されたため、Tailwind 4への移行や依存の削除は不要となった。braces 3.0.3はTailwind 3.4.19とNext ESLintのdev依存経路に残る。修正版を適用したという意味ではない。CSS・Tailwind設定・対応ブラウザーの変更はない。

初回Next更新だけではOpenNext 1.20.2のWorkers previewが未存在ルートで500になった。ログの `Unexpected loadManifest(/.next/server/preview-props.json)` と公式対応版を照合し、OpenNextを更新して同じルートが404になることを確認した。初回の失敗ログは `next-only-preview-failure.log` に保存した。

OpenNext更新に伴う間接依存変更はlockの228箇所（追加・削除・版変更の合計）。`lock-version-changes.json` と差分で記録した。取得先は全てnpm公式registry、`npm ls --all`はexit0。AWS SDK・OpenNextのビルド依存変更を含むため、Linux CIでの最終受入は必須。

限定glob overrideは監査の例外ではなく、実際に修正版を解決する。core9.0.2の使用APIは `globSync` で、文字列・配列・publicFolder・brace展開・無一致と実際のterser圧縮を確認した。CLIは呼ばない。glob10.5.0には保守終了警告があり、CLIの修正には保守者による補足もあるため、CLI用途の安全性まで主張しない。上流coreが安全なglobを通常解決するようになったらoverrideを除去する。

## ローカル検証

証拠フォルダー：`evidence/phase-3-2026-10-24/`。保存ログは各行の末尾空白と末尾空行を正規化した。Node 24.14.1 / npm 11.11.0 / Windows。Ubuntu・Node 22の代替にはしない。

| 確認 | 結果 |
| --- | --- |
| 最新mainの監査（比較用） | production critical1、全体critical1/high2の計3パッケージ。新しいbody-parser勧告を含む |
| 更新後production / full監査 | 両方total0、npm exit0。新ゲートでも合格 |
| npm ci / npm ls --all | exit0。最終lockfileから再インストール |
| 監査ゲート | 20テスト成功。info〜critical、通信・実行失敗、件数不整合を拒否。実際の更新前監査も拒否 |
| Cloudflare既存テスト | 35テスト成功。アプリコード差分なし |
| 固定bundle検証・Next build | 成功。全64ページの生成、型検査完了 |
| Lint | exit0、error0、既存warning3（img1、effect内state更新2） |
| OpenNext build | 最終対応版で成功 |
| production / staging dry-run | 両方exit0。実際のupload/deployなし |
| 例題・ガイド・sitemap | verify-toukei-pages.mjs成功：例題30・ガイド8、未存在ルート404、sitemap54 |
| 雨・秋記事 | 既存verify script成功：12ルート、本文/schema/canonical/固定hash/原本/広告 |
| 追加の既存CI相当境界 | 24件の広告/非広告/404/API、画像、immutable静的asset、ads.txt/robots/sitemap成功。API GET401・POST405、no-store、dummy token漏洩なし |
| 反復並列リクエスト | 6ルート×3回、18要求すべて200・本文あり |
| Browser操作 | モバイル幅500pxで雨のグラフを降水日数へ切替。秋の14〜24℃・2021年（欠測あり）切替で集計・カレンダーが追随。1280×900でトップ表示。確認中browser error0、viewportは復元 |

OpenNextのWindows非完全互換警告、Nodeのmodule type警告、node-domexceptionとglob10.5.0の保守警告は残る。これらを依存監査の脆弱性警告と混同しない。CSS変更がないため全記事の移行前後画像比較は対象外。本番の認証済みAPIは未検証。

## 分担と次の判断

Lunaは読み取り専用で依存peer、監査ファイル削除時のCI依存、ゲート検証、OpenNextと限定glob更新の妥当性を点検した。司令塔が実際の9.0.2ソース・lock・監査・ビルド・preview・画面を確認した。計画レビューの判断は `phase-3-implementation-20261024.md` に記録した。

次はユーザーの明示承認後にpushし、PR #33のtitle/bodyを最終実装へ更新してUbuntu/Node 22 Workers CIを確認する。mergeとdeployはその結果を示して別途判断する。Issue close・追跡停止は本番確認が終わってから。次の公開前には、その時点の最新main・実配信版・復旧先を改めて確認する。
