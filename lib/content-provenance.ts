export interface ProvenanceLink {
  title: string;
  url: string;
  description: string;
}

export type RevisionKind = "初版" | "更新" | "訂正";

export interface ContentRevision {
  date: string;
  kind: RevisionKind;
  summary: string;
}

export interface ContentProvenance {
  writtenBy: string;
  checkedBy: string;
  finalReviewedBy: string;
  aiUsage: string;
  humanReview: string;
  evidenceLinks: ProvenanceLink[];
  revisions: ContentRevision[];
}

export const toukeiGuideProvenance: ContentProvenance = {
  writtenBy: "kuma / bearworks.uk",
  checkedBy: "kuma / bearworks.uk（参照資料、数値例、説明の整合性を確認）",
  finalReviewedBy: "kuma / bearworks.uk",
  aiUsage:
    "構成案の整理、実装補助、文章表現の点検、レビュー補助にAIを使用しました。AIの出力をそのまま解説として公開していません。",
  humanReview:
    "運営者が題材と説明範囲を決め、公式情報との照合、数値例と論理の再確認、公開可否の最終判断を行いました。専門家による第三者査読ではありません。",
  evidenceLinks: [
    {
      title: "学習ガイドの実装コード",
      url: "https://github.com/kumakit/bearworks-portal/tree/main/app/%28monetized%29/toukei/guides",
      description: "一覧、本文データ、静的ページ生成の実装を確認できます。",
    },
    {
      title: "8ガイドの公開commit",
      url: "https://github.com/kumakit/bearworks-portal/commit/27c034d",
      description: "ガイド本文、静的生成、sitemapを追加した公開差分です。",
    },
    {
      title: "Phase 3-2 検証記録",
      url: "https://github.com/kumakit/bearworks-portal/blob/main/docs/history/20260818_issue%23344_phase3-2_walkthrough.md",
      description: "13件の詳細route、build、Workers bundle、公開証跡を再確認した記録です。",
    },
    {
      title: "編集・作問方針",
      url: "/toukei/methodology",
      description: "参照情報、確認工程、訂正方針を説明しています。",
    },
  ],
  revisions: [
    {
      date: "2026-07-11",
      kind: "初版",
      summary: "8本の統計学習ガイドを公開し、数値例と参照情報を確認しました。",
    },
  ],
};

export const toukeiProblemProvenance: ContentProvenance = {
  writtenBy: "kuma / bearworks.uk",
  checkedBy: "kuma / bearworks.uk（数式、途中計算、最終結論を再計算）",
  finalReviewedBy: "kuma / bearworks.uk",
  aiUsage:
    "問題構成の整理、実装補助、文章表現の点検、レビュー補助にAIを使用しました。AIの出力をそのまま正解や解説として公開していません。",
  humanReview:
    "運営者が題材、条件、数値、誤答例を決め、途中計算と最終結論を再計算したうえで公開可否を判断しました。専門家による第三者査読ではありません。",
  evidenceLinks: [
    {
      title: "オリジナル例題の実装コード",
      url: "https://github.com/kumakit/bearworks-portal/tree/main/app/%28monetized%29/toukei/problems",
      description: "問題データ、途中計算、静的ページ生成の実装を確認できます。",
    },
    {
      title: "5例題の公開commit",
      url: "https://github.com/kumakit/bearworks-portal/commit/012417c",
      description: "例題本文、途中計算、静的生成、相互リンクを追加した公開差分です。",
    },
    {
      title: "Phase 3-2 検証記録",
      url: "https://github.com/kumakit/bearworks-portal/blob/main/docs/history/20260818_issue%23344_phase3-2_walkthrough.md",
      description: "13件の詳細route、build、Workers bundle、公開証跡を再確認した記録です。",
    },
    {
      title: "編集・作問方針",
      url: "/toukei/methodology",
      description: "参照情報、作問、計算確認、訂正方針を説明しています。",
    },
  ],
  revisions: [
    {
      date: "2026-07-12",
      kind: "初版",
      summary: "5本のオリジナル例題を公開し、途中計算と最終結論を再確認しました。",
    },
  ],
};

export const toukeiProblemBatch1Provenance: ContentProvenance = {
  writtenBy: "kuma / bearworks.uk（問題設計）",
  checkedBy: "Gemini（原稿の独立計算・教育内容レビュー）、Codex（修正・独立検算・実装確認）、Luna（品質監査）",
  finalReviewedBy: "kuma / bearworks.uk（2026-09-04に公開内容を承認）",
  aiUsage:
    "第1バッチ（問6〜10）は2026-09-04に原稿とGeminiによる独立検算・教育内容レビュー結果を受領しました。Codexが誤答説明、前提条件、結論の解釈を修正し、Pythonで独立検算しました。Lunaが内容とリンクを監査しました。修正後の原稿をGeminiが再レビューしたという意味ではありません。",
  humanReview:
    "運営者が問題設計と実装方針を確認し、検算・品質点検・Linuxでの配信検証の結果を踏まえて、2026-09-04に公開内容を承認しました。専門家による第三者査読ではありません。",
  evidenceLinks: [
    {
      title: "統計検定2級の公式出題範囲",
      url: "https://www.toukei-kentei.jp/grade/grade2/",
      description: "分野の対応を確認する参照資料です。公式問題の転載ではありません。",
    },
    {
      title: "編集・作問方針",
      url: "/toukei/methodology",
      description: "オリジナル例題の作成・確認・訂正方針です。",
    },
  ],
  revisions: [
    {
      date: "2026-09-04",
      kind: "初版",
      summary: "第1バッチ5問の原稿とGeminiレビューをもとに、Codexが修正・独立検算・実装を実施し、運営者が公開内容を承認しました。",
    },
  ],
};

export const toukeiProblemBatch2Provenance: ContentProvenance = {
  writtenBy: "kuma / bearworks.uk（問題設計）",
  checkedBy: "Gemini（受領原稿の検算・教育内容レビュー）、Codex（修正・独立検算・実装確認）、Luna（品質監査）",
  finalReviewedBy: "kuma / bearworks.uk（最終公開内容の承認待ち）",
  aiUsage:
    "第2バッチ（問11〜15）は2026-09-04に、GeminiによるPython/uvでの独立検算・教育内容レビュー済みとの説明を添えて原稿を受領しました。Codexが近似値の扱い、前提条件、結論の解釈を修正し、Pythonで独立検算しました。Lunaが内容を監査しました。修正後の原稿をGeminiが再レビューしたという意味ではありません。",
  humanReview:
    "運営者が題材と実装方針を指定しました。現在は公開前の検証版で、修正後の最終公開内容の承認日は未確定です。専門家による第三者査読ではありません。",
  evidenceLinks: [
    {
      title: "統計検定2級の公式出題範囲",
      url: "https://www.toukei-kentei.jp/grade/grade2/",
      description: "分野の対応を確認する参照資料です。公式問題の転載ではありません。",
    },
    {
      title: "編集・作問方針",
      url: "/toukei/methodology",
      description: "オリジナル例題の作成・確認・訂正方針です。",
    },
  ],
  revisions: [{
    date: "2026-09-04",
    kind: "初版",
    summary: "第2バッチ5問の受領原稿をCodexが修正・独立検算・実装した公開前の検証版です。",
  }],
};

export const hachiojiClimateProvenance: ContentProvenance = {
  writtenBy: "kuma / bearworks.uk",
  checkedBy: "kuma / bearworks.uk（公式画面との照合、独立計算、品質判定）",
  finalReviewedBy: "kuma / bearworks.uk",
  aiUsage:
    "仮説と分析手順の整理、実装補助、文章の推敲、レビュー補助にAIを使用しました。AIの出力だけで分析結果を決めていません。",
  humanReview:
    "運営者が気象庁データを取得し、公式画面との照合、独立計算、品質判断、公開内容の最終確認を行いました。専門家による第三者査読ではありません。",
  evidenceLinks: [
    {
      title: "固定した公開データ",
      url: "https://github.com/kumakit/bearworks-portal/blob/main/app/%28monetized%29/labs/hachioji-climate/data/hachioji-climate-2026-08-11.r1.json",
      description: "記事が使用するversion固定済みのpublication bundleです。",
    },
    {
      title: "bundle検証コード",
      url: "https://github.com/kumakit/bearworks-portal/blob/main/scripts/validate-hachioji-climate-bundle.mjs",
      description: "byte size、SHA-256、schema、仮説、表示集計をfail-closedで検証します。",
    },
    {
      title: "Linux clean-checkout CI",
      url: "https://github.com/kumakit/bearworks-portal/actions/runs/31603872907",
      description: "bundle検証、Next.js、OpenNext、route境界を確認したActions runです。",
    },
    {
      title: "Portal公開・検証walkthrough",
      url: "https://github.com/kumakit/bearworks-portal/blob/main/docs/history/20260812_issue%23372_portal_walkthrough.md",
      description: "固定snapshot、検算、CI、desktop/mobile、公開確認の記録です。",
    },
  ],
  revisions: [
    {
      date: "2026-08-12",
      kind: "初版",
      summary: "固定bundleを使用した八王子気候分析記事を公開しました。",
    },
  ],
};
