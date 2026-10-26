"""Reproduce the land-price article from adopted official ZIPs or fixed inputs (Python 3.12+)."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import unicodedata
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from statistics import mean, median
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
TASK = ROOT / "docs/task/issue-413"
PUBLIC = ROOT / "public/data/hachioji-land-prices"
NAME = "hachioji-land-prices-2026-10-26.r1.json"
CITIES = {"13201": "八王子", "13202": "立川", "13209": "町田", "13212": "日野", "13206": "府中", "13205": "青梅"}
NS = {"k": "http://nlftp.mlit.go.jp/ksj/schemas/ksj-app", "g": "http://www.opengis.net/gml/3.2"}
PAGE = "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html"
# MLIT, Table 6, page 1 in each year (count, rounded mean, minimum, maximum).
OFFICIAL = {
    2026: [(124,131300,36000,355000),(30,308400,156000,600000),(79,172600,53900,403000),(37,218600,110000,330000),(44,355600,225000,628000),(27,98600,28800,185000)],
    2016: [(125,114500,37100,273000),(30,233700,133000,370000),(80,155700,57100,298000),(36,183400,110000,245000),(45,279300,196000,450000),(28,97400,32000,177000)],
}


def continuity_reason(current: dict, past: dict | None) -> str:
    """Conservative matched subset: unchanged lineage, address/use/area and endpoint checks."""
    if not past:
        return "2016年の同番号地点なし（番号変更を推定で接続しない）"
    flags = current["historyFlags2017to2026"]
    if len(flags) != 10 or any(len(s) != 14 or s[0] != "1" for s in flags):
        return "途中年に新設・選定替え・休止等、または継続未確認"
    if any(s[1:4] != "000" for s in flags):
        return "途中年に所在地・地積・利用現況の変更あり"
    normalize = lambda s: "".join(unicodedata.normalize("NFKC", s).split())
    if normalize(current["address"]) != normalize(past["address"]) or current["area"] != past["area"]:
        return "両端の所在地または地積が不一致"
    if current["history2016"] != past["price"]:
        return "2016年履歴価格と2016年原典が不一致"
    # Coordinate distance is a consistency screen only; the datums differ.
    dy = (current["latitude"] - past["latitude"]) * 111320
    dx = (current["longitude"] - past["longitude"]) * 111320 * math.cos(math.radians(current["latitude"]))
    if math.hypot(dx, dy) > 30:
        return "両端座標の差が30m超（位置変更を推定で接続しない）"
    return "採用"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def dump(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode()


def change(new: float, old: float) -> float:
    if not math.isfinite(old) or old <= 0 or not math.isfinite(new):
        raise ValueError("Invalid percentage denominator/value")
    return (new / old - 1) * 100


def stats(prices: list[int]) -> dict:
    if not prices or any(isinstance(p, bool) or not isinstance(p, int) or p <= 0 for p in prices):
        raise ValueError("Prices must be positive integers; missing is not zero")
    return {"count": len(prices), "mean": mean(prices), "median": median(prices), "min": min(prices), "max": max(prices)}


def validate_points(points: list[dict]) -> None:
    ids = set()
    for p in points:
        key = (p["year"], p["id"])
        if key in ids:
            raise ValueError("Duplicate point/year")
        ids.add(key)
        if p["year"] not in (2016, 2026) or p["cityCode"] not in CITIES or p["use"] != "000":
            raise ValueError("Wrong year, city or use")
        stats([p["price"]])
        if not p["address"].strip() or p["address"] == "_":
            raise ValueError("Missing address")
        if not 138 < p["longitude"] < 141 or not 34 < p["latitude"] < 37:
            raise ValueError("Invalid or swapped coordinates")
        rate = p.get("yearOnYear")
        if rate is not None and (not isinstance(rate, (int, float)) or not math.isfinite(rate)):
            raise ValueError("Invalid annual rate")
        if p["year"] == 2026 and rate is not None:
            if abs(change(p["price"], p["price2025"]) - rate) > 0.051:
                raise ValueError("Annual rate disagrees with previous price")
    for year in (2016, 2026):
        for code in CITIES:
            if not any(p["year"] == year and p["cityCode"] == code for p in points):
                raise ValueError("Missing city/year")


def extract(source_dir: Path) -> dict:
    points, sources = [], []
    for year in (2016, 2026):
        path = source_dir / f"issue413-L01-{str(year)[2:]}_13.zip"
        content = path.read_bytes()
        sources.append({"year": year, "url": f"https://nlftp.mlit.go.jp/ksj/gml/data/L01/L01-{str(year)[2:]}/L01-{str(year)[2:]}_13_GML.zip", "sha256": sha(content), "retrievedOn": "2026-10-26"})
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            if year == 2026:
                name = next(n for n in z.namelist() if n.endswith(".geojson"))
                for f in json.loads(z.read(name))["features"]:
                    p = f["properties"]
                    code, use = p["L01_001"], p["L01_002"]
                    if code not in CITIES or use != "000":
                        continue
                    if p["L01_007"] != year or f["geometry"]["type"] != "Point":
                        raise ValueError("Wrong source date/geometry")
                    lon, lat = f["geometry"]["coordinates"]
                    points.append({"id": f'{code}-{use}-{p["L01_003"]}', "cityCode": code, "city": CITIES[code], "use": use, "year": year, "price": p["L01_008"], "yearOnYear": p["L01_009"] if p["L01_010"] == 1 else None, "selection": p["L01_010"], "address": p["L01_025"], "area": p["L01_027"], "latitude": lat, "longitude": lon, "station": p["L01_048"], "roadDistance": p["L01_050"], "history2016": p["L01_095"], "historyFlags2017to2026": [p[f"L01_{n:03}"] for n in range(139, 149)]})
                    points[-1]["price2025"] = p["L01_104"]
            else:
                name = next(n for n in z.namelist() if n.split("/")[-1] == "L01-16_13.xml")
                tree = ET.fromstring(z.read(name))
                coords = {p.attrib[f'{{{NS["g"]}}}id']: list(map(float, p.find("g:pos", NS).text.split())) for p in tree.findall("g:Point", NS)}
                for p in tree.findall("k:LandPrice", NS):
                    def text(path):
                        value = p.find(path, NS)
                        if value is None or value.text is None:
                            raise ValueError(f"Missing GML field: {path}")
                        return value.text
                    code = text("k:administrativeAreaCode")
                    use = text("k:representedLandCode/k:RepresentedLandCode/k:indexNumber")
                    if code not in CITIES or use != "000":
                        continue
                    if int(text("k:year/g:TimeInstant/g:timePosition")) != year:
                        raise ValueError("Wrong GML date")
                    seq = text("k:representedLandCode/k:RepresentedLandCode/k:sequenceNumber")
                    ref = p.find("k:position", NS).attrib['{http://www.w3.org/1999/xlink}href'][1:]
                    lat, lon = coords[ref]
                    points.append({"id": f"{code}-{use}-{seq}", "cityCode": code, "city": CITIES[code], "use": use, "year": year, "price": int(text("k:postedLandPrice")), "yearOnYear": None, "address": text("k:address"), "area": int(text("k:acreage")), "latitude": lat, "longitude": lon})
    points.sort(key=lambda p: (p["year"], p["id"]))
    validate_points(points)
    return {"sources": sources, "points": points}


def csv_bytes(rows: list[dict], fields: list[str]) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode("utf-8")


def build(inputs: dict) -> dict[str, bytes]:
    points = inputs["points"]
    validate_points(points)
    cities, audits = [], []
    for index, (code, name) in enumerate(CITIES.items()):
        samples = {year: [p for p in points if p["year"] == year and p["cityCode"] == code] for year in (2016, 2026)}
        old, new = (stats([p["price"] for p in samples[year]]) for year in (2016, 2026))
        for year, s in ((2016, old), (2026, new)):
            rounded = int(Decimal(str(s["mean"])).quantize(Decimal("1E2"), rounding=ROUND_HALF_UP))
            if (s["count"], rounded, s["min"], s["max"]) != OFFICIAL[year][index]:
                raise ValueError(f"Official Table 6 mismatch: {year} {name}")
        past_by_id = {p["id"]: p for p in samples[2016]}
        matched = []
        for p in samples[2026]:
            past = past_by_id.get(p["id"])
            reason = continuity_reason(p, past)
            rate = change(p["price"], past["price"]) if reason == "採用" else None
            audits.append({"id": p["id"], "city": name, "status": reason, "price2016": past["price"] if past else None, "price2026": p["price"], "changePercent": rate})
            if rate is not None:
                matched.append(rate)
        if not matched:
            raise ValueError(f"No verified continuous subset: {name}")
        cities.append({"code": code, "name": name, "past": old, "current": new, "meanChangePercent": change(new["mean"], old["mean"]), "medianChangePercent": change(new["median"], old["median"]), "matched": {"count": len(matched), "meanChangePercent": mean(matched), "medianChangePercent": median(matched), "min": min(matched), "max": max(matched)}})
    bundle = {"version": "2026-10-26.r1", "dates": ["2016-01-01", "2026-01-01"], "unit": "円/㎡", "cities": cities, "points": points, "continuity": {"published": True, "count": sum(c["matched"]["count"] for c in cities), "method": "2017〜2026の選定状況が毎年継続(1)、所在地・地積・利用現況の変更なし、両端の所在地・地積・2016価格一致、座標差30m以内の地点に限定。番号変更は追跡せず除外。座標は測地系が異なるため、距離を移動量として解釈しない。", "audit": audits}}
    files = {NAME: dump(bundle), "points.csv": csv_bytes(points, ["year", "cityCode", "city", "id", "use", "address", "price", "area", "latitude", "longitude"]), "continuity-audit.csv": csv_bytes(audits, ["id", "city", "status", "price2016", "price2026", "changePercent"])}
    manifest = {"retrievedOn": "2026-10-26", "priceDates": bundle["dates"], "sourcePage": PAGE, "sources": inputs["sources"], "generatorSha256": sha(Path(__file__).read_bytes()), "license2026": "CC BY 4.0 (individual dataset condition)", "license2016": "商用可・国土数値情報旧利用約款（出典・加工者・利用条件と適用限界を継承）", "terms": ["https://nlftp.mlit.go.jp/ksj/other/agreement_01.html", "https://nlftp.mlit.go.jp/ksj/other/agreement_02.html"], "credit": "出典：国土交通省 国土数値情報（地価公示、2016・2026年）。bearworks.ukが住宅地抽出・正規化・集計・図表化。国が作成した分析ではありません。", "limitations": "標準地の価格であり、実売価格や市内全ての土地の価格ではありません。位置は標準地の代表点で、敷地境界や売地を示しません。標本構成と測地系は年により異なります。", "files": {name: sha(content) for name, content in files.items()}}
    manifest["officialReconciliation"] = {"passed": True, "rounding": "平均は100円単位・四捨五入。件数・最小・最大も一致", "table2016": "https://www.mlit.go.jp/common/001212283.pdf", "table2026": "https://www.mlit.go.jp/tochi_fudousan_kensetsugyo/content/001986139.pdf"}
    files["source-manifest.json"] = dump(manifest)
    return files


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    input_path = args.input or TASK / "normalized-inputs.json"
    if args.source_dir:
        inputs = extract(args.source_dir)
        if args.check:
            if dump(inputs) != input_path.read_bytes():
                raise ValueError("Adopted source version differs")
        else:
            input_path.write_bytes(dump(inputs))
    else:
        inputs = json.loads(input_path.read_bytes())
    files = build(inputs)
    output_dir = args.output or PUBLIC
    outputs = {output_dir / name: content for name, content in files.items()}
    if not args.output:
        outputs[ROOT / f"app/(monetized)/labs/hachioji-land-prices/data/{NAME}"] = files[NAME]
        outputs[PUBLIC / "generate_bundle.py"] = Path(__file__).read_bytes()
        outputs[PUBLIC / "normalized-inputs.json"] = dump(inputs)
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                raise ValueError(f"Generated output changed: {path}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    print(f"Land prices: {len(inputs['points'])} points; {len(outputs)} outputs {'verified' if args.check else 'generated'}")


if __name__ == "__main__":
    main()
