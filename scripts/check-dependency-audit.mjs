import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function checkAudit({ report, exitStatus }) {
  assert.equal(report?.auditReportVersion, 2, "Supported npm audit report required");
  assert(!report.error && report.vulnerabilities && typeof report.vulnerabilities === "object" && !Array.isArray(report.vulnerabilities), "Valid audit report required");
  const counts = report.metadata?.vulnerabilities;
  assert(counts, "Audit vulnerability counts required");
  const entries = Object.values(report.vulnerabilities);
  const total = counts.total;
  assert(Number.isInteger(total) && total >= 0 && total === entries.length, "Consistent audit count required");
  assert.equal(exitStatus, total === 0 ? 0 : 1, "Audit transport or execution failure");
  const severities = ["info", "low", "moderate", "high", "critical"];
  assert(entries.every(entry => entry && severities.includes(entry.severity)), "Known advisory severity required");
  for (const severity of severities) {
    assert.equal(counts[severity], entries.filter(entry => entry.severity === severity).length, "Consistent " + severity + " audit count required");
  }
  assert.equal(total, 0, "Dependency audit must have zero warnings; exceptions are not supported");
  return { total };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [reportPath, status, ...extra] = process.argv.slice(2);
    assert(reportPath && /^[01]$/.test(status) && extra.length === 0, "Usage: node scripts/check-dependency-audit.mjs AUDIT_JSON EXIT_STATUS");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    checkAudit({ report, exitStatus: Number(status) });
    console.log("PASS: full dependency audit has no warnings; exceptions are not supported.");
  } catch (error) {
    console.error("Dependency audit gate failed: " + error.message);
    process.exitCode = 1;
  }
}
