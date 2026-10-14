# Issue #397 Phase 3A 計画レビューの採否

2026-10-14 JST。ユーザーから Sonnet 5.5 の読み取り専用レビューを受領。レビュアーは計画書のみを読み、実装・本番・Issue 本文は確認していない。Codex は Portal と Apps の現行コードを照合し、以下を判断した。レビュー原文はこの会話にあり、本書は要点と採否を記録する。

| 指摘 | 採否と根拠 | 計画への反映 |
| --- | --- | --- |
| 1. 旧 WAF・Pages の失敗が消える | 一部採用。Apps の schema v2 では旧 WAF 5 項目は Digest 必須集合から除外済み。一方 `pagesMonth` は必須。旧 WAF の失敗を主画面へ戻さず、Pages の取得状態だけを補助欄に残す。 | 手順 3・4 |
| 2. 期限切れの基準 | 採用。Portal の `assessBlock` は `nowUpper >= validUntil` で値を利用不可にする。画面独自の期間別閾値は設けない。 | 手順 6・検証 |
| 3. 部分失敗と期間選択 | 採用。既存の選択期間は保ち、推移・国別・前期間比を独立表示する。 | 手順 5・検証 |
| 4. 「データについて」の説明 | 採用。既存の画面にあるゾーン範囲、推計、国不明、30 日比較の説明も踏まえ、短い補足を追加する。 | 手順 3 |
| 5. 失敗理由の対応表 | 採用。既存の `assessBlock` の分類済み文言を使い、生の例外文を出さない。 | 手順 7・検証 |
| 6. Digest とのずれ | 採用。現行 Apps は旧 WAF を必須とせず、Pages は必須であることを確認。アクセスの状態と別枠で示す。 | 手順 4 |
| 7. 戻し方 | 採用。停止・revert の条件と戻した後の確認を明記する。 | 戻し方 |
| 8. 開閉欄の見つけやすさ・操作 | 採用。閉じた状態の要確認表示とキーボード・狭幅・長文を確認する。ネイティブ `details` を使う。 | 手順 3・検証 |
| 9. セキュリティ判定の誤解 | 採用。アクセス可視化の画面であり、セキュリティ判定は含まない旨を短く示す。 | 手順 1 |

主なコード根拠: Portal `app/(non-monetized)/dashboard/lib/cloudflareCollection.ts` の `assessBlock`、`CloudflareAccessView.tsx` の期間・項目別表示、Apps `dashboard/cloudflare_diagnostics.py` の `required_cloudflare_names`、`dashboard/ai_operations/collect_metrics.py` の `extract_dashboard_snapshot`。Luna の読み取り調査も同じ依存関係を確認した。これは現行コードの確認であり、本番の Digest 設定・直近の実行状態を再測定したものではない。
