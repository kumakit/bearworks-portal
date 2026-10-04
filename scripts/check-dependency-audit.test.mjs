import assert from "node:assert/strict";
import test from "node:test";
import { checkAudit, normalizeAudit } from "./check-dependency-audit.mjs";

function fixture() {
  const report = { auditReportVersion: 2, metadata: { vulnerabilities: { total: 1, info: 0, low: 0, moderate: 0, critical: 0, high: 1 } }, vulnerabilities: {
    braces: { severity: "high", isDirect: false, range: "*", fixAvailable: false, via: [{ name: "braces", url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm", severity: "high", range: "<=3.0.3" }], nodes: ["node_modules/braces"] },
  } };
  const lock = { packages: { "node_modules/braces": { version: "3.0.3", dev: true } } };
  const policy = { schemaVersion: 1, reviewedAt: "2026-10-04T00:00:00Z", expiresAt: "2026-10-18T00:00:00Z", owner: "maintainer", issue: "https://github.com/kumakit/bearworks-portal/issues/17", reason: "No upstream patched release", mitigation: "Only trusted build patterns", exceptions: normalizeAudit(report, lock) };
  return { report, lock, policy, exitStatus: 1, now: Date.parse("2026-10-05T00:00:00Z") };
}

test("accepts the reviewed warning and an audit with no warnings or exceptions", () => {
  assert.equal(checkAudit(fixture()).total, 1);
  const clean = fixture(); clean.report.vulnerabilities = {}; clean.report.metadata.vulnerabilities = { total: 0, info: 0, low: 0, moderate: 0, high: 0, critical: 0 }; clean.policy.exceptions = []; clean.exitStatus = 0;
  assert.equal(checkAudit(clean).total, 0);
});

for (const [name, change] of [
  ["another advisory with the same count", f => { f.report.vulnerabilities.braces.via[0].url = "https://github.com/advisories/GHSA-new-warning"; }],
  ["a severity change", f => { f.report.vulnerabilities.braces.severity = "critical"; f.report.metadata.vulnerabilities.critical = 1; }],
  ["a new dependency path", f => { f.report.vulnerabilities.braces.nodes.push("node_modules/other/node_modules/braces"); f.lock.packages["node_modules/other/node_modules/braces"] = { version: "3.0.3", dev: true }; }],
  ["a changed locked version", f => { f.lock.packages["node_modules/braces"].version = "3.0.4"; }],
  ["new remediation information", f => { f.report.vulnerabilities.braces.fixAvailable = true; }],
  ["an additional moderate warning", f => { f.report.vulnerabilities.other = { ...structuredClone(f.report.vulnerabilities.braces), severity: "moderate" }; f.report.metadata.vulnerabilities.total = 2; f.report.metadata.vulnerabilities.moderate = 1; }],
  ["a production dependency", f => { delete f.lock.packages["node_modules/braces"].dev; }],
  ["an expired exception", f => { f.now = Date.parse(f.policy.expiresAt); }],
  ["an exception longer than 14 days", f => { f.policy.expiresAt = "2026-10-19T00:00:00Z"; }],
  ["a future review date", f => { f.now = Date.parse("2026-10-03T00:00:00Z"); }],
  ["an audit execution failure", f => { f.exitStatus = 2; }],
  ["an audit transport error", f => { f.report.error = { code: "NETWORK_ERROR" }; }],
  ["a malformed report", f => { delete f.report.metadata; }],
  ["a stale exception after the warning disappears", f => { f.report.vulnerabilities = {}; f.report.metadata.vulnerabilities.total = 0; f.exitStatus = 0; }],
]) {
  test(`rejects ${name}`, () => { const f = fixture(); change(f); assert.throws(() => checkAudit(f)); });
}

test("rejects a critical entry hidden by aggregate metadata even when the policy matches", () => {
  const f = fixture(); f.report.vulnerabilities.braces.severity = "critical";
  f.policy.exceptions = normalizeAudit(f.report, f.lock);
  assert.throws(() => checkAudit(f), /Consistent high audit count required/);
});

test("rejects a critical advisory hidden by a high parent entry even when the policy matches", () => {
  const f = fixture(); f.report.vulnerabilities.braces.via[0].severity = "critical";
  f.policy.exceptions = normalizeAudit(f.report, f.lock);
  assert.throws(() => checkAudit(f), /Critical or unknown advisory severity/);
});
