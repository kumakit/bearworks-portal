"""Read-only Cloudflare probe for immediate repeatability of hourly estimates.

Run from the existing Apps dashboard directory using its Python environment.
Only aggregate quality flags are printed; no credentials, zone ID, or counts.
"""

from __future__ import annotations

import json
import os
from statistics import median
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv


QUERY = """query RepeatHours($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    series: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 2, orderBy: [datetimeHour_ASC]) {
      count avg { sampleInterval } dimensions { datetimeHour }
    }
  } }
}"""

WINDOW_QUERY = """query RepeatPublishedWindow($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    series: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 750, orderBy: [datetimeHour_ASC]) {
      count avg { sampleInterval } dimensions { datetimeHour }
    }
    total: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until}, limit: 1) {
      count avg { sampleInterval }
    }
  } }
}"""

SOURCE_QUERY = """query CompareHourlySources($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    hourly: httpRequests1hGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 25, orderBy: [datetime_ASC]) {
      sum { requests } avg { sampleInterval } dimensions { datetime }
    }
    adaptive: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 25, orderBy: [datetimeHour_ASC]) {
      count avg { sampleInterval } dimensions { datetimeHour }
    }
  } }
}"""


def fetch_hour(token: str, zone_id: str, start: datetime) -> tuple[int, float] | None:
    response = requests.post(
        "https://api.cloudflare.com/client/v4/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": QUERY, "variables": {
            "zoneTag": zone_id,
            "since": start.isoformat(),
            "until": (start + timedelta(hours=1)).isoformat(),
        }},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        return None
    zones = payload.get("data", {}).get("viewer", {}).get("zones")
    if not isinstance(zones, list) or len(zones) != 1:
        return None
    rows = zones[0].get("series")
    if not isinstance(rows, list) or len(rows) != 1:
        return None
    row = rows[0]
    try:
        hour = datetime.fromisoformat(row["dimensions"]["datetimeHour"].replace("Z", "+00:00"))
        count = row["count"]
        interval = row["avg"]["sampleInterval"]
    except (KeyError, TypeError, ValueError, AttributeError):
        return None
    if (hour != start or not isinstance(count, int) or isinstance(count, bool)
            or count < 0 or not isinstance(interval, (int, float))
            or isinstance(interval, bool) or interval < 1):
        return None
    return count, float(interval)


def compare_published(token: str, zone_id: str) -> dict:
    stage = "read_published"
    try:
        published = json.loads(Path("/var/www/dashboard/data.json").read_text(encoding="utf-8"))
        stage = "read_block"
        block = published["cloudflareCollection"]["trafficSeries30d"]
        if (block["status"] != "OK" or block["source"] != "LIVE"
                or block["coverage"] != "FULL"):
            window_end = datetime.fromisoformat(block["windowEnd"].replace("Z", "+00:00"))
            return {"published_window": "UNAVAILABLE", "block_status": block["status"],
                    "block_source": block["source"], "block_coverage": block["coverage"],
                    "block_error_code": block.get("errorCode"),
                    "window_end_age_minutes": round((datetime.now(timezone.utc) - window_end).total_seconds() / 60)}
        start = datetime.fromisoformat(block["windowStart"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(block["windowEnd"].replace("Z", "+00:00"))
        points = block["data"]["points"]
        stage = "validate_block"
        previous = {
            datetime.fromisoformat(p["hour"].replace("Z", "+00:00")): p["requests"]
            for p in points
        }
        if len(previous) != 720 or end - start != timedelta(hours=720):
            return {"published_window": "INVALID"}
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": WINDOW_QUERY, "variables": {
                "zoneTag": zone_id, "since": start.isoformat(), "until": end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        stage = "read_response"
        payload = response.json()
        if payload.get("errors"):
            return {"published_window": "GRAPHQL_ERROR"}
        zone = payload["data"]["viewer"]["zones"][0]
        rows, total = zone["series"], zone["total"]
        if len(rows) != 720 or len(total) != 1:
            return {"published_window": "INCOMPLETE"}
        now_points = {}
        changed_by_age = {"1_to_24h": 0, "25_to_168h": 0, "169_to_720h": 0}
        changed_ages = []
        for row in rows:
            hour = datetime.fromisoformat(row["dimensions"]["datetimeHour"].replace("Z", "+00:00"))
            if hour not in previous or hour in now_points:
                return {"published_window": "INCOMPLETE"}
            now_points[hour] = row["count"]
            age_hours = int((end - hour).total_seconds() / 3600)
            if row["count"] != previous[hour]:
                changed_ages.append(age_hours)
                band = ("1_to_24h" if age_hours <= 24 else
                        "25_to_168h" if age_hours <= 168 else "169_to_720h")
                changed_by_age[band] += 1
        if sum(now_points.values()) != total[0]["count"]:
            return {"published_window": "TOTAL_MISMATCH"}
        return {
            "published_window": "COMPARED",
            "published_age_hours_rounded": round((datetime.now(timezone.utc) - end).total_seconds() / 3600, 1),
            "changed_hours_by_age": changed_by_age,
            "changed_hour_ages": changed_ages[:10],
            "total_changed": total[0]["count"] != block["data"]["totalRequests"],
            "sampling_comparison": "UNAVAILABLE_IN_PUBLISHED_DATA",
        }
    except (OSError, KeyError, IndexError, TypeError, ValueError, requests.RequestException):
        return {"published_window": "UNAVAILABLE", "stage": stage}


def inspect_published_window(token: str, zone_id: str) -> dict:
    try:
        published = json.loads(Path("/var/www/dashboard/data.json").read_text(encoding="utf-8"))
        block = published["cloudflareCollection"]["trafficSeries30d"]
        start = datetime.fromisoformat(block["windowStart"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(block["windowEnd"].replace("Z", "+00:00"))
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": WINDOW_QUERY, "variables": {
                "zoneTag": zone_id, "since": start.isoformat(), "until": end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            return {"window_probe": "GRAPHQL_ERROR", "error_items": len(payload["errors"])}
        zone = payload["data"]["viewer"]["zones"][0]
        rows, total = zone["series"], zone["total"]
        hours = {datetime.fromisoformat(r["dimensions"]["datetimeHour"].replace("Z", "+00:00")) for r in rows}
        expected = {start + timedelta(hours=i) for i in range(720)}
        return {
            "window_probe": "OK",
            "published_status": block["status"],
            "published_error_code": block.get("errorCode"),
            "series_rows": len(rows),
            "missing_hours": len(expected - hours),
            "unexpected_hours": len(hours - expected),
            "duplicate_hours": len(rows) - len(hours),
            "total_rows": len(total),
            "series_equals_total": len(total) == 1 and sum(r["count"] for r in rows) == total[0]["count"],
            "sampled_rows": sum(r["avg"]["sampleInterval"] > 1 for r in rows),
        }
    except (OSError, KeyError, IndexError, TypeError, ValueError, requests.RequestException):
        return {"window_probe": "UNAVAILABLE"}


def compare_hourly_sources(token: str, zone_id: str) -> dict:
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(hours=24)
    try:
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": SOURCE_QUERY, "variables": {
                "zoneTag": zone_id, "since": start.isoformat(), "until": end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            return {"source_comparison": "GRAPHQL_ERROR", "error_items": len(payload["errors"])}
        zone = payload["data"]["viewer"]["zones"][0]
        hourly, adaptive = zone["hourly"], zone["adaptive"]
        old = {
            datetime.fromisoformat(row["dimensions"]["datetime"].replace("Z", "+00:00")):
                (row["sum"]["requests"], row["avg"]["sampleInterval"])
            for row in hourly
        }
        new = {
            datetime.fromisoformat(row["dimensions"]["datetimeHour"].replace("Z", "+00:00")):
                (row["count"], row["avg"]["sampleInterval"])
            for row in adaptive
        }
        expected = {start + timedelta(hours=i) for i in range(24)}
        common = set(old) & set(new)
        relative_differences = [abs(old[h][0] - new[h][0]) / old[h][0] * 100
                                for h in common if old[h][0] > 0]
        hourly_total, adaptive_total = (sum(row[0] for row in rows.values())
                                        for rows in (old, new))
        return {
            "source_comparison": "OK",
            "hourly_complete": len(old) == len(hourly) == 24 and set(old) == expected,
            "adaptive_complete": len(new) == len(adaptive) == 24 and set(new) == expected,
            "hourly_sampled_rows": sum(interval > 1 for _, interval in old.values()),
            "adaptive_sampled_rows": sum(interval > 1 for _, interval in new.values()),
            "different_hours": sum(old[h][0] != new[h][0] for h in common),
            "totals_match": hourly_total == adaptive_total,
            "relative_difference_hours_count": len(relative_differences),
            "relative_difference_median_percent": round(median(relative_differences), 1) if relative_differences else None,
            "relative_difference_max_percent": round(max(relative_differences), 1) if relative_differences else None,
            "relative_difference_total_percent": round(abs(hourly_total - adaptive_total) / hourly_total * 100, 1) if hourly_total else None,
        }
    except (KeyError, IndexError, TypeError, ValueError, requests.RequestException):
        return {"source_comparison": "UNAVAILABLE"}


def main() -> None:
    load_dotenv(os.environ.get("CLOUDFLARE_ENV_FILE", ".env"))
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone_id:
        print(json.dumps({"result": "CONFIG_MISSING"}))
        return
    if os.getenv("PROBE_COMPARE_ONLY") == "1":
        print(json.dumps(compare_published(token, zone_id), sort_keys=True))
        return
    if os.getenv("PROBE_WINDOW_ONLY") == "1":
        print(json.dumps(inspect_published_window(token, zone_id), sort_keys=True))
        return
    if os.getenv("PROBE_SOURCE_COMPARE") == "1":
        print(json.dumps(compare_hourly_sources(token, zone_id), sort_keys=True))
        return
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    ages = (1, 6, 24, 168, 696)
    valid = 0
    changed_counts = 0
    changed_intervals = 0
    sampled = 0
    failures = 0
    for age in ages:
        start = end - timedelta(hours=age)
        try:
            first = fetch_hour(token, zone_id, start)
            second = fetch_hour(token, zone_id, start)
        except (requests.RequestException, ValueError):
            failures += 1
            continue
        if first is None or second is None:
            failures += 1
            continue
        valid += 1
        changed_counts += first[0] != second[0]
        changed_intervals += first[1] != second[1]
        sampled += first[1] > 1 or second[1] > 1
    result = {
        "result": "OK" if failures == 0 else "PARTIAL",
        "ages_hours": list(ages),
        "valid_pairs": valid,
        "failed_pairs": failures,
        "changed_count_pairs": changed_counts,
        "changed_sample_interval_pairs": changed_intervals,
        "sampled_pairs": sampled,
    }
    result.update(compare_published(token, zone_id))
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
