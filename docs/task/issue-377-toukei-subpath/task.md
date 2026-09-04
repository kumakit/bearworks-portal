# Issue #377 統計検定アプリ サブパス統合 タスクリスト（第3回改訂版）

## 測定・検証基準の定義
- **TTFB（遅延測定）**: ステージング環境（同一リージョンクライアントから測定）におけるプロキシ経由と直接アクセスの中央値（n=20回）の差分が **+50ms以内** であること。
- **ロールバック所要時間**: ステージング環境において、障害検知から新URLでの正常画面復帰までの所要時間を実測し、目標3分以内、**受け入れ上限5分以内** であることを確認すること。

---

## Gate 0: 手動計画レビュー（完了）

- [x] Codex指摘（P0/P1全7観点）を反映した詳細実装計画書（`implementation_plan.md`）の第2回改訂
- [x] タスクリスト（`task.md`）のGate再構成と具体的作業項目の反映
- [x] レビュー依頼書（`plan-review-request.md`）の重点確認項目の改訂
- [x] ユーザーによるCodexへの改訂計画レビュー依頼（読み取り専用）
- [x] レビュー結果の受領・確認（**【条件付き承認】** 受領）
- [x] 指摘条件（Firestore 3要件、後続Gate要件）の実装計画・タスクリストへの反映
- [x] ユーザーによる Gate 1A 着手承認

---

## Gate 1A: `bearworks-toukei` ローカル単体実装・検証（pushなし・本番書き込みなし）

- [x] 作業ブランチ `codex/toukei-basepath-local` をローカル作成（リモートpushなし）
- [x] `next.config.ts` に `basePath: '/toukei'` を設定
- [x] 初期画面を `/toukei/drill` とするリライト・リダイレクト設定
- [x] **ホームリンク・ルーターの全件点検と修正**:
  - `src/app/layout.tsx` の `<Link href="/">` を `<Link href="/drill">` へ修正
  - 各画面内のホーム移動（`router.push("/")` 等）を `/drill` へ修正
  - Portal案内トップへのリンクを `<a href="https://bearworks.uk/toukei">`（full page load）として定義
  - 共通固定ページ（About, Contact, Privacy）リンクをPortal側へfull page load遷移するように更新
- [x] **広告スクリプトの完全非読み込み化**:
  - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` を空にし、Toukeiアプリ配信画面で広告スクリプトが描画されないことを確認（layout.tsxからスクリプトタグを完全除去）
- [x] **Firestore Fail-Closed ガードおよびデータ保全の実装（Codex指摘 P1-1〜P1-3解消）**:
  - 対象: `src/lib/firestore-sync.ts`, `src/contexts/AuthContext.tsx`, `src/lib/storage.ts`, `src/hooks/useDrillRecords.ts`, `src/hooks/useFlashcardProgress.ts`, `src/components/auth/AuthButton.tsx`
  - **サーバー実データ確認の必須化**: `getDoc()` に代わり `getDocFromServer()` を使用
  - **読込失敗時の書き込み完全禁止**: 取得失敗時は処理を即時中断しエラー伝播（`setDoc` を絶対に呼び出さない）
  - **認証処理の世代管理と非同期キャンセレーション**: 世代番号を導入し、ユーザーAの読込中にログアウト／ユーザーBへ切り替わった場合、Aの結果による更新・書き込み・ロック解除を破棄
  - **「データ不在」と「取得失敗」の厳格な分岐**: 新規ユーザーのみ空データ作成許可、通信エラー時は排他ロック
  - **初回同期完了までの排他ロック**（`isSyncLocked`）の実装
  - **ログアウト・アカウント切替時のクリーンアップ**: 実行待ちデバウンスタイマー破棄と世代インクリメント
  - **P1-1 & P1-2解消（同期中操作の消失防止・デルタリベース適用）**: `src/lib/firestore-sync.ts` に `reconcileDrillRecords` および `reconcileFlashcardProgress` を実装。通信開始前のスナップショットと通信完了後の最新差分（デルタ）を検出し、クラウドから返ったベースマージへ確実に合算。同一問題・同一カードへの解答・復習がクラウド側の回数で上書きされる欠陥を完全解消。同期復元時の内部書き戻しには `skipPending: true` を指定し保留キュー汚染を防止
  - **Firestore送信ペイロードの完全サニタイズ（P1解消）**: `sanitizeForFirestore` を新設し、`reconcileFlashcardProgress` および `mergeFlashcardProgress` で未設定の任意項目（`needs_review`, `review_reason`）が `undefined` キーとして生成される経路を遮断。`setDoc` / `updateDoc` 送信時に `undefined` プロパティを再帰的完全除去し、Firestore SDK による拒絶例外を確実に防止
  - **serverTimestamp FieldValue 保持の二重防御（P1解消）**: `sanitizeForFirestore` が `serverTimestamp()` 等の特殊インスタンスをプレーンオブジェクト（`{ _methodName: "serverTimestamp" }`）へ分解してサーバー時刻設定を破壊する欠陥を解消。①`sanitizeForFirestore` でプレーンオブジェクト（`Object.getPrototypeOf(obj) === Object.prototype || null`）のみを再帰処理し特殊インスタンスを保護、②`syncOnLogin` および `createDebouncedSync`（5箇所の `updateDoc`）でユーザー学習データ部分のみをサニタイズし、`lastSyncedAt: serverTimestamp()` はトップレベルで直接結合。テストモック全件に `assertValidFieldValueOrTimestamp` ガードを適用し、プレーンオブジェクトへの変質を自動検知・拒絶
  - **P1-3 & P2解消（AuthContext retrySync 経路の直接提供と検証）**: `AuthContext.tsx` から `executeAuthSync` および `executeRetrySync` を分離・エクスポートし、プロダクションコードとテストコードで同一の再試行・状態遷移ロジックを共有。UI（`AuthButton`）にも警告インジケーターと再試行ボタンを接続
  - **P2・Gate 1B条件対応（依存・ロックファイル整合化）**: `package.json` に `"tsx": "^4.19.0"`、`.npmrc` に `legacy-peer-deps=true`、`package-lock.json` に依存ツリーを整合化し、`npm ci --dry-run` の成功を確認
- [x] **ローカル単体・結合検証（本番Firestore書き込み禁止、モック環境）**:
  - `npm run lint`（エラー0件、警告0件）
  - `npm run build`（Next.js Turbopack build成功、静的アセットが `/toukei/_next/*` に出力されること確認、103ページ生成）
  - `npm ci --dry-run`（クリーンインストール検証成功）
  - **Firestoreモック単体・結合テスト**（`npm run test:firestore`、全10/10件パス、モック全件で `assertNoUndefinedProperties` および `assertValidFieldValueOrTimestamp` ガード自動適用）:
    - 認証済み状態から意図的に読込例外を発生させ、書き込み（`setDoc`）が一度も呼ばれないことの確認（テスト1）
    - 読込成功パターン（テスト2）、新規ユーザー（データ不在）パターン（テスト3）、再試行パターン（テスト4）の確認
    - 読込途中の認証切替（A→B）でAの非同期処理が完全に破棄されることの確認（テスト5）
    - 排他ロック中のFirestore非同期同期遮断の確認（テスト6）
    - **P1-1実証**: 復元済み履歴（10問分）がある状態で1問目を解いても、全件保持され計11問が維持される結合テスト（テスト7）
    - **P1実証（遅延読込回帰＆undefined拒絶＆serverTimestamp保持）**: クラウド読込待ち中（遅延中）の同一問題解答（10回+1回=11回）・任意項目未設定カード復習（5回+1回=6回）が、`undefined` プロパティなし・本物FieldValueインスタンス維持で正しく加算・マージされる結合テスト（テスト8）
    - **P1-3 & P2実証（実retrySync経路結合テスト＆serverTimestamp保持）**: 初回読込失敗時にローカル保存が継続し、`AuthContext.executeRetrySync` の直接実行で正しくFirestore同期へ復帰後、リアルタイム同期コールバック経由で本物FieldValueインスタンスを伴う `updateDoc` が発火する結合テスト（テスト9）
    - **P1-2実証**: 初期同期ロック中の操作が保留キューに蓄積され、ロック解除時に自動フラッシュされるテスト（テスト10）
- [x] ユーザーによる Gate 1B 進行承認（この時点ではmainマージ・pushを行わない）

---

## Gate 1B: `bearworks-toukei` 隔離preview・Linux CI検証（完了）

- [x] ユーザーの明示承認後、ブランチをpush（コミット `8a85866` ➔ `78c6040` ➔ `b5a7dba`）
- [x] 独立したPagesプレビュー環境（またはプレビューデプロイURL）を固定生成:
  - **プレビューデプロイメントID**: `099741b3-67e3-4bf1-a3eb-ae9536864137`
  - **固定プレビューURL**: `https://099741b3.bearworks-toukei.pages.dev`
  - **ブランチプレビューURL**: `https://codex-toukei-basepath-local.bearworks-toukei.pages.dev`
- [x] Linux CIによる `npm run pages:build` の再現性確認:
  - `postinstall`（`scripts/patch-next-on-pages.mjs`）による `@cloudflare/next-on-pages` の `basePath` 動的ISR判定パッチ適用
  - `wrangler.toml` による `nodejs_compat` 互換性フラグのプレビュー環境適用
  - LinuxビルドコンテナでNext.js Turbopack SSG全103ページ生成およびEdge Workerバンドル成功実証
- [x] 隔離プレビューURLでの単体動作確認:
  - [x] ルートアクセス（`/`）から `/toukei/drill` への 307 リダイレクト確認
  - [x] 各主要画面（`/toukei/drill`, `/toukei/exam`, `/toukei/cheatsheet`, `/toukei/cheatsheet/flashcard`, `/toukei/dashboard`, `/toukei/concepts/*`）のHTTP 200 OK表示確認
  - [x] 静的アセット（全14件のJS/CSS）が404にならず全件HTTP 200 OKで配信されることを確認
  - [x] Toukei配信画面において広告スクリプト（`adsbygoogle` 等）が一切読み込まれない（0件）ことを確認
  - [x] ナビゲーションリンクが `/toukei/...`、共通ページリンクが `https://bearworks.uk/...` へ正しく向いていることを確認
- [x] **本番mainマージは行わず、プレビューデプロイメントID・URLを固定保持**
- [x] ユーザーによる Gate 2（Portal stagingプロキシ実装・合否判定QA）進行承認


---

## Gate 2: `bearworks-portal` stagingプロキシ実装・合否判定QA

- [x] `bearworks-portal` の作業ブランチ作成（`codex/issue-377-subpath-proxy-gate2`）
- [x] Cloudflare Workers前段ルーターでの `/toukei/*` プロキシ判定ロジック実装（`workers/router.ts`）:
  - 対象: `/toukei/(drill|exam|cheatsheet|concepts|dashboard)/*`, `/toukei/_next/*`
  - 配信元オリジンを環境変数 `TOUKEI_ORIGIN`（Gate 1Bの固定PagesプレビューURL `https://099741b3.bearworks-toukei.pages.dev`）へ接続
  - **ステータス別エッジキャッシュ**: `cf.cacheTtlByStatus` で成功した静的アセット（200の `/toukei/_next/static/*`）のみ長期エッジキャッシュ。HTML/RSC/404/5xxはエッジキャッシュ禁止（`no-store`）
  - 8秒タイムアウト、5xxサーバー障害検知、503+no-storeフォールバック画面（旧URL `toukei.bearworks.uk` 案内リンク付き）
  - **リダイレクト処理**: `redirect: 'manual'` で 301/302/307/308 のLocationヘッダーをサニタイズ（相対URL/クエリ維持、basePath二重付与防止、`Cache-Control: no-store` 強制付与）
  - **不正URL処理**: 存在しないパスは200にせずHTTP 404を維持
  - **SEO境界**: staging全体の `noindex` を維持（`X-Robots-Tag: noindex, nofollow` 強制付与）
- [x] staging環境（`staging.bearworks.uk`）へのデプロイ（Version ID: `f2330f35-fcb8-4260-8a6e-fbcd946afdbb`、デプロイ所要時間: 7.4秒）
- [x] **合否判定チェックリストの検証（ローカル実機＆staging未認証実測）**:
  - [x] 静的アセット全14件が404にならず正常配信されること（ローカルQA 200 OK、404エラー0件確認）
  - [x] 機能トップ完全一致（`/toukei/drill` 等）および配下パス（`concepts/anova...` 等）が正常ルーティングされること
  - [x] Portal担当ルート（`/toukei`, `/toukei/guides/*`, `/toukei/problems/*`, `/about`, `/privacy`, `/contact`）がOpenNextへ正常フォールスルーすること
  - [x] Toukeiアプリ配信画面で広告スクリプトが一切読み込まれないこと（DOM/Network検査 0件確認）
  - [x] Portal側のAccess保護（`/dashboard`, `/api/dashboard-data`）が302かつno-storeを維持していること（実測確認。さらにstaging hostname全体がCloudflare Access 302保護下にあることを確認）
  - [x] Pagesプレビューの500エラーおよびタイムアウト模擬時、Portal全体がクラッシュせず503+no-storeフォールバック画面（旧URLリンク付き）を返すこと（実証完了）
  - [x] **301保存ブラウザでの復旧受け入れ検証（実機Chrome実証完了・P1完全解消）**:
    - 実機Chrome（CDP操作、永続`user-data-dir`）にて旧URLから新URLへの301（`max-age=31536000`）を受信させ、2回目アクセスで旧サーバーアクセス0件（ブラウザ内部ディスクキャッシュより直接解決）を確認し「301保存済みブラウザ」を確立。
    - 障害模擬時の `status === 503`（厳格アサート、302非許容、旧URL案内リンクおよび `Cache-Control: no-store` 含有）を実証。
    - **ブラウザキャッシュを一切消去・リセットせず**、新URL（`/toukei/drill`）へ直接アクセスし、最新画面（DOMタイトル「統計検定学習最適化プラットフォーム」）および全静的アセット（CSS 1件、JS 18件、全件200 OK、エラー0件）が正常に読み込まれることを実証。
  - [x] **TTFB定量測定（P2-3解消）**: 本番プロキシ（`bearworks.uk/toukei/drill`）vs Pages直接（`099741b3.bearworks-toukei.pages.dev/toukei/drill`）各n=20回交互測定を実施。Pages Direct中央値 **52.99 ms**、Worker Proxy中央値 **72.94 ms**、中央値差分 **+19.94 ms**（基準「+50ms以内」達成、PASS [OK]）
  - [x] Toukei内部のSPA画面遷移、およびPortalとのfull page load相互遷移の実機確認（ユーザー実機ブラウザにて確認完了）
- [x] **復旧実証テスト（画面・アセット両方の復旧所要時間実測・P1完全解消）**:
  - 障害状態から画面（200 OK + 「統計検定」本文）および静的アセット（200 OK）の両方が完全に復旧するまでのトータルエンドツーエンド所要時間（**0.059秒**〜**2.79秒**、受け入れ上限5分 / 300秒に対し大幅達成）を実機自動検証スクリプト（`scratch/test_p1_complete_verification.mjs`）およびstaging切り戻し実測にて確認完了
- [x] ユーザーによる Gate 3 進行承認

---

## Gate 3: 本番反映（フェーズA: プロキシ並行稼働）

- [x] 旧ホスト成果物（現行本番Pagesデプロイメント、basePathなし）の維持確認（`https://toukei.bearworks.uk/drill` 正常稼働中）
- [x] **`bearworks-toukei` の main マージは行わない**（旧URL並行稼働保護のため凍結維持確認）
- [x] `bearworks-portal` の本番Workersへプロキシルーティング反映（`TOUKEI_ORIGIN` にGate 1Bの固定プレビューURLを設定、Version ID: `1801917f-25f6-4703-b4b1-5a752b188781` 100%反映）
- [x] **HTML/RSC キャッシュ制御の是正（P2-1解消）**: 取得側でCloudflare公式仕様に準拠した `cache: "no-store"` および `cf.cacheTtlByStatus: { "100-599": -1 }` を適用、返却側で `Cache-Control: no-store, no-cache, must-revalidate` を強制付与（`public, max-age=0` を完全排除、実機確認済み）
- [x] **公開ページの Canonical タグ設定（P2-2解消）**: 公開対象ページ（`/toukei/drill`, `/exam`, `/cheatsheet`, `/cheatsheet/flashcard`, `/concepts/*`）に `HTMLRewriter` で `<link rel="canonical" href="https://bearworks.uk/toukei/...">` を注入し、HTTP `Link` ヘッダーも付与。非公開ページ（`/toukei/dashboard`, 404等）は `noindex` を維持（実機確認済み）
- [x] フォールバック復旧Worker版（503+no-store案内）の待機確認
- [x] **本番即時スモークテスト（ALL PASS [GO] 確認）**:
  - 新URL（`https://bearworks.uk/toukei/drill`, `/exam`, `/cheatsheet`, `/dashboard`, `/concepts/*`）の正常200 OK動作確認
  - 静的アセット全14件の 200 OK 配信確認（404エラー 0件）
  - 旧URL（`https://toukei.bearworks.uk/drill` 等）がbasePathなしのまま通常利用可能であることの確認（並行稼働正常）
  - 5xxエラー、アセット404、広告漏洩（AdSense出現数0件）がないことの確認
- [x] ※この段階では旧URLへの301リダイレクトは絶対に設定しない（並行稼働維持確認）

---

## Gate 4: 安定観測・新規試験停止・未同期データ保全

- [ ] フェーズAの安定稼働観測（1〜2週間）
- [ ] **旧ホスト用成果物の更新デプロイ**:
  - basePathなしの旧コードベースで「新規模擬試験開始ボタンの非活性化と新URL案内」を反映した成果物をビルド・デプロイ
- [ ] **進行中試験の完了猶予管理**:
  - 既に開いている旧画面の受験完了および結果確認の猶予時間（120分以上）を確保
- [ ] **未同期・未ログインユーザーへの案内**:
  - オリジンを跨いだLocalStorageの非移行制約を明示し、ログインによるクラウド同期を推奨
- [ ] ユーザーによるフェーズB（301恒久転送）着手承認

---

## Gate 5: 恒久切替（フェーズB）とSEO運用

- [ ] Cloudflareにて旧URLから新URLへの個別301リダイレクト設定（包括転送ではなく個別ルール）:
  - `toukei.bearworks.uk/` ➔ `bearworks.uk/toukei/drill`
  - `toukei.bearworks.uk/drill*` ➔ `bearworks.uk/toukei/drill*`
  - `toukei.bearworks.uk/exam*` ➔ `bearworks.uk/toukei/exam*`
  - `toukei.bearworks.uk/cheatsheet*` ➔ `bearworks.uk/toukei/cheatsheet*`
  - `toukei.bearworks.uk/concepts/*` ➔ `bearworks.uk/toukei/concepts/*`
  - `toukei.bearworks.uk/about` ➔ `bearworks.uk/about`
  - `toukei.bearworks.uk/contact` ➔ `bearworks.uk/contact`
  - `toukei.bearworks.uk/privacy` ➔ `bearworks.uk/privacy`
- [ ] **301保存ブラウザでの本番受け入れ検証**:
  - 301をキャッシュしたブラウザにおいて、新URLのまま正常な `/toukei` 成果物が表示されることの最終確認
- [ ] `bearworks-portal` の `app/sitemap.ts` にToukei側88概念（published）および機能URLを統合（計123URL）
- [ ] Search Consoleにて新しいサイトマップを送信
- [ ] クロール・インデックス状況の経時監視
- [ ] 安定運用とトラフィックを確認後、ユーザーの明示承認を経てAdSense再審査を判断

