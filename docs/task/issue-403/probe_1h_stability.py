"""Read-only comparison of a published 24-hour block and the same 1hGroups window.

Run from the existing Apps dashboard directory. Prints quality flags only, not
credentials, zone identifiers, request counts, or individual hourly values.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv


QUERY = """query VerifyPublishedHours($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    rows: httpRequests1hGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 25, orderBy: [datetime_ASC]) {
      dimensions { datetime } avg { sampleInterval } sum { requests }
    }
  } }
}"""


def instant(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timezone missing")
    return result.astimezone(timezone.utc)


def main() -> None:
    load_dotenv(os.environ.get("CLOUDFLARE_ENV_FILE", ".env"))
    token, zone_id = os.getenv("CLOUDFLARE_API_TOKEN"), os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone_id:
        print(json.dumps({"result": "CONFIG_MISSING"}))
        return
    try:
        document = json.loads(Path("/var/www/dashboard/data.json").read_text(encoding="utf-8"))
        block = document["cloudflareCollection"]["trafficSeries"]
        if block["status"] != "OK" or block["source"] != "LIVE" or block["coverage"] != "FULL":
            print(json.dumps({"result": "PUBLISHED_UNAVAILABLE", "status": block["status"]}))
            return
        start, end = instant(block["windowStart"]), instant(block["windowEnd"])
        if end - start != timedelta(hours=24):
            raise ValueError("invalid window")
        published = {instant(p["hour"]): p["requests"] for p in block["data"]["points"]}
        expected = {start + timedelta(hours=i) for i in range(24)}
        if len(published) != 24 or set(published) != expected:
            raise ValueError("invalid published points")
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": QUERY, "variables": {
                "zoneTag": zone_id, "since": start.isoformat(), "until": end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            print(json.dumps({"result": "GRAPHQL_ERROR"}))
            return
        zones = payload["data"]["viewer"]["zones"]
        if len(zones) != 1:
            raise ValueError("invalid zones")
        rows = zones[0]["rows"]
        current = {}
        for row in rows:
            hour = instant(row["dimensions"]["datetime"])
            amount, interval = row["sum"]["requests"], row["avg"]["sampleInterval"]
            if (hour in current or not isinstance(amount, int) or isinstance(amount, bool)
                    or amount < 0 or not isinstance(interval, (int, float))
                    or isinstance(interval, bool) or not 1 <= interval < 1_000_000):
                raise ValueError("invalid row")
            current[hour] = (amount, interval)
        if len(rows) != 24 or set(current) != expected:
            print(json.dumps({"result": "INCOMPLETE", "row_count": len(rows)}))
            return
        changed = [int((end - hour).total_seconds() / 3600)
                   for hour in expected if current[hour][0] != published[hour]]
        print(json.dumps({
            "result": "COMPARED",
            "published_age_minutes": round((datetime.now(timezone.utc) - end).total_seconds() / 60),
            "changed_hours": len(changed),
            "changed_ages_hours": sorted(changed),
            "sampled_hours_at_requery": sum(interval > 1 for _, interval in current.values()),
            "sampling_at_publication": "UNAVAILABLE_IN_PUBLISHED_DATA",
        }, sort_keys=True))
    except (OSError, KeyError, IndexError, TypeError, ValueError, requests.RequestException):
        print(json.dumps({"result": "UNAVAILABLE"}))


if __name__ == "__main__":
    main()
