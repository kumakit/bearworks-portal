# Gemini Guidelines

本リポジトリにおける開発・運用・デプロイにあたっては、以下の規約および手順書に従ってください。手順を本ファイルで重複管理せず、必ず正本を参照してください。

* **AI エージェント共通運用安全規約**: [AGENTS.md](AGENTS.md)
* **本番公開・デプロイ・運用手順の正本**: [docs/operations/deployment.md](docs/operations/deployment.md)

### 重要遵守事項
1. **自律作業と承認必須ゲート**:
   - 調査、計画、ローカル修正、テスト、専用ブランチ作成・push、PR作成は自律的に進めて構いません。
   - **main へのマージ**、**本番デプロイ (`npm run deploy`)**、**Cloudflare 設定変更**、**既存サービス・他作業に影響する操作**は、必ず事前にユーザーの明示的承認を得てください。
2. **正本参照**: デプロイやロールバックの具体的手順は、常に [docs/operations/deployment.md](docs/operations/deployment.md) に従ってください。
3. **設定不変更**: 既存の Cloudflare 設定（DNS、Access、Route、Secret）を勝手に変更しないでください。
4. **AI ニュース自動更新の理解**: `data/news-data.json` が GitHub main にコミットされても Worker デプロイまで本番サイトには自動反映されません。
