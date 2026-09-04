# Issue #377 トラックA 第2バッチ 実装・ローカル検証

## 結果と境界

問11〜15の5問を追加し、全文例題は15問、sitemapは32URLになった。独立数値検証、lint、Next.js/OpenNext build、Wrangler dry-run、Next.jsとWorkersのローカル全15問配信・広告境界検証は成功。これは未公開のローカル検証結果である。

ブランチ: `codex/issue-377-problems-batch-2`。fetchした最新origin/main `943150a72fb240c70fb251dc1445814dae8813bf` から作成。初回ローカル完了報告時点ではcommit・push・PR作成・Issue更新・本番deploy・AdSense操作は行っていない。既存未追跡の `docs/task/issue-377-toukei-subpath/` は保持し、本作業に含めない。

## 差分

| ファイル | 内容 |
| --- | --- |
| `app/(monetized)/toukei/problems/problem-data.ts` | 5問、batch2制作情報の参照、任意のsolutionTable型とANOVA表を追加 |
| `app/(monetized)/toukei/problems/[slug]/page.tsx` | 既存人数表と新しい解答表で描画を共用し、数式内の改行を保持 |
| `lib/content-provenance.ts` | 現行型に合わせた第2バッチ固有の制作情報。最終公開内容は承認待ち |
| `scripts/verify-toukei-batch2.py` | 構成した観測値・確率分布・十進演算による独立検算 |
| `scripts/verify-toukei-pages.mjs` | 15問・32URLへ更新。与件、ANOVA表、batch2制作情報の照合を追加 |
| `docs/task/issue-377/batch-2-implementation_plan.md` / `batch-2-task.md` | 第2バッチの計画・完了一覧 |
| 本ファイル | 修正理由・検証結果・未実施工程 |

`site-content.ts` は問題配列から自動的にsitemapを生成するため変更不要。例題一覧の更新日は既に2026-09-04であり、日付だけの変更も不要。アプリ・インフラの依存関係、広告layout、dynamicParams=false、静的パラメータ生成、既存10問のデータは維持した。HEADの問題配列と実装後配列の先頭10問を全フィールドで比較し、一致を確認した。

## 受領原稿からの修正・レビュー採否

ユーザーからGeminiで独立検算と教育内容レビュー済みとの説明付き原稿を受領した。モデル版や検算ログを独立に確認したという記載はしない。Codexが修正・実装と独立検算を担当し、Lunaが読み取り専用で原稿と実装を点検した。Geminiが修正後原稿を再レビューしたことにはしない。

| 問 | 判断と採用内容 |
| --- | --- |
| 11 相関係数 | r=0.80。分散と共分散の分母をn−1に統一。元の平均より右下の追加点という条件を設問に明示したのでrが低下すると判断できるが、元の平均・追加点の具体値がないため低下幅・符号は不定と修正。更新偏差和式、散布図確認、相関と因果の違いを説明。LunaのP1を採用。 |
| 12 和と差の分散 | E=50 mL、V=100 mL²、SD=10 mL。一般式の共分散項、独立性は期待値の線形性には不要であること、容量差Wと実際に残る非負の空き容量を区別。 |
| 13 ポアソン | 指定近似e^-2=0.1353では0.4059が正解。精密計算0.4060058497…を丸めた0.4060とは別計算として明記。原稿の0.4059≒0.4060という説明を修正。一定発生率・非重複区間の独立性とλの観測時間を補足。LunaのP1を採用。 |
| 14 母比率区間 | p̂=.64、SE=.024、区間[.59296,.68704]。全員回答、独立ベルヌーイ近似、小さい抽出率、256/144の十分な件数を明示。Wald型の被覆は約95%であり厳密保証ではないこと、非標本誤差を補正しないことを説明。 |
| 15 ANOVA | 独立・正規・等分散・無作為割付、H₀/H₁を追加。MS_Wと帰無仮説下のMS_Bの意味を区別。表を要求する設問に対応して全体SS=156、df=14を含む完成表を実装。全体検定の棄却と個別ペアの検定を区別。LunaのP1/P2を採用。 |

制作情報は既存ContentProvenance型へ対応し、受領原稿のauthorRole等をそのまま追加していない。架空の専門家査読、Analytics連携、未承認の公開完了表記を追加していない。publishedAt/reviewedAtは指定日の2026-09-04をローカル原稿に設定しているが、公開日・承認表記は公開工程で再確定が必要。

Lunaによる修正後の最終監査では新たなP1阻害事項なし。公開承認後のprovenanceとページ検証期待値の切替は、今回未実施で正しい残工程と確認した。

参照確認: [統計検定2級公式範囲](https://www.toukei-kentei.jp/grade/grade2/)、[NIST Poisson](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm)、[NIST 母比率の区間](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm)、[NIST ANOVA表](https://www.itl.nist.gov/div898/handbook/prc/section4/prc433.htm)。後者3資料は対応する例題の参照リンクにも追加した。

## 独立計算

実行: `uv run scripts/verify-toukei-batch2.py`。Python>=3.12、SciPy1.16.1固定。問11は指定標本共分散を満たす10点を構成し、問12は独立な2点分布の全組合せを列挙。問15は指定平方和を満たす3群の観測値を構成して `scipy.stats.f_oneway` で検算した。構成データは説明用であり、実測値ではない。

```text
Q11: r=0.80; illustrative new r=0.1948898350 / -0.7867364712
Q12: E=50 mL, V=100 mL^2, SD=10 mL
Q13: prescribed=0.4059, precise=0.4060058497, rounded=0.4060
Q14: SE=0.024, margin=0.04704, CI=[0.59296, 0.68704]
Q15: SS=84/72/156, df=2/12/14, MS=42/6,
     F=7.00, p=0.00966601, critical=3.885294
PASS: five problems and numeric distractor paths (SciPy 1.16.1)
```

## 技術検証

Windows、Node24.14.1、Next16.3.0、OpenNext1.20.2、Wrangler4.114.0。ビルド時の広告IDはダミーをプロセス内だけに設定し、本番配信物の更新は行っていない。

| 検証 | 結果 |
| --- | --- |
| `npm run lint` | 成功、エラー0・既存4警告 |
| `npm run build` | 成功、型検査・42静的ページ生成、例題15問 |
| `npm run cf:build` | 成功、Windows非完全互換warningあり |
| `opennextjs-cloudflare populateCache local --env ""` | ローカル用静的キャッシュを組み込み、成功 |
| `wrangler deploy --dry-run --env ""` | 成功、92 assets、7,939.96 KiB / gzip 1,627.71 KiB。アップロードなし |
| `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3108` | Next.js: 全15問200、static manifest、問題文/与件/解法/誤答/canonical/関連guide/参照/ダミー広告ID一致 |
| 同スクリプト `http://127.0.0.1:8789` | Workers local: 同じ検証が全件成功 |
| sitemap | 32件・重複なし、siteContentのURL集合と一致 |
| 広告境界 | about/contact/privacy/weather/dashboard/ai-newsは広告なし。不正problem/guideと一般404も広告なし |
| 表と制作情報 | 問7人数表と問15ANOVA表のcaption/列/セル/見出しscopeを確認。新5問の承認待ち・旧公開証跡の混入なしを確認 |
| 画面確認 | ANOVA表を通常幅と390×844で確認。狭い画面では表内を横スクロールしF値7.00まで閲覧可能。viewport overrideは解除済み |
| 既存10問 | 実データの全フィールドがHEADと一致 |
| `git diff --check` | 成功、LF/CRLF変換予告のみ |

初回buildでは追加配列の区切り不足を検出し、修正後に再build成功。初回lintは今回使った一時取り込み用.cjsファイルが既存Next ESLint設定の対象拡張子外であり、全体ルールのplugin解決に失敗した。不要となった当該一時ファイルだけを削除して成功した。ESLint設定と依存関係を変えてエラーを回避していない。

第1バッチ時にWindowsローカルWorkersで404が観測されたが、今回は静的キャッシュを明示的に組み込んだ状態で全件成功した。過去の404の原因をこれだけで断定しない。ローカル成功をLinux clean-checkout CIや本番配信確認の代替とはしない。

## 次の工程

添付指示に従いローカル実装で停止する。push承認後に対象8ファイルのcommit・push・PR・Linux CIへ進む。公開する場合は最終内容の承認と日付・provenance・検証スクリプトの承認待ちチェックの更新、本番IDでの再build、本番公開確認を別途行う。

## 続行: commit・push・draft PR・Linux CI

上記のローカル完了報告後、ユーザーから2026-09-04に「続けてください」を受領し、次工程のcommit・push・draft PR・Linux CIまで進める。Lunaには対象8ファイルと既存CIの整合性・公開記録の機密混入を読み取り専用で再点検させ、Codexが全差分・対象範囲を確認する。remote mainは943150aのままで変更なし。

対象はこの記録を含む上表の8ファイル。生成物・認証関連ファイル・未追跡TrackB計画は含めない。Linux上で全15問のHTTP 200・本文・canonical・広告・参照・表・sitemap32・非広告/404境界を検証する。CIの検証対象commit、run URL、最終結果は対応するPRの本文とChecksへ記録する。最終公開内容の承認待ち表示を維持し、merge・本番deploy・Issue更新・AdSense操作は行わない。

## 続行: 公開承認（2026-09-04）

実装commit `e90ec3266b51db2693e4d4964b6ee68a0e9a4957` をpushし、draft [PR #10](https://github.com/kumakit/bearworks-portal/pull/10) を作成。[Linux CI 33867647777](https://github.com/kumakit/bearworks-portal/actions/runs/33867647777) は全項目成功し、新旧15問・sitemap32・広告境界のPASSログを確認した。

その後ユーザーから「OK公開までお願い」を受領し、最終内容・公開日2026-09-04・merge・本番deployを承認された。上記の公開保留は各工程時点の記録である。第2バッチの公開日/確認日は指定日のまま、provenanceとページ検証の承認表記を確定し、最終版のLinux CIを再実行する。

本番は既存 `bearworks-portal` の配信物更新とする。直前version、Route、binding名/種別、Pages設定、公開HTTP baselineを記録し、公開ads.txtの本番広告IDでbuildする。OpenNext公式deployで静的キャッシュを組み込み、既存変数/secretを保持。DNS・Access・Pages・staging設定は変更しない。全15問、sitemap32、広告/404境界、ads.txt、Access 302/no-storeを直後に確認する。意図しない404、広告漏れ、Access迂回、継続5xx、10分以内にsmoke完了不可の場合は直前versionへ戻す。最終CIと公開version・結果はPR #10に追記し、記録の更新だけで再deployを繰り返さない。
