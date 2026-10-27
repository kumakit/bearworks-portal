from __future__ import annotations

import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from generate_bundle import build, outputs, rate, validate, weighted


class CityCenterAnalysisTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.path = Path(__file__).with_name("normalized-inputs.json")
        cls.source = json.loads(cls.path.read_text(encoding="utf-8"))

    def test_official_anchors_and_two_distinct_point_sets(self):
        data = build(self.source)
        self.assertEqual(data["walking"]["plan23"][-1], {"year": 2025, "holiday": 129272, "weekday": 114530, "weighted": 118742})
        self.assertEqual(data["walking"]["plan23"][0]["weighted"], 124297)
        self.assertEqual(data["walking"]["all32"][-1]["weekday"], 457386)
        self.assertEqual(data["summary"]["planYearOnYear"]["weekday"]["delta"], 2271)
        self.assertEqual(data["summary"]["allYearOnYear"]["weekday"]["delta"], -14343)
        self.assertEqual(data["summary"]["population"]["delta"], 586)
        self.assertEqual(data["summary"]["vacancies"]["delta"], -24)

    def test_weighted_mean_is_not_simple_mean(self):
        self.assertEqual(weighted(129272, 114530), 118742)
        self.assertNotEqual(weighted(129272, 114530), (129272 + 114530) // 2)
        self.assertEqual(weighted(120182, 111671), 114103)

    def test_missing_zero_and_small_denominator(self):
        self.assertIsNone(rate(12, 0))
        self.assertEqual(rate(0, 12), -100)
        self.assertEqual(rate(3, 2), 50)
        for bad in [None, -1, 0.5, True, "100"]:
            with self.subTest(value=bad), self.assertRaises(ValueError):
                weighted(bad, 100)

    def test_duplicate_point_cannot_hide_missing_point(self):
        data = copy.deepcopy(self.source)
        data["points"][-1] = copy.deepcopy(data["points"][0])
        with self.assertRaises(ValueError):
            validate(data)

    def test_subtotal_is_not_an_observation(self):
        data = copy.deepcopy(self.source)
        data["points"][12]["id"] = "13-1,2"
        with self.assertRaises(ValueError):
            validate(data)

    def test_wrong_plan_membership_fails(self):
        data = copy.deepcopy(self.source)
        data["points"][2]["inPlan"] = True
        with self.assertRaises(ValueError):
            validate(data)

    def test_missing_year_or_count_fails(self):
        for mutation in (lambda d: d["points"][0]["holiday"].pop(), lambda d: d["points"][0]["weekday"].__setitem__(9, None)):
            data = copy.deepcopy(self.source)
            mutation(data)
            with self.assertRaises(ValueError):
                validate(data)

    def test_source_sum_and_plan_anchors_are_independent(self):
        data = copy.deepcopy(self.source)
        data["points"][0]["holiday"][9] += 1
        with self.assertRaises(ValueError):
            validate(data)
        data["publishedAll32"]["holiday"][9] += 1
        with self.assertRaises(ValueError):
            validate(data)  # Updating the global total still disagrees with the plan table.

    def test_unknown_boundary_never_joins_periods(self):
        for key in ("population", "vacancies"):
            data = copy.deepcopy(self.source)
            data[key]["joined"] = True
            with self.assertRaises(ValueError):
                validate(data)

    def test_future_targets_and_date_mismatch_fail(self):
        data = copy.deepcopy(self.source)
        data["vacancies"]["recent"].append({"year": 2027, "count": 65})
        with self.assertRaises(ValueError):
            validate(data)
        data = copy.deepcopy(self.source)
        data["survey"]["dates"]["2025"]["weekday"] = "2025-12-31"
        with self.assertRaises(ValueError):
            validate(data)

    def test_baseline_contains_covid_years(self):
        data = copy.deepcopy(self.source)
        data["planBaseline"]["years"] = [2016, 2017, 2018, 2019]
        with self.assertRaises(ValueError):
            validate(data)

    def test_offline_deterministic_generation(self):
        with patch("socket.create_connection", side_effect=AssertionError("Network forbidden")), patch("urllib.request.urlopen", side_effect=AssertionError("Network forbidden")):
            a, b = outputs(self.path), outputs(self.path)
        self.assertEqual(a, b)
        self.assertNotIn(".pdf", " ".join(a))


if __name__ == "__main__":
    unittest.main()
