# Issue #344 Phase 3-0 実装後レビュー

## 結論

広告対象と非対象のコード境界、およびAdSense codeのhead配置に関するP1/P2指摘は修正済み。通常のNext.js build、SSR HTML、metadata、noindex、sitemap、robots、ads.txtの回帰確認も通過した。

ただしCloudflare Pages向け変換が失敗するため、現状はリリース不可と判定する。最終head配置版の実ブラウザNetwork確認も残っている。

## レビュー方法

- 正規フローの `invoke_antigravity.py` を起動する前に対象repoと司令塔repoのGit root、branch、HEAD、dirty状態を確認した。
- `agy models` が空で外部モデルへ到達できなかったため、同一要求の再試行は行わず、読み取り専用Codexレビューへフォールバックした。
- 実装差分、計画、QA結果を確認し、修正後に再レビューした。

## 初回指摘と対応

### P1: AdSense codeがbodyへ出力される

初回実装は各pageからnative `<script>` componentを描画しており、Googleが指定するhead配置を満たしていなかった。

対応としてpage-level componentを削除し、`app/(monetized)/layout.tsx` の `next/script` に集約した。`strategy="beforeInteractive"` を使用し、対象rootでのみheadへ注入される構成にした。

### P2: native scriptのクライアント遷移時ライフサイクルが不明確

初回実装はpage単位のnative scriptで、対象ページ間の遷移における重複・再実行をNext.jsへ委ねられていなかった。

対応としてNext.jsのScript componentへ変更した。広告rootと非広告rootは別root layoutのため境界間はfull page loadとなり、前文書の広告実行環境を引き継がない。

## 修正後レビュー

- P1 head配置: 解消
- P2 script lifecycle: コード上は解消
- 対象外pageと404への漏出: SSR HTML確認でなし
- 公開URL、相対import、metadata、noindex、sitemap、robots、ads.txt: 通常buildとHTTP確認で回帰なし
- 残余P1: Cloudflare Pages変換が完了しないため、デプロイ可能性を証明できていない
- 残余QA: 最終head配置版の実ブラウザNetworkおよび戻る・進む遷移が未確認

## Cloudflare Pages変換の調査結果

1. 通常の `npm run pages:build` はWindowsで `spawn bash ENOENT`。
2. Git BashをPATHへ追加すると次の段階へ進むが `spawn npx ENOENT`。
3. Vercel CLI 47.0.4を直接実行すると、Next.js 14.2.3と `@cloudflare/next-on-pages` 1.13.16のpeer dependency不一致を検出。
4. legacy peer dependencyを許可して直接buildするとNext.js buildは成功するが、`Unable to find lambda for route: /toukei/guides/learning-roadmap`。
5. Vercel CLI 34.2.0でも `Unable to find lambda for route: /toukei/guides` を再現。

したがって、単なるWindows shell不足とは扱わず、複数root layout / route groupと現行next-on-pages変換系の互換性をリリースゲートとして扱う。

## 判定

実装差分はコードレビュー上の重大指摘を解消したが、Phase 3-0全体は未完了。Cloudflare実行環境での変換方式を決定し、成功buildと最終ブラウザQAを得てから本番反映へ進む。
