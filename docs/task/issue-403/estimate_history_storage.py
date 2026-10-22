"""Measure provisional one-year SQLite history sizes using synthetic data only.

Run with an ignored output directory. This is a capacity probe, not the final
schema or a cost estimate. No production data or credentials are read.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from contextlib import closing
from pathlib import Path


HOURS = 24 * 365
BASE_HOUR = 1_700_000_000 // 3600 * 3600


def measure(directory: Path, observations_per_hour: int) -> dict[str, int]:
    path = directory / f"synthetic_{observations_per_hour}x.sqlite3"
    backup_path = directory / f"synthetic_{observations_per_hour}x.backup.sqlite3"
    if path.exists() or backup_path.exists():
        raise FileExistsError("synthetic measurement files already exist")

    with closing(sqlite3.connect(path)) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA synchronous=FULL")
        db.executescript("""
            CREATE TABLE accepted (
                hour_start INTEGER PRIMARY KEY,
                requests INTEGER NOT NULL,
                sample_interval REAL NOT NULL,
                observed_at INTEGER NOT NULL,
                status TEXT NOT NULL,
                revision INTEGER NOT NULL
            );
            CREATE TABLE observations (
                hour_start INTEGER NOT NULL,
                observed_at INTEGER NOT NULL,
                requests INTEGER NOT NULL,
                sample_interval REAL NOT NULL,
                outcome TEXT NOT NULL,
                PRIMARY KEY (hour_start, observed_at)
            );
            CREATE INDEX observations_observed_at ON observations(observed_at);
        """)
        db.executemany(
            "INSERT INTO accepted VALUES (?, ?, ?, ?, ?, ?)",
            (
                (BASE_HOUR + hour * 3600, (hour * 17) % 10_000, 1.0,
                 BASE_HOUR + hour * 3600 + 900, "confirmed", observations_per_hour - 1)
                for hour in range(HOURS)
            ),
        )
        for revision in range(observations_per_hour):
            db.executemany(
                "INSERT INTO observations VALUES (?, ?, ?, ?, ?)",
                (
                    (BASE_HOUR + hour * 3600,
                     BASE_HOUR + hour * 3600 + 900 + revision * 3600,
                     (hour * 17 + revision) % 10_000, 1.0, "valid")
                    for hour in range(HOURS)
                ),
            )
        db.commit()
        wal_path = Path(str(path) + "-wal")
        wal_peak = wal_path.stat().st_size if wal_path.exists() else 0
        with closing(sqlite3.connect(backup_path)) as backup:
            db.backup(backup)
            integrity = backup.execute("PRAGMA integrity_check").fetchone()[0]
            if integrity != "ok":
                raise RuntimeError("synthetic backup integrity check failed")
            accepted = backup.execute("SELECT count(*) FROM accepted").fetchone()[0]
            observed = backup.execute("SELECT count(*) FROM observations").fetchone()[0]
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    return {
        "observationsPerHour": observations_per_hour,
        "acceptedRows": accepted,
        "observationRows": observed,
        "databaseBytes": path.stat().st_size,
        "backupBytes": backup_path.stat().st_size,
        "walBytesBeforeClose": wal_peak,
    }


def main() -> int:
    output = Path(sys.argv[1]).resolve()
    if not output.is_dir():
        raise ValueError("existing ignored directory required")
    results = [measure(output, n) for n in (1, 4, 72)]
    print(json.dumps({"syntheticOnly": True, "hours": HOURS, "results": results}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
