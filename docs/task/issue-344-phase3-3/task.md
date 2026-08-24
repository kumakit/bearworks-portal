# Issue #344 Phase 3-3 タスク

## Intake

- [x] Issue #344の最新body、comments、state、labels、assignees、milestone、更新日時、URLを取得
- [x] 追跡Issue #376の最新状態と初回Search Console結果を取得
- [x] Issue #344/#376がopen / `Status: In Progress` であることを確認
- [x] Phase 3-0、3-1、3-2の実装・公開記録を確認
- [x] 対象repoのGit root、branch、HEAD、dirty状態を確認
- [x] 最新 `origin/main` を取得
- [x] `origin/main` から `codex/issue-344-phase3-3-readiness` を作成

## Plan

- [x] LunaへPhase 3-3条件を読み取り専用監査として委譲
- [x] Phase 3-3専用 `implementation_plan.md` を作成
- [x] 手動計画レビューの要否を判定（読み取り専用監査は不要）
- [x] Luna結果を司令塔Codexが実ファイルと公開状態で再確認

## Gate 0: 公開技術基準

- [x] 広告対象routeが200かつAdSenseあり
- [x] 非広告routeが200かつAdSenseなし
- [x] 無効slugと一般404が404かつAdSenseなし
- [x] canonical、robots、sitemap、ads.txtが正常
- [x] dashboard/APIのCloudflare Access保護を確認

## Gate 1: 一次情報型コンテンツ

- [x] 八王子気候分析が単独記事として問い、データ、方法、結果、限界を説明
- [x] 固定bundle、version、byte size、SHA-256、source commitを確認
- [x] コード、validator、公開履歴への導線を確認
- [x] 結果を捏造せず、登録仮説と広い初期俗説を区別していることを確認

## Gate 2: 制作・運営透明性

- [x] ガイド8件、例題5件、分析記事の制作・検証情報を確認
- [x] AIを使用した工程と、人が確認した工程の分離を確認
- [x] `/about` と `/toukei/methodology` の運営・訂正説明を確認
- [x] 未確認の資格、職歴、第三者監修の主張がないことを確認

## Gate 3: Search Console

- [x] サイトマップの送信日、最終読み込み、状態、検出URL数、エラー・警告を記録
- [x] 八王子記事の登録状態とクロール日時を記録
- [x] 取得結果、クロール可否、インデックス可否を記録
- [x] ユーザー指定canonical、Google選択canonical、参照元sitemapを記録
- [x] 登録リクエストを繰り返していないことを確認
- [x] Search Consoleのrobots通知対象が意図した`/dashboard`除外であることを確認
- [x] 未登録7件を分類し、本repoの監視対象を`sampling-bias`へ限定

## Gate 4: 公開後の運用実績

- [x] 2026-08-12以後の対象ファイルGit履歴を確認
- [x] 公開後の更新・訂正履歴を確認
- [x] 対象URLの表示・クリック等、利用可能な一次集計を確認
- [x] 利用実績と利用できないクエリ詳細をそのまま記録

## Gate 5: 変更凍結と判定

- [x] 目的のない大量ページ追加がないことを確認
- [x] 広告範囲の不要な拡大がないことを確認
- [x] `READY_FOR_USER_DECISION` と判定
- [x] walkthroughへ確認済み事実、推論、不明点、Luna担当を記録

## External gates

- [x] commit前のユーザー承認
- [ ] push前のユーザー承認とremote commit一致
- [ ] PR作成・merge前のユーザー承認
- [ ] Issue #344/#376コメント・Status変更・close前のユーザー承認
- [ ] Search Consoleの送信・削除・インデックス登録リクエスト前のユーザー承認
- [ ] AdSense再審査申請前のユーザー承認
