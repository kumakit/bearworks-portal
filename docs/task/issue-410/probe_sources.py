"""Phase 0 evidence fetch. Only fixed public official sources; no publication."""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
import html
import urllib.request
from urllib.parse import urljoin
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "https://www.city.hachioji.tokyo.jp"
SOURCES = {
    "age-2016-09.xls": "/hachiouji/jinko/005/p005910_d/fil/2809matibetunenrei.xls",
    "age-2026-09.xlsx": "/hachiouji/jinko/005/p037124_d/fil/0809matibetunenrei.xlsx",
    "population-2016-09.csv": "/tantoumadoguchi/002/003/p035453_d/fil/chouchoubetsu_jinkou_2809.csv",
    "population-2026-09.csv": "/tantoumadoguchi/002/003/matisetaicsv_d/fil/chouchoubetsu_jinkou_0809.csv",
    "age-2016-page.html": "/hachiouji/jinko/005/p005910.html",
    "age-2026-page.html": "/hachiouji/jinko/005/p037124.html",
    "population-old-page.html": "/tantoumadoguchi/002/003/p035453.html",
    "population-current-page.html": "/tantoumadoguchi/002/003/matisetaicsv.html",
    "open-data-catalog.html": "/contents/open/002/p005866.html",
    "city-license.html": "/contents/open/001/p005861.html",
    "city-population-definition.html": "/shisei/002/006/006/p005936.html",
    "estat-terms.html": "https://www.e-stat.go.jp/terms-of-use",
    "estat-gis-terms.html": "https://www.e-stat.go.jp/gis-terms",
    "estat-boundary-definition.pdf": "https://www.e-stat.go.jp/help/data-definition-information/downloaddata/A002005212020.pdf",
    "estat-boundary-cautions.html": "https://www.e-stat.go.jp/help/data-definition-information/download",
    "boundary-2020-13201.zip": "https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=A002005212020&code=13201&coordSys=1&format=shape&downloadType=5&datum=2011",
    "age-2025-page.html": "/hachiouji/jinko/005/p035396.html",
    "age-2023-page.html": "/hachiouji/jinko/005/p032232.html",
    "age-2024-page.html": "/hachiouji/jinko/005/p033790.html",
    "address-change-register.pdf": "/kurashi/kosekijumin/008/001a/p032860_d/fil/shoumei_negai.pdf",
    "population-2026-excel-page.html": "/hachiouji/jinko/004/p037433.html",
    "population-excel-index.html": "/hachiouji/jinko/004/index.html",
    "ueno-boundary-change.html": "/kurashi/kosekijumin/008/001a/p032860.html",
    "ueno-boundary-change-proposal.pdf": "/shisei/001/001/007/002/p031262_d/fil/gaiyou.pdf",
    "kawaguchi-committee-record.html": "https://www.city.hachioji.tokyo.dbsr.jp/index.php/734981?Id=6155&Template=document",
    "kawaguchi-council-decisions.html": "/contents/shigikai_1/gikainokatudou/honnkaigi/reiwa7/p036001.html",
}


def discover() -> dict[str, str]:
    """Resolve only September attachments actually linked by saved city pages."""
    found = {}
    pages = ["population-old-page.html", "population-current-page.html"]
    pages += [k for k in SOURCES if re.fullmatch(r"age-\d{4}-page.html", k)]
    pages += [k for k in SOURCES if re.fullmatch(r"population-\d{4}-excel-page.html", k)]
    for page in pages:
        p = ROOT / "evidence" / "sources" / page
        if not p.exists():
            continue
        body = p.read_text(encoding="utf-8")
        for href, label in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', body, re.S):
            label = html.unescape(re.sub(r"<[^>]+>", "", label))
            if "9月末" not in label:
                continue
            match = re.search(r"(平成|令和)(元|\d+)年", label)
            if not match:
                continue
            era, number = match.groups()
            year = (1988 if era == "平成" else 2018) + (1 if number == "元" else int(number))
            page_url = SOURCES[page] if SOURCES[page].startswith("https://") else BASE + SOURCES[page]
            url = urljoin(page_url, html.unescape(href))
            if not url.startswith(BASE + "/"):
                raise ValueError("Unexpected attachment host")
            ext = Path(url).suffix.lower()
            if page.startswith("population-") and ext == ".csv" and 2016 <= year <= 2026:
                found[f"population-{year}-09.csv"] = url
            elif re.fullmatch(r"age-\d{4}-page.html", page) and ext in (".xlsx", ".xls"):
                found[f"age-{year}-09{ext}"] = url
            elif re.fullmatch(r"population-\d{4}-excel-page.html", page) and ext in (".xlsx", ".xls"):
                found[f"population-{year}-09{ext}"] = url
    p = ROOT / "evidence" / "sources" / "population-excel-index.html"
    if p.exists():
        for href, label in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', p.read_text(encoding="utf-8"), re.S):
            label = html.unescape(re.sub(r"<[^>]+>", "", label))
            m = re.search(r"(平成|令和)(元|\d+)年", label)
            if m and "エクセル" in label:
                era, n = m.groups()
                year = (1988 if era == "平成" else 2018) + (1 if n == "元" else int(n))
                if 2016 <= year <= 2026:
                    found[f"population-{year}-excel-page.html"] = urljoin(BASE + SOURCES["population-excel-index.html"], href)
    return found


def fetch(item: tuple[str, str]) -> dict:
    filename, path = item
    url = path if path.startswith("https://") else BASE + path
    target = ROOT / "evidence" / "sources" / filename
    meta = {"filename": filename, "url": url}
    if target.exists():
        meta["status"] = "cached"
        data = target.read_bytes()
    else:
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read()
                meta.update(status=response.status, finalUrl=response.url,
                            contentType=response.headers.get("Content-Type"),
                            lastModified=response.headers.get("Last-Modified"),
                            retrievedAt=datetime.now(timezone.utc).isoformat())
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        except Exception as error:
            return dict(meta, status="error", error=str(error))
    meta.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
    return meta


if __name__ == "__main__":
    import sys
    if "--discover" in sys.argv:
        SOURCES.update(discover())
        SOURCES.update(discover())
    manifest_path = ROOT / "evidence" / "retrieval.json"
    previous = {}
    if manifest_path.exists():
        previous = {r["filename"]: r for r in json.loads(manifest_path.read_text(encoding="utf-8"))}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(fetch, SOURCES.items()))
    for record in records:
        old = previous.get(record["filename"], {})
        if record["status"] == "cached" and old.get("sha256") == record["sha256"]:
            record.update(old)
    by_name = dict(previous)
    by_name.update({r["filename"]: r for r in records})
    records = list(by_name.values())
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for record in records:
        print(record["filename"], record["status"], record.get("bytes"), record.get("error", ""))
