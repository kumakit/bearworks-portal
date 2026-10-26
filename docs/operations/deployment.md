# bearworks.uk デプロイ・運用手順書（正本）

本書は、`bearworks.uk`（リポジトリ: `kumakit/bearworks-portal`）における本番公開・更新・運用の**正本ドキュメント**です。
開発者およびAIエージェント（Codex、Antigravityなど）は、サイトの変更・公開を行う際、必ず本書に定められた原則と手順に従わなければなりません。

---

## 1. 基本原則と承認ルール

日常の開発・改善を円滑に進めつつ、本番環境の安全性と他作業への影響防止を両立するため、承認ルールを以下のように定めます。

### 自律的に進めてよい作業（個別承認不要）
* 課題の調査、ログやドキュメントの読み取り
* 実装計画・作業計画の作成
* ローカル環境でのコード修正、テスト、静的解析、バンドル検証
* 専用作業ブランチの作成、コミット、リモート作業ブランチへの push
* main 宛の Pull Request (PR) 作成、および CI 実行結果の確認

### 必ず別途承認を取得すべき操作（承認必須ゲート）
以下の操作は、ユーザーからの明示的な指示または事前承認（例: 「本番公開まで進めてください」「PRをマージしてください」など）がない限り、**絶対に実行してはなりません**。

1. **main ブランチへのマージ**: PRのCIが成功しても、自動でマージしてはなりません。
2. **本番デプロイ (`npm run deploy`)**: main マージ完了後も、本番デプロイは独立した承認が必要です。
3. **Cloudflare 設定の変更**: DNS レコード、Workers Route、Cloudflare Access ポリシー、Worker シークレット等の追加・変更・削除。
4. **既存本番サービス・他作業に影響を与える操作**: 破壊的な Git 操作（force-push, 他者ブランチの改変）、稼働中インフラの停止など。

### その他の運用安全規約
* **公開前の復旧先（ロールバック対象）の確認と記録**: 本番デプロイ前に、必ず現在稼働中の Worker バージョン（Deployment ID / Version ID）を読み取り専用で確認し、記録してください。
* **公開後の実URL検証の必須**: デプロイコマンドの終了コードだけで成功と判断せず、実際の公開URL（`https://bearworks.uk/...`）に対して HTTP ステータス、広告境界、Access 保護、ブラウザ描画・操作を確認してください。
* **過去の移行手順の混同禁止**: `docs/task/issue-344/cutover-runbook.md` などの過去資料に記載されている「Workers Routeの追加」「Pages連携の切断」等は初回移行時の記録です。現在の通常運用手順として使用してはなりません。

---

## 2. システム構成と現在の運用状態

### アーキテクチャ概要
* **フロントエンド / サーバー**: Next.js (App Router)
* **ホスティング実行環境**: Cloudflare Workers（OpenNext Cloudflare アダプター `@opennextjs/cloudflare`）
* **本番ルーティング**:
  * ドメイン `bearworks.uk/*` へのトラフィックは、Cloudflare Workers Route により Worker `bearworks-portal` にバインドされています。
* **アクセス制御（Cloudflare Access）**:
  * `/dashboard*` および `/api/dashboard-data` は Cloudflare Zero Trust (Access) により保護されています。
  * 未認証リクエストに対しては `302 Found`（Accessログイン画面へのリダイレクト）を返し、キャッシュヘッダーは `Cache-Control: no-store` を強制します。

### Cloudflare Pages の現状と復旧に関する位置づけ
* **移行状況**: 2026年8月（Issue #344）に Cloudflare Workers への完全移行が完了しています。
* **自動デプロイの停止**: Cloudflare Pages の Git 自動ビルド連携は切断されており、GitHub への push による Pages 自動デプロイは停止しています。
* **プロジェクトの保持と復旧可能性の区別**:
  * Cloudflare 上に Pages プロジェクトおよび過去デプロイは残されていますが、**「プロジェクトが存在すること」と「現在直ちに健全な復旧先として使用可能であること」は区別しなければなりません**。
  * Pages は連携切断当時の過去バージョンのままであり、現在の DNS 設定、Cloudflare Access ポリシー、AdSense 設定、外部 API と正常に整合するかは未検証です。
  * したがって、Pages は「緊急時の復旧候補として保持されている」状態であり、もし万が一使用する場合は、事前にダッシュボード上で配信プレビュー、DNS、Access、対象バージョンを確認する必要があります。
  * 通常の障害対応は、直前の Worker バージョンへのロールバック（`npx wrangler rollback`）が第一選択であり、安易に Pages への切戻し（Route削除）を行ってはなりません。

> [!NOTE]
> Cloudflare側の実設定（ダッシュボード上の詳細ルール名や内部設定値など）をローカルCLIから直接確認できない場合は、推測で確定させず未確認事項として扱ってください。

---

## 3. 更新種別と本番反映の違い

本リポジトリで発生する更新には、以下の異なる種類が存在します。更新の性質を正しく識別してください。

| 更新種別 | 主な対象ファイル | 反映フロー | 本番公開（Worker更新） |
| :--- | :--- | :--- | :--- |
| **記事・コンテンツ更新** | `app/labs/...`, `scripts/...`, `public/...` | 作業ブランチ → バンドル検証 → PR作成 → CI合格 → mainマージ | **必要**（ユーザー承認後に `npm run deploy`） |
| **アプリケーションコード修正** | `app/...`, `components/...`, `package.json` | 作業ブランチ → ローカルテスト → PR作成 → CI合格 → mainマージ | **必要**（ユーザー承認後に `npm run deploy`） |
| **AIニュース自動データ更新** | `data/news-data.json` | OCI Worker が日次（毎朝06:15頃）で GitHub `main` に直接コミット・プッシュ | **自動公開されない**（次回のWorker公開時に反映） |

### 重要: AIニュースの自動更新と本番表示について
* **現状の構成**:
  * `data/news-data.json` は OCI 上の自動処理により GitHub の `main` ブランチへ日次コミットされます。
  * GitHub Actions には main push 連動の自動デプロイは存在せず、Cloudflare Pages の自動ビルドも停止しています。
  * したがって、**GitHub main に AIニュースがコミットされても、本番サイト（`https://bearworks.uk/ai-news`）の表示は自動的には更新されません**。
  * 新しい記事公開やコード更新に伴って Worker が本番デプロイされた際に、その時点の最新 `news-data.json` がバンドルされて本番に反映されます。
  * AIエージェントは「GitHub main にコミットがあるから本番でも最新ニュースが表示されている」と誤認してはならず、また AIニュースの反映だけを目的にユーザー承認なく本番公開を行ってはなりません。

### 将来的な改善候補（課題と選択肢の記録）
* **現在の課題**:
  * ニュースデータは日次で更新される一方、現在のアーキテクチャではサイト全体を SSG ビルドして Worker 全体をデプロイしなければ反映されません。
  * ニュースの鮮度を維持するために毎日サイト全体を手動デプロイすることは運用負荷が高く、自動デプロイを組む場合は AdSense 境界やリクエスト枠の保護に対する継続的な監視が必要になります。
* **将来の選択肢**:
  1. **クライアントフェッチ化（または外部API連携）**:
     * `/ai-news` ページにおいて、ビルド時バンドルではなく、ブラウザ側またはリクエスト時に GitHub Raw や外部エンドポイントから最新 JSON を動的取得する方式への改修。
  2. **Cloudflare KV / R2 によるデータ分離**:
     * ニュースデータを Worker のストレージ（KV または R2）に配置し、OCI ワーカー等からデータのみを更新可能にする方式（Worker 本体の再デプロイが不要になる）。
  3. **日次自動ビルド・デプロイ CI/CD ワークフローの新設**:
     * GitHub Actions のスケジュール実行等で日次デプロイを行う方式（ただし、セキュリティ監査や AdSense 境界テストの自動検証が必須）。
* *※ 今回の作業ではドキュメント整理のみを行い、配信方式や自動デプロイの構成変更は実施しません。*

---

## 4. GitHub Actions の役割

リポジトリには以下の GitHub Actions ワークフローが存在しますが、**いずれも本番環境への自動デプロイは行いません**。

### 1. `Workers build` (`.github/workflows/workers-build.yml`)
* **トリガー**: Pull Request 作成・更新時、手動実行 (`workflow_dispatch`)
* **実行環境**: Ubuntu (Linux), Node.js 22, Python 3.12
* **役割**:
  * 依存関係の整合性確認（`npm ci`, `npm audit --omit=dev`, 監査ゲートテスト）
  * 各種データバンドルの生成・検証テスト（`npm run test:*`, `npm run validate:bundles`）
  * ESLint による静的解析（`npm run lint`）
  * Next.js ビルド（`npm run build`）
  * 内部リンクの prefetch ポリシー検証（`components/InternalLink.tsx` による意図しないRSC prefetch増幅の防止）
  * OpenNext Workers バンドルの生成（`npm run cf:build`）
  * Wrangler による dry-run 検証（本番および staging 設定の構文・バインディング検査）
  * **ローカル Workers preview サーバーでの E2E 検証**:
    * 各公開ページ（ルート、`/toukei`、`/labs/...` 等）の HTTP 200 確認
    * 不正 slug や存在しないルートの 404 確認
    * **AdSense 境界の厳格な検証**（広告対象ページにのみテスト用 ID が含まれ、非広告ページ・404・ダッシュボードには一切含まれないこと）
    * 静的アセットのキャッシュヘッダー（`immutable`）確認
    * 未認証ダッシュボード API の 401 / 405 / `no-store` 確認
  * 検証済みアーティファクトの保存（デプロイは実行しない）

### 2. `Production Workers artifact` (`.github/workflows/workers-production-build.yml`)
* **トリガー**: main ブランチでの手動実行 (`workflow_dispatch`) のみ
* **役割**:
  * 本番用 AdSense Client ID (`ca-pub-9560028085973137`) を注入したビルド
  * dry-run による構文検証
  * 本番用アーティファクトの保存（**外部へのデプロイは実行しない**）

---

## 5. 本番公開（デプロイ）標準手順

本番公開は、以下の手順を順番に確実に踏んで実施します。

```mermaid
flowchart TD
    A["1. 作業ブランチでの開発・検証"] --> B["2. PR作成 & Linux CI 合格確認"]
    B --> C{"ユーザーの main マージ承認"}
    C -->|承認| D["3. main へのマージ & ローカル同期"]
    D --> E["4. 直前バージョンの確認 (復旧先の記録)"]
    E --> F{"ユーザーの本番デプロイ承認"}
    F -->|承認| G["5. 本番デプロイ (npm run deploy)"]
    G --> H["6. 公開後の実URL動作検証"]
    H --> I["7. 完了報告 (Version ID / 検証結果記録)"]
```

### ステップ 1: 前提条件の確認
1. 対象の変更を含むブランチについて、GitHub Actions (`Workers build`) が**全ステップ成功**していること。
   > [!WARNING]
   > Windows ローカル環境では OpenNext の Windows 非互換警告が発生します。そのため、本番公開前には必ず同一コミットに対する Linux CI の成功を確認しなければなりません。
2. ユーザーの明示的な承認を得て、PR を main ブランチへ通常マージ（履歴保持）していること。
3. ローカルの作業ツリーで最新の `origin/main` を fetch/pull し、未コミット変更がない clean な状態であること。
4. 対象コミットの Git tree が、CI で検証された Git tree と一致していることを確認すること。

### ステップ 2: 直前の公開バージョン確認（復旧先の確定）
デプロイを実行する前に、現在配信中の Worker バージョンを確認し、記録します。

```powershell
npx wrangler deployments list --env=""
```

* 出力された直前の **Deployment ID** および **Version ID** をメモし、万が一のロールバック先として記録します。

### ステップ 3: 本番公開の明示的承認の取得
* ユーザーに対し、公開対象のコミットSHA、含まれる変更内容、および直前バージョン（復旧先）を提示し、本番デプロイの明示的承認を求めます。
* 承認が得られるまで、次のステップへ進んではなりません。

### ステップ 4: 本番デプロイの実行
承認後、本番 AdSense クライアント ID を環境変数に設定した上でビルドおよびデプロイを実行します。

```powershell
# 本番AdSense IDを設定（ads.txt と一致する ca-pub-9560028085973137）
$env:NEXT_PUBLIC_ADSENSE_CLIENT_ID = "ca-pub-9560028085973137"

# デプロイの実行（バンドル検証 → OpenNextビルド → Workerデプロイ）
npm run deploy
```

> [!NOTE]
> Wrangler の出力に `No targets deployed` と表示される場合がありますが、これは top-level 設定に routes 構文が直接書かれていないための表示です（Cloudflare ダッシュボード側で Workers Route が `bearworks.uk/*` にバインドされています）。デプロイ後に返される Deployment ID / Version ID を確認してください。

### ステップ 5: 公開後の実URL検証
デプロイ完了後、直ちに実際の公開 URL に対して以下の検証を実施します。

1. **HTTP ステータスとレスポンス確認**:
   * トップページ (`https://bearworks.uk/`) が 200 を返すこと。
   * 新規公開・更新された記事 URL が 200 を返し、正しい HTML・メタデータが描画されていること。
   * 存在しない URL（例: `/not-found-test-slug`）が 404 を返すこと。
2. **広告境界の確認**:
   * 広告対象ページ（ルート、`/toukei`、対象の Labs 記事など）に本番 AdSense ID (`ca-pub-9560028085973137`) が含まれていること。
   * 非広告ページ（`/about`、`/ai-news`、`/contact`、`/privacy`、`/weather`、`/dashboard`）および 404 ページに **AdSense 関連コードが一切含まれていないこと**。
3. **Cloudflare Access 保護の確認**:
   * 未認証状態で `https://bearworks.uk/dashboard` および `https://bearworks.uk/api/dashboard-data` にアクセスした際、Cloudflare Access のログイン画面へ 302 リダイレクトされること。
   * キャッシュヘッダーに `Cache-Control: no-store` が付与されていること。
4. **ブラウザ動作確認**:
   * ブラウザで実際のページを開き、レイアウト崩れ、JavaScript エラー（コンソールエラー）、インタラクティブ要素（グラフの切り替え、アコーディオンなど）の動作を確認すること。
5. **付属ファイルの確認**:
   * `https://bearworks.uk/ads.txt` が 200 で正しい publisher 行を返すこと。
   * `https://bearworks.uk/sitemap.xml` および `robots.txt` が正常に取得できること。

### ステップ 6: 完了記録
作業結果を記録します（作業ログまたはタスク記録ファイル）。
* 公開日時（JST / UTC）
* 公開対象コミット SHA
* 新しい Deployment ID / Version ID
* 更新前の Deployment ID / Version ID（復旧先）
* 公開後検証の結果

---

## 6. ロールバック手順

公開後に重大な問題（5xxエラーの多発、意図しない404、Access保護の迂回、広告境界違反、秘密情報の露出など）が確認された場合、以下の手順で速やかにロールバックを実施します。

### 通常時のロールバック（Worker Version ロールバック: 第一選択）
直前の正常な Worker バージョンへトラフィックを戻します。

```powershell
# デプロイ一覧で直前の Version ID / Deployment ID を確認
npx wrangler deployments list --env=""

# 直前のバージョンへロールバック
npx wrangler rollback <PREVIOUS_DEPLOYMENT_ID> --name bearworks-portal --yes --message "Rollback to pre-release version"
```

* ロールバック後、`https://bearworks.uk/` にアクセスし、旧バージョンへの復帰と正常稼働を確認します。

### 非常時のロールバック（Workers Route 削除による Pages フォールバック）
Worker 自体が起動不能になる等の壊滅的な障害が発生し、Worker バージョンロールバックでも復旧しない場合に限り、Cloudflare ダッシュボードから Workers Route を削除して旧 Pages 環境へ戻します。

> [!CAUTION]
> **Pages へのフォールバックに関する厳重注意**:
> - Pages プロジェクトは残っていますが、Git 連携切断時の古いビルド成果物であるため、現在の DNS、Access、AdSense、外部 API と整合するかは未検証です。
> - 実行前に必ず Cloudflare ダッシュボード上で配信プレビュー、DNS レコード、Access ポリシーを確認してください。
> - Workers Route の削除はサイト全体に影響を与える非常措置です。安易に実行せず、**必ずユーザーの明示的な判断・指示のもとで実施**してください。過去の移行手順と混同して通常の障害で実行してはなりません。

1. Cloudflare ダッシュボード > **Workers & Pages** > `bearworks-portal` > **Settings** > **Domains & Routes** を開く。
2. Route `bearworks.uk/*` を削除する（DNS レコードや Pages プロジェクトは変更しない）。
3. 数分待ち、Pages 環境へのフェイルオーバーと各ページの稼働を確認する。
