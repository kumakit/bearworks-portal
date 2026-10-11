# Issue #397 Phase 1 ローカル実装記録

日付: 2026-10-11 JST。対象は bearworks.uk ゾーン全体。Apps と Portal の作業ブランチは `codex/issue-397-access-visualization`。Apps [draft PR #18](https://github.com/kumakit/bearworks-apps/pull/18) と Portal [draft PR #25](https://github.com/kumakit/bearworks-portal/pull/25) を作成済み。本番配備は未実施。

## 実装

- Apps: `httpRequests1hGroups` の完了した 24 時間の時刻別リクエスト・キャッシュ件数と `countryMap` を 1 回の GraphQL 応答から取得。24 個の時刻、時間ごとの国別和、重複コード、サンプリングを検証し、`trafficSeries` と `countryTraffic` を v2 契約で出力する。国別内訳だけが不完全な場合は時系列を維持して国別だけを未取得にする。国別を無効にした場合は国別フィールドも問い合わせない。欠損は 0 に補完しない。
- Apps: 新ブロックを別々に無効化する設定を追加。Digest は v2 で旧 WAF 5 項目を必須から除き、新しい採用ブロックの欠落・失効を判定する。収集と Digest には同じ設定を適用する。Cloudflare API への 1 実行は最大 64 リクエスト・180 秒。
- Portal: v1/v2 の契約を区別し、同じ24時間のアクセス数・キャッシュ率と比較準備中の概要カード、24 時間グラフと時刻別表、国別件数順一覧、選択国の件数・割合、装飾的な世界地図を追加。キーボード操作は一覧に設け、地図外の国・地域も一覧と母数に残す。失敗または無効化されたブロックは図の値に転用しない。
- 地図: Natural Earth v5.1.1 の固定 GeoJSON を採用。`ISO_A2_EH` の有効コードのみ描画し、`HK`・`SG` など地図にないコードは一覧に残す。[素材検証記録](../task/issue-397/natural-earth-map-source.md)に固定元、ハッシュ、利用条件、例外を記した。

## 確認

- Apps 収集・Digest テスト: 85 件成功。
- Portal 契約・API テスト: 24 件成功。TypeScript 型検査と全体 ESLint 成功（既存の警告 3 件）。
- Portal の Webpack 本番ビルド成功。既定の Turbopack ビルドはこの環境で Google Fonts への通信と内部プロセスエラーで完了しなかった。
- GitHub Actions は Apps の「Validate Streamlit」「Dashboard tests」と Portal の「Workers build」が成功。国別内訳だけが欠損したときの独立判定を Apps PR へ追加し、対象テスト 85 件と Apps CI 2 件が再成功した。Portal の記録更新後の Workers build も成功した。
- `git diff --check` は両 repo とも成功。地図の一時プレビューを目視確認し、一時ファイルは削除した。
- 合成データの開発専用プレビューで概要カード・グラフ・地図・国別一覧を目視確認した。確認後、プレビュー用ルートは製品差分から削除した。

## 配備前後の確認

Portal を先に配備すれば v1 データを従来どおり扱い、新図は表示しない。Apps が v2 を出力すると新図を表示する。収集と Digest の切替環境変数を揃え、`CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS` と実際の収集間隔を照合する。認証済み PC・スマートフォンで実データ、地図外コード、未配信表示を確認する。次回の定期収集と Digest の成功を確認するまで継続稼働は未確認。7 日・30 日表示と前期間比は Phase 2 の追加調査待ち。
