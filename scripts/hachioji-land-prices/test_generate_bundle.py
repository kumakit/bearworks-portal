import copy
import json
from pathlib import Path
import unittest

from generate_bundle import ROOT, build, change, continuity_reason, stats, validate_points


class LandPricesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inputs = json.loads((ROOT / "docs/task/issue-413/normalized-inputs.json").read_bytes())
        cls.current = next(p for p in cls.inputs["points"] if p["year"] == 2026 and p["id"] == "13201-000-001")
        cls.past = next(p for p in cls.inputs["points"] if p["year"] == 2016 and p["id"] == cls.current["id"])

    def test_mean_median_and_invalid_prices(self):
        self.assertEqual(stats([1, 3])["median"], 2)
        self.assertEqual(stats([1, 4, 9])["median"], 4)
        self.assertEqual(stats([1, 4, 9])["mean"], 14 / 3)
        for prices in ([], [0], [-1], [None], [float("nan")], [True]):
            with self.assertRaises(ValueError):
                stats(prices)

    def test_percent_and_denominator(self):
        self.assertAlmostEqual(change(110, 100), 10)
        self.assertAlmostEqual(change(90, 100), -10)
        with self.assertRaises(ValueError):
            change(1, 0)

    def test_continuity_requires_every_year_and_endpoint_checks(self):
        self.assertEqual(continuity_reason(self.current, self.past), "採用")
        for flag in ("40000000000000", "20000000000000", "99999999999999", "00000000000000", "11000000000000", "10100000000000", "10010000000000"):
            p = copy.deepcopy(self.current)
            p["historyFlags2017to2026"][3] = flag
            self.assertNotEqual(continuity_reason(p, self.past), "採用", flag)
        for field, value in (("address", "別の地番"), ("area", 999), ("history2016", 1), ("latitude", 35.8)):
            p = dict(self.current, **{field: value})
            self.assertNotEqual(continuity_reason(p, self.past), "採用")
        self.assertNotEqual(continuity_reason(self.current, None), "採用")
        # Tiny endpoint coordinate differences do not imply a land move (different datums).
        self.assertEqual(continuity_reason(dict(self.current, latitude=self.past["latitude"] + 0.00001), self.past), "採用")

    def test_invalid_and_duplicate_rows_fail_closed(self):
        for field, value in (("price", 0), ("longitude", 35), ("use", "005"), ("year", 2025), ("address", ""), ("yearOnYear", float("nan"))):
            inputs = copy.deepcopy(self.inputs)
            inputs["points"][0][field] = value
            with self.assertRaises(ValueError):
                validate_points(inputs["points"])
        with self.assertRaises(ValueError):
            validate_points(self.inputs["points"] + [self.current])

    def test_yearly_rate_is_checked_against_previous_price(self):
        points = copy.deepcopy(self.inputs["points"])
        next(p for p in points if p["year"] == 2026)["yearOnYear"] = 99
        with self.assertRaisesRegex(ValueError, "Annual rate"):
            validate_points(points)

    def test_official_tables_and_different_estimands(self):
        files = build(self.inputs)
        bundle = json.loads(files["hachioji-land-prices-2026-10-26.r1.json"])
        self.assertEqual(sum(c["current"]["count"] for c in bundle["cities"]), 341)
        self.assertEqual(sum(c["past"]["count"] for c in bundle["cities"]), 344)
        h = bundle["cities"][0]
        self.assertEqual(h["current"]["median"], 117500)
        self.assertEqual(h["matched"]["count"], 83)
        self.assertAlmostEqual(h["meanChangePercent"], 14.6593377226)
        self.assertAlmostEqual(h["matched"]["meanChangePercent"], 9.05604243375)
        altered = copy.deepcopy(self.inputs)
        # A large source-price change must fail the independently transcribed official aggregate.
        altered["points"][0]["price"] += 1000000
        with self.assertRaisesRegex(ValueError, "Official Table"):
            build(altered)


if __name__ == "__main__":
    unittest.main()
