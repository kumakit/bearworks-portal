ご提示いただいた実装計画を依頼に従い確認します。まずはユーザールール（`ANTIGRAVITY.md` の読み取り専用レビュー境界、およびリポジトリの状態・Issue #420・既存ドキュメント）を確認します。

関連するルールファイルや現在のブランチ状況、既存記事の構成などを読み取ります。

Analyzed deployment.md:L1-232
Analyzed site-content.ts:L1-194
Ran check git status and ANTIGRAVITY.md

`docs/task/issue-420/` 内のファイルおよび `package.json`・`.github/workflows/workers-build.yml` を読み取り専用で確認します。

Analyzed implementation_plan.md:L1-59
Analyzed research.md:L1-73
Analyzed package.json:L1-66
Analyzed workers-build.yml:L1-309

`docs/task/issue-420/source-inspection.json` や前作（`verify-hachioji-land-prices-pages.mjs` など）の構成を読み取り専用で確認します。

Analyzed source-inspection.json:L1-55
Analyzed verify-hachioji-land-prices-pages.mjs:L1-15

`ANTIGRAVITY.md` の出力形式とレビュー観点に従い、簡潔かつ的確にレビュー結果をまとめます。

確認ポイント：
1. **結論**: `条件付き承認`（全体としてデータ契約・既存設計再利用・QA方針は非常に高い水準で整理されているが、リポジトリの正本運用規約 `AGENTS.md` / `docs/operations/deployment.md` との承認ゲート整合性など、実装・公開時に事故や迷いを防ぐための明確化点が数点あるため）。
2. **Critical**: なし
3. **Major**:
   - **承認必須ゲート（main マージ・本番デプロイ）と「一括継続承認」記述の整合性**:
     計画末尾（[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L58-L59)）に「本計画の承認後、正式分析→記事実装→対象commit/push→PR→必須CI→main merge→本番artifact→deploy→公開確認→Issue報告・完了まで進める。共通指示に従い、承認はこの範囲全体に継続し、操作ごとに再確認しない」とある一方、本リポジトリの正本規約（[AGENTS.md](file:///c:/Users/kumat/dev/bearworks-portal/AGENTS.md#L21-L26) および [deployment.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md#L19-L26)、[deployment.md ステップ3](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md#L157-L159)）では、「PRのCIが成功しても自動でマージしてはならない」「main マージ完了後も、公開対象のコミットSHA・変更内容・直前バージョン（復旧先）を提示し、本番デプロイは独立した承認が必要」と定められています。ユーザーが今回の計画承認をもってマージ・デプロイの事前承認を明示的に兼務させる意図であれば問題ありませんが、規約違反や認識齟齬を防ぐため、計画承認時に「mainマージ・本番デプロイまでの包括事前承認を含むか、あるいはPR CI合格後・デプロイ前にゲート確認を行うか」を明記・合意しておく必要があります。
4. **Minor**:
   - **未追跡ファイルの保持対象の範囲明記**:
     [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L14-L16) では未追跡ファイルとして `docs/task/issue-419/` のみが挙げられていますが、現在ワークツリーには `docs/history/20261027_issue#420_phase0.md`、`docs/task/issue-420/`（および `.local-research/issue-420/`）も存在します。`origin/main` から専用ブランチ `codex/issue-420-city-center` を切る際、これら Issue #420 関連ファイルのうちどれを git 管理対象としてコミットし、どれを git 管理外（`.gitignore` またはローカル保持）とするかを明記しておくと作業時の迷いがなくなります。
   - **長期系列（人口 2012–2021 / 空き店舗 2018–2021）の接続判定基準の明確化**:
     [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L24-L26) にて「照合してから接続する。不明なら別系列・範囲注記を維持」「連続性を調査対象・方法で確認する」とありますが、既に Phase 0（[research.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/research.md#L17-L19)）で「基本計画p.6は17町丁合計でありp.66の区域には一部包含の町丁がある」「厳密な人口と断定する根拠は確定していない」と判明しています。実装段階で迷わないよう、「一次資料の文面だけで厳密一致が証明できない場合は、単一折れ線で接続せず別系列（または破線・別パネル・切断表記）として扱う」というフォールバック基準をデフォルトとして固定しておくことを推奨します。
   - **CI 時間・スクリプト接続箇所の具体化**:
     [package.json](file:///c:/Users/kumat/dev/bearworks-portal/package.json#L20) の `validate:bundles` および [workers-build.yml](file:///c:/Users/kumat/dev/bearworks-portal/.github/workflows/workers-build.yml#L75-L85)、Preview 検証（同 L154-158）への追加時、`generate_bundle.py --check`（固定入力からの決定論的再生成一致確認）がネットワークアクセス（`--fetch`）を行わずにローカル固定入力のみで完結することを CI 契約として明記しておくと安全です。

よし、簡潔かつ構造化して回答を作成します。[ANTIGRAVITY.md](file:///C:/Users/kumat/hub/mission-control/ANTIGRAVITY.md) のレビュー境界および [AGENTS.md](file:///c:/Users/kumat/dev/bearworks-portal/AGENTS.md)・[deployment.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md) に基づき、[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md)（および関連調査記録 [research.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/research.md)、[source-inspection.json](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/source-inspection.json)）をレビューしました。

---

### 結論: `条件付き承認`

Phase 0 における一次資料の取得・定義照合（23地点と32地点の集合差、2:5 加重平均式、報告書本文と表の差分 14,661 vs 14,343 の検出、115ha 区域と17町丁集計の境界整理、著作権・利用条件の切り分け）は非常に高い精度で行われており、既存アーキテクチャ（[app/site-content.ts](file:///c:/Users/kumat/dev/bearworks-portal/app/site-content.ts)、固定 bundle + validator + preview verifier）との整合性も適切です。

以下の **Major 1件** および **Minor 3件** を計画に反映・明確化することで、安全に実装へ進められます。

---

### Critical

* なし

---

### Major

1. **承認必須ゲート（`main` マージ・本番デプロイ）と「一括継続承認」記述の整合性**
   * **該当箇所**: [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L58-L59)（「本計画の承認後、正式分析→記事実装→対象commit/push→PR→必須CI→main merge→本番artifact→deploy→公開確認→Issue報告・完了まで進める。共通指示に従い、承認はこの範囲全体に継続し、操作ごとに再確認しない」）
   * **問題点**: リポジトリの正本運用規約である [AGENTS.md](file:///c:/Users/kumat/dev/bearworks-portal/AGENTS.md#L21-L26) および [deployment.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md#L19-L26)（ならびに [ステップ 3](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md#L157-L159)）では、**① `main` ブランチへのマージ** と **② 本番デプロイ (`npm run deploy`)** は個別承認必須ゲートとされており、「公開対象のコミット SHA、変更内容、直前バージョン（復旧先）を提示し、本番デプロイの明示的承認を求める」手順が定められています。
   * **対応**: ユーザーが本計画の承認をもって「`main` マージおよび本番デプロイまでの事前承認」を明示的に兼務させる場合はその旨をユーザー承認条件として明記するか、もしくは [deployment.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md#L128-L138) の標準フロー通り「PR 作成・CI 合格までを自律実行し、マージおよび本番デプロイ時に承認確認を挟む」形へ揃えてください。

---

### Minor

1. **ワークツリー内の未追跡ファイル・ローカル調査資料の扱い**
   * **該当箇所**: [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L14-L16)、[research.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/research.md#L7)
   * **問題点**: 計画では未追跡として `docs/task/issue-419/` のみが言及されていますが、現在ローカルには `docs/history/20261027_issue#420_phase0.md`、`docs/task/issue-420/`、および原本保存先の `.local-research/issue-420/` が存在します。
   * **対応**: 最新 `origin/main` から `codex/issue-420-city-center` を作成する際、`docs/task/issue-419/` を混入させないこととあわせて、`.local-research/`（原本 PDF 群）が誤ってステージングされないよう git 管理外ルール（`.gitignore` 等）とコミット対象ファイルの境界を明記してください。

2. **人口（2012–2021）および空き店舗（2018–2021）の系列接続に関する判定基準の固定**
   * **該当箇所**: [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L24-L26)
   * **問題点**: 人口について「17町丁集計と115haの厳密境界の関係を照合してから接続する」、空き店舗について「連続性を調査対象・方法で確認する」と記載されていますが、[research.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/research.md#L17-L19) の時点で既に手元の6資料からは厳密一致を断定できない可能性が示唆されています（また第三者への問い合わせは非目標）。
   * **対応**: 実装時に Codex が判断に迷わないよう、「手元の一次資料の記述だけで対象範囲・定義の厳密一致を確認できない場合は、単一の連続系列として接続せず、別系列（別パネルまたは明確な視覚的区切り＋注記）として表示する」という判定ルールを確定記載しておくことを推奨します。

3. **CI でのバンドル再生成チェックのオフライン実行契約**
   * **該当箇所**: [implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L32-L34)、[workers-build.yml](file:///c:/Users/kumat/dev/bearworks-portal/.github/workflows/workers-build.yml#L75-L85)
   * **問題点**: 原本 PDF 6点は git 管理外（`.local-research/issue-420/`）に置かれる設計のため、GitHub Actions（`Workers build`）上には原本 PDF が存在しません。
   * **対応**: CI で実行する専用分析テストおよび `generate_bundle.py --check` は、git 管理外 PDF や外部ネットワーク取得に依存せず、リポジトリ内にコミットされた固定入力表（正規化済み CSV/JSON・manifest）から公開 bundle（`public/data/hachioji-city-center/`）を決定論的に再生成・一致検証する構造であることを明記してください。

---

### 計画へ反映すべき具体的な修正

1. **[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L14-L16)（作業環境と既存設計）**:
   * 未追跡の `docs/task/issue-419/` と `.local-research/` を新ブランチのコミット対象から除外し、`docs/task/issue-420/`（および必要な履歴記録）のみを対象ブランチへ含める旨を追記する。
2. **[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L24-L26)（データと比較の契約 1・3）**:
   * 「手元の一次資料のみで対象区域・調査方法の同一性が確認できない場合は、無理に単一系列へ接続せず、計画期間ごとの別系列（または系列境界の明示表示）を採用する」と明記する。
3. **[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L34) / [L50](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L50)（再現可能な処理・必須CI）**:
   * 「原本 PDF 抽出・照合（ローカル専用）と、git 管理下の固定入力からの bundle 生成・一致検証（CI でも実行）を分離し、CI ではネットワーク通信や git 管理外 PDF なしで `--check` と単体テストが完結する」旨を明記する。
4. **[implementation_plan.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/task/issue-420/implementation_plan.md#L58-L59)（承認・レビュー）**:
   * [deployment.md](file:///c:/Users/kumat/dev/bearworks-portal/docs/operations/deployment.md) の承認ルールと整合するよう、ユーザー承認の範囲（計画承認でマージ・デプロイまで一括承認とするか、PR 作成後・デプロイ前に確認を挟むか）を明確化する。