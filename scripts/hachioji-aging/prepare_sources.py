"""Explicit, manual official-source retrieval and normalization (openpyxl/xlrd)."""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "scripts/hachioji-aging"
SOURCE_DIR = ROOT / ".local-research/issue419"
URLS = {
    "age2016.xls": "https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p005910_d/fil/2809matibetunenrei.xls",
    "age2026.xlsx": "https://www.city.hachioji.tokyo.jp/hachiouji/jinko/005/p037124_d/fil/0809matibetunenrei.xlsx",
    "tokyo-age.csv": "https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26qv0700.csv",
    "tokyo-three.csv": "https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26qv0301.csv",
}
CODES = ("13201", "13202", "13209", "13212", "13206", "13205", "13000", "13200")

def name(value):
    value = unicodedata.normalize("NFKC", str(value)).translate(dict.fromkeys(range(0xE0100, 0xE01F0))).replace("ヶ", "ケ").strip()
    return re.sub(r"([一二三四五六七八九十])丁目$", lambda m: str("一二三四五六七八九十".index(m[1])+1)+"丁目", value)

def count(value, dash=False):
    if dash and value == "-":
        return 0  # Tokyo utilization notes: no cases / no applicable figure, not an arbitrary missing cell.
    if isinstance(value, bool) or value is None or str(value).strip() == "":
        raise ValueError("missing population")
    number = float(value)
    if number < 0 or not number.is_integer():
        raise ValueError("population must be a non-negative integer")
    return int(number)

def csv_rows(path):
    raw = path.read_bytes()
    return list(csv.reader(io.StringIO(raw.decode("utf-8-sig" if raw.startswith(b"\xef\xbb\xbf") else "cp932"))))

def city_table(path, year):
    import openpyxl
    import xlrd
    if path.suffix == ".xls":
        book = xlrd.open_workbook(path)
        tables = {s.name: [s.row_values(i) for i in range(s.nrows)] for s in book.sheets()}
        date = xlrd.xldate_as_datetime(tables["町丁別年齢別一覧"][0][23], book.datemode).date().isoformat()
        assert date == "2016-09-30"
    else:
        book = openpyxl.load_workbook(path, read_only=True, data_only=True)
        tables = {s.title: list(s.values) for s in book}
        book.close()
        assert tables["町丁別年齢別一覧"][0][23] == "令和8年9月末日現在"
    rows = tables["町丁別年齢別一覧"]
    headers = [re.sub(r"\s+", "", unicodedata.normalize("NFKC", str(v))).replace("~", "〜") for v in rows[2][6:27]]
    assert [re.findall(r"\d+", h) for h in headers] == [[str(i),str(i+4)] for i in range(0,100,5)]+[["100"]]
    names = {name(r[16]): str(r[17]).zfill(5) for r in tables["町丁別年齢別"] if len(r)>=18 and r[16] and str(r[17]).isdigit()}
    assert len(names) == 199
    output = []
    for i, row in enumerate(rows):
        if not row[0] or row[1] not in ("合計", "総数"):
            continue
        values = list(map(count, row[2:27]))
        male, female = [list(map(count, rows[i+j][2:27])) for j in (1,2)]
        assert rows[i+1][1] == "男" and rows[i+2][1] == "女"
        assert values == [a+b for a,b in zip(male,female)]
        for v in (values,male,female):
            assert v[0] == sum(v[1:4]) == sum(v[4:])
            assert v[1] == sum(v[4:7]) and v[2] == sum(v[7:17]) and v[3] == sum(v[17:])
        town_name = name(row[0])
        output.append(dict(code="city" if town_name=="八王子市" else names[town_name], name=town_name, population=values[0], bins=values[4:]))
    assert len(output)==200 and len({r["code"] for r in output})==200
    city, towns = output[0], output[1:]
    assert all(sum(r["bins"][i] for r in towns)==city["bins"][i] for i in range(21))
    previous = ROOT/f"public/data/hachioji-population/age-{year}-09.csv"
    prior = list(csv.DictReader(previous.open(encoding="utf-8-sig")))
    by_code = {r["code"]:r for r in towns}
    assert len(prior)==len(towns)
    for p in prior:
        r=by_code[p["code"]]
        assert r["name"]==p["name"] and r["population"]==int(p["population"])
        assert [sum(r["bins"][:3]),sum(r["bins"][3:13]),sum(r["bins"][13:])]==[int(p[k]) for k in ("age0_14","age15_64","age65plus")]
    return dict(targetDate=f"{year}-09-30", city=city, towns=towns)

def tokyo_table(source):
    rows = csv_rows(source/"tokyo-age.csv")
    assert rows[0][1:6] == ["地域コード","地域","年齢階層","年齢","総数／計(人)"]
    three = {r[1]: r for r in csv_rows(source/"tokyo-three.csv")[1:]}
    result=[]
    for code in CODES:
        local=[r for r in rows[1:] if r[1]==code]
        total=[r for r in local if r[3]=="0"]
        groups=[r for r in local if r[3]=="1" and r[4]!="不詳者"]
        unknown=[r for r in local if r[4]=="不詳者"]
        assert len(total)==1 and len(groups)==21 and len(unknown)==1
        assert [re.findall(r"\d+",unicodedata.normalize("NFKC",r[4])) for r in groups]==[[str(i),str(i+4)] for i in range(0,100,5)]+[["100"]]
        for row in local:
            v=[count(x,dash=True) for x in row[5:14]]
            assert v[0]==v[1]+v[2]==v[3]+v[6] and v[3]==v[4]+v[5] and v[6]==v[7]+v[8]
        bins=[count(r[5],dash=True) for r in groups]
        population=count(total[0][5]); missing=count(unknown[0][5],dash=True)
        assert population==sum(bins)+missing and missing==0
        assert [sum(bins[:3]),sum(bins[3:13]),sum(bins[13:])]==[count(three[code][i],dash=True) for i in (3,6,9)]
        result.append(dict(code=code,name="東京都" if code=="13000" else "東京都市部" if code=="13200" else total[0][2],population=population,bins=bins,unknown=missing))
    return dict(targetDate="2026-01-01", rows=result)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--fetch",action="store_true")
    parser.add_argument("--source-dir",type=Path,default=SOURCE_DIR)
    args=parser.parse_args(); source=args.source_dir
    source.mkdir(parents=True,exist_ok=True)
    if args.fetch:
        records=[]
        for filename,url in URLS.items():
            raw=urlopen(url,timeout=45).read(); (source/filename).write_bytes(raw)
            records.append(dict(filename=filename,url=url,sha256=hashlib.sha256(raw).hexdigest(),retrievedAt=datetime.now(timezone.utc).isoformat()))
        (source/"retrieval.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8", newline="\n")
    records=json.loads((source/"retrieval.json").read_text(encoding="utf-8"))
    for r in records:
        assert r["url"]==URLS[r["filename"]] and hashlib.sha256((source/r["filename"]).read_bytes()).hexdigest()==r["sha256"]
    result=dict(schemaVersion=1,city=[city_table(source/"age2016.xls",2016),city_table(source/"age2026.xlsx",2026)],comparison=tokyo_table(source))
    (OUTPUT/"normalized-inputs.json").write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8", newline="\n")
    (OUTPUT/"retrieval.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8", newline="\n")
    print("Sources normalized: 2 x 199 towns, all sex/age/city totals, prior article, 8 Tokyo groups and table 3-1: PASS")

if __name__=="__main__":
    main()
