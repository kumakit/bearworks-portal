# Issue #397 初回実装コードレビュー資料

2026-10-07作成。対象範囲と指示はcode-review-request.md、検証はwalkthrough.md。

これは今回の新規コード・対象差分・合成fixtureだけを束ねた読み取り用資料です。実データ・認証ファイル・private Issue本文は含みません。コード内のsynthetic/fixtureは試験値です。

## bearworks-apps/dashboard/cloudflare_collect.py

SHA-256: `4918c09528e67368b2e55a86f5fc887c996bed6fb1cc4902a12d72adf06f36da`

```python
"""Bounded Cloudflare collection with per-block failure state and no saved-value merge."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from cloudflare_contract import NAMES, count, data_valid, instant

GQL = "https://api.cloudflare.com/client/v4/graphql"


class BudgetedClient:
    """A hard per-run request budget also bounds account-wide Pages enumeration."""
    def __init__(self, client, limit=64):
        self.client, self.remaining = client, limit

    def request(self, method, *args, **kwargs):
        if self.remaining <= 0:
            raise CollectionFailure("RESULT_LIMIT")
        self.remaining -= 1
        return getattr(self.client, method)(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self.request("get", *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.request("post", *args, **kwargs)


class CollectionFailure(Exception):
    def __init__(self, code: str):
        self.code = code


def error_code(exc: Exception) -> str:
    if isinstance(exc, CollectionFailure):
        return exc.code
    if isinstance(exc, requests.Timeout):
        return "TIMEOUT"
    if isinstance(exc, requests.HTTPError):
        return "ACCESS_DENIED" if exc.response is not None and exc.response.status_code in (401, 403) else "UPSTREAM_ERROR"
    if isinstance(exc, requests.RequestException):
        return "UPSTREAM_ERROR"
    if isinstance(exc, (ValueError, KeyError, TypeError, AttributeError)):
        return "INVALID_RESPONSE"
    return "UNKNOWN_ERROR"


def block(run_id: str, name: str, now: datetime, max_age: int | None, *, data: Any = None,
          source: str = "LIVE", status: str = "OK", coverage: str = "FULL", error: str | None = None, collected_at: datetime | None = None) -> dict:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) if name == "pagesMonth" else now - timedelta(hours=24 if name == "traffic24h" else 168)
    successful = status in {"OK", "PARTIAL", "DEMO"} and data is not None
    return {"runId": run_id, "data": data, "source": source, "status": status,
            "coverage": coverage, "sampling": "ADAPTIVE" if name not in {"traffic24h", "pagesMonth"} else "UNKNOWN",
            "errorCode": error, "attemptedAt": now.isoformat(),
            "collectedAt": (collected_at or now).isoformat() if successful else None,
            "windowStart": start.isoformat(), "windowEnd": now.isoformat(),
            "validUntil": (now + timedelta(seconds=max_age)).isoformat() if successful and status != "DEMO" and max_age is not None else None,
            "scope": {"kind": "ACCOUNT" if name == "pagesMonth" else "ZONE", "label": "Cloudflareアカウント全体" if name == "pagesMonth" else "設定されたCloudflareゾーン全体"}}


def empty_collection(code: str, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    run_id = str(uuid.uuid4())
    result = {name: block(run_id, name, now, None, source="UNKNOWN", status="ERROR", coverage="UNKNOWN", error=code) for name in NAMES}
    return assemble(run_id, result)


def assemble(run_id: str, results: dict) -> dict:
    return {"schemaVersion": 1, "runId": run_id, "traffic24h": results["traffic24h"],
            "pagesMonth": results["pagesMonth"], "waf7d": {k: results[k] for k in NAMES if k not in {"traffic24h", "pagesMonth"}}}


def zone_query(client: Any, headers: dict, zone_id: str, query: str, now: datetime, hours: int) -> tuple[dict, list]:
    response = client.post(GQL, headers=headers, json={"query": query, "variables": {
        "zoneTag": zone_id, "since": (now - timedelta(hours=hours)).isoformat(), "until": now.isoformat()}}, timeout=20)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict) or payload.get("errors") is not None and not isinstance(payload["errors"], list):
        raise CollectionFailure("INVALID_RESPONSE")
    if payload.get("errors"):
        denied = any(isinstance(e, dict) and isinstance(e.get("message"), str) and any(t in e["message"].lower() for t in ("unauthorized", "not authorized", "does not have access")) for e in payload["errors"])
        raise CollectionFailure("ACCESS_DENIED" if denied else "UPSTREAM_ERROR")
    zones = payload.get("data", {}).get("viewer", {}).get("zones") if isinstance(payload.get("data"), dict) else None
    if not isinstance(zones, list) or len(zones) != 1 or not isinstance(zones[0], dict):
        raise CollectionFailure("UPSTREAM_ERROR" if payload.get("errors") else "INVALID_RESPONSE")
    return zones[0], payload.get("errors") or []


def parse_group(name: str, rows: Any) -> Any:
    if not isinstance(rows, list):
        raise CollectionFailure("INVALID_RESPONSE")
    if name == "traffic24h":
        totals = {"requests": 0, "threatEvents": 0, "cachedRequests": 0}
        hourly = []
        for row in rows:
            values = row["sum"]
            hour = row["dimensions"]["datetime"]
            if instant(hour) is None or not all(count(values.get(k)) for k in ("requests", "threats", "cachedRequests")) or values["cachedRequests"] > values["requests"]:
                raise CollectionFailure("INVALID_RESPONSE")
            for key, upstream in (("requests", "requests"), ("threatEvents", "threats"), ("cachedRequests", "cachedRequests")):
                totals[key] += values[upstream]
            hourly.append({"hour": hour, "requests": values["requests"], "threats": values["threats"]})
        totals["cacheRate"] = round(totals["cachedRequests"] / totals["requests"] * 100, 1) if totals["requests"] else None
        return {**totals, "hourly": hourly}
    if name == "summary":
        actions = {}
        for row in rows:
            action, amount = row["dimensions"]["action"], row["count"]
            if not isinstance(action, str) or not action or not count(amount):
                raise CollectionFailure("INVALID_RESPONSE")
            actions[action] = actions.get(action, 0) + amount
        return {"actionCounts": actions, "totalEvents": sum(actions.values())}
    mapping = {"topRules": {"rule_id": "ruleId", "action": "action", "source": "source"},
               "topPaths": {"path": "clientRequestPath", "action": "action"},
               "topASNs": {"asn": "clientAsn", "org": "clientASNDescription", "country": "clientCountryName"},
               "timeline": {"hour": "datetimeHour", "action": "action"}}[name]
    result = [{**{key: row["dimensions"][field] for key, field in mapping.items()}, "count": row["count"]} for row in rows]
    if not data_valid(name, result):
        raise CollectionFailure("INVALID_RESPONSE")
    return result


def paged(client: Any, url: str, headers: dict) -> list:
    result = []
    for page in range(1, 101):
        response = client.get(url, headers=headers, params={"page": page, "per_page": 100}, timeout=10)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict) or payload.get("success") is not True or not isinstance(payload.get("result"), list):
            raise CollectionFailure("INVALID_RESPONSE")
        items = payload["result"]
        result.extend(items)
        if len(items) < 100:
            return result
    raise CollectionFailure("RESULT_LIMIT")


def collect(api_token: str, zone_id: str, max_age: int | None = None, *, client: Any = requests,
            now: datetime | None = None) -> dict:
    fixed_clock = now is not None
    now = now or datetime.now(timezone.utc)
    run_id = str(uuid.uuid4())
    client = BudgetedClient(client)
    headers = {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}
    results = {}
    specs = {
        "traffic24h": ("traffic", "httpRequests1hGroups", 100, "datetime_ASC", "dimensions { datetime } sum { requests threats cachedRequests }", 24),
        "summary": ("summary", "firewallEventsAdaptiveGroups", 20, "count_DESC", "dimensions { action } count", 168),
        "topRules": ("topRules", "firewallEventsAdaptiveGroups", 10, "count_DESC", "dimensions { ruleId action source } count", 168),
        "topPaths": ("topPaths", "firewallEventsAdaptiveGroups", 10, "count_DESC", "dimensions { clientRequestPath action } count", 168),
        "topASNs": ("topASNs", "firewallEventsAdaptiveGroups", 10, "count_DESC", "dimensions { clientAsn clientASNDescription clientCountryName } count", 168),
        "timeline": ("timeline", "firewallEventsAdaptiveGroups", 1000, "datetimeHour_ASC", "dimensions { datetimeHour action } count", 168),
    }
    for name, (alias, node, limit, order, fields, hours) in specs.items():
        try:
            query = 'query Collect($zoneTag: String!, $since: String!, $until: String!) { viewer { zones(filter: {zoneTag: $zoneTag}) { ' + alias + ': ' + node + '(filter: {datetime_geq: $since, datetime_lt: $until}, limit: ' + str(limit) + ', orderBy: [' + order + ']) { ' + fields + ' } } } }'
            zone, errors = zone_query(client, headers, zone_id, query, now, hours)
            # Each query has one node: every error affects this block. No guessed path mapping.
            if errors:
                denied = any(isinstance(e, dict) and isinstance(e.get("message"), str) and
                    any(token in e["message"].lower() for token in ("unauthorized", "not authorized", "does not have access")) for e in errors)
                raise CollectionFailure("ACCESS_DENIED" if denied else "UPSTREAM_ERROR")
            rows = zone.get(alias)
            data = parse_group(name, rows)
            top = name in {"topRules", "topPaths", "topASNs"}
            truncated = not top and len(rows) >= limit
            results[name] = block(run_id, name, now, max_age, data=data,
                status="PARTIAL" if truncated else "OK", coverage="POSSIBLY_TRUNCATED" if truncated else "TOP_N" if top else "FULL",
                error="RESULT_LIMIT" if truncated else None, collected_at=now if fixed_clock else datetime.now(timezone.utc))
        except Exception as exc:
            results[name] = block(run_id, name, now, None, status="ERROR", coverage="UNKNOWN", error=error_code(exc))
    try:
        response = client.get(f"https://api.cloudflare.com/client/v4/zones/{zone_id}", headers=headers, timeout=10)
        response.raise_for_status()
        payload = response.json()
        if payload.get("success") is not True:
            raise CollectionFailure("INVALID_RESPONSE")
        account = payload["result"]["account"]["id"]
        if not isinstance(account, str) or not account:
            raise CollectionFailure("INVALID_RESPONSE")
        base = f"https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects"
        deployments = 0
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for project in paged(client, base, headers):
            name = project.get("name")
            if not isinstance(name, str) or not name or not all(c.isalnum() or c == '-' for c in name):
                raise CollectionFailure("INVALID_RESPONSE")
            for deployment in paged(client, f"{base}/{name}/deployments", headers):
                created = instant(deployment.get("created_on"))
                if created is None or created > now:
                    raise CollectionFailure("INVALID_RESPONSE")
                if month_start <= created:
                    deployments += 1
        results["pagesMonth"] = block(run_id, "pagesMonth", now, max_age, data={"deploymentCount": deployments,
            "buildCount": None, "limitBuilds": None, "usagePercent": None, "aggregationTimezone": "UTC", "scopeConfirmed": False}, collected_at=now if fixed_clock else datetime.now(timezone.utc))
    except Exception as exc:
        code = error_code(exc)
        results["pagesMonth"] = block(run_id, "pagesMonth", now, None,
            status="PARTIAL" if code == "RESULT_LIMIT" else "ERROR", coverage="POSSIBLY_TRUNCATED" if code == "RESULT_LIMIT" else "UNKNOWN", error=code)
    return assemble(run_id, results)


def demo_collection(dashboard: Any, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    run_id = str(uuid.uuid4())
    summary = dashboard.summary
    waf = dashboard.wafDetails
    requests_count = summary.cloudflareTotalRequests24h
    cached = round(requests_count * summary.cloudflareCacheRate24h / 100)
    values = {"traffic24h": {"requests": requests_count, "threatEvents": summary.cloudflareTotalThreats24h,
        "cachedRequests": cached, "cacheRate": round(cached / requests_count * 100, 1) if requests_count else None},
        "summary": {"actionCounts": waf.action_summary, "totalEvents": waf.total_events},
        "topRules": [x.model_dump() for x in waf.top_rules], "topPaths": [x.model_dump() for x in waf.top_paths],
        "topASNs": [x.model_dump() for x in waf.top_asns], "timeline": [x.model_dump() for x in waf.hourly_timeline],
        "pagesMonth": {"deploymentCount": summary.cloudflarePages.currentMonthBuilds, "buildCount": None,
            "limitBuilds": None, "usagePercent": None, "aggregationTimezone": "UTC", "scopeConfirmed": False}}
    return assemble(run_id, {name: block(run_id, name, now, None, data=value, source="MOCK", status="DEMO",
        coverage="TOP_N" if name in {"topRules", "topPaths", "topASNs"} else "FULL") for name, value in values.items()})
```

## bearworks-apps/dashboard/cloudflare_contract.py

SHA-256: `e558086c0768e0d4abd2e69066c41d7d373311ffb392630d548d8bed70d3b263`

```python
"""Cloudflare collection v1: values and provenance are one result, never legacy fallback."""
from __future__ import annotations

import math
import re
from datetime import datetime, timezone, timedelta
from typing import Any

ERRORS = {"TIMEOUT", "ACCESS_DENIED", "UPSTREAM_ERROR", "INVALID_RESPONSE",
          "MISSING_CONFIG", "PARTIAL_RESPONSE", "RESULT_LIMIT", "UNKNOWN_ERROR"}
NAMES = ("traffic24h", "summary", "topRules", "topPaths", "topASNs", "timeline", "pagesMonth")


def instant(value: Any) -> datetime | None:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})", value):
        return None
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return result.astimezone(timezone.utc).replace(microsecond=result.microsecond // 1000 * 1000) if result.tzinfo else None
    except ValueError:
        return None


def count(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 9007199254740991


def text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip()) and len(value) <= 1024


def number(value: Any) -> bool:
    try:
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
    except OverflowError:
        return False


def data_valid(name: str, value: Any) -> bool:
    if name == "traffic24h":
        if not isinstance(value, dict) or not all(count(value.get(k)) for k in ("requests", "threatEvents", "cachedRequests")):
            return False
        total, cached, rate = value["requests"], value["cachedRequests"], value.get("cacheRate")
        return cached <= total and ((total == 0 and rate is None) or
            (total > 0 and number(rate) and 0 <= rate <= 100 and abs(rate - cached / total * 100) <= .11))
    if name == "summary":
        if not isinstance(value, dict) or not isinstance(value.get("actionCounts"), dict):
            return False
        actions = value["actionCounts"]
        return all(text(k) and count(v) for k, v in actions.items()) and count(value.get("totalEvents")) and sum(actions.values()) == value["totalEvents"]
    if name == "pagesMonth":
        return isinstance(value, dict) and count(value.get("deploymentCount")) and value.get("aggregationTimezone") == "UTC" and value.get("scopeConfirmed") is False and all(value.get(k) is None for k in ("buildCount", "limitBuilds", "usagePercent"))
    if not isinstance(value, list):
        return False
    fields = {"topRules": ("rule_id", "action", "source"), "topPaths": ("path", "action"),
              "topASNs": ("org", "country"), "timeline": ("hour", "action")}.get(name)
    if fields is None:
        return False
    for item in value:
        if not isinstance(item, dict) or not count(item.get("count")) or not all(text(item.get(k)) for k in fields):
            return False
        if name == "topASNs" and not count(item.get("asn")):
            return False
        if name == "timeline" and instant(item["hour"]) is None:
            return False
    return True


def block_valid(name: str, block: Any, run_id: str) -> bool:
    if not isinstance(block, dict) or block.get("runId") != run_id:
        return False
    if any(not isinstance(block.get(k), str) for k in ("source", "status", "coverage", "sampling")):
        return False
    if block.get("errorCode") is not None and not isinstance(block.get("errorCode"), str):
        return False
    fields = ("attemptedAt", "collectedAt", "windowStart", "windowEnd", "validUntil")
    if any(k not in block or block[k] is not None and instant(block[k]) is None for k in fields):
        return False
    source, status, coverage = (block.get(k) for k in ("source", "status", "coverage"))
    data, error = block.get("data"), block.get("errorCode")
    if block.get("sampling") not in {"ADAPTIVE", "NONE", "UNKNOWN"}:
        return False
    scope = block.get("scope")
    expected_scope = "ACCOUNT" if name == "pagesMonth" else "ZONE"
    if not isinstance(scope, dict) or scope.get("kind") != expected_scope or not text(scope.get("label")):
        return False
    if status == "UNKNOWN":
        return source == "UNKNOWN" and coverage == "UNKNOWN" and data is None and error is None
    attempted = instant(block.get("attemptedAt"))
    if attempted is None:
        return False
    if status == "ERROR":
        return source in {"LIVE", "UNKNOWN"} and coverage == "UNKNOWN" and data is None and error in ERRORS - {"PARTIAL_RESPONSE", "RESULT_LIMIT"} and block.get("collectedAt") is None and block.get("validUntil") is None
    if status == "DEMO":
        return source == "MOCK" and coverage in {"FULL", "TOP_N"} and error is None and block.get("validUntil") is None and data_valid(name, data)
    if source != "LIVE":
        return False
    if status == "PARTIAL" and data is None:
        return coverage in {"INCOMPLETE", "POSSIBLY_TRUNCATED"} and error in {"PARTIAL_RESPONSE", "RESULT_LIMIT"} and block.get("collectedAt") is None and block.get("validUntil") is None
    collected, start, end = (instant(block.get(k)) for k in ("collectedAt", "windowStart", "windowEnd"))
    if collected is None or start is None or end is None or not start <= end <= collected or collected < attempted or end != attempted:
        return False
    if name == "pagesMonth":
        if start != end.replace(day=1, hour=0, minute=0, second=0, microsecond=0):
            return False
    elif end - start != timedelta(hours=24 if name == "traffic24h" else 168):
        return False
    if name == "timeline" and isinstance(data, list):
        if any(instant(item.get("hour")) is None or not start <= instant(item["hour"]) <= end for item in data if isinstance(item, dict)):
            return False
    expiry = instant(block.get("validUntil"))
    if block.get("validUntil") is not None and (expiry is None or expiry < collected or expiry > end + timedelta(days=1)):
        return False
    if status == "PARTIAL":
        return coverage in {"INCOMPLETE", "POSSIBLY_TRUNCATED"} and error in {"PARTIAL_RESPONSE", "RESULT_LIMIT"} and (data is None or data_valid(name, data))
    if status != "OK" or coverage not in {"FULL", "TOP_N"} or error is not None:
        return False
    if coverage == "TOP_N" and name not in {"topRules", "topPaths", "topASNs"}:
        return False
    return data_valid(name, data)


def flatten(collection: Any) -> dict[str, Any]:
    if not isinstance(collection, dict):
        return {}
    waf = collection.get("waf7d")
    waf = waf if isinstance(waf, dict) else {}
    return {"traffic24h": collection.get("traffic24h"), "pagesMonth": collection.get("pagesMonth"),
            **{name: waf.get(name) for name in NAMES if name not in {"traffic24h", "pagesMonth"}}}


def usable_data(collection: Any, name: str, now: datetime) -> Any:
    if not isinstance(collection, dict) or type(collection.get("schemaVersion")) is not int or collection["schemaVersion"] != 1:
        return None
    run_id = collection.get("runId")
    if not isinstance(run_id, str) or not run_id or len(run_id) > 128:
        return None
    block = flatten(collection).get(name)
    if not block_valid(name, block, run_id) or block["source"] != "LIVE" or block["status"] != "OK":
        return None
    collected, expiry = instant(block.get("collectedAt")), instant(block.get("validUntil"))
    if collected is None or expiry is None or not collected <= now < expiry:
        return None
    return block["data"]
```

## bearworks-apps/dashboard/tests/test_cloudflare_collection.py

SHA-256: `5e5cb098a88b1b3dee0053b5b591801b07dfcaeaccfc840e3324e08f58f61e3d`

```python
import copy
import importlib
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock

import pytest
import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cloudflare_collect import collect, empty_collection
from cloudflare_contract import NAMES, block_valid, flatten, usable_data

NOW = datetime(2026, 10, 6, tzinfo=timezone.utc)
FIXTURE = Path(__file__).with_name("fixtures") / "cloudflare-collection-v1.json"


@pytest.fixture
def valid():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def response(payload, status=200):
    result = Mock()
    result.status_code = status
    result.json.return_value = payload
    if status >= 400:
        result.raise_for_status.side_effect = requests.HTTPError(response=result)
    return result


class Client:
    def __init__(self, fail=None, rows=None, pages_fail=False):
        self.fail, self.rows, self.pages_fail = fail, rows or {}, pages_fail

    def post(self, url, **kwargs):
        alias = re.search(r"\{ (\w+):", kwargs["json"]["query"]).group(1)
        if self.fail == alias:
            return response({"data": {"viewer": {"zones": [{alias: None}]}}, "errors": [{"path": ["viewer", "zones", 0, alias]}]})
        return response({"data": {"viewer": {"zones": [{alias: self.rows.get(alias, [])}]}}, "errors": None})

    def get(self, url, **kwargs):
        if "/zones/" in url:
            return response({"success": True, "result": {"account": {"id": "fixture-account"}}})
        if self.pages_fail:
            return response({}, 403)
        return response({"success": True, "result": []})


def test_successful_zero_is_not_missing():
    result = collect("synthetic", "synthetic", 10800, client=Client(), now=NOW)
    data = usable_data(result, "traffic24h", NOW)
    assert data["requests"] == 0 and data["cacheRate"] is None
    assert usable_data(result, "summary", NOW)["totalEvents"] == 0
    assert all(block_valid(name, item, result["runId"]) for name, item in flatten(result).items())


def test_optional_failure_does_not_invalidate_summary():
    result = collect("synthetic", "synthetic", 10800, client=Client(fail="topASNs"), now=NOW)
    assert usable_data(result, "summary", NOW) is not None
    assert result["waf7d"]["topASNs"]["status"] == "ERROR"
    assert result["waf7d"]["topASNs"]["data"] is None


def test_graphql_error_is_not_success():
    result = collect("synthetic", "synthetic", 10800, client=Client(fail="traffic"), now=NOW)
    assert usable_data(result, "traffic24h", NOW) is None
    assert result["traffic24h"]["data"] is None
    assert result["traffic24h"]["errorCode"] == "UPSTREAM_ERROR"


def test_malformed_count_and_limited_timeline():
    invalid = [{"sum": {"requests": -1, "threats": 0, "cachedRequests": 0}, "dimensions": {"datetime": NOW.isoformat()}}]
    timeline = [{"dimensions": {"datetimeHour": NOW.isoformat(), "action": "block"}, "count": 1}] * 1000
    result = collect("synthetic", "synthetic", 10800, client=Client(rows={"traffic": invalid, "timeline": timeline}), now=NOW)
    assert result["traffic24h"]["errorCode"] == "INVALID_RESPONSE"
    assert result["waf7d"]["timeline"]["status"] == "PARTIAL"
    assert usable_data(result, "timeline", NOW) is None


def test_pages_failure_and_empty_projects():
    result = collect("synthetic", "synthetic", 10800, client=Client(pages_fail=True), now=NOW)
    assert result["pagesMonth"]["errorCode"] == "ACCESS_DENIED"
    assert result["pagesMonth"]["data"] is None
    zero = collect("synthetic", "synthetic", 10800, client=Client(), now=NOW)["pagesMonth"]["data"]
    assert zero["deploymentCount"] == 0 and zero["scopeConfirmed"] is False
    assert zero["usagePercent"] is None and zero["aggregationTimezone"] == "UTC"


def test_no_freshness_policy_never_usable():
    result = collect("synthetic", "synthetic", client=Client(), now=NOW)
    assert result["traffic24h"]["validUntil"] is None
    assert usable_data(result, "traffic24h", NOW) is None


@pytest.mark.parametrize("mutation", ["old", "unknown_version", "run_mismatch", "source", "status", "coverage", "sampling", "errorCode", "future", "expiry_before_collection", "negative", "nan", "partial", "demo", "expired"])
def test_contract_rejects_untrusted_values(valid, mutation):
    result = copy.deepcopy(valid)
    b = result["traffic24h"]
    if mutation == "old": result = None
    elif mutation == "unknown_version": result["schemaVersion"] = 2
    elif mutation == "run_mismatch": b["runId"] = "previous-run"
    elif mutation in {"source", "status", "coverage", "sampling", "errorCode"}: b[mutation] = "unexpected"
    elif mutation == "future": b["windowEnd"] = (NOW + timedelta(days=1)).isoformat()
    elif mutation == "expiry_before_collection": b["validUntil"] = (NOW - timedelta(seconds=1)).isoformat()
    elif mutation == "negative": b["data"]["requests"] = -1
    elif mutation == "nan": b["data"]["cacheRate"] = float("nan")
    elif mutation == "partial": b.update(status="PARTIAL", coverage="INCOMPLETE", errorCode="PARTIAL_RESPONSE")
    elif mutation == "demo": b.update(status="DEMO", source="MOCK", validUntil=None)
    elif mutation == "expired": b["validUntil"] = NOW.isoformat()
    assert usable_data(result, "traffic24h", NOW) is None


def test_expiry_boundary(valid):
    expiry = datetime(2026, 10, 6, 3, tzinfo=timezone.utc)
    assert usable_data(valid, "traffic24h", expiry - timedelta(microseconds=1)) is not None
    assert usable_data(valid, "traffic24h", expiry) is None


def test_every_error_block_has_null_data():
    result = empty_collection("MISSING_CONFIG", NOW)
    assert all(item["data"] is None and block_valid(name, item, result["runId"]) for name, item in flatten(result).items())


@pytest.mark.parametrize("state", ["old", "ERROR", "PARTIAL", "DEMO", "valid"])
def test_digest_preserves_other_services_and_never_uses_legacy(tmp_path, monkeypatch, valid, state):
    from ai_operations.collect_metrics import extract_dashboard_snapshot
    from ai_operations.config import DigestSettings
    payload = {"updatedAt": NOW.isoformat(), "summary": {"googleErrorRate24h": 1.5,
        "googleBilling": {"usagePercent": 32}, "bigqueryUsage": {"usageQueryPercent": 7, "usageStoragePercent": 9},
        "cloudflareTotalThreats24h": 999999, "cloudflarePages": {"usagePercent": 99}}}
    if state != "old":
        payload["cloudflareCollection"] = copy.deepcopy(valid)
        b = payload["cloudflareCollection"]["traffic24h"]
        if state == "ERROR": b.update(status="ERROR", coverage="UNKNOWN", data=None, collectedAt=None, validUntil=None, errorCode="TIMEOUT")
        elif state == "PARTIAL": b.update(status="PARTIAL", coverage="INCOMPLETE", errorCode="PARTIAL_RESPONSE")
        elif state == "DEMO": b.update(status="DEMO", source="MOCK", validUntil=None)
    path = tmp_path / "data.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    class Clock:
        @staticmethod
        def now(tz=None): return NOW
    monkeypatch.setattr("ai_operations.collect_metrics.datetime", Clock)
    settings = DigestSettings(dashboard_data_path=path)
    ok, snapshot, error = extract_dashboard_snapshot(settings)
    assert ok and snapshot.google_error_rate_24h == 1.5 and snapshot.bigquery_query_percent == 7
    assert snapshot.cloudflare_total_threats_24h == (4 if state == "valid" else None)
    assert snapshot.cloudflare_pages_percent is None
    assert error == (None if state == "valid" else "CLOUDFLARE_DATA_UNAVAILABLE")


def test_actual_main_demo_and_missing_configuration(tmp_path, monkeypatch):
    import dotenv
    monkeypatch.setattr(dotenv, "load_dotenv", lambda: None)
    fetcher = importlib.import_module("fetch_dashboard_data")
    output = tmp_path / "data.json"
    monkeypatch.setattr(sys, "argv", ["fetch_dashboard_data.py", "--mock", "-o", str(output)])
    fetcher.main()
    data = json.loads(output.read_text(encoding="utf-8"))
    c = data["cloudflareCollection"]
    assert all(b["source"] == "MOCK" and b["status"] == "DEMO" for b in flatten(c).values())
    assert all(block_valid(name, b, c["runId"]) for name, b in flatten(c).items())
    monkeypatch.delenv("CLOUDFLARE_API_TOKEN", raising=False)
    monkeypatch.delenv("CLOUDFLARE_ZONE_ID", raising=False)
    monkeypatch.setattr(sys, "argv", ["fetch_dashboard_data.py", "-o", str(output)])
    fetcher.main()
    c = json.loads(output.read_text(encoding="utf-8"))["cloudflareCollection"]
    assert all(b["data"] is None and b["errorCode"] == "MISSING_CONFIG" for b in flatten(c).values())


def test_legacy_pages_null_does_not_discard_google(tmp_path):
    from ai_operations.collect_metrics import extract_dashboard_snapshot
    from ai_operations.config import DigestSettings
    path = tmp_path / "data.json"
    path.write_text(json.dumps({"summary": {"googleErrorRate24h": 2,
        "googleBilling": {"usagePercent": 3}, "bigqueryUsage": {}, "cloudflarePages": None}}), encoding="utf-8")
    ok, snapshot, error = extract_dashboard_snapshot(DigestSettings(dashboard_data_path=path))
    assert ok and snapshot.google_error_rate_24h == 2 and snapshot.google_billing_percent == 3
    assert snapshot.cloudflare_total_threats_24h is None and error == "CLOUDFLARE_DATA_UNAVAILABLE"


@pytest.mark.parametrize("severity, expected", [(None, "partial"), ("warning", "warning"), ("critical", "critical")])
def test_digest_cycle_keeps_errors_and_cannot_assert_cf_safety(tmp_path, severity, expected):
    from unittest.mock import patch
    from ai_operations.config import DigestSettings
    from ai_operations.generate_digest import run_digest_cycle
    from ai_operations.schemas import MetricsSnapshot, DashboardSnapshot, ServiceStatus, LLMDigestResponse, Anomaly
    metrics = MetricsSnapshot(cpu_percent_avg=1, cpu_percent_max=1, memory_percent=1,
        memory_used_gb=1, memory_total_gb=100, disk_percent=1, disk_used_gb=1, disk_total_gb=100,
        load_avg_1m=0, load_avg_5m=0, load_avg_15m=0, uptime_seconds=100)
    anomalies = [Anomaly(severity=severity, code="HIGH_CPU", title="CPU", evidence="synthetic")] if severity else []
    llm = LLMDigestResponse(summary="Cloudflareは安全です。", anomalies=[],
        recommended_actions=["防御機能を止めてください。", "ルール解除を行ってください。", "CPUを確認してください。"])
    settings = DigestSettings(public_status_path=tmp_path / "digest.json", last_success_path=tmp_path / "last.json")
    with (patch("ai_operations.generate_digest.collect_system_metrics", return_value=metrics),
          patch("ai_operations.generate_digest.collect_service_status", return_value=ServiceStatus(active=True, status_str="active", restarts=0)),
          patch("ai_operations.generate_digest.collect_llm_status", return_value=(True, {"available": True})),
          patch("ai_operations.generate_digest.extract_dashboard_snapshot", return_value=(True, DashboardSnapshot(google_error_rate_24h=2), "CLOUDFLARE_DATA_UNAVAILABLE")),
          patch("ai_operations.generate_digest.evaluate_system_rules", return_value=anomalies),
          patch("ai_operations.generate_digest.get_llm_digest", return_value=(True, llm, {}, None)) as model,
          patch("ai_operations.generate_digest.load_last_success", return_value=None),
          patch("ai_operations.generate_digest.atomic_write_json") as write):
        run_digest_cycle(settings)
    assert write.call_count == 1
    output = write.call_args.args[1]
    assert output.status == expected and "CLOUDFLARE_DATA_UNAVAILABLE" in output.errors
    assert output.dashboard_snapshot.google_error_rate_24h == 2
    assert "安全" not in output.summary and "未取得・未確認" in output.summary
    assert not any("防御機能" in a or "ルール解除" in a for a in output.recommended_actions)
    assert "Cloudflare" in model.call_args.args[2] and "判定対象に含めない" in model.call_args.args[2]


@pytest.mark.parametrize("data", [None, {"viewer": {"zones": [{}]}}])
def test_http_200_authorization_error_is_actionable(data):
    client = Client()
    client.post = Mock(return_value=response({"data": data, "errors": [{"message": "not authorized for that account"}]}))
    result = collect("synthetic", "synthetic", 10800, client=client, now=NOW)
    assert result["traffic24h"]["errorCode"] == "ACCESS_DENIED"


def test_pages_request_budget_is_partial_not_zero_success():
    client = Client()
    def get(url, **kwargs):
        if "/zones/" in url:
            return response({"success": True, "result": {"account": {"id": "fixture-account"}}})
        return response({"success": True, "result": [{"name": "fixture"}] * 100})
    client.get = Mock(side_effect=get)
    result = collect("synthetic", "synthetic", 10800, client=client, now=NOW)
    assert client.get.call_count <= 58
    b = result["pagesMonth"]
    assert b["status"] == "PARTIAL" and b["errorCode"] == "RESULT_LIMIT" and b["data"] is None
    assert usable_data(result, "pagesMonth", NOW) is None


@pytest.mark.parametrize("mutation", ["old_window", "wrong_duration", "future_expiry", "huge_rate"])
def test_period_and_extreme_values_fail_closed(valid, mutation):
    b=valid["traffic24h"]
    if mutation == "old_window":
        b["windowStart"],b["windowEnd"]="2025-10-05T00:00:00Z","2025-10-06T00:00:00Z"
    elif mutation == "wrong_duration": b["windowStart"]="2026-10-04T00:00:00Z"
    elif mutation == "future_expiry": b["validUntil"]="2026-10-08T00:00:00Z"
    elif mutation == "huge_rate": b["data"]["cacheRate"]=10**1000
    assert usable_data(valid,"traffic24h",NOW) is None


def test_pages_quota_unverified_is_not_collection_failure(valid):
    assert usable_data(valid,"traffic24h",NOW)["threatEvents"] == 4
    assert usable_data(valid,"pagesMonth",NOW)["deploymentCount"] == 0
    assert usable_data(valid,"pagesMonth",NOW)["usagePercent"] is None


def test_recent_collection_cannot_relabel_an_old_window(valid):
    b=valid["traffic24h"]
    b["windowStart"],b["windowEnd"]="2026-10-04T01:00:00Z","2026-10-05T01:00:00Z"
    b["validUntil"]="2026-10-06T01:00:00Z"
    assert usable_data(valid,"traffic24h",NOW) is None


def test_core_fallback_removes_untrusted_cf_but_preserves_google(tmp_path):
    from unittest.mock import patch
    from ai_operations.config import DigestSettings
    from ai_operations.generate_digest import run_digest_cycle
    from ai_operations.schemas import OperationsDigest,DashboardSnapshot,LlmInfo,ServiceStatus
    previous=OperationsDigest(generated_at=NOW.isoformat(),last_success_at=NOW.isoformat(),status="ok",stale=False,
        summary="Cloudflareは正常",anomalies=[],recommended_actions=["防御機能を止めてください。"],
        dashboard_snapshot=DashboardSnapshot(google_billing_percent=7,cloudflare_total_threats_24h=9999,cloudflare_pages_percent=0),
        llm=LlmInfo(model="synthetic",available=True,duration_ms=1,prompt_tokens=1,completion_tokens=1))
    settings=DigestSettings(public_status_path=tmp_path/"digest.json",last_success_path=tmp_path/"last.json")
    with (patch("ai_operations.generate_digest.collect_system_metrics",side_effect=RuntimeError("synthetic")),
          patch("ai_operations.generate_digest.collect_service_status",return_value=ServiceStatus(active=True,status_str="active",restarts=0)),
          patch("ai_operations.generate_digest.collect_llm_status",return_value=(False,{})),
          patch("ai_operations.generate_digest.extract_dashboard_snapshot",return_value=(False,None,"DASHBOARD_DATA_UNAVAILABLE")),
          patch("ai_operations.generate_digest.load_last_success",return_value=previous),
          patch("ai_operations.generate_digest.atomic_write_json") as write):
        run_digest_cycle(settings)
    result=write.call_args.args[1]
    assert result.stale and result.dashboard_snapshot.google_billing_percent==7
    assert result.dashboard_snapshot.cloudflare_total_threats_24h is None
    assert result.dashboard_snapshot.cloudflare_pages_percent is None
    assert "DASHBOARD_DATA_UNAVAILABLE" in result.errors and "CLOUDFLARE_DATA_UNAVAILABLE" in result.errors
    assert "Cloudflareは正常" not in result.summary
    assert not any("防御機能" in a for a in result.recommended_actions)


@pytest.mark.parametrize("field", ["source", "status", "coverage", "sampling", "errorCode"])
@pytest.mark.parametrize("value", [[], {}, 7])
def test_structured_enum_never_throws(valid,field,value):
    valid["traffic24h"][field]=value
    assert usable_data(valid,"traffic24h",NOW) is None
```

## bearworks-apps/.github/workflows/dashboard-tests.yml

SHA-256: `6f93cb642a4af6ecb8c23e998bd357c88ec2f5d2aa213d22ffd2549de7085e74`

```yaml
name: Dashboard tests

on:
  pull_request:
    paths:
      - 'dashboard/**'
      - '.github/workflows/dashboard-tests.yml'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: dashboard
    env:
      PYTHONDONTWRITEBYTECODE: '1'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install locked environment
        run: |
          python -m pip install uv==0.11.2
          uv sync --locked --python 3.12
      - name: Verify Cloudflare contract and Dashboard regressions
        run: uv run --locked python -B -m pytest -p no:cacheprovider tests/test_cloudflare_collection.py tests/ai_operations tests/test_gcp_credits.py tests/test_billing_optimization.py -q
```

## bearworks-portal/app/(non-monetized)/dashboard/lib/cloudflareCollection.ts

SHA-256: `e27ebabceb5332fc169b8b0d8a1f725f917c9102520304d36b6efde710245cc6`

```typescript
import type { WAFTopRule, WAFTopPath, WAFTopASN, WAFHourlyEvent } from "./dashboardUtils";

export type Sampling = "ADAPTIVE" | "NONE" | "UNKNOWN";
export type BlockKey = "traffic24h" | "summary" | "topRules" | "topPaths" | "topASNs" | "timeline" | "pagesMonth";
export type BlockStatus = "OK" | "PARTIAL" | "ERROR" | "UNKNOWN" | "DEMO";
export interface TrafficData { requests: number; threatEvents: number; cachedRequests: number; cacheRate: number | null }
export interface SummaryData { totalEvents: number; actionCounts: Record<string, number> }
export interface PagesData { deploymentCount: number; buildCount: null; limitBuilds: null; usagePercent: null; aggregationTimezone: "UTC"; scopeConfirmed: false }
interface DataByKey { traffic24h: TrafficData; summary: SummaryData; topRules: WAFTopRule[]; topPaths: WAFTopPath[]; topASNs: WAFTopASN[]; timeline: WAFHourlyEvent[]; pagesMonth: PagesData }
export interface CollectionBlock<T> {
  status: BlockStatus; source: "LIVE" | "MOCK" | "UNKNOWN";
  coverage: "FULL" | "TOP_N" | "INCOMPLETE" | "POSSIBLY_TRUNCATED" | "UNKNOWN";
  sampling: Sampling; errorCode: string | null; data: T | null;
  attemptedAt: string | null; collectedAt: string | null; windowStart: string | null; windowEnd: string | null; validUntil: string | null;
  scope: { kind: "ZONE" | "ACCOUNT"; label: string } | null;
  invalid: boolean;
}
export type Collection = { [K in BlockKey]: CollectionBlock<DataByKey[K]> };
export const BLOCK_KEYS: BlockKey[] = ["traffic24h", "summary", "topRules", "topPaths", "topASNs", "timeline", "pagesMonth"];
export const BLOCK_LABELS: Record<BlockKey, string> = { traffic24h: "アクセス統計（24時間）", summary: "WAF処理集計（7日間）", topRules: "上位ルール", topPaths: "上位パス", topASNs: "上位ネットワーク", timeline: "WAF時系列", pagesMonth: "Pages当月デプロイ" };
const FAILURE_CODES = ["TIMEOUT", "ACCESS_DENIED", "UPSTREAM_ERROR", "INVALID_RESPONSE", "MISSING_CONFIG", "UNKNOWN_ERROR"];
const ERROR_CODES = [...FAILURE_CODES, "PARTIAL_RESPONSE", "RESULT_LIMIT"];
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const count = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const str = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0 && x.length <= 1024;
const member = (x: unknown, values: string[]) => typeof x === "string" && values.includes(x);

/** タイムゾーン付きの実在する日時だけを受け入れる。端末の現在時刻は使わない。 */
export function timestamp(x: unknown): number | null {
  if (typeof x !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.exec(x);
  if (!m) return null;
  const [, year, month, day, hour, minute, second] = m;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (+month < 1 || +month > 12 || +day < 1 || +day > days || +hour > 23 || +minute > 59 || +second > 59) return null;
  // PythonのISO出力は最大6桁。ブラウザの解析前にミリ秒へ切り下げる。
  const milliseconds = x.replace(/\.(\d{1,6})(?=Z|[+-]\d{2}:\d{2}$)/, (_, fraction: string) => `.${fraction.slice(0, 3).padEnd(3, "0")}`);
  const ms = Date.parse(milliseconds);
  return Number.isFinite(ms) ? ms : null;
}

function dataValid(key: BlockKey, x: unknown): boolean {
  if (["topRules", "topPaths", "topASNs", "timeline"].includes(key)) {
    if (!Array.isArray(x) || x.length > 10000) return false;
    return x.every(item => {
      if (!record(item) || !count(item.count)) return false;
      if (key === "topASNs") return count(item.asn) && str(item.org) && str(item.country);
      if (!str(item.action)) return false;
      if (key === "topRules") return str(item.rule_id) && str(item.source);
      if (key === "topPaths") return str(item.path);
      return timestamp(item.hour) !== null;
    });
  }
  if (!record(x)) return false;
  if (key === "traffic24h") return count(x.requests) && count(x.threatEvents) && count(x.cachedRequests) && x.cachedRequests <= x.requests &&
    (x.requests === 0 ? x.cacheRate === null : typeof x.cacheRate === "number" && Number.isFinite(x.cacheRate) && x.cacheRate >= 0 && x.cacheRate <= 100 && Math.abs(x.cacheRate - x.cachedRequests / x.requests * 100) <= 0.11);
  if (key === "summary") return count(x.totalEvents) && record(x.actionCounts) && Object.entries(x.actionCounts).every(([a, n]) => str(a) && count(n)) &&
    Object.values(x.actionCounts).reduce<number>((sum, n) => sum + Number(n), 0) === x.totalEvents;
  return count(x.deploymentCount) && x.buildCount === null && x.limitBuilds === null && x.usagePercent === null && x.aggregationTimezone === "UTC" && x.scopeConfirmed === false;
}

function unknownBlock<T>(): CollectionBlock<T> {
  return { status: "UNKNOWN", source: "UNKNOWN", coverage: "UNKNOWN", sampling: "UNKNOWN", data: null, errorCode: null,
    attemptedAt: null, collectedAt: null, windowStart: null, windowEnd: null, validUntil: null, scope: null, invalid: true };
}

function parseBlock<K extends BlockKey>(key: K, x: unknown, runId: string): CollectionBlock<DataByKey[K]> {
  const bad = () => unknownBlock<DataByKey[K]>();
  if (!record(x) || x.runId !== runId || !member(x.source, ["LIVE", "MOCK", "UNKNOWN"]) || !member(x.status, ["OK", "PARTIAL", "ERROR", "UNKNOWN", "DEMO"]) ||
    !member(x.coverage, ["FULL", "TOP_N", "INCOMPLETE", "POSSIBLY_TRUNCATED", "UNKNOWN"]) || !member(x.sampling, ["ADAPTIVE", "NONE", "UNKNOWN"]) ||
    !(x.errorCode === null || member(x.errorCode, ERROR_CODES))) return bad();
  if (!record(x.scope) || x.scope.kind !== (key === "pagesMonth" ? "ACCOUNT" : "ZONE") || !str(x.scope.label)) return bad();
  const fields = ["attemptedAt", "collectedAt", "windowStart", "windowEnd", "validUntil"] as const;
  if (fields.some(f => x[f] !== null && timestamp(x[f]) === null)) return bad();
  const success = x.source === "LIVE" && x.status === "OK" && member(x.coverage, ["FULL", "TOP_N"]) && x.errorCode === null;
  const partial = x.source === "LIVE" && x.status === "PARTIAL" && member(x.coverage, ["INCOMPLETE", "POSSIBLY_TRUNCATED"]) && member(x.errorCode, ["PARTIAL_RESPONSE", "RESULT_LIMIT"]);
  const error = member(x.source, ["LIVE", "UNKNOWN"]) && x.status === "ERROR" && x.coverage === "UNKNOWN" && x.data === null && member(x.errorCode, FAILURE_CODES);
  const unknown = x.source === "UNKNOWN" && x.status === "UNKNOWN" && x.coverage === "UNKNOWN" && x.data === null && x.errorCode === null;
  const demo = x.source === "MOCK" && x.status === "DEMO" && member(x.coverage, ["FULL", "TOP_N"]) && x.errorCode === null && x.validUntil === null;
  if (!(success || partial || error || unknown || demo)) return bad();
  if (x.coverage === "TOP_N" && !["topRules", "topPaths", "topASNs"].includes(key)) return bad();
  if ((success || demo || partial && x.data !== null) && !dataValid(key, x.data)) return bad();
  if ((error || unknown || partial && x.data === null) && (x.data !== null || x.collectedAt !== null || x.validUntil !== null)) return bad();
  if ((success || partial || demo) && x.data !== null) {
    const start = timestamp(x.windowStart), end = timestamp(x.windowEnd), collected = timestamp(x.collectedAt), attempted = timestamp(x.attemptedAt);
    if (start === null || end === null || collected === null || attempted === null || start > end || end > collected || attempted > collected || x.source === "LIVE" && end !== attempted) return bad();
    const until = timestamp(x.validUntil);
    if (until !== null && until < collected) return bad();
    if (!demo) {
      if (key === "traffic24h" && end - start !== 24 * 60 * 60 * 1000) return bad();
      if (key !== "traffic24h" && key !== "pagesMonth" && end - start !== 7 * 24 * 60 * 60 * 1000) return bad();
      if (key === "pagesMonth") {
        const endDate = new Date(end);
        if (start !== Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)) return bad();
      }
      if (until !== null && until > end + 86400 * 1000) return bad();
    }
    if (key === "timeline" && (x.data as WAFHourlyEvent[]).some(item => timestamp(item.hour)! < start || timestamp(item.hour)! > end)) return bad();
  }
  return { status: x.status, source: x.source, coverage: x.coverage, sampling: x.sampling, errorCode: x.errorCode, data: x.data,
    attemptedAt: x.attemptedAt, collectedAt: x.collectedAt, windowStart: x.windowStart, windowEnd: x.windowEnd, validUntil: x.validUntil,
    scope: { kind: x.scope.kind, label: x.scope.label }, invalid: false } as CollectionBlock<DataByKey[K]>;
}

export function parseCollection(payload: unknown): Collection {
  const root = record(payload) ? payload.cloudflareCollection : null;
  const valid = record(root) && root.schemaVersion === 1 && str(root.runId) && root.runId.length <= 128;
  const waf = valid && record(root.waf7d) ? root.waf7d : {};
  return Object.fromEntries(BLOCK_KEYS.map(key => [key, valid ? parseBlock(key, key === "traffic24h" || key === "pagesMonth" ? root[key] : waf[key], root.runId as string) : unknownBlock()])) as Collection;
}

export interface ClockAnchor { servedMs: number; receivedMono: number; rttMs: number; uncertaintyMs: number; resyncMs: number }
export function syncClock(meta: unknown, startMono: number, receiveMono: number, previous: ClockAnchor | null): ClockAnchor | null {
  if (!record(meta)) return null;
  const servedMs = timestamp(meta.servedAt);
  if (servedMs === null || !count(meta.clockMaxUncertaintySeconds) || meta.clockMaxUncertaintySeconds === 0 || !count(meta.clockResyncIntervalSeconds) || meta.clockResyncIntervalSeconds === 0 ||
    !Number.isSafeInteger(meta.clockMaxUncertaintySeconds * 1000) || !Number.isSafeInteger(meta.clockResyncIntervalSeconds * 1000)) return null;
  const rttMs = receiveMono - startMono;
  const uncertaintyMs = meta.clockMaxUncertaintySeconds * 1000;
  if (!Number.isFinite(rttMs) || startMono < 0 || rttMs < 0 || rttMs > uncertaintyMs) return null;
  if (previous) {
    const elapsed = receiveMono - previous.receivedMono;
    if (elapsed < 0 || Math.abs(servedMs - (previous.servedMs + elapsed)) > uncertaintyMs + previous.rttMs + rttMs) return null;
  }
  return { servedMs, receivedMono: receiveMono, rttMs, uncertaintyMs, resyncMs: meta.clockResyncIntervalSeconds * 1000 };
}
export function clockUpperBound(anchor: ClockAnchor | null, mono: number): number | null {
  if (!anchor || !Number.isFinite(mono)) return null;
  const elapsed = mono - anchor.receivedMono;
  if (elapsed < 0 || elapsed >= anchor.resyncMs) return null;
  return anchor.servedMs + elapsed + anchor.rttMs + anchor.uncertaintyMs;
}

export type DisplayState = "取得正常" | "一部未取得" | "取得失敗" | "期限切れ" | "デモ" | "未確認";
export interface BlockAssessment { domain: "COLLECTION"; ruleId: "C01" | "C02" | "C03" | "C04" | "C05"; state: DisplayState; reason: string; action: string; usable: boolean }
export function assessBlock(block: CollectionBlock<unknown>, nowUpper: number | null): BlockAssessment {
  const result = (state: DisplayState, reason: string, action: string, usable = false, ruleId: BlockAssessment["ruleId"] = "C04"): BlockAssessment => ({ domain: "COLLECTION", ruleId, state, reason, action, usable });
  if (block.invalid) return result("未確認", "取得形式・実行識別子・期間の整合性を確認できません。", "収集処理の出力形式を確認する", false, "C01");
  if (block.status === "DEMO") return result("デモ", "収集側が明示したデモ値です。本番の状態を表しません。", "", true);
  if (block.status === "ERROR") {
    const config = ["ACCESS_DENIED", "MISSING_CONFIG"].includes(block.errorCode!);
    const reasons: Record<string, string> = { ACCESS_DENIED: "アクセス条件を満たせませんでした", MISSING_CONFIG: "必要な収集設定が不足していました", TIMEOUT: "応答の待ち時間を超えました", UPSTREAM_ERROR: "取得先の応答が失敗しました", INVALID_RESPONSE: "取得先の応答形式を確認できませんでした", UNKNOWN_ERROR: "原因を特定できない取得失敗がありました" };
    return result("取得失敗", `最後の取得試行では、${reasons[block.errorCode!] ?? "取得できませんでした"}。現在も続いているかは未確認です。`,
      config ? "収集処理の設定とアクセス条件を確認する" : "時間をおいて再取得する", false, config ? "C02" : "C03");
  }
  if (block.status === "UNKNOWN") return result("未確認", "取得状態が不明です。", "収集処理の取得状態を確認する");
  if (block.status === "PARTIAL" && block.data === null) return result("一部未取得", "取得は完了せず、表示できる部分データもありません。", "取得範囲と収集処理の応答を確認する");
  if (nowUpper === null || !Number.isFinite(nowUpper)) return result("未確認", "サーバー時刻の同期または許容誤差・再同期間隔の設定を確認できません。", "再読込し、時刻同期の運用設定を確認する", false, "C05");
  const until = timestamp(block.validUntil);
  if (until === null) return result("未確認", "データの更新期限が未設定です。", "収集間隔と更新期限の設定を確認する", false, "C05");
  if (timestamp(block.collectedAt)! > nowUpper) return result("未確認", "取得時刻がサーバー基準時刻より未来です。", "収集処理とサーバーの時刻同期を確認する", false, "C05");
  if (nowUpper >= until) return result("期限切れ", "データの有効期限に達しています。", "再読込し、収集処理の更新状況を確認する", false, "C05");
  if (block.status === "PARTIAL") return result("一部未取得", "今回確認できた部分データだけを参考表示します。", "取得範囲と収集処理の応答を確認する", block.data !== null);
  return result("取得正常", block.coverage === "TOP_N" ? "要求した上位一覧を取得しました。全体件数ではありません。" : "要求した集計範囲の取得を確認しました。安全の判定ではありません。", "", true);
}
export function assessCollection(collection: Collection, nowUpper: number | null) {
  const blocks = Object.fromEntries(BLOCK_KEYS.map(key => [key, assessBlock(collection[key], nowUpper)])) as Record<BlockKey, BlockAssessment>;
  const counts = { unavailable: 0, total: BLOCK_KEYS.length };
  for (const key of BLOCK_KEYS) if (blocks[key].state !== "取得正常" && blocks[key].state !== "デモ") counts.unavailable++;
  const states = BLOCK_KEYS.map(key => blocks[key].state);
  const state: DisplayState = states.every(s => s === "デモ") ? "デモ" : states.every(s => s === "取得正常") ? "取得正常" :
    states.includes("取得正常") || states.includes("一部未取得") ? "一部未取得" : states.includes("取得失敗") ? "取得失敗" : states.includes("期限切れ") ? "期限切れ" : "未確認";
  const actions = [...new Set(BLOCK_KEYS.filter(k => collection[k].status !== "DEMO").sort((a, b) => Number(["ACCESS_DENIED", "MISSING_CONFIG"].includes(collection[b].errorCode!)) - Number(["ACCESS_DENIED", "MISSING_CONFIG"].includes(collection[a].errorCode!))).map(k => blocks[k].action).filter(Boolean))];
  return { state, blocks, counts, actions,
    signals: { domain: "SIGNALS" as const, state: "判定ルール未設定" as const, total: 0, unavailable: 0, configured: 0 },
    pagesQuota: { domain: "COLLECTION" as const, ruleId: "P01", state: "未確認" as const, unavailable: 1, total: 1 },
    wafFacts: { domain: "FACT" as const, ruleId: "W01", usable: blocks.summary.usable },
  };
}
export function samplingNote(sampling: Sampling, zero = false): string {
  if (zero) return sampling === "ADAPTIVE" ? "この集計では観測されず（推計）" : sampling === "UNKNOWN" ? "この集計では観測されず（集計方法未確認）" : "この集計では観測されず";
  return sampling === "ADAPTIVE" ? "サンプリングによる推計値" : sampling === "UNKNOWN" ? "集計方法未確認" : "この集計範囲の件数";
}
export function actionLabel(action: string): string {
  const labels: Record<string, string> = { block: "遮断", managed_challenge: "マネージドチャレンジ", js_challenge: "JSチャレンジ", log: "記録", allow: "許可", skip: "スキップ" };
  return Object.hasOwn(labels, action) ? labels[action] : "その他（処理種別未確認）";
}
```

## bearworks-portal/app/(non-monetized)/dashboard/components/CloudflareCollectionView.tsx

SHA-256: `b284c16d2f4f32b2f40b2a280337d718edda5839d818c490b1469ce23b2a1824`

```typescript
"use client";

import React from "react";
import Link from "@/components/InternalLink";
import { RefreshCw } from "lucide-react";
import { CloudflareActionDistribution, CloudflareEventTimeline } from "./CloudflareCollectionCharts";
import { BLOCK_KEYS, BLOCK_LABELS, actionLabel, assessCollection, samplingNote, timestamp, type Collection } from "../lib/cloudflareCollection";

const panel = "rounded-2xl border border-gray-200 bg-white p-5 shadow-soft";
const number = (n: number) => n.toLocaleString("ja-JP");
const dateLabel = (date: string | null) => date ? new Date(timestamp(date)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false }) + " JST" : "未確認";

export function CloudflareCollectionView({ collection, nowUpper, loading = false, refreshing = false, failed = false, onRefresh }: {
  collection: Collection; nowUpper: number | null; loading?: boolean; refreshing?: boolean; failed?: boolean; onRefresh?: () => void;
}) {
  const assessment = assessCollection(collection, nowUpper);
  const traffic = assessment.blocks.traffic24h.usable ? collection.traffic24h.data : null;
  const summary = assessment.blocks.summary.usable ? collection.summary.data : null;
  const pages = assessment.blocks.pagesMonth.usable ? collection.pagesMonth.data : null;
  const rules = assessment.blocks.topRules.usable ? collection.topRules.data : null;
  const paths = assessment.blocks.topPaths.usable ? collection.topPaths.data : null;
  const asns = assessment.blocks.topASNs.usable ? collection.topASNs.data : null;
  const timeline = assessment.blocks.timeline.usable ? collection.timeline.data : null;
  const note = (key: keyof Collection) => assessment.blocks[key].usable && <p className="text-xs mt-2">{assessment.blocks[key].state}{collection[key].status === "PARTIAL" ? "・今回の部分データを参考表示" : ""} · {samplingNote(collection[key].sampling)}</p>;
  const unavailable = (key: keyof Collection) => <p className="text-sm mt-3">{failed ? "APIから取得できなかったため、この項目の値は確認できません。" : `${assessment.blocks[key].state}：${assessment.blocks[key].reason}`}</p>;
  const actions = failed ? ["時間をおいて再読込する。続く場合は収集APIの応答と接続を確認する"] : assessment.actions;

  return <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/dashboard" className="text-sm text-muted underline">ダッシュボード</Link><h1 className="text-3xl font-bold mt-2">Cloudflare</h1></div><button onClick={onRefresh} disabled={refreshing} className="flex gap-2 items-center rounded-xl border px-4 py-2 bg-white disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "取得中" : "再読込"}</button></header>
    {loading && <p role="status">取得状態を確認中です。</p>}
    {failed && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">APIからデータを取得できませんでした。値は表示できません。時間をおいて再読込してください。</p>}
    <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
      <section className={panel}><h2 className="text-sm font-bold text-muted">データ状態</h2><p className="text-2xl font-bold my-2">{failed ? "取得失敗" : assessment.state}</p><p className="text-sm">取得項目の判定不能 {assessment.counts.unavailable} 件 / 対象 {assessment.counts.total} 件</p><p className="text-sm mt-2">取得成功は、サイトの安全や無停止を保証するものではありません。</p><a href="#collection-details" className="text-sm underline mt-2 block">欠けた項目・期間・取得状態を見る</a></section>
      <section className={panel}><h2 className="text-sm font-bold text-muted">セキュリティ・トラフィックの兆候</h2><p className="text-2xl font-bold my-2">危険度判定は次段階</p><p className="text-sm">判定不能 0 件 / 自動判定の対象 0 件</p><p className="text-sm mt-2">初回版では取得状態とWAFの処理結果を確認できます。危険度の自動判定は次の段階で対応します。</p><a href="#waf-facts" className="text-sm underline mt-2 block">確認できたWAFの事実を見る</a></section>
    </div>
    {actions.length > 0 && <section className={panel}><h2 className="font-bold">データ収集について必要な操作</h2><ul className="list-disc pl-5 text-sm space-y-2 mt-3">{actions.map(action => <li key={action}>{action}</li>)}</ul></section>}
    <section className={panel}><h2 className="text-xl font-bold">アクセス統計（24時間）</h2>{note("traffic24h")}{traffic ? <div className="grid gap-4 sm:grid-cols-3 mt-4">
      <div><p className="text-sm">総リクエスト</p><p className="text-2xl font-bold">{number(traffic.requests)} 回</p><p className="text-xs mt-2">{samplingNote(collection.traffic24h.sampling, traffic.requests === 0)}</p></div>
      <div><p className="text-sm">APIが報告した脅威イベント</p><p className="text-2xl font-bold">{number(traffic.threatEvents)} 件</p><p className="text-xs mt-2">{samplingNote(collection.traffic24h.sampling, traffic.threatEvents === 0)}。遮断成功・攻撃成功の件数とは断定できません。</p></div>
      <div><p className="text-sm">キャッシュ率</p><p className="text-2xl font-bold">{traffic.cacheRate === null ? "算出不能" : `${traffic.cacheRate}%`}</p><p className="text-xs mt-2">配信効率の参考値です。母数0の率は算出できません。</p></div>
    </div> : unavailable("traffic24h")}</section>
    <section id="waf-facts" className={panel}><h2 className="text-xl font-bold">WAFの処理結果（7日間）</h2>{note("summary")}<p className="text-sm mt-2">遮断はリクエストへの処理、チャレンジは確認要求、記録はログへの記録を表します。1つのリクエストに複数イベントが発生する場合があります。</p>{summary ? <><p className="mt-4 font-bold">総イベント {number(summary.totalEvents)} 件</p><p className="text-xs mt-1">{samplingNote(collection.summary.sampling, summary.totalEvents === 0)}</p><CloudflareActionDistribution data={summary} /><ul className="divide-y mt-3">{Object.entries(summary.actionCounts).map(([action, value]) => <li key={action} className="flex justify-between gap-3 py-2 text-sm"><span>{actionLabel(action)}</span><span>{number(value)} 件</span></li>)}</ul></> : unavailable("summary")}<a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-sm underline block mt-4">Cloudflareで対象ゾーンのSecurity Eventsを確認する</a></section>
    <div className="grid gap-4 md:grid-cols-2">
      <section className={panel}><h2 className="font-bold">上位ルール</h2>{note("topRules")}<p className="text-xs mt-2">取得した上位一覧です。全体件数の代わりには使いません。</p>{rules ? <ul className="divide-y mt-3">{rules.length === 0 && <li className="text-sm">{samplingNote(collection.topRules.sampling, true)}</li>}{rules.map((rule, i) => <li key={i} className="py-2 text-sm break-all">{rule.rule_id} · {actionLabel(rule.action)} · {number(rule.count)} 件</li>)}</ul> : unavailable("topRules")}</section>
      <section className={panel}><h2 className="font-bold">上位パス</h2>{note("topPaths")}<p className="text-xs mt-2">パスは要求先を表します。/wp-login.phpはWordPressのログイン用パスですが、この名前だけでBotや攻撃成功を特定できません。</p>{paths ? <ul className="divide-y mt-3">{paths.length === 0 && <li className="text-sm">{samplingNote(collection.topPaths.sampling, true)}</li>}{paths.map((path, i) => <li key={i} className="py-2 text-sm break-all">{path.path} · {actionLabel(path.action)} · {number(path.count)} 件</li>)}</ul> : unavailable("topPaths")}</section>
      <section className={panel}><h2 className="font-bold">上位ネットワーク（ASN）</h2>{note("topASNs")}<p className="text-xs mt-2">ASNはアクセス元のネットワーク番号です。組織・国の情報から、個人の身元や悪意は判断できません。</p>{asns ? <ul className="divide-y mt-3">{asns.length === 0 && <li className="text-sm">{samplingNote(collection.topASNs.sampling, true)}</li>}{asns.map((asn, i) => <li key={i} className="py-2 text-sm break-all">AS{asn.asn} · {asn.org} · {asn.country} · {number(asn.count)} 件</li>)}</ul> : unavailable("topASNs")}</section>
      <section className={panel}><h2 className="font-bold">WAF時系列</h2>{note("timeline")}{timeline ? <><CloudflareEventTimeline data={timeline} /><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-xs text-left"><caption className="text-left pb-2">確認できた時間別の処理件数</caption><thead><tr><th>時刻（JST）</th><th>処理</th><th>件数</th></tr></thead><tbody>{timeline.length === 0 && <tr><td colSpan={3}>{samplingNote(collection.timeline.sampling, true)}</td></tr>}{timeline.map((event, i) => <tr key={i} className="border-t"><td className="py-2">{dateLabel(event.hour)}</td><td>{actionLabel(event.action)}</td><td>{number(event.count)}</td></tr>)}</tbody></table></div></> : unavailable("timeline")}</section>
    </div>
    <section className={panel}><h2 className="text-xl font-bold">Pages当月デプロイ</h2>{note("pagesMonth")}{pages ? <p className="text-2xl font-bold my-3">{number(pages.deploymentCount)} 件 <span className="text-sm font-normal">（UTCの月初から取得時点まで）</span></p> : unavailable("pagesMonth")}<h3 className="font-bold mt-3">利用枠は未確認</h3><p className="text-sm mt-2">利用枠判定の判定不能 1 件 / 対象 1 件。集計対象、契約上のビルド数と上限、契約の月境界が未確認です。デプロイ件数から残量を計算できません。</p>{collection.pagesMonth.source === "MOCK" ? <p className="text-sm mt-2">デモ値には本番の利用枠判定や操作案内を適用しません。</p> : <p className="text-sm mt-2">必要な操作：CloudflareでPagesの対象と契約・ビルドの利用状況を確認する。</p>}</section>
    <section id="collection-details" className={panel}><h2 className="text-xl font-bold">取得状態・期間・対象範囲</h2><p className="text-xs mt-2">期限はサーバー時刻、通信往復時間と許容誤差を含む保守的な基準で確認します。表示の時刻はJST、Pagesの月次集計はUTCです。</p><div className="divide-y mt-3">{BLOCK_KEYS.map(key => { const block = collection[key]; const check = assessment.blocks[key]; return <article key={key} id={`collection-${key}`} className="py-4 space-y-2 text-sm"><h3 className="font-bold">{BLOCK_LABELS[key]}：{check.state}</h3><p>{check.reason}</p><dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-xs">
      <div><dt className="inline font-semibold">由来：</dt><dd className="inline">{block.source === "LIVE" ? "今回の実取得" : block.source === "MOCK" ? "デモ" : "未確認"}</dd></div><div><dt className="inline font-semibold">対象：</dt><dd className="inline break-all">{block.scope ? `${block.scope.kind === "ZONE" ? "ゾーン" : "アカウント"} / ${block.scope.label}` : "未確認"}</dd></div><div><dt className="inline font-semibold">取得範囲：</dt><dd className="inline">{({ FULL: "要求範囲の取得完了", TOP_N: "上位一覧のみ", INCOMPLETE: "一部未取得", POSSIBLY_TRUNCATED: "取得上限による欠落の可能性", UNKNOWN: "未確認" })[block.coverage]}</dd></div>
      <div><dt className="inline font-semibold">集計期間：</dt><dd className="inline">{dateLabel(block.windowStart)} ～ {dateLabel(block.windowEnd)}</dd></div><div><dt className="inline font-semibold">集計方法：</dt><dd className="inline">{samplingNote(block.sampling)}</dd></div><div><dt className="inline font-semibold">最後の取得試行：</dt><dd className="inline">{dateLabel(block.attemptedAt)}</dd></div><div><dt className="inline font-semibold">取得時刻：</dt><dd className="inline">{dateLabel(block.collectedAt)}</dd></div><div><dt className="inline font-semibold">更新期限：</dt><dd className="inline">{dateLabel(block.validUntil)}</dd></div>
    </dl>{check.action && !failed && <p>必要な操作：{check.action}</p>}</article>; })}</div></section>
    <footer><Link href="/dashboard/gcp" className="text-sm underline">GCPコスト分析を見る</Link></footer>
  </main>;
}
```

## bearworks-portal/app/(non-monetized)/dashboard/components/CloudflareCollectionCharts.tsx

SHA-256: `719fb7d8d7da333e8fd7eeaa6927cdae6aebb269646b3ec5932a12b158f17213`

```typescript
"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { actionLabel, timestamp, type SummaryData } from "../lib/cloudflareCollection";
import type { WAFHourlyEvent } from "../lib/dashboardUtils";

const colors = ["#dc2626", "#d97706", "#2563eb", "#059669", "#6b7280", "#7c3aed"];
const countLabel = (value: unknown) => typeof value === "number" ? `${value.toLocaleString("ja-JP")} 件` : "未確認";
const timeLabel = (value: unknown) => new Date(Number(value)).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

/** 検証済みのsummaryだけを受け取る。失敗時は親がこのグラフを描画しない。 */
export function CloudflareActionDistribution({ data }: { data: SummaryData }) {
  const groups = new Map<string, number>();
  for (const [action, count] of Object.entries(data.actionCounts)) {
    const name = actionLabel(action);
    groups.set(name, (groups.get(name) ?? 0) + count);
  }
  const values = [...groups].map(([name, value]) => ({ name, value }));
  if (data.totalEvents === 0) return <p className="text-xs mt-3">この集計ではイベントが観測されず、分布は表示できません。</p>;
  return <div className="h-64 mt-3" role="img" aria-label="取得したWAFイベントの処理種別分布。件数は下の一覧に記載しています。">
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
      <PieChart><Pie data={values} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
        {values.map((item, i) => <Cell key={item.name} fill={colors[i % colors.length]} />)}
      </Pie><Tooltip formatter={value => countLabel(value)} /></PieChart>
    </ResponsiveContainer>
  </div>;
}

/** 要求した時間の観測点だけを集計する。欠けた時間へ0を補わない。 */
export function CloudflareEventTimeline({ data }: { data: WAFHourlyEvent[] }) {
  if (data.length === 0) return <p className="text-xs mt-3">この集計ではイベントが観測されず、時系列グラフは表示できません。</p>;
  const groups = new Map<number, number>();
  for (const event of data) {
    const time = timestamp(event.hour)!;
    const value = (groups.get(time) ?? 0) + event.count;
    if (!Number.isSafeInteger(value)) return <p className="text-xs mt-3">グラフ用の合計が数値の範囲を超えています。下の取得値を確認してください。</p>;
    groups.set(time, value);
  }
  const values = [...groups].map(([time, count]) => ({ time, count })).sort((a, b) => a.time - b.time);
  return <div className="h-64 mt-3" role="img" aria-label="取得した時間別WAFイベント件数。欠けた時間に0件は補っていません。件数は下の一覧に記載しています。">
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
      <AreaChart data={values} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={timeLabel} minTickGap={40} />
        <YAxis allowDecimals={false} width={45} />
        <Tooltip formatter={value => countLabel(value)} labelFormatter={timeLabel} />
        <Area dataKey="count" name="取得した処理イベント" stroke="#2563eb" fill="#dbeafe" type="linear" />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
```

## bearworks-portal/scripts/cloudflare-collection.test.mjs

SHA-256: `dd0720723afae3901e41afc4ab9925110ce9b7c62b78412430531832d88dab22`

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCK_KEYS, parseCollection, assessCollection, assessBlock, timestamp, syncClock, clockUpperBound, samplingNote, actionLabel } from "../app/(non-monetized)/dashboard/lib/cloudflareCollection.ts";

const require = createRequire(import.meta.url);
const fixtureBytes = await readFile(new URL("./fixtures/cloudflare-collection-v1.json", import.meta.url));
const fixture = JSON.parse(fixtureBytes);
const manifest = JSON.parse(await readFile(new URL("./fixtures/cloudflare-collection-manifest.json", import.meta.url)));
const NOW = Date.parse("2026-10-06T00:00:00Z");
const UNTIL = Date.parse("2026-10-06T03:00:00Z");
const clone = () => structuredClone(fixture);
const parsed = root => parseCollection({ cloudflareCollection: root });
const block = (root, key) => ["traffic24h", "pagesMonth"].includes(key) ? root[key] : root.waf7d[key];
const meta = { servedAt: "2026-10-06T00:00:00Z", clockMaxUncertaintySeconds: 5, clockResyncIntervalSeconds: 30 };

async function compile(path) {
  const result = await build({ entryPoints: [path], bundle: true, platform: "node", format: "cjs", packages: "external", write: false, logLevel: "silent" });
  return result.outputFiles[0].text;
}
function load(code, resolver = require) {
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(resolver, loaded, loaded.exports);
  return loaded.exports;
}
const route = load(await compile("app/api/dashboard-data/route.ts"));
const view = load(await compile("app/(non-monetized)/dashboard/components/CloudflareCollectionView.tsx")).CloudflareCollectionView;
const pageCode = await compile("app/(non-monetized)/dashboard/cloudflare/page.tsx");
const html = (root, now = NOW, extra = {}) => renderToStaticMarkup(React.createElement(view, { collection: parsed(root), nowUpper: now, ...extra }));

test("shared fixture hash and independently specified expectations", () => {
  assert.equal(createHash("sha256").update(fixtureBytes).digest("hex"), manifest.files["cloudflare-collection-v1.json"]);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.evaluationTime, "2026-10-06T00:00:00Z");
  const result = assessCollection(parsed(fixture), NOW);
  assert.equal(result.state, "取得正常");
  assert.equal(result.counts.unavailable, 0);
  assert.equal(parsed(fixture).traffic24h.data.threatEvents, 4);
  assert.equal(parsed(fixture).pagesMonth.data.usagePercent, null);
  assert.equal(result.signals.state, "判定ルール未設定");
  assert.equal(result.signals.configured, 0);
  assert.equal(result.signals.domain, "SIGNALS");
  assert.equal(result.blocks.summary.domain, "COLLECTION");
  assert.equal(result.wafFacts.domain, "FACT");
  assert.equal(result.pagesQuota.ruleId, "P01");
  assert.match(html(fixture), /利用枠は未確認/);
});

test("legacy, unknown version, root runId and malformed input never reuse old numeric values", () => {
  for (const input of [null, [], { summary: { cloudflareTotalThreats24h: 99999 }, wafDetails: { total_events: 88888 } }, { cloudflareCollection: { ...fixture, schemaVersion: 2 } }, { cloudflareCollection: { ...fixture, runId: " " } }]) {
    const result = parseCollection(input);
    for (const key of BLOCK_KEYS) assert.equal(result[key].data, null);
    assert.equal(assessCollection(result, NOW).state, "未確認");
  }
});

test("unknown enum, run mismatch and illegal combinations are block-local UNKNOWN", () => {
  const cases = [{ runId: "previous-run" }, { source: "NEW_SOURCE" }, { status: "NEW_STATUS" }, { coverage: "NEW_COVERAGE" }, { sampling: "NEW_SAMPLING" }, { errorCode: "untrusted error text" }, { source: "MOCK" }, { status: "PARTIAL", coverage: "FULL", errorCode: "PARTIAL_RESPONSE" }, { coverage: "TOP_N" }, { scope: { kind: "ACCOUNT", label: "incorrect scope" } }];
  for (const mutation of cases) {
    const root = clone(); Object.assign(root.traffic24h, mutation);
    const result = parsed(root);
    assert.equal(result.traffic24h.status, "UNKNOWN", JSON.stringify(mutation));
    assert.equal(result.traffic24h.data, null);
    assert.equal(result.summary.status, "OK");
    assert.doesNotMatch(html(root), /untrusted error text/);
  }
});

test("LIVE error and UNKNOWN combinations validate; failures cannot carry old values", () => {
  for (const source of ["LIVE", "UNKNOWN"]) for (const errorCode of ["TIMEOUT", "ACCESS_DENIED", "UPSTREAM_ERROR", "INVALID_RESPONSE", "MISSING_CONFIG", "UNKNOWN_ERROR"]) {
    const root = clone(); Object.assign(root.traffic24h, { source, status: "ERROR", coverage: "UNKNOWN", errorCode, data: null, collectedAt: null, validUntil: null });
    const result = parsed(root);
    assert.equal(result.traffic24h.invalid, false);
    assert.equal(assessBlock(result.traffic24h, null).state, "取得失敗");
    assert.equal(assessBlock(result.traffic24h, null).usable, false);
    root.traffic24h.data = fixture.traffic24h.data;
    assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); Object.assign(root.traffic24h, { source: "UNKNOWN", status: "UNKNOWN", coverage: "UNKNOWN", errorCode: null, data: null, collectedAt: null, validUntil: null });
  assert.equal(parsed(root).traffic24h.invalid, false);
});

test("optional failure keeps valid summary, counts the missing detail and gives collection action", () => {
  const root = clone(); Object.assign(root.waf7d.topPaths, { status: "ERROR", coverage: "UNKNOWN", errorCode: "ACCESS_DENIED", data: null, collectedAt: null, validUntil: null });
  const result = assessCollection(parsed(root), NOW);
  assert.equal(result.blocks.summary.usable, true);
  assert.equal(result.blocks.topPaths.usable, false);
  assert.equal(result.state, "一部未取得");
  assert.equal(result.counts.unavailable, 1);
  assert.match(result.actions[0], /設定とアクセス条件/);
  const output = html(root);
  assert.match(output, /総イベント 15 件/);
  assert.doesNotMatch(output, /\/wp-login.php ·/);
  assert.match(output, /最後の取得試行/);
  assert.doesNotMatch(output, /継続失敗|攻撃への対応/);
});

test("PARTIAL with verified data is reference-only, null remains unavailable", () => {
  for (const coverage of ["INCOMPLETE", "POSSIBLY_TRUNCATED"]) for (const errorCode of ["PARTIAL_RESPONSE", "RESULT_LIMIT"]) {
    const root = clone(); Object.assign(root.waf7d.topPaths, { status: "PARTIAL", coverage, errorCode });
    let item = parsed(root).topPaths;
    assert.equal(item.invalid, false);
    assert.equal(assessBlock(item, NOW).state, "一部未取得");
    assert.equal(assessBlock(item, NOW).usable, true);
    Object.assign(root.waf7d.topPaths, { data: null, collectedAt: null, validUntil: null }); item = parsed(root).topPaths;
    assert.equal(item.invalid, false);
    assert.equal(assessBlock(item, null).state, "一部未取得");
    assert.equal(assessBlock(item, NOW).usable, false);
  }
});

test("MOCK plus DEMO is explicitly demo, never produces production actions or signal health", () => {
  const root = clone(); for (const key of BLOCK_KEYS) Object.assign(block(root, key), { source: "MOCK", status: "DEMO", validUntil: null });
  const result = assessCollection(parsed(root), null);
  assert.equal(result.state, "デモ");
  assert.deepEqual(result.actions, []);
  assert.equal(result.signals.state, "判定ルール未設定");
  const output = html(root, null);
  assert.match(output, /本番の状態を表しません/);
  assert.doesNotMatch(output, /必要な操作：Cloudflare/);
});

test("zero events, empty arrays, sampling and zero-denominator cache rate stay distinct from null", () => {
  const root = clone(); root.traffic24h.data = { requests: 0, threatEvents: 0, cachedRequests: 0, cacheRate: null }; root.waf7d.summary.data = { actionCounts: {}, totalEvents: 0 };
  assert.equal(assessCollection(parsed(root), NOW).state, "取得正常");
  const output = html(root);
  assert.match(output, /算出不能/); assert.match(output, /この集計では観測されず（推計）/); assert.match(output, /この集計では観測されず（集計方法未確認）/);
  assert.doesNotMatch(output, /攻撃0件|攻撃ゼロ|平常|正常稼働中/);
  assert.equal(samplingNote("NONE", true), "この集計では観測されず");
  root.waf7d.topRules.data = null;
  assert.equal(parsed(root).topRules.status, "UNKNOWN");
});

test("invalid numbers and missing fields are not coerced into zero", () => {
  for (const mutation of [{ requests: -1 }, { requests: NaN }, { requests: Infinity }, { requests: "100" }, { cachedRequests: 101 }, { cacheRate: 101 }, { cacheRate: 60.12 }, { cacheRate: null }, { requests: 0, cachedRequests: 0, cacheRate: 0 }, { threatEvents: undefined }]) {
    const root = clone(); Object.assign(root.traffic24h.data, mutation);
    assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); root.waf7d.summary.data.actionCounts.block = -1;
  assert.equal(parsed(root).summary.status, "UNKNOWN");
  root.pagesMonth.data.usagePercent = 0;
  assert.equal(parsed(root).pagesMonth.status, "UNKNOWN");
  const rounded = clone(); rounded.traffic24h.data.cacheRate = 60.1;
  assert.equal(parsed(rounded).traffic24h.status, "OK");
  for (const field of ["org", "country"]) {
    const invalidASN = clone(); invalidASN.waf7d.topASNs.data = [{ asn: 64500, org: "Synthetic", country: "ZZ", count: 1, [field]: "" }];
    assert.equal(parsed(invalidASN).topASNs.status, "UNKNOWN");
  }
});

test("timestamps, ordering, missing deadlines and exact expiry boundaries", () => {
  const item = parsed(fixture).traffic24h;
  assert.equal(assessBlock(item, UNTIL - 1).state, "取得正常");
  assert.equal(assessBlock(item, UNTIL).state, "期限切れ");
  assert.equal(assessBlock(item, UNTIL + 1).usable, false);
  assert.equal(assessBlock(item, null).state, "未確認");
  for (const mutation of [{ windowStart: "2026-10-07T00:00:00Z" }, { windowEnd: "2026-10-07T00:00:00Z" }, { validUntil: "2026-10-05T23:59:59Z" }, { collectedAt: "2026-02-30T00:00:00Z" }, { collectedAt: "2026-10-06 00:00:00" }, { attemptedAt: "2026-10-06T00:01:00Z" }]) {
    const root = clone(); Object.assign(root.traffic24h, mutation); assert.equal(parsed(root).traffic24h.status, "UNKNOWN");
  }
  const root = clone(); root.traffic24h.validUntil = null;
  assert.equal(assessBlock(parsed(root).traffic24h, NOW).state, "未確認");
  assert.equal(timestamp("2026-10-06T09:00:00+09:00"), NOW);
  assert.equal(timestamp("2026-10-06T00:00:00.123456+00:00"), NOW + 123);
  assert.equal(timestamp("2026-10-06T00:00:00.1Z"), NOW + 100);
  const microseconds = clone();
  for (const key of BLOCK_KEYS) for (const field of ["attemptedAt", "collectedAt", "windowStart", "windowEnd", "validUntil"]) {
    if (key === "pagesMonth" && field === "windowStart") continue;
    block(microseconds, key)[field] = block(microseconds, key)[field].replace("Z", ".123456+00:00");
  }
  assert.equal(assessCollection(parsed(microseconds), NOW + 124).state, "取得正常");
});

test("fixed traffic/WAF periods, UTC Pages month and maximum freshness are contract conditions", () => {
  for (const [key, field, value] of [
    ["traffic24h", "windowStart", "2026-10-05T01:00:00Z"],
    ["traffic24h", "attemptedAt", "2026-10-05T23:59:59Z"],
    ["summary", "windowStart", "2026-09-30T00:00:00Z"],
    ["topPaths", "windowStart", "2026-09-28T00:00:00Z"],
    ["pagesMonth", "windowStart", "2026-10-02T00:00:00Z"],
    ["pagesMonth", "windowStart", "2026-10-01T00:00:00.001Z"],
    ["traffic24h", "validUntil", "2026-10-07T00:00:00.001Z"],
  ]) {
    const root = clone(); block(root, key)[field] = value;
    assert.equal(parsed(root)[key].status, "UNKNOWN", `${key}:${field}`);
  }
  const max = clone(); max.traffic24h.validUntil = "2026-10-07T00:00:00Z";
  assert.equal(parsed(max).traffic24h.status, "OK");
  const partial = clone(); Object.assign(partial.waf7d.topPaths, { status: "PARTIAL", coverage: "INCOMPLETE", errorCode: "PARTIAL_RESPONSE", windowStart: "2026-09-30T00:00:00Z" });
  assert.equal(parsed(partial).topPaths.status, "UNKNOWN");
});

test("unknown actions preserve count under Other, scope identifiers are not exposed", () => {
  const root = clone(); root.waf7d.summary.data = { actionCounts: { brand_new_action: 9 }, totalEvents: 9 };
  root.traffic24h.scope.id = "do-not-display-zone-id";
  assert.equal(parsed(root).summary.data.totalEvents, 9);
  assert.equal(actionLabel("brand_new_action"), "その他（処理種別未確認）");
  const output = html(root);
  assert.match(output, /その他（処理種別未確認）/);
  assert.doesNotMatch(output, /brand_new_action|do-not-display-zone-id/);
});

test("graphs use valid summary and timeline independently; missing blocks never become zero graphs", () => {
  const root = clone(); root.waf7d.timeline.data = [{ hour: "2026-10-05T00:00:00Z", action: "block", count: 2 }];
  let output = html(root);
  assert.match(output, /処理種別分布。件数は下の一覧/);
  assert.match(output, /時間別WAFイベント件数/);
  Object.assign(root.waf7d.summary, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  output = html(root);
  assert.doesNotMatch(output, /処理種別分布。件数は下の一覧/);
  assert.match(output, /時間別WAFイベント件数/);
  Object.assign(root.waf7d.timeline, { status: "PARTIAL", coverage: "INCOMPLETE", errorCode: "PARTIAL_RESPONSE" });
  output = html(root); assert.match(output, /今回の部分データを参考表示/);
  Object.assign(root.waf7d.timeline, { status: "ERROR", coverage: "UNKNOWN", errorCode: "TIMEOUT", data: null, collectedAt: null, validUntil: null });
  output = html(root); assert.doesNotMatch(output, /時間別WAFイベント件数|時系列グラフは表示できません/);
});

test("transport failure recommends retry instead of inventing a malformed collector result", () => {
  const output = html(null, null, { failed: true });
  assert.match(output, /収集APIの応答と接続を確認する/);
  assert.doesNotMatch(output, /必要な操作：収集処理の出力形式を確認する/);
  assert.match(output, /危険度判定は次段階/);
});

test("monotonic clock includes RTT and uncertainty, expires at resync and ignores wall clock", () => {
  const anchor = syncClock(meta, 100, 300, null);
  assert.equal(clockUpperBound(anchor, 300), NOW + 5200);
  assert.equal(clockUpperBound(anchor, 1300), NOW + 6200);
  assert.equal(clockUpperBound(anchor, 30300), null);
  assert.equal(clockUpperBound(anchor, 299), null);
  const original = Date.now;
  try {
    for (const wall of [0, NOW - 86400000, NOW + 86400000]) { Date.now = () => wall; assert.equal(clockUpperBound(anchor, 1300), NOW + 6200); }
  } finally { Date.now = original; }
  const nearExpiry = syncClock({ ...meta, servedAt: "2026-10-06T02:59:55Z" }, 0, 100, null);
  assert.equal(assessBlock(parsed(fixture).traffic24h, clockUpperBound(nearExpiry, 100)).state, "期限切れ");
});

test("clock rejects missing config, excessive latency and contradictory resync", () => {
  for (const bad of [null, {}, { ...meta, servedAt: fixture.traffic24h.windowStart }, { ...meta, clockMaxUncertaintySeconds: null }, { ...meta, clockMaxUncertaintySeconds: 0 }, { ...meta, clockResyncIntervalSeconds: -1 }, { ...meta, clockResyncIntervalSeconds: "30" }]) {
    const previous = bad?.servedAt === fixture.traffic24h.windowStart ? syncClock(meta, 0, 100, null) : null;
    assert.equal(syncClock(bad, 200, 300, previous), null);
  }
  assert.equal(syncClock(meta, 0, 5001, null), null);
  assert.equal(syncClock(meta, 100, 90, null), null);
  const previous = syncClock(meta, 0, 100, null);
  assert.ok(syncClock({ ...meta, servedAt: "2026-10-06T00:00:10Z" }, 10000, 10100, previous));
  assert.equal(syncClock({ ...meta, servedAt: "2026-10-06T00:10:00Z" }, 10000, 10100, previous), null);
});

test("API auth/config, successful servedAt, no-store and all explicit method rejections", async t => {
  const names = ["DASHBOARD_API_TOKEN", "DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS", "DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS"];
  const saved = Object.fromEntries(names.map(n => [n, process.env[n]])); const oldFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = oldFetch; for (const n of names) saved[n] === undefined ? delete process.env[n] : process.env[n] = saved[n]; });
  let calls = 0;
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.cache, "no-store"); assert.equal(options.headers["X-Dashboard-Token"], "synthetic-only-token"); assert.ok(options.signal); return Response.json({ cloudflareCollection: fixture, responseMeta: { servedAt: "1999-01-01T00:00:00Z" } }); };
  const authenticated = new Request("https://example.test/api/dashboard-data", { headers: { "cf-access-jwt-assertion": "synthetic-assertion" } });
  const noStore = response => { assert.match(response.headers.get("cache-control"), /no-store/); assert.equal(response.headers.get("pragma"), "no-cache"); assert.equal(response.headers.get("expires"), "0"); };
  delete process.env.DASHBOARD_API_TOKEN;
  let response = await route.GET(authenticated); assert.equal(response.status, 500); noStore(response); assert.equal(calls, 0);
  process.env.DASHBOARD_API_TOKEN = "synthetic-only-token";
  response = await route.GET(new Request(authenticated.url)); assert.equal(response.status, 401); noStore(response); assert.equal(calls, 0);
  process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS = "5"; process.env.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS = "30";
  const before = Date.now(); response = await route.GET(authenticated); const after = Date.now(); noStore(response); assert.equal(response.status, 200);
  const body = await response.json(); assert.ok(timestamp(body.responseMeta.servedAt) >= before && timestamp(body.responseMeta.servedAt) <= after); assert.match(body.responseMeta.servedAt, /Z$/); assert.equal(body.responseMeta.clockMaxUncertaintySeconds, 5); assert.equal(body.responseMeta.clockResyncIntervalSeconds, 30); assert.deepEqual(body.cloudflareCollection, fixture);
  for (const value of [undefined, "0", "-1", "1.5", "01", "NaN", "9007199254740991"]) {
    if (value === undefined) delete process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS; else process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS = value;
    const body = await (await route.GET(authenticated)).json(); assert.equal(body.responseMeta.clockMaxUncertaintySeconds, null);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) { response = await route[method](); assert.equal(response.status, 405); noStore(response); }
  for (const upstream of [() => Response.json({}, { status: 403 }), () => Response.json(null), () => new Response("invalid JSON"), () => { throw new Error("synthetic private exception"); }]) {
    globalThis.fetch = async () => upstream(); response = await route.GET(authenticated); assert.equal(response.status, 500); noStore(response); const text = await response.text(); assert.doesNotMatch(text, /responseMeta|cloudflareCollection|private exception/);
  }
});

test("page refetches on visibility/pageshow/resume and periodic sync; fetch failure clears data", async t => {
  const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch, performance: globalThis.performance };
  t.after(() => { for (const [key, value] of Object.entries(originals)) value === undefined ? delete globalThis[key] : globalThis[key] = value; });
  const states = []; const effects = []; const timers = []; let stateIndex = 0; let mono = 0; let calls = 0; let error = false;
  const listeners = () => { const map = new Map(); return { map, addEventListener: (n, cb) => map.set(n, cb), removeEventListener: n => map.delete(n) }; };
  globalThis.window = { ...listeners(), setInterval: cb => (timers.push(cb), timers.length), clearInterval: () => {} };
  globalThis.document = { ...listeners(), visibilityState: "visible" };
  globalThis.performance = { now: () => mono };
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.cache, "no-store"); if (error) throw new Error("failed"); mono += 100; return Response.json({ cloudflareCollection: fixture, responseMeta: { ...meta, servedAt: new Date(NOW + mono).toISOString() } }); };
  const hooks = { ...React, useState: initial => { const index = stateIndex++; states[index] = typeof initial === "function" ? initial() : initial; return [states[index], next => { states[index] = next; }]; }, useRef: current => ({ current }), useCallback: cb => cb, useEffect: cb => effects.push(cb) };
  const page = load(pageCode, name => name === "react" ? hooks : require(name));
  page.default(); const cleanup = effects[0](); const flush = () => new Promise(resolve => setImmediate(resolve)); await flush();
  assert.equal(calls, 1); assert.ok(states[1]); assert.equal(states[0].traffic24h.status, "OK");
  globalThis.document.visibilityState = "hidden"; globalThis.document.map.get("visibilitychange")(); assert.equal(states[1], null);
  globalThis.document.visibilityState = "visible"; globalThis.document.map.get("visibilitychange")(); await flush(); assert.equal(calls, 2);
  globalThis.window.map.get("pageshow")(); assert.equal(states[1], null); await flush(); assert.equal(calls, 3);
  globalThis.document.map.get("resume")(); await flush(); assert.equal(calls, 4);
  for (let i = 0; i < 30; i++) { mono += 1000; timers[0](); await flush(); }
  assert.equal(calls, 5);
  mono += 5000; timers[0](); assert.equal(states[1], null); await flush(); assert.equal(calls, 6);
  error = true; globalThis.window.map.get("focus")(); await flush(); assert.equal(states[0].traffic24h.data, null); assert.equal(states[1], null); assert.equal(states[5], true);
  cleanup(); assert.equal(globalThis.document.map.size, 0); assert.equal(globalThis.window.map.size, 0);
});
```

## bearworks-portal/scripts/fixtures/cloudflare-collection-v1.json

SHA-256: `3757f22e8bd84d3c5dedcbb814d1b8c871956d198bc86463b3f410d6cc695b14`

```json
{
  "schemaVersion": 1,
  "runId": "fixture-run-397",
  "traffic24h": {
    "runId": "fixture-run-397",
    "data": {
      "requests": 100,
      "threatEvents": 4,
      "cachedRequests": 60,
      "cacheRate": 60
    },
    "source": "LIVE",
    "status": "OK",
    "errorCode": null,
    "coverage": "FULL",
    "sampling": "UNKNOWN",
    "attemptedAt": "2026-10-06T00:00:00Z",
    "collectedAt": "2026-10-06T00:00:00Z",
    "windowStart": "2026-10-05T00:00:00Z",
    "windowEnd": "2026-10-06T00:00:00Z",
    "validUntil": "2026-10-06T03:00:00Z",
    "scope": {
      "kind": "ZONE",
      "label": "合成テスト対象"
    }
  },
  "pagesMonth": {
    "runId": "fixture-run-397",
    "data": {
      "deploymentCount": 0,
      "buildCount": null,
      "limitBuilds": null,
      "usagePercent": null,
      "scopeConfirmed": false,
      "aggregationTimezone": "UTC"
    },
    "source": "LIVE",
    "status": "OK",
    "errorCode": null,
    "coverage": "FULL",
    "sampling": "UNKNOWN",
    "attemptedAt": "2026-10-06T00:00:00Z",
    "collectedAt": "2026-10-06T00:00:00Z",
    "windowStart": "2026-10-01T00:00:00Z",
    "windowEnd": "2026-10-06T00:00:00Z",
    "validUntil": "2026-10-06T03:00:00Z",
    "scope": {
      "kind": "ACCOUNT",
      "label": "合成テスト対象"
    }
  },
  "waf7d": {
    "summary": {
      "runId": "fixture-run-397",
      "data": {
        "actionCounts": {
          "block": 10,
          "managed_challenge": 2,
          "log": 3
        },
        "totalEvents": 15
      },
      "source": "LIVE",
      "status": "OK",
      "errorCode": null,
      "coverage": "FULL",
      "sampling": "ADAPTIVE",
      "attemptedAt": "2026-10-06T00:00:00Z",
      "collectedAt": "2026-10-06T00:00:00Z",
      "windowStart": "2026-09-29T00:00:00Z",
      "windowEnd": "2026-10-06T00:00:00Z",
      "validUntil": "2026-10-06T03:00:00Z",
      "scope": {
        "kind": "ZONE",
        "label": "合成テスト対象"
      }
    },
    "topRules": {
      "runId": "fixture-run-397",
      "data": [],
      "source": "LIVE",
      "status": "OK",
      "errorCode": null,
      "coverage": "TOP_N",
      "sampling": "ADAPTIVE",
      "attemptedAt": "2026-10-06T00:00:00Z",
      "collectedAt": "2026-10-06T00:00:00Z",
      "windowStart": "2026-09-29T00:00:00Z",
      "windowEnd": "2026-10-06T00:00:00Z",
      "validUntil": "2026-10-06T03:00:00Z",
      "scope": {
        "kind": "ZONE",
        "label": "合成テスト対象"
      }
    },
    "topPaths": {
      "runId": "fixture-run-397",
      "data": [
        {
          "path": "/wp-login.php",
          "action": "block",
          "count": 10
        }
      ],
      "source": "LIVE",
      "status": "OK",
      "errorCode": null,
      "coverage": "TOP_N",
      "sampling": "ADAPTIVE",
      "attemptedAt": "2026-10-06T00:00:00Z",
      "collectedAt": "2026-10-06T00:00:00Z",
      "windowStart": "2026-09-29T00:00:00Z",
      "windowEnd": "2026-10-06T00:00:00Z",
      "validUntil": "2026-10-06T03:00:00Z",
      "scope": {
        "kind": "ZONE",
        "label": "合成テスト対象"
      }
    },
    "topASNs": {
      "runId": "fixture-run-397",
      "data": [],
      "source": "LIVE",
      "status": "OK",
      "errorCode": null,
      "coverage": "TOP_N",
      "sampling": "ADAPTIVE",
      "attemptedAt": "2026-10-06T00:00:00Z",
      "collectedAt": "2026-10-06T00:00:00Z",
      "windowStart": "2026-09-29T00:00:00Z",
      "windowEnd": "2026-10-06T00:00:00Z",
      "validUntil": "2026-10-06T03:00:00Z",
      "scope": {
        "kind": "ZONE",
        "label": "合成テスト対象"
      }
    },
    "timeline": {
      "runId": "fixture-run-397",
      "data": [],
      "source": "LIVE",
      "status": "OK",
      "errorCode": null,
      "coverage": "FULL",
      "sampling": "ADAPTIVE",
      "attemptedAt": "2026-10-06T00:00:00Z",
      "collectedAt": "2026-10-06T00:00:00Z",
      "windowStart": "2026-09-29T00:00:00Z",
      "windowEnd": "2026-10-06T00:00:00Z",
      "validUntil": "2026-10-06T03:00:00Z",
      "scope": {
        "kind": "ZONE",
        "label": "合成テスト対象"
      }
    }
  }
}
```

## bearworks-portal/scripts/fixtures/cloudflare-collection-manifest.json

SHA-256: `f81f6970045902367565215409d8ff76b300e1c6f2b7473104e3bacaa48f2bec`

```json
{
  "schemaVersion": 1,
  "generatorRevision": "issue397-fixtures-v1",
  "files": {
    "cloudflare-collection-v1.json": "3757f22e8bd84d3c5dedcbb814d1b8c871956d198bc86463b3f410d6cc695b14"
  },
  "evaluationTime": "2026-10-06T00:00:00Z",
  "expectedTrafficThreatEvents": 4,
  "expectedPagesQuota": "UNAVAILABLE",
  "synthetic": true
}
```

## bearworks-apps 既存コードの対象差分

```diff
diff --git a/dashboard/ai_operations/collect_metrics.py b/dashboard/ai_operations/collect_metrics.py
index 9e0eb57..9cecf65 100644
--- a/dashboard/ai_operations/collect_metrics.py
+++ b/dashboard/ai_operations/collect_metrics.py
@@ -12,6 +12,7 @@ from pathlib import Path
 
 from ai_operations.config import DigestSettings
 from ai_operations.schemas import MetricsSnapshot, ServiceStatus, DashboardSnapshot
+from cloudflare_contract import usable_data
 
 logger = logging.getLogger(__name__)
 
@@ -209,7 +210,12 @@ def extract_dashboard_snapshot(settings: DigestSettings) -> Tuple[bool, Optional
             return False, None, "DASHBOARD_DATA_UNAVAILABLE"
 
         google_error_rate = summary.get("googleErrorRate24h")
-        cf_threats = summary.get("cloudflareTotalThreats24h")
+        collection = data.get("cloudflareCollection")
+        cf_now = datetime.now(timezone.utc)
+        traffic = usable_data(collection, "traffic24h", cf_now)
+        pages = usable_data(collection, "pagesMonth", cf_now)
+        cf_threats = traffic["threatEvents"] if traffic is not None else None
+        cf_available = traffic is not None and pages is not None
 
         google_billing = summary.get("googleBilling", {})
         if not isinstance(google_billing, dict):
@@ -222,10 +228,7 @@ def extract_dashboard_snapshot(settings: DigestSettings) -> Tuple[bool, Optional
         bq_query_percent = bq_usage.get("usageQueryPercent")
         bq_storage_percent = bq_usage.get("usageStoragePercent")
 
-        cf_pages = summary.get("cloudflarePages", {})
-        if not isinstance(cf_pages, dict):
-            return False, None, "DASHBOARD_DATA_UNAVAILABLE"
-        pages_percent = cf_pages.get("usagePercent")
+        pages_percent = pages.get("usagePercent") if pages is not None and pages.get("scopeConfirmed") is True else None
 
         snapshot = DashboardSnapshot(
             updated_at=updated_at,
@@ -236,7 +239,7 @@ def extract_dashboard_snapshot(settings: DigestSettings) -> Tuple[bool, Optional
             bigquery_storage_percent=bq_storage_percent,
             cloudflare_pages_percent=pages_percent
         )
-        return True, snapshot, None
+        return True, snapshot, None if cf_available else "CLOUDFLARE_DATA_UNAVAILABLE"
 
     except (json.JSONDecodeError, OSError) as e:
         logger.error(f"Failed to read/parse dashboard data: {e}")
diff --git a/dashboard/ai_operations/generate_digest.py b/dashboard/ai_operations/generate_digest.py
index bf8dde3..a5ecfdb 100644
--- a/dashboard/ai_operations/generate_digest.py
+++ b/dashboard/ai_operations/generate_digest.py
@@ -78,6 +78,24 @@ def build_deterministic_fallback(
 
     return summary, actions
 
+def cloudflare_scope_actions(anomalies: List[Anomaly]) -> List[str]:
+    """Only deterministic server recommendations while CF scope is unevaluated."""
+    actions = ["Cloudflareダッシュボードの取得状態と確認範囲を確認してください。"]
+    mapping = {
+        "HIGH_CPU": "CPU負荷の高いプロセスを確認してください。",
+        "HIGH_MEMORY": "メモリ使用状況を確認してください。",
+        "LOW_DISK": "ディスクの空き容量を確認してください。",
+        "SERVICE_INACTIVE": "停止している監視対象サービスを確認してください。",
+        "OLLAMA_UNREACHABLE": "ローカルのAI要約サービスの稼働状態を確認してください。",
+        "DASHBOARD_DATA_STALE": "ダッシュボード収集処理の更新状況を確認してください。",
+    }
+    for anomaly in anomalies:
+        action = mapping.get(anomaly.code, "警告・異常の詳細と運用手順を確認してください。")
+        if action not in actions:
+            actions.append(action)
+    return actions
+
+
 def run_digest_cycle(settings: DigestSettings) -> None:
     """Operations Digest の収集・判定・生成・永続化の 1 サイクルを実行する。"""
     start_time = time.perf_counter()
@@ -132,13 +150,14 @@ def run_digest_cycle(settings: DigestSettings) -> None:
         if db_ok:
             dashboard_snap = db_snap
             dashboard_success = True
-        else:
-            if db_err:
-                collector_errors.append(db_err)
+        if db_err:
+            collector_errors.append(db_err)
     except Exception as e:
         logger.error(f"Unexpected error extracting dashboard data: {e}")
         collector_errors.append("DASHBOARD_DATA_UNAVAILABLE")
 
+    cf_unavailable = not dashboard_success or dashboard_snap is None or "CLOUDFLARE_DATA_UNAVAILABLE" in collector_errors
+
     # 中核収集が失敗した場合はフォールバック
     if not core_success:
         last_success = load_last_success(settings)
@@ -147,8 +166,15 @@ def run_digest_cycle(settings: DigestSettings) -> None:
             last_success.stale = True
             # エラーを追加
             # 秘密情報を排除したエラー
-            last_success.errors = list(set(last_success.errors + ["CORE_METRICS_COLLECTION_FAILED"]))
+            last_success.errors = list(set(last_success.errors + collector_errors + ["CORE_METRICS_COLLECTION_FAILED"]))
             last_success.generated_at = now_str
+            if cf_unavailable:
+                last_success.errors = list(set(last_success.errors + ["CLOUDFLARE_DATA_UNAVAILABLE"]))
+                if last_success.dashboard_snapshot is not None:
+                    last_success.dashboard_snapshot.cloudflare_total_threats_24h = None
+                    last_success.dashboard_snapshot.cloudflare_pages_percent = None
+                last_success.summary = "基本メトリクスの取得に失敗したため前回の確認結果を表示しています。Cloudflareの未取得・未確認項目があります。"
+                last_success.recommended_actions = cloudflare_scope_actions(last_success.anomalies)
             atomic_write_json(settings.public_status_path, last_success)
             logger.warning("Core collection failed. Fallback to previous success state.")
             return
@@ -175,6 +201,10 @@ def run_digest_cycle(settings: DigestSettings) -> None:
         f"ディスク使用: {metrics_snap.disk_percent}%"
     )
 
+    cf_scope_unevaluated = cf_unavailable or dashboard_snap is not None and dashboard_snap.cloudflare_pages_percent is None
+    if cf_scope_unevaluated:
+        metrics_summary += "。Cloudflareは未取得・未確認の項目があり、正常・安全の判定対象に含めないでください。"
+
     # LLM 要約リクエスト (プロバイダ透過呼び出し)
     llm_ok, llm_resp, llm_meta, err_code = get_llm_digest(
         settings, anomalies, metrics_summary, llm_meta_base
@@ -200,6 +230,13 @@ def run_digest_cycle(settings: DigestSettings) -> None:
             anomalies, err_code or "LLM_FAILED", settings
         )
 
+    if cf_scope_unevaluated:
+        # An authoritative scope statement: free-form model prose cannot assert CF safety.
+        summary = ("Cloudflareの未取得・未確認項目があります。" if cf_unavailable else "Cloudflareの利用枠と危険度は判定していません。") + "サーバーの基本メトリクスとサービス状態を確認しています。"
+        if anomalies:
+            summary += " 確認された警告・異常は詳細一覧を確認してください。"
+        recommended_actions = cloudflare_scope_actions(anomalies)
+
     # 7. status と stale の判定
     status_code, is_stale = determine_status_and_stale(
         core_success=True,
diff --git a/dashboard/fetch_dashboard_data.py b/dashboard/fetch_dashboard_data.py
index d674908..c7eff31 100644
--- a/dashboard/fetch_dashboard_data.py
+++ b/dashboard/fetch_dashboard_data.py
@@ -24,6 +24,7 @@ from pathlib import Path
 from typing import Any, Optional
 
 import requests
+from cloudflare_collect import collect as collect_cloudflare, demo_collection, empty_collection
 from dotenv import load_dotenv
 from google.oauth2 import service_account
 from googleapiclient.discovery import build
@@ -223,6 +224,7 @@ class DashboardData(BaseModel):
     bigqueryDailyUsage30d: list[DailyBigQueryUsage30d]
     wafDetails: Optional[WAFDetails] = None
     gcpFreeTier: Optional[GCPFreeTierUsage] = None
+    cloudflareCollection: Optional[dict[str, Any]] = None
 
 
 def load_credit_master(path: Path = CREDIT_MASTER_PATH) -> list[dict[str, Any]]:
@@ -1519,26 +1521,30 @@ def main() -> None:
             logger.warning("⚠️ GCP_PROJECT_IDS もしくは GCP_SERVICE_ACCOUNT_KEY が未設定です。モックデータを生成します。")
             dashboard_data = generate_mock_data()
         else:
-            # 1. Cloudflare データの取得
-            cf_stats = fetch_cloudflare_metrics(cf_token, cf_zone_id)
-            cf_waf = fetch_cloudflare_waf_details(cf_token, cf_zone_id)
-            
-            # Cloudflare Pages データの取得
-            cf_pages = None
-            try:
-                cf_account_id = fetch_cloudflare_account_id(cf_token, cf_zone_id)
-                if cf_account_id:
-                    pages_builds = fetch_cloudflare_pages_builds(cf_token, cf_account_id)
-                    limit_builds = 500
-                    usage_pct = round((pages_builds / limit_builds) * 100, 2) if limit_builds > 0 else 0.0
-                    cf_pages = CloudflarePagesUsage(
-                        currentMonthBuilds=pages_builds,
-                        limitBuilds=limit_builds,
-                        usagePercent=usage_pct
-                    )
-            except Exception as e:
-                logger.error(f"❌ Cloudflare Pages データ取得中にエラーが発生しました: {e}")
-            
+            # Cloudflare values and provenance are collected as one run.
+            raw_age = os.environ.get("CLOUDFLARE_COLLECTION_MAX_AGE_SECONDS", "")
+            max_age = int(raw_age) if len(raw_age) <= 5 and raw_age.isascii() and raw_age.isdigit() and 0 < int(raw_age) <= 86400 else None
+            cf_collection = collect_cloudflare(cf_token, cf_zone_id, max_age)
+            traffic = cf_collection["traffic24h"]["data"] or {}
+            cf_stats = {
+                "total_requests": traffic.get("requests", 0),
+                "total_threats": traffic.get("threatEvents", 0),
+                "cache_rate": traffic.get("cacheRate") or 0.0,
+                "hourly_requests": {}, "hourly_threats": {},
+            }
+            for row in traffic.get("hourly", []):
+                label = datetime.fromisoformat(row["hour"].replace("Z", "+00:00")).astimezone(JST).strftime("%H:00")
+                cf_stats["hourly_requests"][label] = cf_stats["hourly_requests"].get(label, 0) + row["requests"]
+                cf_stats["hourly_threats"][label] = cf_stats["hourly_threats"].get(label, 0) + row["threats"]
+            waf = cf_collection["waf7d"]
+            waf_summary = waf["summary"]["data"] or {"totalEvents": 0, "actionCounts": {}}
+            cf_waf = WAFDetails(period="7d", total_events=waf_summary["totalEvents"],
+                action_summary=waf_summary["actionCounts"], top_rules=waf["topRules"]["data"] or [],
+                top_paths=waf["topPaths"]["data"] or [], top_asns=waf["topASNs"]["data"] or [],
+                hourly_timeline=waf["timeline"]["data"] or [], bot_distribution={})
+            # Legacy numeric fields remain for old consumers, never for new health decisions.
+            cf_pages = None  # No unverified deployment-to-build quota conversion in legacy fields either.
+
             # 2. Google Monitoring API の取得 (複数プロジェクトをマージ)
             gcp_project_ids = [pid.strip() for pid in gcp_project_ids_raw.split(",") if pid.strip()]
             g_stats_combined = {
@@ -1641,6 +1647,14 @@ def main() -> None:
                 gcpFreeTier=gcp_free_tier,
             )
 
+    if args.mock:
+        dashboard_data.cloudflareCollection = demo_collection(dashboard_data)
+    elif "cf_collection" in locals():
+        dashboard_data.cloudflareCollection = cf_collection
+    else:
+        # Legacy fallback can contain synthetic values; new consumers only see unavailable CF data.
+        dashboard_data.cloudflareCollection = empty_collection("MISSING_CONFIG")
+
     # ディレクトリ作成と出力
     try:
         output_file.parent.mkdir(parents=True, exist_ok=True)
diff --git a/dashboard/tests/ai_operations/test_generate_digest.py b/dashboard/tests/ai_operations/test_generate_digest.py
index fb38dd4..3f7c9ec 100644
--- a/dashboard/tests/ai_operations/test_generate_digest.py
+++ b/dashboard/tests/ai_operations/test_generate_digest.py
@@ -158,7 +158,9 @@ def test_core_failure_publishes_stale_previous_success(tmp_path):
 
     written = write_mock.call_args.args[1]
     assert write_mock.call_args.args[0] == settings.public_status_path
-    assert written.summary == "前回成功"
+    assert "前回の確認結果" in written.summary
+    assert "Cloudflareの未取得・未確認" in written.summary
+    assert "DASHBOARD_DATA_UNAVAILABLE" in written.errors
     assert written.stale is True
     assert "CORE_METRICS_COLLECTION_FAILED" in written.errors
```

## bearworks-portal 既存コードの対象差分

```diff
diff --git a/.github/workflows/workers-build.yml b/.github/workflows/workers-build.yml
index da2996a..9e75cec 100644
--- a/.github/workflows/workers-build.yml
+++ b/.github/workflows/workers-build.yml
@@ -73,6 +73,9 @@ jobs:
       - name: Lint
         run: npm run lint
 
+      - name: Verify Cloudflare collection contract and display
+        run: npm run test:cloudflare
+
       - name: Build Next.js
         run: npm run build
 
diff --git a/app/(non-monetized)/dashboard/cloudflare/page.tsx b/app/(non-monetized)/dashboard/cloudflare/page.tsx
index 8d160c8..7e9e44c 100644
--- a/app/(non-monetized)/dashboard/cloudflare/page.tsx
+++ b/app/(non-monetized)/dashboard/cloudflare/page.tsx
@@ -1,258 +1,69 @@
 "use client";
 
-import React, { useState, useEffect } from "react";
-import { AlertTriangle, Zap, Globe, ShieldAlert } from "lucide-react";
-import { DashboardData, normalizeDashboardData } from "../lib/dashboardUtils";
-import { DetailPageLayout } from "../components/DetailPageLayout";
-import { WAFCharts } from "../components/WAFCharts";
-import { MetricCard } from "../components/MetricCard";
+import React, { useCallback, useEffect, useRef, useState } from "react";
+import { CloudflareCollectionView } from "../components/CloudflareCollectionView";
 
-const DASHBOARD_API_URL = "/api/dashboard-data";
+import { clockUpperBound, parseCollection, syncClock, type ClockAnchor, type Collection } from "../lib/cloudflareCollection";
 
-// 動的モックデータの生成
-function getMockWafData(): DashboardData {
-  const now = new Date();
-  
-  const waf_details = {
-    period: "7d",
-    total_events: 4580,
-    action_summary: {
-      block: 2100,
-      managed_challenge: 1500,
-      js_challenge: 450,
-      log: 530,
-    },
-    top_rules: [
-      { rule_id: "100015", action: "block", source: "firewallManaged", count: 890 },
-      { rule_id: "100085", action: "block", source: "firewallManaged", count: 450 },
-      { rule_id: "user_rule_1", action: "block", source: "user", count: 320 },
-      { rule_id: "user_rule_2", action: "managed_challenge", source: "user", count: 280 },
-    ],
-    top_paths: [
-      { path: "/wp-login.php", action: "block", count: 890 },
-      { path: "/xmlrpc.php", action: "block", count: 640 },
-      { path: "/api/v1/auth", action: "managed_challenge", count: 310 },
-      { path: "/", action: "log", count: 120 },
-    ],
-    top_asns: [
-      { asn: 16509, org: "Amazon.com", country: "US", count: 1500 },
-      { asn: 24940, org: "Hetzner Online", country: "DE", count: 920 },
-      { asn: 13335, org: "Cloudflare", country: "US", count: 450 },
-    ],
-    bot_distribution: {},
-    hourly_timeline: Array.from({ length: 168 }, (_, i) => {
-      const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
-      return {
-        hour: targetTime.toISOString(),
-        action: "block",
-        count: Math.floor(Math.random() * 45) + 5,
-      };
-    }),
-  };
-
-  return {
-    updatedAt: now.toISOString(),
-    summary: {
-      googleTotalRequests24h: 320,
-      googleTotalErrors24h: 2,
-      googleErrorRate24h: 0.62,
-      cloudflareTotalRequests24h: 12500,
-      cloudflareTotalThreats24h: 35,
-      cloudflareCacheRate24h: 62.4,
-      cloudflarePages: {
-        currentMonthBuilds: 42,
-        limitBuilds: 500,
-        usagePercent: 8.4,
-      },
-      googleBilling: {
-        limitJPY: 1550.0,
-        currentMonthTotalJPY: 450.0,
-        usagePercent: 29.0,
-        projects: [],
-        modelCosts: {},
-      },
-      bigqueryUsage: {
-        limitQueryGB: 1024.0,
-        currentMonthQueryGB: 124.5,
-        usageQueryPercent: 12.16,
-        limitStorageGB: 10.0,
-        currentMonthStorageGB: 4.2,
-        usageStoragePercent: 42.0,
-      },
-    },
-    hourly: [],
-    dailyCosts30d: [],
-    bigqueryDailyUsage30d: [],
-    wafDetails: waf_details,
-  };
-}
 
 export default function CloudflareWafPage() {
-  const [data, setData] = useState<DashboardData | null>(null);
-  const [usingMock, setUsingMock] = useState(false);
+  const [collection, setCollection] = useState<Collection>(() => parseCollection(null));
+  const [anchor, setAnchor] = useState<ClockAnchor | null>(null);
+  const [mono, setMono] = useState(0);
   const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
   const [refreshing, setRefreshing] = useState(false);
-
-  const fetchData = async (isManual = false) => {
-    if (isManual) setRefreshing(true);
+  const [failed, setFailed] = useState(false);
+  const active = useRef<AbortController | null>(null);
+  const clock = useRef<ClockAnchor | null>(null);
+  const mounted = useRef(true);
+  const fetching = useRef(false);
+  const lastFetchMono = useRef(0);
+  const fetchData = useCallback(async (invalidate = false) => {
+    active.current?.abort();
+    const controller = new AbortController(); active.current = controller; fetching.current = true;
+    if (invalidate) { clock.current = null; setAnchor(null); }
+    setRefreshing(true);
+    const start = performance.now(); lastFetchMono.current = start;
     try {
-      const res = await fetch(DASHBOARD_API_URL, { cache: "no-store" });
-      if (!res.ok) throw new Error(`HTTP ${res.status}`);
-      const json: DashboardData = await res.json();
-      setData(normalizeDashboardData(json));
-      setUsingMock(false);
-      setError(null);
-    } catch (err) {
-      console.warn("Dashboard API unavailable, using mock WAF data:", err);
-      setData(getMockWafData());
-      setUsingMock(true);
-      setError("本番 API サーバーから実データを取得できなかったため、モックデータを表示しています。");
+      const response = await fetch("/api/dashboard-data", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
+      if (!response.ok) throw new Error("FETCH_FAILED");
+      const payload: unknown = await response.json(); const receive = performance.now();
+      if (controller.signal.aborted || !mounted.current) return;
+      const meta = payload && typeof payload === "object" && "responseMeta" in payload ? payload.responseMeta : null;
+      const next = syncClock(meta, start, receive, clock.current); clock.current = next;
+      setCollection(parseCollection(payload)); setAnchor(next); setMono(receive); setFailed(false);
+    } catch {
+      if (controller.signal.aborted || !mounted.current) return;
+      clock.current = null; setAnchor(null); setCollection(parseCollection(null)); setFailed(true);
     } finally {
-      setLoading(false);
-      setRefreshing(false);
+      if (!controller.signal.aborted && mounted.current) { fetching.current = false; setLoading(false); setRefreshing(false); }
     }
-  };
-
-  useEffect(() => {
-    fetchData();
   }, []);
 
-  if (loading) {
-    return (
-      <main className="max-w-5xl w-full mx-auto px-4 py-16">
-        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
-          <div className="animate-spin text-4xl text-orange-500">🌀</div>
-          <p className="text-muted font-bold tracking-wide">WAF詳細データを読み込み中...</p>
-        </div>
-      </main>
-    );
-  }
-
-  if (!data) return null;
-
-  const wafDetails = data.wafDetails || getMockWafData().wafDetails!;
-  const cloudflarePages = data.summary.cloudflarePages || {
-    currentMonthBuilds: 0,
-    limitBuilds: 500,
-    usagePercent: 0.0,
-  };
-
-  return (
-    <DetailPageLayout
-      title="Cloudflare"
-      updatedAt={data.updatedAt}
-      refreshing={refreshing}
-      onRefresh={() => fetchData(true)}
-      crossLinkText="GCP コスト分析を見る"
-      crossLinkHref="/dashboard/gcp"
-    >
-      {/* Mock Fallback Warning Alert */}
-      {usingMock && (
-        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex items-start gap-3 text-amber-800 shadow-soft mb-2">
-          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
-          <div>
-            <h4 className="text-xs font-bold">デモモード動作中 (フォールバック)</h4>
-            <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">
-              {error} 本番環境へのデプロイ後にAPIキーが設定されると、自動的にリアルタイムデータに切り替わります。
-            </p>
-          </div>
-        </div>
-      )}
-
-      {/* Section 1: Cloudflare Pages */}
-      <section className="flex flex-col gap-4">
-        <div>
-          <h2 className="text-xl font-bold tracking-tight text-primary">⚡ Cloudflare Pages</h2>
-          <p className="text-xs text-muted font-medium mt-0.5">静的サイト・Webアプリのホスティング枠の消費状況</p>
-        </div>
-        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
-          <MetricCard
-            title="Pages 当月ビルド数"
-            value={`${cloudflarePages.currentMonthBuilds} / ${cloudflarePages.limitBuilds}`}
-            unit=" 回"
-            description="無料枠500回/月に対する現在のビルド（デプロイ）回数（毎月1日にリセット）"
-            icon={<Zap size={20} />}
-            theme="cloudflare"
-            trend={{
-              value: `${cloudflarePages.usagePercent}% 使用`,
-              isPositive: cloudflarePages.usagePercent < 80,
-            }}
-          />
-          
-          <div className="rounded-[2rem] p-6 border border-orange-100/50 bg-white/80 backdrop-blur-md shadow-soft flex flex-col justify-between relative overflow-hidden">
-            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-500" />
-            <div>
-              <span className="text-xs font-semibold tracking-wider text-muted block mb-1">
-                Pages 無料枠ステータス
-              </span>
-              <h4 className="text-lg font-bold text-primary mt-1">
-                {cloudflarePages.currentMonthBuilds >= cloudflarePages.limitBuilds ? "🚨 制限に達しました" : "✅ 正常稼働中"}
-              </h4>
-              <p className="text-[11px] text-muted/90 mt-2 leading-relaxed">
-                無料プランのビルド回数上限は月間 500 回です。これを超えると、新しいコミットの自動ビルドが一時的に停止されます。
-              </p>
-            </div>
-            
-            {/* プログレスバー表示 */}
-            <div className="mt-4">
-              <div className="flex justify-between text-[10px] font-bold text-muted mb-1">
-                <span>使用率: {cloudflarePages.usagePercent}%</span>
-                <span>残り: {Math.max(0, cloudflarePages.limitBuilds - cloudflarePages.currentMonthBuilds)} 回</span>
-              </div>
-              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
-                <div 
-                  className={`h-full rounded-full transition-all duration-500 ${
-                    cloudflarePages.usagePercent > 90 ? "bg-red-500" : cloudflarePages.usagePercent > 70 ? "bg-amber-500" : "bg-orange-500"
-                  }`}
-                  style={{ width: `${Math.min(100, cloudflarePages.usagePercent)}%` }}
-                />
-              </div>
-            </div>
-          </div>
-        </div>
-      </section>
-
-      <hr className="border-gray-100 my-2" />
-
-      {/* Section 2: Cloudflare WAF */}
-      <section className="flex flex-col gap-4">
-        <div>
-          <h2 className="text-xl font-bold tracking-tight text-primary">🛡️ Web Application Firewall (WAF)</h2>
-          <p className="text-xs text-muted font-medium mt-0.5">脅威のブロックやアクセスセキュリティ統計</p>
-        </div>
-        
-        {/* WAFサマリカード */}
-        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
-          <MetricCard
-            title="直近24時間 総リクエスト数"
-            value={data.summary.cloudflareTotalRequests24h}
-            unit=" 回"
-            description="Cloudflare 経由でプロキシされた全リクエスト数"
-            icon={<Globe size={20} />}
-            theme="cloudflare"
-            trend={{
-              value: `${data.summary.cloudflareCacheRate24h}% キャッシュ率`,
-              isPositive: true,
-            }}
-          />
-          <MetricCard
-            title="直近24時間 総ブロック・脅威数"
-            value={data.summary.cloudflareTotalThreats24h}
-            unit=" 件"
-            description="セキュリティルールで検知・ブロックされたアクセス"
-            icon={<ShieldAlert size={20} />}
-            theme="cloudflare"
-            trend={{
-              value: data.summary.cloudflareTotalThreats24h > 100 ? "脅威検出増加" : "平常",
-              isPositive: data.summary.cloudflareTotalThreats24h <= 100,
-            }}
-          />
-        </div>
+  useEffect(() => {
+    mounted.current = true;
+    queueMicrotask(() => { if (mounted.current) void fetchData(); });
+    const onVisibility = () => {
+      clock.current = null; setAnchor(null);
+      if (document.visibilityState === "visible") void fetchData(true);
+      else { active.current?.abort(); fetching.current = false; }
+    };
+    const onPageShow = () => { if (document.visibilityState === "visible") void fetchData(true); };
+    let lastTick = performance.now();
+    const timer = window.setInterval(() => {
+      const current = performance.now(); setMono(current);
+      const interrupted = current < lastTick || current - lastTick > 2500;
+      lastTick = current;
+      if (document.visibilityState !== "visible" || fetching.current) return;
+      if (interrupted) { void fetchData(true); return; }
+      const base = clock.current;
+      if (base ? clockUpperBound(base, current) === null : current - lastFetchMono.current >= 60_000) void fetchData();
+    }, 1000);
+    document.addEventListener("visibilitychange", onVisibility); window.addEventListener("pageshow", onPageShow);
+    window.addEventListener("focus", onPageShow);
+    document.addEventListener("resume", onPageShow);
+    return () => { mounted.current = false; active.current?.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pageshow", onPageShow); window.removeEventListener("focus", onPageShow); document.removeEventListener("resume", onPageShow); };
+  }, [fetchData]);
 
-        {/* WAF Charts & Tables */}
-        <WAFCharts wafDetails={wafDetails} />
-      </section>
-    </DetailPageLayout>
-  );
+  return <CloudflareCollectionView collection={collection} nowUpper={clockUpperBound(anchor, mono)} loading={loading} refreshing={refreshing} failed={failed} onRefresh={() => void fetchData()} />;
 }
diff --git a/app/api/dashboard-data/route.ts b/app/api/dashboard-data/route.ts
index ae1b44b..a5a938d 100644
--- a/app/api/dashboard-data/route.ts
+++ b/app/api/dashboard-data/route.ts
@@ -62,10 +62,17 @@ export async function GET(request: NextRequest) {
       throw new Error(`Upstream returned status ${res.status}`);
     }
 
-    const data = await res.json();
+    const data: unknown = await res.json();
+    if (!data || typeof data !== "object" || Array.isArray(data)) {
+      throw new Error("InvalidDashboardResponse");
+    }
 
     // 4. 成功時もキャッシュ無効化ヘッダーを付与して返却
-    return NextResponse.json(data, {
+    return NextResponse.json({ ...data, responseMeta: {
+      clockMaxUncertaintySeconds: positiveSeconds(process.env.DASHBOARD_CLOCK_MAX_UNCERTAINTY_SECONDS),
+      clockResyncIntervalSeconds: positiveSeconds(process.env.DASHBOARD_CLOCK_RESYNC_INTERVAL_SECONDS),
+      servedAt: new Date().toISOString(),
+    } }, {
       headers: {
         ...NO_CACHE_HEADERS,
       },
@@ -88,6 +95,12 @@ export async function GET(request: NextRequest) {
   }
 }
 
+function positiveSeconds(value: string | undefined): number | null {
+  if (!value || !/^[1-9]\d*$/.test(value)) return null;
+  const seconds = Number(value);
+  return Number.isSafeInteger(seconds * 1000) ? seconds : null;
+}
+
 // GET以外のリクエストは405 Method Not Allowedを返す
 export async function POST() { return methodNotAllowed(); }
 export async function PUT() { return methodNotAllowed(); }
diff --git a/package.json b/package.json
index 5db9c76..16bd8d0 100644
--- a/package.json
+++ b/package.json
@@ -7,6 +7,7 @@
   },
   "scripts": {
     "dev": "next dev",
+    "test:cloudflare": "node --experimental-strip-types --test scripts/cloudflare-collection.test.mjs",
     "validate:hachioji-climate": "node scripts/validate-hachioji-climate-bundle.mjs",
     "validate:hachioji-snow": "node scripts/validate-hachioji-snow-bundle.mjs",
     "validate:hachioji-heat": "node scripts/validate-hachioji-heat-bundle.mjs",
```
