# 八王子気候記事の構成・図表改訂（ローカル改訂案）

- 日付：2026-09-16
- 対象：`/labs/hachioji-climate`
- 依頼：雪の記事（第2弾）と同様に、統計検定2級の学習と図表を中心に第1弾をブラッシュアップする。
- 作業開始時：未変更のmainを確認し、公開済み第2弾を含むorigin/main `1dc9969` へfast-forward。
- 外部への書き込み・commit・push・デプロイは実施していない。

## 構成

「街のうわさを、統計でほどく · 01」として第2弾と見出し・余白・カードを統一。
導入イラスト → 結論 → 昼夜の暑さ → 冬日 → 年ごとの変動 → 日較差と中央値 → 比較条件と仮説 → 確認問題5問 → 方法・出典 → 第2弾への導線。

図表は固定JSONからサーバー側で生成。猛暑日・最低25℃以上・真夏日・冬日の4地点棒グラフ、八王子の各年の猛暑日、夏冬の日較差比較、H1の4区間比較を追加。棒は0始まりで、昼夜の比較図は共通の0〜50日/年。

## データと解釈

- 既存bundle・lock・H1〜H5判定は変更しない。SHA-256は `8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd`。
- 2020〜2025年の参考比較と、共通均質区間による仮説判定を区別。
- 最低25℃以上を熱帯夜と同一視しない。冬日は暦年、季節別日較差の冬Yは前年12月〜Y年2月。
- 日較差は各年・各季節の中央値を区間内で平均したもの。全日をまとめた中央値とは区別。
- 区間平均差の最小〜最大は信頼区間ではなく、仮説支持はp値の判定ではない。
- 時系列の独立性、観測地点と地域全体、観察結果と因果の違いを説明。
- 原データの再取得・再分析、新たな推測統計、インフラ変更は行っていない。
- 改訂案の人による公開確認は未実施。provenanceは確認待ちと明記し、旧CIを今回のCIとして扱わない。

## 検証

- bundle検証：PASS。区間平均を年間・季節集計から再計算する検証を追加し、全H1〜H5で一致。
- 年別猛暑日 `[19,5,17,23,32,46]`、合計142、中央値21、2024年の有効日363/366を照合。
- lint：0 errors / 既存の別ページの4 warnings。
- Next.js本番ビルド：PASS（58ページ）。初回はsandboxのGoogle Fonts通信制限で失敗し、許可付き再実行で成功。
- ブラウザー：PC・390px設定のスマートフォン幅で画像、比較図、目次アンカー、回答5件の開閉、ページ全体の横はみ出しがないことを確認。横長の年別図・表のみ内部スクロール。
- Linux/OpenNext/Workers配信検証は未実施。公開前にはLinux CIと運営者の公開内容確認が必要。

## 生成画像

- 使用：組み込みimage_gen（imagegenスキル）。
- 保存：`public/images/hachioji-climate/hero-illustration.webp`（1536×1024、475836 bytes）。生成PNGをWebP quality 85へ変換。
- ページにはAI生成の導入イラストと明記。特定日時・実在街路の再現や科学的な観測証拠とはしない。
- 第2弾の既存イラストは、続編カードで参照。

最終プロンプト：

```text
Use case: illustration-story. Asset type: hero illustration for a Japanese educational climate data article, landscape 1536x1024. Create an original refined editorial illustration showing the same fictional residential street in Hachioji, western Tokyo, in two seasons: left half a hot summer afternoon with vivid warm sunlight, green trees, subtle heat haze, distant low mountain silhouettes; right half a clear cold winter early morning with cool blue air, bare trees, small patches of frost but NO snow. The identical street perspective and modest Japanese houses continue smoothly between halves. A single ordinary pedestrian in summer clothing on the left, a single pedestrian in coat and scarf on the right, unobtrusive. Elegant textured gouache with clean architectural shapes, soft paper grain, mature magazine illustration, blue and amber contrast, not photorealistic, no charts, no thermometer, no numbers, no text, no logos, no watermarks, no exact identifiable landmark. Full bleed, balanced airy composition. Intended to evoke 'summer hot, winter cold' without implying an actual dated observation or a scientific causal diagram.
```
