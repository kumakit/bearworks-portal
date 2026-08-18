# Issue #344 Phase 3-2 制作透明性 walkthrough

## 結果

Phase 3-2 のローカル実装と検証を完了した。統計ガイド8件、オリジナル例題5件、八王子気候分析に、執筆・検算または内容確認・最終公開確認、AI利用、人による確認、公開証跡、更新・訂正履歴、誤りの連絡先を共通形式で表示する。

この記録の時点では commit、push、Linux CI、deploy、GitHub Issue更新を行っていない。公開版の受け入れ完了を示す記録ではない。

## 実装範囲

- 共通の制作・検証情報モデルと表示componentを追加した。
- ガイド8件と例題5件で制作・検証情報を型上の必須項目にした。
- 八王子気候分析を同じ表示形式へ統合した。
- `/toukei/methodology` にAIが補助した範囲と、人が確認・判断した範囲を分けて記載した。
- `/about` に公開可能な運営領域、公開中の分析実践、アプリを提供する理由を記載した。
- 資格、所属、職歴、第三者査読など、公開根拠のない経歴や保証は追加していない。
- 既存のガイド本文、例題の数式、気候データbundle、広告境界、API、Workers設定は変更していない。

## 公開証跡と安全性

- 公開ページから参照する外部証跡は、公開済みの `bearworks-portal` コード、commit、固定データ、validator、Actions run、既存walkthroughに限定した。
- 非公開の可能性がある `mission-control` Issueと `bearworks-apps` のcommit/treeは公開ページのリンクから除外した。
- Phase 3-2 のwalkthrough URLは本ファイルを `main` へ同時に取り込む前提である。公開前にリンク先が実際に到達可能になったことを確認する。
- 秘密値、内部ID、認証情報は制作・検証情報へ含めていない。

## Luna監査

Lunaへ最終差分を読み取り専用で委譲した。LunaはIssue要件5項目、13件のガイド・例題への共通表示、`/about` の表現、非公開リンクの混入、TypeScriptとUI上の問題を確認した。

監査結果は、実装要件を満たし、資格・経験の誇張と非公開リンクの混入はないというものだった。リリース前の必須指摘として、本walkthroughが未作成でリンク先が404だった点が挙がったため、本ファイルを追加した。タスクリストの未更新も指摘に従って修正した。

## ローカル検証

- `npm run validate:hachioji-climate`: pass。405549 bytes、SHA-256 `8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd`。
- `npm run lint`: pass。error 0、既存warning 4件。
- `npm run build`: pass。Next.js 16.3.0、TypeScript、32 static pages生成を確認。
- `npm run cf:build`: pass。OpenNext 1.20.2。Windowsに関する上流の互換性warningのみ。
- `npx wrangler deploy --dry-run --env=""`: pass。外部書込みなし、Assets bindingのみ。
- `npx wrangler deploy --dry-run --env=staging`: pass。外部書込みなし、Assets bindingのみ。
- `git diff --check`: pass。Windows working copyのLF/CRLF予告warningのみ。
- ガイド8routeと例題5route: すべてHTTP 200で「制作・検証情報」と「誤りを報告する」を確認。
- 代表ガイド、代表例題、八王子気候分析、`/about`、`/toukei/methodology`: HTTP 200と期待本文を確認。
- 不正ガイドroute: HTTP 404、広告なしを確認。
- `/about`: 広告なしを確認。
- 既存の公開証跡リンク: 未認証HTTPで到達可能なことを確認。

## 未検証・外部ゲート

- 本walkthroughのGitHub `main` URLは、commit・push・取り込み前のため現時点では404になる。公開前に必ず解消する。
- アプリ内ブラウザーの接続が実行環境の信頼パス制限で停止したため、今回のローカルdesktop/mobile目視確認は未完了。公開routeで改めて確認する。
- commitとpushはユーザーの個別承認後に行う。
- Linux clean-checkout CIはpush後に確認する。
- staging / production deployは別の明示承認後に行う。
- 公開routeのdesktop/mobile、リンク到達性、広告境界はdeploy後に再確認する。
- GitHub Issueコメント、status更新、closeは別の明示承認後に行う。

## 現在の判定

ローカル実装はcommit前レビュー可能な状態である。本番公開の判定は、上記の外部ゲートがすべて完了するまで保留する。
