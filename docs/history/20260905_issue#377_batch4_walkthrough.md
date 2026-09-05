# Issue #377 トラックA 第4バッチ 実装・ローカル検証

## 結果と境界

問21〜25の5問を追加し、オリジナル解説例題は20問から25問、sitemapは37 URLから42 URLになった。参考書・問題集（公式テキスト『統計学基礎』、宮本『この1冊で合格！』、CBT対応版公式問題集）を精査し、既存20問と一切被らない重要未出題テーマ（ラスパイレス/パーシェ物価指数、チェビシェフの不等式、幾何分布、過誤と検出力、フィッシャーの3原則）を選定・設計した。

独立数値検算（SciPy 1.18.1+）、lint、Next.js/OpenNext build、Wrangler dry-run、Next.jsとWorkersのローカル配信検証はすべて成功した。これは未公開のローカル検証結果であり、最終公開内容は運営者の承認待ちである。

ブランチは `codex/issue-377-problems-batch-4`。fetchした最新 `origin/main`（コミット `63b59c0`）から作成した。初回ローカル完了報告時点では commit、push、PR作成、Issue更新、本番deploy、Cloudflare設定変更、AdSense操作を行っていない。トラックBのプロキシルーティング（`workers/router.ts`）および設定は完全に保持されている。

## 差分

| ファイル | 内容 |
| --- | --- |
| `app/(monetized)/toukei/problems/problem-data.ts` | 第4バッチ5問（問21〜問25）と制作情報参照を追加 |
| `lib/content-provenance.ts` | 第4バッチ固有の制作・検証情報を、最終公開承認待ちとして追加 |
| `scripts/verify-toukei-batch4.py` | SciPyによる5問の独立計算と数値誤答経路の検証スクリプトを追加 |
| `scripts/verify-toukei-pages.mjs` | 25問・42 URL・第4バッチ制作情報・価格数量表の検証へ更新 |
| `docs/task/issue-377/batch-4-task.md` | ローカル工程と残工程を記録 |
| 本ファイル | 選定理由、設計根拠、検算結果、公開境界を記録 |

`app/site-content.ts` は問題配列からsitemap対象を動的に生成するため変更不要。依存関係、広告layout、既存20問のデータ、トラックB、Cloudflare設定は変更していない。

## 参考書・問題集からの選定根拠と設計

統計検定2級公式出題範囲および参考資料に基づき、既存20問と重複しない5分野を厳選した。

| 問 | スラッグ | 出題テーマ | 参考資料対応 | 設計と統計的ポイント |
| :--- | :--- | :--- | :--- | :--- |
| 21 | `laspeyres-paasche-price-index` | ラスパイレス物価指数とパーシェ物価指数 | 公式テキスト §1.7.5<br>CBT問題集 p.40 | 基準年と比較年の2品目の価格・数量からラスパイレス物価指数（123.1）を算出。パーシェ指数（122.6）との比較、基準年数量固定による「代替効果の無視＝物価上昇の上方バイアス」という経済統計の重要性質を解説。 |
| 22 | `chebyshev-inequality` | チェビシェフの不等式 | 公式テキスト §2.11.1<br>宮本テキスト 第9章 | 分布形状が未知（非正規）のデータにおいて、平均 $\mu=45.0$、標準偏差 $\sigma=6.0$ から $\mu \pm 2.5\sigma$（30.0〜60.0分）に収まる確率の下限 $1 - 1/k^2 = 0.84$（84.0%以上）を評価。正規分布との比較と普遍性を解説。 |
| 23 | `geometric-distribution` | 幾何分布 | 公式テキスト §2.7.4<br>宮本テキスト 第6章 | 独立な成功確率 $p=0.20$ のベルヌーイ試行において、ちょうど4回目に初めて成功する確率 $(0.8)^3 \times 0.2 = 0.1024$ と平均試行回数（期待値 $1/p = 5.0$ 回）を算出。二項係数の不要性と無記憶性を解説。 |
| 24 | `type-1-type-2-errors-power` | 第1種・第2種の過誤と検出力 | 公式テキスト §4.2.4<br>CBT問題集 p.108, 122 | 片側検定における棄却限界値（100.658 mm）を導出し、真の母平均が $\mu_1=101.2$ にシフトした際の検出力 $1-\beta \approx 91.23\%$（第2種の過誤 $\beta \approx 8.77\%$）を算出。有意水準と検出力のトレードオフを解説。 |
| 25 | `fishers-three-principles-experiment` | フィッシャーの3原則 | 公式テキスト §3.2.1<br>CBT問題集 p.54 | 圃場の日照傾斜を例に、局所管理（ブロック化による系統誤差除去）、無作為化（系統的バイアスを期待値上で抑制）、反復（独立実験単位による実験誤差の評価と検出力確保）の各原則の役割を判定。観察研究との違いを解説。 |

制作情報は実施した工程だけを記録した。運営者による最終公開内容の確認、専門家査読、公開済みcommitは記載していない。

## 独立計算

実行: `uv run --with scipy python scripts/verify-toukei-batch4.py`（Python >= 3.12, SciPy 1.18.1+）。

```text
--- Q21: Laspeyres and Paasche Price Index ---
  Denom L: 16000, Numer L: 19700, I_L: 123.125 -> 123.1
  Denom P: 15500, Numer P: 19000, I_P: 122.581 -> 122.6
  Simple price ratio mean: 122.5

--- Q22: Chebyshev's Inequality ---
  k: 2.5, Lower bound: 0.8400 (84.0%)
  Tail bound: 0.1600, Normal prob: 0.9876

--- Q23: Geometric Distribution ---
  P(X=4): 0.1024, SciPy: 0.1024
  Mean: 5.0, Var: 20.0
  Distractor (shifted): 0.0819, Distractor (binom): 0.4096

--- Q24: Type I / II Errors and Power ---
  SE: 0.40, Critical limit: 100.658
  z under H1: -1.355, Power (1 - beta): 0.9123 (91.2%)
  Type II error (beta): 0.0877 (8.8%)

--- Q25: Fisher's Three Principles of Experimental Design ---
  [局所管理]: 均一なブロックに分割し、ブロック間の系統的変動を取り除いて実験誤差を縮小する
  [無作為化]: ブロック内の処理割り当てを乱数等で決め、未知の交絡因子の影響を偶然誤差に転化する
  [反復]: 同一処理を複数区画で繰り返し実施し、偶然誤差の大きさを正しく評価（残差分散を推定）する

==================================================
PASS: All 5 problems verified with SciPy and exact calculations
==================================================
```

## 技術検証

Windows、Node 24.14.1、Next.js 16.3.0、OpenNext 1.20.2、Wrangler 4.114.0。ビルド時だけダミー広告ID `ca-pub-0000000000000000` を設定し、本番配信物の更新は行っていない。

| 検証 | 結果 |
| --- | --- |
| `npm run lint` | 成功、エラー0・既存4警告 |
| `npm run build` | 成功、TypeScript検査と52静的ページ生成、全25問 |
| `npm run cf:build` | 成功。Windows非完全互換warningあり |
| `opennextjs-cloudflare populateCache local --env ""` | 成功、静的キャッシュ生成 |
| `wrangler deploy --dry-run --env=""` | 成功、102 assets、8,152.91 KiB / gzip 1,662.12 KiB。アップロードなし |
| `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3111` | Next.js localで全25問、本文、与件、計算、誤答、canonical、guide、出典、制作情報、価格表を確認 |
| 同スクリプト `http://127.0.0.1:8790` | Workers localでも同じ検証が全件成功 |
| sitemap | 42件、重複なし、`siteContent` のURL集合と一致 |
| 広告境界 | 問題ページはダミー広告ID、about/contact/privacy/weather/dashboard/ai-newsと不正problem/guide・一般404は広告なし |

## Codexレビュー指摘と対応内容（2026-09-05）

初回実装後にCodexによる監査レビューを実施し、【保留（P1指摘あり）】を受領した。以下のP1（4件）およびP2（3件）の全指摘に対し、厳密な是正と再検証を実施した。

### 指摘事項と是正対応一覧

| 区分 | 対象 | 指摘内容 | 是正対応 |
| :--- | :--- | :--- | :--- |
| **P1** | 問22〜25 出典URL | NIST参照URLが別内容ページを指していた（問22:歪度、問23:ガンマ分布、問24:信頼区間、問25:DOE手順） | 各問題の論点に合致する正確な一次資料へ差し替え。<br>・問22: NIST §7.2.6.1 `prc261.htm`（Bienaymé-Chebyshev rule）<br>・問23: SciPy公式 Tutorial `discrete_geom.html`（幾何分布）<br>・問24: NIST §7.1.3 `prc13.htm`（Significance levels and errors of the second kind）<br>・問25: NIST §5.3.3.2 `pri332.htm`（Randomized block designs）および §5.7 `pri7.htm`（DOE Glossary） |
| **P1** | 問21 物価指数解説 | 2時点の集計値のみから数量変動を「値上がり率差による代替」と過剰に断定していた | 2時点データと代替効果の識別限界に配慮し、「本問の集計値では $I_L > I_P$」「一般論として相対価格変化に伴う消費者の代替行動がある場合、基準年数量固定のラスパイレス指数は生計費指数に対して上方バイアスを持ちやすい」という統計局定義に整合する条件付き記述へ厳密化。 |
| **P1** | 問25 実験計画法解説 | 「不偏性を保証する」「未知の交絡を偶然誤差に転化する」「構造的に排除する」「因果効果を立証できる」「反復を行うことで初めて残差分散を推定できる」などの過剰な絶対的断定 | 「処理割付けとの系統的結びつきを断ち切り、期待値としての偏りを抑制して妥当な推論を可能にする（有限標本で完全に偏りがゼロになることを保証するわけではない）」「同一処理を複数の独立した実験単位に適用することで、偶然誤差の大きさを適切に評価し、効果推定の安定化と検出力向上を図る」等、因果推論・加法モデルの数理に即した表現へ是正。 |
| **P1** | 制作情報 実態整合 | `toukeiProblemBatch4Provenance` の役割表記が「Codex独自設計」となっており実態と乖離していた | 実態に基づき「Antigravityが問題設計・作成・SciPy検算し、Codexが学術レビュー・実装監査を実施」へ修正。`publishedAt`/`reviewedAt` はローカル原稿で指定日を保持しつつ、最終承認待ちの運用規約と完全に整合させた。 |
| **P2** | 検証スクリプト問25 | `verify-toukei-batch4.py` の問25検証が固定辞書表示のみで実質的アサートがなかった | `problem-data.ts` から問25のコード本文を抽出し、3原則（局所管理・無作為化・反復）の存在、区画配分（16区画/各8区画/4ブロック）、過剰断定ワード（「完全にゼロ」「保証する」「立証できる」等）の非含有、誤答3パターンの網羅性、NIST URLの正確性を厳格にアサートするコードへ全面改修。 |
| **P2** | 問22 不等号記号 | 設問の「$\le$」と途中式の「$<$」で不整合があった | 一般式 $P(\|X-\mu\| \ge k\sigma) \le 1/k^2$ の余事象 $P(\|X-\mu\| < k\sigma) \ge 1 - 1/k^2$ に対し、閉区間がこれを含む関係 $P(\|X-\mu\| \le k\sigma) \ge P(\|X-\mu\| < k\sigma) \ge 1 - 1/k^2$ を途中式・解説に明記し、式表記を統一。 |
| **P2** | 問24 解説の充実 | タイトルの過誤トレードオフおよび標本サイズ効果の解説が本文で不足していた | 標本サイズ $n$ 固定下での $\alpha$ と $\beta$ のトレードオフ、および $\alpha$ を維持したまま検出力 $1-\beta$ を向上させるには標本サイズ $n$ の拡大（標準誤差 $\sigma/\sqrt{n}$ の縮小）が不可欠である旨を解説文へ明記。 |

### 是正後の全検証結果

1. `uv run --with scipy python scripts/verify-toukei-batch4.py`: **ALL PASS**（全5問の精密計算、問25の実データパース・過剰表現排除・NIST URL整合を含む）
2. `npm run lint`: **0 errors**
3. `npm run build`: **52静的ページ生成（全25問SSG）成功**
4. `npm run cf:build`: **成功**
5. `npx opennextjs-cloudflare populateCache local --env ""`: **静的キャッシュ生成成功**
6. `npx wrangler deploy --dry-run --env=""`: **102 assets 正常、トラックBバインディング保持**
7. `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3111`: **全25問、本文、与件、計算、誤答、canonical、guide、出典、制作情報、広告境界、sitemap 42 URL ALL PASS**

## 続行: commit・push・Draft PR・Linux CI（2026-09-05）

ユーザーからの進行指示「OK 進んで」を受領し、以下を実行した。

1. **明示的ステージとコミット**: 対象6ファイルのみを明示的に stage し、commit `7c2c3e7` を作成。
2. **プッシュとDraft PR作成**: ブランチ `codex/issue-377-problems-batch-4` を `origin` へ push し、Draft [PR #12](https://github.com/kumakit/bearworks-portal/pull/12) を作成。
3. **Linux clean-checkout CI 通過**: [Linux CI Run 33957579768](https://github.com/kumakit/bearworks-portal/actions/runs/33957579768)（1分23秒）にて、Lint, Next.js build, Prefetch policy, Workers bundle, Staging bundle, Workers preview routes の全チェックが完全合格（PASS）した。

## 続行: 本番公開承認・merge・本番デプロイ・公開検証（2026-09-05）

ユーザーからの「本番公開へ進んで」を受領し、第4バッチの最終公開を完了した。

1. **制作情報・検証の確定**:
   - `lib/content-provenance.ts` の `toukeiProblemBatch4Provenance` を「運営者が公開内容を承認しました」の確定表記へ更新（commit `af374b1`）。
   - `scripts/verify-toukei-pages.mjs` のアサーションを公開承認版へ同期。
   - push 後、[Linux CI Run 33957786962](https://github.com/kumakit/bearworks-portal/actions/runs/33957786962)（1分11秒）にて全チェック通過を確認。
2. **PR #12 merge**:
   - PR #12 を ready化し、`main` へ merge（merge commit: `156368be0588636b1d1f0578632df378564db80f`）。ローカル `main` を pull して同期。
3. **ロールバック先の確保**:
   - デプロイ直前の本番 Worker Version `e4dd91ce-cf1e-4bca-8c57-9351762c5c81`（100%）をロールバック先として確保。
4. **本番ビルド & 静的キャッシュ組み込み**:
   - 本番広告ID `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-9560028085973137` を指定して `npm run cf:build` を実行。
   - `opennextjs-cloudflare populateCache local --env ""` で静的キャッシュを生成・組み込み。
   - Wrangler dry-run（102 assets、`TOUKEI_ORIGIN` バインド維持）を確認。
5. **本番デプロイ**:
   - `npx opennextjs-cloudflare deploy --env "" --keep-vars` を実行。
   - 公開 Worker Version ID: `7888ab5e-4be8-4db0-9e25-26d76eaad618`（配信割合: 100%）。
6. **本番スモークテスト（全件合格・100% GREEN）**:
   - **トラックA**:
     - `https://bearworks.uk/toukei/problems`: HTTP 200、全25問のリンク存在、本番広告ID掲載。
     - 全25問（問1〜問25）: HTTP 200、本文、与件、解法、誤答、canonical、参照リンク、本番広告ID掲載。
     - 第4バッチ新規5問（問21〜問25）: ラスパイレス・パーシェ指数（123.1 vs 122.6）、チェビシェフ不等式（84.0%）、幾何分布（0.1024 / 5.0）、過誤と検出力（100.658 mm / 91.23%）、フィッシャーの3原則（局所管理・無作為化・反復）、承認済み制作情報、NIST/SciPy公式URL（prc261.htm, discrete_geom.html, prc13.htm, pri332.htm, pri7.htm）をすべて確認。
     - `https://bearworks.uk/sitemap.xml`: 全42 URL（重複なし、全25問含む）。
     - 非広告6ページ（`/about`, `/contact`, `/privacy`, `/weather`, `/dashboard`, `/ai-news`）および不正/404ルートに広告漏れなし。
     - 認証保護（`/dashboard`）: Cloudflare Accessへ 302 リダイレクト、`Cache-Control: no-store` を維持。
   - **トラックB（並行稼働プロキシ）**:
     - サブパスプロキシ（`/toukei/drill`, `/toukei/exam`, `/toukei/cheatsheet`）: HTTP 200、完全非広告維持。
     - 旧オリジン（`https://toukei.bearworks.uk/drill` 等）: 独立並行稼働を確認。



