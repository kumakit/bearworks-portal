"""Local-only PDF extraction. Requires pypdf; never run by CI or bundle generation."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
YEARS = list(range(2016, 2026))
PLAN_IDS = ["1", "2", "4", "5", "6", "7", "8", "9", "10", "11", "17", "19", "20", "21", "22", "23", "25", "26", "27", "28", "29", "30", "31"]
NAMES = ["東放射線アイロード①", "東放射線アイロード②", "八王子駅北口交番前", "ドン・キホーテ前", "横山町公園", "八王子駅入口交差点", "甲州街道①", "甲州街道②", "八日町交差点", "甲州街道③", "甲州街道④", "とちの木デッキ下", "八王子駅北口通路①", "八王子駅北口通路②", "八王子駅南口通路", "三井住友銀行前", "京王八王子駅中央口", "桑並木通り", "八王子スクエアビル南", "八王子スクエアビル西①", "八王子スクエアビル西②", "八王子スクエアビル北", "パーク壱番街通り①", "パーク壱番街通り②", "マルベリーブリッジ", "甲州街道⑤", "富士見通り", "みさき通り", "ジョイ五番街通り", "みずき通り", "野猿街道", "とちの木通り"]
IDS = [str(i) for i in range(1, 13)] + ["13-1", "13-2"] + [str(i) for i in range(14, 32)]


def extract_history(text: str, end_year: int = 2025) -> dict[str, list[int]]:
    rows = {}
    for segment in re.split(r"№(?=\d)", text)[1:]:
        match = re.match(r"[\d,-]+", segment)
        if match is None or match[0] not in IDS:
            continue  # Explicitly excludes 13-1,2 subtotal and discontinued 32–42.
        pairs = re.findall(r"([\d,]+|－)([+\-±]?\d+\.\d+%|－)", re.sub(r"\s+", "", segment))
        if len(pairs) != end_year - 2010 or match[0] in rows:
            raise ValueError(f"Ambiguous history row {match[0]}: {len(pairs)}")
        selected = [None if value == "－" else int(value.replace(",", "")) for value, _ in pairs[5:]]
        if len(selected) != end_year - 2015 or any(value is None for value in selected):
            raise ValueError(f"Missing observation in adopted 2016–2025 series: {match[0]}")
        rows[match[0]] = selected
    if set(rows) != set(IDS):
        raise ValueError("Incomplete set of 32 observation lines")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    args = parser.parse_args()
    inspection = json.loads((HERE.parents[1] / "docs/task/issue-420/source-inspection.json").read_text(encoding="utf-8"))
    sources = []
    for source in inspection["sources"]:
        raw = (args.source_dir / f'{source["id"]}.pdf').read_bytes()
        if hashlib.sha256(raw).hexdigest() != source["sha256"]:
            raise ValueError(f'Source hash mismatch: {source["id"]}')
        if source["id"].startswith("walking-"):
            year = int(source["id"].split("-")[-1])
            title, published = f"{year}年度 八王子市中心市街地歩行量調査報告書", f"{year + 1}-02"
        elif source["id"].startswith("follow-up"):
            year = int(source["id"][-4:])
            title, published = f"{year}年度 八王子市中心市街地活性化基本計画 定期フォローアップ報告書", f"{year + 1}-05"
        else:
            title, published = "八王子市中心市街地活性化基本計画〈第2期〉2026年8月21日変更認定版", "2026-08-21"
        sources.append({**source, "title": title, "published": published})
    reader = PdfReader(args.source_dir / "walking-2025.pdf")
    holiday = extract_history(reader.pages[19].extract_text())
    weekday = extract_history(reader.pages[20].extract_text())
    points = [{"id": key, "name": name, "inPlan": key in PLAN_IDS,
               "holiday": holiday[key], "weekday": weekday[key]}
              for key, name in zip(IDS, NAMES, strict=True)]
    for year in (2023, 2024):
        past = PdfReader(args.source_dir / f"walking-{year}.pdf")
        for page_index, day in [(19, "holiday"), (20, "weekday")]:
            earlier = extract_history(past.pages[page_index].extract_text(), year)
            for point in points:
                if point[day][:year - 2015] != earlier[point["id"]]:
                    raise ValueError(f"Historical edition mismatch: {year}/{point['id']}/{day}")
    for i, point in enumerate(points):
        # 2025 point profiles, PDF pages 23–54, have two displayed daily totals.
        text = re.sub(r"\s+", "", reader.pages[22 + i].extract_text())
        found = re.findall(r"休日([\d,]+)人([\d,]+)人", text)
        if len(found) != 1 or [int(v.replace(",", "")) for v in found[0]] != [point["weekday"][-1], point["holiday"][-1]]:
            raise ValueError(f"2025 individual profile mismatch: {point['id']}")
    expected_h = [482558, 476938, 481806, 468504, 377890, 390205, 437117, 421990, 463372, 486847]
    expected_w = [493243, 498428, 488397, 503875, 393791, 396001, 477330, 457068, 471729, 457386]
    for i in range(10):
        if sum(p["holiday"][i] for p in points) != expected_h[i] or sum(p["weekday"][i] for p in points) != expected_w[i]:
            raise ValueError(f"All-32 published sum mismatch: {YEARS[i]}")
    # These image-table anchors were visually transcribed from follow-up2025 p.6.
    anchors = [
        {"year": 2023, "holiday": 117859, "weekday": 116530, "weighted": 116910},
        {"year": 2024, "holiday": 124909, "weekday": 112259, "weighted": 115873},
        {"year": 2025, "holiday": 129272, "weekday": 114530, "weighted": 118742},
    ]
    # Manual numeric inputs are original fact transcriptions, not copied table images.
    value = {
        "schemaVersion": 1, "reviewedOn": "2026-10-27", "years": YEARS, "sources": sources,
        "localReconciliation": {"individual2025Profiles": 32, "historicalEditions": [2023, 2024], "all32AnnualTotals": 20},
        "points": points, "planPointIds": PLAN_IDS,
        "publishedAll32": {"holiday": expected_h, "weekday": expected_w},
        "publishedPlan23": anchors,
        "planBaseline": {"years": [2018, 2019, 2020, 2021], "weighted": 117769},
        "population": {
            "recent": [{"year": year, "population": number} for year, number in zip(range(2022, 2026), [34183, 34401, 34489, 34769], strict=True)],
            "historical": [{"year": year, "population": number, "cityPopulation": city} for year, number, city in zip(range(2012, 2022), [27227, 27443, 27981, 29267, 29383, 30121, 30921, 32256, 33082, 33232], [564500, 563482, 562572, 562795, 563228, 563178, 562460, 562480, 561828, 561758], strict=True)],
            "joined": False, "reason": "旧表は17町丁合計。最新掲載値との集計範囲の同一性を確認できないため別系列。115ha内の厳密人口とは断定しない。",
            "sourceRefs": {"recent": "follow-up2025:PDF1/本文1", "historical": "plan-20260821:PDF9/本文6"},
        },
        "vacancies": {
            "historical": [{"year": year, "count": count} for year, count in zip(range(2018, 2022), [122, 100, 103, 86], strict=True)],
            "recent": [{"year": year, "count": count} for year, count in zip(range(2021, 2026), [86, 68, 72, 63, 62], strict=True)],
            "joined": False, "reason": "いずれも路面店の調査だが、期間間の調査エリア・対象の厳密な同一性を確認できないため別系列。",
            "sourceRefs": {"recent": "follow-up2025:PDF14/本文14", "historical": "plan-20260821:PDF25/本文22"},
        },
        "survey": {
            "sourceRef": "walking-2025:PDF20-21/本文18-19", "hours": "9:00–22:00（13時間）",
            "target": "中学生以上の歩行者。自転車乗車中は対象外。目視・カウンター計測。",
            "dates": {"2023": {"holiday": "2023-11-26", "weekday": "2023-11-28"},
                      "2024": {"holiday": "2024-11-24", "weekday": "2024-11-26"},
                      "2025": {"holiday": "2025-11-23", "weekday": "2025-11-25"}},
            "exceptions": ["2023年度のNo.12 とちの木デッキ下（23地点には含まれない）の休日は、エレベーター不具合のため2023-12-03に再調査。全32地点の同年合計は単一調査日の値ではない。"],
            "continuity": "2025年度過去推移表の同一行にある2016–2025年度を採用。32地点すべて欠測なし。過去年の調査断面が完全不変と証明したものではない。",
        },
        "discrepancies": [{"sourceRef": "walking-2025:PDF8/本文6", "description": "本文の平日前年減少は14,661人、表の差は14,343人。元の人数から再計算する。", "reported": 14661, "recalculated": 14343}],
        "housing": {"completedSupplyCountAvailable": False, "sourceRef": "plan-20260821:PDF10/本文7", "finding": "市の集合住宅グラフは事前協議の建設予定戸数の累計で、竣工戸数ではない。区域内の近年の完成棟数・戸数は確定していない。"},
    }
    (HERE / "normalized-inputs.json").write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    print("Extracted 32 points × 10 years × 2 day types; all 20 published totals match")


if __name__ == "__main__":
    main()
