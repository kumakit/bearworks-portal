"""東京都の10月CSVから記事の固定データを再生成する。Python標準ライブラリのみ。"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen

TOKYO = "https://www.toukei.metro.tokyo.lg.jp"
COUNTRIES = ["中国", "フィリピン", "ベトナム", "ネパール", "ミャンマー"]
CITIES = ["13201", "13209", "13202", "13212", "13206", "13205"]
YEARS = range(2013, 2027)
OUTPUT = Path(__file__).resolve().parents[1] / "public/data/hachioji-international/population.json"


def read_table(url, expected_header):
    with urlopen(url, timeout=30) as response:
        raw = response.read()
    try:
        decoded = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = raw.decode("cp932")
    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames or not set(expected_header).issubset(reader.fieldnames):
        raise ValueError(f"列が一致しません: {url}")
    rows = {}
    for row in reader:
        code = row["地域コード"]
        if code in CITIES:
            if code in rows:
                raise ValueError(f"市コードが重複しています: {url} {code}")
            rows[code] = row
    return rows, {"url": url, "sha256": hashlib.sha256(raw).hexdigest()}


def import_year(year):
    short = f"{year % 100:02d}"
    date = f"{year}-10-01"
    population, population_source = read_table(
        f"{TOKYO}/juukim/{year}/jm{short}av0000_1.csv",
        ["地域コード", "地域", "人口総数（日本人＋外国人）", "人口／日本人／総数", "人口／外国人／総数"],
    )
    nationality, nationality_source = read_table(
        f"{TOKYO}/gaikoku/{year}/ga{short}hv0100.csv",
        ["地域コード", "総数", *COUNTRIES, "その他"],
    )
    cities = []
    for code in CITIES:
        raw = population[code]
        total = int(raw["人口総数（日本人＋外国人）"])
        japanese = int(raw["人口／日本人／総数"])
        foreign = int(raw["人口／外国人／総数"])
        if not (total > 0 and japanese >= 0 and foreign > 0 and total == japanese + foreign):
            raise ValueError(f"住基の人口内訳が一致しません: {date} {code}")
        if foreign != int(nationality[code]["総数"]):
            raise ValueError(f"外国人住民数が2表で一致しません: {date} {code}")
        cities.append({"code": code, "name": raw["地域"], "total": total, "japanese": japanese, "foreign": foreign})
    raw = nationality[CITIES[0]]
    details = [int(raw[key]) for key in list(raw)[4:15]]
    fixed = [int(raw[key]) for key in COUNTRIES]
    rest = cities[0]["foreign"] - sum(fixed)
    if sum(details) != cities[0]["foreign"] or min(details + fixed + [rest]) < 0:
        raise ValueError(f"国籍・地域の内訳が合いません: {date}")
    return {
        "date": date, **cities[0],
        "counts": [*fixed, rest],
        "sources": [population_source, nationality_source],
    }, cities


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--retrieved-on", required=True, help="取得日（YYYY-MM-DD）")
    parser.add_argument("--check", action="store_true", help="ネットで再取得し、固定データと照合")
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=6) as executor:
        result = list(executor.map(import_year, YEARS))
    data = {
        "retrievedOn": args.retrieved_on,
        "categories": [*COUNTRIES, "この5区分以外"],
        "annual": [annual for annual, _ in result],
        "comparison": {"date": result[-1][0]["date"], "cities": result[-1][1]},
        "residence": {
            "period": "2025年4月",
            "source": "https://www.city.hachioji.tokyo.jp/contents/shigikai_1/gikainokatudou/iinnkai/soumukikaku/p035918_d/fil/02_zaijugaikokujin.pdf",
            "groups": [{"name": "留学", "percent": 26}, {"name": "永住者", "percent": 25.6},
                       {"name": "技術・人文知識・国際業務", "percent": 9}],
        },
    }
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if json.loads(OUTPUT.read_text(encoding="utf-8")) != data:
            raise SystemExit("再取得した値が固定データと一致しません")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(payload, encoding="utf-8", newline="\n")
    print("14年間の2系列と比較対象6市の検算が完了しました。")


if __name__ == "__main__":
    main()
