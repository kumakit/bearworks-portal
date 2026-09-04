# /// script
# requires-python = ">=3.12"
# dependencies = ["scipy==1.16.1"]
# ///
"""Independent numeric checks using constructed observations and distributions."""
from decimal import Decimal
from itertools import product
from math import exp, isclose, sqrt

import numpy as np
from scipy import stats

# Q11: construct 10 paired observations with the supplied sample moments.
u = np.arange(10, dtype=float) - 4.5
u /= np.std(u, ddof=1)
v = u**2 - np.mean(u**2)
v -= np.dot(v, u) / np.dot(u, u) * u
v /= np.std(v, ddof=1)
x, y = 10 + 4*u, 60 + 4*u + 3*v
assert np.allclose(np.cov(x, y), [[16, 16], [16, 25]])
r = stats.pearsonr(x, y).statistic
assert isclose(r, .8)
assert isclose(16/(16*25), .04)  # variance instead of SD distractor
changed = []
for x0, y0 in [(20, 50), (40, 10)]:
    r2 = stats.pearsonr(np.append(x, x0), np.append(y, y0)).statistic
    assert r2 < r
    changed.append(r2)
assert not isclose(*changed)  # moments alone do not determine the new r
print(f"Q11: r={r:.2f}; illustrative new r={changed} (not supplied observations)")

# Q12: enumerate independent, equally likely two-point variables directly.
values = np.array([b-a for a, b in product([194, 206], [242, 258])])
assert isclose(values.mean(), 50)
assert isclose(values.var(), 100)
assert isclose(values.std(), 10)
assert 64-36 == 28 and 8-6 == 2
print("Q12: E=50 mL, V=100 mL^2, SD=10 mL")

# Q13: keep prescribed decimal arithmetic separate from precise probability.
prescribed = Decimal(3)*Decimal("0.1353")
precise = stats.poisson.cdf(1, mu=2)
assert prescribed == Decimal("0.4059")
assert isclose(precise, 3*exp(-2))
assert f"{precise:.4f}" == "0.4060"
assert stats.poisson.mean(2) == stats.poisson.var(2) == 2
assert Decimal(2)*Decimal("0.1353") == Decimal("0.2706")
print(f"Q13: prescribed={prescribed}, precise={precise:.10f}, rounded={precise:.4f}")

# Q14: binomial distribution gives the variance of the proportion directly.
n, phat = 400, 256/400
se = sqrt(stats.binom.var(n, phat))/n
assert isclose(se, .024)
lower, upper = phat-1.96*se, phat+1.96*se
assert np.allclose([lower, upper], [.59296, .68704])
assert np.allclose([phat-se, phat+se], [.616, .664])
print(f"Q14: SE={se:.3f}, margin={1.96*se:.5f}, CI=[{lower:.5f}, {upper:.5f}]")

# Q15: synthesize balanced observations, then use scipy's raw-data ANOVA.
offset = sqrt(8.4)
residual = np.array([-2, -1, 0, 1, 2])*sqrt(2.4)
groups = [20+mean+residual for mean in [-offset, 0, offset]]
grand = np.concatenate(groups).mean()
ssb = sum(len(g)*(g.mean()-grand)**2 for g in groups)
ssw = sum(np.sum((g-g.mean())**2) for g in groups)
assert np.allclose([ssb, ssw, ssb+ssw], [84, 72, 156])
f, p = stats.f_oneway(*groups)
assert isclose(f, 7)
assert isclose(p, stats.f.sf(7, 2, 12))
assert f"{p:.4f}" == "0.0097"
critical = stats.f.isf(.05, 2, 12)
assert f"{critical:.2f}" == "3.89"
assert (3-1, 15-3, 15-1) == (2, 12, 14)
assert np.allclose([ssb/2, ssw/12], [42, 6])
assert f"{ssb/ssw:.2f}" == "1.17"
print(f"Q15: SS=84/72/156, df=2/12/14, MS=42/6, F={f:.2f}, p={p:.8f}, critical={critical:.6f}")
print("PASS: five problems and numeric distractor paths (SciPy 1.16.1)")
