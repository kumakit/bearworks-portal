import copy
import json
import unittest
from pathlib import Path
from generate_bundle import (HERE, build, groups_for_age, integer, normalize_name, percentage,
                             statistics, validate_inputs, comparison_rows)
class AgingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((HERE/"normalized-inputs.json").read_text(encoding="utf-8"))
        cls.exclusions=json.loads((HERE/"region-exclusions.json").read_text(encoding="utf-8"))
        cls.retrieval=json.loads((HERE/"retrieval.json").read_text(encoding="utf-8"))
    def test_boundaries(self):
        for age,group,over75,over85 in [(14,"age0_14",False,False),(15,"age15_64",False,False),(64,"age15_64",False,False),(65,"age65plus",False,False),(74,"age65plus",False,False),(75,"age65plus",True,False),(84,"age65plus",True,False),(85,"age65plus",True,True)]:
            self.assertEqual(groups_for_age(age),(group,over75,over85))
    def test_age_bins_are_nested_not_additive(self):
        s=statistics(dict(population=21,bins=[1]*21))
        self.assertEqual([s[k] for k in ("age0_14","age15_64","age65plus","age75plus","age85plus")],[3,10,8,6,4])
        self.assertEqual(s["age0_14"]+s["age15_64"]+s["age65plus"],21)
    def test_missing_and_negative_fail(self):
        for bad in (None,"",False,-1,1.5):
            with self.assertRaises(ValueError): integer(bad)
    def test_zero_denominator(self):
        self.assertIsNone(percentage(0,0))
        with self.assertRaises(ValueError): percentage(1,0)
        with self.assertRaises(ValueError): percentage(2,1)
        self.assertIsNone(statistics(dict(population=0,bins=[0]*21))["share65plus"])
    def test_total_mismatch(self):
        with self.assertRaises(ValueError): statistics(dict(population=22,bins=[1]*21))
    def test_explicit_name_normalization(self):
        self.assertEqual(normalize_name("絹ヶ丘一丁目"),"絹ケ丘1丁目")
        self.assertNotEqual(normalize_name("南町"),normalize_name("南新町"))
    def test_duplicate_town_rejected(self):
        data=copy.deepcopy(self.data)
        data["city"][1]["towns"][0]["code"]=data["city"][1]["towns"][1]["code"]
        with self.assertRaises(ValueError): validate_inputs(data,self.exclusions)
    def test_crosswalk_name_rejected(self):
        data=copy.deepcopy(self.data); data["city"][1]["towns"][0]["name"]="別町"
        with self.assertRaises(ValueError): validate_inputs(data,self.exclusions)
    def test_unknown_ages_require_review(self):
        data=copy.deepcopy(self.data); data["comparison"]["rows"][0]["unknown"]=1
        with self.assertRaises(ValueError): validate_inputs(data,self.exclusions)
    def test_dates_require_same_definition(self):
        data=copy.deepcopy(self.data); data["city"][0]["targetDate"]="2016-01-01"
        with self.assertRaises(ValueError): validate_inputs(data,self.exclusions)
    def test_official_all_town_and_city_totals(self):
        bundle,_=build(self.data,self.exclusions,self.retrieval)
        self.assertEqual([r["population"] for r in bundle["city"]],[563327,559320])
        self.assertEqual([r["age75plus"] for r in bundle["city"]],[66109,95600])
        self.assertEqual([r["age85plus"] for r in bundle["city"]],[17822,30379])
        for city,source in zip(bundle["city"],self.data["city"]):
            self.assertEqual(sum(statistics(r)["age65plus"] for r in source["towns"]),city["age65plus"])
    def test_exclusions_keep_latest_but_no_change(self):
        bundle,_=build(self.data,self.exclusions,self.retrieval)
        excluded=[r for r in bundle["regions"] if r["exclusion"]]
        self.assertEqual(len(excluded),8)
        self.assertTrue(all(r["previous"] is None and r["points"] is None and r["delta65"] is None and not r["comparisonEligible"] for r in excluded))
        self.assertEqual(len([r for r in bundle["regions"] if r["previous"]]),191)
    def test_small_population_is_not_ranked(self):
        bundle,_=build(self.data,self.exclusions,self.retrieval)
        self.assertEqual(bundle["regionalSummary"]["changeEligible"],189)
        self.assertTrue(all(not r["comparisonEligible"] for r in bundle["regions"] if r["smallPopulation"]))
    def test_points_are_not_relative_percent(self):
        a=statistics(dict(population=100,bins=[80]+[0]*12+[20]+[0]*7))
        b=statistics(dict(population=100,bins=[70]+[0]*12+[30]+[0]*7))
        # Use complete totals while isolating a 10-point change.
        a["population"]=100; b["population"]=100
        row=comparison_rows(a,b)[2]
        self.assertEqual(row["points"],10)
        self.assertEqual(row["delta"],10)
    def test_exclusive_groups_sum(self):
        bundle,_=build(self.data,self.exclusions,self.retrieval)
        for field,city in (("before",bundle["city"][0]),("after",bundle["city"][1])):
            self.assertEqual(sum(r[field] for r in bundle["exclusiveGroups"]),city["population"])
        self.assertEqual(sum(r["delta"] for r in bundle["exclusiveGroups"]),559320-563327)
        self.assertTrue(all(r["before"]>=0 and r["after"]>=0 for r in bundle["exclusiveGroups"]))
if __name__=="__main__": unittest.main()
