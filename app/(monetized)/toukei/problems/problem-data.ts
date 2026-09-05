import type { GuideSlug } from "../guides/guide-data";
import type { ContentProvenance } from "@/lib/content-provenance";
import { toukeiProblemProvenance, toukeiProblemBatch1Provenance, toukeiProblemBatch2Provenance, toukeiProblemBatch3Provenance } from "@/lib/content-provenance";

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
  frequencyTable?: { caption: string; columns: string[]; rows: string[][] };
  solutionTable?: { caption: string; columns: string[]; rows: string[][] };
  finalAnswer: string;
  distractors: Distractor[];
  relatedGuideSlugs: GuideSlug[];
  appLinks: AppLink[];
  author: string;
  publishedAt: string;
  reviewedAt: string;
  references: Reference[];
  provenance: ContentProvenance;
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
    provenance: toukeiProblemProvenance,
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
    provenance: toukeiProblemProvenance,
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
    provenance: toukeiProblemProvenance,
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
    provenance: toukeiProblemProvenance,
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
    provenance: toukeiProblemProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ]
  },
  {
    slug: "linear-transformation",
    title: "変量の線形変換に伴う平均値・分散・標準偏差の算出",
    description: "一次変換 y = ax + b における平均・分散・標準偏差の変換公式を適用し、単位変換時の散布度の変化を正しく計算します。",
    concepts: ["記述統計", "線形変換", "平均値", "分散", "標準偏差"],
    question: "ある観測地点の1週間の日最高気温（摂氏 ℃）のデータ x について、平均値が 20.0℃、分散が 16.0 ℃²（標準偏差 4.0℃）でした。この気温データを華氏（℉）に変換した変量 y を考えます。摂氏 x と華氏 y の関係式が y = 1.8x + 32 で与えられるとき、華氏における最高気温 y の平均値 E(y)、分散 V(y)、および標準偏差 SD(y) を求めなさい。",
    givenValues: [
      { label: "摂氏の平均値 E(x)", value: "20.0 ℃" },
      { label: "摂氏の分散 V(x)", value: "16.0 ℃²" },
      { label: "摂氏の標準偏差 SD(x)", value: "4.0 ℃" },
      { label: "変換式", value: "y = 1.8x + 32" }
    ],
    solutionSteps: [
      {
        label: "華氏の平均値 E(y) の計算",
        expression: "E(y) = 1.8 * E(x) + 32 = 1.8 * 20.0 + 32 = 36.0 + 32 = 68.0 ℉",
        description: "同じ7日間のデータを共通の一次式で換算するため、E(ax + b) = aE(x) + b を用います。ここでEは観測データの平均を表します。この関係に正規性や日ごとの独立性は不要で、分散も変換前後で同じ定義を用います。"
      },
      {
        label: "華氏の分散 V(y) の計算",
        expression: "V(y) = 1.8^2 * V(x) = 3.24 * 16.0 = 51.84 ℉²",
        description: "分散の性質 V(ax + b) = a^2 * V(x) を適用します。定数の加算（+32）はデータの散布度に影響しないため無視されます。"
      },
      {
        label: "華氏の標準偏差 SD(y) の計算",
        expression: "SD(y) = |1.8| * SD(x) = 1.8 * 4.0 = 7.2 ℉ （または √51.84 = 7.2 ℉）",
        description: "標準偏差の性質 SD(ax + b) = |a| * SD(x) を適用します。"
      }
    ],
    finalAnswer: "華氏における平均値は 68.0 ℉、分散は 51.84 ℉²、標準偏差は 7.2 ℉ である。平均は換算式に従って移動し、ばらつきは標準偏差で1.8倍になる。+32はばらつきを変えない。",
    distractors: [
      {
        value: "分散 V(y) = 83.84",
        reason: "分散の計算にも定数 +32 を足してしまう誤り（3.24 * 16 + 32 = 83.84）。定数シフトは散布度を変えません。"
      },
      {
        value: "分散 V(y) = 28.8",
        reason: "分散の拡大率を a^2 ではなく a 倍にしてしまう誤り（1.8 * 16 = 28.8）。分散は二乗の次元を持ちます。"
      }
    ],
    relatedGuideSlugs: ["learning-roadmap"],
    appLinks: [
      { title: "分野別ドリルで「記述統計」を演習する", url: "https://toukei.bearworks.uk/drill" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-04",
    reviewedAt: "2026-09-04",
    provenance: toukeiProblemBatch1Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" }
    ]
  },
  {
    slug: "bayes-theorem-screening",
    title: "条件付き確率とベイズの定理による検査の陽性適中率の算出",
    description: "有病率、感度、特異度から、検査で陽性と判定された受診者が実際に罹患している条件付き確率（事後確率）をベイズの定理を用いて導出します。",
    concepts: ["確率", "条件付き確率", "ベイズの定理", "感度と特異度", "基準率の無視"],
    question: "ある感染症の有病率が人口の 1.0%（0.01）である集団においてスクリーニング検査を実施します。この検査は、実際に感染している人が正しく陽性と判定される確率（感度）が 90.0%（0.90）、感染していない人が正しく陰性と判定される確率（特異度）が 95.0%（0.95）です。受診者はこの集団から無作為に選ばれ、感度・特異度はこの集団に適用できるとします。ある受診者が検査を受けたところ「陽性」と判定されました。この受診者が実際に感染している確率（陽性適中率）を求めなさい（百分率で表し、小数第2位を四捨五入して小数第1位まで求めよ）。",
    givenValues: [
      { label: "有病率 P(D)", value: "0.01 (1.0%)" },
      { label: "非感染率 P(D^c)", value: "0.99 (99.0%)" },
      { label: "感度 P(T^+ | D)", value: "0.90 (90.0%)" },
      { label: "特異度 P(T^- | D^c)", value: "0.95 (95.0%)" },
      { label: "偽陽性率 P(T^+ | D^c)", value: "0.05 (5.0%)" }
    ],
    solutionSteps: [
      {
        label: "陽性となる全確率 P(T^+) の計算",
        expression: "P(T^+) = P(D)*P(T^+|D) + P(D^c)*P(T^+|D^c) = 0.01*0.90 + 0.99*0.05 = 0.0090 + 0.0495 = 0.0585",
        description: "「実際に感染していて陽性になる確率」と「感染していないのに偽陽性になる確率」の和を全確率の公式で求めます。"
      },
      {
        label: "ベイズの定理による陽性適中率 P(D | T^+) の算出",
        expression: "P(D | T^+) = (P(D) * P(T^+|D)) / P(T^+) = 0.0090 / 0.0585 = 90 / 585 = 2 / 13 ≒ 0.1538",
        description: "与えられた感度 P(T^+|D) から、条件を逆にした P(D|T^+) を求めるためベイズの定理を使います。陽性者全体（5.85%）の中で、真の感染者（0.90%）が占める割合です。下の人数表では90/(90+495)としても求められます。"
      }
    ],
    frequencyTable: {
      caption: "10,000人に検査した場合の期待人数（実測人数ではありません）",
      columns: ["感染状態", "陽性", "陰性", "合計"],
      rows: [["感染あり", "90人", "10人", "100人"], ["感染なし", "495人", "9,405人", "9,900人"], ["合計", "585人", "9,415人", "10,000人"]]
    },
    finalAnswer: "陽性判定を受けた受診者が実際に感染している確率は 2/13 ≒ 15.4% である。有病率が低い集団では非感染者が多いため、偽陽性者495人が真陽性者90人を上回る。感度90%と陽性適中率は条件の向きが異なる。これは架空の条件に基づく計算例である。",
    distractors: [
      {
        value: "90.0%",
        reason: "検査の感度（有病者が陽性になる確率）を、陽性者が感染している確率と同一視する誤り（基準率の無視）。"
      },
      {
        value: "95.0%",
        reason: "特異度（非感染者が正しく陰性になる確率）と混同する誤り。"
      }
    ],
    relatedGuideSlugs: ["learning-roadmap"],
    appLinks: [
      { title: "分野別ドリルで「確率」を演習する", url: "https://toukei.bearworks.uk/drill" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-04",
    reviewedAt: "2026-09-04",
    provenance: toukeiProblemBatch1Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" }
    ]
  },
  {
    slug: "binomial-normal-approximation",
    title: "二項分布の正規近似を用いた確率計算",
    description: "試行回数が十分大きい二項分布 B(n, p) が正規分布 N(np, np(1-p)) に近似できる条件を確認し、標準化による確率算出手順を習得します。",
    concepts: ["確率分布", "二項分布", "正規分布", "正規近似", "標準化"],
    question: "ある製品製造ラインの不良品発生率は 10.0%（p = 0.10）で安定しており、製品の良否は互いに独立です。このラインから無作為に 400 個の製品を抽出して検査します。不良品の個数を X とするとき、不良品が 50 個以上発生する確率 P(X ≧ 50) を、正規近似を用いて求めなさい（連続修正は行わないものとする）。ただし、z値は小数第2位に丸め、標準正規分布の上側確率は P(Z ≧ 1.67) = 0.0475, P(Z ≧ 1.645) = 0.0500 とします。",
    givenValues: [
      { label: "試行回数 (n)", value: "400" },
      { label: "母不良率 (p)", value: "0.10" },
      { label: "1 - p", value: "0.90" },
      { label: "基準不良数 (X)", value: "50" }
    ],
    solutionSteps: [
      {
        label: "正規近似の適用条件確認",
        expression: "np = 400 * 0.10 = 40 ≧ 5, n(1-p) = 400 * 0.90 = 360 ≧ 5",
        description: "np および n(1-p) がともに十分大きいため、二項分布 B(400, 0.10) は正規分布 N(np, np(1-p)) で近似します。npとn(1-p)が5以上という条件は目安であり、尾部まで精度を保証するものではありません。"
      },
      {
        label: "期待値 μ と標準偏差 σ の計算",
        expression: "μ = np = 40, σ^2 = np(1-p) = 400 * 0.10 * 0.90 = 36, σ = √36 = 6",
        description: "二項分布の平均と分散から、近似する正規分布のパラメータを求めます。"
      },
      {
        label: "標準化と確率の算出",
        expression: "z = (X - μ) / σ = (50 - 40) / 6 = 10 / 6 ≒ 1.67",
        description: "独立な400回の良否判定で不良率pが一定のため二項分布を使い、その平均と分散を持つ正規分布で近似します。zを1.67に丸め、表の上側確率0.0475を読みます。連続修正をする場合は整数50の境界を49.5としますが、本問の指定では行いません。"
      }
    ],
    finalAnswer: "指定の表と丸め方による正規近似では約0.0475（4.75%）である。同じ条件の400個検査を繰り返すと約4.75%で50個以上となる見積もりであり、二項分布の厳密確率ではない。zを丸めない正規近似では約0.0478となる。",
    distractors: [
      {
        value: "z ≒ 0.28（上側確率 ≒ 0.3897）",
        reason: "標準偏差6の代わりに分散36で割る誤りです。(50-40)/36 ≒ 0.28となり、表の上側確率は約0.3897です。なお、(1-p)の掛け忘れなら10/√40 ≒ 1.58となり、別の誤りです。"
      },
      {
        value: "0.0500",
        reason: "z = 1.645 （上側5%点）と誤認して選択するミス。"
      }
    ],
    relatedGuideSlugs: ["distribution-selection"],
    appLinks: [
      { title: "分野別ドリルで「確率分布」を演習する", url: "https://toukei.bearworks.uk/drill" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-04",
    reviewedAt: "2026-09-04",
    provenance: toukeiProblemBatch1Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" }
    ]
  },
  {
    slug: "sample-proportion-distribution",
    title: "標本比率の標本分布と標準誤差の算出",
    description: "母比率 p の母集団から抽出された大きさ n の標本において、標本比率の不偏性と標準誤差 SE = √(p(1-p)/n) の導出過程を整理します。",
    concepts: ["標本分布", "標本比率", "中心極限定理", "不偏性", "標準誤差"],
    question: "ある政策への賛成率を把握するため、有権者から無作為に 1,600 人を抽出して世論調査を実施します。母集団は標本に比べて十分大きく、抽出率が小さいため有限母集団補正を無視し、各回答を独立で同じ確率pのベルヌーイ試行として扱います。全員が回答するとします。母集団における真の賛成率が 50.0%（p = 0.50）であると仮定するとき、標本比率 p̂ の期待値 E(p̂)、および標準誤差 SE(p̂) を求めなさい。",
    givenValues: [
      { label: "母比率 (p)", value: "0.50" },
      { label: "標本サイズ (n)", value: "1,600" }
    ],
    solutionSteps: [
      {
        label: "標本比率の期待値 E(p̂) の導出",
        expression: "Xを賛成人数とすると p̂ = X/n, E(p̂) = E(X)/n = np/n = p = 0.50（50.0%）",
        description: "標本比率は母比率の不偏推定量であるため、その期待値は母比率そのものと一致します。"
      },
      {
        label: "標本比率の分散 V(p̂) の計算",
        expression: "V(p̂) = V(X)/n² = np(1-p)/n² = p(1 - p) / n = (0.50 * 0.50) / 1600 = 0.25 / 1600 = 0.00015625",
        description: "賛成人数Xを二項分布とみなし、比率X/nの分散を求めます。期待値と分散の公式には正規近似は不要です。有限母集団から非復元抽出し、抽出率が大きい場合は別途補正が必要です。"
      },
      {
        label: "標本比率の標準誤差 SE(p̂) の計算",
        expression: "SE(p̂) = √(p(1 - p) / n) = √0.25 / √1600 = 0.50 / 40 = 0.0125（1.25パーセントポイント）",
        description: "分散の平方根を取ることで標準誤差を導出します。"
      }
    ],
    finalAnswer: "標本比率の期待値は0.50（50.0%）、標準誤差は0.0125（1.25パーセントポイント）である。標準誤差は標本比率の繰り返し調査でのばらつきを表し、95%信頼区間の半幅そのものではない。標本数を6,400人（4倍）にすると標準誤差は0.00625（半分）になる。",
    distractors: [
      {
        value: "SE(p̂) = 0.000156",
        reason: "平方根を取るのを忘れ、分散 V(p̂) の値をそのまま標準誤差として答えてしまう誤り。"
      },
      {
        value: "SE(p̂) = 0.025",
        reason: "標本サイズ n = 1600 の平方根 √1600 = 40 を誤って 20 と計算してしまうミス。"
      }
    ],
    relatedGuideSlugs: ["hypothesis-testing-basics"],
    appLinks: [
      { title: "分野別ドリルで「標本分布」を演習する", url: "https://toukei.bearworks.uk/drill" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-04",
    reviewedAt: "2026-09-04",
    provenance: toukeiProblemBatch1Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" }
    ]
  },
  {
    slug: "paired-t-test",
    title: "対応のある2標本の母平均の差のt検定",
    description: "同一被験者の前後比較データを「差の変数 d」に変換し、自由度 n - 1 の1標本t検定に帰着させて判断する手順を解説します。",
    concepts: ["仮説検定", "t検定", "対応のあるt検定", "自由度", "片側検定"],
    question: "ある研修プログラムの受講効果を検証するため、受講者10名を無作為抽出して受講前と受講後に同一難易度のテストを実施しました。「受講後点数 － 受講前点数」で定義される得点差 d を集計したところ、得点差の標本平均は d̄ = 6.0 点、不偏分散は s_d^2 = 25.0（不偏分散の平方根 s_d = 5.0 点）でした。受講後の母平均得点が受講前より高いと言えるかを調べます。向上を調べる片側検定はデータを見る前に決めたものとし、有意水準5%で検定しなさい。受講者間の得点差は互いに独立で同じ正規分布に従うものとし、自由度9のt分布の上側5%点は t(9) = 1.833、自由度18のt分布の上側5%点は t(18) = 1.734 とします。",
    givenValues: [
      { label: "ペア数 (n)", value: "10" },
      { label: "得点差の標本平均 (d̄)", value: "6.0 点" },
      { label: "得点差の不偏分散 (s_d^2)", value: "25.0 点²" },
      { label: "得点差の標本標準偏差 (s_d)", value: "5.0 点" },
      { label: "有意水準 (α)", value: "0.05 (片側)" },
      { label: "t臨界値 t(9)", value: "1.833" }
    ],
    solutionSteps: [
      {
        label: "仮説の設定",
        expression: "帰無仮説 H0: μ_d = 0, 対立仮説 H1: μ_d > 0",
        description: "差は受講後−受講前と定義します。事前に向上を調べると決めているため、μ_d > 0を対立仮説にします。片側検定の帰無仮説μ_d ≤ 0の境界μ_d = 0で検定統計量の分布を計算します。"
      },
      {
        label: "標準誤差 SE の計算",
        expression: "SE = s_d / √n = 5.0 / √10 ≒ 5.0 / 3.162 ≒ 1.581",
        description: "不偏分散の平方根s_dとペア数nから、平均差の標準誤差を算出します。s_d自体が母標準偏差の不偏推定量という意味ではありません。"
      },
      {
        label: "検定統計量 t値の計算と自由度",
        expression: "t = (d̄ - 0) / SE = 6.0 / (5.0 / √10) = 1.2 * √10 ≒ 3.79, 自由度 df = n - 1 = 9",
        description: "同じ人の前後を対応付け、各人の差を1観測として扱うため1標本t検定に帰着します。母分散は未知、差は独立な正規標本と仮定しており、自由度はn−1=9です。前後それぞれの正規性ではなく差の正規性が条件です。"
      },
      {
        label: "判定",
        expression: "t ≒ 3.79 > 1.833 (片側5%臨界値), p値 ≒ 0.0021 < 0.05",
        description: "t値が臨界値 1.833 を大幅に上回り、p値が 0.05 より小さいため、帰無仮説 H0 は棄却されます。受講後−受講前の母平均差が正である統計的証拠が得られます。p値は自由度9のt分布の上側確率です。対照群のない前後比較だけでは、練習効果などを除いた研修自体の因果効果は断定できません。"
      }
    ],
    finalAnswer: "検定統計量 t ≒ 3.79 であり、自由度9の片側5%臨界値 1.833 を上回るため帰無仮説は棄却され、受講後の母平均得点が高いと判断される。ただし、研修そのものが原因とはこの検定だけでは結論づけられない。",
    distractors: [
      {
        value: "自由度を df = 10 + 10 - 2 = 18 として独立2標本t検定を行う",
        reason: "同一人物内の前後測定を独立と扱う誤りです。差の分散は前後の共分散を含み、独立2標本の分散とは異なります。今回は10個の差を使うため自由度9です。対応による精度の改善幅は相関に依存します。"
      },
      {
        value: "両側検定臨界値 2.262 を適用して判断する",
        reason: "データを見る前に向上を調べる片側検定を指定しているため、上側5%点1.833を使います。両側の2.262を使っても今回は棄却されますが、指定した検定手順とは異なります。観測結果を見てから片側に変更してはいけません。"
      }
    ],
    relatedGuideSlugs: ["hypothesis-testing-basics", "choosing-statistical-tests"],
    appLinks: [
      { title: "分野別ドリルで「仮説検定」を演習する", url: "https://toukei.bearworks.uk/drill" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-04",
    reviewedAt: "2026-09-04",
    provenance: toukeiProblemBatch1Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" }
    ]
  },
  {
    "slug": "correlation-coefficient",
    "title": "ピアソンの積率相関係数の算出と外れ値の影響",
    "description": "2変量の共分散と各標準偏差からピアソンの積率相関係数を算出し、相関の強さの解釈と外れ値に対する脆弱性を理解します。",
    "concepts": [
      "記述統計",
      "相関係数",
      "共分散",
      "散布図",
      "外れ値"
    ],
    "question": "あるクラスの生徒10名における「数学の学習時間 X（時間/週）」と「数学の小テスト得点 Y（点）」の関係を調べました。10名のデータから計算したところ、Xの標本分散は 16.0（標本標準偏差 4.0時間）、Yの標本分散は 25.0（標本標準偏差 5.0点）、XとYの標本共分散は 16.0 でした。XとYのピアソンの積率相関係数 r を求めなさい。また、このデータに「学習時間が非常に長いが点数が極端に低い生徒（外れ値）」が1名追加された場合、相関係数 r はどのように変化するか述べなさい。 分散と共分散はすべて同じ分母（n − 1）で計算し、追加点は元の平均より学習時間が長く、得点が低いものとします。追加後の数値や低下幅まで求められるかも説明してください。",
    "givenValues": [
      {
        "label": "Xの標本標準偏差 s_x",
        "value": "4.0 時間"
      },
      {
        "label": "Yの標本標準偏差 s_y",
        "value": "5.0 点"
      },
      {
        "label": "XとYの標本共分散 s_xy",
        "value": "16.0 時間・点（分散と同じ分母n − 1）"
      }
    ],
    "solutionSteps": [
      {
        "label": "ピアソンの積率相関係数 r の計算",
        "expression": "r = s_xy / (s_x * s_y) = 16.0 / (4.0 * 5.0) = 16.0 / 20.0 = 0.80",
        "description": "同じ10名の対応する2変量について、分散がともに正なので相関係数を計算できます。分散・共分散の分母をそろえ、共分散を標準偏差の積で標準化します。単位が消え、−1から1の無次元量になります。記述的な相関の計算自体に正規性は必要ありません。"
      },
      {
        "label": "相関の強さの解釈と外れ値の影響",
        "expression": "r = 0.80（この10名では強い正の直線的な関連）",
        "description": "この10名では学習時間が長いほど得点が高い傾向があります。「強い」の目安は分野や目的によって異なり、因果関係の証明ではありません。元の平均より右下にある追加点は共分散の分子を小さくし、各変数の平方偏差和を増やすため、rは0.80より低下します。ただし低下幅や負になるかどうかは、この情報だけでは決まりません。散布図を確認し、外れ値という理由だけで削除せず、入力誤りや背景を調べます。"
      },
      {
        "label": "追加後の数値が決まらない理由",
        "expression": "S′xy = Sxy + n/(n+1) × (x₀ − x̄)(y₀ − ȳ)\nS′xx = Sxx + n/(n+1) × (x₀ − x̄)²\nS′yy = Syy + n/(n+1) × (y₀ − ȳ)²",
        "description": "Sは元の10名の平方偏差和・偏差積和、(x₀, y₀)は追加点です。追加後のrはS′xy/√(S′xx S′yy)ですが、元の平均と追加点の具体値がないため計算できません。元のrが正で、今回指定した右下の点を加える条件で低下すると判断しています。すべての外れ値が相関を弱めるわけではありません。"
      }
    ],
    "finalAnswer": "相関係数は r = 0.80。この10名には強い正の直線的な関連がある。指定した右下の点を追加するとrは低下するが、追加後の値・低下幅・負になるかは与件だけでは決まらない。相関から因果関係は証明できない。",
    "distractors": [
      {
        "value": "r = 0.04",
        "reason": "分母を標準偏差の積ではなく分散の積（16 * 25 = 400）で割ってしまう誤り（16 / 400 = 0.04）。相関係数は必ず標準偏差で標準化します。"
      },
      {
        "value": "r = 0.80 であることから、学習時間を増やせば必ず点数が上がる因果関係が証明されたとする主張",
        "reason": "相関関係は「2変数の直線的な連動性」を示すのみであり、因果関係（原因と結果）そのものを証明するものではありません。"
      }
    ],
    "relatedGuideSlugs": [
      "regression-interpretation"
    ],
    "appLinks": [
      {
        "title": "分野別ドリルで「記述統計」を演習する",
        "url": "https://toukei.bearworks.uk/drill"
      }
    ],
    "author": "kuma / bearworks.uk",
    "publishedAt": "2026-09-04",
    "reviewedAt": "2026-09-04",
    "provenance": toukeiProblemBatch2Provenance,
    "references": [
      {
        "title": "統計検定2級公式出題範囲",
        "url": "https://www.toukei-kentei.jp/grade/grade2/"
      }
    ]
  },
  {
    "slug": "sum-and-difference-variance",
    "title": "独立な確率変数の線形結合における期待値と分散（和と差）",
    "description": "互いに独立な2つの確率変数の差において、期待値は引き算になる一方、分散は足し算になる（V(X - Y) = V(X) + V(Y)）性質を理解します。",
    "concepts": [
      "確率",
      "期待値の線形性",
      "分散の加法性",
      "確率変数の独立性",
      "合成誤差"
    ],
    "question": "あるカフェで提供される「コーヒーの抽出量 X（mL）」と「カップの容量 Y（mL）」は互いに独立であり、抽出量 X は期待値 200 mL・標準偏差 6 mL（分散 36）、カップ容量 Y は期待値 250 mL・標準偏差 8 mL（分散 64）であることが分かっています。カップにコーヒーを注いだときの「カップの空き容量」を変量 W = Y - X と定義するとき、空き容量 W の期待値 E(W)、分散 V(W)、および標準偏差 SD(W) を求めなさい。 Wは注ぐ前の容量差を表す数学的な量で、負なら溢れる量に対応します。実際に残る空き容量を0以上に切り詰めた量とは区別します。",
    "givenValues": [
      {
        "label": "抽出量 X の期待値 E(X)",
        "value": "200 mL"
      },
      {
        "label": "抽出量 X の標準偏差 SD(X)",
        "value": "6 mL (分散 36)"
      },
      {
        "label": "カップ容量 Y の期待値 E(Y)",
        "value": "250 mL"
      },
      {
        "label": "カップ容量 Y の標準偏差 SD(Y)",
        "value": "8 mL (分散 64)"
      }
    ],
    "solutionSteps": [
      {
        "label": "空き容量の期待値 E(W) の計算",
        "expression": "E(W) = E(Y - X) = E(Y) - E(X) = 250 - 200 = 50 mL",
        "description": "期待値の線形性により、差の期待値は期待値の差と一致します。 この性質に独立性は必要ありません。有限な期待値・分散がある与件を使います。"
      },
      {
        "label": "空き容量の分散 V(W) の計算",
        "expression": "V(Y − X) = V(Y) + V(X) − 2Cov(X,Y)\n独立よりCov(X,Y) = 0\nV(W) = 64 + (−1)² × 36 = 100 mL²",
        "description": "独立なので共分散項が0となり、差でも分散を足します。一般の従属な変数では共分散項を無視できず、常に足し算になるわけではありません。独立性は共分散0の十分条件ですが、その逆は一般には成り立ちません。"
      },
      {
        "label": "空き容量の標準偏差 SD(W) の計算",
        "expression": "SD(W) = √V(W) = √100 = 10 mL",
        "description": "分散の正の平方根を取ることで標準偏差を算出します。"
      }
    ],
    "finalAnswer": "容量差Wの期待値は50 mL、分散は100 mL²、標準偏差は10 mL。これは容量差の平均とばらつきであり、溢れる確率を求めたものではない。",
    "distractors": [
      {
        "value": "分散 V(W) = 28 mL²",
        "reason": "64 − 36 = 28と分散まで引く誤りです。今回の独立という条件では、係数−1も二乗されるので分散は64 + 36になります。"
      },
      {
        "value": "標準偏差 SD(W) = 2 mL",
        "reason": "標準偏差を引き算してしまう誤り（8 - 6 = 2）。標準偏差は単純な加減算ができません。"
      }
    ],
    "relatedGuideSlugs": [
      "learning-roadmap"
    ],
    "appLinks": [
      {
        "title": "分野別ドリルで「確率」を演習する",
        "url": "https://toukei.bearworks.uk/drill"
      }
    ],
    "author": "kuma / bearworks.uk",
    "publishedAt": "2026-09-04",
    "reviewedAt": "2026-09-04",
    "provenance": toukeiProblemBatch2Provenance,
    "references": [
      {
        "title": "統計検定2級公式出題範囲",
        "url": "https://www.toukei-kentei.jp/grade/grade2/"
      }
    ]
  },
  {
    "slug": "poisson-distribution-calculation",
    "title": "ポアソン分布の期待値・分散と特定事象の生起確率",
    "description": "一定時間の発生回数を表すポアソン分布で、期待値・分散と累積確率を求めます。与えられた近似値での計算と、精密計算の丸めを区別します。",
    "concepts": [
      "確率分布",
      "ポアソン分布",
      "期待値と分散の一致",
      "稀な事象の生起",
      "ポアソン確率質量関数"
    ],
    "question": "あるWebサービスの問い合わせ窓口には、1時間あたり平均して 2.0件（λ = 2.0）の問い合わせがランダムに寄せられます。発生率は一定で、重ならない時間区間の件数は独立、十分短い区間で同時に複数件発生する確率は無視できるものとし、単位時間あたりの発生件数 X はポアソン分布 Po(2.0) に従うものとします。1時間あたりの問い合わせ件数 X の期待値 E(X) と分散 V(X) を求めなさい。また、ある1時間に寄せられる問い合わせ件数が「1件以下（0件または1件）」である確率 P(X ≦ 1) を求めなさい（計算では e^-2 = 0.1353 を近似値として用い、小数第4位まで求めよ）。",
    "givenValues": [
      {
        "label": "1時間の平均件数 λ",
        "value": "2.0 件（発生率は2.0件/時間）"
      },
      {
        "label": "ネイピア数の指数 e^-2",
        "value": "約 0.1353"
      }
    ],
    "solutionSteps": [
      {
        "label": "期待値 E(X) と分散 V(X) の導出",
        "expression": "E(X) = λ = 2.0, V(X) = λ = 2.0",
        "description": "一定率・独立な発生の回数を扱い、設問でポアソン分布を仮定しているため、その平均と分散がともにλになる性質を使います。今回は1時間なのでλ = 2.0です。平均は2.0件、分散は2.0件²で、数値は等しくても単位は異なります。実データで発生率が変動したり問い合わせが集中したりする場合、このモデルをそのまま適用できるとは限りません。"
      },
      {
        "label": "X = 0 および X = 1 の確率の計算",
        "expression": "P(X = 0) = (2^0 * e^-2) / 0! = 1 * 0.1353 / 1 = 0.1353\nP(X = 1) = (2^1 * e^-2) / 1! = 2 * 0.1353 / 1 = 0.2706",
        "description": "ポアソン確率関数 P(X = k) = (λ^k * e^-λ) / k! に k = 0, 1 を代入します。"
      },
      {
        "label": "累積確率 P(X ≦ 1) の算出",
        "expression": "P(X ≦ 1) = P(X = 0) + P(X = 1)\n指定近似値での計算：0.1353 + 0.2706 = 0.4059",
        "description": "0件と1件は同時に起きないので確率を足します。指定された近似値での解答は0.4059です。一方、e^-2を丸めずに計算すると3e^-2 = 0.4060058497…となり、小数第4位に丸めると0.4060です。0.4059を丸め直して0.4060とするのではなく、途中で使う精度の違いです。"
      }
    ],
    "finalAnswer": "期待値は2.0件、分散は2.0件²。設問指定のe^-2 = 0.1353を使うと、1件以下の確率は0.4059（40.59%、約40.6%）。精密計算を小数第4位に丸めた0.4060とは区別する。",
    "distractors": [
      {
        "value": "分散 V(X) = 4.0",
        "reason": "λを標準偏差と誤認して二乗する誤りです。ポアソン分布では分散の数値がλ = 2.0となり、標準偏差は√2です。"
      },
      {
        "value": "P(X ≦ 1) = 0.2706",
        "reason": "X = 0（1件も問い合わせが来ない確率）の加算を忘れてしまうミス。"
      }
    ],
    "relatedGuideSlugs": [
      "distribution-selection"
    ],
    "appLinks": [
      {
        "title": "分野別ドリルで「確率分布」を演習する",
        "url": "https://toukei.bearworks.uk/drill"
      }
    ],
    "author": "kuma / bearworks.uk",
    "publishedAt": "2026-09-04",
    "reviewedAt": "2026-09-04",
    "provenance": toukeiProblemBatch2Provenance,
    "references": [
      {
        "title": "統計検定2級公式出題範囲",
        "url": "https://www.toukei-kentei.jp/grade/grade2/"
      },
      {
        "title": "NIST：ポアソン分布",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm"
      }
    ]
  },
  {
    "slug": "sample-proportion-confidence-interval",
    "title": "大標本における母比率の95%信頼区間の算出",
    "description": "標本比率と標本サイズから、正規近似を用いた母比率の95%信頼区間を算出し、標準誤差の推定と頻度論における信頼区間の正しい意味を整理します。",
    "concepts": [
      "統計的推定",
      "母比率",
      "信頼区間",
      "大標本近似",
      "標準誤差"
    ],
    "question": "ある新製品のユーザー満足度を調査するため、購入者から無作為に 400名を抽出してアンケートを実施したところ、256名が「満足している」と回答しました。この製品の母集団における満足率（母比率 p）に対する 95%信頼区間を求めなさい。ただし、標本サイズは十分に大きく正規近似が適用できるものとし、標準正規分布の上側2.5%点（両側5%臨界値）は z = 1.96 とします。 400名全員が回答し、抽出率は十分小さく各回答を独立なベルヌーイ試行として近似でき、有限母集団補正を無視できるものとします。通常のWald型の正規近似区間を用いてください。",
    "givenValues": [
      {
        "label": "標本サイズ (n)",
        "value": "400"
      },
      {
        "label": "満足と回答した人数 (x)",
        "value": "256"
      },
      {
        "label": "標本比率 (p̂)",
        "value": "256 / 400 = 0.64 (64.0%)"
      },
      {
        "label": "臨界値 (z)",
        "value": "1.96"
      }
    ],
    "solutionSteps": [
      {
        "label": "標本比率 p̂ の計算",
        "expression": "p̂ = 256 / 400 = 0.64, 1 - p̂ = 0.36",
        "description": "標本中の回答割合から標本比率 0.64 を求めます。 満足256名、不満足144名がともに十分多く、比率も0や1に近くないため、指定された正規近似を使います。"
      },
      {
        "label": "標準誤差 SE の推定",
        "expression": "SE = √(p̂(1 - p̂) / n) = √(0.64 * 0.36 / 400) = √0.2304 / 20 = 0.48 / 20 = 0.024",
        "description": "母比率 p が未知のため、標本比率 p̂ を代入して標準誤差を推定します。"
      },
      {
        "label": "誤差の許容限界と信頼区間の算出",
        "expression": "誤差 = 1.96 * 0.024 = 0.04704\n下限 = 0.64 - 0.04704 = 0.59296\n上限 = 0.64 + 0.04704 = 0.68704",
        "description": "標本比率を中心に 1.96 * SE の幅を加減し、信頼区間を算出します。"
      },
      {
        "label": "区間の意味と適用範囲",
        "expression": "0.59296 ≦ p ≦ 0.68704（正規近似による95%信頼区間）",
        "description": "同じ抽出と区間計算を繰り返すと、作られる区間の約95%が一定の母比率を含むという手続き上の意味です。実際の被覆率は母比率や標本サイズによって変わり、厳密に95%ではありません。得た1区間に母比率が入る確率を95%とする解釈や、購入者の95%がこの範囲の満足度を持つという解釈はしません。この幅は無回答・選択・質問文による偏りを補正しません。小標本や0・1近くの比率ではWald区間の精度が悪く、Wilson区間などを検討します。"
      }
    ],
    "finalAnswer": "母比率の 95%信頼区間は 0.593 〜 0.687 （59.3% 〜 68.7%）である。",
    "distractors": [
      {
        "value": "0.616 〜 0.664",
        "reason": "臨界値 1.96 を掛け忘れ、標準誤差 SE = 0.024 をそのまま加減してしまう誤り（0.64 ± 0.024）。"
      },
      {
        "value": "母比率がこの区間に収まる確率が 95% であるという解釈",
        "reason": "頻度論では母比率は未知でも固定した値です。無作為に変わるのは標本から作る区間で、同じ手続きを繰り返したときの被覆割合が約95%になる、という正規近似の解釈です。"
      }
    ],
    "relatedGuideSlugs": [
      "hypothesis-testing-basics"
    ],
    "appLinks": [
      {
        "title": "分野別ドリルで「推定」を演習する",
        "url": "https://toukei.bearworks.uk/drill"
      }
    ],
    "author": "kuma / bearworks.uk",
    "publishedAt": "2026-09-04",
    "reviewedAt": "2026-09-04",
    "provenance": toukeiProblemBatch2Provenance,
    "references": [
      {
        "title": "統計検定2級公式出題範囲",
        "url": "https://www.toukei-kentei.jp/grade/grade2/"
      },
      {
        "title": "NIST：母比率の信頼区間",
        "url": "https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm"
      }
    ]
  },
  {
    "slug": "one-way-anova",
    "title": "一元配置分散分析表の算出と母平均の差のF検定",
    "description": "3群以上の母平均の比較において、全変動を群間変動と群内変動に分解し、自由度・平均平方からF検定統計量を求めて判断する手順を習得します。",
    "concepts": [
      "相関・回帰・多変量",
      "分散分析",
      "ANOVA",
      "F検定",
      "自由度",
      "群間変動と群内変動"
    ],
    "question": "3種類（A社製、B社製、C社製）の肥料が作物の収穫量に与える影響を比較するため、同一条件の畑で各肥料をそれぞれ5区画ずつ（各群 5区画、全3群、総区画数 N = 15）に施肥して収穫量を測定しました。得られたデータから変動（平方和）を計算したところ、群間平方和は SS_B = 84.0、群内平方和（残差平方和）は SS_W = 72.0 でした。群間および群内の自由度を求め、分散分析表を完成させて検定統計量 F値を算出しなさい。また、有意水準 5% で3つの肥料による平均収穫量に有意な差があるか検定しなさい。ただし、自由度 (2, 12) のF分布の上側5%点は F(2, 12) = 3.89 とします。 肥料は15区画に無作為に割り付け、区画間の誤差は独立、各群の誤差は平均0の正規分布に従い、3群で分散が等しいと仮定します。同一条件の畑という説明だけでこれらの条件が保証されるわけではありません。",
    "givenValues": [
      {
        "label": "群数 (k)",
        "value": "3"
      },
      {
        "label": "各群サンプル数 (n_i)",
        "value": "5"
      },
      {
        "label": "総サンプル数 (N)",
        "value": "15"
      },
      {
        "label": "群間平方和 (SS_B)",
        "value": "84.0"
      },
      {
        "label": "群内平方和 (SS_W)",
        "value": "72.0"
      },
      {
        "label": "F臨界値 F(2, 12)",
        "value": "3.89"
      }
    ],
    "solutionSteps": [
      {
        "label": "比較する仮説と手法",
        "expression": "H₀: μ_A = μ_B = μ_C\nH₁: 3つの母平均がすべて等しいわけではない",
        "description": "1つの要因（肥料の種類）で分けた3群の母平均を一度に比較するので、一元配置分散分析を使います。独立・正規・等分散という設問の前提のもとでF検定を行います。群平均のばらつきと、群内のばらつきを自由度で調整して比較します。"
      },
      {
        "label": "自由度の算出",
        "expression": "群間自由度 df_B = k - 1 = 3 - 1 = 2\n群内自由度 df_W = N - k = 15 - 3 = 12",
        "description": "群間の自由度は水準数マイナス1、群内の自由度は総サンプル数マイナス水準数となります。"
      },
      {
        "label": "平均平方の計算",
        "expression": "群間平均平方 MS_B = SS_B / df_B = 84.0 / 2 = 42.0\n群内平均平方 MS_W = SS_W / df_W = 72.0 / 12 = 6.0",
        "description": "群内平均平方MS_Wは共通の誤差分散を推定します。群間平均平方MS_Bは帰無仮説のもとで同じ分散を推定しますが、母平均が異なる場合は群間の効果も含みます。両方を無条件に同じ不偏分散と呼ぶことはできません。"
      },
      {
        "label": "F値の算出と仮説検定",
        "expression": "F = MS_B / MS_W = 42.0 / 6.0 = 7.00",
        "description": "群間平均平方を群内平均平方で割り、検定統計量 F = 7.00 を算出します。"
      },
      {
        "label": "判定",
        "expression": "F = 7.00 > 3.89 (臨界値), p値 ≒ 0.0097 < 0.05",
        "description": "F値が上側5%臨界値を上回るため「3群の母平均はすべて等しい」を棄却します。少なくとも1組の母平均が異なることを示す統計的な証拠です。どの組に差があるか、差の大きさや実用上の重要性は、この検定だけでは分かりません。"
      }
    ],
    "finalAnswer": "群間自由度2、群内自由度12、F = 7.00 > 3.89（p ≒ 0.0097）なので、有意水準5%で「3群の母平均はすべて等しい」を棄却する。少なくとも1組の母平均が異なることを示す証拠があるが、具体的な組や差の大きさはこの検定だけでは特定できない。",
    "distractors": [
      {
        "value": "F = 1.17",
        "reason": "平方和を自由度で割らずにそのまま比率を取ってしまう誤り（SS_B / SS_W = 84 / 72 ≒ 1.17）。必ず自由度で割って平均平方を比較します。"
      },
      {
        "value": "帰無仮説が棄却されたことから、3つの肥料すべてが互いに異なる収穫量をもたらすと結論づける主張",
        "reason": "ANOVA全体の棄却は、すべての母平均が等しいという仮説に反する証拠です。全組の違いを意味せず、特定のペアの検定が有意だと判定したわけでもありません。どの組かを調べるには、多重性を考慮した比較などが必要です。"
      }
    ],
    "relatedGuideSlugs": [
      "choosing-statistical-tests",
      "anova-and-chi-square"
    ],
    "appLinks": [
      {
        "title": "分野別ドリルで「分散分析」を演習する",
        "url": "https://toukei.bearworks.uk/drill"
      }
    ],
    "author": "kuma / bearworks.uk",
    "publishedAt": "2026-09-04",
    "reviewedAt": "2026-09-04",
    "provenance": toukeiProblemBatch2Provenance,
    "references": [
      {
        "title": "統計検定2級公式出題範囲",
        "url": "https://www.toukei-kentei.jp/grade/grade2/"
      },
      {
        "title": "NIST：分散分析表と母平均の検定",
        "url": "https://www.itl.nist.gov/div898/handbook/prc/section4/prc433.htm"
      }
    ],
    "solutionTable": {
      "caption": "完成した一元配置分散分析表",
      "columns": [
        "変動要因",
        "平方和 SS",
        "自由度 df",
        "平均平方 MS",
        "F値"
      ],
      "rows": [
        [
          "群間",
          "84.0",
          "2",
          "42.0",
          "7.00"
        ],
        [
          "群内（誤差）",
          "72.0",
          "12",
          "6.0",
          "—"
        ],
        [
          "全体",
          "156.0",
          "14",
          "—",
          "—"
        ]
      ]
    }
  },
  {
    slug: "two-sample-t-test-pooled",
    title: "独立2標本の母平均の差のt検定（等分散仮定・プールされた分散）",
    description: "2つの独立な正規母集団から得られた標本サイズが異なるデータに対し、プールされた分散（合併不偏分散）を算出して母平均の差をt検定します。",
    concepts: ["2標本t検定", "プールされた分散", "等分散性", "自由度", "両側検定"],
    question: "ある工場で製造される部品の引張強度（MPa）について、従来の製造ラインAと新規導入ラインBの母平均に差があるかを検証するため、無作為にサンプルを抽出して引張強度を測定した。両ラインの母集団は正規分布に従い、母分散は等しい（等分散）と仮定できる。測定結果は以下の通りであった。\n・ラインA: 標本サイズ n_A = 10, 標本平均 x̄_A = 85.0 MPa, 標本不偏分散 s_A^2 = 38.0 MPa²\n・ラインB: 標本サイズ n_B = 15, 標本平均 x̄_B = 80.0 MPa, 標本不偏分散 s_B^2 = 15.0 MPa²\nこのとき、プールされた分散 s_p^2 および母平均の差に対する検定統計量 t の値を求め、有意水準5%で両側検定を行いなさい。ただし、自由度23のt分布における上側2.5%臨界値は t_0.025(23) = 2.069 とします。",
    givenValues: [
      { label: "ラインA 標本サイズ (n_A)", value: "10" },
      { label: "ラインA 標本平均 (x̄_A)", value: "85.0 MPa" },
      { label: "ラインA 不偏分散 (s_A^2)", value: "38.0 MPa²" },
      { label: "ラインB 標本サイズ (n_B)", value: "15" },
      { label: "ラインB 標本平均 (x̄_B)", value: "80.0 MPa" },
      { label: "ラインB 不偏分散 (s_B^2)", value: "15.0 MPa²" },
      { label: "自由度23のt分布上側2.5%臨界値", value: "2.069" }
    ],
    solutionSteps: [
      {
        label: "自由度の算出",
        expression: "ν = n_A + n_B - 2 = 10 + 15 - 2 = 23",
        description: "2群それぞれの標本平均を推定しているため、全体の自由度は各群の自由度 (n_A - 1) と (n_B - 1) の和となり、23となります。"
      },
      {
        label: "プールされた分散（合併不偏分散）の計算",
        expression: "s_p^2 = [(n_A - 1)s_A^2 + (n_B - 1)s_B^2] / (n_A + n_B - 2) = (9 * 38.0 + 14 * 15.0) / 23 = (342.0 + 210.0) / 23 = 552.0 / 23 = 24.00 MPa²",
        description: "各群の不偏分散を自由度で重み付けした加重平均により、共通の母分散の推定値（プールされた分散）を求めます。"
      },
      {
        label: "標本平均の差の標準誤差（SE）の計算",
        expression: "SE = √[s_p^2 * (1/n_A + 1/n_B)] = √[24.0 * (1/10 + 1/15)] = √[24.0 * (5/30)] = √[24.0 * (1/6)] = √4.00 = 2.00 MPa",
        description: "差の分散 V(x̄_A - x̄_B) = σ^2/n_A + σ^2/n_B にプールされた分散を代入して平方根を取ります。"
      },
      {
        label: "検定統計量 t の算出と統計的判断",
        expression: "t = (x̄_A - x̄_B) / SE = (85.0 - 80.0) / 2.00 = 5.0 / 2.00 = 2.50",
        description: "帰無仮説 H_0: μ_A = μ_B のもとでの検定統計量は t = 2.50 となります。両側検定では |t| を臨界値 2.069 と比較し、2.50 > 2.069 なので有意水準5%で帰無仮説を棄却します（両側p値は約0.0200）。これは、正規性・独立性・等分散性という設問の仮定のもとで母平均に差があることを示す統計的証拠です。"
      }
    ],
    finalAnswer: "プールされた分散は s_p^2 = 24.00 MPa²、検定統計量は t = 2.50（自由度23、両側p ≒ 0.0200）である。|t| が臨界値 2.069 を上回るため、設問の仮定のもとで帰無仮説を有意水準5%で棄却し、両ラインの母平均に差があることを示す証拠が得られる。標本平均の差はラインAが5.0 MPa高い。",
    distractors: [
      {
        value: "s_p^2 = 26.50, t = 2.38",
        reason: "各群の不偏分散の単純算術平均 (38.0 + 15.0)/2 = 26.50 を使ってしまう誤りです。標本サイズが異なる場合、自由度による加重平均を行う必要があります。"
      },
      {
        value: "自由度を 24（n_A + n_B - 1）として臨界値を参照する誤り",
        reason: "1標本の自由度 n-1 と混同した誤りです。独立2標本検定では2つの平均パラメータを標本から推定しているため、自由度は n_A + n_B - 2 となります。"
      },
      {
        value: "母分散が等しくない場合でも常にこの検定を用いてよいという誤認",
        reason: "等分散性の仮定が成り立たない場合はウェルチ（Welch）のt検定を用いる必要があります。"
      }
    ],
    relatedGuideSlugs: ["hypothesis-testing-basics", "choosing-statistical-tests"],
    appLinks: [
      { title: "分野別ドリルで「2標本検定」を練習する", url: "https://bearworks.uk/toukei/drill" },
      { title: "CBT模擬試験で総合演習する", url: "https://bearworks.uk/toukei/exam" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-05",
    reviewedAt: "2026-09-05",
    provenance: toukeiProblemBatch3Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "NIST：Comparing Two Independent Population Means", url: "https://www.itl.nist.gov/div898/handbook/prc/section3/prc31.htm" }
    ]
  },
  {
    slug: "two-sample-f-test-variance",
    title: "2つの母分散の比のF検定（等分散性の検定）",
    description: "2つの独立な正規母集団から得られた標本不偏分散を用いてF統計量を算出し、母分散が等しいかどうかの両側検定を行います。",
    concepts: ["F検定", "等分散性", "母分散の比", "両側検定", "F分布"],
    question: "2台の自動充填機（機械Aおよび機械B）で充填される液体の内容量のばらつき（母分散）が等しいかどうかを検証するため、それぞれから無作為抽出したサンプルの内容量を測定した。測定結果は以下の通りである。\n・機械A: 標本サイズ n_A = 10, 標本不偏分散 s_A^2 = 72.0 mL²\n・機械B: 標本サイズ n_B = 16, 標本不偏分散 s_B^2 = 24.0 mL²\n両機械の母集団は互いに独立な正規分布に従うものとする。帰無仮説 H_0: σ_A^2 = σ_B^2 に対し、有意水準5%で両側検定を行いなさい。ただし、自由度(9, 15)のF分布において、上側5%点は F_0.05(9, 15) = 2.59、上側2.5%点は F_0.025(9, 15) = 3.12 とします。",
    givenValues: [
      { label: "機械A 標本サイズ (n_A)", value: "10" },
      { label: "機械A 不偏分散 (s_A^2)", value: "72.0 mL²" },
      { label: "機械B 標本サイズ (n_B)", value: "16" },
      { label: "機械B 不偏分散 (s_B^2)", value: "24.0 mL²" },
      { label: "F分布の上側5%点 F_0.05(9, 15)", value: "2.59" },
      { label: "F分布の上側2.5%点 F_0.025(9, 15)", value: "3.12" }
    ],
    solutionSteps: [
      {
        label: "自由度の特定",
        expression: "ν_1 = n_A - 1 = 10 - 1 = 9, ν_2 = n_B - 1 = 16 - 1 = 15",
        description: "検定統計量を F = s_A^2 / s_B^2 と定義するため、分子は機械Aの自由度9、分母は機械Bの自由度15となります。分子と分母を交換すると、参照するF分布の自由度と棄却域も交換する必要があります。"
      },
      {
        label: "検定統計量 F の算出",
        expression: "F = s_A^2 / s_B^2 = 72.0 / 24.0 = 3.00",
        description: "設問で定めた機械Aと機械Bの順に分散比を計算します。このデータでは機械Aの標本分散が大きいため、結果として F ≥ 1 になります。"
      },
      {
        label: "両側検定における臨界値の選定と判定",
        expression: "臨界値: F_0.025(9, 15) = 3.12（上側2.5%点）",
        description: "有意水準 α = 0.05 の両側検定では両端に α/2 = 0.025 ずつ割り振ります。今回の F = 3.00 は1より大きいので上側2.5%点 3.12 と比較し、3.00 < 3.12 より帰無仮説を棄却しません（両側p値は約0.0584）。母分散が等しいと証明したのではなく、差があるとの十分な証拠を得られなかったという判断です。"
      }
    ],
    finalAnswer: "検定統計量は F = 3.00（自由度9, 15、両側p ≒ 0.0584）である。両側5%検定の上側臨界値 3.12 を下回るため帰無仮説を棄却せず、母分散に差があるとの十分な証拠は得られない。等分散であると証明した結論ではない。",
    distractors: [
      {
        value: "F = 3.00 であり、臨界値 2.59 を上回るため帰無仮説は棄却される",
        reason: "両側検定であるにもかかわらず、片側検定の臨界値 F_0.05(9, 15) = 2.59 を用いてしまう典型的な誤りです。両側検定では両端に α/2 ずつ配分するため上側2.5%点（3.12）と比較する必要があります。"
      },
      {
        value: "自由度を (10, 16) として判定する誤り",
        reason: "サンプルサイズそのものを自由度と取り違える誤りです。自由度は各標本サイズから1を引いた (9, 15) となります。"
      },
      {
        value: "母集団が正規分布に従っていなくてもF検定は頑健であるという誤解",
        reason: "F検定は母集団の正規性からの逸脱に敏感です。正規性が疑わしい場合は、より頑健なルビーン検定やブラウン・フォーサイス検定などを検討します。"
      }
    ],
    relatedGuideSlugs: ["choosing-statistical-tests", "hypothesis-testing-basics"],
    appLinks: [
      { title: "分野別ドリルで「F検定」を演習する", url: "https://bearworks.uk/toukei/drill" },
      { title: "チートシートで検定手法を比較する", url: "https://bearworks.uk/toukei/cheatsheet" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-05",
    reviewedAt: "2026-09-05",
    provenance: toukeiProblemBatch3Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "NIST：F-Test for Equality of Two Variances", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda359.htm" }
    ]
  },
  {
    slug: "chi-square-goodness-of-fit",
    title: "カイ二乗適合度検定（メンデル遺伝比率の適合性）",
    description: "カテゴリカルデータの観測度数と理論上の期待度数からカイ二乗統計量を算出し、理論モデルへの適合度を検定します。",
    concepts: ["カイ二乗検定", "適合度検定", "期待度数", "自由度", "カテゴリカルデータ"],
    question: "あるエンドウ豆の交配実験において、2対の対立遺伝子（種子の形：丸・しわ、子葉の色：黄・緑）の表現型の分離比がメンデルの独立の法則に従い理論上「丸・黄 : 丸・緑 : しわ・黄 : しわ・緑 = 9 : 3 : 3 : 1」になると予測された。実際に交配を行い得られた160粒の種子を分類したところ、観測度数は以下の表の通りであった。各種子の表現型は同じ確率モデルから独立に観測されたものとする。観測された比率が理論比率 9:3:3:1 に適合しているかを検定するため、カイ二乗検定統計量 χ² の値を求め、有意水準5%で検定を行いなさい。ただし、自由度3のカイ二乗分布における上側5%臨界値は χ²_0.05(3) = 7.815 とします。",
    frequencyTable: {
      caption: "エンドウ豆の表現型の観測度数",
      columns: ["表現型", "理論比率", "観測度数 (O_i)"],
      rows: [
        ["丸・黄", "9", "100"],
        ["丸・緑", "3", "25"],
        ["しわ・黄", "3", "30"],
        ["しわ・緑", "1", "5"],
        ["合計", "16", "160"]
      ]
    },
    givenValues: [
      { label: "総観察数 (N)", value: "160" },
      { label: "理論比率", value: "9 : 3 : 3 : 1 (合計 16)" },
      { label: "カテゴリ数 (k)", value: "4" },
      { label: "自由度3のカイ二乗分布上側5%臨界値", value: "7.815" }
    ],
    solutionSteps: [
      {
        label: "各表現型の期待度数（E_i）の算出",
        expression: "丸・黄: 160 * (9/16) = 90, 丸・緑: 160 * (3/16) = 30, しわ・黄: 160 * (3/16) = 30, しわ・緑: 160 * (1/16) = 10",
        description: "理論比率に基づいて全体の160粒を按分します。最小期待度数は10で、すべて5以上という通常の目安を満たしているため、カイ二乗近似を用います。"
      },
      {
        label: "各カテゴリのカイ二乗項 (O_i - E_i)² / E_i の計算",
        expression: "丸・黄: (100 - 90)² / 90 = 100 / 90 = 10/9 ≒ 1.111\n丸・緑: (25 - 30)² / 30 = 25 / 30 = 5/6 ≒ 0.833\nしわ・黄: (30 - 30)² / 30 = 0 / 30 = 0.000\nしわ・緑: (5 - 10)² / 10 = 25 / 10 = 5/2 = 2.500",
        description: "各カテゴリについて観測値と期待値の差（残差）を2乗し、期待度数で割ります。"
      },
      {
        label: "検定統計量 χ² の合算と自由度の決定",
        expression: "χ² = 10/9 + 5/6 + 0 + 5/2 = 40/9 ≒ 4.444, ν = k - 1 = 4 - 1 = 3",
        description: "全項を合計すると χ² = 40/9 ≒ 4.44 となります。カテゴリ数が k = 4 で総和が固定されているため、自由度は k - 1 = 3 となります。"
      },
      {
        label: "仮説検定の判断",
        expression: "χ² = 4.44 < 7.815（帰無仮説を棄却しない）",
        description: "算出された検定統計量 4.44 は臨界値 7.815 を下回り、p値は約0.217です。帰無仮説を棄却せず、この標本からは分離比が 9:3:3:1 と異なるとの統計的証拠は得られません。理論比が真であると証明した結果ではありません。"
      }
    ],
    solutionTable: {
      caption: "カイ二乗適合度検定の計算表",
      columns: ["表現型", "観測度数 O_i", "期待度数 E_i", "偏差 O_i - E_i", "(O_i - E_i)² / E_i"],
      rows: [
        ["丸・黄", "100", "90", "+10", "1.111"],
        ["丸・緑", "25", "30", "-5", "0.833"],
        ["しわ・黄", "30", "30", "0", "0.000"],
        ["しわ・緑", "5", "10", "-5", "2.500"],
        ["合計", "160", "160", "0", "4.444"]
      ]
    },
    finalAnswer: "検定統計量は χ² = 40/9 ≒ 4.44（自由度3、p ≒ 0.217）である。臨界値 7.815 を下回るため帰無仮説を棄却せず、この標本からは観測比率が理論比率 9:3:3:1 と異なるとの統計的証拠は得られない。理論比が真であると証明した結果ではない。",
    distractors: [
      {
        value: "χ² = 7.00（分母を観測度数 O_i にして計算した場合）",
        reason: "各項の分母を期待度数 E_i ではなく観測度数 O_i にしてしまう誤りです。カイ二乗統計量の分母は必ず理論期待値 E_i です。"
      },
      {
        value: "自由度を 159 （N - 1）として検定する誤り",
        reason: "サンプルサイズ N から 1 を引いてしまう誤りです。適合度検定の自由度はサンプルサイズではなく、カテゴリ数から 1 を引いた k - 1 となります。"
      },
      {
        value: "期待度数が 5 未満のカテゴリが存在してもそのまま検定を適用できるという誤解",
        reason: "期待度数が小さいとカイ二乗近似の精度が悪化します。カテゴリの統合は科学的に妥当な場合に限り、適合度検定では正確な多項検定やモンテカルロ法なども検討します。"
      }
    ],
    relatedGuideSlugs: ["anova-and-chi-square", "distribution-selection"],
    appLinks: [
      { title: "分野別ドリルで「カイ二乗検定」を演習する", url: "https://bearworks.uk/toukei/drill" },
      { title: "チートシートで確率分布を確認する", url: "https://bearworks.uk/toukei/cheatsheet" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-05",
    reviewedAt: "2026-09-05",
    provenance: toukeiProblemBatch3Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "NIST：Chi-Square Goodness-of-Fit Test", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35f.htm" }
    ]
  },
  {
    slug: "adjusted-r-squared",
    title: "重回帰分析における自由度調整済み決定係数の算出と性質",
    description: "重回帰モデルのサンプルサイズ、説明変数数、単純決定係数から自由度調整済み決定係数を算出し、モデル選択における意義を理解します。",
    concepts: ["重回帰分析", "自由度調整済み決定係数", "決定係数", "過学習", "モデル選択"],
    question: "ある地域における中古マンションの成約価格（万円）を目的変数とし、4つの説明変数（専有面積、築年数、最寄り駅徒歩分数、所在階数）を用いて重回帰分析を行った。サンプルサイズは n = 25 であり、得られた単純決定係数は R² = 0.70（70.0%）であった。この重回帰モデルにおける自由度調整済み決定係数 R*² の値を求めなさい。また、単純決定係数と自由度調整済み決定係数の関係に関する記述として正しい解釈を選びなさい。",
    givenValues: [
      { label: "サンプルサイズ (n)", value: "25" },
      { label: "説明変数の数 (k)", value: "4" },
      { label: "単純決定係数 (R²)", value: "0.70" }
    ],
    solutionSteps: [
      {
        label: "自由度の特定",
        expression: "全体の自由度: n - 1 = 25 - 1 = 24\n残差の自由度: n - k - 1 = 25 - 4 - 1 = 20",
        description: "全体の平方和（総平方和）の自由度は n - 1、回帰モデルの残差平方和の自由度はサンプルサイズから説明変数数 k と定数項 1 を引いた n - k - 1 となります。"
      },
      {
        label: "自由度調整の比率の計算",
        expression: "(n - 1) / (n - k - 1) = 24 / 20 = 1.20",
        description: "このモデルでは説明変数が4個あり、残差自由度が全体の自由度より小さいため、未説明の割合 (1 - R²) に乗じるペナルティ係数は 1 より大きくなります。"
      },
      {
        label: "自由度調整済み決定係数 R*² の算出",
        expression: "R*² = 1 - [(n - 1) / (n - k - 1)] * (1 - R²) = 1 - 1.20 * (1 - 0.70) = 1 - 1.20 * 0.30 = 1 - 0.36 = 0.64 (64.0%)",
        description: "単純決定係数 R² = 0.70 に対し、自由度によるペナルティを反映した結果、自由度調整済み決定係数は 0.64（64.0%）となります。"
      },
      {
        label: "指標の解釈",
        expression: "R*² = 0.64 < R² = 0.70",
        description: "定数項を含む同じデータの回帰モデルでは、説明変数を追加するとR²は低下しませんが、R*²は追加変数の寄与が小さいと低下し得ます。R*²だけで因果関係、予測精度、モデルの妥当性が保証されるわけではなく、残差診断や外部データでの予測評価も必要です。"
      }
    ],
    finalAnswer: "自由度調整済み決定係数は R*² = 0.64（64.0%）である。説明変数を追加すると単純決定係数 R² は決して減少しないが、追加した変数の説明力が不十分な場合は自由度のペナルティにより R*² が減少することがある。",
    distractors: [
      {
        value: "R*² = 0.75（比率を逆にして 1 - (20/24) * 0.30 = 0.75 と計算した場合）",
        reason: "自由度の比を逆転させてしまう誤りです。自由度調整済み決定係数が単純決定係数（0.70）を上回ることは数学的にあり得ません（R*² ≤ R²）。"
      },
      {
        value: "R*² ≒ 0.657（残差自由度から定数項を引き忘れて n - k = 21 とした場合）",
        reason: "定数項を含む回帰モデルでは残差自由度は n - k - 1 です。定数項の自由度を差し引き忘れると誤った値になります。"
      },
      {
        value: "説明変数を追加すれば R*² も必ず増加するという解釈",
        reason: "単純決定係数 R² は無関係な変数を追加しても決して減少しませんが、R*² は変数の寄与が小さければペナルティにより減少します。"
      }
    ],
    relatedGuideSlugs: ["regression-interpretation"],
    appLinks: [
      { title: "分野別ドリルで「回帰分析」を演習する", url: "https://bearworks.uk/toukei/drill" },
      { title: "学習ガイドで「回帰分析の解釈」を読む", url: "https://bearworks.uk/toukei/guides/regression-interpretation" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-05",
    reviewedAt: "2026-09-05",
    provenance: toukeiProblemBatch3Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "statsmodels：自由度調整済み決定係数の定義", url: "https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.OLSResults.rsquared_adj.html" }
    ]
  },
  {
    slug: "chi-square-variance-confidence-interval",
    title: "カイ二乗分布を用いた母分散の95%信頼区間の算出",
    description: "正規母集団から得られた標本不偏分散を用いてカイ二乗統計量を構成し、母分散および母標準偏差に対する信頼区間を導出します。",
    concepts: ["母分散の推定", "信頼区間", "カイ二乗分布", "不偏分散", "非対称性"],
    question: "ある精密機械メーカーで製造される金属ピンの直径のばらつきを管理するため、正規分布に従う母集団から n = 16 本のサンプルを無作為に抽出した。測定の結果、標本の不偏分散は s² = 25.0 mm²（標本標準偏差 s = 5.0 mm）であった。この部品の母分散 σ² に対する95%信頼区間を求めなさい。ただし、下付き文字を上側確率とする記法を用い、自由度15のカイ二乗分布の上側97.5%点（下側累積確率2.5%点）は χ²_0.975(15) = 6.262、上側2.5%点（下側累積確率97.5%点）は χ²_0.025(15) = 27.488 とします。",
    givenValues: [
      { label: "標本サイズ (n)", value: "16" },
      { label: "標本不偏分散 (s²)", value: "25.0 mm²" },
      { label: "自由度 (ν = n - 1)", value: "15" },
      { label: "カイ二乗分布の下側2.5%点 χ²_0.975(15)", value: "6.262" },
      { label: "カイ二乗分布の上側2.5%点 χ²_0.025(15)", value: "27.488" }
    ],
    solutionSteps: [
      {
        label: "偏差平方和 S の計算",
        expression: "S = (n - 1) * s² = 15 * 25.0 = 375.0 mm²",
        description: "不偏分散 s² に自由度 n - 1 を乗じることで、偏差平方和（Sum of Squares）を求めます。"
      },
      {
        label: "カイ二乗統計量と信頼区間の関係式の構築",
        expression: "χ²_0.975(15) ≤ (n - 1)s² / σ² ≤ χ²_0.025(15) \iff 6.262 ≤ 375.0 / σ² ≤ 27.488",
        description: "正規分布からの標本において、統計量 (n - 1)s² / σ² は自由度 n - 1 のカイ二乗分布に従います。確率 95% でこの統計量が下側2.5%点と上側2.5%点の間に入ります。"
      },
      {
        label: "不等式の反転による母分散 σ² の上下限の算出",
        expression: "下限: 375.0 / 27.488 ≒ 13.64 mm²\n上限: 375.0 / 6.262 ≒ 59.88 mm²",
        description: "逆数を取ると不等号の向きが反転するため、信頼区間の下限にはカイ二乗分布の『上側臨界値』、上限には『下側臨界値』が分母に来ます。これにより 13.64 mm² ≤ σ² ≤ 59.88 mm² となります。"
      },
      {
        label: "母標準偏差への換算と区間の解釈",
        expression: "√13.64 ≒ 3.69 mm, √59.88 ≒ 7.74 mm",
        description: "正の範囲で平方根は単調増加なので、分散区間の両端の平方根が母標準偏差の95%信頼区間になります。同じ標本抽出と区間計算を繰り返したとき、作られる区間の95%が一定の母分散を含むという意味であり、この特定区間に母分散が入る確率が95%という意味ではありません。"
      }
    ],
    finalAnswer: "母分散 σ² に対する95%信頼区間は 13.64 mm² 〜 59.88 mm² （小数第1位まで丸めると 約13.6 mm² 〜 59.9 mm²）である。母標準偏差 σ の区間に換算すると 約3.69 mm 〜 7.74 mm となる。",
    distractors: [
      {
        value: "下限 59.88 mm², 上限 13.64 mm²（逆数を取るときに臨界値の位置を入れ替え忘れた場合）",
        reason: "不等式の逆数を取る際に不等号の向きを反転させ忘れる典型ミスです。上側2.5%点（27.488）で割ったものが下限、下側2.5%点（6.262）で割ったものが上限になります。"
      },
      {
        value: "s² ± 1.96 * SE のように正規分布を用いて対称な区間を計算する誤り",
        reason: "母分散の標本分布はカイ二乗分布に従い、非対称です。正規分布のような左右対称の区間推定公式は適用できません。"
      },
      {
        value: "偏差平方和の計算で n - 1 ではなく n を掛けてしまう誤り",
        reason: "標本分散ではなく不偏分散 s² を使用しているため、自由度 n - 1 = 15 を乗じる必要があります。"
      }
    ],
    relatedGuideSlugs: ["distribution-selection", "hypothesis-testing-basics"],
    appLinks: [
      { title: "分野別ドリルで「推定」を練習する", url: "https://bearworks.uk/toukei/drill" },
      { title: "チートシートでカイ二乗分布を確認する", url: "https://bearworks.uk/toukei/cheatsheet" }
    ],
    author: "kuma / bearworks.uk",
    publishedAt: "2026-09-05",
    reviewedAt: "2026-09-05",
    provenance: toukeiProblemBatch3Provenance,
    references: [
      { title: "統計検定2級公式出題範囲", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "NIST：Confidence Limits for the Population Variance", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda358.htm" }
    ]
  }
];
