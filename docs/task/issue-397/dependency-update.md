# Issue #397 CI停止を解消する依存最小更新

更新日: 2026-10-08（JST）。ユーザーが依存更新とPRへの反映・CI再検証を承認。配備・merge・設定変更は対象外。

## 更新範囲

直接依存のNext、Tailwind、Wrangler、OpenNextの版は維持し、次の推移依存をnpm overridesで修正版へ固定する。

| 依存 | 変更 | 根拠 |
| --- | --- | --- |
| source-map-js | 1.2.1 → 1.2.2 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| proxy-addr | 2.0.7 → 2.0.8 | [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) |
| postcss-selector-parser | 6.1.4 → 7.1.6 | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)。親の6系要求を越えるためCSS生成をLinux build/previewで確認 |
| sharp | Miniflare内0.35.4 → 既存Nextと同じ0.35.5 | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)。確認時の最新Miniflareも旧sharpを固定。Next側と統一しnative依存を重複解消 |

Miniflareのみのoverrideはローカルnpmで旧nested lockを残し、npm lsが不整合を検知した。この状態は採用せず、sharpを同版へ統一した。最終npm lsは成功。lockから削除される28件は旧Miniflare配下のsharp/native依存24件と、旧版のFreeBSD/WebContainers native依存4件。対応する0.35.5のplatform依存は保持し、旧版の残存を除いた。

既存のbraces由来例外7件、期限2026-10-18、production監査0件要求、厳密な例外照合を変更していない。npm audit fix --forceや親依存のdowngradeは行っていない。

## ローカル検証

- production監査: 0件。
- full audit policy: 従来の7件だけに一致、PASS（警告の解決ではない）。
- npm ls --all: PASS。
- Cloudflare契約/UI/API: 18 PASS。
- 依存監査ゲート: 17 PASS。
- lint: エラー0、既存の別画面警告3件。
- Linux native sharp、publication bundle、Next/Workers build、dry-run、preview: [PR CI 37642130747](https://github.com/kumakit/bearworks-portal/actions/runs/37642130747)で全工程PASS。

適用後のLinux CIは成功。既存の静的コードレビュー以降に加えた依存変更を、この資料と差分レビュー・CIで別途検証した。本番の受入れは未実施。
