"""Offline city-center publication bundle generator (Python 3.12+, standard library).

Repository: python scripts/hachioji-city-center/generate_bundle.py [--check]
Downloaded files: python generate_bundle.py --input normalized-inputs.json --output ./output
No PDF extraction, network access, or runtime clock is used.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAME = "hachioji-city-center-2026-10-27.r1.json"
EXPECTED_IDS = {str(i) for i in range(1, 13)} | {"13-1", "13-2"} | {str(i) for i in range(14, 32)}
PLAN_IDS = {str(i) for i in [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31]}


def dump(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def integer(value: object) -> int:
    if type(value) is not int or value < 0:
        raise ValueError("Counts must be nonnegative integers; missing is not zero")
    return value


def rate(current: int, previous: int) -> float | None:
    if previous == 0:
        return None
    return float((Decimal(current - previous) / Decimal(previous) * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def weighted(holiday: int, weekday: int) -> int:
    return int((Decimal(2 * integer(holiday) + 5 * integer(weekday)) / 7).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def validate(data: dict) -> None:
    if data["schemaVersion"] != 1 or data["years"] != list(range(2016, 2026)):
        raise ValueError("Unexpected schema/observation years")
    points = data["points"]
    if len(points) != 32 or {p["id"] for p in points} != EXPECTED_IDS:
        raise ValueError("Duplicate/missing point or subtotal included")
    if set(data["planPointIds"]) != PLAN_IDS or len(data["planPointIds"]) != 23:
        raise ValueError("Wrong plan subset")
    for p in points:
        if not p["name"].strip() or type(p["inPlan"]) is not bool or p["inPlan"] != (p["id"] in PLAN_IDS):
            raise ValueError("Invalid point identity/subset")
        for day in ("holiday", "weekday"):
            if len(p[day]) != 10:
                raise ValueError("Missing year")
            for value in p[day]:
                integer(value)
    for i in range(10):
        for day in ("holiday", "weekday"):
            if sum(p[day][i] for p in points) != integer(data["publishedAll32"][day][i]):
                raise ValueError("All-32 source reconciliation failed")
    for anchor in data["publishedPlan23"]:
        i = data["years"].index(anchor["year"])
        h, w = (sum(p[day][i] for p in points if p["inPlan"]) for day in ("holiday", "weekday"))
        if (h, w, weighted(h, w)) != (anchor["holiday"], anchor["weekday"], anchor["weighted"]):
            raise ValueError("Plan-23 source reconciliation failed")
    if {a["year"] for a in data["publishedPlan23"]} != {2023, 2024, 2025}:
        raise ValueError("Missing visual source anchors")
    # The published baseline is reproduced from four rounded annual indicators.
    # Averaging unrounded daily estimates would instead round to 117,768.
    numerator = sum(weighted(sum(p["holiday"][i] for p in points if p["inPlan"]), sum(p["weekday"][i] for p in points if p["inPlan"])) for i in range(2, 6))
    baseline = int((Decimal(numerator) / 4).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if baseline != data["planBaseline"]["weighted"] or data["planBaseline"]["years"] != [2018, 2019, 2020, 2021]:
        raise ValueError("Baseline must include the four declared years")
    for key, field, years in [("population", "population", [list(range(2012, 2022)), list(range(2022, 2026))]), ("vacancies", "count", [list(range(2018, 2022)), list(range(2021, 2026))])]:
        series = data[key]
        if series["joined"] is not False or not series["reason"]:
            raise ValueError("Unverified period boundary must remain split")
        for period, expected in zip(("historical", "recent"), years, strict=True):
            if [r["year"] for r in series[period]] != expected:
                raise ValueError("Wrong period or future target included")
            for row in series[period]:
                integer(row[field])
                if key == "population" and period == "historical":
                    integer(row["cityPopulation"])
    if data["survey"]["dates"]["2025"] != {"holiday": "2025-11-23", "weekday": "2025-11-25"}:
        raise ValueError("Wrong current survey dates")
    if not data["survey"]["exceptions"] or data["housing"]["completedSupplyCountAvailable"] is not False:
        raise ValueError("Missing observation/supply limits")
    if len(data["sources"]) != 6 or len({s["id"] for s in data["sources"]}) != 6:
        raise ValueError("Incomplete provenance")
    if data["localReconciliation"] != {"individual2025Profiles": 32, "historicalEditions": [2023, 2024], "all32AnnualTotals": 20}:
        raise ValueError("Local source checks are incomplete")
    for source in data["sources"]:
        if not source["url"].startswith("https://www.city.hachioji.tokyo.jp/") or not re.fullmatch(r"[a-f0-9]{64}", source["sha256"]):
            raise ValueError("Invalid source provenance")


def annual(points: list[dict], years: list[int]) -> list[dict]:
    result = []
    for i, year in enumerate(years):
        h, w = (sum(p[day][i] for p in points) for day in ("holiday", "weekday"))
        result.append({"year": year, "holiday": h, "weekday": w, "weighted": weighted(h, w)})
    return result


def comparison(first: dict, last: dict, key: str) -> dict:
    return {"from": first["year"], "to": last["year"], "first": first[key], "last": last[key], "delta": last[key] - first[key], "percent": rate(last[key], first[key])}


def build(data: dict) -> dict:
    validate(data)
    plan = annual([p for p in data["points"] if p["inPlan"]], data["years"])
    all_points = annual(data["points"], data["years"])
    changes = [{"id": p["id"], "name": p["name"], "inPlan": p["inPlan"],
                **{day: {"previous": p[day][-2], "current": p[day][-1], "delta": p[day][-1] - p[day][-2], "percent": rate(p[day][-1], p[day][-2])} for day in ("holiday", "weekday")}}
               for p in data["points"]]
    population, vacancy = data["population"], data["vacancies"]
    return {"schemaVersion": 1, "version": "2026-10-27.r1", "reviewedOn": data["reviewedOn"],
            "population": population, "vacancies": vacancy, "survey": data["survey"], "housing": data["housing"],
            "walking": {"plan23": plan, "all32": all_points, "pointChanges": changes, "baseline": data["planBaseline"]},
            "summary": {"population": comparison(population["recent"][0], population["recent"][-1], "population"),
                        "vacancies": comparison(vacancy["recent"][0], vacancy["recent"][-1], "count"),
                        "planYearOnYear": {day: comparison(plan[-2], plan[-1], day) for day in ("holiday", "weekday", "weighted")},
                        "planSince2016": {day: comparison(plan[0], plan[-1], day) for day in ("holiday", "weekday", "weighted")},
                        "allYearOnYear": {day: comparison(all_points[-2], all_points[-1], day) for day in ("holiday", "weekday")},
                        "historicalPopulation": comparison(population["historical"][0], population["historical"][-1], "population"),
                        "historicalCityPopulation": comparison(population["historical"][0], population["historical"][-1], "cityPopulation")},
            "discrepancies": data["discrepancies"]}


def csv_bytes(rows: list[dict]) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode("utf-8-sig")


def outputs(input_path: Path) -> dict[str, bytes]:
    raw = input_path.read_bytes()
    inputs = json.loads(raw)
    bundle = build(inputs)
    files = {NAME: dump(bundle), "normalized-inputs.json": raw,
             "generate_bundle.py": Path(__file__).read_bytes(), "prepare_sources.py": (HERE / "prepare_sources.py").read_bytes()}
    files["annual-counts.csv"] = csv_bytes([{"subset": subset, "unit": "person-passages/13h", **r} for subset, key in [("plan23", "plan23"), ("all32", "all32")] for r in bundle["walking"][key]])
    files["point-changes.csv"] = csv_bytes([{"id": p["id"], "name": p["name"], "inPlan23": p["inPlan"], "fromYear": 2024, "toYear": 2025, "dayType": day, **p[day]} for p in bundle["walking"]["pointChanges"] for day in ("holiday", "weekday")])
    files["population.csv"] = csv_bytes([{"series": period, "year": r["year"], "targetDate": f'{r["year"]}-12-31', "population": r["population"], "cityPopulation": r.get("cityPopulation", ""), "source": inputs["population"]["sourceRefs"][period]} for period in ("historical", "recent") for r in inputs["population"][period]])
    files["vacancies.csv"] = csv_bytes([{"series": period, "fiscalYear": r["year"], "count": r["count"], "unit": "ground-floor vacant storefronts", "source": inputs["vacancies"]["sourceRefs"][period]} for period in ("historical", "recent") for r in inputs["vacancies"][period]])
    files["README.txt"] = ("八王子の中心市街地は発展しつつある？ 集計データ\n"
        "出典: 八王子市 中心市街地活性化基本計画・定期フォローアップ・歩行量調査。\n"
        "原本PDFと原図は配布しません。抽出した事実数値を独自に集計しています。全PDFにCC BY許諾があるとするものではありません。\n"
        "再生成: Python 3.12以上、標準ライブラリのみ。配布ファイルを同じフォルダに置き、\n"
        "python generate_bundle.py --input normalized-inputs.json --output ./output\n"
        "照合: 上記に --check を追加。出力先の既存ファイルと比較し、変更しません。\n"
        "ローカル原本抽出（CI対象外）: pypdfとsource-inspection.jsonが必要。repo内でprepare_sources.py --source-dir 原本保存先 を実行。\n"
        "歩行: 23地点と全32地点を分離。加重平均=(休日×2+平日×5)/7、四捨五入。人/13時間の通過計数でユニーク人数ではありません。\n"
        "2023年度No.12の休日は12月3日再調査。原本の誤記や年代・範囲の制約は記事・manifest参照。\n"
        "人口/空き店舗の旧・新系列は接続しません。年と年度、12月末人口、11月調査を区別してください。\n").encode("utf-8")
    manifest = {"schemaVersion": 1, "reviewedOn": inputs["reviewedOn"], "generatorSha256": sha(files["generate_bundle.py"]),
                "sources": inputs["sources"], "sourcePages": {"walking": "walking-2025:本文1,2,4,6,18,19・各地点個票21–52 / PDF3,4,6,8,20,21,23–54", "population": inputs["population"]["sourceRefs"], "vacancies": inputs["vacancies"]["sourceRefs"], "housing": inputs["housing"]["sourceRef"]},
                "rights": "抽出した事実数値と独自の加工結果を出典付きで配布。市の原文・原図・写真・地形図・原表レイアウトは転載しない。包括CC BY許諾は主張しない。",
                "methods": {"walking": "中学生以上・乗車中自転車除外、9–22時13時間、23/32地点の固定集合。2:5加重・四捨五入。公表基準値117,769は丸め済み2018–2021年度指標の平均117,768.5を四捨五入すると再現する。", "continuity": inputs["survey"]["continuity"], "population": inputs["population"]["reason"], "vacancies": inputs["vacancies"]["reason"]},
                "officialReconciliation": {"passed": True, **inputs["localReconciliation"], "plan23AnchoredYears": [2023, 2024, 2025], "baseline2018to2021": 117769, "noDuplicateSubtotal": True},
                "discrepancies": inputs["discrepancies"], "files": {name: sha(content) for name, content in sorted(files.items())}}
    files["source-manifest.json"] = dump(manifest)
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=HERE / "normalized-inputs.json")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repo_mode = args.output is None
    root = HERE.parents[1]
    target = args.output or root / "public/data/hachioji-city-center"
    files = outputs(args.input)
    if args.check:
        if not target.is_dir() or {p.name for p in target.iterdir()} != set(files):
            raise SystemExit("Publication file set mismatch")
        for name, content in files.items():
            if (target / name).read_bytes() != content:
                raise SystemExit(f"Reproduction mismatch: {name}")
    else:
        target.mkdir(parents=True, exist_ok=True)
        for name, content in files.items():
            (target / name).write_bytes(content)
    if repo_mode:
        article = root / "app/(monetized)/labs/hachioji-city-center/data" / NAME
        if args.check:
            if article.read_bytes() != files[NAME]:
                raise SystemExit("Article/public bundle mismatch")
        else:
            article.parent.mkdir(parents=True, exist_ok=True)
            article.write_bytes(files[NAME])
    print(f'City center bundle: {"CHECK PASS" if args.check else "generated"} ({len(files)} files, offline)')


if __name__ == "__main__":
    main()
