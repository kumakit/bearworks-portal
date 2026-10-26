八王子の高齢化記事 固定データ r1 / 2026-10-26
市内比較: 2016-09-30 / 2026-09-30。市間比較: 2026-01-01。住民基本台帳、日本人+外国人。
出典と原本URL/SHA256/取得日時: source-manifest.json, retrieval.json。
八王子市: CC BY 4.0、文字正規化・年齢集計・図表化。
東京都: 数値の事実を独自集計。都の原表全体にCCライセンスを付けるものではありません。
75/85歳以上は65歳以上の内数。全体の100%帯は排他的5区分。
町丁は最新199、既知の区域変更等8町丁を除く過去比較191。
人口100人未満は順位を分離。変化順位は両時点100人以上。
地図は境界対応未解決で不採用。分母0は率なし、欠損は0補完しない。
東京都人数欄の「-」だけは公式注意書きに従って皆無/該当なしとして0件とし、総数と再確認。
年齢不詳の集計残差は採用対象すべて0人。

再現（Python 3.12以上、固定入力からの再生成は標準ライブラリのみ）:
  python generate_bundle.py --input-dir . --output-dir ./reproduced
配布ディレクトリにあるJSON、CSV、manifest等と reproduced を比較できます。

repo内:
  python scripts/hachioji-aging/generate_bundle.py --check
  python -m unittest discover -s scripts/hachioji-aging -p test_generate_bundle.py

公式原本を再取得し正規化する場合だけ、openpyxl/xlrdを指定:
  uv run --no-project --with openpyxl --with xlrd python scripts/hachioji-aging/prepare_sources.py --fetch
原本は .local-research/issue419 に保持（git/publicへ含めない）。
新たな取得は取得時刻とhashが変わるため、公開固定版を上書きせず別版として確認してください。
区域変更の出典と除外: region-exclusions.json。全市集計には除外8町丁も含む。
同じ人物を追跡したデータではなく、原因・暮らしやすさ・将来推計は示しません。
