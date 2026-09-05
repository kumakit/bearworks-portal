# Issue #377 トラックA 第3バッチ 実装・ローカル検証

## 結果と境界

問16〜20の5問を追加し、オリジナル解説例題は15問から20問、sitemapは32 URLから37 URLになった。独立計算、lint、Next.js/OpenNext build、Wrangler dry-run、Next.jsとWorkersのローカル配信検証は成功した。これは未公開のローカル検証結果であり、最終公開内容は運営者の承認待ちである。

ブランチは `codex/issue-377-problems-batch-3`。fetchした最新 `origin/main` `85f282f9caf062ac89b72a75cad64e77b7776644` から作成した。この基点はPR #10のmerge commit `16c1c9a`を含む。初回報告時点ではcommit、push、PR作成、Issue更新、本番deploy、Cloudflare設定変更、AdSense操作を行っていない。Track Bの `docs/task/issue-377-toukei-subpath/**` は変更していない。

## 差分

| ファイル | 内容 |
| --- | --- |
| `app/(monetized)/toukei/problems/problem-data.ts` | 第3バッチ5問と制作情報参照を追加 |
| `app/(monetized)/toukei/problems/[slug]/page.tsx` | 観測表と解答表が同時にある問題で、両方を適切な位置に表示 |
| `lib/content-provenance.ts` | 第3バッチ固有の制作・検証情報を、最終公開承認待ちとして追加 |
| `scripts/verify-toukei-batch3.py` | SciPyによる5問の独立計算と数値誤答経路の検証を追加 |
| `scripts/verify-toukei-pages.mjs` | 20問・37 URL・第3バッチ制作情報へ更新し、可変行数の解答表も検証 |
| `docs/task/issue-377/batch-3-task.md` | ローカル工程と残工程を記録 |
| 本ファイル | 修正理由、検証結果、公開境界を記録 |

`app/site-content.ts` は問題配列からsitemap対象を生成するため変更不要。問題詳細routeの静的パラメータ生成は変更不要だったが、問18は観測表と計算表を同時に持つため、共通表コンポーネントで観測表を問題条件の後、計算表を解答の後に表示するよう修正した。依存関係、広告layout、既存15問のデータ、Track B、Cloudflare設定は変更していない。`publishedAt` と `reviewedAt` は受領原稿の指定日 `2026-09-05` をローカル原稿に保持したが、公開工程で実際の承認日・公開日に合わせて再確認する。

## 原稿監査と修正

統計検定2級の公式ページで、2標本の母平均・母分散の検定、カイ二乗適合度検定、母分散の区間推定、線形モデルが出題範囲に含まれることを確認した。各問題はNISTまたはstatsmodels公式資料へリンクした。Codexが原稿修正と独立検算を担当し、Lunaが既存問題の型、制作情報、検証規約を読み取り専用で監査した。

| 問 | 判断と採用内容 |
| --- | --- |
| 16 等分散2標本t検定 | 合併不偏分散24.00、標準誤差2.00、t=2.50、自由度23、両側p=0.019994…。前提条件、絶対値による両側判定、標本平均差5.0 MPa、因果を含まない結論を明示した。 |
| 17 2母分散のF検定 | F=3.00、自由度(9,15)、上側2.5%点3.122712、両側p=0.058361…。固定したA/Bの分散比として定義し、棄却しないことは等分散の証明ではないと修正した。「母分散が正規分布」という誤記を「母集団」に直し、非正規時の候補をルビーン検定・ブラウン＝フォーサイス検定とした。 |
| 18 適合度検定 | 期待度数90/30/30/10、χ²=40/9、p=0.217300…。棄却しない結果から理論比を真と断定しない表現へ修正。観測度数を分母にする誤答値は原稿の4.67ではなく7.00と訂正し、小期待度数時の代替を適合度検定に合う説明へ変更した。 |
| 19 調整済み決定係数 | R*²=0.64。定数項を引き忘れた誤答は原稿の0.625ではなく0.657143…と訂正した。残差診断や外部予測評価を伴わなければモデル妥当性を保証しないことを補足し、公式実装定義が掲載されたstatsmodels資料へ参照を変更した。 |
| 20 母分散の区間推定 | カイ二乗点6.262138/27.488393、母分散区間13.642122〜59.883703 mm²、母標準偏差区間3.693524〜7.738456 mm。上側確率記法を明記し、逆数で不等号が反転する理由と頻度論上の区間解釈を追加した。 |

制作情報は実施した工程だけを記録した。運営者による最終公開内容の確認、専門家査読、修正後原稿の外部モデル再レビュー、公開済みcommitは記載していない。

参照確認: [統計検定2級公式範囲](https://www.toukei-kentei.jp/grade/grade2/)、[NIST 2母平均](https://www.itl.nist.gov/div898/handbook/prc/section3/prc31.htm)、[NIST 2母分散F検定](https://www.itl.nist.gov/div898/handbook/eda/section3/eda359.htm)、[NIST 適合度検定](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35f.htm)、[statsmodels 調整済み決定係数](https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.OLSResults.rsquared_adj.html)、[NIST 母分散区間](https://www.itl.nist.gov/div898/handbook/eda/section3/eda358.htm)。

## 独立計算

実行: `uv run --with scipy python scripts/verify-toukei-batch3.py`。実行時に解決されたSciPyは1.18.1。SciPyの分布関数から臨界値とp値を別計算し、本文の四則演算、各誤答経路、区間端点もassertした。

```text
Q16: pooled variance=24.00, SE=2.00, t=2.50, critical=2.068658, p=0.01999412
Q17: F=3.00, lower/upper critical=[0.265297, 3.122712], p(two-sided)=0.05836140
Q18: terms=[1.111111, 0.833333, 0.0, 2.5], chi2=4.44444444,
     p=0.21729957, critical=7.814728, wrong-denominator=7.00
Q19: adjusted R2=0.640, reversed=0.750, forgot-intercept=0.657143
Q20: chi2 quantiles=[6.262138, 27.488393],
     variance CI=[13.642122, 59.883703], SD CI=[3.693524, 7.738456]
PASS: five problems and numeric distractor paths (SciPy 1.18.1)
```

## 技術検証

Windows、Node 24.14.1、Next.js 16.3.0、OpenNext 1.20.2、Wrangler 4.114.0。ビルド時だけダミー広告ID `ca-pub-0000000000000000` を設定し、設定ファイルや本番配信物は更新していない。

| 検証 | 結果 |
| --- | --- |
| `npm run lint` | 成功、エラー0・警告0 |
| `npm run build` | 成功、型検査と47静的ページ生成、例題20問 |
| `npm run cf:build` | 成功。Windows非完全互換warningあり |
| `opennextjs-cloudflare populateCache local --env ""` | 成功、Workers静的アセットキャッシュを生成 |
| `wrangler deploy --dry-run --env=""` | 成功、97 assets、8,041.36 KiB / gzip 1,642.67 KiB。アップロードなし |
| `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3110` | Next.js localで全20問、本文、与件、計算、誤答、canonical、guide、出典、制作情報、表を確認 |
| 同スクリプト `http://127.0.0.1:8789` | Workers localでも同じ検証が成功 |
| sitemap | 37件、重複なし、`siteContent` のURL集合と一致 |
| 広告境界 | 問題ページはダミー広告ID、about/contact/privacy/weather/dashboard/ai-newsと不正problem/guide・一般404は広告なし |
| 表 | 問18の観測度数表と5行の解答表を両方表示し、各caption、全列・セル、行列見出しscopeを確認 |
| ブラウザ確認 | 問18をローカルのin-app browserで表示し、タイトル、問題文、条件、解法、計算表、結論、誤答、出典、承認待ち制作情報、関連リンクの描画とアクセシビリティ構造を確認。最終検証では観測表も問題側へ追加した |

最初のSciPy実行で、受領原稿のt検定p値想定とF検定p値想定が精密値の丸めに一致しないことを検出し、0.0200と0.0584へ修正後に全assertが成功した。OpenNextとページ検証の最初のサンドボックス実行はユーザーディレクトリへの読み書き制限で失敗し、同じコマンドを権限付きで再実行して成功した。アプリコードや依存関係を変えて回避していない。

## 次の工程

添付指示に従い、ローカル実装・検証で停止する。ユーザーが続行を承認した後、対象7ファイルだけをcommit・pushし、PRとLinux clean-checkout CIで20問・37 URL・広告境界を再検証する。公開する場合は、最終内容、実際の日付、制作情報の承認表記、本番広告IDでのbuild、merge、本番配信確認を別のゲートとして扱う。
