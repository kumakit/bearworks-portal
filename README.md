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
- `.github/workflows/workers-build.yml`: Linux clean-install, Next.js build, Workers build, Wrangler dry-run, and Workers preview route/API validation. It does not deploy.

Available commands:

```bash
npm run build       # Next.js build
npm run cf:build    # Generate .open-next/worker.js and static assets
npm run preview     # Build and run locally in the Workers runtime
npm run cf-typegen  # Regenerate Cloudflare binding types
npm run upload      # Build and upload an inactive Worker version
npm run deploy      # Build and deploy the Worker
```

`upload` and `deploy` change Cloudflare state. Run them only after reviewing the custom-domain switch and rollback procedure and receiving explicit approval.

The tracked Wrangler configuration disables both the public `workers.dev` endpoint and version preview URLs. Add only the Cloudflare Access-protected custom-domain route during the separately approved production switch.

`NEXT_PUBLIC_ADSENSE_CLIENT_ID` is a build-time public value and must be set before `build` or `cf:build`. `DASHBOARD_API_TOKEN` is a secret and must be configured as a Worker secret for production; never place a real token in tracked files.

## 変更履歴 (Update History)

### 2026-05-17
- **天気ダッシュボードのバグ修正**:
  - クライアントサイドでの fetch 時に強固なブラウザキャッシュおよび CDN (Cloudflare) キャッシュが効き、画面が「11時間前」など古い状態から更新されなかった問題を解消（URLへのタイムスタンプ付与によるキャッシュバスターおよび `cache: "no-store"` オプションの導入）。
  - `WeatherSummary` コンポーネントにおいて、傘のカードの説明テキストに `umbrellaAdvice`（傘のアドバイス）ではなく `overview`（全体の概況）が表示されていたバグを修正。
