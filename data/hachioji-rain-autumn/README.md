# 第7・8弾の固定観測原本

気象庁「過去の気象データ・ダウンロード」から2026-10-04に取得した、八王子・東京の2009-01-01〜2025-12-31の日別観測です。

- `jma-daily-2009-2025-20261004.csv`: 応答の原バイト。Shift_JIS、502,244 bytes、6,209日 × 2地点。改行や文字コードを変換しない。
- `source-manifest.json`: 取得日時、URL、リクエスト、サイズ、SHA-256。
- 温度は日平均・日最高・日最低。降水量は雪等を水に換算した量も含む。品質・均質番号・東京の現象なし情報を保持。
- データの出典: https://www.data.jma.go.jp/risk/obsdl/
- 形式・品質情報: https://www.data.jma.go.jp/risk/obsdl/top/help3.html

取得スクリプト `scripts/fetch-hachioji-rain-autumn.mjs` は既存原本への上書きを拒否する。通常のbuildはネットワークへアクセスせず、固定原本から集計を再生成して完全一致を確認する。

## 再現

リポジトリrootで以下を個別に実行する。

```powershell
node scripts/generate-hachioji-rain-autumn.mjs
node scripts/validate-hachioji-rain-autumn.mjs
uv run --no-cache --no-project --offline python -X utf8 scripts/verify-hachioji-rain-autumn.py
node scripts/verify-hachioji-rain-autumn-sources.mjs
```

Python検算は標準ライブラリのみで、JavaScript生成器をインポートしない。最後のコマンドは保存済みHTML14ページから844個の値・品質をオフラインで照合する。`--fetch` はHTMLが未保存の場合に限り気象庁から取得する明示的なオンライン操作で、buildには入れない。

表示用JSONは `app/(monetized)/labs/hachioji-{rain,autumn}/data/` に生成される。CSV原本とmanifestは `public/data/hachioji-rain-autumn/` にバイト一致でコピーし、記事からダウンロードできる。

## 定義

雨は2015〜2025年のうち、両地点の全日が正常値の8年（2015/16/17/18/21/22/23/25）。2019/20年は準正常値、2024年は資料不足/欠測により主集計から除く。品質5を含む別集計は10年。除外年を0として割らない。

秋は9〜11月の91日。日平均15℃以上25℃未満を基本とし、14〜24℃/16〜26℃も計算。2009〜2025年のうち正常値のみで完結する14年を採用。2014/18/21年の秋は不完全で、品質5を含む別集計では全17年がそろう。

事前指定の2009〜2013年（5年）と2021〜2025年（主集計では2021年を除く4年）の平均差は、中間日数が−5.1日。品質5を含む5年対5年では−3.2日。日数の合計は連続した季節長ではなく、表示する範囲も信頼区間ではない。

## 境界

本ディレクトリは今回の記事用の固定スナップショットで、Apps側の常設分析パイプラインを変更するものではない。取得時の公開観測値を保存した記録であり、気象庁による将来の訂正を自動反映しない。観測値の正確性をハッシュだけで保証せず、別形式の公式表・別実装による検算を併用する。
