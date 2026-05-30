# bearworks.uk // SYS.COM

This repository hosts the source code for the **bearworks.uk** portal site. It serves as a central hub and system monitor linking to various contents and platforms, built with Next.js and hosted on Vercel.

## Features
- **Weather Dashboard**: Hachioji & Shinjuku weather visualization and Gemini-powered daily clothing & umbrella advice.
  - Automatically fetches the custom batch weather API with local cache-busting.
- **Data Science Docs**: Documentation and notes on data science, data analysis, and Python (Hosted on Netlify/MkDocs).
- **Toukei Kentei Drill**: Statistics certification practice application (Hosted on Vercel).
- **AI Apps**: Python-based AI applications with Streamlit and Ollama (Hosted on OCI).
- **GitHub Profile**: Portfolio, OSS contributions, and scripts.

The site also includes a lightweight system monitoring component that checks the online status of the linked platforms.

## 変更履歴 (Update History)

### 2026-05-17
- **天気ダッシュボードのバグ修正**:
  - クライアントサイドでの fetch 時に強固なブラウザキャッシュおよび CDN (Cloudflare) キャッシュが効き、画面が「11時間前」など古い状態から更新されなかった問題を解消（URLへのタイムスタンプ付与によるキャッシュバスターおよび `cache: "no-store"` オプションの導入）。
  - `WeatherSummary` コンポーネントにおいて、傘のカードの説明テキストに `umbrellaAdvice`（傘のアドバイス）ではなく `overview`（全体の概況）が表示されていたバグを修正。
