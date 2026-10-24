# Phase 0 の再現

これは成立性調査用で、記事の完成版の取得・公開パイプラインではない。

Python 3.12以上とuvで、repoルートから実行する。元の資料を変更せずに同じ保存原本から検算できる。

```powershell
uv sync --project docs/task/issue-410 --locked
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/probe_sources.py
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/probe_sources.py --discover
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/probe_sources.py --discover
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/inspect_population.py
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/review_checks.py
```

取得の3呼び出しは順に、固定ページ・最初の添付、公式一覧から年別Excelページ、年別ページから9月末添付を取得する。保存済みなら再取得しない。既存のretrieval記録を保持する。ネットワークは公式公開資料のGETのみ。

この端末では通常のsandbox実行でDNSが失敗したため、公式資料取得とuv依存導入だけを承認レビュー付きで実行した。検算はローカルで実行。uv標準キャッシュのアクセス問題を避ける必要がある場合は、repo内のgitignore済み `.wrangler/issue410-uv-cache` を `--cache-dir` で指定する。

原本は `evidence/sources/`、依存環境は `.venv/` に保存し、いずれもgitignore。原本を削除せず、公式側の訂正を確認するときは別の保存先/版で取得しhashを比較する。取得時点が変われば検算値が変わり得る。元と同じhashの原本での再生成と、最新資料による再検証を区別する。

主な出力:

- `source-manifest.json`: データごとの出典・対象日・hash・利用条件・帰属/改変文言・配布予定。
- `evidence/retrieval.json`: 全取得記録。
- `evidence/validation.json`: 期間、人口・年齢検算、CSV差、地図判定、出力hash。
- `evidence/normalized/`: 年次人口、年齢、町丁対応、境界名称候補、CSV不一致一覧。
- `evidence/review-checks.json`: r2レビュー追加照合。2023～2026の川口関連人口/年齢一致、除外参考表、対象/分母、CSV感度、HTTP版情報。対象外8町丁に順位や増減率は付けない。

境界の名称候補が100%でも地理的一致を検証した意味ではない。判断は `feasibility.md` を参照。

# 記事データの再生成と検証

Phase 0で取得した公式原本を `evidence/sources/` に保存した状態から、正規化CSVを再生成した後、公開用bundleとCSVを作ります。

```powershell
uv sync --project docs/task/issue-410 --locked
uv run --project docs/task/issue-410 python -X utf8 docs/task/issue-410/inspect_population.py
uv run --project docs/task/issue-410 python -X utf8 scripts/hachioji-population/generate_bundle.py
uv run --project docs/task/issue-410 python -X utf8 -m unittest discover -s scripts/hachioji-population -p test_generate_bundle.py -v
npm run validate:hachioji-population
```

`generate_bundle.py --check` はファイルを書き換えず、保存済みbundleが正規化入力から再生成できることを確認します。`npm run validate:bundles` は人口bundle検証も含みます。取得原本はローカル専用で、公開配布物は生成済みの年次/年齢CSV、比較対象191町丁、比較対象外8町丁の参考表、CSV差の8町丁、集計JSON、manifestに限定します。
