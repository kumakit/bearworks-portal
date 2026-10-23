import assert from "node:assert/strict";
import test from "node:test";
import { checkAudit } from "./check-dependency-audit.mjs";

function fixture() {
  return {
    report: {
      auditReportVersion: 2,
      metadata: { vulnerabilities: { total: 0, info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
      vulnerabilities: {},
    },
    exitStatus: 0,
  };
}

test("accepts a zero-warning audit without a lockfile or exception policy", () => {
  assert.deepEqual(checkAudit(fixture()), { total: 0 });
});

for (const severity of ["info", "low", "moderate", "high", "critical"]) {
  test("rejects a " + severity + " warning without exceptions", () => {
    const f = fixture();
    f.report.vulnerabilities.example = { severity };
    f.report.metadata.vulnerabilities.total = 1;
    f.report.metadata.vulnerabilities[severity] = 1;
    f.exitStatus = 1;
    assert.throws(() => checkAudit(f), /must have zero warnings/);
  });
}

for (const [name, change] of [
  ["an execution failure", f => { f.exitStatus = 2; }],
  ["a failed command with an empty report", f => { f.exitStatus = 1; }],
  ["a transport error", f => { f.report.error = { code: "NETWORK_ERROR" }; }],
  ["an unsupported report version", f => { f.report.auditReportVersion = 1; }],
  ["missing vulnerability counts", f => { delete f.report.metadata; }],
  ["missing vulnerability entries", f => { delete f.report.vulnerabilities; }],
  ["an array in place of vulnerability entries", f => { f.report.vulnerabilities = []; }],
  ["a negative total", f => { f.report.metadata.vulnerabilities.total = -1; }],
  ["a noninteger total", f => { f.report.metadata.vulnerabilities.total = 0.5; }],
  ["a hidden warning with total zero", f => { f.report.vulnerabilities.example = { severity: "critical" }; }],
  ["a hidden warning in severity counts", f => { f.report.metadata.vulnerabilities.critical = 1; }],
  ["missing severity counts", f => { delete f.report.metadata.vulnerabilities.low; }],
  ["an unknown severity", f => { f.report.vulnerabilities.example = { severity: "unknown" }; f.report.metadata.vulnerabilities.total = 1; f.exitStatus = 1; }],
  ["a warning paired with a successful command", f => { f.report.vulnerabilities.example = { severity: "high" }; f.report.metadata.vulnerabilities.total = 1; f.report.metadata.vulnerabilities.high = 1; }],
]) {
  test("rejects " + name, () => {
    const f = fixture();
    change(f);
    assert.throws(() => checkAudit(f));
  });
}
