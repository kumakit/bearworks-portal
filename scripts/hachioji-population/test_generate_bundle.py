import json
import unittest

from generate_bundle import INPUT, build_artifacts, compare_rate_values, percent, rate_order, top_ten_with_ties


class PopulationBundleTests(unittest.TestCase):
    def test_baseline_must_be_positive(self):
        with self.assertRaises(ValueError):
            percent(1, 0)

    def test_rate_order_uses_exact_ratios_not_rounded_display_values(self):
        rows = [
            {"name": "Rounded tie but lower", "delta": 1, "population2016": 2000},
            {"name": "Rounded tie but higher", "delta": 1, "population2016": 1999},
            {"name": "Exact tie B", "delta": 2, "population2016": 398},
            {"name": "Exact tie A", "delta": 1, "population2016": 199},
        ]
        self.assertEqual(percent(1, 2000), percent(1, 1999))
        ordered = rate_order(rows, descending=True)
        self.assertEqual([row["name"] for row in ordered[:2]], ["Exact tie A", "Exact tie B"])
        self.assertEqual(compare_rate_values(rows[2], rows[3]), 0)
        self.assertNotEqual(compare_rate_values(rows[0], rows[1]), 0)
        ranked = top_ten_with_ties(ordered * 3, lambda row, cutoff: -compare_rate_values(row, cutoff))
        self.assertEqual({row["name"] for row in ranked if compare_rate_values(row, ranked[0]) == 0}, {"Exact tie A", "Exact tie B"})

    def test_real_inputs_keep_exclusions_out_of_ranked_values(self):
        artifacts = build_artifacts(INPUT)
        bundle_file = next(path for path in artifacts if path.name.endswith(".r1.json"))
        bundle = json.loads(artifacts[bundle_file])
        excluded = {row["code"] for row in bundle["excludedRegions"]["rows"]}
        self.assertEqual(bundle["regions"]["count"], 191)
        self.assertEqual(len(excluded), 8)
        self.assertTrue(all(row["code"] not in excluded for row in bundle["regions"]["rows"]))
        self.assertTrue(all("delta" not in row and "changePercent" not in row for row in bundle["excludedRegions"]["rows"]))

    def test_source_hashes_are_locked(self):
        artifacts = build_artifacts(INPUT)
        bundle = next(value for path, value in artifacts.items() if path.name.endswith(".r1.json"))
        lock = json.loads(artifacts[next(path for path in artifacts if path.name == "lock.json")])
        import hashlib
        self.assertEqual(hashlib.sha256(bundle).hexdigest(), lock["sha256"])


if __name__ == "__main__":
    unittest.main()
