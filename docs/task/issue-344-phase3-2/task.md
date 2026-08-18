# Issue #344 Phase 3-2 タスク

## Intake

- [x] Issue #344の最新body、comments、state、labels、assignees、milestone、更新日時、URLを取得
- [x] Issueがopen / `Status: In Progress` であることを確認
- [x] Phase 3-0とPhase 3-1の完了記録を確認
- [x] 対象repoのGit root、branch、HEAD、dirty状態を確認
- [x] 最新 `origin/main` を取得
- [x] `origin/main` から `codex/issue-344-phase3-2-transparency` を作成

## Plan

- [x] Lunaへ既存の運営者説明、担当表示、AI利用、訂正履歴、公開証跡を読み取り専用監査として委譲
- [x] 司令塔CodexがLunaの結果を実ファイルで再確認
- [x] Phase 3-2専用 `implementation_plan.md` を作成
- [x] 手動計画レビューの要否を判定（不要）
- [x] ユーザーが実装計画を承認

## Implementation

- [x] 共通provenance型を追加
- [x] 共通provenance表示componentを追加
- [x] ガイド8件へ担当、AI/人の分担、証跡、履歴を追加
- [x] 例題5件へ担当、AI/人の分担、証跡、履歴を追加
- [x] 編集・作問方針へAI利用と人の最終確認を追加
- [x] `/about` を公開実績ベースの説明へ更新
- [x] 八王子気候分析へ担当3区分と検証記録導線を追加
- [x] 既存の本文、数式、bundle、広告・API・Workers境界に計画外変更がないことを確認

## Local verification

- [x] `npm run validate:hachioji-climate`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run cf:build`
- [x] Wrangler production dry-run
- [x] Wrangler staging dry-run
- [x] `git diff --check`
- [x] 代表ガイド、代表例題、八王子記事、about、methodologyのローカルHTTP確認
- [x] AdSense対象・非対象・404境界の回帰確認
- [x] 既存公開リンクの到達性と秘密値・非公開ID非混入を確認
- [ ] Phase 3-2 walkthroughの公開URL到達性を確認（main取り込み後）
- [ ] ローカルdesktop/mobile目視確認（ブラウザー接続制限のため公開QAへ繰越）
- [x] 司令塔Codexが全差分を確認
- [x] walkthroughへLuna担当、検証、未検証事項を記録

## External gates

- [x] commit前のユーザー承認
- [x] push前のユーザー承認とremote commit一致
- [x] Linux clean-checkout CI（Workers build run 32149672686）
- [ ] PR作成・merge前のユーザー承認
- [ ] staging / production deploy前のユーザー承認
- [ ] 公開routeのdesktop/mobile QA
- [ ] Issueコメント・status更新・close前のユーザー承認
