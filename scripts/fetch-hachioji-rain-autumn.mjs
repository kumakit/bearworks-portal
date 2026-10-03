// Explicit acquisition only. Builds and offline validators never call the network.
import { mkdir, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = resolve(root, "data/hachioji-rain-autumn");
const filename = "jma-daily-2009-2025-20261004.csv";
try { await access(resolve(directory, filename)); throw new Error("Fixed raw snapshot already exists. Do not overwrite it."); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const url = "https://www.data.jma.go.jp/risk/obsdl/show/table";
const request = {
  stationNumList: JSON.stringify(["a0366", "s47662"]), aggrgPeriod: "1",
  elementNumList: JSON.stringify([["201", ""], ["202", ""], ["203", ""], ["101", ""]]),
  interAnnualType: "1", ymdList: JSON.stringify(["2009", "2025", "1", "12", "1", "31"]),
  optionNumList: "[]", downloadFlag: "true", rmkFlag: "1", disconnectFlag: "1",
  youbiFlag: "0", fukenFlag: "0", kijiFlag: "0", csvFlag: "1", jikantaiFlag: "0",
  jikantaiList: "[1,24]", ymdLiteral: "1",
};
const response = await fetch(url, {
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: "https://www.data.jma.go.jp/risk/obsdl/" },
  body: new URLSearchParams(request), signal: AbortSignal.timeout(120000),
});
if (!response.ok) throw new Error(`JMA HTTP ${response.status}`);
const raw = Buffer.from(await response.arrayBuffer());
const csv = new TextDecoder("shift-jis").decode(raw);
const records = csv.split(/\r?\n/).filter(line => /^\d{4}\/\d{1,2}\/\d{1,2},/.test(line));
if (records.length !== 6209 || !records[0].startsWith("2009/1/1,") || !records.at(-1).startsWith("2025/12/31,")) {
  throw new Error(`Unexpected coverage: ${records.length} rows; ${records[0]?.slice(0,12)} to ${records.at(-1)?.slice(0,12)}`);
}
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, filename), raw, { flag: "wx" });
const manifest = { schema_version: "1.0.0", filename, encoding: "shift-jis", bytes: raw.length,
  sha256: createHash("sha256").update(raw).digest("hex"), source_url: url,
  source_landing: "https://www.data.jma.go.jp/risk/obsdl/", retrieved_at: new Date().toISOString(),
  source_download_heading: csv.split(/\r?\n/)[0], request, records: records.length,
  start: "2009-01-01", end: "2025-12-31", description: "Original JMA bytes; unmodified. Observation values, quality and homogeneity columns retained." };
await writeFile(resolve(directory, "source-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ rows: records.length, bytes: raw.length, sha256: manifest.sha256 }));
