# /// script
# requires-python = ">=3.12"
# dependencies = ["scipy==1.16.1"]
# ///
"""Independent numeric checks: uv run scripts/verify-toukei-batch1.py."""

import math
from fractions import Fraction

import scipy
from scipy.stats import binom, norm, t


def close(actual: float, expected: float, tolerance: float = 1e-10) -> None:
    if not math.isclose(actual, expected, rel_tol=0, abs_tol=tolerance):
        raise AssertionError(f"{actual=} differs from {expected=}")


# Q6: transform seven synthetic observations, independently of the formulas.
x = [20 - math.sqrt(56), 20 + math.sqrt(56), 20, 20, 20, 20, 20]
y = [1.8 * value + 32 for value in x]
mean_y = sum(y) / len(y)
variance_y = sum((value - mean_y) ** 2 for value in y) / len(y)
close(mean_y, 68)
close(variance_y, 51.84)
close(math.sqrt(variance_y), 7.2)
close(1.8**2 * 16 + 32, 83.84)  # erroneous shift of variance
close(1.8 * 16, 28.8)  # erroneous linear scaling of variance
print(f"Q6: mean={mean_y:.2f}, variance={variance_y:.2f}, SD={math.sqrt(variance_y):.2f}")

# Q7: expected counts in a 10,000-person table.
infected = 10000 * Fraction(1, 100)
true_positive = infected * Fraction(9, 10)
false_negative = infected - true_positive
false_positive = (10000 - infected) * Fraction(5, 100)
true_negative = 10000 - infected - false_positive
assert (true_positive, false_negative, false_positive, true_negative) == (90, 10, 495, 9405)
positive_rate = (true_positive + false_positive) / 10000
posterior = true_positive / (true_positive + false_positive)
assert posterior == Fraction(2, 13)
close(float(positive_rate), 0.0585)
assert round(float(posterior) * 100, 1) == 15.4
print(f"Q7: P(positive)={float(positive_rate):.4f}, posterior={posterior}={float(posterior)*100:.1f}%")

# Q8: library moments, table rounding, and two explicitly different wrong paths.
mean, variance = binom.stats(400, 0.1, moments="mv")
close(float(mean), 40)
close(float(variance), 36)
z = (50 - mean) / math.sqrt(variance)
close(float(z), 5 / 3)
assert round(float(z), 2) == 1.67
assert round(float(norm.sf(1.67)), 4) == 0.0475
assert round(float(norm.sf(z)), 4) == 0.0478
wrong_z = (50 - mean) / variance
assert round(float(wrong_z), 2) == 0.28
assert round(float(norm.sf(0.28)), 4) == 0.3897
assert round(10 / math.sqrt(40), 2) == 1.58
assert round(float(norm.sf(1.645)), 4) == 0.0500
print(f"Q8: mu={mean:.0f}, variance={variance:.0f}, z={z:.6f}, table tail={norm.sf(1.67):.6f}")
print(f"    Reference only: unrounded normal={norm.sf(z):.6f}, continuity-corrected={norm.sf((49.5-mean)/6):.6f}, exact binomial={binom.sf(49,400,0.1):.6f}")
print(f"    Wrong variance denominator: z={wrong_z:.6f}, rounded-table tail={norm.sf(0.28):.6f}")

# Q9: moments of the count scaled to a proportion, with independent trials.
count_mean, count_var = binom.stats(1600, 0.5, moments="mv")
close(float(count_mean / 1600), 0.5)
close(float(count_var / 1600**2), 0.00015625)
se = math.sqrt(count_var / 1600**2)
close(se, 0.0125)
close(100 * se, 1.25)
close(math.sqrt(0.25 / 6400), se / 2)
print(f"Q9: mean={count_mean/1600:.2f}, variance={count_var/1600**2:.8f}, SE={se:.4f}, n=6400 SE={se/2:.5f}")

# Q10: independent library survival/quantile checks for the paired differences.
se_d = 5 / math.sqrt(10)
statistic = 6 / se_d
df = 10 - 1
p_value = float(t.sf(statistic, df))
close(se_d, 1.5811388300841895)
close(statistic, 3.794733192202055)
assert round(p_value, 6) == 0.002126
assert round(float(t.ppf(0.95, df)), 3) == 1.833
assert round(float(t.ppf(0.975, df)), 3) == 2.262
assert round(float(t.ppf(0.95, 18)), 3) == 1.734
assert statistic > t.ppf(0.95, df) and p_value < 0.05
print(f"Q10: SE={se_d:.6f}, t={statistic:.6f}, df={df}, one-sided p={p_value:.6f}, critical={t.ppf(.95,df):.6f}")
print(f"PASS: all 5 problems and numeric distractor paths (SciPy {scipy.__version__})")
