"""Pre-plan source inspection; no article values are finalized here."""
import csv
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen

import openpyxl
import xlrd

ROOT = Path(__file__).resolve().parent
SOURCES = {
    "2016": "https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p005910_d/fil/2809matibetunenrei.xls",
    "2026": "https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p037124_d/fil/0809matibetunenrei.xlsx",
    "tokyo": "https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26qv0700.csv",
}

results = {}
for year, url in SOURCES.items():
    try:
        raw = urlopen(url, timeout=45).read()
        result = {"url": url, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
        if year == "tokyo":
            rows = list(csv.reader(io.StringIO(raw.decode("utf-8-sig" if raw.startswith(b"\xef\xbb\xbf") else "cp932"))))
            result["sample"] = rows[:9]
        else:
            if year == "2016":
                book = xlrd.open_workbook(file_contents=raw)
                sheet = book.sheet_by_name("町丁別年齢別一覧")
                rows = [sheet.row_values(i) for i in range(sheet.nrows)]
                result["date"] = xlrd.xldate_as_datetime(rows[0][23], book.datemode).date().isoformat()
            else:
                book = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
                rows = list(book["町丁別年齢別一覧"].values)
                result["date"] = str(rows[0][23])
            totals = [r for r in rows if r[0] and r[1] in ("合計", "総数")]
            city = totals[0]
            groups = list(map(int, city[6:27]))
            assert int(city[2]) == sum(groups)
            assert all(sum(int(r[c]) for r in totals[1:]) == int(city[c]) for c in range(2, 27))
            result.update(towns=len(totals)-1, population=int(city[2]), age65plus=sum(groups[13:]),
                          age75plus=sum(groups[15:]), age85plus=sum(groups[17:]),
                          all_town_age_cells_match_city=True, header=list(rows[2]))
        results[year] = result
    except Exception as error:
        results[year] = {"url": url, "error": str(error)}
(ROOT / "source-inspection.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(results, ensure_ascii=False, indent=2))
