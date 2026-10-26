# Issue #419 挿絵追加

2026-10-26 JST。ユーザー依頼「第1弾、第２弾のような挿絵を追加してください。」に対応。

対象は公開済み `/labs/hachioji-aging` の導入挿絵とOGP/Article画像のみ。分析データ・本文の結論・チャート計算は変更しない。既存の承認済み記事公開計画の範囲で、専用branch、PRの必須CI、本番Linux artifact、既存Workers deploy、記事と画像の実URL/ブラウザ確認まで進める。

## 素材と実装
- Built-in image_genを使用。第1・2弾の画像を実際に見て画風を確認。生成にはテキストプロンプトを使用。
- 元画像はCodex生成画像領域に保持。既存画像の置換はしていない。
- 公開素材: `public/images/hachioji-aging/hero-illustration.webp`、1536×1024、478894 bytes（WebP quality 85）。
- PCは本文と画像を2列、スマホは縦配置。AI生成・実在の場所や人物/年齢構成比率を再現しない旨を注記。
- OGP/Article JSON-LDへ同じ画像を設定。静的画像を直接配信し、画像最適化APIを追加しない。

## 必要最小限の検証
新しい画像のHTML参照・注記・OGP・200・MIME・ファイルバイト一致を既存ページ検証に追加。PC1280px/スマホ390pxの画像と横幅、consoleを確認。既存の必須CIと同一commitの本番artifact結果を利用し、分析テストをローカルで重ねない。

## 生成プロンプト（原文）

```text
Use case: illustration-story. Asset type: editorial hero illustration for the Japanese article 'Is Hachioji becoming a city of older residents?'. Create a new 1536x1024 landscape illustration, 3:2 aspect ratio, no text. Match the visual family of polished Japanese animated-film background paintings: detailed gently idealized suburban Hachioji streets, lush Tama foothills, airy blue sky and layered soft white clouds, delicate painterly foliage, warm natural sunlight, realistic perspective, calm friendly everyday atmosphere. Scene: an accessible gently level neighborhood park promenade and small open public plaza in Hachioji, with residential houses and a few apartment buildings beyond, and green hills on the horizon. In the foreground an older Japanese couple walking comfortably side by side; a little farther away two older neighbors casually chatting beside a bench; elsewhere a parent and child and a young adult strolling, all small naturally proportioned full-body figures within the wider townscape. Emphasize ordinary independent daily life and an inviting multigenerational neighborhood, without suggesting that the illustrated crowd represents statistical age shares. Early-autumn light, some gold/orange leaves balanced with green trees, muted ochre and teal accents, beautifully detailed but not visually crowded. Compose as a complete landscape image to sit alongside article text on a dark navy hero panel, with a clear calm central focal area and important figures safely inside the edges. Do not copy the exact scene or composition of the earlier population article's steep downhill street; this is a new park-side everyday scene. No graphs, numbers, letters, labels, logos, watermarks, signage text, dramatic decay, medical imagery, or stereotypes of frailty. Background is opaque.
```

## 実装時の確認

- HTTP: 既存の本文/導線/配布バイト検証に加え、hero画像・注記・OGP・WebP 200/MIME/バイト一致がPASS。
- 実ブラウザPC1280pxとスマホ390pxで画像読込・改行・本文と挿絵の配置・注記・横あふれなしを確認。console error 0。
- Lunaが読み取りレビューし、分析値・本文の結論の変更なし、alt/AI注記・OGP/Article参照・静的配信を確認。
- 公開後のcommit/Worker版と検証結果はIssue #419の追記に記録する。
