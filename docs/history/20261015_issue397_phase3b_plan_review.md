# Issue #397 Phase 3B 計画レビューの採否

2026-10-15 JST。ユーザーから読み取り専用レビューを受領した。レビュアーは計画と Portal の現行コードを確認し、Apps のコードと実環境は確認していない。Codex は Portal・Apps の現行コードと Cloudflare の公式資料を照合し、計画案を更新した。レビュー原文は会話内にある。

| 指摘 | 採否と理由 | 反映先 |
| --- | --- | --- |
| A 名称・単位 | 採用。「Firewall イベントの記録数（参考）」にし、HTTP リクエスト数、攻撃・遮断件数と同一視しない。既存 `threatEvents` とも混ぜない。 | 設計1、合格条件A |
| B 空白時間・遅延 | 採用。返らない時間は0にせず空白・未確認とする。点だけを示し、線で結ばない。「記録のあった時間」は確定しないため「値を取得できた時間」とする。直近の空白には反映遅延の可能性を注記する。既存の連続点検証とは独立させる。 | 設計2、合格条件B、確認2 |
| C 必須判定との分離 | 採用。Portal の `ACCESS_KEYS` に追加すると `assessCollection` の `counts`・全体状態へ波及する。独立キーと評価関数を設け、Apps 側も `ACCESS_NAMES` と Digest 必須集合へ加えない。Apps 本番の `flatten` と `required_cloudflare_names` が固定キーのみを使うことを読み取り確認したが、追加後のテストで再確認する。 | 設計4、合格条件C、確認2・3 |
| D `count` と抽出 | 一部採用。値の定義と推計表示を明記する。Cloudflare は抽出時の集計値を推計として返すため、`count × sampleInterval` は二重の補正になるおそれがあり採用しない。返却 `count` をそのまま点で示し、間隔は精度判定に使う。合計・期間間比較は出さない。「棒・折れ線を一律禁止」ではなく、線を結ばない点表示を選ぶ。 | 設計2・3、合格条件D |
| E 重複・上限・部分応答 | 一部採用。上限・部分応答・範囲外をそのブロックだけ利用不可にする。`sampleInterval` は返却行の `avg` にあり、照会した次元は時刻のみ。同時刻で間隔が違う2行の意味は未確認なので合算しない。同時刻の重複はすべて利用不可にする。 | 合格条件E、確認2 |
| F 反映順 | 採用。Portal 読み取り、Apps のフラグ無効配備、有効化、定期運転の順にする。schema v2 の任意追加を旧読み取り側が無視し、欠落を未収集とすることを試す。 | 確認3 |
| G 画面位置 | 採用。初期状態を閉じた独立の参考欄とし、色以外でも状態を伝える。 | 設計5 |

追加試験項目も計画の「確認と反映の順番」2へ採用した。レビューが「`end <= attempted < end+1h` のため疎な系列を丸ごと失敗にする」とした点は、時刻窓の鮮度検証と連続点検証を混同している。疎な系列が現行アクセス検証を通らないこと自体は正しく、独立の検証規則が必要である。

根拠: Portal `cloudflareCollection.ts` の `parseCollection`・`assessCollection`、`CloudflareCollectionView.tsx` の `accessKeys`、Apps 本番の `cloudflare_contract.py` の `flatten`、`cloudflare_diagnostics.py` の `required_cloudflare_names`。[Cloudflare の抽出集計](https://developers.cloudflare.com/analytics/graphql-api/sampling/)は API 集計値を推計として返す。[信頼区間の説明](https://developers.cloudflare.com/analytics/graphql-api/features/confidence-intervals/)でも `count` を推計値として説明する。

本書は計画レビューの採否であり、Phase 3B の実装や本番反映の完了を示さない。

Luna は更新後の計画と Portal / Apps の関連コードを読み取り確認し、重大な矛盾なしと報告した。提案された `[windowStart, windowEnd)` の明記と、診断ログの必須項目・`unavailable`・`cfAvailable` が新ブロックの状態で変わらない試験を計画に追記した。司令塔はコードと計画を再照合し、この2点を採用した。
