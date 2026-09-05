# Issue #377 トラックA 第4バッチ（問21〜問25）

- [x] 参考書・問題集（公式テキスト、宮本テキスト、CBT問題集）の調査と未出題テーマの選定
- [x] ユーザーによる第4バッチ5問構成（ラスパイレス/パーシェ、チェビシェフ、幾何分布、過誤と検出力、フィッシャーの3原則）の承認
- [x] 最新 `origin/main` からブランチ `codex/issue-377-problems-batch-4` を作成
- [x] 第4バッチ固有の制作情報を最終公開承認待ちとして `lib/content-provenance.ts` に追加
- [x] 問21〜25の5問を設計・実装（`app/(monetized)/toukei/problems/problem-data.ts`）
- [x] Python/SciPyによる独立計算と数値誤答経路の検証（`scripts/verify-toukei-batch4.py`）
- [x] 25問・sitemap 42 URL対応へページ検証スクリプトを更新（`scripts/verify-toukei-pages.mjs`）
- [x] ローカル静的ビルド・Lint検証（`npm run lint`, `npm run build`, `npm run cf:build`）
- [x] OpenNext静的キャッシュ生成とWrangler dry-run（`populateCache`, `deploy --dry-run`）
- [x] Next.js localおよびWorkers localで全25問・42 URL・広告境界を検証
- [x] 全差分と検証結果をwalkthrough（`docs/history/20260905_issue#377_batch4_walkthrough.md`）へ記録
- [x] Codex監査レビュー受領（P1: 4件、P2: 3件）と全指摘事項の是正対応
- [x] Codex再レビューにて総合判定【合格（GO）】受領
- [x] ユーザー承認後のcommit（`7c2c3e7`）・push・Draft PR（[#12](https://github.com/kumakit/bearworks-portal/pull/12)）・Linux clean-checkout CI（[Run 33957579768](https://github.com/kumakit/bearworks-portal/actions/runs/33957579768) 全ステップPASS）
- [x] 最終公開承認後の制作情報確定（`af374b1`）、merge（[#12](https://github.com/kumakit/bearworks-portal/pull/12) `156368b`）・本番Worker公開（Version `7888ab5e-4be8-4db0-9e25-26d76eaad618` 100%）・スモークテスト全件PASS

結果: `docs/history/20260905_issue#377_batch4_walkthrough.md`。ローカル実装・独立検算・静的ビルド・Next.js/Workers配信検証、Codex再レビュー【合格（GO）】、Draft PR #12作成、Linux CI通過、制作情報確定、merge、本番Workerデプロイ、および本番スモークテスト（全25問・sitemap 42 URL・トラックB並行稼働）まで全件100%合格で完了。
