# 八王子の外国人住民を読み解く第6弾

## 実装した内容

- `/labs/hachioji-international` に、外国人住民の人数と総人口比、国籍・地域別の構成、近隣6市の比較、在留資格の図を追加した。第5弾に合わせた冒頭と新しいAI生成イラストを使用し、相互リンク、Labs一覧、サイトマップ、SNS用画像を設定した。
- Antigravity が公開資料を基に日本語初稿を作成した。Luna は都・市の一次資料と在留資格「留学」の根拠を調査した。Codex は都の月次住民基本台帳10月CSVで総人口を再照合し、本文と図表を校正した。
- 2013～2026年の各10月1日の都の2種類のCSVを取得した。都の2026年10月表と八王子市の9月末表は人数と区分別人数が一致した。近隣6市の比較は都の同日資料を使用した。
- 国籍・地域は14年で共通する5区分を採用した。残りは一貫して総数から5区分の合計を引いて算出した。在留資格は市議会資料の2025年4月時点で、住民基本台帳の2026年10月の値から在留資格別人数は算出していない。

## 再現と検算

次の1行で元のCSVを再取得し、記事が参照する固定データと照合できる。取得日には公開JSONに記録した値を指定する。ファイルが訂正された場合はURL、表の内容、SHA-256を確認してから更新する。

```powershell
uv run --no-project --python 3.14 python scripts/import-hachioji-international.py --check --retrieved-on 2026-11-27
```

オフライン検証には `node scripts/validate-hachioji-international-data.mjs` を使用する。地域コード、日付、欠損、人口の内訳、国籍・地域別の残余、同日の6市比較、在留資格の対象月を確認する。Workers CIには数値検証と、記事のHTML、画像、データ、前後の導線を検証する工程を追加した。

## ローカル検証

- 公式CSVの再取得照合、固定データ検証、Next.js 16.4.6の本番ビルドと型検査、第5・6弾と統計検定ページの配信検証に合格した。lintはエラー0件、既存の警告3件。公開用データと画像がローカル配信で元ファイルと一致することも確認した。
- PC幅1440px、スマホ幅390pxと320pxで画像の読み込みと横幅を確認した。14年分の表を開けることを確認し、ブラウザのコンソールにエラーはなかった。
- Windowsの既存ファイルで改行変換が生じるため、ローカルのビルドはNext.jsを直接起動した。既存データ一式を含むWorkers CIはPRで検証する。

## 本番公開

- 2026年11月28日 07:12:17 JST（11月27日 22:12:17 UTC）に[第6弾](https://bearworks.uk/labs/hachioji-international)を公開した。[PR #50](https://github.com/kumakit/bearworks-portal/pull/50)をマージし、公開コミット `878c8f473580e0ababf7586110fe67d9eec5288c` が[Linux Workers CI](https://github.com/kumakit/bearworks-portal/actions/runs/46074525561)で検証したGitツリーと同一であることを確認した。
- [本番用Linuxビルド](https://github.com/kumakit/bearworks-portal/actions/runs/46074754330)の成果物 `15233584007` のSHA-256と全1,617ファイルの展開一致を検証した。WindowsではOpenNextで静的キャッシュを準備し、リポジトリで固定したWranglerで同じ成果物を公開した。
- 新Deployment `3135a635-8741-4049-ba45-63d76e44577f`、Version `a9cefdc8-ca57-475a-9106-c2b94b04cc78` が100％配信。復旧先はDeployment `55c54e79-c5c8-478b-b636-e1375115bac6`、Version `7c1a7b22-2f4f-4261-a162-357f43daec4d`。
- 記事・冒頭画像・JSON・第5弾との相互リンク・Labs・サイトマップ、および既存ページの広告境界を本番で確認した。管理画面とAPIは未認証で302と `no-store` を返した。PC幅1440pxとスマホ幅390pxで横はみ出しがなく、14年分の表の開閉ができ、コンソールにエラーはなかった。
