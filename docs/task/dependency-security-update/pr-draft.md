# PR文案（未登録）

登録先：`kumakit/bearworks-portal`。head：`codex/dependency-security-runtime`、base：`main`。先にIssueを登録したら、その番号を本文へ参照として追加する。全体Issueをcloseする文言は付けない。

タイトル：本番用依存の警告を解消し、監査をCIに追加

---

Next.js 16.3.0等の本番用依存に残る既知の警告3件を解消する。Next.jsとLint設定を16.3.8へ揃え、sharp 0.35.5、baseline-browser-mapping 2.11.27へ通常の許容範囲で解決した。更新後のproduction監査は0件。記事・集計・React・Tailwind・OpenNext・Wrangler・認証/広告設定の変更はない。

CIへproduction監査の失敗判定、全体監査/依存ツリーの証拠保存、Linux native sharpの通常PNG処理を追加した。全体監査は17件が残り、公開ツールとbraces関連を後続段階で追跡する。全体監査の残件限定・新規警告判定は後続段階で追加予定。

Windowsでclean install、依存ツリー、Lint（0errors/既存4warnings）、型検査を含むNext build（64ページ）、全bundle、2記事12ルート、例題30/ガイド8/sitemap54、API/asset、PC/スマホ操作、OpenNext build、両環境dry-runを確認した。Ubuntu/Node 22の同一SHAのWorkers CIはPRで確認し、成功前にmerge/deployしない。

詳細と証拠：`docs/task/dependency-security-update/phase-1-walkthrough.md`。
