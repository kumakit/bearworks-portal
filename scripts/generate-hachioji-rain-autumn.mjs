import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSource, makeBundles, jsonBytes, sha256, version } from "./lib/hachioji-rain-autumn.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await loadSource(root);
const bundles = makeBundles(source);
for (const [slug, bundle] of Object.entries(bundles)) {
  const directory = resolve(root, `app/(monetized)/labs/hachioji-${slug}/data`);
  await mkdir(directory, { recursive: true });
  const filename = `hachioji-${slug}-${version}.json`; const bytes = Buffer.from(jsonBytes(bundle));
  await writeFile(resolve(directory, filename), bytes);
  await writeFile(resolve(directory, `hachioji-${slug}-${version}.lock.json`), jsonBytes({ filename, version, bytes: bytes.length, sha256: sha256(bytes), source_sha256: source.manifest.sha256 }));
}
const downloads = resolve(root, "public/data/hachioji-rain-autumn");
await mkdir(downloads, { recursive: true });
await writeFile(resolve(downloads, source.manifest.filename), source.bytes);
await writeFile(resolve(downloads, "source-manifest.json"), await readFile(resolve(root, "data/hachioji-rain-autumn/source-manifest.json")));
console.log(jsonBytes({ rain: { years: bundles.rain.main.included_years, excluded: bundles.rain.main.excluded, summary: bundles.rain.main.summary, contingency: bundles.rain.main.contingency }, autumn: { excluded: bundles.autumn.main.excluded, comparison: bundles.autumn.main.comparison } }));
