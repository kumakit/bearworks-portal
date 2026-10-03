// With --fetch: acquire a fixed sample of public JMA HTML tables. Without it: offline recheck.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSource, sha256, jsonBytes } from "./lib/hachioji-rain-autumn.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = resolve(root, "docs/task/hachioji-rain-autumn/evidence/jma");
const source = await loadSource(root);
const cases = [[2009, 9], [2015, 9], [2019, 1], [2020, 2], [2021, 9], [2024, 12], [2025, 9]];
const checks = []; let compared = 0;
await mkdir(directory, { recursive: true });
for (const [year, month] of cases) for (const station of ["h", "t"]) {
  const filename = `${station}-${year}-${String(month).padStart(2, "0")}.html`;
  const url = `https://www.data.jma.go.jp/stats/etrn/view/daily_${station === "h" ? "a" : "s"}1.php?prec_no=44&block_no=${station === "h" ? "0366" : "47662"}&year=${year}&month=${month}&day=&view=`;
  let bytes;
  try { bytes = await readFile(resolve(directory, filename)); }
  catch (error) {
    if (error.code !== "ENOENT" || !process.argv.includes("--fetch")) throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, url);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(resolve(directory, filename), bytes, { flag: "wx" });
    await new Promise(done => setTimeout(done, 500));
  }
  const html = bytes.toString("utf8");
  const table = html.match(/<table[^>]*id=['"]tablefix1['"][\s\S]*?<\/table>/)?.[0];
  assert(table?.includes("降水量") && table.includes("気温"), `Missing expected table ${url}`);
  const observations = [];
  for (const match of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim());
    if (!/^\d{1,2}$/.test(cells[0] ?? "")) continue;
    const date = `${year}-${String(month).padStart(2, "0")}-${cells[0].padStart(2, "0")}`;
    const rawRow = source.rows.find(r => r.date === date); assert(rawRow);
    for (const [field, index] of [["rain", station === "h" ? 1 : 3], ["mean", station === "h" ? 4 : 6]]) {
      const text = cells[index];
      const quality = text.includes("///") ? 1 : text.endsWith("]") ? 4 : text.endsWith(")") ? 5 : 8;
      const value = text === "--" ? 0 : text.includes("///") ? null : Number(text.replace(/[)\]\s]/g, ""));
      const expected = rawRow[station][field];
      assert.equal(quality, expected.quality, `${date} ${station}.${field} quality: ${text}`);
      assert.equal(value, expected.value, `${date} ${station}.${field} value: ${text}`);
      observations.push({ date, field, value, quality }); compared++;
    }
  }
  assert.equal(observations.length, new Date(Date.UTC(year, month, 0)).getUTCDate() * 2);
  checks.push({ url, filename, sha256: sha256(bytes), observations });
}
await writeFile(resolve(directory, "check.json"), jsonBytes({ result: "PASS", source_sha256: source.manifest.sha256, pages: checks.length, compared_values_and_quality: compared, mismatches: 0, checks }));
console.log(`PASS: ${compared} daily values and quality markers independently matched to ${checks.length} JMA HTML tables.`);
