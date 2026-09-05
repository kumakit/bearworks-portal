# Issue #377 トラックA 最終第5バッチ 実装・ローカル検証

## 結果と境界

問26〜30の5問を追加し、オリジナル解説例題は25問から30問、sitemapは42 URLから47 URLになった。これにより、統計検定2級シラバスの主要出題領域（記述統計、確率分布、統計的推測、分散分析、回帰分析、実験計画、時系列分析、経済指数）を網羅する全30問の構成が完成した。

参考書・問題集（公式テキスト『統計学基礎』、宮本『この1冊で合格！』、CBT対応版公式問題集）を精査し、既存25問と一切被らない重要未出題テーマ（2つの母比率の差の検定、指数分布、時系列分析、二元配置分散分析、重回帰診断とダミー変数）を選定・設計した。

独立数値検算（Python 3.12, SciPy 1.18.1+）、lint は成功。これは未公開のローカル検証結果であり、最終公開内容は運営者の承認待ちである。

ブランチは `codex/issue-377-problems-batch-5`。最新 `origin/main`（コミット `004c4a9`）から作成した。初回ローカル完了報告時点では commit、push、PR作成、Issue更新、本番deploy、Cloudflare設定変更、AdSense操作を行っていない。トラックBのプロキシルーティング（`workers/router.ts`）および設定は完全に保持されている。

## 差分

| ファイル | 内容 |
| --- | --- |
| `app/(monetized)/toukei/problems/problem-data.ts` | 第5バッチ5問（問26〜問30）と制作情報参照を追加 |
| `lib/content-provenance.ts` | 第5バッチ固有の制作・検証情報を、最終公開承認待ちとして追加 |
| `scripts/verify-toukei-batch5.py` | SciPyによる5問の独立計算と数値誤答経路の検証スクリプトを追加 |
| `scripts/verify-toukei-pages.mjs` | 30問・47 URL・第5バッチ制作情報・二元配置分散分析表の検証へ更新 |
| `docs/task/issue-377/batch-5-task.md` | ローカル工程と残工程を記録 |
| 本ファイル | 選定理由、設計根拠、検算結果、公開境界を記録 |

`app/site-content.ts` は問題配列からsitemap対象を動的に生成するため変更不要。依存関係、広告layout、既存25問のデータ、トラックB、Cloudflare設定は変更していない。

## 参考書・問題集からの選定根拠と設計

統計検定2級公式出題範囲および参考資料に基づき、既存25問と重複しない5分野を厳選した。

| 問 | スラッグ | 出題テーマ | 参考資料対応 | 設計と統計的ポイント |
| :--- | :--- | :--- | :--- | :--- |
| 26 | `two-sample-proportion-test` | 2つの母比率の差の検定 | 公式テキスト §4.5.3<br>CBT問題集 p.102 | A/Bテスト（$n_A=500, x_A=40$ vs $n_B=500, x_B=65$）において、帰無仮説 $H_0: p_A=p_B$ の下でプールされた比率 $\hat{p} = 105/1000 = 0.105$ と標準誤差 $SE \approx 0.019388$ を導出し、検定統計量 $z \approx 2.58$（$p \approx 0.0099$）を算出。信頼区間算出時の非プール分散との区別を解説。 |
| 27 | `exponential-distribution-waiting-time` | 指数分布 | 公式テキスト §2.9.2<br>宮本テキスト 第8章 | 単位時間あたり平均発生率 $\lambda=6.0$ 回/時間のポアソン過程における待ち時間 $X$ をモデル化。平均待ち時間 $E(X)=1/\lambda=10.0$ 分、15分以上待たされる確率 $P(X \ge 0.25) = e^{-1.5} \approx 0.2231$、および過去の待ち時間に影響されない無記憶性を解説。 |
| 28 | `time-series-moving-average-autocorrelation` | 時系列データの分析 | 公式テキスト §1.7.1<br>CBT問題集 p.44 | 6日間の日次データから奇数項（$k=3$）の中心化移動平均（$MA_2=40.0, MA_3=42.0$）を算出してトレンドを平滑化。全期間平均 $\bar{y}=45.0$ と全分散 $SS=630.0$ からラグ1の自己相関係数 $r_1 = 63.0/630.0 = 0.100$ を導出。 |
| 29 | `two-way-anova-interaction` | 二元配置分散分析 | 公式テキスト §5.2.2<br>CBT問題集 p.140 | 2×2要因（教材2水準×時間2水準、各セル $n=5$, 総数 $N=20$）の釣合い型二元配置分散分析。$SS_A=180, SS_B=300, SS_{AB}=90, SS_E=240$ から自由度（$df_{AB}=1, df_E=16$）、平均平方、F比（$F_{AB}=6.00 > F_{0.05}=4.49$）を導出。交互作用有意時の主効果単独評価の限界と相乗・条件依存効果の解釈を解説。 |
| 30 | `multiple-regression-multicollinearity-dummy` | 重回帰分析の診断 | 公式テキスト §5.3.3<br>宮本テキスト 第15章 | 説明変数間の相関 $r=0.80$（$R_1^2=0.64$）から分散拡大係数 $VIF = 1/(1-0.64) \approx 2.78$ と標準誤差拡大倍率 $\sqrt{2.78} \approx 1.67$ 倍を算出。3カテゴリーの質的変数に対する $k-1=2$ 個のダミー変数設定と、定数項併用時の完全多重共線性（ダミー変数の罠）を解説。 |

制作情報は実施した工程だけを記録した。運営者による最終公開内容の確認、専門家査読、公開済みcommitは記載していない。

## 独立計算

実行: `uv run --with scipy python scripts/verify-toukei-batch5.py`（Python >= 3.12, SciPy 1.18.1+）。

```text
========================================
Running Toukei Problem Batch 5 Verification
========================================
--- Q26: Two-Sample Proportion Test ---
  pA: 0.080, pB: 0.130, Pooled p: 0.105
  SE: 0.019388, z: 2.5789 -> 2.58
  p-value: 0.0099, Unpooled z: 2.5875

--- Q27: Exponential Distribution & Poisson Process ---
  Mean: 0.167 h (10.0 min)
  P(X >= 15min): 0.2231 (22.3%), SciPy: 0.2231
  Conditional P(X >= 10+15 | X >= 10): 0.2231
  Distractor CDF P(X <= 15min): 0.7769

--- Q28: Time Series Moving Average & Autocorrelation ---
  Mean: 45.0, MA(3): [40.0, 42.0, 46.0, 50.0]
  Deviations: [-15.0, -3.0, 3.0, -9.0, 9.0, 15.0]
  SS_total: 630.0, Lag-1 cross-sum: 63.0
  r1 (Autocorrelation lag 1): 0.100

--- Q29: Two-Way ANOVA & Interaction ---
  df: A=1, B=1, AB=1, Error=16, Total=19
  MS: A=180.0, B=300.0, AB=90.0, Error=15.0
  F: A=12.00, B=20.00, AB=6.00
  F_crit(1, 16): 4.494, p_AB: 0.0262

--- Q30: Multiple Regression Diagnostics (VIF & Dummy Variables) ---
  r: 0.80, R^2: 0.64
  VIF: 2.7778 -> 2.78 (SE multiplier: 1.6667 -> 1.67)
  Distractor VIF (using r): 5.0
  Categories: 3, Required Dummies: 2

--- Verifying Content in problem-data.ts ---
  PASS: All Batch 5 content requirements, NIST URLs, and terms verified!

========================================
ALL BATCH 5 TESTS PASSED SUCCESSFULLY!
========================================
```

## ローカル検証結果

1. `uv run --with scipy python scripts/verify-toukei-batch5.py`: **ALL PASS**（5問の統計数値計算・SciPy検算・誤答経路・NIST URL・過剰断定なしの全項目合格）
2. `npm run lint`: **PASS**（0 errors, 4 warnings: 既存dashboard等のwarningのみ）
3. `$env:NEXT_PUBLIC_ADSENSE_CLIENT_ID="ca-pub-0000000000000000"; npm run build`: **PASS**（57静的ページ生成、全30問のSSG生成確認）
4. `npm run cf:build`: **PASS**（OpenNext Cloudflare bundle生成）
5. `npx opennextjs-cloudflare populateCache local --env ""`: **PASS**（静的キャッシュ投入完了）
6. `npx wrangler deploy --dry-run --env=""`: **PASS**（107 assets、`env.ASSETS` および `env.TOUKEI_ORIGIN` バインド維持確認＝トラックB非破壊）
## Codex監査レビュー指摘と是正対応（2026-09-05）

Codexによる学術レビュー・実装監査を受領し、指摘されたP1事項（3件）およびP2事項（4件）をすべて是正対応した。

### 1. P1指摘事項の是正
- **問28の誤答値と計算経路の不整合**:
  - 指摘: 5項分の偏差平方和で割る誤答値が 0.120 と記載されていたが、前5項・後5項いずれも $\sum (y_t - \bar{y})^2 = 405.0$ であり、$63.0 / 405.0 \approx 0.156$ となる。
  - 是正: 誤答値を `r_1 = 0.156` へ修正し、理由欄に「分母の偏差平方和を6項の合計 630.0 ではなく、ラグ1の積和に合わせた5項のみの平方和 405.0（225 + 9 + 9 + 81 + 81 = 405.0）を用いて割ってしまう誤り（63.0 / 405.0 ≒ 0.156）」と明記。
- **問30のNIST出典（pmd44.htm）の不一致**:
  - 指摘: `pmd44.htm` は残差分析・モデル検証であり、VIF公式やダミー変数の罠が直接掲載されていない。
  - 是正: VIFの定義・公式を解説する [Penn State STAT 462 Lesson 10.7](https://online.stat.psu.edu/stat462/node/180/)、および1カテゴリーを落として完全多重共線性を回避する手法を解説する [scikit-learn OneHotEncoder](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html) へ出典URLを差し替え。
- **問29のF検定に必要なモデル前提の不足**:
  - 指摘: 無作為割付けと釣合い型に加え、通常の二元配置ANOVAによる厳密なF検定に必要な「独立性・正規性・等分散性」が問題文に明示されていない。
  - 是正: 問題文に「各セルの誤差は互いに独立な正規分布に従い、分散は等しい（等分散性）と仮定する。」を追加。

### 2. P2指摘事項の是正
- **問26の独立性と無作為割付けの明記**:
  - 問題文に「利用者をデザインA・Bへ無作為に割り付け、各利用者は一方だけを閲覧し、購入結果は互いに独立とする。」を明記。
- **問28の解釈の厳密化**:
  - 6観測の小標本から母過程の系列相関を過剰に一般化しないよう、「この標本で計算されたラグ1自己相関は+0.10です（なお、6観測の小標本のみから母過程の系列相関の有無を一般化して判断することはできません）。」へ表現を厳密化。
- **問29の「平均平方（不偏分散）」の表現修正**:
  - 要因・交互作用の平均平方を一律に不偏分散と呼ぶのをやめ、「各平方和を自由度で除して平均平方（MS）を求めます（なお誤差平均平方 MS_E は共通誤差分散の推定量に相当します）。」と修正。
- **EOF余分空行の削除**:
  - `problem-data.ts` 末尾の空行を削除し、`git diff --check origin/main` がエラーなし（exit code 0）であることを確認。
- **検証スクリプトの強化**:
  - `scripts/verify-toukei-batch5.py` に、問28の誤答値計算（$63.0 / 405.0 \approx 0.156$）、問30の正確な出典URL（Penn State STAT 462, scikit-learn OneHotEncoder）、問29の前提文言、問26の独立割付け文言のアサーションを追加。

### 3. 是正後の再検証結果
1. `uv run --with scipy python scripts/verify-toukei-batch5.py`: **ALL PASS**（5問の統計数値計算・誤答経路・新出典・前提文言の全項目完全合格）
2. `npm run lint`: **PASS**（0 errors）
3. `git diff --check origin/main`: **PASS**（whitespaceエラー 0 件）
4. `$env:NEXT_PUBLIC_ADSENSE_CLIENT_ID="ca-pub-0000000000000000"; npm run build`: **PASS**（57静的ページ生成、全30問SSG確認）
5. `npm run cf:build`: **PASS**（OpenNext Cloudflare bundle生成）
6. `npx opennextjs-cloudflare populateCache local --env ""`: **PASS**（静的キャッシュ投入完了）
7. `npx wrangler deploy --dry-run --env=""`: **PASS**（107 assets、`env.TOUKEI_ORIGIN` バインド維持確認＝トラックB非破壊）
8. `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3111`: **ALL PASS**（全30問の静的配信、本文・与件・解法・誤答・canonical・ガイドリンク・新出典URL・制作情報承認待ち表示、非広告ページ6件、無効/404ルート3件、`sitemap.xml` 47件ユニークURL完全一致）

