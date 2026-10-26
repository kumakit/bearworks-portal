# bearworks.uk // SYS.COM

This repository hosts the source code for the **bearworks.uk** portal site. It serves as a central hub and system monitor linking to various contents and platforms, built with Next.js and configured for Cloudflare Workers through the OpenNext Cloudflare adapter.

## Features
- **Weather Dashboard**: Hachioji & Shinjuku weather visualization and Gemini-powered daily clothing & umbrella advice.
  - Automatically fetches the custom batch weather API with local cache-busting.
- **Data Science Docs**: Documentation and notes on data science, data analysis, and Python (Hosted on Netlify/MkDocs).
- **Toukei Kentei Drill**: Statistics certification practice application served as portal content on Cloudflare Workers.
- **AI Apps**: Python-based AI applications with Streamlit and Ollama (Hosted on OCI).
- **GitHub Profile**: Portfolio, OSS contributions, and scripts.

The site also includes a lightweight system monitoring component that checks the online status of the linked platforms.

## Security & Authentication
- **Dashboard Protection**:
  - `bearworks.uk/dashboard` (and detailed pages) and `/api/dashboard-data` are protected by **Cloudflare Zero Trust (Access)**.
  - The API route `/api/dashboard-data` acts as a secure proxy to the OCI backend. In production, it enforces a **Fail-Closed** design by requiring the `cf-access-jwt-assertion` header and rejecting requests without it with a `401 Unauthorized` status. The route checks header presence; Cloudflare Access on the custom domain remains responsible for cryptographic JWT validation.
  - The upstream request is aborted after 10 seconds. Failure responses remain generic and are never cached.

## Local development

Node.js 22 or later is required by the pinned Workers toolchain.

Copy `.dev.vars.example` to `.dev.vars` and replace only the local dummy values. Do not commit `.dev.vars`.

```bash
npm ci
npm run dev
```

`npm run dev` uses the Next.js development server. Run Workers-runtime verification through OpenNext preview:

```bash
npm run cf:build
npm run preview
```

OpenNext Cloudflare does not support Windows directly. Run Workers build, dry-run, and preview verification on Linux, WSL, or the build-only GitHub Actions workflow.

## Cloudflare Workers / OpenNext

- `open-next.config.ts`: OpenNext adapter configuration without an external R2/D1 cache.
- `wrangler.jsonc`: Worker entrypoint, static assets, compatibility flags, and observability.
- `public/_headers`: Immutable cache policy for versioned Next.js static assets.
- `.github/workflows/workers-build.yml`: Linux clean-install, Next.js build, Workers build, Wrangler dry-run, and Workers preview route/API validation. **It does not deploy to production.**

Available commands:

```bash
npm run build       # Next.js build
npm run cf:build    # Generate .open-next/worker.js and static assets
npm run preview     # Build and run locally in the Workers runtime
npm run cf-typegen  # Regenerate Cloudflare binding types
npm run upload      # Build and upload an inactive Worker version
npm run deploy      # Build and deploy the Worker
```

## Operations & Deployment (運用・デプロイ)

本番公開・運用手順の**正本ドキュメント**および AI エージェント向け規約は以下を参照してください。

* 📖 **本番公開・運用手順書（正本）**: [docs/operations/deployment.md](docs/operations/deployment.md)
* 🤖 **AI エージェント運用安全規約**: [AGENTS.md](AGENTS.md)
* 🧭 **Gemini / Antigravity ガイド**: [GEMINI.md](GEMINI.md)

### 重要な運用原則
1. **工程の完全な分離**:
   - `PR作成` → `CI合格確認` → `mainへのマージ` → `本番デプロイ` はすべて独立した別工程です。自動で連続実行してはなりません。
2. **本番公開にはユーザーの明示的承認が必須**:
   - CI成功やPRマージを公開承認とみなさず、本番公開前に必ずユーザーの明示的指示を受けてください。
3. **安全な公開手順**:
   - デプロイ前に必ず `npx wrangler deployments list --env=""` で直前の稼働バージョン（復旧先）を確認・記録してください。
   - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` に本番用 ID（`ca-pub-9560028085973137`）を設定して `npm run deploy` を実行します。
   - 公開後は、実際の URL で HTTP ステータス、AdSense 境界、Access リダイレクト、画面表示を確認してください。
4. **Cloudflare 設定の変更禁止**:
   - 既存の DNS レコード、Cloudflare Access、Workers Route、Secret を勝手に変更・削除してはなりません。
5. **AI ニュース自動更新との関係**:
   - `data/news-data.json` は OCI 上のワーカーから日次で GitHub `main` に直接 push されますが、本番 Worker をデプロイするまで本番サイト（`bearworks.uk/ai-news`）の表示は自動的には更新されません。

## 変更履歴 (Update History)

### 2026-05-17
- **天気ダッシュボードのバグ修正**:
  - クライアントサイドでの fetch 時に強固なブラウザキャッシュおよび CDN (Cloudflare) キャッシュが効き、画面が「11時間前」など古い状態から更新されなかった問題を解消（URLへのタイムスタンプ付与によるキャッシュバスターおよび `cache: "no-store"` オプションの導入）。
  - `WeatherSummary` コンポーネントにおいて、傘のカードの説明テキストに `umbrellaAdvice`（傘のアドバイス）ではなく `overview`（全体の概況）が表示されていたバグを修正。
