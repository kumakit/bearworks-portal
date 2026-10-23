# Issue #17 第3段階：braces の修正経路と CSS 移行判断（2026-10-18）

2026-10-24追記：以下は10月18日時点の調査記録。braces勧告は10月23日に公式撤回されたため、継続例外・CSS移行という推奨は現在適用しない。現在の採用範囲は `phase-3-implementation-20261024.md` を参照する。

## 今回の判断

現時点で検証済みの全警告解消経路はない。`braces` の公式勧告は `<=3.0.3` を対象とし、修正版を `None` としている。上流の `package.json` も 3.0.3 のまま。2026-10-18 の実監査は production 0件、全体 high 7件で、既存の開発用限定例外と一致した（`evidence/phase-3-2026-10-18/`）。例外は **2026-10-25 09:00 JST** に失効する。これは対策完了ではない。

上流の[報告Issue #70](https://github.com/micromatch/braces/issues/70)は深い入れ子による再帰エラーを報告し、保守者は既存の入力長制限と利用側で任意パターンを受け取らない設計を根拠に異議を述べている。[修正版を求めるIssue #84](https://github.com/micromatch/braces/issues/84)も閉じられた。これは勧告の撤回・修正版の公開を意味しないため、このリポジトリでは警告を誤検知と断定せず、既存の例外ゲートを維持する。

Tailwind 4への移行だけでは、Next.js 16.3.8 の ESLint plugin から `fast-glob` → `micromatch` → `braces` に至る経路が残る。警告件数だけを減らすためのCSS移行、Next 16に対するESLint設定14への後退、Lint無効化、未公開版への override は採用しない。第3段階とIssueの全警告解消項目は未完了のままにする。

## 現在の依存経路と到達性

`package-lock.json` では以下を確認した。いずれも `dev: true`。`braces` を直接利用するアプリコードは見つからず、現行の例外はローカルビルドとCIで、リポジトリにある定義済みのglob・ソースだけを処理する運用を前提とする。外部から任意のglobパターンを渡せる設計への変更は、この評価を無効にする。

| 経路 | 現在の版 | 対処に必要な確認 |
| --- | --- | --- |
| Tailwind 3 → chokidar / fast-glob / micromatch → braces | Tailwind 3.4.19、braces 3.0.3 | 修正済みTailwind 3系または互換代替が出るか。Tailwind 4ならCSS・画面・ブラウザー要件の評価が必要 |
| eslint-config-next → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch → braces | Next/Lint 16.3.8、braces 3.0.3 | 同じNext 16系で経路を断てる上流更新または安全な互換代替が出るか |

Next.js 16.3.8 の ESLint plugin は `fast-glob: "3.3.1"` を指定している。root の fast-glob 3.3.3 とは別に、plugin 配下にも 3.3.1 が入る。fast-glob の版を動かすだけでは、その先の micromatch / braces の勧告が解消するとはいえない。

2026-10-18時点で公開されている Next.js 16.4.2 の ESLint plugin 定義も `fast-glob: "3.3.1"` のまま。Nextのminor更新はIssueの非目標でもあり、この版を第3段階の修正候補とは扱わない。

## 選択肢

1. **上流の修正版を待ち、期限付き例外を厳格に維持する（現時点の推奨）。** 次回期限前に勧告、公開版、両経路、実監査を再確認する。修正可能性・依存経路・重要度・本番混入のいずれかが変われば、同じ例外を機械的に延長しない。
2. **両経路を断つ互換代替を個別に検証する。** 維持状況、脆弱な入力の処理、glob意味論、Lint対象ファイルと結果、build/CIを確認できる候補が出たときだけ別ブランチで試す。候補パッケージや fork の存在だけで `braces` の安全な置換と見なさない。
3. **Tailwind 4へ移行する。** サイトの対応ブラウザーを Safari 16.4+、Chrome 111+、Firefox 128+ にでき、CSS更新に独立した目的がある場合に検討する。現行アプリはCLIではなくPostCSS経由で使う。Tailwind 4.3.3 の `@tailwindcss/postcss` 定義にはCLI/Parcel watcherへの直接依存はなく、Tailwind側の `braces` 経路が消える可能性がある。ただし候補版の実際のlockfileと監査では未確認で、CLI側の依存結果を混同しない。公式手順では PostCSS plugin が `@tailwindcss/postcss` に移り、CSSの `@tailwind` 指令は `@import "tailwindcss"` へ変わる。現在の `postcss.config.mjs`、`tailwind.config.ts` の独自色・角丸・影、`app/globals.css` の `@apply` と、全画面のutility classを点検する。移行後もNext ESLint経路は残るため、これを全警告解消策とは扱わない。

このリポジトリ内に、古いブラウザーを対象外にできるという確定済み方針は見つからなかった。Tailwind 4移行を決める段階で、対象ブラウザーの判断を利用者へ確認する。

## 実装候補が出たときの受入条件

- 最新 main を基準に独立ブランチを作り、`npm ci`、`npm ls braces`、productionと全体の `npm audit --json` で依存経路を確認する。両監査0件、例外ファイル削除を全警告解消の条件にする。
- 置換候補では、既知の深い入れ子入力に対する安全性とglobの互換性を確認する。ESLint対象ファイル・警告の差分と、Tailwindの生成CSS/対象classの差分を評価する。
- `validate:bundles`、Lint、Next build、Ubuntu/Node 22 Workers CI、previewを通す。CSSを変更した場合は既存8記事、トップ、例題・ガイド、表・図・スマホ表示を移行前画像と比較し、記事操作とブラウザーerrorを確認する。
- PR、Linux CI、merge、必要な本番deployと公開後確認を別々に判定する。現時点では依存・CSS・Workerを変更せず、本番deployを行わない。

互換代替の採用またはTailwind 4移行を実装する場合は、依存置換・対応ブラウザー・公開画面への影響を具体化した計画を先に手動レビューへ出す。

## 根拠

- [GitHub Advisory: GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)（2026-10-18確認、修正版なし）
- [braces 上流の package.json](https://github.com/micromatch/braces/blob/master/package.json)（2026-10-18確認、3.0.3）
- [braces 上流の報告Issue #70](https://github.com/micromatch/braces/issues/70)、[修正版要求Issue #84](https://github.com/micromatch/braces/issues/84)（報告と保守者見解の相違）
- [Next.js 16.3.8 の ESLint plugin 依存定義](https://github.com/vercel/next.js/blob/v16.3.8/packages/eslint-plugin-next/package.json)
- [Next.js 16.4.2 の ESLint plugin 依存定義](https://github.com/vercel/next.js/blob/v16.4.2/packages/eslint-plugin-next/package.json)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)、[compatibility](https://tailwindcss.com/docs/compatibility)、[PostCSS package定義](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-postcss/package.json)
- このリポジトリの `package-lock.json`、`package.json`、`eslint.config.mjs`、`tailwind.config.ts`、`postcss.config.mjs`、`app/globals.css`、`config/dependency-audit-exceptions.json`、2026-10-18の保存監査

Lunaは上流の修正状況と両依存経路を読み取り専用で調査し、司令塔Codexが勧告、上流定義、lockfile、Issueの状態を再確認した。候補の実装・インストール・画面比較は未実施。
