八王子は本当に土地が安い？ — 公開データと再現手順
価格時点: 2016-01-01、2026-01-01 / 取得日: 2026-10-26
単位: 円/㎡。住宅地のみ（用途区分000）。

出典: 国土交通省 国土数値情報（地価公示）。
原本入口 https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html
2026: CC BY 4.0（個別データ記載）。
2016: 商用可・国土数値情報旧利用約款。
https://nlftp.mlit.go.jp/ksj/other/agreement_02.html
出典・加工者・ライセンス・適用限界を利用先にも伝達してください。
加工: bearworks.ukによる住宅地抽出・正規化・集計・図表化。国が作成した分析ではありません。
価格は標準地の正常価格で、市内全ての土地や実際の売買価格を示しません。
位置は標準地の代表点で、敷地境界・売地の位置を示しません。
標本構成は年により変わります。座標は2016 JGD2000 / 2026 JGD2011。
位置の精度・資料の時間的制約を持ち、測量・登記・ナビゲーション用途を想定しません。

ファイル:
points.csv: 6市の全標準地 2016年344地点、2026年341地点。
continuity-audit.csv: 2026年341地点の同地点比較採用/除外理由。採用225地点。
normalized-inputs.json: 公式原本から抽出した固定入力。過去年の属性変更履歴を含む。
hachioji-land-prices-2026-10-26.r1.json: 平均・中央値・分布・同地点分析と地点データ。
source-manifest.json: 原本URL/取得日/hash・生成コードhash・利用条件・公表値照合。

再計算（追加ライブラリ不要、Python 3.12以上）:
generate_bundle.py と normalized-inputs.json を同じフォルダへ保存して実行:
python generate_bundle.py --input normalized-inputs.json --output reproduced

公式ZIPから抽出を再実行:
manifest記載の2026/2016 ZIPをsourcesフォルダにそれぞれ
issue413-L01-26_13.zip / issue413-L01-16_13.zip として保存後:
python generate_bundle.py --source-dir sources --input normalized-inputs.json --output reproduced
再生成した各ファイルと、配布ファイルのSHA256を比較してください。

平均は全地点を等しく扱う単純平均。中央値は偶数件なら中央2値の平均。
年次平均の差率=(2026平均/2016平均-1)*100。
同地点変化率は採用地点ごとの(2026価格/2016価格-1)*100を平均・中央値集計。
この2つは異なる指標です。
同地点は2017〜2026各年の選定状況1、所在地/地積/利用現況の変更なし、
両端の番号・正規化所在地・地積・2016履歴価格の一致と座標差30m以内で採用。
番号変更を推測でつながず、測地系差を移動量とはみなしません。
保守的な部分標本で、全継続地点や住宅市場の指数を代表しません。

照合: 国土交通省 第6表、各PDF1ページ目、件数/最小/最大が一致。
平均は100円単位四捨五入で一致。
2016 https://www.mlit.go.jp/common/001212283.pdf
2026 https://www.mlit.go.jp/tochi_fudousan_kensetsugyo/content/001986139.pdf
