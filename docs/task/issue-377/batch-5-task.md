# Issue #377 トラックA 最終第5バッチ（問26〜問30）

- [x] 参考書・問題集（公式テキスト、宮本テキスト、CBT問題集）の調査と未出題テーマの選定
- [x] ユーザーによる第5バッチ5問構成（2つの母比率の差の検定、指数分布、時系列分析、二元配置分散分析、重回帰診断とダミー変数）の承認
- [x] 最新 `origin/main` からブランチ `codex/issue-377-problems-batch-5` を作成
- [x] 第5バッチ固有の制作情報を最終公開承認待ちとして `lib/content-provenance.ts` に追加
- [x] 問26〜30の5問を設計・実装（`app/(monetized)/toukei/problems/problem-data.ts`）
- [x] Python/SciPyによる独立計算と数値誤答経路の検証（`scripts/verify-toukei-batch5.py`）
- [x] 30問・sitemap 47 URL対応へページ検証スクリプトを更新（`scripts/verify-toukei-pages.mjs`）
- [x] ローカル静的ビルド・Lint検証（`npm run lint`, `npm run build`, `npm run cf:build`）
- [x] OpenNext静的キャッシュ生成とWrangler dry-run（`populateCache`, `deploy --dry-run`）
- [x] Next.js localおよびWorkers localで全30問・47 URL・広告境界を検証
- [x] 全差分と検証結果をwalkthrough（`docs/history/20260905_issue#377_batch5_walkthrough.md`）へ記録
- [x] Codex監査レビューの実施と判定受領（総合判定【合格（GO）】）
- [x] commit（`8f7b234`）・push・Draft PR（[#13](https://github.com/kumakit/bearworks-portal/pull/13)）・Linux clean-checkout CI（[Run 33959902229](https://github.com/kumakit/bearworks-portal/actions/runs/33959902229) 完全合格）
- [ ] 最終公開承認後の制作情報確定、merge・本番Worker公開・スモークテスト全件検証

結果: `docs/history/20260905_issue#377_batch5_walkthrough.md`。ローカル実装・独立検算・静的ビルド・Next.js配信検証、Codex監査レビュー【合格（GO）】、Draft PR #13作成、Linux clean-checkout CI全ステップPASSまで完了。運営者の最終公開承認待ち。
