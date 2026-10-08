# Issue #397 初回実装のコードレビュー依頼

利用できるSonnet等の独立レビュー担当へ、以下の本文とcode-review-bundle.mdをセットで渡してください。ローカルコードを読める環境なら設計v4とwalkthroughも参照してください。bundleは今回の新規コード、対象差分、合成fixtureだけです。認証ファイル、実データ、private Issue本文・資料は含めません。

---

Issue #397の初回実装を、日本語で読み取り専用レビューしてください。添付code-review-bundle.mdを主資料としてください。実装、Git操作、Issue更新、本番接続、実認証情報を使う操作は行わず、指摘だけ返してください。

ユーザー承認範囲は取得状態・必要な操作・WAFの事実説明。危険度判定・履歴・前期間比は次段階です。取得正常を安全と表示せず、2軸で未評価範囲を明示します。初回提供でIssue全体をcloseしません。

特に確認すること:

1. dataとrunId・状態・期間・鮮度を一緒に検証し、旧値・失敗・モックを正常へ流す経路がないか。
2. Python/TypeScript契約が一致するか。小数6桁、巨大数値、構造が不正なenum、partial/null、24h/7d、UTC月初、windowEndと実行開始、期限境界を比較する。
3. 項目別GraphQL、HTTP200のerrors/data=null、Pages途中失敗・要求数上限を偽0にしないか。
4. quota未評価と実際の取得失敗を分け、正常収集のlast_successを恒常的に止めないか。汎用dashboard失敗・stale fallbackまで旧CF値を消し、他の監視値と重大度を保持するか。
5. CF未評価時にAI自由文で安全・根拠のない操作を案内しないか。固定案内と既存anomalyの操作が正しいか。
6. 既存API認証・no-store・405を維持し、servedAtは応答時刻か。設定不明・遅延・復帰・再同期を安全に扱うか。
7. 並行fetch・abort・再同期・アンマウントで古い値を残す経路がないか。
8. WAFイベントと要求、推計と実測、パス/ASNと悪意、Pagesデプロイ件数とビルド枠を混同しないか。グラフ・空配列・部分表示の説明が適切か。
9. 共通fixture/manifestと独立した期待結果、対象テスト・CIに重要な抜けがないか。

ローカル証跡はwalkthrough参照。portal18Node、型検査、lint0error/既存3warning、通常webpack build、合成データPC/mobileを確認。appsの対象テストはCF/DigestとGCP回帰をモックで検証。Linux Workers・本番は未確認。広いdashboardテストには既存catalogの配備参照欠落4件があります。Windows Turbopack停止をwebpack成功と区別してください。

冒頭に「承認可能 / 条件付き承認 / 要修正」と確認範囲を示してください。指摘はID、P1/P2/P3、ファイル・行または関数、発生条件、利用者への影響、最小修正案、回帰テストの表で返してください。資料や実行環境がない部分は未確認と明記し、読んでいないコードを検証済みにしないでください。

レビュー結果を元のCodexチャットへ返せる文書として出力してください。最終採否とReleaseは司令塔Codexとユーザーが判断します。
