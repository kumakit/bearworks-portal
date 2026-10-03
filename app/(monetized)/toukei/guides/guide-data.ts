import type { ContentProvenance } from "@/lib/content-provenance";
import { toukeiGuideProvenance } from "@/lib/content-provenance";

export interface Reference {
  title: string;
  url: string;
}

export interface Section {
  heading: string;
  text: string;
}

export interface CommonMistake {
  mistake: string;
  reason: string;
}

export interface AppLink {
  title: string;
  url: string;
}

export type GuideSlug =
  | "learning-roadmap"
  | "cbt-time-management"
  | "hypothesis-testing-basics"
  | "choosing-statistical-tests"
  | "distribution-selection"
  | "regression-interpretation"
  | "anova-and-chi-square"
  | "sampling-and-bias";

export interface Guide {
  slug: GuideSlug;
  title: string;
  description: string;
  question: string;
  publishedAt: string;
  reviewedAt: string;
  author: string;
  provenance: ContentProvenance;
  references: Reference[];
  sections: Section[];
  commonMistakes: CommonMistake[];
  relatedGuides: GuideSlug[];
  appLinks: AppLink[];
}

export const guides: Guide[] = [
  {
    slug: "learning-roadmap",
    title: "統計検定2級の学習ロードマップ。何から、どの順で進めるか。",
    description: "統計検定2級の学習を始める人向けに、6〜8週間の計画例と、理解度に応じて調整する復習方法を説明します。",
    question: "統計学の基礎と演習を、今の理解度に合わせてどの順番で進めるか？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ],
    sections: [
      {
        heading: "6〜8週間の学習計画例",
        text: "週に一定の学習時間を確保できる場合の一例です。開始前に例題を数問解き、既に理解している分野を飛ばすか、基礎に時間をかけるか決めます。\n\n・第1〜2週：平均、分散、標準偏差と基礎的な確率。公式の条件も説明できるか確認します。\n\n・第3〜4週：標本分布と推定。区間推定で分母と前提を確かめます。\n\n・第5〜6週：仮説検定、分散分析、回帰。検定の選択理由と結果から言えないことも説明します。\n\n・第7〜8週：時間を計った演習と復習。週末に誤答を「計算・前提・解釈」に分類し、正答できない分野へ次週の時間を移します。必要な期間は事前知識と学習時間で変わります。"
      },
      {
        heading: "解く→解釈→復習のサイクル",
        text: "時間を計る演習だけでなく、方法を選んだ理由を言葉にする練習もできます。\n\n1. 問題を解く：まずは解法と計算過程を残します。\n\n2. 誤りを分類する：計算ミス、検定方法の選択、問題文の読み違いを区別します。\n\n3. 弱点を復習する：該当するガイドを読み直し、別の例題で同じ判断ができるか試します。毎週の結果を見て計画を調整してください。"
      }
    ],
    commonMistakes: [
      {
        mistake: "公式の暗記だけで模擬試験や本番へ進むこと。",
        reason: "統計検定2級では、公式に数値を当てはめて計算するだけでなく、「その検定手法を選択した理由」や「得られた結果の統計的意味」が問われます。公式の丸暗記だけでは、問題の前提（対応のあるデータか否か、等分散か否かなど）が少し変わっただけで対応できなくなってしまいます。"
      }
    ],
    relatedGuides: ["cbt-time-management", "hypothesis-testing-basics"],
    appLinks: [
      { title: "CBT模擬試験に挑戦する", url: "https://toukei.bearworks.uk/exam" },
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "学習分析ダッシュボードを見る", url: "https://toukei.bearworks.uk/dashboard" }
    ]
  },
  {
    slug: "cbt-time-management",
    title: "90分CBT模擬試験の時間配分と見直し方。",
    description: "本サイトの90分・35問想定のCBT模擬試験で試す時間配分と見直し方法。本番の仕様は公式案内で確認してください。",
    question: "本サイトの模擬試験で、限られた時間をどう配分し、見直しに使う時間を確保するか？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" }
    ],
    sections: [
      {
        heading: "時間予算の配分：1問2〜2.5分の重要性",
        text: "本サイトの模擬試験を「90分・35問」で使う場合の練習用配分です。本番の問題数、並び、配点、画面操作を保証するものではありません。単純平均は約2.57分/問ですが、見直し時間を残すため、次の例を試せます。\n\n・前半15問：30分（平均2分/問）\n・後半20問：45分（平均2.25分/問）\n・見直しと予備：15分\n\n30+45+15=90分です。問題の難易度や自分の得意分野に応じて配分を変えてください。"
      },
      {
        heading: "「見直しフラグ」機能の戦略的活用法",
        text: "本サイトの模擬試験で見直しの印を付けられる場合は、時間を使いすぎた問題を記録して先へ進む練習ができます。最後まで見た後、残り時間で印を付けた問題を再考します。本番の見直し操作や画面仕様は受験前に公式案内で確認してください。"
      },
      {
        heading: "難問への固執を防ぐマインドセット",
        text: "練習では、解法が浮かばない問題に時間を使いすぎたら次へ進み、最後に戻る方法を試せます。問題ごとの配点は本稿では仮定しません。まず全体に目を通せる配分かを模擬試験で確認しましょう。"
      }
    ],
    commonMistakes: [
      {
        mistake: "わからない問題や複雑な計算にその場で固執し、全問に目を通せないこと。",
        reason: "本サイトの模擬試験では、解けない問題に時間を使いすぎないよう残り時間を確認し、あとで戻る方法を試せます。ただし本番の画面表示や移動方法は公式案内で確認してください。練習では一通り問題を見る時間を確保し、難問に戻る余裕があるかを振り返ります。"
      }
    ],
    relatedGuides: ["learning-roadmap"],
    appLinks: [
      { title: "CBT模擬試験に挑戦する", url: "https://toukei.bearworks.uk/exam" },
      { title: "学習分析ダッシュボードを見る", url: "https://toukei.bearworks.uk/dashboard" }
    ]
  },
  {
    slug: "hypothesis-testing-basics",
    title: "p値・有意水準・信頼区間をどう区別するか。",
    description: "仮説検定における帰無仮説の考え方、p値と有意水準の比較による判断プロセス、そして信頼区間との本質的な違いと正しい解釈。",
    question: "「有意差あり」と判断する基準や、p値と信頼区間の本質的な違いとは何か？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "ASA: Statement on Statistical Significance and P-Values", url: "https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf" },
      { title: "NIST: Confidence Limits for the Mean", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm" }
    ],
    sections: [
      {
        heading: "帰無仮説と対立仮説の設定",
        text: "仮説検定では、検証する基準となる帰無仮説（H0）と、対立仮説（H1）をデータを見る前に定めます。平均点を比較する例なら、H0を「母平均の差は0」、H1を「母平均の差は0ではない」とする両側検定が考えられます。「新しいアプリの方が高い」と方向を決めるなら片側検定です。\n\n検定でH0を棄却してもH1が証明されたわけではありません。どの集団をどう集めたか、差の大きさ、測定上の偏りを合わせて判断します。"
      },
      {
        heading: "p値と有意水準（α）の正しい判断ルール",
        text: "p値は、H0と検定に用いたモデルの前提が成り立つとき、観測した検定統計量と同じかそれ以上に極端な値が得られる確率です。H0が真である確率や、結果が偶然だけで生じた確率ではありません。\n\n有意水準（α）はデータを見る前に決める判定基準です。p値がα以下なら設定した手順でH0を棄却し、上回れば棄却できません。棄却できないことも「差がない」の証明ではありません。例えばp=0.03、α=0.05なら手順上は棄却しますが、効果の大きさや実用上の重要性は別に確認します。"
      },
      {
        heading: "信頼区間と仮説検定の数学的な結びつき",
        text: "頻度論の95%信頼区間は、同じ方法で標本抽出と区間計算を繰り返したとき、長期的に約95%の区間が固定された真の母数を含むよう設計された手順です。得られた一つの区間に母数が95%の確率で入る、とは読みません。\n\n同じモデル・同じ両側検定と対応する95%信頼区間を使う場合、差の区間が0を含まなければ5%水準でH0を棄却します。0を含むなら棄却できません。区間の作り方と検定が異なる場合は、この対応を機械的に当てはめません。"
      }
    ],
    commonMistakes: [
      {
        mistake: "p値を「帰無仮説が正しい確率」と解釈してしまうこと。",
        reason: "p値は「帰無仮説が正しいという条件（前提）のもとで、手元のデータまたはそれ以上に極端な結果が得られる確率」であって、「帰無仮説そのものが正しい確率」ではありません。これは条件付き確率の前提と結果を取り違える誤解であり、検定の論理を根本から誤って解釈することにつながります。"
      }
    ],
    relatedGuides: ["choosing-statistical-tests", "distribution-selection"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで確認する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ]
  },
  {
    slug: "choosing-statistical-tests",
    title: "問題文から検定方法をどう選ぶか。",
    description: "データの尺度（カテゴリ・数値）、群の数、対応の有無に基づき、適切な検定（t検定、F検定、分散分析、カイ二乗検定など）を選ぶための判断基準。",
    question: "問題の設定やデータの性質から、どの検定手法を適用すべきかを見極めるには？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "Penn State STAT 800: Hypothesis Testing", url: "https://online.stat.psu.edu/stat800/Lesson05" }
    ],
    sections: [
      {
        heading: "変数と目的による検定手法の分類",
        text: "検定方法はデータの尺度だけでなく、独立性、対応、分布や分散の前提、標本数から選びます。\n\n1. 数値データ\n・1群の平均：独立な観測で母分散が未知なら1標本t検定を検討します。小標本での厳密な手順には正規性の仮定が必要です。\n・独立な2群の平均：分散が等しいと決めずにWelchのt検定を候補にします。等分散を仮定する場合はpooled t検定です。\n・対応のある2群：各対の差について1標本t検定を考えます。\n・3群以上の平均：独立性、残差の分布、等分散性を確認して一元配置分散分析を検討します。\n・2群の分散：正規性などの前提を確認してF検定を検討します。\n\n2. カテゴリデータ\n・想定比率との比較：カイ二乗適合度検定。\n・2属性の関連：分割表によるカイ二乗独立性検定。期待度数が小さい場合は近似の妥当性を確認し、2×2表ならFisherの正確検定なども検討します。"
      },
      {
        heading: "検定選択の判断表",
        text: "まず「同じ人を繰り返し測ったか」「群同士は独立か」を確認します。独立な2群の平均ならWelchのt検定を基本候補とし、等分散を仮定する設問ならpooled t検定の式を使います。対応があれば対ごとの差を扱います。3群以上なら一元配置分散分析の前提を確認します。カテゴリの度数なら期待度数を計算し、カイ二乗近似を使えるか確かめます。問題文だけで前提が確定しないときは、手法も断定しません。"
      },
      {
        heading: "「対応の有無」による検定式と自由度の違い",
        text: "対応なしの独立2群で、等分散を仮定したpooled t検定の自由度は nA+nB−2 です。等分散を仮定しないWelchのt検定は標本分散と標本数から近似自由度を求め、通常この式にはなりません。対応ありなら各人の前後差 d を作り、その差の1標本t検定を行います。対の数を n とすると自由度は n−1 です。数式を選ぶ前に対応と等分散の前提を確かめましょう。"
      }
    ],
    commonMistakes: [
      {
        mistake: "平均値の比較（数値データ）と、割合・比率の比較（カテゴリデータ）を混同すること。",
        reason: "例えば「グループAとBでテストの平均点（数値データ）に差があるか」を調べたいときはt検定を用いますが、「グループAとBでテストの合格率（合格・不合格のカテゴリデータ）に差があるか」を調べるときは比率の差の検定やカイ二乗検定を用います。比較したい対象が『平均』か『比率』かを整理せずに公式に当てはめようとすると、間違った統計量を計算してしまいます。"
      }
    ],
    relatedGuides: ["hypothesis-testing-basics", "anova-and-chi-square"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで確認する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ]
  },
  {
    slug: "distribution-selection",
    title: "どの確率分布を使うか。",
    description: "二項分布、ポアソン分布、正規分布から、t分布、カイ二乗分布、F分布まで、統計問題で登場する確率分布の特徴と適切な使い分け。",
    question: "問題の文脈から、どの確率分布の性質や数表を適用すべきか？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "Penn State STAT 504: Introduction to Discrete Data", url: "https://online.stat.psu.edu/stat504/Lesson01" },
      { title: "NIST: Gallery of Distributions（t・カイ二乗・F分布）", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm" }
    ],
    sections: [
      {
        heading: "離散確率分布：二項分布とポアソン分布",
        text: "回数を扱う代表的な離散分布です。\n\n・二項分布：成功確率pが共通で独立な試行をN回行う場合の成功回数です。期待値はNp、分散はNp(1−p)です。\n\n・ポアソン分布：一定の時間・空間における発生回数のモデルです。平均的な発生率が一定で、離れた区間の回数が独立であるなどの条件を置きます。区間内の期待回数をλとすると、期待値と分散はλです。実データで過分散や時間による率の変化がないかも確認します。"
      },
      {
        heading: "連続確率分布：正規分布とt分布",
        text: "・正規分布：平均μ、分散σ²を持つ左右対称の分布です。独立な観測の標本平均には、元の分布や標本数に応じて中心極限定理による正規近似を使うことがあります。\n\n・t分布：独立な正規母集団の標本で母分散が未知なら、標本平均を標本標準偏差で標準化した統計量が厳密にt分布に従います。小標本で母集団の形が大きく異なる場合は、母分散が未知というだけで厳密なt分布とは言えません。"
      },
      {
        heading: "平方和と比の分布：カイ二乗分布とF分布",
        text: "・カイ二乗分布：互いに独立な標準正規変数の二乗和が従う分布です。自由度に応じて形が変わり、値は0以上です。正規母集団の分散に関する推測では厳密に現れます。度数データの適合度・独立性の検定では、条件が満たされる場合の近似分布として使います。\n\n・F分布：独立な二つのカイ二乗変数をそれぞれの自由度で割り、その比を取った分布です。正規性などの前提の下で分散比やANOVAに使います。"
      }
    ],
    commonMistakes: [
      {
        mistake: "データのばらつき（母分散）が未知の小標本であるにもかかわらず、正規分布を一律に適用してしまうこと。",
        reason: "独立な正規母集団の小標本で母分散が未知なら、平均の標準化にt分布を使います。正規分布の臨界値を一律に使うと区間や判定が変わり得ます。一方、元の分布や依存性を確認せずにt分布が厳密に成り立つとも言えません。"
      }
    ],
    relatedGuides: ["choosing-statistical-tests", "hypothesis-testing-basics"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで確認する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ]
  },
  {
    slug: "regression-interpretation",
    title: "回帰係数・残差・決定係数をどう読むか。",
    description: "単回帰分析における傾き（回帰係数）、予測値と実績値の差（残差）、モデルの説明力を示す決定係数（R²）の正しい数学的解釈。",
    question: "回帰分析のアウトプットから、変数の関係性や予測精度をどう評価すればよいか？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "Penn State STAT 462: Cross-validation", url: "https://online.stat.psu.edu/stat462/node/200/" }
    ],
    sections: [
      {
        heading: "架空データによる単回帰分析の計算例",
        text: "単回帰モデルの理解を深めるため、「1日の学習時間（X：時間）」と「テストの得点（Y：点）」に関する5人分の架空データで回帰方程式を手計算する流れを示します。\n\n【5人のデータ点 (X, Y)】\n・Aさん (1, 40)\n・Bさん (2, 50)\n・Cさん (3, 70)\n・Dさん (4, 70)\n・Eさん (5, 90)\n\nまず平均値を計算します。\n・Xの平均： (1 + 2 + 3 + 4 + 5) / 5 = 3 時間\n・Yの平均： (40 + 50 + 70 + 70 + 90) / 5 = 64 点\n\n回帰式の傾き（回帰係数 β）を計算するため、Xの偏差平方和（分母）と、XとYの共分散の分子にあたる偏差の積の和（分子）を求めます。\n\n・Xの偏差平方和：\n(1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)² = 4 + 1 + 0 + 1 + 4 = 10\n\n・XとYの偏差の積の和：\n(1-3)(40-64) + (2-3)(50-64) + (3-3)(70-64) + (4-3)(70-64) + (5-3)(90-64)\n= (-2)(-24) + (-1)(-14) + 0 + (1)(6) + (2)(26)\n= 48 + 14 + 0 + 6 + 52 = 120\n\n・傾き（回帰係数 β）：\n120 / 10 = 12\n\n・切片 α：\nYの平均 - β × Xの平均 = 64 - 12 × 3 = 28\n\nよって、推定された単回帰方程式は「Yの予測値 = 12 × X + 28」となります。"
      },
      {
        heading: "残差と決定係数（R²）の計算",
        text: "回帰式の予測値と、手元の5人分の得点との差を計算します。\n\n【予測値と残差 (e = 実績値 - 予測値)】\n・Aさん：予測値40点、実績値40点 → 残差0点\n・Bさん：予測値52点、実績値50点 → 残差−2点\n・Cさん：予測値64点、実績値70点 → 残差+6点\n・Dさん：予測値76点、実績値70点 → 残差−6点\n・Eさん：予測値88点、実績値90点 → 残差+2点\n\n切片を含む最小二乗回帰なので残差の和は0です。残差平方和は0²+2²+6²+6²+2²=80、Yの全平方和は1520です。したがってR²=1−80/1520=18/19≈0.9474です。これは、この架空の5点の得点の変動に対する当てはまりを表します。5点だけで新しい人への予測精度や学習時間の因果効果は評価できません。"
      },
      {
        heading: "回帰係数と相関係数の符号の数学的一致",
        text: "XとYにともにばらつきがある単回帰では、回帰係数と相関係数の符号は一致します。回帰係数の分子はXとYの共分散（偏差の積の和）で、分母はXの偏差平方和（この条件では正）だからです。相関係数も同じ共分散を分子に使います。XまたはYが一定なら係数や相関係数を通常どおり定義できないため、この関係を機械的に当てはめません。"
      }
    ],
    commonMistakes: [
      {
        mistake: "高い決定係数（R²）をもって、二変数間に直接的な因果効果がある、あるいはモデルが未知のデータに対して常に正確に予測できると確信すること。",
        reason: "決定係数はあくまで「手元にあるデータの変動を回帰式がどれだけ説明できているか」という適合度を示すだけであり、Xが原因でYが結果であるという因果関係を証明するものではありません。第三の共通の要因による見せかけの相関（疑似相関）でもR²は高くなります。また、手元のデータに合わせすぎて過学習（オーバーフィッティング）を起こしている場合、新しいデータに対する予測精度は著しく低下します。"
      }
    ],
    relatedGuides: ["choosing-statistical-tests", "anova-and-chi-square"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "学習分析ダッシュボードを見る", url: "https://toukei.bearworks.uk/dashboard" }
    ]
  },
  {
    slug: "anova-and-chi-square",
    title: "分散分析とカイ二乗検定をどう使い分けるか。",
    description: "3群以上の平均値の差を比較する分散分析（ANOVA）と、属性間の関連性を調べる独立性のカイ二乗検定の適用シーンと計算プロセスの違い。",
    question: "平均値の多重比較と、比率やカテゴリの相関分析を混同せず適切に分類するには？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "Penn State STAT 502: ANOVA Foundations", url: "https://online.stat.psu.edu/stat502/Lesson02" },
      { title: "Penn State STAT 504: Two-Way Tables and Independence", url: "https://online.stat.psu.edu/stat504/Lesson03" }
    ],
    sections: [
      {
        heading: "一元配置分散分析（ANOVA）：3群以上の平均値比較",
        text: "「勉強スタイル（A群：テキスト中心、B群：アプリ中心、C群：講義動画中心）」という3つのグループ間で、テストの「平均点（数値データ）」に統計的な差があるかを検定したいとします。このように3群以上の平均値を比較する場合に用いるのが「一元配置分散分析（ANOVA）」です。\n\n全体としてのばらつきを「グループによる変動（効果による平方和）」と「グループ内の個人差（残差による平方和）」に分解します。そして、「効果によるばらつき」が「残差によるばらつき」に比べて十分に大きいかどうかを、それらの不偏分散の比（F値）をとることで評価します。\n\n仮にF値が臨界値を超えていれば、「3つの勉強スタイルのうち、少なくともいずれか1つのペアの間には、平均点に有意な差がある」と判断します。"
      },
      {
        heading: "カイ二乗検定（独立性の検定）：カテゴリ同士の関連",
        text: "一方で、「勉強スタイル（A群、B群）」というカテゴリと、「合否（合格、不合格）」というカテゴリの間に、何らかの関連性があるかどうか（独立であるか）を調べたいとします。このように、数値の平均ではなく「人数や回数（頻度）」のクロス集計表（分割表）をもとに分析を行うのが「カイ二乗独立性検定」です。\n\nこの検定では、「もし2つの変数が完全に無関係（独立）であるならば、確率的にこれくらいの人数になるはずだ」という「期待度数」を計算し、実際の「観測度数」とどれだけズレているかを評価します。ズレの大きさを表すカイ二乗統計量を算出し、それがカイ二乗分布の臨界値より大きければ、「2つの属性は独立ではなく、関連がある」と結論づけます。"
      },
      {
        heading: "期待度数の具体的な計算例",
        text: "独立性の検定で基本となる「期待度数」の求め方を簡単な数値で説明します。\n\nいま、Aスタイルで学んだ人が50人、Bスタイルで学んだ人が50人、計100人の被験者がいます。テストの結果、全体で60人が合格し、40人が不合格になりました。\n\nもし「勉強スタイル」と「合否」が完全に独立（無関係）である場合、Aスタイルを選んだ50人のうち合格する人数は、全体の合格率（60/100 = 60%）と同じ割合になるはずです。\n\n・Aスタイルの合格者の期待度数 = 50人 × (60 / 100) = 30人\n・Aスタイルの不合格者の期待度数 = 50人 × (40 / 100) = 20人\n・Bスタイルの合格者の期待度数 = 50人 × (60 / 100) = 30人\n・Bスタイルの不合格者の期待度数 = 50人 × (40 / 100) = 20人\n\nこの期待度数（全員30人または20人）と、実際のアンケート結果から得られた観測度数の差を2乗し、期待度数で割ったものの総和がカイ二乗統計量になります。ズレが大きいほど、独立という仮定から遠ざかるため、有意に関連しているとみなされます。"
      }
    ],
    commonMistakes: [
      {
        mistake: "3群以上の平均値を比較する際に、分散分析を行わず、2群ずつのt検定を何度も繰り返してしまうこと。",
        reason: "各比較を5%水準で行うと、複数の比較全体で少なくとも1件を誤って有意とする確率が高まります。3回の検定が互いに独立なら 1−0.95³≈14.3% ですが、同じ群を共有するペア比較は一般に独立ではなく、この値をそのまま当てはめられません。群間のどこに差があるか調べるときは、ANOVAの前提を確認したうえで、目的に応じてTukey法やBonferroni法など多重性を考慮した方法を使います。"
      }
    ],
    relatedGuides: ["choosing-statistical-tests", "regression-interpretation"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "チートシートで確認する", url: "https://toukei.bearworks.uk/cheatsheet" }
    ]
  },
  {
    slug: "sampling-and-bias",
    title: "標本抽出・バイアス・調査設計をどう確認するか。",
    description: "統計的な推測の前提となる標本抽出の設計と、自己選択バイアスや回収漏れなどによって生じる歪みの理解。",
    question: "標本の集め方と回収漏れを確認し、推定に残る偏りをどう説明するか？",
    publishedAt: "2026-07-11",
    reviewedAt: "2026-10-03",
    author: "kuma / bearworks.uk",
    provenance: toukeiGuideProvenance,
    references: [
      { title: "統計検定2級公式ページ", url: "https://www.toukei-kentei.jp/grade/grade2/" },
      { title: "公式テキスト・問題集案内", url: "https://www.toukei-kentei.jp/preparation/books/" },
      { title: "Penn State STAT 506: Sampling Theory and Methods", url: "https://online.stat.psu.edu/stat506/Lesson01" }
    ],
    sections: [
      {
        heading: "標本抽出の設計：対象集団との関係を確かめる",
        text: "母集団について推定するには、対象者の選び方、回答しなかった人、推定に置いた仮定を明示します。確率標本による設計ベースの推定では、抽出確率が分かることが重要です。\n\n・単純無作為抽出：大きさnの標本のすべての組み合わせが同じ確率で選ばれる設計です。各個体の選択確率が等しいことだけでは定義として十分ではありません。\n\n・層化抽出：母集団を層に分け、各層で定めた確率設計で抽出します。層の大きさや抽出割合に応じた重み付けが必要な場合があります。\n\n無作為抽出でも非回答が偏れば推定に影響します。非確率標本から推論する場合は、モデルや補正に必要な仮定を別途説明します。"
      },
      {
        heading: "回収率と自己選択がもたらす「バイアス（系統誤差）」",
        text: "自己選択型Webアンケートでは、回答するかどうかを本人が決めます。関心が強い人ほど回答しやすければ、回答者と対象集団の分布に差が出る可能性があります。ただし、必ず特定の方向に偏るとは限らず、調査の仕組みや補正可能な情報を確認します。抽出された人が回答しない非回答も別の偏りを生み得ます。"
      },
      {
        heading: "標本サイズ（N）と偏りの本質的な違い",
        text: "標本数を増やすと、同じ抽出設計と前提の下で偶然のばらつきは小さくできます。しかし、特定の層が標本に入りにくい仕組みが残るなら、数だけを増やしてもその選択偏りは自動的には消えません。大きな標本の小さな標準誤差は、代表性の保証ではありません。一方、非確率標本でも適切な補正やモデルを置ける場合があります。そのときは必要な仮定と限界を明示します。"
      }
    ],
    commonMistakes: [
      {
        mistake: "サンプルの数（標本サイズ）が多くなれば、ランダムに抽出していなくてもバイアスは打ち消されて正確な結果になると考えること。",
        reason: "標本数の増加は偶然のばらつきを減らしますが、対象集団の一部が回答しにくい仕組みを直しません。例えば特定のWebサイトで集めた1万人を国民全体へ一般化するには、そのサイトを使わない人も含めた補正やモデルの妥当性を確認する必要があります。無作為100人との優劣も、抽出枠、回収率、推定対象などを見ずに決められません。"
      }
    ],
    relatedGuides: ["learning-roadmap"],
    appLinks: [
      { title: "分野別ドリルで演習する", url: "https://toukei.bearworks.uk/drill" },
      { title: "CBT模擬試験に挑戦する", url: "https://toukei.bearworks.uk/exam" }
    ]
  }
];
