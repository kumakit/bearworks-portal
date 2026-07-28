# Issue #344 Phase 3-0 計画レビュー

## 実行状況

- Antigravityランナーはtarget/control repoのbranch・HEAD・clean確認に成功した。
- `agy models` が空配列を返し、計画レビュー用の許可モデルを選択できなかったため、Antigravity実行は開始前に終了した。
- 同一要求は再試行せず、読み取り専用のCodexレビューワーへ同じ計画レビュー範囲を委譲した。
- LM Studio Gemmaの開始時git-statusは成功した。model load 35.382秒、推論4.312秒、`ok: true`。直接Gitでもcleanを確認した。

## 指摘と判断

### P1: nested layoutではsoft navigation後の広告実行環境を隔離できない

単一root layout内では広告ページから非広告ページへsoft navigationする。一度読み込んだAdSense scriptの実行状態が残る可能性があるため、広告・非広告を複数root layoutへ分け、境界間をfull page loadにする。

### P1: monetized layoutへscriptを置くと404にも出力される

動的slug pageが `notFound()` を返しても親layoutは描画される。scriptはlayoutではなく正常pageが共通componentを通じて描画し、slug検証後のreturnだけに含める。

### P1: `site-content.ts` の相対importが移動で壊れる

`./toukei/...` を参照しているため、移動後パスへの更新を変更対象へ追加する。sitemapのURL値は変更しない。

### P1: `NEXT_PUBLIC_*` をbuild後に設定するQAは再現できない

publisher IDはbuild前に設定する。通常buildとCloudflare buildの両方を確認する。

### P2: script方式とSSR検証が曖昧

既存のnative scriptを共通componentへ移し、対象の正常pageでSSR出力する。HTTPレスポンスのscript要素確認と、ブラウザ遷移のDOM/Network確認を分ける。

### P2: SEO・デプロイ回帰の証拠を追加する

代表URLのmetadata/noindex、sitemap URL集合、robots内容、`npm run pages:build`、対象/非対象/404のHTTP、ブラウザ遷移行列をQAへ追加する。

## 結論

P0はないが、当初計画のままでは受け入れ条件を満たさない。上記P1/P2を計画・タスク・実装プロンプトへ反映後に実装する。

## 公式仕様

- https://nextjs.org/docs/14/app/building-your-application/routing/pages-and-layouts
- https://nextjs.org/docs/14/app/building-your-application/routing/route-groups
- https://nextjs.org/docs/14/app/building-your-application/optimizing/scripts
