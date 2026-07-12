import type { GuideSlug } from "../guides/guide-data";

export interface Reference {
  title: string;
  url: string;
}

export interface AppLink {
  title: string;
  url: string;
}

export interface SolutionStep {
  label: string;
  expression: string;
  description: string;
}

export interface Distractor {
  value: string;
  reason: string;
}

export interface Problem {
  slug: string;
  title: string;
  description: string;
  concepts: string[];
  question: string;
  givenValues: { label: string; value: string }[];
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  distractors: Distractor[];
  relatedGuideSlugs: GuideSlug[];
  appLinks: AppLink[];
  author: string;
  publishedAt: string;
  reviewedAt: string;
  references: Reference[];
}

export const problems: Problem[] = [
  {
    slug: "confidence-interval",
    title: "母分散未知における母平均の95%信頼区間の算出",
    description: "標本標準偏差を用いて、正規分布を仮定した母集団から抽出されたサンプルの母平均を区間推定します。",
    concepts: ["区間推定", "t分布", "標準誤差", "信頼区間の解釈"],
    question: "ある製品の重量を測定するため、無作為に25個のサンプルを抽出したところ、標本平均が72g、標本の標準偏差（不偏標準偏差）が10gでした。この製品の母平均に対する95%信頼区間を求めなさい。ただし、製品の重量は正規分布に従うものとし、自由度24のt分布における上側2.5%点（両側5%点）は t(24) = 2.064 とします。",
    givenValues: [
      { label: "標本サイズ (n)", value: "25" },
      { label: "標本平均 (x̄)", value: "72 g" },
      { label: "標本標準偏差 (s)", value: "10 g" },
      { label: "t分布の臨界値 (t(24))", value: "2.064" }
    ],
    solutionSteps: [
      {
        label: "標準誤差 (SE) の計算",
        expression: "SE = s / √n = 10 / √25 = 10 / 5 = 2.00",
        description: "母分散が未知であるため、不偏標準偏差 s を用いて標準誤差を計算します。"
      },
      {
        label: "誤差の許容限界 (Margin of Error) の計算",
        expression: "誤差 = t(24) * SE = 2.064 * 2.00 = 4.128",
        description: "信頼係数 95% に対応するt分布の臨界値と標準誤差の積を求めます。"
      },
      {
        label: "信頼区間の上下限の算出",
        expression: "下限 = 72 - 4.128 = 67.872, 上限 = 72 + 4.128 = 76.128",
        description: "標本平均から誤差を引いた値が下限、足した値が上限となります。約67.9g〜76.1gの範囲となります。"
      }
    ],
    finalAnswer: "95%信頼区間は 67.872 g 〜 76.128 g （小数点第2位を四捨五入して 約67.9 g 〜 76.1 g）である。",
    distractors: [
      {
        value: "68.08 g 〜 75.92 g",
        reason: "母分散既知と誤認して正規分布の臨界値 1.96 を使用した場合の計算値（72 ± 1.96 * 2 = 72 ± 3.92）。小標本かつ母分散未知ではt分布を用いる必要があります。"
      },
      {
        value: "母平均がこの信頼区間に入る確率は95%であるという解釈",
        reason: "頻度論における信頼区間の誤解です。母平均は定数であり、得られた特定の区間に入るか入らないかは 1 または 0 です。正しい解釈は「同じ手続き（サンプリングと区間算出）を多数回繰り返したとき、全体の95%の区間が真の母平均を被覆する」ということです。"
      }
    ],
    relatedGuideSlugs: ["hypothesis-testing-basics"],
    appLinks: [
      { title: "分野別ドリルで「推定」を練習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "CBT模擬試験で総合演習する", url: "https://toukei.bearworks.uk/exam" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-07-12",
    reviewedAt: "2026-07-12",
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  },
  {
    slug: "hypothesis-test",
    title: "母分散既知における母平均の両側仮説検定",
    description: "既知の母標準偏差を用いて、標本平均から母平均が想定値と有意に異なるかを両側z検定で判断します。",
    concepts: ["仮説検定", "z検定", "p値", "有意水準", "因果関係と相関関係"],
    question: "ある機械から生産される部品の長さは、標準偏差（母標準偏差）12mmの正規分布に従うことが分かっています。この機械の調整状況を確認するため、部品を36個無作為に抽出して測定したところ、標本平均は52mmでした。基準となる設定平均値である48mmから有意な変化があったと言えるか、有意水準5%で両側検定を行いなさい。",
    givenValues: [
      { label: "母標準偏差 (σ)", value: "12 mm" },
      { label: "標本サイズ (n)", value: "36" },
      { label: "標本平均 (x̄)", value: "52 mm" },
      { label: "基準平均値 (μ0)", value: "48 mm" },
      { label: "有意水準 (α)", value: "0.05 (両側)" }
    ],
    solutionSteps: [
      {
        label: "仮説の設定",
        expression: "帰無仮説 H0: μ = 48, 対立仮説 H1: μ ≠ 48",
        description: "「変化がない」とする帰無仮説と、「変化がある（異なる）」とする対立仮説を設定します。"
      },
      {
        label: "検定統計量 z値の計算",
        expression: "z = (x̄ - μ0) / (σ / √n) = (52 - 48) / (12 / √36) = 4 / (12 / 6) = 4 / 2 = 2.00",
        description: "標本平均の標準化を行い、検定統計量 z ＝ 2.00 を算出します。"
      },
      {
        label: "判定",
        expression: "z = 2.00 > 1.96 (両側5%臨界値), p値 ≒ 0.0455 < 0.05",
        description: "z値が臨界値 1.96 を上回り、両側p値が有意水準 0.05 より小さいため、帰無仮説 H0 を棄却し、対立仮説 H1 を採択します。すなわち、「基準値48mmから有意な変化があった」と判断します。"
      }
    ],
    finalAnswer: "検定統計量 z = 2.00 であり、両側p値は約 0.0455 であるため、有意水準5%で帰無仮説は棄却され、「基準から有意な変化があった」と判断される。",
    distractors: [
      {
        value: "片側検定のp値（約0.0228）を用いて両側検定を判断する",
        reason: "問題文で「有意な変化があったか」と問われているため、増減の方向を限定しない「両側検定」を行います。片側p値のまま有意判定を記述することは誤りです。"
      },
      {
        value: "この検定結果から、機械の摩耗が部品の長さを変化させた因果関係が証明されたとする主張",
        reason: "仮説検定は「差があることの統計的証拠」を示すものであり、差をもたらした具体的な原因や因果関係（機械の摩耗が原因であることなど）そのものを直接証明するものではありません。プロセス要因等の背景分析は別途必要です。"
      }
    ],
    relatedGuideSlugs: ["hypothesis-testing-basics", "choosing-statistical-tests"],
    appLinks: [
      { title: "分野別ドリルで「仮説検定」を練習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで検定手順を確認する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-07-12",
    reviewedAt: "2026-07-12",
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  },
  {
    slug: "simple-regression",
    title: "手計算データを用いた単回帰方程式と決定係数の算出",
    description: "5組のペアデータから、最小二乗法を用いて傾きと切片を求め、予測値の残差と決定係数（R²）を算出します。",
    concepts: ["回帰分析", "最小二乗法", "決定係数", "残差", "相関関係と因果関係"],
    question: "ある変数 X と Y について、5組のデータ点 (1, 40), (2, 50), (3, 70), (4, 70), (5, 90) が得られました。このデータから X を説明変数、Y を被説明変数とする単回帰モデル Y = βX + α + e を最小二乗法で推定し、傾き β、切片 α、および X = 4.5 のときの予測値と残差（実測値 Y = 78 とする）、決定係数（R²）をそれぞれ求めなさい。",
    givenValues: [
      { label: "データセット (X, Y)", value: "(1, 40), (2, 50), (3, 70), (4, 70), (5, 90)" },
      { label: "評価する点", value: "X = 4.5 での実測値 Y = 78" }
    ],
    solutionSteps: [
      {
        label: "平均値の算出",
        expression: "Xの平均 = (1+2+3+4+5)/5 = 3.0, Yの平均 = (40+50+70+70+90)/5 = 64.0",
        description: "説明変数と被説明変数のそれぞれの平均値を求めます。"
      },
      {
        label: "偏差平方和と共分散の分子の計算",
        expression: "Xの偏差平方和 (Sxx) = (-2)² + (-1)² + 0² + 1² + 2² = 10, 共分散の分子 (Sxy) = (-2)*(-24) + (-1)*(-14) + 0*6 + 1*6 + 2*26 = 48 + 14 + 0 + 6 + 52 = 120",
        description: "傾きを求めるための各偏差の計算を行います。"
      },
      {
        label: "傾き (β) と 切片 (α) の計算",
        expression: "傾き β = Sxy / Sxx = 120 / 10 = 12, 切片 α = Yの平均 - β * Xの平均 = 64 - 12 * 3 = 28",
        description: "これにより単回帰式は Y = 12X + 28 と推定されます。"
      },
      {
        label: "予測値と残差の計算 (X = 4.5)",
        expression: "予測値 = 12 * 4.5 + 28 = 82, 残差 = 実測値 - 予測値 = 78 - 82 = -4",
        description: "X = 4.5 における回帰式の予測値は 82 であり、実測値 78 との残差は -4 となります。"
      },
      {
        label: "決定係数 (R²) の計算",
        expression: "Yの全平方和 (Syy) = (-24)² + (-14)² + 6² + 6² + 26² = 576 + 196 + 36 + 36 + 676 = 1520, 残差平方和 (Se) = Syy - β * Sxy = 1520 - 12 * 120 = 1520 - 1440 = 80, 決定係数 R² = 1 - (Se / Syy) = 1 - (80 / 1520) = 1440 / 1520 = 18 / 19 ≒ 0.9474",
        description: "モデルの適合度を示す決定係数は 18/19 (約0.9474) となります。"
      }
    ],
    finalAnswer: "回帰式は Y = 12X + 28、X = 4.5 の予測値は 82（残差は -4）、決定係数 R² は 18 / 19 （約 0.9474）である。",
    distractors: [
      {
        value: "決定係数 R² ＝ 0.9474 をもって、XとYの因果関係が証明されたと結論づける",
        reason: "決定係数は手元データの回帰線への適合度を示すものであり、相関関係の強さを表す指標に過ぎません。これだけでXがYを引き起こす因果関係があるとは結論づけられません（疑似相関の可能性など）。"
      },
      {
        value: "残差の計算を「予測値 - 実測値」と取り違えて +4 とする",
        reason: "残差の定義は「実測値 - 予測値 (y - ŷ)」です。符号を逆にすると回帰分析の各種前提条件や分析ステップの理解にズレが生じます。"
      }
    ],
    relatedGuideSlugs: ["regression-interpretation"],
    appLinks: [
      { title: "分野別ドリルで「回帰分析」を練習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "学習分析ダッシュボードを見る", url: "https://toukei.bearworks.uk/dashboard" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-07-12",
    reviewedAt: "2026-07-12",
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  },
  {
    slug: "contingency-table",
    title: "2×2分割表を用いた独立性のカイ二乗検定",
    description: "カテゴリ変数同士の独立性を検定するため、期待度数とカイ二乗統計量を算出し判断を行います。",
    concepts: ["独立性の検定", "カイ二乗検定", "期待度数", "自由度", "分割表の解釈"],
    question: "学習スタイルAとスタイルBの効果の関連性を調べるため、受講生100人を対象に調査を行いました。スタイルAを受講した50人のうち合格者は36人、不合格者は14人でした。スタイルBを受講した50人のうち合格者は24人、不合格者は26人でした。学習スタイルと合否は独立であると言えるか、有意水準5%で独立性の検定を行いなさい。ただし、自由度1のカイ二乗分布における5%臨界値は 3.841 とします。",
    givenValues: [
      { label: "スタイルA (合計50人)", value: "合格 36人 / 不合格 14人" },
      { label: "スタイルB (合計50人)", value: "合格 24人 / 不合格 26人" },
      { label: "全体 (合計100人)", value: "合格 60人 / 不合格 40人" },
      { label: "自由度1の5%臨界値", value: "3.841" }
    ],
    solutionSteps: [
      {
        label: "期待度数の計算",
        expression: "スタイルA合格: 50*60/100 = 30, A不合格: 50*40/100 = 20, スタイルB合格: 50*60/100 = 30, B不合格: 50*40/100 = 20",
        description: "各セルにおける、独立と仮定した場合の理論上の人数（期待度数）を求めます。"
      },
      {
        label: "カイ二乗統計量 (χ²) の計算",
        expression: "χ² = Σ ( (観測 - 期待)² / 期待 ) = (36-30)²/30 + (14-20)²/20 + (24-30)²/30 + (26-20)²/20 = 36/30 + 36/20 + 36/30 + 36/20 = 1.2 + 1.8 + 1.2 + 1.8 = 6.00",
        description: "観測度数と期待度数のズレの大きさを表す統計量を計算し、χ² ＝ 6.00 を得ます。"
      },
      {
        label: "検定の判定",
        expression: "χ² = 6.00 > 3.841 (自由度1の5%臨界値)",
        description: "算出した統計量が臨界値を上回っているため、「独立である」とする帰無仮説を棄却します。すなわち、「学習スタイルと合否には統計的に有意な関連がある」と判断します。"
      }
    ],
    finalAnswer: "期待度数は 30人, 20人, 30人, 20人 であり、検定統計量 χ² = 6.00 は臨界値 3.841 より大きいため、有意水準5%で独立仮説は棄却され、「学習スタイルと合否の間には有意な関連がある」と判断される。",
    distractors: [
      {
        value: "検定の自由度を2×2分割表であるため 2 と誤認する",
        reason: "r×c分割表の独立性検定の自由度は (r-1)*(c-1) です。2×2分割表の場合、(2-1)*(2-1) = 1 となります。カテゴリ数そのものを自由度と混同しないよう注意が必要です。"
      },
      {
        value: "この結果をもって、学習スタイルAが合格率を高めた直接の原因（因果）であると断定する",
        reason: "独立性の検定でわかるのは「二つの属性の間に関連（相関）があるかどうか」のみです。ランダム化比較試験などで厳密に制御されていない限り、背景の受講生モチベーション等の交絡因子が存在する可能性があり、この結果だけで直接の因果効果を断定することはできません。"
      }
    ],
    relatedGuideSlugs: ["choosing-statistical-tests", "anova-and-chi-square"],
    appLinks: [
      { title: "分野別ドリルで「カイ二乗検定」を練習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで検定方法の選択基準を復習する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-07-12",
    reviewedAt: "2026-07-12",
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  },
  {
    slug: "sampling-bias",
    title: "自発回答型Web調査における自己選択バイアスと代表性",
    description: "自発的に回答するアンケート手法において発生するバイアスの特徴と、サンプリング設計の改善方法について学びます。",
    concepts: ["標本抽出", "自己選択バイアス", "標本サイズと偏り", "層化抽出"],
    question: "ある教育サービスで「自発参加型のWebアンケート」を実施したところ、300人から回答が得られ、そのうち72%が「1日の学習時間は十分に足りている」と答えました。この結果をもとに、このサービスを利用する全学習者（母集団）においても同様に『7割以上の学習者の学習時間が足りている』と一般化して判断できるか、統計学的な問題点を指摘し改善案を示しなさい。",
    givenValues: [
      { label: "調査手法", value: "自発参加型のオンラインアンケート" },
      { label: "サンプルサイズ (n)", value: "300" },
      { label: "肯定的回答率", value: "72%" }
    ],
    solutionSteps: [
      {
        label: "自己選択バイアスの指摘",
        expression: "非無作為抽出による系統的偏り",
        description: "自発的なWebアンケートは無作為抽出ではなく、テーマに強い関心がある人や肯定的な意見を持つ人が積極的に回答する傾向（自己選択バイアス）があり、代表性が確保されません。"
      },
      {
        label: "標本サイズ (n) とバイアスの違いの理解",
        expression: "標本数を増やしても偏りは解消しない",
        description: "サンプルサイズが300人（あるいはそれ以上）あっても、抽出方法そのものが偏っている場合、系統的な誤差（バイアス）は打ち消されません。誤った結論を高い精度で確信してしまう危険があります。"
      },
      {
        label: "改善策の提示（無作為抽出の設計）",
        expression: "名簿からの無作為抽出、あるいは層化抽出の適用",
        description: "母集団全体の縮図を作るため、全ユーザーリストから無作為にメールを送る「単純無作為抽出」や、学年・所属ごとにグループ分けした上で比率に応じて抽出する「層化抽出」を採用すべきです。"
      }
    ],
    finalAnswer: "自発回答型Web調査は「自己選択バイアス」を伴うため、結果を母集団へ一般化することはできない。改善には、母集団名簿を用いた無作為抽出や層化抽出を行う必要がある。",
    distractors: [
      {
        value: "サンプルサイズが300人と十分に大きいため、中心極限定理により代表性は保障されるとする見解",
        reason: "中心極限定理は標本平均の分布に関する性質であり、サンプリングにおける「系統的な偏り（バイアス）」を取り除くものではありません。非無作為抽出で偏ったデータは、サンプルサイズをどれだけ増やしても偏ったままです。"
      },
      {
        value: "回答率を高めるために、回答者にインセンティブ（ポイント付与等）を設定すればバイアスが完全に消滅するという解釈",
        reason: "インセンティブは回収率向上には役立ちますが、今度は「インセンティブ目当てで回答する層」のバイアスが新たに発生する可能性があり、根本的な無作為性の担保（代表性の保証）にはなりません。"
      }
    ],
    relatedGuideSlugs: ["sampling-and-bias"],
    appLinks: [
      { title: "分野別ドリルで「データ収集・バイアス」を練習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "CBT模擬試験で調査設計に関する問題に挑戦する", url: "https://toukei.bearworks.uk/exam" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-07-12",
    reviewedAt: "2026-07-12",
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  }
];
