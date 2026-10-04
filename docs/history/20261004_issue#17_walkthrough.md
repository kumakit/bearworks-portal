# Issue #17：本番用依存更新の第1段階

2026-10-04、ユーザー承認に基づき本番用依存修正版を公開。第1段階は完了し、第2・3段階は同じIssueで進行中。

- [Issue #17](https://github.com/kumakit/bearworks-portal/issues/17)、[PR #18](https://github.com/kumakit/bearworks-portal/pull/18)
- 更新、Luna分担、Linux CI、配信version、公開後確認、復旧手順、未検証範囲：[公開結果](../task/dependency-security-update/release-result.md)
- ローカル検証：[phase-1-walkthrough.md](../task/dependency-security-update/phase-1-walkthrough.md)
- 本番用監査3→0、全体19→17（残件を解消済みとは扱わない）。

## 第2段階の公開

Wrangler/esbuildと修正可能な間接依存を更新し、[PR #19](https://github.com/kumakit/bearworks-portal/pull/19)をLinux CI成功後にmerge・本番公開。本番用0を維持、全体17→7。新しいWorker version `f0551790-912b-4369-a399-0d8f8ea58318` を100%配信し、公開後の12ルート・21確認・記事操作が成功。

Lunaの監査ゲート指摘を修正し、17テストで検証。残るbraces連鎖7件は期限付き例外（2026-10-18 09:00 JST）、全警告解消は未完了。詳細・復旧先・未検証範囲：[第2段階公開結果](../task/dependency-security-update/phase-2-release-result.md)。
