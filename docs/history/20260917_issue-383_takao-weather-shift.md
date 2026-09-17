# Issue #383 高尾山頂の天候急変・ガス発生リスク検証ページの実装記録

- 日付：2026-09-17
- 対象：`/labs/takao-weather-shift`（シリーズ第5弾「街のうわさを、統計でほどく · 05」）
- 依頼：Issue #383 に基づき、高尾山頂（標高599m）の天候急変・ガス（濃霧）発生メカニズムと発生頻度を検証し、平野部との天候乖離（見せかけの晴れ）、夏の午後急変、冬の雨雪境界リスクを可視化・判定するページ `/labs/takao-weather-shift` を新規作成。

## 概要とコアメッセージ

高尾山は「世界一登山者が多い山」として軽装で訪れる観光客が多い一方、関東平野の最前線に位置するため湿潤気流の強制上昇（地形性上昇気流）や夏の熱雷による局地的な天候急変が頻発します。
「平野部は晴れ予報なのに山頂は濃霧・小雨」「雨量0mmなのに衣服がびしょ濡れになるガス濡れ」などの現象を、Open-Meteo標高モデル（599m）およびアメダス八王子の2024年全8,784時間の実測データから解明しました。

### データから言えること（結論）

1. **「見せかけの晴れ」は年間34日（約1割）**:
   八王子市街地では「降水なし＆雲量50%以下」の快晴であるにもかかわらず、山頂では湿度90%以上の濃霧（ガス）が日中2時間以上継続した日が年間34日観測された。特に6月（7日）、7月（6日）、9月（5日）の初夏・秋雨期に集中。
2. **夏の午後は急変・雷雨確率が約2倍に急騰**:
   6〜9月の時間帯別推移において、午前10時の降水確率は17.2%であるのに対し、午後16時には32.8%へと跳ね上がる。午前中が快晴であっても14時以降に夕立・熱雷が直撃するパターンが顕著。
3. **「ガス濡れ（湿潤沈着）」による低体温症リスク**:
   雨量計にカウントされない微細な浮遊水滴が衣服に沈着。水の熱伝導率は乾いた空気の約25倍であり、山頂風（3〜5m/s）が加わることで気温15℃前後の初夏・秋でも低体温症の危険が高まる。
4. **冬季の雨雪境界（年11日）**:
   冬期（12〜2月）、八王子市街地が2〜4℃の冷雨のとき、標高差476mによる気温減率で山頂は0℃以下の湿雪・凍結アイスバーンとなる境界日が年11日存在。

## 固定成果物

- `app/(monetized)/labs/takao-weather-shift/data/takao-weather-shift-2026-09-17.r1.json`（7,584 bytes）
  - SHA-256: `edc513aeaa3bd5ce1ced6e3e69d414feb8d56e0cd7d94ad4200e2a75f2ceac24`
- `app/(monetized)/labs/takao-weather-shift/data/takao-weather-shift-2026-09-17.r1.lock.json`
- `public/images/takao-weather-shift/hero-illustration.webp`（1264×848、154,558 bytes）
  - 青空広がる八王子市街地と、湿潤気流がぶつかり濃霧と急変雲に包まれる高尾山頂のコントラストイラスト

## 新規・変更ファイル

1. `app/(monetized)/labs/takao-weather-shift/page.tsx`: メインページコンポーネント（セクション01〜06、理解度確認5問、Article LD-JSON、回遊セクション）
2. `components/TakaoWeatherRiskMeter.tsx`: 動的リスク判定メーター（月・時間帯・平野予報・ルートに応じた急変危険度、見せかけの晴れ警告、推奨ギア提示）
3. `components/TakaoWeatherCharts.tsx`: SVGベースのグラフコンポーネント（夏期時間帯別急変ヒートマップ、月別見せかけの晴れ発生日数バー）
4. `lib/takao-weather-publication.ts`: 型定義・データ提供ヘルパー
5. `lib/content-provenance.ts`: `takaoWeatherShiftProvenance` を追加
6. `scripts/generate-takao-weather-bundle.mjs`: Open-Meteo API連携およびバンドル生成スクリプト
7. `scripts/validate-takao-weather-bundle.mjs`: バンドル整合性・SHA-256バリデーションスクリプト
8. `app/(monetized)/labs/hachioji-climate/page.tsx`: 第5弾への相互導線カードを追加（グリッド4列化）
9. `app/(monetized)/labs/hachioji-snow/page.tsx`: 第5弾への相互導線リンクを追加
10. `app/(monetized)/labs/hachioji-heat/page.tsx`: 第5弾への相互導線カードを追加（グリッド4列化）
11. `app/(monetized)/labs/takao-gear/page.tsx`: 第5弾への相互導線カードを追加（グリッド4列化）
12. `app/site-content.ts`: `/labs/takao-weather-shift` を追加（sitemap件数 50 -> 51）
13. `scripts/verify-toukei-pages.mjs`: sitemap件数51および `/labs/takao-weather-shift` 収録のアサーションに更新
14. `package.json`: `validate:takao-weather` および `validate:bundles` を更新
15. `.gitattributes`: `takao-weather-shift` の data JSON およびバリデーションスクリプトに `eol=lf` を指定
16. `.github/workflows/workers-build.yml`: CIのプレビュー検証に `/labs/takao-weather-shift` と画像URLを追加

## 検証結果

| 項目 | 結果 |
|---|---|
| `validate:takao-weather` | PASS（バイト数、SHA-256、月別集計、夏期マトリクス整合性） |
| `validate:bundles` | PASS（第1弾気候、第2弾雪、第3弾猛暑、第4弾装備、第5弾天候急変の全5バンドルが正常検証） |
| `npm run lint` | PASS（エラー0件、別画面既存warning 4件のみ） |
| `npm run build` | PASS（全61静的ページ生成完了、`/labs/takao-weather-shift` がStatic生成） |
| `npm run cf:build` | PASS（OpenNext Cloudflare Worker `.open-next/worker.js` 生成完了） |
| 静的HTML検証 | PASS（タイトル、カノニカル、見せかけの晴れ34日、ヒーロー画像WebPの正常出力確認） |
