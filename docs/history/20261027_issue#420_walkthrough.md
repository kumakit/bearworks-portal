# Issue #420 実装・公開記録

対象: https://github.com/kumakit/mission-control/issues/420
計画: `docs/task/issue-420/implementation_plan.md` r1.1。2026-10-27 JST、ユーザー「OK実装してください」で実装から公開確認まで承認済み。

## 変更と分析結果

- 新記事 `/labs/hachioji-city-center`。市掲載人口+586人（2022→2025年末）、23地点の歩行指標は前年比+2.5%、路面空き店舗は86→62（2021→2025年度）。人口は厳密な115ha内人口と同一視せず、マンション完成総数は未確定として表示。
- 2016–2025年度の23/32地点を分離。計画23地点の平日+2,271に対して全32地点は−14,343。過去との比較・地点別の増減・調査日の限界・市の背景説明と因果不明を明記。地図は位置/利用条件未確定のため不採用。
- 人口・空き店舗は長期系列の接続条件未達により別パネル。HTML表、平日/休日・23/32切替、出典、配布JSON/CSV、ローカル抽出/オフライン生成コード、資料hashと検算manifestを追加。
- Labs/sitemap正本、前作3記事の関連リンク、canonical/OGP/Article JSON-LD、専用CI検証と既存公開ルートallowlistを更新。

## 作業保全と担当

元checkoutの419未追跡資料は保持。上流との競合を上書きせず、origin/main `58803bd288aeb380b0fa8e67405d881f36bd31b8` から管理worktreeと `codex/issue-420-city-center` を作成。420資料だけを複写。原本PDF/抽出全文/PNGは元checkoutのignore済み `.local-research/issue-420/` を保持し、commit対象外。

Luna（gpt-6-luna）が資料の年次・集合検算と実装の読み取りレビューを担当。司令塔が計画・実装・一次照合・最終差分確認・GitHub・公開を担当。同一作業ツリーの書き手は司令塔のみ。任意の計画レビューは原文と採否記録を保存しMinor 3件を反映。

## 検証

- 全6PDF原本hash確認。全32地点×10年度×2日種の公表合計20値、2023/2024原表全行、2025全32個票、23地点の公表表アンカー、2:5加重と公表基準の丸め順序を照合。
- Python専用12テスト: PASS。重複/小計混入、欠測、対象集合、区域接続禁止、未来目標、日付、2:5加重、ゼロ分母、オフライン決定論性を含む。
- 固定bundleのオフライン再生成一致: PASS。10配布ファイルのhash・公開集合・記事JSONとの一致validator: PASS。
- ローカル実ブラウザ: PC1280px、スマホ390px。ページ横幅に溢れなし、23/32・平日/休日の切替を確認、コンソールerror/warnなし。スマホ見出しは意味の区切りで改行を調整。
- 必須Workers CI: [run 40522303732](https://github.com/kumakit/bearworks-portal/actions/runs/40522303732) SUCCESS。専用/既存分析、audit、lint、型検査を含むNext build、Workers build、production/staging dry-run、preview全ルート・広告境界・新記事検証を含む。追加分析のオフライン検証も成功。

## 公開結果

- 記事: https://bearworks.uk/labs/hachioji-city-center
- [PR #46](https://github.com/kumakit/bearworks-portal/pull/46) merged。検証head `6aa64cbc1c4df09ad9adaa9f63061789e6f2246c`、公開main `b3342309253c13c70e85e7ff8865f6f769bc532e`。両treeは `3b3fddfd8e110548abefa7abe005664c20bcd2fc` で完全一致、公開前clean。
- 本番用Linux成果物: [run 40522919455](https://github.com/kumakit/bearworks-portal/actions/runs/40522919455) SUCCESS。artifact ID `12741439804`、`workers-production-b3342309253c13c70e85e7ff8865f6f769bc532e`。
- ZIP SHA256: `99d718f0aae83b2dae0f77cc16c5173932b9a1d8e2708dadfd4486abaa34a9ec`。GitHubのdigestと一致。全1598ファイルの展開一致、記事の配布10ファイルとOGPの同一性、本番AdSense IDを確認。CI成果物をOpenNext deployで公開し、Windowsでの再ビルドは行わなかった。
- 公開日時: **2026-10-27 23:42:40 JST / 2026-10-27 14:42:40 UTC**。
- 新Deployment: `0b86db38-faab-48b9-9716-d0fd07767321`、Version `d45774ab-3ee0-4c25-af50-3ba5760a2803`、100%配信をAPI出力で確認。
- 復旧先Deployment: `3930e816-e7ca-4c2b-8dd4-5c035755a374`、Version `ec002682-91e8-4a09-b691-07407a853fbf`（公開前100%）。

公開後の専用page verifierで、SSRの主要値・canonical/JSON-LD・前作3記事との相互リンク・Labs/sitemap掲載・配布全10ファイルのbytes・OGPを実URL照合しPASS。トップと記事200/本番広告ID、about/ai-news/contact/privacy/weather/404の広告なし、dashboard/APIの未認証302/Access/no-store、ads.txt/robotsもPASS。

実ブラウザで公開記事をスマホ390px・PC1280pxにて確認。ページ横幅は各375/1265pxでscrollWidthと一致、23/32地点・休日切替が動作、console error/warnなし。viewport overrideを解除し公開記事タブを成果物として残した。

## 展開時の問題と対応

初回ZIP展開はWindowsの長いパスで中断した。そこで後続コマンドも実行してしまったが、worker.js未展開によりローカルで失敗し、本番反映に至らなかった。長いパス用prefixで同じdigestのZIPを安全な対象パスへ再展開し、全1598ファイルが原成果物と一致してから、改めてdeployを実行した。ローカル生成物の問題であり、ソース変更・CI再実行・再ビルドは不要だった。

## 残る分析上の限界

115ha内の厳密人口と旧新人口系列の同一性、空き店舗調査の期間間の厳密な区域一致、近年竣工した区域内マンションの総数、売上・購買額、施策の因果的な寄与は未確定。その範囲を記事に明記しており、架空の補完・面積按分・新旧系列接続・竣工予定の実績扱いはしていない。今回の公開条件として追加のユーザー手動確認はない。
