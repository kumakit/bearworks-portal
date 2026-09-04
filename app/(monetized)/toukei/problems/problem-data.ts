import type { GuideSlug } from "../guides/guide-data";
import type { ContentProvenance } from "@/lib/content-provenance";
import { toukeiProblemProvenance, toukeiProblemBatch1Provenance } from "@/lib/content-provenance";

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
  }
];
