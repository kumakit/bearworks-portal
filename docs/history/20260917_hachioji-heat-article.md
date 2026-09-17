# Issue #381 八王子猛暑・都心ヒートアイランド比較記事の実装記録

- 日付：2026-09-17
- 対象：`/labs/hachioji-heat`（シリーズ第3弾「街のうわさを、統計でほどく · 03」）
- 依頼：Issue #381 に基づき、八王子の夏の猛暑と都心ヒートアイランド比較ページを追加。先行する `/labs/hachioji-climate` と構成・デザインを統一する。

## 概要とコアメッセージ

八王子は「夏の最高気温ランキング」の常連として知られる一方、「熱帯夜の発生頻度」や「夜間の気温低下」については都心（大手町/北の丸公園）と大きな違いがあります。
「昼は都心より暑いが、夜は放射冷却と山風で涼しくなるのか？」という疑問を、気象庁オープンデータ（1990〜2025年の36年分の日別値および代表的猛暑日の1時間値）を用いて検証・可視化しました。

### データから言えること（結論）
1. **昼の猛暑日（35℃以上）**: 2020〜2025年平均で八王子は年23.7日、都心は16.8日。八王子が年約7日多い。
2. **夜の熱帯夜相当（日最低25℃以上）**: 2020〜2025年平均で都心は年38.7日、八王子はわずか11.7日。都心が年27日も多い。
3. **夜間の冷却カーブ**: 典型的な猛暑日（2018/7/23、2023/7/16、2024/7/29）において、八王子は日没後18時から翌朝5時までに5.7〜9.3℃急低下する一方、都心はコンクリート蓄熱と人工排熱（ヒートアイランド現象）により0.8〜3.1℃しか低下せず、早朝でも30℃前後の超熱帯夜となる事例が観測された。

## 固定成果物

- `app/(monetized)/labs/hachioji-heat/data/hachioji-heat-2026-09-17.r1.json`（63,059 bytes）
  - SHA-256: `895f0e900555d84ac7e3881a89bcf1b2ab451d82a826c52d638451cbbd9586d1`
- `app/(monetized)/labs/hachioji-heat/data/hachioji-heat-2026-09-17.r1.lock.json`
- `public/images/hachioji-heat/hero-illustration.webp`（1536×1024、260,384 bytes）
  - AI導入イラスト（夏の強い日差しに照らされる八王子の昼の街並みと、澄んだ星空のもと山風が吹く涼やかな夜の街並みの対比）

## 新規・変更ファイル

1. `app/(monetized)/labs/hachioji-heat/page.tsx`: メインページコンポーネント（セクション01〜06、確認問題5問、方法・出典、Article LD-JSON、回遊カード）
2. `components/HeatCharts.tsx`: SVGベースのグラフコンポーネント（4地点比較バー、36年間推移チャート、猛暑日24時間推移折れ線、冷却速度比較）
3. `lib/hachioji-heat-publication.ts`: 型定義・データ提供・計算ヘルパー
4. `lib/content-provenance.ts`: `hachiojiHeatProvenance` を追加
5. `scripts/generate-hachioji-heat-bundle.mjs`: 気象庁API連携およびバンドル生成スクリプト
6. `scripts/validate-hachioji-heat-bundle.mjs`: バンドル整合性・SHA-256バリデーションスクリプト
7. `app/(monetized)/labs/hachioji-climate/page.tsx`: 第3弾への相互導線カードを追加
8. `app/(monetized)/labs/hachioji-snow/page.tsx`: 第3弾への相互導線リンクを追加
9. `app/site-content.ts`: `/labs/hachioji-heat` を追加（sitemap件数 48 -> 49）
10. `scripts/verify-toukei-pages.mjs`: sitemap件数49および `/labs/hachioji-heat` 収録のアサーションに更新
11. `package.json`: `validate:hachioji-heat` および `validate:bundles` を追加

## 検証結果

| 項目 | 結果 |
|---|---|
| `validate:hachioji-heat` | PASS（バイト数、SHA-256、36年分データ、3事例整合性、冷却速度検算の一致確認） |
| `validate:bundles` | PASS（第1弾気候、第2弾雪、第3弾猛暑の全3バンドルが正常検証） |
| `npm run lint` | PASS（エラー0件、既存の別画面warning 4件のみ） |
| `npm run build` | PASS（全59静的ページ生成完了、`/labs/hachioji-heat` がStatic生成） |
| `npm run cf:build` | PASS（OpenNext Cloudflare Worker `.open-next/worker.js` 生成完了） |
| 生成HTML検証 | PASS（タイトル、カノニカル、OGP、LD-JSON、23.7日、38.7日、39.3℃の出力確認） |
