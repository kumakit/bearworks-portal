# Issue #377 トラックA 第1バッチ 実装・検証結果

## 結果

2026-09-04、全文公開例題を5問から10問に拡充した。新5問の前提・手法選択・途中式・結論解釈・誤答分析・参照資料と、バッチ固有の制作情報を追加した。Next.jsで全10問の配信・静的生成・広告境界とsitemap 27URLを確認済み。

ブランチ: `codex/issue-377-problems-batch-1`。開始点はfetch後の `origin/main` = `74beb15ed8f3b5cb2acdfe6c0c349580da107165`。commit・push・PR作成・CI起動・Issue更新・デプロイ・AdSense再申請は行っていない。既存未追跡 `docs/task/issue-377-toukei-subpath/` は保持した。

## 実装

| 問 | Slug | 内容と修正 |
| --- | --- | --- |
| 6 | linear-transformation | 摂氏→華氏の平均68.0、分散51.84、SD7.2。分散の二乗単位、シフトと散布度の説明を追加。 |
| 7 | bayes-theorem-screening | 陽性適中率2/13=15.4%。10,000人の期待人数表、感度との条件の向きの違い、有病率の用語を整理。 |
| 8 | binomial-normal-approximation | 指定された連続修正なし・z=1.67への丸めで4.75%。誤答値と説明の矛盾を修正し、近似の限界を説明。 |
| 9 | sample-proportion-distribution | E=0.5、SE=0.0125。独立ベルヌーイ近似と有限母集団補正の条件、1.25パーセントポイント、nを4倍にした場合を補足。 |
| 10 | paired-t-test | t=3.794733、df=9、片側p=0.002126。差の独立性・正規性、事前の片側指定、因果効果を断定しない結論を明記。 |

制作情報は現行 `ContentProvenance` 型に合わせた。原稿へのGeminiレビュー、Codexによる修正・独立検算、Luna監査を区別し、旧5問の公開証跡は新5問へ流用していない。最終公開内容の承認日は未確定と表示する。専門家査読やAnalytics連携の記載は追加していない。

新規人数表にはcaptionと列・行見出しを付与し、狭い幅では表内で横スクロールする。既存5問の本文は維持し、品質点検と改善候補を [レビュー採否](20260904_issue%23377_plan_review.md) に記録した。

## 独立検算

再現: `uv run scripts/verify-toukei-batch1.py`（Python >=3.12、SciPy 1.16.1固定）。計算方法は本文の転記だけでなく、問6は7観測の直接変換、問7は人数表、問8〜10は確率分布ライブラリのモーメント・上側確率・分位点を使った。

```text
Q6: mean=68.00, variance=51.84, SD=7.20
Q7: P(positive)=0.0585, posterior=2/13=15.4%
Q8: mu=40, variance=36, z=1.666667, table tail=0.047460
    unrounded normal=0.047790
    continuity-corrected=0.056673
    exact binomial=0.060097
    Wrong variance denominator: z=0.277778, rounded-table tail=0.389739
Q9: mean=0.50, variance=0.00015625, SE=0.0125, n=6400 SE=0.00625
Q10: SE=1.581139, t=3.794733, df=9, one-sided p=0.002126, critical=1.833113
PASS: all 5 problems and numeric distractor paths (SciPy 1.16.1)
```

問8の4.75%は設問で指定された近似手順の答えで、厳密な二項確率約6.01%と一致するという意味ではない。本文でも区別した。

## ビルド・配信検証

環境: Windows、Node.js 24.14.1、Next.js 16.3.0、OpenNext Cloudflare 1.20.2、Wrangler 4.114.0。広告検証用ビルド変数 `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0000000000000000` はプロセス内だけに設定した。設定ファイルへの永続化や実広告の配信は行っていない。

| 検証 | 結果 |
| --- | --- |
| `npm run lint` | 成功。エラー0、既存4警告（toukeiのimg、dashboard系3箇所のeffect）。 |
| `npm run build` | 成功。Turbopack/TypeScript/37静的ページ生成。全10例題のmanifestエントリを確認。 |
| `npm run cf:build` | 成功。最終用語・mobile表示修正後も再生成。Windows非完全互換warningあり。 |
| `npx wrangler deploy --dry-run` | 成功。最終生成物は `--env=""` 相当も明示して再確認。43 assets、7,846.73 KiB / gzip 1,612.17 KiB。`--dry-run: exiting now.` を確認。 |
| `node scripts/verify-toukei-pages.mjs http://127.0.0.1:3107` | 最終ビルドで成功。全10問の200、静的manifest、本文・全解法・誤答、canonical、一覧リンク、関連guide slug、参照リンク、ダミー広告IDを照合。 |
| sitemap | 27件、重複なし、siteContentとURL集合一致。新5問を含む。 |
| 非広告・404境界（Next.js） | about/contact/privacy/weather/dashboard/ai-newsは200で広告識別子なし。不正problem、不正guide、一般404も広告識別子なし。 |
| ブラウザ表示 | 問7の人数表・計算・結論をdesktopと390×844で確認。mobileで合計列まで横スクロールして閲覧可能。 |
| `git diff --check` | 成功。WindowsのLF/CRLF予告warningのみ。 |

最初のuv実行はsandboxのcacheアクセス、最初のNext.js buildはGoogle Fonts取得制限、ページ検証はesbuildの親ディレクトリ読取制限で失敗した。通常権限で必要な検証を再実行して成功し、回避のためのソース・設定変更はしていない。

Workers preview停止後の再lintでは、今回生成した `.wrangler/tmp/dev-yZR0di/worker.js` が検査対象に入り、バンドル内部のルール違反6件が出た。生成時刻・対象を確認し、今回の一時workerとsource mapだけを削除して通常のlintを再実行した。ESLint設定や既存のWrangler状態は変更していない。

## Workers runtimeの未完了ゲート

`wrangler dev --local` でWindowsのWorkers配信を試行したが、`/toukei/problems` は200、既存 `/toukei/problems/confidence-interval` は404。`StaticAssetsIncrementalCache: Failed to set to read-only cache` と `NoFallbackError` が出たため、Workers版の全ページ検証は未通過。

この症状は既存記録 `20260728_issue#344_step3-0_workers_walkthrough.md` のWindows動的slug不具合と一致する。**Windows/OpenNextの生成cache互換性が原因という判断は推定**であり、今回の差分のLinux成功を確認したものではない。WSLは未導入。環境・インフラを変更して解決する作業は今回の範囲に含めない。

既存 `.github/workflows/workers-build.yml` のLinux preview処理へ同じページ検証スクリプトを追加した。push/PR/CI起動の承認後、clean checkoutで新5問と既存5問がWorkers上で200となり、全境界検証が通過することを公開前の必須ゲートとする。

## 分担・最終判断

Codexが唯一のwriterとして計画、実装、独立検算、全差分確認、最終検証を担当。Lunaは既存5問と追加原稿の8観点を読み取り専用監査し、4件のP1（問8誤答、問9前提、問10因果主張、provenance型）を指摘、すべて採用した。手動レビューの採否・既存5問点検は別記録に保存済み。

**トラックA第1バッチのローカル実装完了。公開・Workersリリース判断は保留。** 最終公開内容のユーザー確認、制作情報の承認日・公開日の確定、push、Linux CI、PR/公開はそれぞれ次の承認範囲で扱う。トラックB、広告layout、静的ルーティング設定、認証、Cloudflare設定は変更していない。

## 続行: draft PR・Linux CI

初回報告後、2026-09-04にユーザーから「OK次に進んでください」を受領。commit・push・draft PR・Linux CIへ進行する。上記の「未実施」は初回報告時点の記録である。最終公開確認の文言は公開承認の段階で更新し、merge・本番デプロイ・再審査は行わない。

今回のLuna担当はCIスクリプト・公開前文言・成果物の機密混入についての読み取り専用再監査。対象は本バッチの11ファイルであり、既存未追跡の統合計画、生成物、キャッシュ、環境ファイルをpush対象へ含めない。

### 実施結果

- 実装commit: `c1ea7c5421e8dbbe22768158a5ea441bb447c384`。ローカルとリモートの一致を確認。
- [draft PR #8](https://github.com/kumakit/bearworks-portal/pull/8) を作成。
- [Linux CI run 33852993690](https://github.com/kumakit/bearworks-portal/actions/runs/33852993690) は **success**。対象headは上記commit、baseは `74beb15ed8f3b5cb2acdfe6c0c349580da107165`。ActionsはPRのmerge refをclean checkoutして検証した。
- job `100959801511` の全ステップ成功と実ログを確認。依存関係導入には約7分かかったが正常終了し、その後lint、Next.js build、prefetch検証、OpenNext build、通常・staging両dry-run、Workers previewが成功した。
- Workers previewで新旧10問の静的manifest・HTTP 200・問題文/解法/誤答・canonical・参照リンクが一致。sitemap 27URL、非広告6ページ、無効/404 3ルートの広告なしがPASS。既存の静的asset・API fail-closed検証も成功。
- Luna再監査ではP1阻害なし。与件表や著者・日付の全フィールド自動照合は今後のP2改善候補であり、今回のCIの「本文」はスクリプトが明示的に照合する問題文・解答・解法・誤答等を指す。

```text
PASS /toukei/problems/linear-transformation: static, full text, canonical, ads, references
PASS /toukei/problems/bayes-theorem-screening: static, full text, canonical, ads, references
PASS /toukei/problems/binomial-normal-approximation: static, full text, canonical, ads, references
PASS /toukei/problems/sample-proportion-distribution: static, full text, canonical, ads, references
PASS /toukei/problems/paired-t-test: static, full text, canonical, ads, references
PASS: sitemap 27 unique URLs; 6 non-ad pages and 3 invalid/404 routes have no ads
```

**上記Linux未確認ゲートは解消。** Windowsで観測された404を本番障害と扱わず、Linuxでの成功と区別して記録した。本番デプロイ・merge・Issue更新/終了・再審査は未実施。次のゲートは最終公開内容の承認、provenanceの承認待ち文言と公開日の確定、merge・デプロイである。
