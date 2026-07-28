# Issue #344 Phase 3-0 タスク

## 計画

- [x] Issue #344の最新body・コメント・state・labels・assignees・milestone・更新日時・URLを確認する
- [x] target/control repoのGit root・branch・HEAD・dirty状態を確認する
- [x] LM Studio Gemmaの読み取り専用git-statusを1回実行し、直接Gitで再確認する
- [x] Antigravity計画レビューを起動する（`agy models` が空のため実行開始前に失敗）
- [x] 読み取り専用Codexレビューワーで計画レビューを継続する
- [x] 計画レビュー指摘を反映する

## 実装

- [x] 単一root layoutを広告・非広告の複数root layoutへ分割する
- [x] 共通root metadata/font/body設定を抽出する
- [x] 広告rootにhead配置の `beforeInteractive` AdSense scriptを追加する
- [x] トップページを公開URLを変えず広告対象グループへ移す
- [x] `/toukei/**` を公開URLを変えず広告対象グループへ移す
- [x] 非広告page subtreeを非広告グループへ移す
- [x] `site-content.ts` の統計データimportを更新する
- [x] `ads.txt` のpublisher ID一致を確認する

## 受け入れ条件

- [x] `/` と `/toukei/**` のheadにAdSense script情報とpublisher IDが出力される
- [x] `/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/about` のHTMLにAdSense scriptが出力されない
- [x] 統計ページ配下の存在しないslugと任意404にAdSense scriptが出力されない
- [x] 公開URLに `(monetized)` が現れない
- [x] `npm run build` が成功する
- [ ] `npm run pages:build` が成功する
- [x] 対象ページ・非対象ページ・`ads.txt`・`sitemap.xml`・`robots.txt` のHTTP確認が成功する
- [ ] 最終head配置版で対象/非対象間のブラウザ遷移とNetworkを再確認する
- [x] metadata/noindex/sitemap/robotsに意図しない差分がない
- [x] 実装後レビューのコードP1/P2指摘を修正する

## 未解決のリリースゲート

- `npm run pages:build` は通常のNext.js build後、`@cloudflare/next-on-pages` のVercel変換で `Unable to find lambda for route` となる。Windowsの `spawn bash ENOENT` だけではなく、Git Bash経由およびVercel CLI直接実行でもroute group配下のrouteで再現した。
- 最終的な `beforeInteractive` 版について、SSR HTML上のhead script queueと対象外/404への非出力は確認済みだが、実ブラウザのNetworkと戻る・進む遷移は未再確認。
- 上記2点が解消するまで、本番反映・再審査申請・Phase 3-0完了とは判定しない。

## スコープ外の次段階

- [ ] Phase 3-1: Issue #372の独自分析コンテンツを公開する
- [ ] Phase 3-2: `/about` と各記事の制作・検算・AI利用・修正履歴表示を強化する
- [ ] Phase 3-3: 本番反映・Search Console・運用実績を確認して再審査可否を判断する
