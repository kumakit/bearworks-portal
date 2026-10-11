"""Read-only Cloudflare GraphQL capability probe; prints no credentials or zone ID."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


def graphql(token: str, query: str, variables: dict) -> dict | None:
    try:
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": query, "variables": variables},
            timeout=15,
        )
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or result.get("errors"):
            print("graphql_result=ERROR")
            return None
        return result
    except (requests.RequestException, ValueError):
        print("graphql_result=ERROR")
        return None


def main() -> None:
    load_dotenv(".env")
    token, zone = os.getenv("CLOUDFLARE_API_TOKEN"), os.getenv("CLOUDFLARE_ZONE_ID")
    if not token or not zone:
        print("existing_config=MISSING")
        return
    print("existing_config=PRESENT")
    settings_query = """query ProbeSettings($zoneTag: String!) {
      viewer { zones(filter: {zoneTag: $zoneTag}) { settings {
        httpRequests1hGroups { enabled availableFields maxPageSize maxNumberOfFields notOlderThan maxDuration }
        httpRequestsAdaptiveGroups { enabled availableFields maxPageSize maxNumberOfFields notOlderThan maxDuration }
      } } }
    }"""
    payload = graphql(token, settings_query, {"zoneTag": zone})
    if payload is None:
        return
    try:
        settings = payload["data"]["viewer"]["zones"][0]["settings"]
        for name in ("httpRequests1hGroups", "httpRequestsAdaptiveGroups"):
            item = settings[name]
            fields = item.get("availableFields") or []
            summary = {
                "dataset": name,
                "enabled": item.get("enabled"),
                "maxPageSize": item.get("maxPageSize"),
                "maxNumberOfFields": item.get("maxNumberOfFields"),
                "notOlderThan": item.get("notOlderThan"),
                "maxDuration": item.get("maxDuration"),
                "countryField": any("clientCountryName" in str(x) for x in fields),
                "refererField": any("clientRefererHost" in str(x) for x in fields),
                "asnField": any("clientAsn" in str(x) for x in fields),
                "sampleIntervalField": any("sampleInterval" in str(x) for x in fields),
                "hourField": any("datetimeHour" in str(x) or "datetime" in str(x) for x in fields),
                "countryPaths": [str(x) for x in fields if "clientCountryName" in str(x) or "countryMap" in str(x)],
            }
            print(json.dumps(summary, sort_keys=True))
    except (KeyError, IndexError, TypeError, AttributeError):
        print("settings_shape=INVALID")
        return

    security_settings_query = """query ProbeSecuritySettings($zoneTag: String!) {
      viewer { zones(filter: {zoneTag: $zoneTag}) { settings {
        firewallEventsAdaptiveGroups { enabled maxPageSize notOlderThan maxDuration }
        firewallEventsAdaptiveByTimeGroups { enabled maxPageSize notOlderThan maxDuration }
      } } }
    }"""
    security = graphql(token, security_settings_query, {"zoneTag": zone})
    if security is not None:
        try:
            groups = security["data"]["viewer"]["zones"][0]["settings"]
            for name in ("firewallEventsAdaptiveGroups", "firewallEventsAdaptiveByTimeGroups"):
                item = groups[name]
                print(json.dumps({"dataset": name, "enabled": item.get("enabled"),
                    "maxPageSize": item.get("maxPageSize"), "notOlderThan": item.get("notOlderThan"),
                    "maxDuration": item.get("maxDuration")}, sort_keys=True))
        except (KeyError, IndexError, TypeError, AttributeError):
            print("security_settings_shape=INVALID")

    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    hourly_query = """query ProbeHourlyCountry($zoneTag: String!, $since: String!, $until: String!) {
      viewer { zones(filter: {zoneTag: $zoneTag}) {
        traffic: httpRequests1hGroups(
          filter: {datetime_geq: $since, datetime_lt: $until},
          limit: 25, orderBy: [datetime_ASC]) {
          dimensions { datetime }
          avg { sampleInterval }
          sum { requests countryMap { clientCountryName requests } }
        }
      } }
    }"""
    hourly = graphql(token, hourly_query, {
        "zoneTag": zone, "since": (end - timedelta(hours=24)).isoformat(), "until": end.isoformat()
    })
    if hourly is not None:
        try:
            rows = hourly["data"]["viewer"]["zones"][0]["traffic"]
            country_codes = {
                item["clientCountryName"]
                for row in rows
                for item in row["sum"]["countryMap"]
            }
            print(json.dumps({
                "hourly_country_query": "OK",
                "rowCount": len(rows),
                "distinctHours": len({row["dimensions"]["datetime"] for row in rows}),
                "countryRows": sum(len(row["sum"]["countryMap"]) for row in rows),
                "distinctCountryCodes": len(country_codes),
                "countryCodes": sorted(str(code) for code in country_codes),
                "nonAlpha2Codes": sorted(str(code) for code in country_codes if not isinstance(code, str) or len(code) != 2 or not code.isalpha() or not code.isupper()),
                "specialCandidateCodes": sorted(country_codes.intersection({"XX", "T1", "A1", "A2"})),
                "countryEqualsRequests": all(sum(item["requests"] for item in row["sum"]["countryMap"]) == row["sum"]["requests"] for row in rows),
                "sampledRows": sum(1 for row in rows if row.get("avg", {}).get("sampleInterval", 1) > 1),
            }, sort_keys=True))
        except (KeyError, IndexError, TypeError, AttributeError):
            print("hourly_country_query=INVALID_SHAPE")
    country_query = """query ProbeCountry($zoneTag: String!, $since: String!, $until: String!) {
      viewer { zones(filter: {zoneTag: $zoneTag}) {
        countries: httpRequestsAdaptiveGroups(
          filter: {datetime_geq: $since, datetime_lt: $until},
          limit: 300, orderBy: [count_DESC]) {
          count avg { sampleInterval } dimensions { clientCountryName }
        }
      } }
    }"""
    for hours in (24, 168, 720):
        start = end - timedelta(hours=hours)
        country = graphql(token, country_query, {
            "zoneTag": zone, "since": start.isoformat(), "until": end.isoformat()
        })
        if country is None:
            print(f"country_hours_{hours}=ERROR")
            continue
        try:
            rows = country["data"]["viewer"]["zones"][0]["countries"]
            print(json.dumps({
                "country_query": "OK",
                "windowHours": hours,
                "rowCount": len(rows),
                "sampledRows": sum(1 for row in rows if row.get("avg", {}).get("sampleInterval", 1) > 1),
                "countSum": sum(row["count"] for row in rows),
            }, sort_keys=True))
        except (KeyError, IndexError, TypeError, AttributeError):
            print(f"country_hours_{hours}=INVALID_SHAPE")

    series_query = """query ProbeSeries($zoneTag: String!, $since: String!, $until: String!) {
      viewer { zones(filter: {zoneTag: $zoneTag}) {
        series: httpRequestsAdaptiveGroups(
          filter: {datetime_geq: $since, datetime_lt: $until},
          limit: 750, orderBy: [datetimeHour_ASC]) {
          count avg { sampleInterval } dimensions { datetimeHour }
        }
      } }
    }"""
    for hours in (168, 720):
        result = graphql(token, series_query, {"zoneTag": zone,
            "since": (end - timedelta(hours=hours)).isoformat(), "until": end.isoformat()})
        if result is None:
            print(f"series_hours_{hours}=ERROR")
            continue
        try:
            rows = result["data"]["viewer"]["zones"][0]["series"]
            print(json.dumps({"series_query": "OK", "windowHours": hours,
                "rowCount": len(rows),
                "distinctHours": len({row["dimensions"]["datetimeHour"] for row in rows}),
                "sampledRows": sum(1 for row in rows if row.get("avg", {}).get("sampleInterval", 1) > 1)},
                sort_keys=True))
        except (KeyError, IndexError, TypeError, AttributeError):
            print(f"series_hours_{hours}=INVALID_SHAPE")


if __name__ == "__main__":
    main()
