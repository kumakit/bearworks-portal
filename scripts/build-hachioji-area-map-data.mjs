import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const CSV_2024_URL =
  "https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv_d/fil/chouchoubetsu_jinkou_0604.csv";
const CSV_2026_URL =
  "https://www.city.hachioji.tokyo.jp/tantoumadoguchi/002/003/matisetaicsv_d/fil/chouchoubetsu_jinkou_0810.csv";
const ESTAT_KML_ZIP_URL =
  "https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=A002005212020&code=13201&coordSys=1&format=kml&downloadType=5&datum=2011";
const ROSTER_URL =
  "https://www.city.hachioji.tokyo.jp/kurashi/shimin/002/a791636/001/p031711.html";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const round = (v, digits = 2) => Number(v.toFixed(digits));

async function fetchBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.equal(res.status, 200, `Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function decodeCsvBuffer(buf) {
  const text =
    buf[0] === 0xff && buf[1] === 0xfe
      ? buf.subarray(2).toString("utf16le")
      : buf.toString("utf8").replace(/^\uFEFF/, "");
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map(parseCsvLine);
}

function parseTownCsv(rows) {
  const h = rows[0];
  const iCode = h.indexOf("大字コード");
  const iName = h.indexOf("大字名称");
  const iTotal = h.indexOf("人口_合計");
  const iFM = h.indexOf("人口_外国人_男");
  const iFF = h.indexOf("人口_外国人_女");
  const iFO = h.indexOf("人口_外国人_その他");
  assert(iCode >= 0 && iName >= 0 && iTotal >= 0 && iFM >= 0 && iFF >= 0 && iFO >= 0, "Missing CSV columns");
  return rows.slice(1).map((r) => ({
    code: r[iCode],
    name: r[iName],
    total: Number(r[iTotal]),
    foreign: Number(r[iFM]) + Number(r[iFF]) + Number(r[iFO]),
  }));
}

function unzipEntries(zipBuf) {
  let eocd = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  assert(eocd >= 0, "ZIP EOCD not found");
  const cdOff = zipBuf.readUInt32LE(eocd + 16);
  const count = zipBuf.readUInt16LE(eocd + 10);
  const entries = [];
  let off = cdOff;
  for (let i = 0; i < count; i++) {
    const compMethod = zipBuf.readUInt16LE(off + 10);
    const compSize = zipBuf.readUInt32LE(off + 20);
    const nameLen = zipBuf.readUInt16LE(off + 28);
    const extraLen = zipBuf.readUInt16LE(off + 30);
    const commentLen = zipBuf.readUInt16LE(off + 32);
    const localOff = zipBuf.readUInt32LE(off + 42);
    const name = zipBuf.subarray(off + 46, off + 46 + nameLen).toString("utf8");
    off += 46 + nameLen + extraLen + commentLen;
    const lNameLen = zipBuf.readUInt16LE(localOff + 26);
    const lExtraLen = zipBuf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = zipBuf.subarray(dataStart, dataStart + compSize);
    const buf = compMethod === 8 ? inflateRawSync(raw) : raw;
    entries.push({ name, buf });
  }
  return entries;
}

function normTownName(s) {
  return s
    .replace(/[\u{E0100}-\u{E01EF}\uFE00-\uFE0F]/gu, "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/一丁目/g, "1丁目")
    .replace(/二丁目/g, "2丁目")
    .replace(/三丁目/g, "3丁目")
    .replace(/四丁目/g, "4丁目")
    .replace(/五丁目/g, "5丁目")
    .replace(/六丁目/g, "6丁目")
    .replace(/七丁目/g, "7丁目")
    .replace(/八丁目/g, "8丁目")
    .replace(/九丁目/g, "9丁目")
    .replace(/ヶ|ケ/g, "ケ")
    .trim();
}

function parseKmlPolygons(kmlText) {
  const placemarks = [...kmlText.matchAll(/<Placemark[\s\S]*?<\/Placemark>/g)].map((m) => m[0]);
  const features = [];
  for (const pm of placemarks) {
    const sName = pm.match(/<SimpleData name="S_NAME">([^<]*)<\/SimpleData>/)?.[1] ?? "";
    const keyCode = pm.match(/<SimpleData name="KEY_CODE">([^<]*)<\/SimpleData>/)?.[1] ?? "";
    const kigoE = pm.match(/<SimpleData name="KIGO_E">([^<]*)<\/SimpleData>/)?.[1] ?? "";
    const polygons = [...pm.matchAll(/<Polygon>([\s\S]*?)<\/Polygon>/g)].map((p) => {
      const rings = [...p[1].matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)].map((c) =>
        c[1]
          .trim()
          .split(/\s+/)
          .map((pair) => {
            const [lon, lat] = pair.split(",").map(Number);
            return [lon, lat];
          })
          .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
      );
      return rings;
    });
    features.push({ sName, normName: normTownName(sName), keyCode, kigoE, polygons });
  }
  return features;
}

function perpDistance(pt, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(pt[0] - a[0], pt[1] - a[1]);
  const t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.hypot(pt[0] - projX, pt[1] - projY);
}

function douglasPeucker(pts, tol) {
  if (pts.length <= 3) return pts;
  let maxDist = 0;
  let index = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpDistance(pts[i], pts[0], pts[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > tol) {
    const left = douglasPeucker(pts.slice(0, index + 1), tol);
    const right = douglasPeucker(pts.slice(index), tol);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[end]];
}

function createProjector(pointsLonLat, width, height, pad) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of pointsLonLat) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const rawW = (maxLon - minLon) * cosLat;
  const rawH = maxLat - minLat;
  const scale = Math.min((width - 2 * pad) / rawW, (height - 2 * pad) / rawH);
  const offsetX = (width - rawW * scale) / 2;
  const offsetY = (height - rawH * scale) / 2;
  return ([lon, lat]) => [
    round(offsetX + (lon - minLon) * cosLat * scale, 1),
    round(offsetY + (maxLat - lat) * scale, 1),
  ];
}

function polygonsToSvgPath(polygons, project, tol) {
  const parts = [];
  for (const rings of polygons) {
    for (const ring of rings) {
      const projected = ring.map(project);
      const isClosed =
        projected.length > 2 &&
        projected[0][0] === projected.at(-1)[0] &&
        projected[0][1] === projected.at(-1)[1];
      const open = isClosed ? projected.slice(0, -1) : projected;
      if (open.length < 3) continue;
      // Split at furthest point for closed ring simplification
      const mid = Math.floor(open.length / 2);
      const h1 = douglasPeucker(open.slice(0, mid + 1), tol);
      const h2 = douglasPeucker([...open.slice(mid), open[0]], tol);
      const simplified = [...h1.slice(0, -1), ...h2.slice(0, -1)].map(([x, y]) => [round(x, 1), round(y, 1)]);
      if (simplified.length < 3) continue;
      parts.push(
        `M${simplified[0][0]},${simplified[0][1]}` +
          simplified
            .slice(1)
            .map(([x, y]) => `L${x},${y}`)
            .join("") +
          "Z"
      );
    }
  }
  return parts.join("");
}

console.log("Fetching CSVs and e-Stat boundary ZIP...");
const [buf24, buf26, kmlZipBuf] = await Promise.all([
  fetchBuffer(CSV_2024_URL),
  fetchBuffer(CSV_2026_URL),
  fetchBuffer(ESTAT_KML_ZIP_URL),
]);

const d24 = parseTownCsv(decodeCsvBuffer(buf24));
const d26 = parseTownCsv(decodeCsvBuffer(buf26));
assert.equal(d24.length, 199);
assert.equal(d26.length, 199);

const map24 = new Map(d24.map((r) => [r.code, r]));
for (const r of d26) {
  const p = map24.get(r.code);
  assert(p && p.name === r.name, `Row mismatch for ${r.code} ${r.name}`);
}

const outerEntries = unzipEntries(kmlZipBuf);
const kmzEntry = outerEntries.find((e) => e.name.endsWith(".kmz"));
assert(kmzEntry, "KMZ not found in e-Stat ZIP");
const innerEntries = unzipEntries(kmzEntry.buf);
const kmlEntry = innerEntries.find((e) => e.name.endsWith(".kml"));
assert(kmlEntry, "KML not found inside KMZ");
const kmlFeatures = parseKmlPolygons(kmlEntry.buf.toString("utf8"));
assert(kmlFeatures.length > 0, "No KML features parsed");

// Group KML features by normalized town name
const kmlByTown = new Map();
for (const f of kmlFeatures) {
  if (!kmlByTown.has(f.normName)) kmlByTown.set(f.normName, []);
  kmlByTown.get(f.normName).push(f);
}

const allHachiojiVertices = [];
for (const f of kmlFeatures) {
  for (const poly of f.polygons) {
    for (const ring of poly) {
      for (const pt of ring) allHachiojiVertices.push(pt);
    }
  }
}

const projectMap = createProjector(allHachiojiVertices, 800, 560, 24);

// Ueno Dai-ni land readjustment (2024-08-10) affected districts
const BOUNDARY_CHANGED_NORM = new Set(["上野町", "小門町", "台町3丁目", "台町4丁目"]);

const towns = [];
const auditRows = [];
let matchedCount = 0;

for (const r26 of d26) {
  const r24 = map24.get(r26.code);
  const norm = normTownName(r26.name);
  const kmlList = kmlByTown.get(norm);
  assert(kmlList && kmlList.length > 0, `Unmatched town: ${r26.code} ${r26.name} (${norm})`);
  matchedCount++;

  const allPolys = kmlList.flatMap((f) => f.polygons);
  const path = polygonsToSvgPath(allPolys, projectMap, 0.45);
  assert(path.length > 0, `Empty SVG path for ${r26.name}`);

  const keyCodes = [...new Set(kmlList.map((f) => f.keyCode))];
  let status = "comparable";
  if (BOUNDARY_CHANGED_NORM.has(norm)) {
    status = "boundary_changed";
  } else if (r26.foreign < 10 || r24.total < 100 || r26.total < 100) {
    status = "suppressed";
  }

  auditRows.push({
    code: r26.code,
    csvName: r26.name,
    normalizedName: norm,
    estatSNames: [...new Set(kmlList.map((f) => f.sName))],
    estatKeyCodes: keyCodes,
    polygonCount: allPolys.length,
    status,
  });

  if (status === "comparable") {
    const share2024 = round((r24.foreign / r24.total) * 100, 2);
    const share2026 = round((r26.foreign / r26.total) * 100, 2);
    towns.push({
      code: r26.code,
      name: r26.name,
      status,
      path,
      foreign2024: r24.foreign,
      total2024: r24.total,
      share2024,
      foreign2026: r26.foreign,
      total2026: r26.total,
      share2026,
      foreignDiff: r26.foreign - r24.foreign,
      sharePointDiff: round(share2026 - share2024, 2),
    });
  } else {
    towns.push({
      code: r26.code,
      name: r26.name,
      status,
      path,
      foreign2024: null,
      total2024: null,
      share2024: null,
      foreign2026: null,
      total2026: null,
      share2026: null,
      foreignDiff: null,
      sharePointDiff: null,
      note:
        status === "boundary_changed"
          ? "2024年8月10日施行の上野第二地区土地区画整理事業による住所変更対象のため比較対象外"
          : "少人数（外国人10人未満または総人口100人未満）のため個別数値を非表示",
    });
  }
}

assert.equal(matchedCount, 199);
assert.equal(kmlByTown.size, 199);
assert.equal(towns.filter((t) => t.status === "boundary_changed").length, 4);

const comparableTowns = towns.filter((t) => t.status === "comparable");
const top10Increase = [...comparableTowns]
  .sort((a, b) => b.sharePointDiff - a.sharePointDiff || b.foreignDiff - a.foreignDiff || a.code.localeCompare(b.code))
  .slice(0, 10)
  .map(({ path: _path, ...rest }) => rest);

const bottom10Change = [...comparableTowns]
  .sort((a, b) => a.sharePointDiff - b.sharePointDiff || a.foreignDiff - b.foreignDiff || a.code.localeCompare(b.code))
  .slice(0, 10)
  .map(({ path: _path, ...rest }) => rest);

const cityTotal24 = d24.reduce((s, r) => s + r.total, 0);
const cityForeign24 = d24.reduce((s, r) => s + r.foreign, 0);
const cityTotal26 = d26.reduce((s, r) => s + r.total, 0);
const cityForeign26 = d26.reduce((s, r) => s + r.foreign, 0);

const stationCoords = [
  { name: "八王子駅", lon: 139.3389, lat: 35.6556 },
  { name: "高尾駅", lon: 139.2823, lat: 35.6422 },
  { name: "南大沢駅", lon: 139.3797, lat: 35.6138 },
  { name: "北八王子駅", lon: 139.3632, lat: 35.6693 },
];

const townMapOutput = {
  generatedOn: "2026-11-28",
  viewBox: "0 0 800 560",
  comparisonDates: { from: "2024-04-30", to: "2026-10-31" },
  suppressionRule: "2026年10月末の外国人住民数が10人未満、または2024年4月末・2026年10月末のいずれかの総人口が100人未満の町丁は個別数値を非表示",
  boundaryChangedRule: "2024年8月10日施行の上野第二地区土地区画整理事業の対象4町丁（上野町、小門町、台町３丁目、台町４丁目）を比較対象外",
  sources: {
    csv2024: { url: CSV_2024_URL, sha256: sha256(buf24) },
    csv2026: { url: CSV_2026_URL, sha256: sha256(buf26) },
    boundary2020: { url: ESTAT_KML_ZIP_URL, sha256: sha256(kmlZipBuf) },
  },
  counts: {
    totalTowns: towns.length,
    comparableTowns: comparableTowns.length,
    suppressedTowns: towns.filter((t) => t.status === "suppressed").length,
    boundaryChangedTowns: towns.filter((t) => t.status === "boundary_changed").length,
  },
  cityTotals: {
    from: { date: "2024-04-30", total: cityTotal24, foreign: cityForeign24, share: round((cityForeign24 / cityTotal24) * 100, 2) },
    to: { date: "2026-10-31", total: cityTotal26, foreign: cityForeign26, share: round((cityForeign26 / cityTotal26) * 100, 2) },
  },
  stations: stationCoords.map((st) => {
    const [x, y] = projectMap([st.lon, st.lat]);
    return { ...st, x, y };
  }),
  top10Increase,
  bottom10Change,
  towns,
};

writeFileSync(
  new URL("../public/data/hachioji-international/town-map.json", import.meta.url),
  JSON.stringify(townMapOutput) + "\n",
  "utf8"
);

writeFileSync(
  new URL("../docs/task/hachioji-deepening/town-matching-audit.json", import.meta.url),
  JSON.stringify(
    {
      generatedOn: "2026-11-28",
      matchedCount,
      totalCsvRows: d26.length,
      unmatchedCount: 0,
      coveragePercent: 100,
      rows: auditRows,
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  `Generated town-map.json (${(Buffer.byteLength(JSON.stringify(townMapOutput)) / 1024).toFixed(1)} KB):`,
  townMapOutput.counts
);

// --- M2: Campus locations for Article 5 ---
console.log("Fetching university roster and geocoding addresses...");
const rosterHtml = (await fetchBuffer(ROSTER_URL)).toString("utf8");
const trs = [...rosterHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].slice(1);

async function geocodeGsi(query) {
  const r = await fetch(
    "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" + encodeURIComponent(query),
    { signal: AbortSignal.timeout(15000) }
  );
  assert.equal(r.status, 200, `GSI search failed for ${query}`);
  const arr = await r.json();
  assert(arr.length > 0 && Array.isArray(arr[0]?.geometry?.coordinates), `No GSI match for ${query}`);
  const [lon, lat] = arr[0].geometry.coordinates;
  return { lon: round(lon, 6), lat: round(lat, 6), gsiTitle: arr[0].properties?.title ?? "" };
}

const schools = [];
for (const m of trs) {
  const cells = [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
    c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
  );
  if (cells.length < 4) continue;
  const [noStr, nameRaw, addrRaw, opened] = cells;
  const name = nameRaw.trim();
  const addr = addrRaw.trim();
  const inHachiojiCity = !/^(日野市|町田市|多摩市)/.test(addr);
  const fullAddr = inHachiojiCity ? `東京都八王子市${addr}` : `東京都${addr}`;
  const geo = await geocodeGsi(fullAddr);
  schools.push({
    no: Number(noStr),
    name,
    address: addr,
    fullAddress: fullAddr,
    opened,
    inHachiojiCity,
    lon: geo.lon,
    lat: geo.lat,
    gsiTitle: geo.gsiTitle,
  });
}
assert.equal(schools.length, 25, `Expected 25 schools, got ${schools.length}`);

const relocationsRaw = [
  {
    date: "2015-04",
    school: "拓殖大学",
    fromCampus: "八王子キャンパス（現・八王子国際キャンパス）",
    fromAddress: "東京都八王子市館町815-1",
    toCampus: "文京キャンパス",
    toAddress: "東京都文京区小日向3-4-14",
    summary: "商学部・政経学部の1・2年生が八王子から文京へ移転（文京での4年間一貫教育）。外国語・国際・工学の3学部は八王子国際で継続。",
    source: "https://www.takushoku-u.ac.jp/summary/renaissance/",
  },
  {
    date: "2016-04",
    school: "杏林大学",
    fromCampus: "八王子キャンパス",
    fromAddress: "東京都八王子市宮下町476",
    toCampus: "井の頭キャンパス",
    toAddress: "東京都三鷹市下連雀5-4-1",
    summary: "保健学部（看護学科看護学専攻を除く）・総合政策学部・外国語学部などが三鷹市の井の頭キャンパスへ移転。",
    source: "https://www.kyorin-u.ac.jp/cn/html/kyorin/00003/201602261/index.html",
  },
  {
    date: "2023-04",
    school: "中央大学",
    fromCampus: "多摩キャンパス",
    fromAddress: "東京都八王子市東中野742-1",
    toCampus: "茗荷谷キャンパス",
    toAddress: "東京都文京区大塚1-4-1",
    summary: "法学部1～4年生と大学院法学研究科が文京区の茗荷谷キャンパスへ移転（多摩キャンパスは他学部で継続使用）。",
    source: "https://www.chuo-u.ac.jp/aboutus/communication/press/2021/10/56658/",
  },
];

const relocations = [];
for (const rel of relocationsRaw) {
  const fromGeo = await geocodeGsi(rel.fromAddress);
  const toGeo = await geocodeGsi(rel.toAddress);
  relocations.push({
    ...rel,
    fromLon: fromGeo.lon,
    fromLat: fromGeo.lat,
    toLon: toGeo.lon,
    toLat: toGeo.lat,
  });
}

const localPoints = [
  ...allHachiojiVertices,
  ...schools.map((s) => [s.lon, s.lat]),
];
const widePoints = [
  ...localPoints,
  ...relocations.map((r) => [r.toLon, r.toLat]),
];

const projectLocal = createProjector(localPoints, 800, 520, 32);
const projectWide = createProjector(widePoints, 800, 420, 36);

// Coarse town silhouettes for city background
const localCityPaths = [];
const wideCityPaths = [];
for (const f of kmlFeatures) {
  const lp = polygonsToSvgPath(f.polygons, projectLocal, 1.5);
  const wp = polygonsToSvgPath(f.polygons, projectWide, 1.8);
  if (lp) localCityPaths.push(lp);
  if (wp) wideCityPaths.push(wp);
}

// Group schools sharing exact same coordinates so pins never overlap invisibly
const groupMap = new Map();
for (const s of schools) {
  const key = `${s.lon},${s.lat}`;
  if (!groupMap.has(key)) groupMap.set(key, []);
  groupMap.get(key).push(s);
}
const relocatedSchools = new Set(relocations.map((r) => r.school));

const markers = [...groupMap.values()].map((list, idx) => {
  const [lx, ly] = projectLocal([list[0].lon, list[0].lat]);
  const [wx, wy] = projectWide([list[0].lon, list[0].lat]);
  return {
    id: `campus-${idx + 1}`,
    lon: list[0].lon,
    lat: list[0].lat,
    address: list[0].address,
    fullAddress: list[0].fullAddress,
    inHachiojiCity: list[0].inHachiojiCity,
    hasRelocation: list.some((s) => relocatedSchools.has(s.name)),
    local: { x: lx, y: ly },
    wide: { x: wx, y: wy },
    schools: list.map(({ no, name, opened }) => ({ no, name, opened })),
  };
});

const campusOutput = {
  generatedOn: "2026-11-28",
  rosterDate: "2025-05-01",
  sources: {
    rosterUrl: ROSTER_URL,
    geocoder: "国土地理院 ジオコーディングAPI（AddressSearch）",
    cityBoundaryUrl: ESTAT_KML_ZIP_URL,
  },
  localView: {
    viewBox: "0 0 800 520",
    cityPaths: localCityPaths,
    stations: stationCoords.map((st) => {
      const [x, y] = projectLocal([st.lon, st.lat]);
      return { ...st, x, y };
    }),
  },
  wideView: {
    viewBox: "0 0 800 420",
    cityPaths: wideCityPaths,
    areaLabels: [
      { name: "八王子市", ...(() => { const [x, y] = projectWide([139.316, 35.655]); return { x, y }; })() },
      { name: "三鷹市", ...(() => { const [x, y] = projectWide([139.569, 35.685]); return { x, y }; })() },
      { name: "文京区", ...(() => { const [x, y] = projectWide([139.736, 35.717]); return { x, y }; })() },
    ],
  },
  schools,
  markers,
  relocations: relocations.map((r) => {
    const [fx, fy] = projectWide([r.fromLon, r.fromLat]);
    const [tx, ty] = projectWide([r.toLon, r.toLat]);
    return {
      ...r,
      wideFrom: { x: fx, y: fy },
      wideTo: { x: tx, y: ty },
    };
  }),
};

writeFileSync(
  new URL("../public/data/hachioji-students/campus-locations.json", import.meta.url),
  JSON.stringify(campusOutput) + "\n",
  "utf8"
);
console.log(
  `Generated campus-locations.json (${(Buffer.byteLength(JSON.stringify(campusOutput)) / 1024).toFixed(1)} KB):`,
  { schools: schools.length, markers: markers.length, relocations: relocations.length }
);
