#!/usr/bin/env python3
"""
Issue #377 トラックA 第5バッチ（問26〜問30）の独立数値検証スクリプト
Python >= 3.12, SciPy 1.18.1+
"""

import math
import re
from pathlib import Path
from scipy import stats

def verify_q26():
    print("--- Q26: Two-Sample Proportion Test ---")
    nA = 500
    xA = 40
    pA = xA / nA # 0.080

    nB = 500
    xB = 65
    pB = xB / nB # 0.130

    assert abs(pA - 0.080) < 1e-9
    assert abs(pB - 0.130) < 1e-9

    # プールされた母比率 p_hat
    p_hat = (xA + xB) / (nA + nB) # 105 / 1000 = 0.105
    assert abs(p_hat - 0.105) < 1e-9
    q_hat = 1.0 - p_hat # 0.895

    # 標準誤差 SE = sqrt(p_hat * (1 - p_hat) * (1/nA + 1/nB))
    var_pooled = p_hat * q_hat * (1.0 / nA + 1.0 / nB) # 0.105 * 0.895 * 0.004 = 0.0003759
    assert abs(var_pooled - 0.0003759) < 1e-9
    se = math.sqrt(var_pooled) # 0.01938814...

    # 検定統計量 z = (pB - pA) / se
    diff = pB - pA # 0.050
    z = diff / se
    assert abs(z - 2.578896) < 1e-5
    rounded_z = round(z, 2)
    assert rounded_z == 2.58

    # 両側p値
    p_val = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    assert abs(p_val - 0.009911) < 1e-5

    # 誤答パス: プールしない個別分散を用いたSE（信頼区間用公式の誤用）
    se_unpooled = math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)
    # 0.08*0.92/500 + 0.13*0.87/500 = 0.0001472 + 0.0002262 = 0.0003734
    z_unpooled = diff / se_unpooled
    assert abs(z_unpooled - 2.5875) < 1e-3

    print(f"  pA: {pA:.3f}, pB: {pB:.3f}, Pooled p: {p_hat:.3f}")
    print(f"  SE: {se:.6f}, z: {z:.4f} -> {rounded_z}")
    print(f"  p-value: {p_val:.4f}, Unpooled z: {z_unpooled:.4f}")
    return True


def verify_q27():
    print("\n--- Q27: Exponential Distribution & Poisson Process ---")
    rate = 6.0 # 1時間あたり6回

    # (1) 平均待ち時間 E(X) = 1 / lambda
    mean_hours = 1.0 / rate # 1/6 時間
    mean_minutes = mean_hours * 60.0 # 10.0 分
    assert abs(mean_minutes - 10.0) < 1e-9

    # (2) 15分（0.25時間）以上発生しない確率 P(X >= 0.25)
    t = 15.0 / 60.0 # 0.25 時間
    exponent = -rate * t # -6.0 * 0.25 = -1.5
    assert abs(exponent - (-1.5)) < 1e-9

    prob_tail = math.exp(exponent) # exp(-1.5)
    scipy_prob_tail = stats.expon.sf(t, scale=1.0 / rate)
    assert abs(prob_tail - scipy_prob_tail) < 1e-9
    assert abs(prob_tail - 0.223130) < 1e-5
    pct_tail = prob_tail * 100.0 # 約22.3%

    # (3) 無記憶性: P(X >= s + t | X >= s) = P(X >= t)
    s = 10.0 / 60.0 # すでに10分経過
    prob_s_plus_t = math.exp(-rate * (s + t))
    prob_s = math.exp(-rate * s)
    cond_prob = prob_s_plus_t / prob_s
    assert abs(cond_prob - prob_tail) < 1e-9

    # 誤答パス: 15分以内に発生する累積確率 P(X <= 0.25) = 1 - e^-1.5
    prob_cdf = 1.0 - prob_tail # 0.776869...
    assert abs(prob_cdf - 0.77687) < 1e-4

    print(f"  Mean: {mean_hours:.3f} h ({mean_minutes:.1f} min)")
    print(f"  P(X >= 15min): {prob_tail:.4f} ({pct_tail:.1f}%), SciPy: {scipy_prob_tail:.4f}")
    print(f"  Conditional P(X >= 10+15 | X >= 10): {cond_prob:.4f}")
    print(f"  Distractor CDF P(X <= 15min): {prob_cdf:.4f}")
    return True


def verify_q28():
    print("\n--- Q28: Time Series Moving Average & Autocorrelation ---")
    y = [30.0, 42.0, 48.0, 36.0, 54.0, 60.0]
    N = len(y)
    assert N == 6

    # 標本平均
    y_bar = sum(y) / N # 270 / 6 = 45.0
    assert abs(y_bar - 45.0) < 1e-9

    # (1) 3日移動平均 (k=3)
    ma = []
    for i in range(1, N - 1):
        val = (y[i - 1] + y[i] + y[i + 1]) / 3.0
        ma.append(val)
    # i=1 (t=2): (30+42+48)/3 = 40.0
    # i=2 (t=3): (42+48+36)/3 = 42.0
    # i=3 (t=4): (48+36+54)/3 = 46.0
    # i=4 (t=5): (36+54+60)/3 = 50.0
    expected_ma = [40.0, 42.0, 46.0, 50.0]
    assert ma == expected_ma

    # (2) ラグ1自己相関 r1
    # 偏差
    dev = [val - y_bar for val in y] # [-15, -3, 3, -9, 9, 15]
    assert dev == [-15.0, -3.0, 3.0, -9.0, 9.0, 15.0]

    # 全偏差平方和 SS_total (6項)
    ss_total = sum(d ** 2 for d in dev) # 225 + 9 + 9 + 81 + 81 + 225 = 630.0
    assert abs(ss_total - 630.0) < 1e-9

    # ラグ1自己共分散分子 sum_{t=1}^{N-1} (y_t - y_bar)(y_{t+1} - y_bar)
    lag1_products = [dev[t] * dev[t + 1] for t in range(N - 1)]
    assert lag1_products == [45.0, -9.0, -27.0, -81.0, 135.0]
    lag1_sum = sum(lag1_products) # 45 - 9 - 27 - 81 + 135 = 63.0
    assert abs(lag1_sum - 63.0) < 1e-9

    r1 = lag1_sum / ss_total # 63.0 / 630.0 = 0.100
    assert abs(r1 - 0.100) < 1e-9

    # 誤答パス: 5項分の偏差平方和で割る誤り（Codex P1 指摘の検算）
    ss_5_first = sum(d ** 2 for d in dev[:5]) # 225 + 9 + 9 + 81 + 81 = 405.0
    ss_5_last = sum(d ** 2 for d in dev[1:])  # 9 + 9 + 81 + 81 + 225 = 405.0
    assert ss_5_first == 405.0
    assert ss_5_last == 405.0
    r1_distractor_5terms = lag1_sum / ss_5_first # 63.0 / 405.0 = 0.155555...
    assert abs(r1_distractor_5terms - (63.0 / 405.0)) < 1e-9
    rounded_r1_distractor = round(r1_distractor_5terms, 3)
    assert rounded_r1_distractor == 0.156

    print(f"  Mean: {y_bar:.1f}, MA(3): {ma}")
    print(f"  Deviations: {dev}")
    print(f"  SS_total (6 terms): {ss_total:.1f}, Lag-1 cross-sum: {lag1_sum:.1f}")
    print(f"  r1 (Autocorrelation lag 1): {r1:.3f}")
    print(f"  Distractor SS (5 terms): {ss_5_first:.1f} -> r1_distractor: {r1_distractor_5terms:.4f} -> {rounded_r1_distractor}")
    return True


def verify_q29():
    print("\n--- Q29: Two-Way ANOVA & Interaction ---")
    a = 2 # 要因A 水準数
    b = 2 # 要因B 水準数
    r = 5 # セルあたりサンプル数
    N = a * b * r # 20
    assert N == 20

    # 自由度
    df_A = a - 1 # 1
    df_B = b - 1 # 1
    df_AB = (a - 1) * (b - 1) # 1
    df_E = a * b * (r - 1) # 2 * 2 * 4 = 16
    df_T = N - 1 # 19
    assert df_A + df_B + df_AB + df_E == df_T

    # 平方和 SS
    ss_A = 180.0
    ss_B = 300.0
    ss_AB = 90.0
    ss_E = 240.0
    ss_T = ss_A + ss_B + ss_AB + ss_E # 810.0
    assert ss_T == 810.0

    # 平均平方 MS
    ms_A = ss_A / df_A # 180.0
    ms_B = ss_B / df_B # 300.0
    ms_AB = ss_AB / df_AB # 90.0
    ms_E = ss_E / df_E # 15.0
    assert ms_E == 15.0

    # F値
    F_A = ms_A / ms_E # 180 / 15 = 12.0
    F_B = ms_B / ms_E # 300 / 15 = 20.0
    F_AB = ms_AB / ms_E # 90 / 15 = 6.0
    assert F_A == 12.0
    assert F_B == 20.0
    assert F_AB == 6.0

    # F分布臨界値 F_0.05(1, 16)
    f_crit = stats.f.ppf(0.95, 1, 16)
    assert abs(f_crit - 4.493998) < 1e-4

    # p値
    p_AB = 1.0 - stats.f.cdf(F_AB, df_AB, df_E)
    assert abs(p_AB - 0.02618) < 1e-4 # p = 0.026 < 0.05

    print(f"  df: A={df_A}, B={df_B}, AB={df_AB}, Error={df_E}, Total={df_T}")
    print(f"  MS: A={ms_A:.1f}, B={ms_B:.1f}, AB={ms_AB:.1f}, Error={ms_E:.1f}")
    print(f"  F: A={F_A:.2f}, B={F_B:.2f}, AB={F_AB:.2f}")
    print(f"  F_crit(1, 16): {f_crit:.3f}, p_AB: {p_AB:.4f}")
    return True


def verify_q30():
    print("\n--- Q30: Multiple Regression Diagnostics (VIF & Dummy Variables) ---")
    # (1) VIFの計算
    r = 0.80
    R2 = r ** 2 # 0.64
    assert abs(R2 - 0.64) < 1e-9

    vif = 1.0 / (1.0 - R2) # 1 / 0.36 = 2.777777...
    assert abs(vif - (25.0 / 9.0)) < 1e-9
    rounded_vif = round(vif, 2)
    assert rounded_vif == 2.78

    se_inflation = math.sqrt(vif) # sqrt(2.7778) = 1.66666...
    assert abs(se_inflation - (5.0 / 3.0)) < 1e-9
    rounded_se_inflation = round(se_inflation, 2)
    assert rounded_se_inflation == 1.67

    # 誤答パス: R2 ではなく r を直接引いてしまう
    vif_distractor = 1.0 / (1.0 - r) # 1 / 0.20 = 5.0
    assert abs(vif_distractor - 5.0) < 1e-9

    # (2) ダミー変数の設計
    k_categories = 3 # 都心、準都心、郊外
    num_dummies = k_categories - 1 # 2
    assert num_dummies == 2

    print(f"  r: {r:.2f}, R^2: {R2:.2f}")
    print(f"  VIF: {vif:.4f} -> {rounded_vif} (SE multiplier: {se_inflation:.4f} -> {rounded_se_inflation})")
    print(f"  Distractor VIF (using r): {vif_distractor:.1f}")
    print(f"  Categories: {k_categories}, Required Dummies: {num_dummies}")
    return True


def verify_problem_data_content():
    print("\n--- Verifying Content and Integrity in problem-data.ts ---")
    problem_data_path = Path(__file__).resolve().parent.parent / "app/(monetized)/toukei/problems/problem-data.ts"
    assert problem_data_path.exists(), f"File not found: {problem_data_path}"
    content = problem_data_path.read_text(encoding="utf-8")

    # Q26
    assert 'slug: "two-sample-proportion-test"' in content, "Q26 slug missing"
    assert "https://www.itl.nist.gov/div898/handbook/prc/section3/prc33.htm" in content, "Q26 NIST URL missing"
    assert "プールされた" in content, "Q26 pooled proportion term missing"
    assert "無作為に割り付け" in content and "互いに独立" in content, "Q26 independent random assignment premise missing"

    # Q27
    assert 'slug: "exponential-distribution-waiting-time"' in content, "Q27 slug missing"
    assert "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3667.htm" in content, "Q27 NIST URL missing"
    assert "無記憶性" in content, "Q27 memoryless property term missing"

    # Q28
    assert 'slug: "time-series-moving-average-autocorrelation"' in content, "Q28 slug missing"
    assert "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35c.htm" in content, "Q28 NIST URL missing"
    assert "自己相関係数" in content, "Q28 autocorrelation term missing"
    assert "r_1 = 0.156" in content, "Q28 corrected distractor 0.156 missing"
    assert "405.0" in content, "Q28 5-term SS 405.0 explanation missing"
    assert "母過程の系列相関の有無を一般化して判断することはできません" in content, "Q28 refined correlation interpretation missing"

    # Q29
    assert 'slug: "two-way-anova-interaction"' in content, "Q29 slug missing"
    assert "https://www.itl.nist.gov/div898/handbook/prc/section4/prc438.htm" in content, "Q29 NIST URL missing"
    assert "交互作用" in content, "Q29 interaction term missing"
    assert "2×2 二元配置分散分析表" in content, "Q29 ANOVA table missing"
    assert "互いに独立な正規分布に従い、分散は等しい" in content, "Q29 model assumptions missing"
    q29_text = content.split('slug: "two-way-anova-interaction"')[1].split('slug: "multiple-regression-multicollinearity-dummy"')[0]
    assert "平均平方（不偏分散）" not in q29_text, "Q29 improper MS wording found"

    # Q30
    assert 'slug: "multiple-regression-multicollinearity-dummy"' in content, "Q30 slug missing"
    assert "https://online.stat.psu.edu/stat462/node/180/" in content, "Q30 Penn State VIF URL missing"
    assert "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html" in content, "Q30 scikit-learn OneHotEncoder URL missing"
    assert "pmd44.htm" not in content, "Q30 obsolete NIST pmd44.htm must be removed"
    assert "ダミー変数の罠" in content, "Q30 dummy variable trap term missing"
    assert "分散拡大係数" in content, "Q30 VIF term missing"

    # 過剰な断定表現のチェック（Q26〜Q30全体）
    forbidden_terms = [
        "完全に証明する",
        "因果関係を直接立証する",
        "絶対に正しい",
    ]
    for term in forbidden_terms:
        assert term not in content, f"Forbidden overclaim '{term}' found in problem-data.ts"

    print("  PASS: All Batch 5 content requirements, accurate URLs, and statistical terms verified!")
    return True


def verify_all_batch5():
    print("========================================")
    print("Running Toukei Problem Batch 5 Verification")
    print("========================================")
    assert verify_q26()
    assert verify_q27()
    assert verify_q28()
    assert verify_q29()
    assert verify_q30()
    assert verify_problem_data_content()
    print("\n========================================")
    print("ALL BATCH 5 TESTS PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    verify_all_batch5()
