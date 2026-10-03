"""Independent stdlib-only CSV parser and numerical verification. No JS imports."""
import csv
import hashlib
import io
import json
from datetime import date, timedelta
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/hachioji-rain-autumn"
manifest = json.loads((SOURCE / "source-manifest.json").read_text(encoding="utf-8"))
raw = (SOURCE / manifest["filename"]).read_bytes()
assert hashlib.sha256(raw).hexdigest() == manifest["sha256"]
table = list(csv.reader(io.StringIO(raw.decode("cp932"))))
header = next(i for i, r in enumerate(table) if r and r[0] == "年月日")
assert table[header][1] == "平均気温(℃)" and table[header][10] == "降水量の合計(mm)"
assert table[header][13] == "平均気温(℃)" and table[header][22] == "降水量の合計(mm)"
assert table[header - 1][1] == "八王子" and table[header - 1][13] == "東京"
rows = []
for r in table:
    if not r or "/" not in r[0] or not r[0][:4].isdigit():
        continue
    d = date(*map(int, r[0].split("/")))
    rows.append({"date": d, "h": float(r[10]) if r[10] else None, "hq": int(r[11]),
                 "t": float(r[22]) if r[22] else None, "tq": int(r[24]),
                 "mean": float(r[1]) if r[1] else None, "mq": int(r[2])})
assert len(rows) == 6209
assert [r["date"] for r in rows] == [date(2009, 1, 1) + timedelta(days=i) for i in range(6209)]
checks = 0


def equal(actual, expected):
    global checks
    checks += 1
    if isinstance(actual, (float, int)) and isinstance(expected, (float, int)):
        assert abs(actual - expected) < 0.00011, (actual, expected)
    else:
        assert actual == expected, (actual, expected)


def load(slug):
    return json.loads((ROOT / f"app/(monetized)/labs/hachioji-{slug}/data/hachioji-{slug}-2026-10-04.r1.json").read_text(encoding="utf-8"))


for sensitivity in (False, True):
    quality = {8, 5} if sensitivity else {8}
    key = "sensitivity_quality5" if sensitivity else "main"
    rain = load("rain")[key]
    accepted = []
    yearly = {"h": [], "t": []}
    for year in range(2015, 2026):
        candidates = [r for r in rows if r["date"].year == year]
        normal = [r for r in candidates if r["hq"] in quality and r["tq"] in quality]
        if len(normal) != len(candidates):
            equal(next(x for x in rain["excluded"] if x["year"] == year)["valid"], len(normal))
            continue
        accepted.extend(normal)
        saved = next(x for x in rain["annual"] if x["year"] == year)
        for station in ("h", "t"):
            values = [r[station] for r in normal]
            wet = [v for v in values if v >= 1]
            total = sum(values)
            top = sorted(normal, key=lambda r: (-r[station], r["date"]))[:5]
            computed = {"total": total, "wet_days": len(wet), "wet_mean": mean(wet),
                        "top5_total": sum(r[station] for r in top),
                        "top5_share": 100 * sum(r[station] for r in top) / total}
            yearly[station].append(computed)
            for field, value in computed.items():
                equal(saved[station][field], value)
            equal(saved[station]["top5"], [{"date": r["date"].isoformat(), "mm": r[station]} for r in top])
            for month in range(1, 13):
                v = [r[station] for r in normal if r["date"].month == month]
                equal(saved[station]["monthly"][month-1]["total"], sum(v))
                equal(saved[station]["monthly"][month-1]["wet_days"], sum(x >= 1 for x in v))
            for limit, stored in zip((0.5, 1, 5, 10), saved[station]["thresholds"]):
                equal(stored["days"], sum(v >= limit for v in values))
    equal(rain["included_years"], sorted({r["date"].year for r in accepted}))
    for station in ("h", "t"):
        for field in ("total", "wet_days", "wet_mean", "top5_share"):
            equal(rain["summary"][station][field], mean(a[field] for a in yearly[station]))
        for month in range(1, 13):
            monthly = [sum(r[station] for r in accepted if r["date"].year == y and r["date"].month == month) for y in rain["included_years"]]
            equal(rain["summary"][station]["monthly"][month-1]["total"], mean(monthly))
        for limit, stored in zip((0.5, 1, 5, 10), rain["summary"][station]["thresholds"]):
            equal(stored["days"], mean(sum(r[station] >= limit for r in accepted if r["date"].year == y) for y in rain["included_years"]))
    counts = {"both": 0, "h_only": 0, "t_only": 0, "neither": 0, "total": len(accepted)}
    for r in accepted:
        h, t = r["h"] >= 1, r["t"] >= 1
        counts["both" if h and t else "h_only" if h else "t_only" if t else "neither"] += 1
    equal(rain["contingency"], counts)
    equal(rain["h_given_t"], 100 * counts["both"] / (counts["both"] + counts["t_only"]))
    equal(rain["t_given_h"], 100 * counts["both"] / (counts["both"] + counts["h_only"]))

    autumn = load("autumn")[key]
    computed_years = []
    for year in range(2009, 2026):
        candidates = [r for r in rows if r["date"].year == year and r["date"].month in (9, 10, 11)]
        values = [r["mean"] if r["mq"] in quality else None for r in candidates]
        saved = next(a for a in autumn["annual"] if a["year"] == year)
        equal(saved["daily"], [[r["date"].strftime("%m-%d"), value] for r, value in zip(candidates, values)])
        equal(saved["valid_days"], sum(x is not None for x in values))
        thresholds = []
        for i, (low, high) in enumerate(((14, 24), (15, 25), (16, 26))):
            groups = {"cool": 0, "middle": 0, "warm": 0, "longest_run": 0}
            streak = 0
            for v in values:
                if v is None:
                    streak = 0
                    continue
                label = "cool" if v < low else "warm" if v >= high else "middle"
                groups[label] += 1
                streak = streak + 1 if label == "middle" else 0
                groups["longest_run"] = max(groups["longest_run"], streak)
            for field, value in groups.items():
                equal(saved["thresholds"][i][field], value)
            thresholds.append(groups)
        computed_years.append({"year": year, "complete": None not in values, "thresholds": thresholds})
    equal(autumn["included_years"], [a["year"] for a in computed_years if a["complete"]])
    for i, c in enumerate(autumn["comparison"]):
        early = [a for a in computed_years if a["year"] <= 2013 and a["complete"]]
        late = [a for a in computed_years if a["year"] >= 2021 and a["complete"]]
        for label, group in (("early", early), ("late", late)):
            equal(c[label]["years"], [a["year"] for a in group])
            for field in ("cool", "middle", "warm", "longest_run"):
                equal(c[label][field], mean(a["thresholds"][i][field] for a in group))
        equal(c["middle_difference"], mean(a["thresholds"][i]["middle"] for a in late) - mean(a["thresholds"][i]["middle"] for a in early))

report = {"result": "PASS", "independent_comparisons": checks, "source_sha256": manifest["sha256"], "implementation": "Python standard csv/statistics; independent of JS generator", "scope": "Both quality policies; all eligible rain years, monthly sums, thresholds, top-five dates, contingency; all autumn dates, definitions and comparisons"}
output = ROOT / "docs/task/hachioji-rain-autumn/evidence/independent-check.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False))
