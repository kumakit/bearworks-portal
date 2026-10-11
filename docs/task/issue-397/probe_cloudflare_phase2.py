"""Read-only Phase 2 GraphQL probe. Run with the existing Apps .env.

Prints aggregate quality checks only; never prints credentials, zone IDs, or rows.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


QUERY = """query ProbePhase2($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    series: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 750, orderBy: [datetimeHour_ASC]) {
      count avg { sampleInterval } dimensions { datetimeHour }
    }
    countries: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 500, orderBy: [count_DESC]) {
      count avg { sampleInterval } dimensions { clientCountryName }
    }
    total: httpRequestsAdaptiveGroups(
      filter: {datetime_geq: $since, datetime_lt: $until}, limit: 1) {
      count avg { sampleInterval }
    }
  } }
}"""

PREVIOUS_24H_QUERY = """query ProbePrevious24h($zoneTag: String!, $since: String!, $until: String!) {
  viewer { zones(filter: {zoneTag: $zoneTag}) {
    series: httpRequests1hGroups(
      filter: {datetime_geq: $since, datetime_lt: $until},
      limit: 25, orderBy: [datetime_ASC]) {
      sum { requests } avg { sampleInterval } dimensions { datetime }
    }
  } }
}"""


def sample_count(rows: list[dict]) -> int:
    return sum(row.get("avg", {}).get("sampleInterval", 1) > 1 for row in rows)


def main() -> None:
    load_dotenv(".env")
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone_id:
        print("config=MISSING")
        return

    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    previous24_start, previous24_end = end - timedelta(hours=48), end - timedelta(hours=24)
    try:
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": PREVIOUS_24H_QUERY, "variables": {
                "zoneTag": zone_id, "since": previous24_start.isoformat(),
                "until": previous24_end.isoformat()}},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            print(json.dumps({"window": "previous24h", "result": "GRAPHQL_ERROR",
                              "errorCount": len(payload["errors"])}))
        else:
            rows = payload["data"]["viewer"]["zones"][0]["series"]
            actual = [datetime.fromisoformat(row["dimensions"]["datetime"].replace("Z", "+00:00"))
                      for row in rows]
            expected = {previous24_start + timedelta(hours=index) for index in range(24)}
            print(json.dumps({"window": "previous24h", "rows": len(rows),
                              "complete": len(actual) == len(set(actual)) == 24 and set(actual) == expected,
                              "sampledRows": sample_count(rows)}, sort_keys=True))
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError, AttributeError):
        print(json.dumps({"window": "previous24h", "result": "QUERY_OR_SHAPE_ERROR"}))

    windows = (("current7d", end - timedelta(days=7), end),
               ("previous7d", end - timedelta(days=14), end - timedelta(days=7)),
               ("current30d", end - timedelta(days=30), end))
    for label, start, stop in windows:
        try:
            response = requests.post(
                "https://api.cloudflare.com/client/v4/graphql",
                headers={"Authorization": f"Bearer {token}"},
                json={"query": QUERY, "variables": {
                    "zoneTag": zone_id, "since": start.isoformat(), "until": stop.isoformat()}},
                timeout=30,
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("errors"):
                print(json.dumps({"window": label, "result": "GRAPHQL_ERROR",
                                  "errorCount": len(payload["errors"])}))
                continue
            zone = payload["data"]["viewer"]["zones"][0]
            series, countries, total = zone["series"], zone["countries"], zone["total"]
            hours = int((stop - start).total_seconds() / 3600)
            actual = [datetime.fromisoformat(row["dimensions"]["datetimeHour"].replace("Z", "+00:00"))
                      for row in series]
            expected = {start + timedelta(hours=index) for index in range(hours)}
            country_codes = [row["dimensions"]["clientCountryName"] for row in countries]
            country_sum = sum(row["count"] for row in countries)
            series_sum = sum(row["count"] for row in series)
            total_count = total[0]["count"] if len(total) == 1 else None
            print(json.dumps({
                "window": label,
                "seriesRows": len(series), "expectedHours": hours,
                "seriesComplete": len(actual) == len(set(actual)) == hours and set(actual) == expected,
                "sampledSeriesRows": sample_count(series),
                "countryRows": len(countries), "countryLimitHit": len(countries) == 500,
                "duplicateCountryCodes": len(country_codes) != len(set(country_codes)),
                "sampledCountryRows": sample_count(countries),
                "totalRows": len(total), "sampledTotalRows": sample_count(total),
                "seriesSumEqualsTotal": total_count is not None and series_sum == total_count,
                "seriesSumMinusTotal": series_sum - total_count if total_count is not None else None,
                "countrySumEqualsTotal": total_count is not None and country_sum == total_count,
                "countrySumMinusTotal": country_sum - total_count if total_count is not None else None,
            }, sort_keys=True))
        except (requests.RequestException, ValueError, KeyError, IndexError, TypeError, AttributeError):
            print(json.dumps({"window": label, "result": "QUERY_OR_SHAPE_ERROR"}))


if __name__ == "__main__":
    main()
