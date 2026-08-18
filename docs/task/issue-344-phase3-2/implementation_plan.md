# Issue #344 Phase 3-2 実装計画

## 目的

Issue #344 の Phase 3-2 として、bearworks.uk の運営者、制作工程、AI利用、人による確認、訂正窓口、再現性の根拠を、各コンテンツから追跡できる形で明示する。

資格・職歴・第三者監修を新たに主張するのではなく、リポジトリ、公開済み成果物、既存の検証記録で確認できる事実だけを表示する。

## 正本と開始状態

- 正本: `kumakit/mission-control#344`
- 対象repo: `C:\Users\kumat\dev\bearworks-portal`
- branch: `codex/issue-344-phase3-2-transparency`
- base: 2026-08-18取得時点の `origin/main` (`a8988d0`)
- Issue state: open / `Status: In Progress`
- Phase 3-0: 完了済み
- Phase 3-1: `kumakit/mission-control#372` で完了済み

## Phase 3-2 要件

1. `/about` に、公開可能な運営領域、実際に公開した分析、アプリを作る理由を記載する。
2. 学習ガイド、オリジナル例題、分析記事に、執筆、検算、最終確認の担当を表示する。
3. AIを使用した工程と、人が判断・確認した工程を分けて表示する。
4. 誤りの受付方法と、コンテンツ単位の更新・訂正履歴への導線を明確にする。
5. 実在するGitHubコード、データ契約、検証記録へリンクする。

## 非目標

- 未確認の資格、職歴、所属、専門家監修、査読実績を追加しない。
- 現在公開している所在地情報を拡張しない。
- 学習ガイドや例題の本文、数式、結論を変更しない。
- 八王子気候分析のbundle、hash、集計、仮説判定を変更しない。
- AdSense対象route、Cloudflare Workers、Access、API、DNS、secretを変更しない。
- Phase 3-3のSearch Console経時確認やAdSense再審査を実行しない。

## 現状

### 充足済み

- `/about` は運営者名、関心領域、Toukei Kentei Drillを作る理由、問い合わせ導線を表示している。
- ガイド8件と例題5件は作成者、公開日、最終確認日、参照資料を表示している。
- `/toukei/methodology` は自主確認、訂正受付、第三者査読ではないことを説明している。
- 八王子気候分析記事はAIと人の役割、気象庁出典、固定bundle、SHA-256、Apps commit、分析コード、更新履歴を表示している。

### 不足

- ガイドと例題で、執筆、計算・論理の検算、最終公開確認が区別されていない。
- ToukeiコンテンツにおけるAI利用範囲と、人が最終判断した範囲が明記されていない。
- ガイドと例題から、実装コードや公開時の検証記録へ到達できない。
- 個別コンテンツの初版・訂正履歴を表示する共通形式がない。
- 八王子記事は再現性情報が十分だが、担当3区分と公開検証記録への導線が他コンテンツと統一されていない。

## 設計

### 1. 共通provenanceモデル

`lib/content-provenance.ts` を追加し、次を型として定義する。

- `writtenBy`: 執筆・構成担当
- `checkedBy`: 数式、計算、データ、論理の確認担当
- `finalReviewedBy`: 最終公開判断の担当
- `aiUsage`: AIを補助利用した工程
- `humanReview`: 人が確認・決定した工程
- `evidenceLinks`: コード、データ、検証記録への公開リンク
- `revisions`: 日付、区分、変更概要を持つ更新・訂正履歴

Toukei用と八王子分析用の値は分離する。AIを著者、検算者、最終承認者として表示しない。

### 2. 共通表示component

`components/ContentProvenance.tsx` を追加し、各詳細ページに次を同じ順序で表示する。

1. 制作・確認担当
2. AIを使用した工程
3. 人が確認した工程
4. コード・データ・検証記録
5. 更新・訂正履歴
6. `/contact` への誤り報告導線

外部リンクには `target="_blank"` と `rel="noopener noreferrer"` を設定する。

### 3. 学習ガイドと例題

- `guide-data.ts` と `problem-data.ts` に `provenance` を追加する。
- 既存の `author` と `reviewedAt` はmetadata互換のため維持する。
- ガイド8件、例題5件すべてに共通型を適用し、未設定を型エラーにする。
- 初版日を履歴の先頭に記録する。実在しない訂正を作らず、訂正がない場合は初版公開のみを表示する。
- `guides/[slug]/page.tsx` と `problems/[slug]/page.tsx` で共通componentを表示する。

公開根拠は次を使用する。

- Portal source: `https://github.com/kumakit/bearworks-portal`
- ガイド公開差分: `bearworks-portal` の公開commit `27c034d`
- 例題公開差分: `bearworks-portal` の公開commit `012417c`
- Phase 3-2検証記録: `docs/history/20260818_issue#344_phase3-2_walkthrough.md`
- 編集・作問方針: `/toukei/methodology`

### 4. 編集・作問方針

`app/(monetized)/toukei/methodology/page.tsx` に次を追加する。

- AIは構成整理、実装補助、文章表現の点検、レビュー補助に利用すること。
- 題材選定、数値・数式の再計算、参照資料との照合、最終公開判断は運営者が行うこと。
- AI出力をそのまま正解・解説として公開しないこと。
- 個別ページの更新・訂正履歴を正本とし、方法全体の変更だけをmethodologyの履歴へ記録すること。

### 5. 運営者情報

`app/(non-monetized)/about/page.tsx` は、未確認の実務経歴を追加せず、公開実績として次を説明する。

- 統計学習ツールの設計・運営
- 公開データを用いた分析、前処理、検算、可視化
- Webアプリと再現可能な静的記事の公開
- 学習や分析の途中経過まで確認できる道具を作る理由
- 編集・作問方針、八王子気候分析、GitHubへの導線

既存の所在地表記は本Phaseでは変更・拡張しない。

### 6. 八王子気候分析

`app/(monetized)/labs/hachioji-climate/page.tsx` の既存情報を保持し、共通provenance表示へ次を渡す。

- 執筆、データ・計算確認、最終公開確認はいずれも `kuma / bearworks.uk`
- AI利用と人による確認の既存説明
- Apps production commitを記録したPortalの固定snapshotとlock
- 公開bundleとfail-closed検証コード
- PortalのIssue #372 walkthroughとLinux clean-checkout CI
- 初版公開履歴

bundleや本文集計は変更しない。

## データフロー

```text
guide-data / problem-data / climate page
                |
                v
       ContentProvenance 型
                |
                v
      ContentProvenance component
                |
                v
担当表示 + AI/人の分担 + 公開証跡 + 履歴 + contact
```

## 安全境界

- 公開済みのGitHub URL、Issueコメント、Actions run、公開データだけをリンクする。
- secret、Cloudflare内部ID、非公開ログ、個人の勤務先・資格・詳細住所を含めない。
- 「専門家による査読」「第三者監修」と誤読される表現を使わない。
- AIは補助であり、人が最終判断したことを明示する。
- provenance追加でroot layoutを変更せず、既存の広告掲載範囲を維持する。

## QA

### 静的確認

- ガイド8件、例題5件でprovenanceが型必須になっている。
- 担当3区分、AI利用、人の確認、証跡、履歴、contactが各詳細ページに表示される。
- 八王子記事のbundle version、SHA-256、Apps commitが変更されていない。
- 外部リンクが実在し、秘密値・非公開IDを含まない。
- `/about` に未確認の資格・職歴・第三者監修の主張がない。

### コマンド

- `npm run validate:hachioji-climate`
- `npm run lint`
- `npm run build`
- `npm run cf:build`
- `npx wrangler deploy --dry-run --env=""`
- `npx wrangler deploy --dry-run --env staging`
- `git diff --check`

### 表示・回帰

- 代表ガイド、代表例題、八王子記事、`/about`、`/toukei/methodology` をdesktop/mobileで確認する。
- ガイド・例題・八王子記事は広告対象、`/about` と `/contact` は広告対象外のままであることを確認する。
- 有効routeは200、無効slugは404かつ広告なしであることを確認する。
- sitemap、canonical、noindex境界に変更がないことを確認する。

## ロールバック

- 本Phaseの変更は表示component、provenance metadata、説明文、計画記録だけに限定する。
- 問題があればPhase 3-2の対象差分だけをrevertし、既存のガイド・例題・八王子記事本文とWorkers設定を維持する。
- 本番deploy前はローカルbranch削除で戻せる。deploy後は対象commitのrevertと既存Workers release手順を別承認で行う。

## 計画レビュー判定

手動のSonnet/Gemini Pro計画レビューは不要と判定する。

理由:

- 認証、認可、secret、DB、データ移行、削除、課金を変更しない。
- Cloudflare、Workers、DNS、公開API、複数repoの責務境界を変更しない。
- 外部repoは公開済みの固定commit・検証記録へのリンクとしてのみ参照する。
- 設計は既存詳細ページへの共通表示追加であり、代替案間の重大な判断を含まない。

## 実装順序

1. ユーザーが本計画を承認する。
2. provenance型と共通componentを追加する。
3. ガイド・例題へ型付きmetadataと表示を追加する。
4. methodologyとaboutを更新する。
5. 八王子記事を共通表示へ接続する。
6. ローカル検証と全差分確認を行う。
7. walkthroughを作成する。
8. commit、push、Linux CI、deploy、公開QA、Issue更新をそれぞれ別ゲートで扱う。

## 未解決事項

- 運営者の職歴・資格・所属は公開可能な確認済み情報がないため、本Phaseでは追加しない。
- 個別コンテンツの公開後訂正実績が確認できない場合、履歴は「初版公開」のみとし、訂正を推測して追加しない。
- Search Consoleの実クロール・インデックス確認はIssue #376で追跡し、本Phaseの完了条件には含めない。
