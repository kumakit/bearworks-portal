# 統計ガイド8本の確認表（2026-10-03改訂）

Lunaの読み取り専用一次監査と司令塔の本文・出典確認に基づく。運営者は2026-10-03に改訂稿を公開原稿として承認した。技術的な検証と人による公開判断は別の工程として記録する。

| ガイド | 主な確認・修正 | 個別出典・残件 |
| --- | --- | --- |
| 学習ロードマップ | 「最短」「最も効果的」を避け、6〜8週間を前提付きの例に変更。開始時の診断と週ごとの調整を追加 | [統計検定2級公式案内](https://www.toukei-kentei.jp/grade/grade2/)は試験範囲の参照。学習期間の効果比較を示すものではない |
| CBT時間配分 | 90分・35問は本サイトの練習条件と明記。30+45+15=90分、後半は2.25分/問へ訂正。配点・本番UI・全問先読みを鉄則とする断定を削除 | 実際の本番仕様は[公式案内](https://www.toukei-kentei.jp/grade/grade2/)で利用者が確認する |
| 仮説検定・p値 | H0棄却をH1の証明としない。p値の条件、信頼区間の反復標本解釈、同じ検定との対応条件を追記 | [ASA p値声明](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf)、[NIST信頼区間](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm) |
| 検定の選択 | Welchと等分散pooled tを区別。自由度nA+nB−2の条件、対応、正規性、期待度数を追加 | [Penn State STAT 800](https://online.stat.psu.edu/stat800/Lesson05) |
| 分布選択 | ポアソンの一定率・独立性、t分布の厳密条件、χ²/Fの構成を追記 | [Penn State STAT 504](https://online.stat.psu.edu/stat504/Lesson01)、[NISTの分布資料](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm) |
| 回帰の解釈 | 5人の架空例でR²=18/19≈94.74%を再確認。手元5点への当てはまりと未知データへの予測を区別 | [Penn State STAT 462](https://online.stat.psu.edu/stat462/node/200/) |
| ANOVA・χ² | 1−0.95³は独立な3検定に限ると明記し、共有群の比較へ直接適用しない。Tukey/Bonferroniを追加 | [Penn State STAT 502](https://online.stat.psu.edu/stat502/Lesson02)、[STAT 504の独立性検定](https://online.stat.psu.edu/stat504/Lesson03) |
| 標本抽出と偏り | 単純無作為抽出の定義、非回答、選択偏りと標本数を分離。代表例題も「この設計だけでは一般化不可」へ訂正 | [Penn State STAT 506](https://online.stat.psu.edu/stat506/Lesson01) |

関連する30例題の機械的な本文・リンク検証と、代表的な標本抽出問題の説明照合を実施する。試験案内・参考書一覧だけを各数理主張の根拠とは扱わない。外部リンクの到達性と運営者の最終判断は公開前に別途確認する。
