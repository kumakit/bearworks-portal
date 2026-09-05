# Issue #377 統計検定アプリ サブパス統合計画（第2回改訂版）

## 1. 背景と目的

### 1.1 背景と事実関係（確認範囲の厳密化）
- **確認済み事実**:
  - 2026-09-02 JSTのGoogle AdSense審査において、`bearworks.uk` は「要確認 / 有用性の低いコンテンツ」として不承認となった。
  - 公開 `ads.txt` はHTTP 200で取得可能であり、AdSense管理画面でステータス「承認済み」と表示されている。サイトの所有権も確認済みと表示されている。
  - 現在、統計学習アプリ「Toukei Kentei Drill」は別サブドメイン `toukei.bearworks.uk`（Cloudflare Pages）で配信されている。
  - 審査対象ドメイン `bearworks.uk`（Cloudflare Workers）上には、総合トップ、統計案内トップ（`/toukei`）、学習ガイド（8本）、全文公開例題（15問、トラックA第2バッチ反映済み）、八王子気候分析等が配置されている。
- **未確認事項**:
  - Google AdSenseの不承認の具体的内部判定基準（サブドメイン分離が原因であるか否か、Doorway判定の有無等は未確認・断定不可）。
  - `bearworks-toukei` のCloudflare Pagesにおける本番ブランチ自動デプロイ設定の現状（未確認）。
  - Cloudflare Zone内のDNS設定詳細（未確認）。
- **主目的の定義**:
  - **「統計の解説・演習・復習を一続きに使えるサービスへの改善」** を主目的とする。
  - Portal側の解説・例題と、Toukeiアプリ側の演習機能を同一ドメイン（`bearworks.uk/toukei/*`）へ集約し、Portalに重複したドリルを再開発することなく、一貫した学習動線を提供する。
  - 本統合はAdSense再審査の必須条件とは扱わず、トラックA（例題拡充）の公開・運用実績やクロール安定度を総合して再申請の可否を判断する。

---

## 2. アーキテクチャ基本方針（Step 1: Workersリバースプロキシ）

リポジトリやインフラの同時改変リスクを避けるため、**「Step 1: Cloudflare Workers リバースプロキシ方式」** を採用する。

```mermaid
flowchart TD
    Client["クライアント / Googlebot"] --> CFW["Cloudflare Workers<br>(bearworks.uk / bearworks-portal)"]
    
    subgraph Routing["Workers 最前段ルーター判定"]
        CFW -->|"/toukei/(exam|drill|cheatsheet|concepts|dashboard)/*"| Proxy["リバースプロキシ処理"]
        CFW -->|"/toukei/_next/*" (Toukei静的アセット)| Proxy
        CFW -->|"/", "/toukei" (案内), "/toukei/guides/*", "/toukei/problems/*", その他| Portal["bearworks-portal (Next.js Workers)"]
    end

    Proxy --> Origin["Cloudflare Pages 配信元<br>(bearworks-toukei)"]
```

### 方針の要点
1. **リポジトリ分離の維持**: `bearworks-portal` と `bearworks-toukei` のコードベース、CI/CDパイプラインを独立維持する。
2. **Toukei側Workers移行（Step 2）の分離**: `bearworks-toukei` は現行の Next.js 16 + next-on-pages（Pages）で動作させ、Workers移行は別マイルストーンとする。
3. **トラックAとの完全分離**: トラックA（例題15問公開済み）の成果物とはリリース時期を分離し、大量コンテンツ追加とインフラ切替を同時に行わない。
4. **Toukeiアプリ配信画面の全面非広告化**: Toukeiアプリが配信する全画面は広告スクリプトを一切読み込まず、非広告を徹底する。
5. **段階的URL切替**: フェーズA（旧URLと新URLの並行稼働）で十分な安定性を確認した後にのみ、フェーズB（301恒久転送）へ進む。

---

## 3. 詳細技術設計とP0/P1解消策（設計反映）

### 3.1 ロールバック設計（P0解消・設計反映済み・実装未実施）

HTTP 301（Permanent Redirect）はクライアント側ブラウザに保存され得るため、「301を停止して逆向きの302を設定する」手順はブラウザ上で無限リダイレクトループを招き、復旧不可能となる。Cloudflareのエッジキャッシュ削除はクライアント側のブラウザキャッシュに影響しない。

したがって、**逆302に依存した復旧手順を完全撤回し、以下の復旧構成を定義する**。

#### ① フェーズA（プロキシ並行稼働期間・301未適用）のロールバック
- **状態**: `toukei.bearworks.uk` は通常稼働を継続。`bearworks.uk/toukei/*` でもプロキシ経由でアクセス可能。
- **障害発生時の切り戻し**:
  - **判断基準**: プロキシによる5xxエラー率 > 0.1%、アセット404、TTFB中央値の悪化（+100ms超過）。
  - **手順**:
    1. Workerのプロキシルールを無効化、または新URL配下へのアクセスに対して「503 Service Temporarily Unavailable + `Cache-Control: no-store`」および旧URLへの案内リンクを返すフォールバックWorker版へ切り戻す（直前Workerへの単なるrollbackでは新URL用の一時案内画面が自動追加されないため、あらかじめフォールバック応答を備えた復旧用Worker構成を準備しておく）。
    2. 旧URL（`toukei.bearworks.uk`）は一切変更していないため、新URLにアクセスしていなかった利用者、および旧URLを直接開く利用者は継続利用可能。
    3. **利用中セッションの制約**: 新URL側で模擬試験中だった利用者の状態（`exam_session`）は新オリジンのLocalStorageに保存されており、同一オリジンポリシーにより旧URL側からは読み出せないため、「旧URLで即座に試験を継続できること」は操作途中の利用者には保証できず、セッション中断・再受験が必要となる制約を明記・案内する。
  - **所要時間**: 目安1分以内（Workerデプロイ・反映時間）、受け入れ上限5分以内。

#### ② フェーズB（恒久301適用後）のロールバック（新URL維持型復旧）
- **前提**: 301がブラウザに保存され得るため、旧URL（`toukei.bearworks.uk`）へ戻すことはできない。**新URL（`bearworks.uk/toukei/*`）を維持したまま、正常な `/toukei` 対応成果物へ戻す**。
- **復旧単位（整合性の担保）**:
  1. **Worker version**: 直前の安定したプロキシWorker version。
  2. **Toukei配信成果物**: `basePath: '/toukei'` を持ち、直前にLinux CIおよびPagesプレビューで単体検証済みの安定版PagesデプロイメントID。
  3. **静的アセット**: 当該Toukeiデプロイメントに紐づく `/toukei/_next/static/*`。
  4. **配信元設定**: Workerの環境変数 `TOUKEI_ORIGIN` を当該安定デプロイメントの固定URL（`https://<deployment-id>.<project>.pages.dev`）へ向ける。
- **ロールバック主手順**:
  - Cloudflare Pagesの標準rollback機能はProductionデプロイメント間でのみ動作し、Previewデプロイメントを対象にできない仕様であるため、Pagesダッシュボードのロールバックボタンには依存しない。
  - **主手順**: Workerの環境変数 `TOUKEI_ORIGIN` を直前安定プレビューURL（または直前の安定Worker version）へ切り戻すことを主手順とする。
  - Cloudflareエッジキャッシュをパージ（新URL配下の静的アセット・HTMLキャッシュを消去）。
  - 新URL（`bearworks.uk/toukei/*`）へアクセスし、正常画面が返ることを確認。
- **受け入れ条件**:
  - **301を保存したテストブラウザにおいて、ブラウザのキャッシュを消去・リセットすることなく、新URLで正常な画面およびアセットが読み込まれること** を必須受け入れ条件とする（Gate 2のステージング検証で実証試験を必須とする）。
  - 復旧所要時間: 目安3分以内、受け入れ上限5分以内をステージング検証で実測する。

---

### 3.2 成果物の分離・固定とGate境界（P1-1解消・設計反映済み・実装未実施）

Pagesの本番ブランチ（main）自動デプロイが有効な場合、単体検証段階でmainマージを行うと、旧URL（`toukei.bearworks.uk`）にbasePath付き成果物が誤配信される重大リスクがある。また、フェーズA（並行稼働期間）にmainマージを行っても旧ホスト側の配信先が破壊される。

- **成果物の分離と固定構成**:
  - **旧ホスト（`toukei.bearworks.uk`）**: basePathなしの現行本番成果物を配信し続ける。**フェーズA（並行稼働期間）中は `bearworks-toukei` の main ブランチへマージしてはならない**。
  - **新サブパス用（`bearworks.uk/toukei/*`）**: `basePath: '/toukei'` を持つ検証ブランチからビルドし、固有のデプロイメントURL（`https://<deployment-id>.<project>.pages.dev`）として固定プレビュー成果物を生成・維持する。Workerの `TOUKEI_ORIGIN` はこの固定プレビュー成果物を指す。
  - **mainマージの実施時期**: Gate 5（301恒久転送）の適用直前、または旧URLの稼働停止後まで凍結する。
- **Gateの厳格な分離**:
  - **Gate 1A**: ローカル単体検証（ブランチ `codex/toukei-basepath-local`、pushなし、mainマージなし、モックによるローカル検証のみで本番Firestoreへの書き込みなし）。
  - **Gate 1B**: 隔離preview / Linux CI検証（独立したブランチから生成されたPagesプレビューURLで検証。mainマージなし）。
  - **Gate 2**: stagingプロキシ検証（復旧試験・301保存ブラウザ試験を含む）。
  - **Gate 3**: 本番反映（フェーズA、固定プレビュー成果物を新URL用オリジンとして接続。mainマージなしで旧URLを並行稼働）。

---

### 3.3 Firestore空データ上書き防止（Fail-Closedガード）（P1-2解消・設計反映済み・実装未実施）

ローカルコード確認結果により、`src/lib/firestore-sync.ts` の `syncOnLogin` は `getDoc` 失敗をcatchした後も処理を継続し、空のLocalStorageでFirestoreを上書きする致命的経路が存在する。

#### 改訂実装仕様
- **対象ファイル**:
  - `src/lib/firestore-sync.ts`
  - `src/contexts/AuthContext.tsx`
- **安全停止条件（Fail-Closed）**:
  1. **サーバー実データ確認の必須化**:
     - `getDoc()` はクライアントのIndexedDB/オフラインキャッシュから取得する可能性がある。「サーバー確認必須」を確実に満たすため、Firebase SDKの **`getDocFromServer()`** を使用してサーバー実データを直接照会する。
  2. **読込失敗時の書き込み完全禁止**:
     - 通信エラー、タイムアウト、認証失敗等で `getDocFromServer` が例外を出した場合、処理を即時中断し、エラーを呼び出し元へスローする。
     - **マージ処理（160行目以降）および `setDoc`（177行目）へ絶対に進行させない**。
     - 呼び出し元の `AuthContext` では同期ステータスを `error` に設定し、デバウンス同期タイマー（`createDebouncedSync`）の登録を阻止する。
  3. **認証処理の世代管理と非同期キャンセレーション**:
     - 単なる `clearTimeout` では、既に開始された非同期読込処理のコールバック実行を阻止できない。
     - 認証処理ごとに世代識別子（generation ID / counter）または `AbortController` を管理する。
     - ユーザーAの読込中にログアウトやユーザーBへの切替が発生した場合、UIDと処理世代を照合し、不一致であればAの遅延取得結果によるLocalStorage更新、Firestore書き戻し、リスナー登録、ロック解除を完全に無効化（破棄）する。
  4. **「データ不在」と「取得失敗」の厳格な区別**:
     - 取得成功かつ `!docSnap.exists()` の場合（新規登録ユーザー）: 空データでの初回作成を許可。
     - 取得例外またはサーバー到達不能の場合（取得失敗）: 書き込みを排他ロックし、ユーザーに同期エラーを通知。
  5. **排他ロックと順序制御**:
     - ログイン直後から「Firestore読み込み成功 ➔ LocalStorageへのマージ完了」が確認されるまで、同期フラグ `isSyncLocked = true` を維持し、画面操作によるLocalStorage変更からのFirestore書き戻しを完全にブロックする。
  6. **ライフサイクル管理**:
     - ログアウト時およびアカウント切替時は、実行待ちのデバウンスタイマー（`drillRecordsTimer` 等）をすべて破棄し、世代カウンターをインクリメントする。
- **検証要件（Gate 1A ローカル試験）**:
  - **本番Firestoreへの書き込みは一切行わず、Firestore SDKのモック／スタブ環境で検証する**。
  - **同期処理まで到達する失敗試験**:
    - 認証済み状態から意図的に読込例外（ネットワーク断、権限エラー）を発生させ、書き込み処理（`setDoc`）が一度も呼び出されないことを検証。
    - 読込成功パターン（データあり時のマージ整合性）。
    - 新規ユーザーパターン（データ不在時の初期化）。
    - 読込再試行パターン。
    - 読込途中の認証切替パターン（ユーザーA読込中にBへ切替時、Aの処理が破棄されること）。

---

### 3.4 保存状態・未同期データの保全（P1-3解消・設計反映済み・実装未実施）

- **LocalStorage 7キーの扱い一覧**:

| キー名 | 格納データ | クラウド同期 | サブパス移行時の扱い |
| :--- | :--- | :--- | :--- |
| `drill_records` | 分野別ドリル集計成績 | 対象 | 新ドメインでログイン後、Firestoreから自動復元 |
| `drill_history` | ドリル解答ログ（最大500件） | 対象 | 新ドメインでログイン後、Firestoreから自動復元 |
| `exam_history` | 模擬試験過去ログ（最大50件） | 対象 | 新ドメインでログイン後、Firestoreから自動復元 |
| `flashcard_progress` | 暗記カード進捗 | 対象 | 新ドメインでログイン後、Firestoreから自動復元 |
| `flashcard_review_history` | 暗記カード復習履歴 | 対象 | 新ドメインでログイン後、Firestoreから自動復元 |
| `exam_session` | 進行中模擬試験セッション | **非対象** | **旧URL側で試験完了まで保持（リダイレクト猶予）** |
| `exam_latest_result` | 直前試験の未保存詳細結果 | **非対象** | 結果画面確認後、履歴同期を推奨 |

- **旧側の試験停止手順と成果物更新（Gate 4）**:
  - 旧URL側で新規模擬試験を停止するため、旧ホスト用成果物（basePathなし）に「新規模擬試験開始ボタンの非活性化と新URL案内」を反映した更新ビルドを作成・デプロイする。
  - **既に開いている旧画面の扱い**: すでに模擬試験画面を開いて受験中の利用者が試験を完了できるよう、試験時間（90分）＋結果確認・復習の猶予時間（計120分以上）を確保する。
  - **未ログイン利用者の履歴制約**: ブラウザの同一オリジンポリシーにより、LocalStorageの未ログイン履歴は新オリジンへ自動移行されない制約を画面上に明示し、ログインによるクラウド同期を推奨する。
- **新規試験の段階的制限**:
  - フェーズA終盤において上記旧成果物をデプロイし、旧URL上で新規の `exam_session` が発生しない状態を確認した上でフェーズB（恒久転送）へ進む。

---

### 3.5 basePathと内部リンク・URL対応（P1-4解消・設計反映済み・実装未実施）

#### ① ホームリンクおよびルーター遷移の全件点検
- `src/app/layout.tsx` の `<Link href="/">`（41行目）をはじめ、コード内の全ホームリンクを点検・修正する。
  - **Toukeiアプリ内のホーム移動**: `<Link href="/drill">`（basePath下で `/toukei/drill` に解決）へ修正。
  - **Portal案内トップへの移動**: `<a href="https://bearworks.uk/toukei">`（明示的full page load）として定義。
  - `router.push("/")` や `router.replace("/")` は `router.push("/drill")` へ修正。

#### ② 全URL旧新マッピング対応表

| 旧URL (`toukei.bearworks.uk`) | 新URL (`bearworks.uk`) | 担当サービス | ルーティング・配信仕様 | 広告 |
| :--- | :--- | :--- | :--- | :---: |
| `/` | `/toukei/drill` | Toukei (Pages) | 初期画面リライト（機能トップ） | 非広告 |
| `/drill`, `/drill/*` | `/toukei/drill`, `/toukei/drill/*` | Toukei (Pages) | 分野別ドリル演習画面 | 非広告 |
| `/exam` (トップ案内) | `/toukei/exam` | Toukei (Pages) | 模擬試験案内・設定画面（index対象） | 非広告 |
| `/exam/session` (試験中動的画面) | `/toukei/exam/session` | Toukei (Pages) | 90分模擬試験実行画面（noindex） | 非広告 |
| `/exam/*` (その他試験配下) | `/toukei/exam/*` | Toukei (Pages) | 結果・解説画面 | 非広告 |
| `/cheatsheet`, `/cheatsheet/*` | `/toukei/cheatsheet`, `/toukei/cheatsheet/*` | Toukei (Pages) | チートシート・暗記カード | 非広告 |
| `/concepts/[conceptId]` | `/toukei/concepts/[conceptId]` | Toukei (Pages) | 概念解説（全88件、正本: concepts.json published集合） | 非広告 |
| `/dashboard` | `/toukei/dashboard` | Toukei (Pages) | 統計学習ダッシュボード（noindex） | 非広告 |
| `/about` | `/about` | Portal | Portal側共通ページへfull page load | 非広告 |
| `/contact` | `/contact` | Portal | Portal側共通ページへfull page load | 非広告 |
| `/privacy` | `/privacy` | Portal | Portal側共通ページへfull page load | 非広告 |
| `/_next/static/*` | `/toukei/_next/static/*` | Toukei (Pages) | 静的アセット（ステータス別エッジキャッシュ） | 非広告 |
| （末尾スラッシュ付きURL） | （末尾スラッシュなしURL） | — | 301正規化（Workerルーターで統一） | — |
| （未定義不正URL） | `/toukei/404` | Toukei (Pages) | 404 Not Found（200にせずHTTP 404を維持、広告なし） | 非広告 |

---

### 3.6 プロキシの通信・キャッシュ境界（P1-5解消・設計反映済み・実装未実施）

- **実装場所**: `bearworks-portal` の Worker entrypointにおいて、OpenNextハンドラーの前段に配置（OpenNext再ビルドで上書きされない独立エントリーラッパー）。
- **ステータス別キャッシュ方針（Cloudflare Workers公式仕様準拠）**:
  - 静的アセットフェッチにおいて `cf.cacheTtlByStatus` を使用し、エラーレスポンスがエッジに保存されることを根本遮断する：
    ```ts
    cf: {
      cacheEverything: true,
      cacheTtlByStatus: {
        "200-299": 31536000, // 成功した静的アセットのみ長期エッジキャッシュ
        "400-499": 0,        // クライアントエラー・404はキャッシュ禁止
        "500-599": 0         // サーバーエラーはキャッシュ禁止
      }
    }
    ```
  - **HTML / RSC / データフェッチ**: エッジキャッシュを行わず、オリジンの `Cache-Control: no-store` を厳格に転送。
  - レスポンスヘッダーでも 404 / 5xx 時は `Cache-Control: no-store` を強制付与。
- **リダイレクト・Locationヘッダー処理**:
  - `fetch` は `redirect: 'manual'` で実行。
  - Pagesオリジンからの 301/302/307/308 レスポンスについて、`Location` ヘッダーを精査・書き換え：
    - Pages内部URL（`*.pages.dev`）を指している場合はプロキシ側の対応パスへ書き換え（意図しない外部ホストへの漏洩を遮断）。
    - 相対パス、クエリパラメータの維持、`basePath` の二重付与（`/toukei/toukei/*`）を防止。
    - **ステージング環境（`staging.bearworks.uk`）において本番URL（`bearworks.uk`）へ転送されないこと** を確実に確認。
- **ルーティング・不正URL処理**:
  - 機能トップの完全一致（`/toukei/drill`）と配下パス（`/toukei/drill/*`）の両方を検証。
  - 存在しない不正URLに対しては転送先で200を返さず、**HTTP 404ステータスを確実に維持**する。
- **転送ヘッダーの選定**:
  - 転送許可: `Host`（オリジンへ書換え）、`Accept`, `Accept-Encoding`, `CF-Connecting-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`、Next.js内部ヘッダー（`rsc`, `next-router-state-tree` 等）。
  - 除外: Cloudflare Access関連ヘッダー（`cf-access-*`）、Portal用の内部認証トークン。
- **障害注入テスト**:
  - ステージング検証において、Pagesオリジンの500エラーおよびタイムアウト（8秒）を模擬し、Portal全体のクラッシュやAccess保護（`/dashboard`）への影響がないことを確認する。

---

### 3.7 SEO・preview境界とサイトマップ再計算（P1-6解消・設計反映済み・実装未実施）

- **`X-Robots-Tag: noindex` の環境別サニタイズ**:
  - Pages preview環境直接アクセス: `noindex` を維持。
  - ステージングプロキシ環境（`staging.bearworks.uk`）: staging全体の `noindex` を維持。
  - 本番Workerプロキシ経由: 正常な公開対象ページ（drill, examトップ, cheatsheet, concepts/*）に限り、Pagesプレビュー由来の `noindex` をサニタイズ（削除）。
  - **意図的noindexの保持**:
    - 個人ダッシュボード（`/toukei/dashboard`）、動的模擬試験セッション画面（`/toukei/exam/session` 等）、404ページ等の意図的noindexはレスポンスヘッダーおよびmetaタグで確実に維持する（同じ `/exam` 系統でもトップ案内はindex、試験中はnoindexと動的に制御）。
- **Canonicalタグの検証**:
  - プロキシ経由の各公開ページにおいて、`<link rel="canonical">` が正しく `https://bearworks.uk/toukei/...` を指していることを検証。
- **公開概念（concepts）とサイトマップ規模の正確な再計算**:
  - 公開概念の正本は `src/data/concepts.json` の published 概念集合全 **88件**（重複なし、非公開データの混入なし）。
  - **現行サイトマップ内訳（例題15問公開時点）**:
    - Portal側固定・ガイド・例題: **32 URL**
    - Toukei側公開概念（concepts published）: **88 URL**
    - Toukei側機能トップ（drill, exam, cheatsheet）: **3 URL**
    - **現行統合時のインデックス対象総数: 123 URL**
    - （将来例題30問到達時: 47 + 88 + 3 = **138 URL**）
- **引き継ぎ表現**: 「完全引き継ぎ」という表現を排除し、「Google公式仕様に準拠した301恒久転送とcanonical正規化」と定義。

---

### 3.8 広告方針の明確化（設計反映済み・実装未実施）

- **定義**: 「Toukei配下全面オフ」という表現を改め、**「Toukeiアプリが配信する画面は全面非広告とする」** と定義する。
  - Portalが配信する `/toukei`（案内トップ）、`/toukei/guides/*`、`/toukei/problems/*` は広告掲載（monetized）。
  - Toukeiアプリが配信する `/toukei/drill`、`/toukei/exam`、`/toukei/concepts/*`、`/toukei/cheatsheet`、`/toukei/dashboard` は完全非広告（non-monetized）。
- **受け入れ条件**:
  - 「100%排除」という保証表現を排除し、ビルド生成HTMLの走査、直接アクセス検証、Portal↔Toukei間のアプリ間往復、404画面におけるDOM/Network検証で広告スクリプトが読み込まれないことを合否判定条件とする。

---

## 4. 厳格化されたGate構成

| Gate | 名称 | 作業内容 | 承認境界 |
| :--- | :--- | :--- | :--- |
| **Gate 0** | 計画改訂と再レビュー | 本改訂計画書のCodex手動計画レビュー（読み取り専用） ➔ 【条件付き承認】受領済み | ユーザー・Codex |
| **Gate 1A** | Toukeiローカル単体実装 | 分離ブランチ `codex/toukei-basepath-local` でbasePath・内部リンク・非広告化・Firestore Fail-Closedガード（世代管理・`getDocFromServer`・モック単体テスト）実装、ローカル単体検証（pushなし、mainマージなし、本番Firestore書き込みなし） | ユーザー |
| **Gate 1B** | Toukei隔離preview検証 | 隔離プレビュー環境へのデプロイ、Linux CIによる `pages:build` 成果物検証、固定プレビューURL生成（mainマージなし） | ユーザー |
| **Gate 2** | Portal stagingプロキシ検証 | `staging.bearworks.uk` でのプロキシ実装、遅延測定（+50ms以内）、ステータス別エッジキャッシュ、Access保護、障害注入テスト、正常Worker+固定Pages URL復旧実測（5分以内）、301保存ブラウザ復旧実証 | ユーザー |
| **Gate 3** | 本番反映（フェーズA） | 旧ホスト成果物（basePathなし）の維持確認後、固定プレビュー成果物を新URL用オリジンとして本番Workersプロキシへ反映。mainマージなしで旧URL（`toukei.bearworks.uk`）と並行稼働（301未適用） | ユーザー |
| **Gate 4** | 安定観測と新規試験停止 | 1〜2週間の稼働観測、旧ホスト用成果物更新による新規模擬試験開始停止・猶予管理、未同期データ制約の案内 | ユーザー |
| **Gate 5** | 恒久切替（フェーズB） | URL個別ルールによる301恒久リダイレクト適用、新URL維持型ロールバック待機、SEO（canonical/sitemap 123URL）運用 | ユーザー |

