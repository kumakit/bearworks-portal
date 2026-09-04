# Issue #377 トラックA・第1バッチ実装計画

## 承認と範囲

2026-09-04受領の実装指示・品質点検・手動レビュー改訂案を採用する。ユーザーの「問題なければトラックAを実行」をローカル実装・検証の承認として扱う。
最新の https://github.com/kumakit/mission-control/issues/377 は OPEN / Status: In Progress、コメント0、担当・milestoneなし、作成・更新2026-08-24T15:15:54Z。本文は監視用でトラックAは未反映。今回の具体的な変更範囲は添付指示による別計画として記録する。GitHubへの書き込みは行わない。

## 目的・既存設計

5問の全文公開例題に問6〜10を追加し、前提条件、手法選択理由、途中計算、結論解釈、誤答分析、出典を揃える。problem-data.ts → 一覧・generateStaticParams・siteContent → sitemap の既存データフローを使う。静的生成と広告layoutを維持する。

## 変更対象

- `app/(monetized)/toukei/problems/problem-data.ts`: 5問追加。問8の不整合な誤答を修正、問9の独立性・有限母集団補正、問10の差の正規性・独立性・因果解釈を明記する。
- `app/(monetized)/toukei/problems/[slug]/page.tsx`: 必要に応じて問7の人数表を既存デザインで表示する。
- `lib/content-provenance.ts`: 既存ContentProvenance型に合わせたバッチ専用記録。Geminiのレビューは受領原稿に対するもの、Codexの修正と検算は別工程と明記する。モデル版の未確認断定、未実施の人手検算・最終公開承認、専門家査読、Analytics連携は記載しない。
- `app/site-content.ts`: 一覧の更新日を更新。27URLは生成物で検証する。
- `scripts/verify-toukei-batch1.py`: 独立した計算検証の再現コード。
- `scripts/verify-toukei-pages.mjs`: 実データと静的manifest、配信本文・canonical・内部リンク・広告境界・sitemapを照合する。
- `.github/workflows/workers-build.yml`: 既存Linux Workers previewゲートに上記ページ検証を追加する。CIの起動は今回行わない。
- `docs/task/issue-377/`、`docs/history/`: 計画・レビュー採否・品質棚卸し・実行証跡。

## 分担

Codexが唯一のwriter、差分確認・独立検算・ビルド・Gitを担当。gpt-5.6-lunaは既存5問と追加5問について8観点の読み取り専用監査を担当する。

## 検証

Pythonによる全5問・誤答経路のアサーション、lint、Next.js build、OpenNext build、Wrangler dry-run、5新規ページ・canonical・本文・sitemap27URL・非広告ページ・404の境界を確認する。広告検証にはダミーの公開client IDを使う。
READMEのとおりOpenNextはWindows非対応。WSL未導入を確認済み。Windowsでの試行結果とLinux clean-checkout CIの未実施を区別し、ローカル成功を本番リリース許可と解釈しない。

## 非目標・復旧

トラックB、basePath、プロキシ、認証、広告範囲、Cloudflare設定は変更しない。push・PR作成・CI起動・デプロイ・再審査・Issue更新は行わない。既存未追跡 `docs/task/issue-377-toukei-subpath/` を保持する。問題発生時は今回の対象差分だけを修正・差し戻しし、既存データと設定は保持する。

## 2026-09-04 次工程の承認

ローカル実装・検証報告後、ユーザーから「OK次に進んでください」を受領。対象差分のcommit・push、draft PR作成、それに伴うLinux CI検証を次工程として実施する。上記の初回ローカル限定境界はこの範囲に限り更新する。merge・本番デプロイ・トラックB・再審査・Issue終了は別ゲートとする。最終公開確認の文言は公開承認を受ける段階で確定する。

## 2026-09-04 公開承認

最新commitのLinux CI成功を報告し、「次は公開文言・公開日の確定と、merge・本番デプロイの承認」と提示した後、ユーザーから「OK次に進んで」を受領した。公開内容と公開日を2026-09-04として確定し、最終文言のCI成功、PR #8のmerge、既存production Workerの更新と公開検証まで実施する。トラックB、再審査、Issue終了は対象外。

本番対象は既存 `bearworks-portal`。現行deploymentとversion、secretのbinding名、公開route/Access/ads.txtを確認してから、公開publisher IDをbuildプロセス内で設定する。IDはpublic/ads.txtと本番配信の一致を確認して導出し、ダミーIDが含まれるbundleはdeployしない。runtime secret値は読み取らない。

既存runbookに沿い、直前versionをローカルの非追跡記録で保持する。更新後の予期しない404、広告境界違反、5xx、Access保護の退行、または10分以内に公開smokeを完了できない場合は検証済み直前versionへ戻す。Access迂回・漏洩・DNS/TLS障害があればrunbookのPages fallback手順を優先する。正常時はRoute、DNS、Access、Pages、staging、secretを変更しない。
