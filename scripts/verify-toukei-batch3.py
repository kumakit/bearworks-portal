#!/usr/bin/env python3
"""Independent numeric checks: uv run --with scipy python scripts/verify-toukei-batch3.py."""

from math import isclose, sqrt

import scipy
from scipy import stats


# Q16: equal-variance two-sample t test from summary statistics.
n_a, n_b = 10, 15
mean_a, mean_b = 85.0, 80.0
var_a, var_b = 38.0, 15.0
df_t = n_a + n_b - 2
pooled_var = ((n_a - 1) * var_a + (n_b - 1) * var_b) / df_t
se_diff = sqrt(pooled_var * (1 / n_a + 1 / n_b))
t_stat = (mean_a - mean_b) / se_diff
t_critical = stats.t.isf(0.025, df_t)
t_p_two_sided = 2 * stats.t.sf(abs(t_stat), df_t)
simple_average_t = (mean_a - mean_b) / sqrt(((var_a + var_b) / 2) * (1 / n_a + 1 / n_b))
assert isclose(pooled_var, 24.0)
assert isclose(se_diff, 2.0)
assert isclose(t_stat, 2.5)
assert f"{t_critical:.3f}" == "2.069"
assert f"{t_p_two_sided:.4f}" == "0.0200"
assert f"{simple_average_t:.2f}" == "2.38"
print(
    f"Q16: pooled variance={pooled_var:.2f}, SE={se_diff:.2f}, "
    f"t={t_stat:.2f}, critical={t_critical:.6f}, p={t_p_two_sided:.8f}"
)


# Q17: fixed A/B variance ratio and both tails of the two-sided F test.
df_num, df_den = 9, 15
f_stat = 72.0 / 24.0
f_critical_upper_025 = stats.f.isf(0.025, df_num, df_den)
f_critical_upper_05 = stats.f.isf(0.05, df_num, df_den)
f_critical_lower_025 = stats.f.ppf(0.025, df_num, df_den)
f_p_two_sided = 2 * min(
    stats.f.cdf(f_stat, df_num, df_den),
    stats.f.sf(f_stat, df_num, df_den),
)
assert isclose(f_stat, 3.0)
assert f"{f_critical_upper_025:.2f}" == "3.12"
assert f"{f_critical_upper_05:.2f}" == "2.59"
assert f_critical_lower_025 < 1 < f_critical_upper_025
assert f"{f_p_two_sided:.4f}" == "0.0584"
print(
    f"Q17: F={f_stat:.2f}, lower/upper critical="
    f"[{f_critical_lower_025:.6f}, {f_critical_upper_025:.6f}], "
    f"p(two-sided)={f_p_two_sided:.8f}"
)


# Q18: Pearson chi-square goodness of fit and the wrong-denominator path.
observed = [100, 25, 30, 5]
expected = [90, 30, 30, 10]
chi_terms = [(o - e) ** 2 / e for o, e in zip(observed, expected)]
chi_stat = sum(chi_terms)
chi_result = stats.chisquare(observed, expected)
chi_critical = stats.chi2.isf(0.05, 3)
wrong_observed_denominator = sum((o - e) ** 2 / o for o, e in zip(observed, expected))
assert all(e >= 5 for e in expected)
assert isclose(chi_stat, 40 / 9)
assert isclose(chi_result.statistic, chi_stat)
assert f"{chi_result.pvalue:.3f}" == "0.217"
assert f"{chi_critical:.3f}" == "7.815"
assert isclose(wrong_observed_denominator, 7.0)
print(
    f"Q18: terms={[round(x, 6) for x in chi_terms]}, chi2={chi_stat:.8f}, "
    f"p={chi_result.pvalue:.8f}, critical={chi_critical:.6f}, wrong-denominator=7.00"
)


# Q19: adjusted R-squared with an intercept and two common formula errors.
n, k, r_squared = 25, 4, 0.70
adjusted_r_squared = 1 - (n - 1) / (n - k - 1) * (1 - r_squared)
reversed_ratio = 1 - (n - k - 1) / (n - 1) * (1 - r_squared)
forgot_intercept = 1 - (n - 1) / (n - k) * (1 - r_squared)
assert isclose(adjusted_r_squared, 0.64)
assert isclose(reversed_ratio, 0.75)
assert f"{forgot_intercept:.3f}" == "0.657"
assert adjusted_r_squared <= r_squared
print(
    f"Q19: adjusted R2={adjusted_r_squared:.3f}, reversed={reversed_ratio:.3f}, "
    f"forgot-intercept={forgot_intercept:.6f}"
)


# Q20: chi-square interval for a normal population variance and standard deviation.
df_chi, sample_variance = 15, 25.0
sum_squares = df_chi * sample_variance
chi_lower_cdf = stats.chi2.ppf(0.025, df_chi)
chi_upper_cdf = stats.chi2.ppf(0.975, df_chi)
variance_lower = sum_squares / chi_upper_cdf
variance_upper = sum_squares / chi_lower_cdf
sd_lower, sd_upper = sqrt(variance_lower), sqrt(variance_upper)
wrong_n_sum_squares = 16 * sample_variance
assert isclose(sum_squares, 375.0)
assert f"{chi_lower_cdf:.3f}" == "6.262"
assert f"{chi_upper_cdf:.3f}" == "27.488"
assert f"{variance_lower:.2f}" == "13.64"
assert f"{variance_upper:.2f}" == "59.88"
assert f"{sd_lower:.2f}" == "3.69"
assert f"{sd_upper:.2f}" == "7.74"
assert wrong_n_sum_squares == 400.0
print(
    f"Q20: chi2 quantiles=[{chi_lower_cdf:.6f}, {chi_upper_cdf:.6f}], "
    f"variance CI=[{variance_lower:.6f}, {variance_upper:.6f}], "
    f"SD CI=[{sd_lower:.6f}, {sd_upper:.6f}]"
)

print(f"PASS: five problems and numeric distractor paths (SciPy {scipy.__version__})")
