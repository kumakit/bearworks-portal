# AI エージェント運用ガイドライン (AGENTS.md)

本ファイルは、本リポジトリ（`kumakit/bearworks-portal`）で作業を行うすべての AI エージェント（Codex、Antigravityなど）が厳守すべき共通安全規約です。

詳細なシステム構成およびデプロイ手順の正本は、[docs/operations/deployment.md](docs/operations/deployment.md) を参照してください。手順を本ファイルや他の指示ファイルで重複管理してはなりません。

---

## 1. 承認ルール（自律作業と承認必須ゲート）

普段の開発・改善を妨げず、かつ本番環境の安全性と他作業への影響防止を両立するため、承認ルールをシンプルに定めます。

### 自律的に進めてよい作業（個別承認不要）
* 調査・ログ/ドキュメントの読み取り、計画作成
* ローカル環境でのコード・データ・ドキュメントの修正、テスト、静的解析、バンドル検証
* 専用作業ブランチの作成、コミット、リモート作業ブランチへの push
* main 宛の Pull Request (PR) 作成、および CI 実行結果の確認

### 必ず別途承認を取得すべき操作（承認必須ゲート）
以下の操作は、ユーザーからの明示的な指示または承認がない限り、**絶対に実行してはなりません**。

1. **main ブランチへのマージ**
2. **本番デプロイ (`npm run deploy`)**
3. **Cloudflare 設定の変更**（DNS レコード、Workers Route、Cloudflare Access、Worker シークレット等）
4. **既存本番サービス・他作業に影響を与える操作**（強制 push、他者ブランチ改変、インフラ停止等）

---

## 2. 更新種別と本番反映の注意点

* **記事・コンテンツ・コードの更新**:
  - 作業ブランチで編集・テストを行い、PR を作成します。
  - Linux CI (`Workers build`) の成功を確認し、ユーザー承認のもと main にマージします。
  - 本番公開は、別途ユーザーの明示承認を得て `npm run deploy` を手動実行します（公開前後のバージョン確認・URL検証を必須行います）。
* **AIニュースの自動更新 (`data/news-data.json`)**:
  - OCI ワーカーにより日次で GitHub `main` に直接 push されます。
  - **Web表示の反映**: `/ai-news` では、ビルド時初期データ（直近14日分）を即時描画しつつ、ブラウザ側から GitHub Raw より最新データを非同期取得して自動更新します。そのため、Worker の手動再デプロイを行わなくても最新ニュースが自動反映されます（GitHub CDNのキャッシュにより数分程度の遅延が生じる場合があります）。
  - SSG 初期データ自体の更新は次回の Worker デプロイ時に行われます。AIニュースの更新データ反映だけを目的に勝手に本番デプロイ（`npm run deploy`）を行ってはなりません。

---

## 3. ロールバックと過去手順の混同禁止

* **通常障害時の復旧（第一選択）**:
  - 直前の正常な Worker バージョンへのロールバック（`npx wrangler rollback`）を実施します。
* **Cloudflare Pages への復旧に関する注意**:
  - Pages プロジェクトおよび過去デプロイは保持されていますが、**「プロジェクトが存在すること」と「現在直ちに健全な復旧先として使用可能であること」は区別してください**。
  - Git 連携切断時の古い成果物であるため、現在の DNS、Access、AdSense、外部 API と整合するかは未検証です。使用前にはダッシュボード上で配信プレビューや各種設定の確認が必須です。
  - 過去の移行手順（Route 削除による Pages 切戻し）を通常の復旧手順と混同してはなりません。

---

## 4. 本番公開時のチェックリスト（概要）

ユーザーから本番公開の明示的承認を得て作業を行う場合は、必ず以下を実施してください。

- [ ] **Linux CI の成功確認**: 対象コミットについて、GitHub Actions (`Workers build`) がすべて合格していること。
- [ ] **Git ツリーの一致確認**: main の最新 HEAD をローカルに取得し、CI で検証された Git ツリーと同一であること。未コミット差分がないこと。
- [ ] **復旧先の確認と記録**: デプロイ前に `npx wrangler deployments list --env=""` で直前の公開バージョン（Version ID / Deployment ID）を確認・記録すること。
- [ ] **本番環境変数の設定**: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` に本番用 ID（`ca-pub-9560028085973137`）を指定してビルド・デプロイすること。
- [ ] **公開後の実 URL 検証**:
  - 対象ページおよびトップページが 200 を返すこと。
  - 広告対象ページにのみ実広告 ID が含まれ、非広告ページ・404・管理画面には広告が一切含まれないこと（広告境界の検証）。
  - 未認証アクセス時に `/dashboard` および `/api/dashboard-data` が Cloudflare Access へ 302 リダイレクトされること。
  - 実ブラウザで表示崩れや JavaScript エラーがないこと。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
