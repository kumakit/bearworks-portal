"""Phase 0: cache official PDFs and record hashes/page text, without publishing them.

Run with the bundled Python (pypdf). Defaults to offline replay; --fetch explicitly
downloads missing files. Original PDFs/text stay in ignored .local-research/.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[3]
BASE = "https://www.city.hachioji.tokyo.jp/kurashi/sangyo/003/"
SOURCES = {
    "follow-up2025": BASE + "hatioujichuusinn/p031516_d/fil/follow-up2025.pdf",
    "follow-up2024": BASE + "hatioujichuusinn/p031516_d/fil/follow-up2024.pdf",
    "plan-20260821": BASE + "hatioujichuusinn/p031516_d/fil/chukatsukeikaku_2_260821.pdf",
    **{f"walking-{year}": BASE + f"004/p014345_d/fil/R{year - 2018}houkokusyo.pdf"
       for year in (2023, 2024, 2025)},
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true")
    args = parser.parse_args()
    cache = ROOT / ".local-research" / "issue-420"
    cache.mkdir(parents=True, exist_ok=True)
    sources = []
    for key, url in SOURCES.items():
        path = cache / f"{key}.pdf"
        receipt = cache / f"{key}.receipt.json"
        if not path.exists():
            if not args.fetch:
                raise SystemExit(f"Missing {path}; use --fetch for initial acquisition")
            with urlopen(url, timeout=60) as response:
                data = response.read()
            if not data.startswith(b"%PDF-"):
                raise ValueError(f"Not a PDF: {url}")
            path.write_bytes(data)
            receipt.write_text(json.dumps({
                "url": url,
                "retrievedAt": datetime.now(timezone.utc).isoformat(),
                "sha256": hashlib.sha256(data).hexdigest(),
            }, indent=2) + "\n", encoding="utf-8")
        data = path.read_bytes()
        provenance = json.loads(receipt.read_text(encoding="utf-8"))
        digest = hashlib.sha256(data).hexdigest()
        if provenance["url"] != url or provenance["sha256"] != digest:
            raise ValueError(f"Cache/receipt mismatch: {key}")
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        (cache / f"{key}.txt").write_text(
            "\n\n".join(f"=== PDF page {i + 1} ===\n{text}" for i, text in enumerate(pages)),
            encoding="utf-8",
        )
        sources.append({"id": key, **provenance, "bytes": len(data), "pages": len(pages)})
        print(f"{key}: {len(data)} bytes, {len(pages)} pages, sha256={digest}")
    report = {"schemaVersion": 1, "purpose": "Phase 0 source inspection; not a publication bundle",
              "scriptSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "sources": sources}
    Path(__file__).with_name("source-inspection.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
    )


if __name__ == "__main__":
    main()
