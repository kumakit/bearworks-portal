# Phase 1 地図素材と国コード対応

- 素材: Natural Earth Vector、1:110m Admin 0 Countries、v5.1.1 の GeoJSON。
- 固定元: `https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_110m_admin_0_countries.geojson`
- 配置: `public/maps/ne_110m_admin_0_countries_v5.1.1.geojson`
- SHA-256: `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f`
- 利用条件: [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/) によりパブリックドメイン。商用利用・改変・再配布可、表示義務なし。

## 実ファイルの確認

177 ポリゴン要素。`ISO_A2` は `-99` が 5 件、`CN-TW` が 1 件あり、Cloudflare の 2 文字コードとの単純結合には使えない。`ISO_A2_EH` は大文字英字 2 文字の値が重複なしで、無効値 `-99` が 2 件ある。描画には `ISO_A2_EH` の有効な値だけを使い、無効値は件数と結び付けない。

2026-10-11 のゾーン全体 24 時間の読み取り照会で観測した 34 コードのうち、`FR`・`TW` は `ISO_A2` では一致せず `ISO_A2_EH` で一致する。`HK`・`SG` は 1:110m Countries に対応するポリゴンがない。これらも国別一覧と合計・割合に残し、地図の色だけを付けない。観測に出なかった未知・特殊コードも同様に扱う。

国境と海外地域の分け方は [Natural Earth の配布説明](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/) に従う。この地図は接続元 IP の推定国別件数を補助的に示すもので、実際の所在地、政治的な境界の唯一の解釈、危険度を示すものではない。
