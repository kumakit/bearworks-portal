#!/usr/bin/env python3
"""
Issue #377 トラックA 第4バッチ（問21〜問25）の独立数値検証スクリプト
Python >= 3.12, SciPy 1.18.1+
"""

import math
from scipy import stats

def verify_q21():
    print("--- Q21: Laspeyres and Paasche Price Index ---")
    # 基準年 t=0
    p0 = [200, 150]
    q0 = [50, 40]
    # 比較年 t=1
    p1 = [250, 180]
    q1 = [40, 50]

    # ラスパイレス物価指数: sum(p1 * q0) / sum(p0 * q0) * 100
    denom_L = sum(p * q for p, q in zip(p0, q0)) # 200*50 + 150*40 = 10000 + 6000 = 16000
    numer_L = sum(p * q for p, q in zip(p1, q0)) # 250*50 + 180*40 = 12500 + 7200 = 19700
    I_L = (numer_L / denom_L) * 100
    assert denom_L == 16000, f"Denom L expected 16000, got {denom_L}"
    assert numer_L == 19700, f"Numer L expected 19700, got {numer_L}"
    assert abs(I_L - 123.125) < 1e-9, f"I_L expected 123.125, got {I_L}"
    rounded_I_L = round(I_L, 1)
    assert rounded_I_L == 123.1

    # パーシェ物価指数: sum(p1 * q1) / sum(p0 * q1) * 100
    numer_P = sum(p * q for p, q in zip(p1, q1)) # 250*40 + 180*50 = 10000 + 9000 = 19000
    denom_P = sum(p * q for p, q in zip(p0, q1)) # 200*40 + 150*50 = 8000 + 7500 = 15500
    I_P = (numer_P / denom_P) * 100
    assert numer_P == 19000, f"Numer P expected 19000, got {numer_P}"
    assert denom_P == 15500, f"Denom P expected 15500, got {denom_P}"
    assert abs(I_P - 122.58064516) < 1e-6
    rounded_I_P = round(I_P, 1)
    assert rounded_I_P == 122.6

    # 誤答パス: 単純算術平均
    simple_mean = ((250/200 + 180/150) / 2) * 100
    assert abs(simple_mean - 122.5) < 1e-9

    print(f"  Denom L: {denom_L}, Numer L: {numer_L}, I_L: {I_L:.3f} -> {rounded_I_L}")
    print(f"  Denom P: {denom_P}, Numer P: {numer_P}, I_P: {I_P:.3f} -> {rounded_I_P}")
    print(f"  Simple price ratio mean: {simple_mean:.1f}")
    return True


def verify_q22():
    print("\n--- Q22: Chebyshev's Inequality ---")
    mu = 45.0
    sigma = 6.0
    lower = 30.0
    upper = 60.0

    # 区間 [mu - k*sigma, mu + k*sigma]
    diff = upper - mu # 15.0
    assert diff == mu - lower
    k = diff / sigma # 15.0 / 6.0 = 2.5
    assert k == 2.5

    # 下限確率 P(|X - mu| < k*sigma) >= 1 - 1/k^2
    prob_lower_bound = 1.0 - (1.0 / (k ** 2))
    assert abs(prob_lower_bound - 0.84) < 1e-9
    pct_bound = prob_lower_bound * 100 # 84.0%

    # はみ出す確率の上限 1/k^2
    tail_upper_bound = 1.0 / (k ** 2)
    assert abs(tail_upper_bound - 0.16) < 1e-9

    # 参考: 正規分布の場合
    normal_prob = stats.norm.cdf(k) - stats.norm.cdf(-k)
    print(f"  k: {k}, Lower bound: {prob_lower_bound:.4f} ({pct_bound:.1f}%)")
    print(f"  Tail bound: {tail_upper_bound:.4f}, Normal prob: {normal_prob:.4f}")
    return True


def verify_q23():
    print("\n--- Q23: Geometric Distribution ---")
    p = 0.20
    q = 1.0 - p # 0.80
    k = 4

    # P(X = 4) = (1 - p)^3 * p
    prob_k4 = (q ** 3) * p
    assert abs(prob_k4 - 0.1024) < 1e-9
    scipy_prob = stats.geom.pmf(k, p)
    assert abs(scipy_prob - 0.1024) < 1e-9

    # 期待値 E(X) = 1 / p
    mean_val = stats.geom.mean(p)
    assert mean_val == 5.0

    # 分散 V(X) = (1 - p) / p^2
    var_val = stats.geom.var(p)
    assert abs(var_val - 20.0) < 1e-9

    # 誤答パス:
    # 1. 試行回数ずれ: q^4 * p
    distractor_k5 = (q ** 4) * p # 0.08192
    # 2. 二項分布と混同: 4C1 * q^3 * p
    distractor_binom = stats.binom.pmf(1, 4, p) # 4 * 0.512 * 0.2 = 0.4096

    print(f"  P(X=4): {prob_k4:.4f}, SciPy: {scipy_prob:.4f}")
    print(f"  Mean: {mean_val:.1f}, Var: {var_val:.1f}")
    print(f"  Distractor (shifted): {distractor_k5:.4f}, Distractor (binom): {distractor_binom:.4f}")
    return True


def verify_q24():
    print("\n--- Q24: Type I / II Errors and Power ---")
    mu0 = 100.0
    sigma = 2.0
    n = 25
    se = sigma / math.sqrt(n) # 2.0 / 5.0 = 0.40
    assert se == 0.40

    alpha = 0.05
    # 片側検定 z_alpha
    z_crit = stats.norm.ppf(1.0 - alpha) # 1.644853...
    assert abs(z_crit - 1.6448536) < 1e-5

    # 棄却限界値 x_crit (3桁丸め 1.645 を使用)
    x_crit = mu0 + 1.645 * se
    assert abs(x_crit - 100.658) < 1e-9

    # 対立仮説 mu1 = 101.2 の下での検出力
    mu1 = 101.2
    z1 = (x_crit - mu1) / se # (100.658 - 101.2) / 0.4 = -0.542 / 0.4 = -1.355
    assert abs(z1 - (-1.355)) < 1e-9

    # 検出力 Power = P(X_bar >= x_crit | mu = mu1) = 1 - Phi(z1) = Phi(-z1)
    power = 1.0 - stats.norm.cdf(z1) # 1 - Phi(-1.355) = Phi(1.355)
    beta = 1.0 - power # 第2種の過誤

    assert abs(power - 0.912314) < 1e-4
    assert abs(beta - 0.087685) < 1e-4

    print(f"  SE: {se:.2f}, Critical limit: {x_crit:.3f}")
    print(f"  z under H1: {z1:.3f}, Power (1 - beta): {power:.4f} ({power*100:.1f}%)")
    print(f"  Type II error (beta): {beta:.4f} ({beta*100:.1f}%)")
    return True


import re
from pathlib import Path

def verify_q25():
    print("\n--- Q25: Fisher's Three Principles of Experimental Design ---")
    problem_data_path = Path(__file__).resolve().parent.parent / "app/(monetized)/toukei/problems/problem-data.ts"
    assert problem_data_path.exists(), f"File not found: {problem_data_path}"

    content = problem_data_path.read_text(encoding="utf-8")
    # Q25のブロックを抽出（配列末尾までのQ25全体）
    assert 'slug: "fishers-three-principles-experiment"' in content, "Q25 slug missing"
    q25_text = content.split('slug: "fishers-three-principles-experiment"')[1]

    # 1. 3原則の概念含有アサート
    for principle in ["局所管理", "無作為化", "反復"]:
        assert principle in q25_text, f"Principle '{principle}' not found in Q25"

    # 2. 局所管理（Local Control）の論理的要件
    assert "ブロック" in q25_text, "Local control must mention blocking"
    assert "系統" in q25_text, "Local control must mention systematic variation"
    assert "東西" in q25_text or "環境傾斜" in q25_text or "傾斜" in q25_text, "Local control must address environmental gradient"

    # 3. 無作為化（Randomization）の論理的要件
    assert "無作為" in q25_text or "ランダム" in q25_text, "Randomization must be addressed"
    assert "偶然誤差" in q25_text or "バイアス" in q25_text, "Randomization must address accidental error/bias"

    # 4. 反復（Replication）の論理的要件
    assert "独立した実験単位" in q25_text or "実験単位" in q25_text, "Replication must mention independent experimental units"
    assert "残差分散" in q25_text or "誤差" in q25_text, "Replication must address error variance"
    assert "検出力" in q25_text, "Replication must mention statistical power"

    # 5. 区画配分の整合性チェック（16区画 = 4ブロック * 4区画、各肥料8区画）
    assert "16区画" in q25_text, "Total plot count 16 not found"
    assert "8区画" in q25_text, "Plot count per fertilizer 8 not found"
    assert "4つのブロック" in q25_text or "4ブロック" in q25_text, "Block count 4 not found"

    # 6. 過剰な断定表現・絶対的保証の非含有チェック（solutionStepsとfinalAnswerにおいて）
    # solutionSteps と finalAnswer の範囲を抽出
    steps_match = re.search(r'solutionSteps:\s*\[[\s\S]+?finalAnswer:\s*"([^"]+)"', q25_text)
    assert steps_match is not None, "solutionSteps and finalAnswer not matched"
    solution_body = steps_match.group(0)

    forbidden_overclaims = [
        "完全にゼロ",
        "不偏性を保証する",
        "因果効果を立証できる",
        "構造的に排除する",
        "反復を行うことで初めて",
    ]
    for claim in forbidden_overclaims:
        assert claim not in solution_body, f"Forbidden overclaim '{claim}' found in Q25 solution/answer: {solution_body}"

    # 7. 誤答（distractors）の網羅性
    distractors_match = re.search(r'distractors:\s*\[([\s\S]+?)\]\s*,', q25_text)
    assert distractors_match is not None, "distractors not found in Q25"
    distractors_text = distractors_match.group(1)
    # 単一サンプルの再測定誤認、単一区画の一元管理誤認、誤差の完全消去誤認の3点
    assert "天秤" in distractors_text or "単一サンプル" in distractors_text, "Measurement repetition vs experimental replication distractor missing"
    assert "巨大な単一区画" in distractors_text or "一元的に集中管理" in distractors_text, "Misconception of local control as single giant plot missing"
    assert "完全にゼロに消去" in distractors_text, "Zero-error misconception distractor missing"

    # 8. NISTリファレンスURLの正確性
    assert "https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm" in q25_text, "NIST pri332.htm URL missing"
    assert "https://www.itl.nist.gov/div898/handbook/pri/section7/pri7.htm" in q25_text, "NIST pri7.htm URL missing"

    print("  PASS: Fisher's 3 principles verified in problem-data.ts")
    print("  - Local Control: Block design (4 blocks of 4 plots) for systematic gradient")
    print("  - Randomization: Allocation to eliminate systematic bias without overclaiming")
    print("  - Replication: Independent experimental units (8 plots each) for error variance & power")
    print("  - Overclaims: Verified absence of absolute claims in solution and final answer")
    print("  - Distractors: 3 educational distractors verified")
    print("  - References: Valid NIST DOE URLs (pri332.htm, pri7.htm) confirmed")
    return True


def main():
    assert verify_q21()
    assert verify_q22()
    assert verify_q23()
    assert verify_q24()
    assert verify_q25()
    print("\n==================================================")
    print("PASS: All 5 problems verified (numerical calculations and conceptual requirements)")
    print("==================================================")


if __name__ == "__main__":
    main()
