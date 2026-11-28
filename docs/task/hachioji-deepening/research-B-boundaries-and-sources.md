# 調査B　八王子市の町丁別人口・境界・大学所在地

第5弾 `/labs/hachioji-students`、第6弾 `/labs/hachioji-international` の地図掲載に向けた公開資料調査。公開一覧、公式添付ファイルの見本、利用規約を確認した。

## 1. 住民基本台帳の町丁別人口

指定された[町丁別世帯数及び人口のURL](https://www.city.hachioji.tokyo.jp/shisei/002/006/p0037434.html)と[人口関連オープンデータ一覧のURL](https://www.city.hachioji.tokyo.jp/shisei/002/006/p031862.html)は、市の「お探しのページを表示できません」を返した。同名の[住民基本台帳の年度別索引](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/index.html)と[人口関連オープンデータ一覧](https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html)で確認した。

| 提供形式 | 公開範囲・基準日 | 公式一覧と直接URL |
| --- | --- | --- |
| CSV（旧一覧） | 2013年度から2023年度。月末現在。掲載は2013年4月～2021年10月、2023年12月～2024年3月。2021年11月～2023年11月のCSVは同一覧で未確認。 | [旧CSV一覧](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/p035453.html)／[2013年4月CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/p035453_d/fil/chouchoubetsu_jinkou_2504.csv)／[2024年3月CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/p035453_d/fil/chouchoubetsu_jinkou_0603.csv) |
| CSV（現一覧） | 2024年4月～2026年10月の各月末。旧一覧と合わせると2013年4月から2026年10月までの約13年半をカバーするが、上記の空白がある。10月の掲載日は2026年10月31日で、CSVの「処理年月日」は20261030。比較日には一覧の基準日を用い、処理日は別列として保持する。 | [現CSV一覧](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv.html)／[2026年10月CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv_d/fil/chouchoubetsu_jinkou_0810.csv) |
| Excel・PDF | 市の年度別索引に2013年度～2026年度の各年度の系列がある。Excelは月末現在。CSVの空白期は2021・2022・2023年度のExcel一覧から補完できる。全月のファイル内容は未確認。PDF見本は男女別、総数と世帯数を掲載し、日本人と外国人を合計している。 | [年度別索引](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/index.html)／[2021年度](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p029202.html)／[2022年度](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p030774.html)／[2023年度](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p032352.html)／[2021年11月Excel](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p029202_d/fil/0311matibetu.xlsx)／[2026年10月Excel](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p037433_d/fil/0810matibetu.xlsx)／[2026年6月PDF](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p037434_d/fil/0806matibetu.pdf) |

- **名称とコード**。2013年4月CSVはUTF-8 BOM付きで「対象年月」「大字名称」「人口＿合計」などを持ち、町丁コード列はない。2024年3月と2026年10月のCSVはUTF-16 LE BOM付きで、「大字コード」「大字カナ」「大字名称」「人口_合計」などを持つ。例は横山町の `00100`。先頭ゼロを保持する。コード列の追加時期と全月の仕様は未確認。見本には外国人人口の男女・その他の列もあるため、第6弾は対象月ごとの列と集計定義を確認すれば外国人住民数も比較候補になる。町丁別・国籍別の継続系列は未確認。[2013年4月CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/p035453_d/fil/chouchoubetsu_jinkou_2504.csv)／[2024年3月CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/p035453_d/fil/chouchoubetsu_jinkou_0603.csv)／[人口オープンデータ一覧](https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html)
- **町区域変更**。八王子インター北土地区画整理に伴う町区域変更は2016年3月12日に施行。上野第二地区では2024年8月10日に地番・住所が変更され、台町三・四丁目は一部が対象。市の旧新住所対照表ページでは1967年7月1日～2010年6月19日の住居表示による住所変更を確認できる。比較期間全体の町丁統廃合・名称変更・境界変更を網羅する一覧や市コードの履歴表は未確認。変更対象は前後で同じ範囲になるよう合算できる場合に比較する。[インター北の町区域変更](https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/001a/p004449.html)／[上野第二地区の住所変更](https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/001a/p032860.html)／[旧新住所対照表](https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/002/p004504.html)／[町名と面積一覧](https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/002/p004507.html)
- **利用条件**。市のCSVカタログはCC BY 4.0の出典表記例を掲載している。加工して公開する際は、データ名・八王子市・CC BY 4.0を示し、加工した旨を併記する。[人口カタログのライセンス](https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html)／[CSV一覧のライセンス](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv.html)

## 2. 地図の境界

- **採用候補はe-Statの国勢調査「町丁・字等境界データ」**。提供一覧では2000・2005・2010・2015・2020年分を都道府県または市区町村単位で取得できる。公開画面では国勢調査、町丁・字等、東京都、八王子市を選ぶ。公式案内の提供形式はShape（Shapefile）、KML、GML。Web掲載用のGeoJSONはShapefileからの変換を想定する。八王子市の配布ZIPの直接URLと2025年版の町丁・字等境界は未確認。[境界データ取得画面](https://www.e-stat.go.jp/gis/statmap-search?type=2)／[収録年次](https://www.e-stat.go.jp/help/data-definition-information/download)／[取得手順と形式](https://www.e-stat.go.jp/help/view-on/map/boundary_data)
- **商用掲載**。統計GIS機能利用規約第6条はe-Stat本体の規約に準じると定める。本体は商用利用を認め、出典および加工の記載を求めている。出典の掲載例は「政府統計の総合窓口（e-Stat）『令和2年国勢調査 町丁・字等境界データ』を加工して作成」。取得時に個別の第三者権利表示や追加条件を確認し、別途使う背景地図にはその提供元の条件を適用する。[統計GIS規約](https://www.e-stat.go.jp/gis-terms)／[e-Stat利用規約](https://www.e-stat.go.jp/terms-of-use)
- **結合方法**。2020年の定義書では `PREF` が都道府県番号、`CITY` が市区町村番号、`S_AREA` が町丁・字等番号、`S_NAME` が名称、`KEY_CODE` が図形と集計値のリンクコード。八王子市の市区町村コードは `13201`。住民基本台帳の5桁「大字コード」とGIS各コードの公式対応表は未確認。年月ごとに名称の数字幅・丁目表記などを正規化し、名称一致・不一致・多対一を一覧化したうえで、確認済みの対応をGIS側コードで管理する。同じ町丁が複数図形に分かれる場合は `KIGO_E` を確認し、人口の二重計上を避ける。GISの境界は調査用で、一般の地域境界や行政区域と必ずしも一致しないため、名称一致だけで範囲の同一性を判断しない。[2020年定義書](https://www.e-stat.go.jp/help/data-definition-information/downloaddata/A002005212020.pdf)／[e-Statの境界に関する注意](https://www.e-stat.go.jp/help/data-definition-information/download)／[市の報告表](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/p037434_d/fil/0806matibetu.pdf)

## 3. 大学・キャンパス

市の学校一覧は2025年5月1日現在の大学コンソーシアム八王子加盟25校の学校名、番地を含む所在地、キャンパス開校年月を掲載する。学校ごとの学生数や緯度経度の列はない。市外所在校と市境をまたぐ学校も含む。掲載住所を大学公式のアクセス情報と照合し、座標化すればピン表示できる。過去の移転元は対象時点のピンとして扱う。[市の学校一覧](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a791636/001/p031711.html)

| 移転 | 元の所在地 | 移転先の所在地 | 対象と根拠 |
| --- | --- | --- | --- |
| 拓殖大学・2015年4月 | 八王子キャンパス（現・八王子国際キャンパス）、東京都八王子市館町815-1 | 文京キャンパス、東京都文京区小日向3-4-14 | 商学部・政経学部の1・2年生が八王子から文京へ移り、文京での4年間一貫教育を開始。外国語・国際・工学の3学部は八王子国際で4年間一貫教育。[大学の再編事業](https://www.takushoku-u.ac.jp/summary/renaissance/)／[大学の事業報告](https://www.takushoku-u.ac.jp/summary/files/208_finance_h24business_report.pdf)／[八王子国際の住所](https://www.takushoku-u.ac.jp/summary/hachioji-access.html)／[文京の住所](https://www.takushoku-u.ac.jp/summary/bunkyo-access.html) |
| 杏林大学・2016年4月 | 八王子キャンパス、東京都八王子市宮下町476 | 井の頭キャンパス、東京都三鷹市下連雀5-4-1 | 保健学部（看護学科看護学専攻を除く）、総合政策学部、外国語学部および対象の大学院研究科が移転。[大学の移転対象](https://www.kyorin-u.ac.jp/univ/new_campus/department/)／[移転前の大学公式告知](https://www.kyorin-u.ac.jp/cn/html/kyorin/00003/201509012/index.html)／[井の頭の住所](https://www.kyorin-u.ac.jp/univ/new_campus/access/)／[市の学校一覧](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a791636/001/p031711.html) |
| 中央大学・2023年4月 | 多摩キャンパス、東京都八王子市東中野742-1 | 茗荷谷キャンパス、東京都文京区大塚一丁目4-1 | 法学部1～4年生が移転。多摩キャンパスは他学部で継続使用。[大学の移転発表](https://www.chuo-u.ac.jp/aboutus/communication/press/2021/10/56658/)／[大学概要](https://www.chuo-u.ac.jp/media/gaiyo/gaiyo25-26_42_20251205.pdf)／[両キャンパスの住所](https://www.chuo-u.ac.jp/access/) |

- **学生数の公表範囲**。市の第2期学園都市ビジョンは大学コンソーシアム八王子調査に基づく「市内の大学等」の合計を2006～2023年度のグラフで掲載している。市の2024年度版概要にも2024年5月1日の市内合計がある。市のミニ統計の「大学」欄は大学本部所在地ベースの集計で、キャンパス別学生数の代用には適さない。[第2期はちおうじ学園都市ビジョン](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a951649/dai2/p033733_d/fil/vision2_zentai.pdf)／[八王子市の概要2024年度版](https://www.city.hachioji.tokyo.jp/contents/kouhou/005/001/p025751_d/fil/r6gaiyou_syusei.pdf)／[八王子市ミニ統計2023年版](https://www.city.hachioji.tokyo.jp/shisei/002/006/mini/p032259_d/fil/R5minitoukei_kakumen.pdf)
- **学校別の資料と不足データ**。拓殖大学、中央大学、杏林大学は大学単位で在籍者数等の資料を公開している。複数キャンパスがあるため、学部別の数値を用いる場合も各年度の配属先・学年・基準日が必要。市内全校を同じ定義で比較できる学校別・キャンパス別の公開時系列や、学生の居住地別（町丁別）の公開時系列は未確認。[拓殖大学在籍者数](https://www.takushoku-u.ac.jp/academics/enrollment.html)／[中央大学学部在籍学生数](https://www.chuo-u.ac.jp/aboutus/overview/head_count/head_count01.html)／[杏林大学学園データ](https://www.kyorin-u.ac.jp/univ/outline/data_file.html)／[市の学園都市ビジョン](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a951649/dai2/p033733_d/fil/vision2_zentai.pdf)

## 4. 地図での表示上の注意

1. **少人数**。基準人口が小さい町丁では少数の増減で率が大きく振れる。増減人数と基準人口を併記し、ゼロと欠測を区別する。少人数の外国人住民等の属性を見せる場合は、地域をまとめるか表示を抑制する判断を公開前に行う。[市の町丁別CSV](https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv.html)
2. **面積差**。面積の広い町丁は色が目立つため、増減率の色分けに人数を添え、人数順の表でも確認できるようにする。比較図で色の範囲と基準日をそろえる。[八王子市の町名と面積一覧](https://www.city.hachioji.tokyo.jp/kurashi/kosekijumin/008/002/p004507.html)
3. **スマホ**。最初の表示は市域全体とし、指で選べるピン、タップで表示する町丁名と数値、地図と同じ内容を確認できる一覧を用意する。市外への移転先は表示範囲を切り替えられるようにする。[市の学校一覧](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a791636/001/p031711.html)

## 5. 実現可否

| 地図 | 判定 | 理由と根拠 | 必要な追加データ・確認 | 作業量 |
| --- | --- | --- | --- | --- |
| 町丁別の総人口の変化 | 条件付き | 市の月次人口とe-Stat境界を利用できる。年度間の町区域変更と両資料の結合を検証する必要がある。[市の年度別索引](https://www.city.hachioji.tokyo.jp/hachiouji/jinko/004/index.html)／[統計GIS](https://www.e-stat.go.jp/help/data-definition-information/download) | 比較月の人口ファイル、境界ZIP、町丁対応表、変更地区の旧新対応。試作は同じ月末で2時点を比較し、市の総計との照合と未結合の確認を行う。 | 中 |
| 大学・キャンパスの位置 | 可 | 市の一覧と大学の公式アクセス情報で所在地を確認できる。[市の学校一覧](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a791636/001/p031711.html)／[大学アクセスの例](https://www.chuo-u.ac.jp/access/) | 住所ごとの緯度・経度、座標の目視確認、同一住所のピンの表示方法、現・旧キャンパスを示す日付。 | 小 |
| 地域別の学生数の変化 | 不可（確認した公開資料の範囲） | 市の公表時系列は市内合計で、大学の在籍数資料は大学・学部等の単位。地域別の増減を算出する基礎となる統一時系列は未確認。[学園都市ビジョン](https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a951649/dai2/p033733_d/fil/vision2_zentai.pdf)／[学部別の公表例](https://www.chuo-u.ac.jp/aboutus/overview/head_count/head_count01.html) | 通学先を描く場合は年度別・キャンパス別在籍数と配属時点。居住地を描く場合は同じ基準で集計した年度別・町丁別の学生居住数。 | 大 |
