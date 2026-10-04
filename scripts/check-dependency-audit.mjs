import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function normalizeAudit(report, lock) {
  return Object.entries(report.vulnerabilities).sort(([a], [b]) => a.localeCompare(b)).map(([name, entry]) => ({
    name,
    severity: entry.severity,
    isDirect: entry.isDirect,
    range: entry.range,
    fixAvailable: entry.fixAvailable,
    via: entry.via.map(item => typeof item === "string" ? { dependency: item } : {
      name: item.name, url: item.url, severity: item.severity, range: item.range,
    }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    nodes: [...entry.nodes].sort().map(node => {
      const installed = lock.packages[node];
      assert(installed?.version && installed.dev === true, `${node}: exceptions must be development-only locked packages`);
      return { path: node, version: installed.version };
    }),
  }));
}

export function checkAudit({ report, exitStatus, lock, policy, now = Date.now() }) {
  assert.equal(report.auditReportVersion, 2, "Supported npm audit report required");
  assert(!report.error && report.vulnerabilities && report.metadata?.vulnerabilities, "Valid audit report required");
  const total = report.metadata.vulnerabilities.total;
  assert(Number.isInteger(total) && total >= 0 && total === Object.keys(report.vulnerabilities).length, "Consistent audit count required");
  assert(exitStatus === (total === 0 ? 0 : 1), "Audit transport or execution failure");
  assert.equal(report.metadata.vulnerabilities.critical, 0, "Critical vulnerabilities are never excepted");
  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    const count = Object.values(report.vulnerabilities).filter(entry => entry.severity === severity).length;
    assert.equal(report.metadata.vulnerabilities[severity], count, `Consistent ${severity} audit count required`);
  }
  for (const entry of Object.values(report.vulnerabilities)) {
    assert(["info", "low", "moderate", "high"].includes(entry.severity), "Critical or unknown severity is never excepted");
    assert(entry.via.every(item => typeof item === "string" || ["info", "low", "moderate", "high"].includes(item.severity)), "Critical or unknown advisory severity is never excepted");
  }
  assert.equal(policy.schemaVersion, 1, "Supported exception policy required");
  assert(Array.isArray(policy.exceptions), "Explicit exceptions required");
  if (policy.exceptions.length > 0) {
    const reviewed = Date.parse(policy.reviewedAt);
    const expires = Date.parse(policy.expiresAt);
    assert(policy.owner && policy.issue && policy.reason && policy.mitigation, "Exception ownership, tracking and mitigation required");
    assert(Number.isFinite(reviewed) && Number.isFinite(expires), "Valid exception dates required");
    assert(reviewed <= now && reviewed < expires && expires - reviewed <= 14 * 86400000, "Exception review period must be at most 14 days");
    assert(now < expires, "Dependency exception expired: review upstream fixes and alternatives");
  }
  const actual = normalizeAudit(report, lock);
  // Match advisory, severity, propagation, exact locked versions and installation paths.
  // Any new warning (including low/moderate) or stale exception requires review.
  assert.deepEqual(actual, policy.exceptions, "Audit differs from the reviewed exceptions: do not auto-expand the policy");
  return { total, expiresAt: policy.exceptions.length ? policy.expiresAt : null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [reportPath, status, lockPath = "package-lock.json", policyPath = "config/dependency-audit-exceptions.json"] = process.argv.slice(2);
    assert(reportPath && status !== undefined, "Usage: node scripts/check-dependency-audit.mjs AUDIT_JSON EXIT_STATUS [LOCK_JSON] [POLICY_JSON]");
    const [report, lock, policy] = await Promise.all([reportPath, lockPath, policyPath].map(async file => JSON.parse(await readFile(file, "utf8"))));
    const result = checkAudit({ report, exitStatus: Number(status), lock, policy });
    console.log(result.total === 0 ? "PASS: full dependency audit has no warnings or exceptions." : `PASS: ${result.total} unresolved development warnings match reviewed exceptions until ${result.expiresAt}.`);
  } catch (error) {
    console.error(`Dependency audit gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
