"""Summarize private 1hGroups snapshots without printing request counts."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median


def instant(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timezone missing")
    return result.astimezone(timezone.utc)


def age_band(hours: float) -> str:
    for end, label in ((1, "0-1h"), (3, "1-3h"), (6, "3-6h"), (12, "6-12h"),
                       (24, "12-24h"), (48, "24-48h"), (73, "48-73h")):
        if hours < end:
            return label
    return "73h+"


def main(directory: Path) -> None:
    files = sorted(directory.glob("snapshot_*.json"))
    observations = defaultdict(list)
    captured_at = []
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        if (data.get("schemaVersion") != 1 or data.get("source") != "httpRequests1hGroups"
                or not isinstance(data.get("points"), list) or len(data["points"]) != 72):
            raise ValueError("invalid snapshot")
        seen = set()
        observed_at = instant(data["observedAt"])
        captured_at.append(observed_at)
        for point in data["points"]:
            hour = instant(point["hour"])
            amount, interval = point["requests"], point["sampleInterval"]
            if (hour in seen or not isinstance(amount, int) or isinstance(amount, bool)
                    or amount < 0 or not isinstance(interval, (int, float))
                    or isinstance(interval, bool) or not 1 <= interval < 1_000_000):
                raise ValueError("invalid point")
            seen.add(hour)
            observations[hour].append((observed_at, amount, interval))
    bands = defaultdict(lambda: {"pairs": 0, "changed": 0, "sampled": 0})
    changes = []
    interval_changes = 0
    first_observed_by_age = defaultdict(int)
    for hour, values in observations.items():
        values.sort(key=lambda row: row[0])
        first_age = (values[0][0] - (hour + timedelta(hours=1))).total_seconds() / 3600
        first_observed_by_age[age_band(first_age)] += 1
        for before, after in zip(values, values[1:]):
            age = (after[0] - (hour + timedelta(hours=1))).total_seconds() / 3600
            band = bands[age_band(age)]
            band["pairs"] += 1
            band["sampled"] += after[2] > 1
            if before[1] != after[1]:
                band["changed"] += 1
                changes.append(abs(after[1] - before[1]) / max(before[1], 1) * 100)
            interval_changes += before[2] != after[2]
    captured_at.sort()
    gaps = [(after - before).total_seconds() / 3600
            for before, after in zip(captured_at, captured_at[1:])]
    print(json.dumps({
        "snapshotCount": len(files),
        "distinctHours": len(observations),
        "comparedPairs": sum(item["pairs"] for item in bands.values()),
        "changedCountPairs": sum(item["changed"] for item in bands.values()),
        "changedSampleIntervalPairs": interval_changes,
        "changedPairMedianAbsolutePercent": round(median(changes), 2) if changes else None,
        "byAgeAtRequery": dict(sorted(bands.items())),
        "firstObservedByAge": dict(sorted(first_observed_by_age.items())),
        "captureGapsOver2h": sum(gap > 2 for gap in gaps),
        "maximumCaptureGapHours": round(max(gaps), 1) if gaps else None,
    }, sort_keys=True))


if __name__ == "__main__":
    try:
        main(Path(sys.argv[1]))
    except (IndexError, OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        print(json.dumps({"result": "UNAVAILABLE"}))
        raise SystemExit(1)
