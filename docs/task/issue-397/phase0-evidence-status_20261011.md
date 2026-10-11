# Issue #397 Phase 0 実測証跡

確認日: 2026-10-11 JST。対象はユーザー指定の **bearworks.uk ゾーン全体**（本体と各サブドメイン）。秘密値、zone ID、個人アクセス情報、実件数は記録しない。読み取り照会のみ実施し、契約・権限・設定を変更していない。

## 確認方法と現在の環境

- OCI の既存 Apps 収集環境の `.env` にある認証主体で、Cloudflare GraphQL `settings` と少量の集計照会を実行した。スクリプトは [probe_cloudflare_phase0.py](./probe_cloudflare_phase0.py)。リモートへは標準入力で送り、ファイルを保存していない。各照会の終了時刻は実行時の直近の UTC 時間境界とし、開始を含み終了を含まない。実測は一時点の成功であり、定期実行の成功や将来の提供を保証しない。
- Cloudflare 画面の対象ゾーンは Free。Analytics の「リクエスト」には時間推移と国別一覧があり、国別一覧には **50% sample** と明記されていた。画面のサンプル率と GraphQL の集計方式は同一と仮定しない。画面には本体・apps・toukei 等のホストが含まれる。
- GraphQL Explorer は追加の OAuth 権限を求めたため許可せず取り消した。既存トークンでの読み取りにはその権限追加を要しなかった。
- GitHub `main` は Portal `3a05635185f9ed8e212d01b715d71e2655f61c44`、Apps `main` `c35e7dd0bfb29133b226904883575dd227d722a3`。両ローカル作業ブランチはこの `main` を基点に `codex/issue-397-access-visualization` を作成した。OCI 稼働 checkout の HEAD はローカル `main` と異なり、作業ツリーには既存の未コミット・未追跡ファイルがあるため触れていない。timer の起動状態は確認したが、収集・Digest の継続成功は未確認。
- 以前の「アクセス元」は [Issue #335](https://github.com/kumakit/mission-control/issues/335) の初期表示ではなく、後続の [Issue #338](https://github.com/kumakit/mission-control/issues/338#issuecomment-4641987719) にある `firewallEventsAdaptiveGroups` の上位 ASN と国の一覧だった。WAF イベントの上位ネットワークであり、全 HTTP アクセスの国別分布ではない。

## データセットと期間の可否

`settings` の `maxDuration` / `notOlderThan` は秒。`exact` は今回の応答の `sampleInterval=1` を指し、今後も常に厳密値であるという保証ではない。`estimated` はサンプリングされた行を含む。欠けたバケットや国の完全性、最新データの確定遅延は別に判定する。

| データセット・用途 | 24 時間 | 7 日 | 30 日 | 実測と採用条件 |
| --- | --- | --- | --- | --- |
| `httpRequests1hGroups` 時間別＋国別 | 利用可。直近の完了 24 時間で 24 行・異なる時刻 24。`countryMap` は計 181 国行、各時間の国別和とリクエスト合計が一致。sampled 行 0（今回 `exact`） | 不可。`maxDuration=259200`（3 日） | 不可。同左 | `enabled=true`、`notOlderThan=262800`、`maxPageSize=10000`、`maxNumberOfFields=30`。24 時間グラフと地図は**同一照会・同一母数**を第一候補にする。次回も 24 行、各時刻、国別和、sample interval、GraphQL 部分エラーを検証する。追加照会で観測した異なる国コードは 34、すべて大文字英字 2 文字。特殊候補 `XX` / `T1` / `A1` / `A2` は今回出現しなかった。将来も出ないという意味ではない。 |
| `httpRequestsAdaptiveGroups` 国別 | 取得可。34 国行、sampled 行 13（`estimated`） | 取得可。51 国行、sampled 行 21（`estimated`） | 取得可。86 国行、sampled 行 32（`estimated`） | `enabled=true`、`maxDuration=2592000`（30 日）、`notOlderThan=2678400`（31 日）、`maxPageSize=10000`、`maxNumberOfFields=40`。照会 `limit=300` 未満だが、これだけで小国を含む全件性・母数一致を証明しない。割合と地図の濃淡は追加検証まで保留。 |
| `httpRequestsAdaptiveGroups` 時間別 | 未照会。24 時間は上の 1h 系を優先 | 取得可。168 行・異なる時間 168、sampled 行 116（`estimated`） | 取得可。720 行・異なる時間 720、sampled 行 413（`estimated`） | `limit=750`。すべての時間が返った一時点の結果。サンプル補正、欠損、取得遅延を各実行で判定し、1h 系との数値を同一合計として照合しない。 |
| `firewallEventsAdaptiveGroups` 旧 WAF 5 項目 | 利用不可 | 利用不可 | 利用不可 | `enabled=false`、`maxDuration=0`、`notOlderThan=0`。通常画面・新必須監視から外す。なぜ無効かを有料プラン限定と断定しない。 |
| `firewallEventsAdaptiveByTimeGroups` 参考系列 | 設定上は利用可、意味未検証 | 同左 | 同左 | `enabled=true`、`maxDuration=2592000`、`notOlderThan=2678400`、`maxPageSize=10000`。旧 WAF 5 項目とは異なる集計。処理種別、母集団、推計、表示名は未確定であり Phase 3 採用を保留。 |

GraphQL `settings` の `availableFields` では、1h 系に `sum.countryMap.clientCountryName` / `requests`、Adaptive 系に `dimensions.clientCountryName` / `datetimeHour` と sample interval を確認した。HTTP 系の両データセットには `clientRefererHost` と `clientAsn` が見当たらなかった。したがって現認証主体・ゾーンの HTTP リクエストから、リンク元サイトのドメインや接続元ネットワークを追加表示する案は採用しない。Web Analytics の referer host は別のページ閲覧指標であり、今回の国別 HTTP アクセスの代替にはしない。

## Antigravity の追加報告との照合

ユーザーから 2026-10-11 に受領した Antigravity の読み取り報告は、上記と同じ `settings` 境界、Adaptive の国コード例、24 時間・7 日・30 日の取得可否を報告した。新しいカスタムトークンを設定したとの記載があるが、こちらはその作成・権限設定に関与していない。既存 Apps トークンでの照会結果は上記のとおり。報告の実件数は時間境界と照会時刻が異なりうるため、この記録には転記せず、こちらの照会値と同一視しない。

報告中の「上位 5 か国」と別名 `total` の算術から、その 5 か国の推計母数に対する割合を算出すること自体は可能。ただし、提示された抜粋には完全な GraphQL クエリ、期間境界・フィルタ、`sampleInterval`、全カテゴリ行、全行和と母数の照合がない。したがって、**全件の国別分布や地図全体の割合が確定したとは判定しない**。Adaptive は [Cloudflare の説明](https://developers.cloudflare.com/analytics/graphql-api/sampling/)どおりサンプリング時に推計値を返す。Phase 1 の 24 時間は上記の 1h 系 `countryMap` を採用し、Adaptive の上位 5 件をその代用品にしない。

報告の `JP`・`FR`・`US` 等は大文字 2 文字コードであり、追加照会の観測とも整合する。しかし、Natural Earth の `ISO_A2` と**全件が一対一対応するとは未確認**。[配布元](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/)は Admin 0 Countries が一部の海外属領を ISO コードどおりに分割しないと説明している。固定版の実ファイルで属性と観測コードを照合し、未対応・重複・地図外・特殊値を一覧に残す。

7 日の前期間は保持境界上は候補だが、前期間の独立照会・精度と境界は未実測。30 日の前期間は保持境界を超えるため、同一定義の完全な保存履歴が揃うまで比較不可とする。

公式仕様: [GraphQL settings](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/)、[sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/)、[limits](https://developers.cloudflare.com/analytics/graphql-api/limits/)。API の一般上限と、現 Apps 収集器の内部問い合わせ予算は別。実装時の照会数・時間上限は現コードと稼働間隔を合わせて固定する。

## 新旧契約の対応案（未実装）

| v1 現行 | v2 案 | 移行時の規則 |
| --- | --- | --- |
| `traffic24h` 合計値 | 既存値を維持し、別ブロック `trafficSeries` | 24 個の完了 1 時間バケットをそのまま渡す。旧合計から点を生成しない。窓が異なれば合計を同一視しない。 |
| 国別アクセスなし | `countryTraffic` | 24 時間は同じ 1h 照会の `countryMap` を集約し、各時間の国別和と母数一致を確認。特殊・地図外コードを一覧に残す。7/30 日の割合は全件性・母数を追加確認するまで保留。WAF `topASNs.country` を転用しない。 |
| `waf7d` 旧 5 項目 | 通常画面・必須監視から除外 | 参考系列を旧処理種別の数値に代入しない。 |
| `securityTrend` なし | 採用条件を満たす場合のみ追加 | `firewallEventsAdaptiveByTimeGroups` の意味と精度を確定してから表示名を決める。 |
| Digest は `traffic24h` と `pagesMonth` を Cloudflare 取得可否に利用 | 新しい必須監視集合を運用設定で固定 | 旧 WAF 5 項目は現関数で直接判定していない。必須の欠落・失効・エラーを検知し、廃止項目の不可だけで `partial` にしない。 |

実装前に JSON の版・フィールド・状態、Apps/Portal 共通 fixture、Digest の必須集合、切替設定を確定する。

## 地図素材と日本語説明

| 候補 | 公開・商用利用 | 改変 | 表示義務 | 未確定 |
| --- | --- | --- | --- | --- |
| Natural Earth 1:110m Admin 0 Countries v5.1.1 | 可。パブリックドメイン | 可 | なし | 実ファイルの国コード属性、Cloudflare の実コードとの対応、小国・属領・係争地域の表示 |

根拠: [Natural Earth 配布ページ](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/)、[利用条件](https://www.naturalearthdata.com/about/terms-of-use/)。国コードを国名から推測変換しない。未知・特殊コードと地図に載らない国・地域は別枠に残す。地図は政治的な境界の唯一の表現とみなさない。

説明案: 「アクセスは HTTP リクエスト数です。訪問人数ではありません。」「国は接続元 IP から推定した場所です。VPN などを使うと実際の所在地と異なる場合があります。」「国別の色は件数を示し、危険度を示しません。」推計値には「サンプルから推計」と示す。比較できないときは理由に応じて「比較データを蓄積中」「欠損があるため比較できません」「この期間は比較に非対応」を出す。

## 実装前の残りの確認

1. 24 時間の観測国コードは 34 種の大文字英字 2 文字で特殊候補は出なかった。採用する Natural Earth 実ファイルの属性と全観測コードを照合し、未対応・地図外・特殊値の扱い、集計遅延・欠けた時間を fixture に固定する。今回の 24 行・国別和一致は実装可能性の証拠だが継続保証ではない。
2. Adaptive 7/30 日の国別行が完全か、同一条件の母数と一致するかを追加検証する。証明できなければ `TOP_ONLY` とし、割合・濃淡を出さない。推計区分を画面に表示する。
3. OCI 稼働版の既存未コミット変更に触れず、実配備の収集間隔・問い合わせ予算・Digest の現況を照合する。単発 API 成功から運用成功を結論しない。
4. `firewallEventsAdaptiveByTimeGroups` は処理種別等の意味を確認できるまで任意の候補に留める。セキュリティ系列が採用できなくてもアクセス可視化の主目的は進められる。

この証跡と [実装計画](./implementation_plan_20261011.md) を、実装前の Phase 0 再レビューに渡す。

## Phase 1 着手後の追補（2026-10-11）

固定した Natural Earth v5.1.1 の実ファイルを照合し、上記の「実ファイル未確認」は解消した。`ISO_A2` では `FR`・`TW` が一致せず、描画用の `ISO_A2_EH` では一致した。一方、観測した `HK`・`SG` に対応する 1:110m Countries のポリゴンはない。地図外コードも一覧と合計には残す。ファイルのハッシュ、利用条件、属性の検証結果は[素材検証記録](./natural-earth-map-source.md)に固定した。7/30 日の全件性と OCI 継続稼働は引き続き未確認。
