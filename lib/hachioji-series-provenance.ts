import type { ContentProvenance } from "./content-provenance";

function provenance(topic: string): ContentProvenance {
  return {
    writtenBy: "kuma / bearworks.uk（企画）・Codex（構成・原稿作成補助）",
    checkedBy: "Codex（原本保存・集計・独立検算・公式画面との照合）、Luna（制作設計と内容の一次点検）",
    finalReviewedBy: "kuma / bearworks.uk（2026-10-04 原稿承認）",
    aiUsage: "2026-10-04の制作で、Codexが公開観測の取得・解析、図表と原稿の作成、検証を支援しました。Lunaが読み取り専用の調査・点検を担当しました。観測値をAIで生成・補完していません。",
    humanReview: "運営者がテーマ・制作方針と完成稿を承認しました。専門家による第三者査読ではありません。",
    evidenceLinks: [
      { title: "気象庁の公開観測データ", url: "https://www.data.jma.go.jp/risk/obsdl/", description: "日別値の取得元。品質情報と均質番号も保存しています。" },
      { title: "CSV形式と品質情報", url: "https://www.data.jma.go.jp/risk/obsdl/top/help3.html", description: "正常値・準正常値・資料不足値・欠測を区別する公式資料。" },
      { title: "原本の取得条件", url: "/data/hachioji-rain-autumn/source-manifest.json", description: "取得日時、対象期間、要求項目、原本のサイズとSHA-256。" },
      { title: "制作方針", url: "/toukei/methodology", description: "出典、データの読み方、内容の確認と訂正について。" },
    ],
    revisions: [{ date: "2026-10-04", kind: "初版", summary: `${topic}の原稿・固定集計・図表・確認問題を作成。運営者が原稿を承認しました。` }],
  };
}
export const rainArticleProvenance = provenance("第7弾・降水量と降水日数の比較");
export const autumnArticleProvenance = provenance("第8弾・秋の気温帯の日数比較");
