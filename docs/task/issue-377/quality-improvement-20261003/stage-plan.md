# 工程プラン

2026-10-03、issue-development-orchestratorのgenerate_stage_plan.pyで生成。入力はstage-state.json。モデル欄は推奨担当であり、実際に実行したモデルを意味しない。計画は司令塔Codexが作成し、gpt-6-lunaが棚卸しを担当した。

```text
STAGE PLAN
Type: DESIGN-HEAVY
Flags: EDITORIAL_JA=true
Input fingerprint: issue-377@2026-09-05T10:38:57Z|main:7da39a5c89e9e4f786913ed7bb452c08acdf20cb|quality-plan:2026-10-03.r2
Stages:
- planning: COMPLETED | Astra
- plan-review: COMPLETED | Gemini or Sonnet (manual)
- implementation: PENDING | Sol
- editorial-rewrite: PENDING | Gemini (manual)
- semantic-fact-check: PENDING | Astra
- editorial-fix: PENDING | Gemini (manual)
- code-review: PENDING | Sonnet (manual)
- verification: PENDING | Luna
- release: PENDING | Root Codex
NEXT ACTOR: MODEL
NEXT MODEL: Sol
NEXT TASK: implementation
PURPOSE: 承認済み計画に沿って実装する
INPUTS: Issue snapshot, branch/HEAD, upstream artifacts
ACCEPTANCE: 計画対象の差分とテストが揃っている
BLOCKERS: None
```

生成器のMODELは担当種別を示す。手動レビューの自動起動や他チャットへの送信は行わない。r1のGOをユーザー経由で受領し、司令塔が低優先度の補足を反映したr2の差分を再確認した。実際のレビュアーのモデル名は未確認であり、上のモデル欄は推奨担当のまま。操作中のHuman Gateは設定していない。NEXT TASKは工程順を示し、今回のレビュー受領を実装や外部操作の追加承認とは扱わない。

日本語編集のGeminiは推奨担当であり必須の外部サービス依存ではない。司令塔が担当する場合も、編集、意味・事実照合、修正を別工程として記録する。Releaseの一般的なIssue終了ゲートに加え、本計画ではmerge、本番反映、再申請の承認を分け、本来のIssue完了条件が未達ならcloseしない。

実装開始時にremote HEADが変わった場合はfingerprintを更新し、影響を受ける計画・レビューを再確認する。2026-09-05以前のバッチ完了を今回の工程の完了として継承しない。
