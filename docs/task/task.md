# Issue #344 Phase 3-0 タスク

## 計画

- [x] Issue #344の最新body・コメント・state・labels・assignees・milestone・更新日時・URLを確認する
- [x] target/control repoのGit root・branch・HEAD・dirty状態を確認する
- [x] LM Studio Gemmaの読み取り専用git-statusを1回実行し、直接Gitで再確認する
- [x] Antigravity計画レビューを起動する（`agy models` が空のため実行開始前に失敗）
- [x] 読み取り専用Codexレビューワーで計画レビューを継続する
- [x] 計画レビュー指摘を反映する

## 実装

- [ ] 単一root layoutを広告・非広告の複数root layoutへ分割する
- [ ] 共通root metadata/font/body設定を抽出する
- [ ] 正常page専用の共通AdSense componentを追加する
- [ ] トップページを公開URLを変えず広告対象グループへ移す
- [ ] `/toukei/**` を公開URLを変えず広告対象グループへ移す
- [ ] 非広告page subtreeを非広告グループへ移す
- [ ] `site-content.ts` の統計データimportを更新する
- [ ] `ads.txt` のpublisher ID一致を確認する

## 受け入れ条件

- [ ] `/` と `/toukei/**` のHTMLにAdSense scriptとpublisher IDが出力される
- [ ] `/ai-news`、`/weather`、`/dashboard`、`/contact`、`/privacy`、`/about` のHTMLにAdSense scriptが出力されない
- [ ] 統計ページ配下の存在しないslugと任意404にAdSense scriptが出力されない
- [ ] 公開URLに `(monetized)` が現れない
- [ ] `npm run build` が成功する
- [ ] `npm run pages:build` が成功する
- [ ] 対象ページ・非対象ページ・`ads.txt`・`sitemap.xml`・`robots.txt` のHTTP確認が成功する
- [ ] 対象/非対象間のブラウザ遷移でscriptの残留・重複がない
- [ ] metadata/noindex/sitemap/robotsに意図しない差分がない
- [ ] Antigravityによる実装後レビューの重大指摘が解消される

## スコープ外の次段階

- [ ] Phase 3-1: Issue #372の独自分析コンテンツを公開する
- [ ] Phase 3-2: `/about` と各記事の制作・検算・AI利用・修正履歴表示を強化する
- [ ] Phase 3-3: 本番反映・Search Console・運用実績を確認して再審査可否を判断する
