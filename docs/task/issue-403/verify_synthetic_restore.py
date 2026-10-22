"""Exercise an offline restore of the synthetic SQLite sizing fixture only.

The script never opens production data. It prints validation status and row
counts, never synthetic request values or credentials.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sqlite3
import sys
from contextlib import closing
from pathlib import Path


TABLES = {
    "accepted": "SELECT * FROM accepted ORDER BY hour_start",
    "observations": "SELECT * FROM observations ORDER BY hour_start, observed_at",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def contents(path: Path) -> dict[str, object]:
    with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as db:
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("SQLite integrity failure")
        if db.execute("PRAGMA foreign_key_check").fetchone() is not None:
            raise ValueError("SQLite foreign key failure")
        result: dict[str, object] = {"schemaVersion": db.execute("PRAGMA user_version").fetchone()[0]}
        for name, sql in TABLES.items():
            digest = hashlib.sha256()
            count = 0
            for row in db.execute(sql):
                digest.update(json.dumps(row, separators=(",", ":")).encode("utf-8"))
                digest.update(b"\n")
                count += 1
            result[name] = {"rows": count, "digest": digest.hexdigest()}
        return result


def verify(path: Path, manifest: dict[str, object]) -> None:
    if path.stat().st_size != manifest["bytes"] or sha256_file(path) != manifest["sha256"]:
        raise ValueError("backup transfer mismatch")
    if contents(path) != manifest["contents"]:
        raise ValueError("restored content mismatch")


def main(directory: Path) -> None:
    source = directory / "synthetic_4x.backup.sqlite3"
    restored = directory / "synthetic_4x.restored.sqlite3"
    damaged = directory / "synthetic_4x.damaged.sqlite3"
    if restored.exists() or damaged.exists():
        raise FileExistsError("restore trial output already exists")
    manifest = {
        "bytes": source.stat().st_size,
        "sha256": sha256_file(source),
        "contents": contents(source),
    }
    shutil.copyfile(source, restored)
    verify(restored, manifest)
    with closing(sqlite3.connect(restored)) as db:
        db.execute("BEGIN")
        db.execute("UPDATE accepted SET status = ? WHERE hour_start = (SELECT min(hour_start) FROM accepted)",
                   ("synthetic_restore_test",))
        db.rollback()
    verify(restored, manifest)
    shutil.copyfile(source, damaged)
    with damaged.open("r+b") as target:
        target.truncate(max(0, source.stat().st_size - 1))
    try:
        verify(damaged, manifest)
    except ValueError:
        rejected = True
    else:
        rejected = False
    if not rejected:
        raise ValueError("damaged copy was accepted")
    print(json.dumps({
        "syntheticOnly": True,
        "separatePathRestore": "PASS",
        "integrityAndContent": "PASS",
        "readWriteOpen": "PASS",
        "truncatedCopyRejected": "PASS",
    }))


if __name__ == "__main__":
    try:
        main(Path(sys.argv[1]).resolve())
    except (IndexError, OSError, sqlite3.Error, ValueError, KeyError, TypeError):
        print(json.dumps({"result": "FAIL"}))
        raise SystemExit(1)
