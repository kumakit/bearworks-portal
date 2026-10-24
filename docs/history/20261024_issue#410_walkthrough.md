# Issue #410 実装ウォークスルー

日付: 2026-10-24 JST

## 実装

- `scripts/hachioji-population/` に正規化済みPhase 0入力から、固定JSON、lock/hash、公開用派生CSV、source manifestを再生成する処理とテストを追加。
- `app/(monetized)/labs/hachioji-population/` に記事と固定データを追加。全市推移・年齢構成・町丁順位を表示し、比較対象外8町丁は理由と両端の参考人口のみ掲載。地図は含めない。
- `components/PopulationCharts.tsx` に切替可能な図表とHTML表を実装。主要結論と表はサーバー描画HTMLにも含む。
- 新規 `/labs` 一覧、トップと気候記事の導線、共通 `site-content` 登録、sitemap出力を更新。
- bundle/page validator、人口Pythonテスト、Workers build workflowへの検査追加を実装。
- 配布ファイルを生成範囲限定にし、manifestの plannedFiles と実ファイル集合、ランキングの正確な順位と同率をvalidatorで照合。

## 独立レビュー

Lunaの読み取り専用レビューで、manifestに残っていたPhase 0時点の記述、4桁丸めで同率判定する率順位、ランキング回帰検査不足の3点が指摘された。manifestの時点を明確化し、率順位を整数比の交差積で計算し、順位と境界同率を検証するテスト/validatorを追加した。

## 実行した確認

- `uv run python -m unittest discover -s scripts/hachioji-population -p test_generate_bundle.py` — 4件成功。
- `uv run python scripts/hachioji-population/generate_bundle.py --check` — 10ファイル再生成一致。
- `npm run validate:bundles` — 人口と既存全bundle成功。
- `npx tsc --noEmit` — 成功。
- `npm run lint` — エラーなし。既存の無関係な3警告あり（toukeiの`img`、dashboardの2件）。
- `npm run cf:build` — OpenNext/Workers bundle生成成功。Windows上のOpenNext利用に関する注意が表示された。
- Workersローカルpreviewで `/labs`、人口記事、sitemapを取得し、`scripts/verify-hachioji-population-pages.mjs` 成功。Wranglerのローカルcache書込み警告が出たが、該当3ルートはHTTP 200で検証スクリプトも通過。
- ブラウザーで本文/表/リンク、表示切替、町丁選択、キーボード操作を確認。541px幅で水平overflowがないことを確認。PC幅/タッチ実機とGitHub Actionsは未確認。
- `git diff --check` — 成功。

## 未実施のゲート

commit、push、PR作成、Issue更新、merge、deploy、公開URL確認は未実施。計画の3PR分割も未実施で、現在は1つのローカル実装branchに全変更がある。公開前に公式資料の最新版再取得・hash比較、Cloudflare等の自動公開設定確認、PR分割と統合CI、操作ごとの明示承認が必要。

データ上の未解決事項はCSVとExcelの差の原因、一部区域変更の施行日、境界変更調査の網羅性。記事では主Excel系列を明示し、区域変更関連8町丁を順位と増減比較から除外し、残る地域の境界不変を完全立証したとは扱わない。
