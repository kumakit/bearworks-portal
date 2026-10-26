# Issue #413 実装・検証・公開記録

## 承認と変更

2026-10-26、ユーザーが実装計画r1を承認。対象はbearworks.ukの地価記事1本とシリーズ導線。commit/push/PR/merge/deploy/公開確認まで同じ承認範囲として進める。

- 公式2016/2026地価公示から685地点を正規化し、再生成可能な集計JSON・CSV・同地点採否・manifest・集計コード・固定入力・再現手順を公開。
- 6市の価格分布（2026/2016）、平均比較、八王子124地点の地理院背景付き地図、全地点表、同地点部分標本の比較を実装。図と本文は同じ固定bundleを参照。
- Labs一覧/sitemapの共通登録、人口記事との相互リンク、canonical/JSON-LD/OGPを追加。
- 分析テスト・bundle validator・SSR/配布バイト検証をWorkers CIに接続。
- 最新mainの無関係なニュース更新 `5b70972` をfast-forwardで保持。認証・インフラ設定・依存バージョンは変更していない。

## 分担とレビュー

Lunaは既存記事・CI調査、公式表と履歴仕様の調査、新規コードとbundle/本文の読み取り専用レビューを担当。司令塔が一次資料・主要ファイル・全変更を直接確認した。Lunaレビューでは重大な問題なし。Tab対象の点が多いという改善提案を採用し、所在地選択へ飛ばすリンクを追加した。手動外部計画レビューは不要と判定済み。

## ローカル確認

- Python 3.12で分析テスト6件成功（欠損・不正値・重複・中央値・変動率・同地点履歴/両端照合・公式表との不一致検知）。
- `generate_bundle.py --check`: 685地点、7出力の再生成一致。
- 専用bundle validator: hash・公開ファイル集合・平均/中央値・採否整合が成功。
- `npx tsc --noEmit` 成功。変更したTSX/TS/MJSの対象ESLint成功。
- ローカルSSR検査: 記事/一覧/前作/sitemap、主要数値、100㎡試算、配布7ファイルのバイト一致が成功。
- ブラウザーPC1280px/スマホ390pxで図と地図・凡例・所在地選択・キーボードArrowDown・価格更新を確認。ページ全体の横overflowなし。スマホの図は文字を縮めすぎず図内スクロールにした。
- タイルURLをローカルの404へ一時差し替えて、失敗メッセージと地点選択・価格表示が動くことを確認し、元の地理院URLへ完全復元した。失敗用URLは成果物に含めない。
- 初期SVG titleの複数childrenによるhydration不一致を単一文字列へ修正。再読み込み後のブラウザーエラー0を確認。
- WindowsのTurbopackがCSS処理の子プロセス起動で失敗したため、コード変更なしでWebpack devを使用。ローカルnode_modulesはNext16.3.8でlockの16.4.3より古く、本番判定はLinux CIで行う。dev自動生成のAGENTS/CLAUDEは今回生成分のみ削除し、commitしない。

## 公開前の現状

Workersの正常版: `773dbfae-ae00-49bb-aa0b-527acfb088bd`（2026-10-25T14:25:24Zの100% deployment）。公開直前にも現状を確認する。
GitHub ActionsにはWorkers PR検証と手動本番artifact生成があり、deploy実行は含まない。mainのbranch protectionは未設定。既存GitHub Pagesはmain/のlegacy公開経路あり（設定変更なし）。CloudflareのGit Build連携は未確認のため、mergeは公開を起動し得る操作として扱う。

PR CI、本番artifact、merge/deploy、公開URL検証は次節に追記する。

## PR CI修正

PR #40の初回CI `40292146431` は分析/既存テスト・監査0・lint・Next/Workers build・本番/staging dry-runまで成功。preview開始時に既存 `verify-toukei-pages.mjs` の公開パス許可リストが旧56件のままで停止した（実際は新記事込み57件）。許可リストへ新記事1件を追加し、完全一致検査を維持してCIを再実行する。
