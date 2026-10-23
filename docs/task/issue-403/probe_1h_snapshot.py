"""Read-only 1hGroups snapshot for private local longitudinal comparison.

The JSON output contains raw hourly aggregate counts. Redirect it to an
ignored local file; never paste it into a report, commit it, or send it to an
external reviewer. Run from the existing Apps dashboard directory.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


QUERY = """query SnapshotHours($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    rows: httpRequests1hGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 73, orderBy: [datetime_ASC]) {
      dimensions { datetime } avg { sampleInterval } sum { requests }
    }
  } }
}"""


def instant(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timezone missing")
    return result.astimezone(timezone.utc)


def main() -> int:
    load_dotenv(os.environ.get("CLOUDFLARE_ENV_FILE", ".env"))
    token, zone = os.getenv("CLOUDFLARE_API_TOKEN"), os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone:
        print("CONFIG_MISSING", file=sys.stderr)
        return 1
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(hours=72)
    try:
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": QUERY, "variables": {
                "zoneTag": zone, "since": start.isoformat(), "until": end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            raise ValueError("GraphQL error")
        zones = payload["data"]["viewer"]["zones"]
        if len(zones) != 1:
            raise ValueError("zone count")
        rows = zones[0]["rows"]
        if not isinstance(rows, list) or len(rows) != 72:
            raise ValueError("incomplete hours")
        points = []
        for index, row in enumerate(rows):
            hour = instant(row["dimensions"]["datetime"])
            amount, interval = row["sum"]["requests"], row["avg"]["sampleInterval"]
            if (hour != start + timedelta(hours=index)
                    or not isinstance(amount, int) or isinstance(amount, bool) or amount < 0
                    or not isinstance(interval, (int, float)) or isinstance(interval, bool)
                    or not 1 <= interval < 1_000_000):
                raise ValueError("invalid hour")
            points.append({"hour": hour.isoformat(), "requests": amount,
                           "sampleInterval": interval})
        print(json.dumps({
            "schemaVersion": 1, "source": "httpRequests1hGroups",
            "observedAt": datetime.now(timezone.utc).isoformat(),
            "windowStart": start.isoformat(), "windowEnd": end.isoformat(),
            "points": points,
        }, separators=(",", ":")))
        return 0
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError):
        print("SNAPSHOT_UNAVAILABLE", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
