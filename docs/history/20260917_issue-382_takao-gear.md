# Issue #382 高尾山装備シミュレーターページの実装記録

- 日付：2026-09-17
- 対象：`/labs/takao-gear`（シリーズ第4弾「街のうわさを、統計でほどく · 04」）
- 依頼：Issue #382 に基づき、高尾山の気象データ（Open-Meteo標高モデル・アメダス八王子）から体感温度ギャップ・年間装備必須日数を可視化し、ルート・日時別の装備判定シミュレーターページを追加。先行する気候シリーズ（第1〜3弾）と構成・デザインを統一。

## 概要とコアメッセージ

高尾山（標高599m）は「世界一登山者が多い山」として軽装で訪れる人が多い一方、標高差・風速冷却・雨後の泥濘化によるスリップ事故や低体温症、日没遭難が後を絶ちません。
「スニーカーや普段着で登れるのか？ 本格登山装備が必要なのか？」という疑問に対し、Open-Meteoの標高指定APIおよびアメダス八王子の実測データから定量的に検証しました。

### データから言えること（結論）
1. **体感温度ギャップ（-4℃〜-6℃）**: 標高差476mによる気温減率（約-2.9℃）と山頂の平均風速（3〜5m/s）による風速冷却により、麓（八王子市街地）と山頂の体感温度差は年間を通じて4〜6℃低く、悪天候時は8℃以上開く。
2. **防寒着が必要な日（年167日・45.6%）**: 山頂の昼体感温度が10℃を下回る日は年間45.6%に達し、11月〜4月は防寒具の携行が必須。
3. **レインウェア必須日（年174日・47.5%）**: 年間47.5%の日で降水が観測され、山の急変に備えるシェルとしてもレインウェアの常時携行が不可欠。
4. **軽アイゼン警戒日（年22日・6.0%）**: 冬季（12〜2月）に降水後の氷点下冷え込みによりアイスバーンが発生する日が年に約20日前後存在。
5. **靴の境界線（舗装路 vs 未舗装路）**: 1号路（舗装率100%）は通常スニーカー可だが、6号路（沢沿い・増水）や稲荷山（赤土・粘土質で猛烈に滑る）は前日降水でスニーカーが破綻するため登山靴が必須。

## 固定成果物

- `app/(monetized)/labs/takao-gear/data/takao-gear-2026-09-17.r1.json`（15,773 bytes）
  - SHA-256: `4b4b0d866d91a5fb7a2343b728f358bc5d9dbba22934364c7b3470c01cedd1a3`
- `app/(monetized)/labs/takao-gear/data/takao-gear-2026-09-17.r1.lock.json`
- `public/images/takao-gear/hero-illustration.webp`
  - 賑わう観光参道と、防寒・登山装備で山頂から富士山を望む登山者の対比イラスト

## 新規・変更ファイル

1. `app/(monetized)/labs/takao-gear/page.tsx`: メインページコンポーネント（セクション01〜06、確認問題5問、データ出典、Article LD-JSON、回遊セクション）
2. `components/TakaoGearSimulator.tsx`: 動的装備判定シミュレーター（月・時間帯・ルート・天候に応じた体感温度、レイヤリング提案、持ち物チェックリスト）
3. `components/TakaoGearCharts.tsx`: SVGベースのグラフコンポーネント（体感温度ギャップ年間チャート、山装備日数スタックバー）
4. `lib/takao-gear-publication.ts`: 型定義・データ提供・計算ヘルパー
5. `lib/content-provenance.ts`: `takaoGearProvenance` を追加
6. `scripts/generate-takao-gear-bundle.mjs`: Open-Meteo API連携およびバンドル生成スクリプト
7. `scripts/validate-takao-gear-bundle.mjs`: バンドル整合性・SHA-256バリデーションスクリプト
8. `app/(monetized)/labs/hachioji-climate/page.tsx`: 第4弾への相互導線カードを追加
9. `app/(monetized)/labs/hachioji-snow/page.tsx`: 第4弾への相互導線リンクを追加
10. `app/(monetized)/labs/hachioji-heat/page.tsx`: 第4弾への相互導線カードを追加
11. `app/site-content.ts`: `/labs/takao-gear` を追加（sitemap件数 49 -> 50）
12. `scripts/verify-toukei-pages.mjs`: sitemap件数50および `/labs/takao-gear` 収録のアサーションに更新
13. `package.json`: `validate:takao-gear` および `validate:bundles` を更新

## 検証結果

| 項目 | 結果 |
|---|---|
| `validate:takao-gear` | PASS（バイト数、SHA-256、月別ギャップ、4ルート整合性、年間366日整合性） |
| `validate:bundles` | PASS（第1弾気候、第2弾雪、第3弾猛暑、第4弾高尾山の全4バンドルが正常検証） |
| `npm run lint` | PASS（エラー0件、別画面既存warning 4件のみ） |
| `npm run build` | PASS（全60静的ページ生成完了、`/labs/takao-gear` がStatic生成） |
| `npm run cf:build` | PASS（OpenNext Cloudflare Worker `.open-next/worker.js` 生成完了） |
| 静的HTML検証 | PASS（タイトル、カノニカル、シミュレーター、167日の正常出力確認） |
| Cloudflare Workers 本番デプロイ | PASS（Version ID: `4bb66d65-522f-43a2-97f0-e7e20d2f2e4c`、100%トラフィック稼働中） |
| 本番スモークテスト | PASS（`/labs/takao-gear` 200 OK、AdSense ID掲載確認、WebP画像配信確認、Sitemap確認、相互リンク確認） |

