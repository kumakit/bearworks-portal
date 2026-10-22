"""Read-only check of the 1hGroups lookback boundary; prints no request counts."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


QUERY = """query HourBoundary($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    rows: httpRequests1hGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 2, orderBy: [datetime_ASC]) {
      dimensions { datetime } avg { sampleInterval } sum { requests }
    }
  } }
}"""


def check(token: str, zone: str, end: datetime, age: int) -> str:
    start = end - timedelta(hours=age)
    try:
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": QUERY, "variables": {
                "zoneTag": zone, "since": start.isoformat(),
                "until": (start + timedelta(hours=1)).isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            return "GRAPHQL_ERROR"
        zones = payload["data"]["viewer"]["zones"]
        if len(zones) != 1:
            return "INVALID_ZONE"
        rows = zones[0]["rows"]
        if len(rows) == 0:
            return "EMPTY"
        if len(rows) != 1:
            return "INVALID_ROWS"
        row = rows[0]
        hour = datetime.fromisoformat(row["dimensions"]["datetime"].replace("Z", "+00:00"))
        amount, interval = row["sum"]["requests"], row["avg"]["sampleInterval"]
        if (hour != start or not isinstance(amount, int) or isinstance(amount, bool)
                or amount < 0 or not isinstance(interval, (int, float))
                or isinstance(interval, bool) or not 1 <= interval < 1_000_000):
            return "INVALID_ROW"
        return "OK"
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError):
        return "UNAVAILABLE"


def main() -> None:
    load_dotenv(os.environ.get("CLOUDFLARE_ENV_FILE", ".env"))
    token, zone = os.getenv("CLOUDFLARE_API_TOKEN"), os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone:
        print(json.dumps({"result": "CONFIG_MISSING"}))
        return
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    result = {str(age): check(token, zone, end, age) for age in range(70, 76)}
    print(json.dumps({"result": "CHECKED", "age_hours_from_completed_end": result}, sort_keys=True))


if __name__ == "__main__":
    main()
