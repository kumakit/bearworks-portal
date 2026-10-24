#!/usr/bin/env python3
"""Build the fixed, reproducible public bundle for Issue #410."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from functools import cmp_to_key
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "docs/task/issue-410/evidence/normalized"
EXCLUSIONS = ROOT / "docs/task/issue-410/region-exclusions.json"
MANIFEST = ROOT / "docs/task/issue-410/source-manifest.json"
BUNDLE_NAME = "hachioji-population-2026-10-24.r1.json"
ARTICLE_DATA = ROOT / "app/(monetized)/labs/hachioji-population/data"
PUBLIC_DATA = ROOT / "public/data/hachioji-population"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def percent(delta: int, baseline: int) -> float:
    if baseline <= 0:
        raise ValueError("percentage requires a positive baseline")
    return round(delta * 100 / baseline, 4)


def compare_rate_values(left: dict[str, Any], right: dict[str, Any]) -> int:
    """Compare exact delta/baseline ratios without display rounding."""
    return left["delta"] * right["population2016"] - right["delta"] * left["population2016"]


def rate_order(rows: list[dict[str, Any]], descending: bool) -> list[dict[str, Any]]:
    def compare(left: dict[str, Any], right: dict[str, Any]) -> int:
        result = compare_rate_values(left, right)
        if descending:
            result = -result
        if result:
            return result
        return (left["name"] > right["name"]) - (left["name"] < right["name"])

    return sorted(rows, key=cmp_to_key(compare))


def top_ten_with_ties(rows: list[dict[str, Any]], compare_in_order) -> list[dict[str, Any]]:
    if len(rows) <= 10:
        return rows
    cutoff = rows[9]
    return [row for row in rows if compare_in_order(row, cutoff) <= 0]


def write_csv(rows: list[dict[str, Any]]) -> bytes:
    if not rows:
        raise ValueError("cannot write an empty CSV")
    import io

    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def load_inputs(input_dir: Path = INPUT) -> dict[str, list[dict[str, str]]]:
    annual = read_csv(input_dir / "annual-population.csv")
    crosswalk = read_csv(input_dir / "town-code-crosswalk.csv")
    age_2016 = read_csv(input_dir / "age-2016-09.csv")
    age_2026 = read_csv(input_dir / "age-2026-09.csv")
    excluded_reference = read_csv(input_dir / "excluded-region-reference.csv")
    discrepancies = read_csv(input_dir / "csv-2026-discrepancies.csv")
    return {"annual": annual, "crosswalk": crosswalk, "age2016": age_2016,
            "age2026": age_2026, "excluded": excluded_reference,
            "discrepancies": discrepancies}


def build_artifacts(input_dir: Path = INPUT) -> dict[str, bytes]:
    data = load_inputs(input_dir)
    years = list(range(2016, 2027))
    annual = data["annual"]
    if len(annual) != len(years) or [int(row["targetDate"][:4]) for row in annual] != years:
        raise ValueError("annual series must contain each September 2016–2026 exactly once")
    if any(row["targetDate"] != f"{year}-09-30" or int(row["rows"]) != 199 for year, row in zip(years, annual)):
        raise ValueError("annual series must be official September 30 snapshots with 199 rows")
    totals = {int(row["targetDate"][:4]): int(row["total"]) for row in annual}
    if totals[2016] != 563327 or totals[2026] != 559320:
        raise ValueError("city totals changed; recheck the adopted source version and article text")

    crosswalk = data["crosswalk"]
    if len(crosswalk) != 199 or len({row["code"] for row in crosswalk}) != 199:
        raise ValueError("town crosswalk must contain 199 unique codes")
    exclusion_rows = data["excluded"]
    if len(exclusion_rows) != 8 or len({row["code"] for row in exclusion_rows}) != 8:
        raise ValueError("exactly eight separately documented boundary-related exclusions are expected")
    excluded_codes = {row["code"] for row in exclusion_rows}
    by_code = {row["code"]: row for row in crosswalk}
    if not excluded_codes.issubset(by_code):
        raise ValueError("excluded reference rows must exist in the 199-row crosswalk")
    exclusion_data = json.loads(EXCLUSIONS.read_text(encoding="utf-8"))
    for row in exclusion_rows:
        source = by_code[row["code"]]
        if source["name2026"] != row["name"]:
            raise ValueError(f"excluded region name mismatch for {row['code']}")
        if int(source["population2016"]) != int(row["referencePopulation2016"]):
            raise ValueError(f"2016 excluded reference mismatch for {row['code']}")
        if int(source["population2026"]) != int(row["referencePopulation2026"]):
            raise ValueError(f"2026 excluded reference mismatch for {row['code']}")
        if row["name"] not in exclusion_data:
            raise ValueError(f"missing exclusion reason for {row['name']}")

    age_by_year: dict[int, dict[str, dict[str, Any]]] = {}
    for year in (2016, 2026):
        rows = data["age2016"] if year == 2016 else data["age2026"]
        if len(rows) != 199 or len({row["code"] for row in rows}) != 199:
            raise ValueError(f"age-{year} must contain 199 unique town rows")
        age_by_year[year] = {row["code"]: row for row in rows}
        for row in rows:
            groups = [int(row[key]) for key in ("age0_14", "age15_64", "age65plus")]
            if sum(groups) != int(row["population"]):
                raise ValueError(f"age groups do not sum for {year} {row['name']}")
        if sum(int(row["population"]) for row in rows) != totals[year]:
            raise ValueError(f"age population does not match city total for {year}")
    for code, row in by_code.items():
        for year in (2016, 2026):
            if code not in age_by_year[year] or int(row[f"population{year}"]) != int(age_by_year[year][code]["population"]):
                raise ValueError(f"population/age input mismatch for {year} {code}")

    retained: list[dict[str, Any]] = []
    for row in crosswalk:
        if row["code"] in excluded_codes:
            continue
        before, after = int(row["population2016"]), int(row["population2026"])
        delta = after - before
        retained.append({"code": row["code"], "name": row["name2026"],
                         "population2016": before, "population2026": after,
                         "delta": delta, "changePercent": percent(delta, before)})
    if len(retained) != 191:
        raise ValueError(f"expected 191 retained town rows, got {len(retained)}")
    retained.sort(key=lambda row: row["code"])
    if sum(row["population2016"] for row in retained) != 530676 or sum(row["population2026"] for row in retained) != 528044:
        raise ValueError("retained-town subtotal changed; recheck region scope")

    rate_eligible = [row for row in retained if row["population2016"] >= 100]
    small_baseline = [row for row in retained if row["population2016"] < 100]
    if len(rate_eligible) != 190 or len(small_baseline) != 1:
        raise ValueError("the pre-registered 100-person rate threshold no longer yields 190/1 towns")
    delta_sorted = sorted(retained, key=lambda row: (-row["delta"], row["name"]))
    delta_down = sorted(retained, key=lambda row: (row["delta"], row["name"]))
    rate_sorted = rate_order(rate_eligible, descending=True)
    rate_down = rate_order(rate_eligible, descending=False)

    # Keep ten rows plus exact ties at the cutoff; negative rankings reverse the comparison.
    delta_up = delta_sorted[:10]
    if len(delta_sorted) > 10:
        cutoff = delta_sorted[9]["delta"]
        delta_up = [row for row in delta_sorted if row["delta"] >= cutoff]
    delta_down_top = delta_down[:10]
    if len(delta_down) > 10:
        cutoff = delta_down[9]["delta"]
        delta_down_top = [row for row in delta_down if row["delta"] <= cutoff]
    rate_up = top_ten_with_ties(
        rate_sorted, lambda row, cutoff: compare_rate_values(cutoff, row))
    rate_down_top = top_ten_with_ties(
        rate_down, lambda row, cutoff: compare_rate_values(row, cutoff))

    age = []
    for key, label in (("age0_14", "0〜14歳"), ("age15_64", "15〜64歳"), ("age65plus", "65歳以上")):
        start = sum(int(row[key]) for row in data["age2016"])
        end = sum(int(row[key]) for row in data["age2026"])
        age.append({"key": key, "label": label, "population2016": start,
                    "population2026": end, "delta": end - start,
                    "changePercent": percent(end - start, start),
                    "share2016": round(start * 100 / totals[2016], 4),
                    "share2026": round(end * 100 / totals[2026], 4),
                    "shareDeltaPoints": round(end * 100 / totals[2026] - start * 100 / totals[2016], 4)})

    excluded = []
    for row in exclusion_rows:
        reason = exclusion_data[row["name"]]
        excluded.append({"code": row["code"], "name": row["name"],
                         "population2016": int(row["referencePopulation2016"]),
                         "population2026": int(row["referencePopulation2026"]),
                         "reasonType": "confirmed" if reason["status"] == "exclude-confirmed-boundary-change" else "effective-date-unconfirmed",
                         "reason": ("2024年8月10日に区域変更を確認。2016年との連続比較から除外。" if reason["status"] == "exclude-confirmed-boundary-change" else "区域変更の議決を確認。換地処分後の施行日が未確認のため比較対象外。")})
    excluded.sort(key=lambda row: row["name"])

    source_hashes = {name: sha256((input_dir / name).read_bytes()) for name in (
        "annual-population.csv", "town-code-crosswalk.csv", "age-2016-09.csv",
        "age-2026-09.csv", "excluded-region-reference.csv", "csv-2026-discrepancies.csv")}
    result = {
        "schemaVersion": 1,
        "series": "八王子を数字で読み解く",
        "title": "八王子の人口は本当に減っている？",
        "comparison": {"from": "2016-09-30", "to": "2026-09-30", "definition": "住民基本台帳の日本人・外国人合計", "cityPopulation2016": totals[2016], "cityPopulation2026": totals[2026], "cityDelta": totals[2026] - totals[2016], "cityChangePercent": percent(totals[2026] - totals[2016], totals[2016]), "latestYearFrom": 2025, "latestYearTo": 2026, "latestYearDelta": totals[2026] - totals[2025]},
        "annualPopulation": [{"targetDate": row["targetDate"], "population": int(row["total"])} for row in annual],
        "ageComposition": age,
        "regions": {"count": len(retained), "populationCoverage2016": round(530676 * 100 / totals[2016], 4), "populationCoverage2026": round(528044 * 100 / totals[2026], 4), "rows": retained, "deltaIncreaseTop": delta_up, "deltaDecreaseTop": delta_down_top, "rateEligibleCount": len(rate_eligible), "rateExcludedSmallBaseline": [{"code": row["code"], "name": row["name"], "population2016": row["population2016"], "population2026": row["population2026"], "delta": row["delta"]} for row in small_baseline], "rateIncreaseTop": rate_up, "rateDecreaseTop": rate_down_top},
        "excludedRegions": {"count": len(excluded), "confirmedCount": sum(r["reasonType"] == "confirmed" for r in excluded), "effectiveDateUnconfirmedCount": sum(r["reasonType"] == "effective-date-unconfirmed" for r in excluded), "rows": excluded},
        "csvSensitivity": {"year": 2026, "cityTotalCsv": 559329, "cityTotalExcel": 559320, "difference": 9, "tenYearDeltaCsvAlternative": 559329 - totals[2016], "cause": "未確認。市の人口Excel系列を主資料とし、CSVとの差を手補正していない。"},
        "diagnosticNote": "美山町・西寺方町は区域変更関連の除外前に減少上位10町丁へ入った。境界施行日の確認ができないため比較対象外とし、順位から消える影響を方法欄に示す。",
        "limitations": ["191町丁を全市網羅とは扱わない。", "残る191町丁の境界が10年間不変と完全に立証したわけではない。", "人口増減から転入出、出生死亡、開発などの原因を特定しない。", "年齢区分の増減は同じ人々を追跡した結果ではなく、区分間の移動を含む。"],
        "sourceHashes": source_hashes,
    }
    bundle_bytes = (json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    public_manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    public_manifest["plannedPublicArtifacts"] = ["normalized-csv", "aggregate-json", "article-table-chart"]
    public_manifest["plannedFiles"] = ["annual-population.csv", "age-2016-09.csv", "age-2026-09.csv", "retained-region-comparison.csv", "excluded-region-reference.csv", "csv-2026-discrepancies.csv", BUNDLE_NAME, "source-manifest.json"]
    csv_record = next(record for record in public_manifest["records"] if record["filename"] == "population-2026-09.csv")
    csv_record["plannedPublicArtifacts"] = ["derived-discrepancy-csv"]
    csv_record["selectionReason"] = "Only discrepant entries are published for transparency; CSV is not used for the primary series."
    public_manifest["publicBundle"] = {"path": f"/data/hachioji-population/{BUNDLE_NAME}", "sha256": sha256(bundle_bytes)}
    lock = {"bundle": BUNDLE_NAME, "sha256": sha256(bundle_bytes), "bytes": len(bundle_bytes),
            "sourceHashes": source_hashes, "generatedBy": "scripts/hachioji-population/generate_bundle.py"}
    comparison_csv = [{"code": row["code"], "name": row["name"], "population2016": row["population2016"],
                       "population2026": row["population2026"], "delta": row["delta"], "changePercent": row["changePercent"]}
                      for row in retained]
    excluded_csv = [{"code": row["code"], "name": row["name"], "referencePopulation2016": row["population2016"],
                     "referencePopulation2026": row["population2026"], "reasonType": row["reasonType"], "reason": row["reason"]}
                    for row in excluded]
    output = {
        ARTICLE_DATA / BUNDLE_NAME: bundle_bytes,
        ARTICLE_DATA / "lock.json": (json.dumps(lock, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
        PUBLIC_DATA / "source-manifest.json": (json.dumps(public_manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
        PUBLIC_DATA / BUNDLE_NAME: bundle_bytes,
        PUBLIC_DATA / "retained-region-comparison.csv": write_csv(comparison_csv),
        PUBLIC_DATA / "excluded-region-reference.csv": write_csv(excluded_csv),
    }
    for year in (2016, 2026):
        output[PUBLIC_DATA / f"age-{year}-09.csv"] = write_csv(data["age2016"] if year == 2016 else data["age2026"])
    output[PUBLIC_DATA / "annual-population.csv"] = write_csv(annual)
    output[PUBLIC_DATA / "csv-2026-discrepancies.csv"] = (input_dir / "csv-2026-discrepancies.csv").read_bytes()
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=INPUT)
    parser.add_argument("--check", action="store_true", help="fail if any generated file differs")
    args = parser.parse_args()
    artifacts = build_artifacts(args.input_dir)
    failures = []
    for path, expected in artifacts.items():
        if args.check:
            if not path.exists() or path.read_bytes() != expected:
                failures.append(path.relative_to(ROOT).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    if failures:
        raise SystemExit("generated files differ: " + ", ".join(failures))
    print(f"{'verified' if args.check else 'generated'} {len(artifacts)} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
