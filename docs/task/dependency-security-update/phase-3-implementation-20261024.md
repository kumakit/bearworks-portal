# Issue #17 第3段階の実装計画（2026-10-24）

## 目的と採用範囲

braces の GHSA-vfj7-8cjw-p6xm は2026-10-23に「実際には悪用できない」として公式撤回された。Tailwind 3 と Next ESLint の両依存経路は残るが、この勧告を理由に CSS や対応ブラウザーを変更する必要はなくなった。撤回は修正版の公開とは区別する。

初回監査は production が Next.js の critical 1件、全体が Next.js critical 1件と開発用 Zod high 1件。続く監査では開発用 body-parser の high 1件も検出された。Next.js 16.3.8 と eslint-config-next 16.3.8 を公開済み16.4.3へ、Zodを親の許容範囲内で4.6.6以降へ、body-parserを親の `^2.2.1` の範囲内で修正版2.4.0へ更新する。初期案ではOpenNext 1.20.2のpeer条件が候補を許容すると確認したが、実動作検証後は下記のとおり1.20.13へ変更した。

ユーザーは2026-10-24に、この更新と例外削除を先へ進めることを承認した。元の Next minor 非目標をこの安全更新に限り変更する。React、Tailwind、CSS、記事・固定集計、広告・認証、Worker設定、Route/DNS/Access/secret は変更対象外。監査の例外で警告を隠したり、force更新は行わない。

## 変更と安全境界

実動作で互換問題を確認したため、OpenNext 1.20.2維持案を変更する。Next 16.4.3で `/.next/server/preview-props.json` が新たに参照され、Workers previewの未存在ルートが500になった。公式OpenNext 1.20.12のリリースはNext 16.4対応とこのmanifestのinline修正を明記する。追加のruntime修正も含む同系列の安定patch 1.20.13を採用し、peer最小条件に合わせWranglerを4.147.0から4.148.0へ更新する。独自のnode_modulesパッチやWorker設定変更は行わず、更新後の監査・ビルド・404/API・全previewを再検証する。

OpenNext更新後は `@opennextjs/aws@4.1.12 → @node-minify/core@9.0.2 → glob@10.3.3` の固定指定からGHSA-5j98-mcp5-4vw2が発生する。coreの9系列最新も9.0.2で修正済み親がないため、この親に限りglobを同じ10系列の公式修正版10.5.0へoverrideする。勧告はCLIの `-c/--cmd` を対象としlibrary APIは非対象だが、警告を例外化せず実際の修正版を使う。minifierのAPI互換性とWorkersビルドを検証する。上流coreが修正版globを通常解決するようになったらこのoverrideを除去する。

- 最新 origin/main を Issue #17 専用の既存作業ツリーへ取り込む。親作業ツリーと他Issueの作業を保持する。
- package.json / lockfile の上記依存だけを指定更新し、差分と全コピーを確認する。
- config/dependency-audit-exceptions.json を削除する。監査ゲートを例外比較から警告0件必須へ変更し、新規警告、critical、通信失敗、不正JSONを拒否する。
- ゲートの意味が変わるため、警告0と失敗経路を対象に既存テストを更新する。既存 Workers CI の Linux・Node 22・native sharp・preview 検証を維持する。
- 16.4系への更新で確認された互換問題があれば受入を止め、原因と代替を評価する。警告抑制やLint無効化で通さない。

依存の公式修正版への限定更新と既存ゲートの厳格化であり、認証・公開API・DB・インフラ設計は変更しない。今回は追加の手動外部計画レビューを必須とはせず、Lunaの読み取り専用点検と司令塔の差分確認、既存Linux CIを受入判断に使う。既存計画の手動レビュー条件（互換代替やTailwind 4移行）は今回に該当しない。

## 検証と公開判断

1. 更新前後の production / full 監査JSONと実行状態、依存ツリーを保存する。更新後は両方0件、例外ファイルなしが必須。
2. npm ci、npm ls、監査ゲートテスト、Cloudflareテスト、固定bundle検証、Lint、Next build、OpenNext buildとdry-runを確認する。
3. Windowsの結果だけで本番対応を完了としない。同じ変更のUbuntu/Node 22 Workers CI、記事・例題・ガイド・広告境界・画像・API401/405/no-store・previewを確認する。
4. push、merge、deploy、Issue closeを別に判定する。pushはユーザーの明示承認後。Issue closeと追跡停止は公開後確認まで完了してから。
5. deploy前に最新mainと現在配信版を再確認し、直前の正常なWorker versionを復旧先に記録する。公開後に5xx・描画・画像・広告/認証境界の回帰があれば停止し、その版への復旧を判断する。現行配信版はまだ取得していない。

## 一次資料

- [braces勧告の撤回](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [Next.js Image Optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [Next.js Server Actions](https://github.com/advisories/GHSA-p3m5-59mp-jv5r)
- [Next.js use cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr)
- [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [body-parser](https://github.com/advisories/GHSA-27r3-jxmh-p828)
- [glob CLI: official patched 10.5.0](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)
- [OpenNext 1.20.12: Next 16.4 / preview-props対応](https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.12)
- [OpenNext 1.20.13: runtime修正](https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.13)
- npm registry: next@16.4.3、zod@4.6.6、@opennextjs/cloudflare@1.20.2 peerDependencies（2026-10-24確認）
