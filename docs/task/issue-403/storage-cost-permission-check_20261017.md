# Issue #403 保存先の費用・権限の読み取り確認

確認日: 2026-10-17 JST。これは候補比較であり、外部サービスへの書込み、課金設定、権限変更はしていない。接続済みの Google Drive はプロフィールと共有ドライブ一覧だけを読み取った。ファイルの内容や一覧は取得していない。

| 候補 | 今日確認できたこと | 未確認で、選定前に必要なこと |
| --- | --- | --- |
| OCI Object Storage | 利用者が東京・ルートのバケット0件を画面で確認。Oracle の公開条件では Always Free のみのアカウントに計20 GBと月50,000 API リクエストの枠がある。 | 実アカウント区分、残容量、バケット作成・インスタンスからの書込み・別主体での読取り/削除権限、版管理・保持ルール、実費。Console の0円表示だけでは無料運用を確定できない。 |
| Google Drive | 接続済みアカウントのプロフィールは取得でき、アクセスできる共有ドライブは0件だった。コネクタは残容量を返さない。個人アカウントの一般的な無料容量は最大15 GBを他サービスと共用。 | このアカウントの空き容量、OCI収集機からの定期アップロード用 OAuth 認証と更新・失効時の再認証、バックアップの閲覧・削除権限、世代整理の運用。Codex の接続は本番収集機の認証ではない。 |
| Google Cloud Storage | 公開条件では無料の月5 GB・月5,000件の Class A 操作等は米国の指定リージョンのみ。 | Google Cloud プロジェクトと課金設定の有無、東京/米国の保存先方針、OCI からの認証方法、実費、残容量、権限と復元。現時点で利用者の GCP プロジェクトは確認していない。 |
| 別端末 | OCI とは別の障害領域になり得る。 | 常時稼働・毎時の取得方法、保存容量、暗号化、失敗通知、担当者と復元演習。 |

根拠: [Oracle の Always Free 条件](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)、[Object Storage の権限](https://docs.oracle.com/en-us/iaas/Content/Identity/policyreference/objectstoragepolicyreference.htm)、[Google の保存容量](https://support.google.com/drive/answer/9312312)、[Drive サービスアカウントと共有ドライブ](https://developers.google.com/workspace/drive/api/guides/about-shareddrives)、[Google Cloud Storage の無料枠](https://cloud.google.com/storage/pricing)。公開条件は変更され得るため、作成前に再確認する。

暫定の毎時48＋日次30世代（概ね78世代）では、満杯の1年DBを全世代に置く単純計算が[合成例](storage-options-and-sizing_20261017.md)で約63 MB / 182 MB / 3.0 GB（1/4/72観測行毎時）。毎時版と日次版を各1回作り、目録も個別に送る場合、31日の月は約1,550回の作成操作となる。実際には確認・再試行・取得・削除・版管理も加わるため、公開無料枠内と断定しない。

現時点の推奨は、稼働DBを公開領域外の SQLite とし、OCI Object Storage を第一候補、Google Cloud Storage と Google Drive を代替候補として残すこと。これは**設計上の候補順位**であって保存先の選定完了ではない。事業者間の障害分離を重視するなら Google Cloud Storage または Drive が有利になる。実スキーマの容量、権限、費用、外部保存先からの復元を同じ基準で確認して決める。
