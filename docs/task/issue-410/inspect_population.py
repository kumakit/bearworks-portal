"""Offline Phase 0 checks, not the final publication pipeline."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import unicodedata
import warnings
import zipfile
from pathlib import Path

import openpyxl
import shapefile
import xlrd

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "evidence" / "sources"
OUTPUT = ROOT / "evidence" / "normalized"


def name(value):
    # Explicit typography equivalence only, not fuzzy geographic matching.
    value = unicodedata.normalize("NFKC", str(value)).translate(
        dict.fromkeys(range(0xE0100, 0xE01F0))).replace("ヶ", "ケ").strip()
    return re.sub(r"([一二三四五六七八九十])丁目$",
                  lambda m: str("一二三四五六七八九十".index(m[1])+1)+"丁目", value)


def sheets(path):
    if path.suffix == ".xls":
        book = xlrd.open_workbook(path)
        return {s.name: [s.row_values(i) for i in range(s.nrows)] for s in book.sheets()}, book.datemode
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Print area cannot be set")
        book = openpyxl.load_workbook(path, read_only=True, data_only=True)
    result = {s.title: list(s.values) for s in book}
    book.close()
    return result, None


def write_csv(filename, rows):
    assert rows
    path = OUTPUT / filename
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    return hashlib.sha256(path.read_bytes()).hexdigest()


def population_excel(year):
    path = next(SOURCES.glob(f"population-{year}-09.xl*"))
    book, _ = sheets(path)
    rows = book["町丁別"]
    date = str(rows[1][3])
    era = f"平成{year - 1988}" if year <= 2018 else ("令和元" if year == 2019 else f"令和{year - 2018}")
    assert date == f"{era}年9月末日現在", (path.name, date)
    assert "日本人＋外国人の合計" in rows[3][2]
    total = int(rows[5][4])
    data = []
    for row in rows[6:]:
        if not row[0] or not isinstance(row[4], (int, float)):
            continue
        population, male, female = map(int, (row[4], row[2], row[3]))
        assert population == male + female
        data.append(dict(name=name(row[0]), population=population, male=male, female=female))
    assert len(data) == 199 and len({r["name"] for r in data}) == 199
    assert sum(r["population"] for r in data) == total
    assert sum(r["male"] for r in data) == int(rows[5][2])
    assert sum(r["female"] for r in data) == int(rows[5][3])
    return dict(source=path.name, targetDate=f"{year}-09-30", total=total, rows=len(data)), data


def population_csv(year):
    path = SOURCES / f"population-{year}-09.csv"
    raw = path.read_bytes()
    encoding = "utf-16" if raw.startswith(b"\xff\xfe") else "cp932"
    records = list(csv.DictReader(io.StringIO(raw.decode(encoding))))
    records = [{unicodedata.normalize("NFKC", k): v for k, v in r.items()} for r in records]
    assert all(r["対象年月"] == f"{year}09" and r["処理年月日"] == f"{year}0930" for r in records)
    assert len(records) == len({int(r["大字コード"]) for r in records}) == 199
    for row in records:
        assert int(row["人口_合計"]) == sum(int(row[k]) for k in ("人口_男", "人口_女", "人口_その他"))
        for sex in ("男", "女"):
            assert int(row[f"人口_{sex}"]) == int(row[f"人口_日本人_{sex}"]) + int(row[f"人口_外国人_{sex}"])
    return records, encoding


def ages(year):
    path = next(SOURCES.glob(f"age-{year}-09.xl*"))
    book, datemode = sheets(path)
    rows = book["町丁別年齢別一覧"]
    raw_date = rows[0][23]
    if isinstance(raw_date, (int, float)):
        target = xlrd.xldate_as_datetime(raw_date, datemode).date().isoformat()
    else:
        assert str(raw_date) == f"令和{year - 2018}年9月末日現在"
        target = f"{year}-09-30"
    assert target == f"{year}-09-30"
    names = {name(r[16]): str(r[17]).zfill(5) for r in book["町丁別年齢別"]
             if len(r) >= 18 and r[16] and r[17] and str(r[17]).isdigit()}
    assert len(names) == 199
    data = []
    for row in rows:
        if not row[0] or row[1] not in ("合計", "総数"):
            continue
        total, young, working, old = map(int, row[2:6])
        five_year = list(map(int, row[6:27]))
        assert young == sum(five_year[:3])
        assert working == sum(five_year[3:13])
        assert old == sum(five_year[13:])
        assert total == young + working + old == sum(five_year)
        data.append(dict(code=names.get(name(row[0]), "city"), name=name(row[0]),
                         population=total, age0_14=young, age15_64=working, age65plus=old))
    city = data.pop(0)
    assert city["name"] == "八王子市"
    assert len(data) == len({r["code"] for r in data}) == 199
    for key in ("population", "age0_14", "age15_64", "age65plus"):
        assert sum(r[key] for r in data) == city[key]
    return city, data


def boundary_records():
    archive = zipfile.ZipFile(SOURCES / "boundary-2020-13201.zip")
    files = archive.namelist()
    get = lambda suffix: io.BytesIO(archive.read(next(n for n in files if n.endswith(suffix))))
    reader = shapefile.Reader(shp=get(".shp"), shx=get(".shx"), dbf=get(".dbf"), encoding="cp932")
    records = [r.as_dict() for r in reader.records()]
    assert all(r["PREF"] + r["CITY"] == "13201" for r in records)
    # Never use census JINKO/SETAI as the article's population values.
    return records


def source_manifest(retrieval):
    entries = []
    for item in retrieval:
        filename = item["filename"]
        match = re.fullmatch(r"(population|age)-(\d{4})-09\.(csv|xls|xlsx)", filename)
        boundary = filename == "boundary-2020-13201.zip"
        if not match and not boundary:
            continue
        if match:
            kind, year, extension = match.groups()
            title = f"{'町丁別世帯数及び人口' if kind == 'population' else '町丁別年齢別人口'}（{year}年9月末日現在）"
            adopted = extension != "csv" and (kind == "population" or year in ("2016", "2026"))
            attribution = f"「{title}」、八王子市、CC BY 4.0"
            license_url = "https://www.city.hachioji.tokyo.jp/contents/open/001/p005861.html#ccby"
            page_record = next((r for r in retrieval if r["filename"] ==
                                (f"population-{year}-excel-page.html" if kind == "population" and extension != "csv"
                                 else f"age-{year}-page.html" if kind == "age"
                                 else "population-current-page.html" if int(year) >= 2024 else "population-old-page.html")), None)
            entry = dict(item, title=title, targetDate=f"{year}-09-30", publisher="八王子市",
                sourcePageUrl=page_record["url"] if page_record else None,
                licenseName="CC BY 4.0 (city open-data terms)", licenseUrl=license_url,
                licenseCheckedAt="2026-10-24 JST", attributionText=attribution,
                modificationNotice=f"{attribution}を基に、文字表記の正規化、地域対応、集計・グラフ化を実施。",
                redistributionDecision="allow", decisionEvidenceUrl="https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html",
                allowedPublicArtifacts=["original-dataset", "normalized-csv", "aggregate-json", "article-table-chart"],
                plannedPublicArtifacts=["normalized-csv", "aggregate-json", "article-table-chart"] if adopted else [],
                analysisAdopted=adopted,
                selectionReason="Official population Excel series cross-checks with age Excel" if adopted
                    else "Cross-check only; CSV discrepancies or alternative-year age dataset",
                applicableScope="Linked population datasets; page logos, photos and unrelated content excluded.")
        else:
            entry = dict(item, title="令和2年国勢調査 町丁・字等境界データ（八王子市・JGD2011）",
                targetDate="2020-10-01", publisher="政府統計の総合窓口(e-Stat)",
                sourcePageUrl="https://www.e-stat.go.jp/gis/statmap-search?type=2&toukeiCode=00200521&toukeiYear=2020&serveyId=A002005212020&datum=2011&aggregateUnitForBoundary=A",
                licenseName="e-Stat terms of use (compatible with CC BY 4.0)",
                licenseUrl="https://www.e-stat.go.jp/terms-of-use", licenseCheckedAt="2026-10-24 JST",
                attributionText="出典：e-Stat『令和2年国勢調査 町丁・字等境界データ』",
                modificationNotice="e-Statの町丁・字等境界データを抽出・簡略化して作成（加工時に表示）。",
                redistributionDecision="allow", decisionEvidenceUrl="https://www.e-stat.go.jp/gis-terms",
                allowedPublicArtifacts=["original-boundary", "derived-boundary", "derived-svg"],
                plannedPublicArtifacts=[], analysisAdopted=False,
                selectionReason="Licence permits reuse; map not adopted for geographic comparability reasons.",
                applicableScope="Downloaded official vector boundary only; no basemap tiles, screenshots, logos or third-party media.")
        entries.append(entry)
    payload = dict(schemaVersion=1, checkedAt="2026-10-24 JST", records=entries,
        note="Allow decisions cover named datasets under cited terms, not unrelated page assets. No public assets created in Phase 0.")
    (ROOT / "source-manifest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    retrieval = json.loads((ROOT / "evidence" / "retrieval.json").read_text(encoding="utf-8"))
    for item in retrieval:
        if item.get("sha256"):
            assert hashlib.sha256((SOURCES / item["filename"]).read_bytes()).hexdigest() == item["sha256"]
    exclusions = json.loads((ROOT / "region-exclusions.json").read_text(encoding="utf-8"))
    result = {"policy": json.loads((ROOT / "phase0-policy.json").read_text()),
              "annualPopulationExcel": [], "csvCrossChecks": [], "ageChecks": {}, "outputHashes": {}}
    populations = {}
    for year in range(2016, 2027):
        info, rows = population_excel(year)
        populations[year] = {r["name"]: r for r in rows}
        result["annualPopulationExcel"].append(info)
        if (SOURCES / f"population-{year}-09.csv").exists():
            records, encoding = population_csv(year)
            total = sum(int(r["人口_合計"]) for r in records)
            result["csvCrossChecks"].append(dict(year=year, encoding=encoding, csvTotal=total,
                                                excelTotal=info["total"], difference=total-info["total"]))
    age_rows = {}
    for year in (2016, 2023, 2024, 2025, 2026):
        city, rows = ages(year)
        by_name = {r["name"]: r for r in rows}
        assert set(by_name) == set(populations[year])
        assert all(r["population"] == populations[year][r["name"]]["population"] for r in rows)
        result["ageChecks"][str(year)] = dict(city=city, rows=len(rows), mismatchesWithPopulationExcel=0,
                                            unknownAgeResidual=0)
        result["outputHashes"][f"age-{year}-09.csv"] = write_csv(f"age-{year}-09.csv", rows)
        age_rows[year] = {r["code"]: r for r in rows}
    assert set(age_rows[2016]) == set(age_rows[2026])
    crosswalk = []
    for code, before in age_rows[2016].items():
        after = age_rows[2026][code]
        assert before["name"] == after["name"]
        crosswalk.append(dict(code=code, name2016=before["name"], name2026=after["name"],
                              population2016=before["population"], population2026=after["population"],
                              delta=after["population"]-before["population"],
                              status=exclusions.get(before["name"], {}).get("status", "retained-with-geographic-audit-limits"),
                              geographicEvidenceUrl=exclusions.get(before["name"], {}).get("evidenceUrl", "")))
    records = boundary_records()
    names = {}
    for record in records:
        if record["HCODE"] == 8101:
            names.setdefault(name(record["S_NAME"]), []).append(record)
    candidates = []
    for row in crosswalk:
        found = names.get(row["name2026"], [])
        candidates.append(dict(code=row["code"], name=row["name2026"], candidatePolygonCount=len(found),
                               candidateKeys="|".join(sorted({r["KEY_CODE"] for r in found})),
                               status="name-candidate-only" if found else "unmatched"))
    matches = {r["code"] for r in candidates if r["candidatePolygonCount"]}
    result["boundaryCheck"] = dict(features=len(records), hcodes=sorted({r["HCODE"] for r in records}),
                                   distinctNames=len(names), nameCandidateRows=len(matches), officialRows=199,
                                   nameCandidateRowCoverage=len(matches)/199,
                                   nameCandidatePopulationCoverage={str(y): sum(r["population"] for k,r in age_rows[y].items() if k in matches)/sum(r["population"] for r in age_rows[y].values()) for y in (2016,2026)},
                                   unmatched=[r for r in candidates if not r["candidatePolygonCount"]],
                                   certifiedCoverage=None,
                                   note="Name matches are candidates, not geographic equivalence evidence.")
    retained = [r for r in crosswalk if r["name2026"] not in exclusions]
    row_coverage = len(retained)/199
    pop_coverage = {str(y):sum(r[f"population{y}"] for r in retained)/sum(r["population"] for r in age_rows[y].values()) for y in (2016,2026)}
    # Diagnostic top-ten check before exclusions: avoid concealing prominent regions by filtering first.
    unresolved_top = set()
    for metric, minimum in ((lambda r:r["delta"], 0), (lambda r:r["delta"]/r["population2016"], 100)):
        candidates_for_metric = [r for r in crosswalk if r["population2016"] >= minimum]
        for positive in (True, False):
            subset = [r for r in candidates_for_metric if (metric(r)>0 if positive else metric(r)<0)]
            ranked = sorted(subset, key=metric, reverse=positive)
            if ranked:
                threshold = metric(ranked[min(9,len(ranked)-1)])
                top = [r for r in ranked if (metric(r)>=threshold if positive else metric(r)<=threshold)]
                unresolved_top.update(r["name2026"] for r in top if r["name2026"] in exclusions)
    result["regionalDecision"] = dict(retainedRows=len(retained), excludedRows=len(exclusions),
        retainedRowCoverage=row_coverage, retainedPopulationCoverage=pop_coverage,
        geographicEquivalenceProvenForAllRetained=False,
        unresolvedRegionsInDiagnosticTopTen=sorted(unresolved_top),
        mapAdopted=False,
        mapReason="Conservative exclusions fail population coverage and prominent-region geography remains unresolved; name matching alone is insufficient.")
    result["outputHashes"]["town-code-crosswalk.csv"] = write_csv("town-code-crosswalk.csv", crosswalk)
    result["outputHashes"]["boundary-candidates.csv"] = write_csv("boundary-candidates.csv", candidates)
    result["outputHashes"]["annual-population.csv"] = write_csv("annual-population.csv", result["annualPopulationExcel"])
    discrepancies = []
    records, _ = population_csv(2026)
    for row in records:
        code = str(int(row["大字コード"])).zfill(5)
        age = age_rows[2026][code]
        if int(row["人口_合計"]) != age["population"]:
            discrepancies.append(dict(code=code, name=age["name"], csv=int(row["人口_合計"]),
                                      populationExcel=age["population"], ageExcel=age["population"],
                                      difference=int(row["人口_合計"])-age["population"]))
    result["csv2026Discrepancies"] = discrepancies
    assert sum(r["difference"] for r in discrepancies) == 9
    result["outputHashes"]["csv-2026-discrepancies.csv"] = write_csv("csv-2026-discrepancies.csv", discrepancies)
    (ROOT / "evidence" / "validation.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    source_manifest(retrieval)
    print(json.dumps(dict(annual=result["annualPopulationExcel"],
                          csvCrossChecks=result["csvCrossChecks"],
                          ageChecks=result["ageChecks"],
                          boundaryCheck=result["boundaryCheck"], regionalDecision=result["regionalDecision"]), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
