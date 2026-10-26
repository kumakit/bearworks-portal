# Gemini Guidelines

本リポジトリにおける開発・運用・デプロイにあたっては、以下の規約および手順書に従ってください。手順を本ファイルで重複管理せず、必ず正本を参照してください。

* **AI エージェント共通運用安全規約**: [AGENTS.md](AGENTS.md)
* **本番公開・デプロイ・運用手順の正本**: [docs/operations/deployment.md](docs/operations/deployment.md)

### 重要遵守事項
1. **工程分離**: PR作成、CI確認、mainマージ、本番公開はすべて独立した別工程であり、自動で連続実行しないこと。
2. **明示的承認**: 本番公開（デプロイ）にはユーザーの明示的な指示・承認を必須とすること。
3. **設定不変更**: 既存の Cloudflare 設定（DNS、Access、Route、Secret）を変更しないこと。
4. **正本参照**: デプロイやロールバックの具体的手順は、常に [docs/operations/deployment.md](docs/operations/deployment.md) に従うこと。
