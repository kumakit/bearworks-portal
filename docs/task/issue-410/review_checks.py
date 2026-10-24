"""Offline evidence requested by the r2 review; no boundary-event inference."""
from __future__ import annotations

import csv
import html
import json
import re
from inspect_population import ROOT, SOURCES, ages, population_excel, write_csv


def main():
    exclusions = json.loads((ROOT / "region-exclusions.json").read_text(encoding="utf-8"))
    crosswalk = list(csv.DictReader((ROOT / "evidence/normalized/town-code-crosswalk.csv").open(encoding="utf-8")))
    retained = [r for r in crosswalk if not r["status"].startswith("exclude")]
    excluded = []
    for row in crosswalk:
        if row["name2026"] in exclusions:
            excluded.append(dict(code=row["code"], name=row["name2026"],
                                 referencePopulation2016=int(row["population2016"]),
                                 referencePopulation2026=int(row["population2026"]),
                                 reason=exclusions[row["name2026"]]["status"],
                                 display="reference-only; no rank/difference/rate; separate population snapshots"))
    targets = ["川口町", "上川町", "西寺方町", "美山町"]
    followup = []
    for year in range(2023,2027):
        _, rows = population_excel(year)
        population = {r["name"]:r["population"] for r in rows}
        _, age_rows = ages(year)
        age_values = {r["name"]:r["population"] for r in age_rows}
        for target in targets:
            assert target in population and target in age_values
            assert population[target] == age_values[target]
            followup.append(dict(name=target, targetDate=f"{year}-09-30", populationExcel=population[target],
                                 ageExcel=age_values[target], ageRowPresent=True,
                                 boundaryEffectiveDateInference="not-identifiable-from-population"))
    totals = {str(y):sum(int(r[f"population{y}"]) for r in retained) for y in (2016,2026)}
    below = [r for r in retained if int(r["population2016"])<100]
    city2016, _ = ages(2016)
    city2026, _ = ages(2026)
    scope = dict(city=dict(officialRows=len(crosswalk),population2016=city2016["population"],population2026=city2026["population"]),
                 regional=dict(candidateRows=len(retained),subtotals=totals,excludedRows=len(excluded),
                               coverageLabel=f"{len(retained)}町丁・2026年9月末全市人口の{totals['2026']/city2026['population']*100:.1f}%",
                               exclusionLabel=f"{len(excluded)}町丁は区域変更確認済み、または施行時点が未確認のため比較対象外",
                               below100Rows=len(below), rateEligibleRows=len(retained)-len(below),
                               below100Names=[r["name2026"] for r in below]),
                 ageDefinition="City-wide age composition denominator is city population; not the 191-row subtotal.",
                 nationalityBreakdown="Not adopted: primary population/age Excel tables have no Japanese/foreign breakdown. CSV has detail but is not the adopted series.")
    retrieval = json.loads((ROOT/"evidence/retrieval.json").read_text(encoding="utf-8"))
    wanted = {"population-2026-09.csv","population-2026-09.xlsx","age-2026-09.xlsx",
              "population-2025-09.csv","population-2024-09.csv"}
    versions = [{k:r.get(k) for k in ("filename","url","retrievedAt","lastModified","sha256")}
                for r in retrieval if r["filename"] in wanted]
    page_dates = []
    for filename in ("population-current-page.html","population-2026-excel-page.html","age-2026-page.html"):
        text = html.unescape(re.sub(r"<[^>]+>"," ",(SOURCES/filename).read_text(encoding="utf-8")))
        m = re.search(r"更新日\s*[：:]\s*([^\r\n]+)",text)
        page_dates.append(dict(filename=filename,displayedUpdate=m[1].strip() if m else None))
    report = dict(displayScope=scope,regionalFollowup=followup,sourceVersionHeaders=versions,
                  pageUpdateLabels=page_dates,
                  sourceFreshnessConclusion="Last-Modified is HTTP resource metadata; does not establish the statistics revision date or explain CSV/Excel differences.",
                  csvSensitivity=dict(csv2026Total=559329,csv2016Total=563327,csvDelta=-3998,
                                      csvRate=(559329/563327-1)*100, excelDelta=-4007,
                                      directionUnchanged=True), outputHashes={})
    report["outputHashes"]["excluded-region-reference.csv"] = write_csv("excluded-region-reference.csv",excluded)
    report["outputHashes"]["regional-2023-2026-followup.csv"] = write_csv("regional-2023-2026-followup.csv",followup)
    (ROOT/"evidence/review-checks.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()
