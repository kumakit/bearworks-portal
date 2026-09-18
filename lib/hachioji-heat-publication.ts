import bundleJson from "@/app/(monetized)/labs/hachioji-heat/data/hachioji-heat-2026-09-17.r1.json";
import lockJson from "@/app/(monetized)/labs/hachioji-heat/data/hachioji-heat-2026-09-17.r1.lock.json";

export type StationKey = "hachioji" | "tokyo" | "fuchu" | "ome";

export type AnnualMetrics = {
  heatstroke_days: number;
  midsummer_days: number;
  min_temp_ge25_days: number;
  winter_days?: number;
  median_daily_range_c: number;
};

export type AnnualRow = {
  year: number;
  hachioji: AnnualMetrics;
  tokyo: AnnualMetrics;
  fuchu: AnnualMetrics | null;
  ome: AnnualMetrics | null;
};

export type HourlyPoint = {
  datetime: string;
  date: string;
  hour: number;
  hachioji: {
    temp: number | null;
    precip: number | null;
    quality: number;
  };
  tokyo: {
    temp: number | null;
    precip: number | null;
    quality: number;
  };
  delta: number | null;
};

export type HourlyCase = {
  id: string;
  name: string;
  description: string;
  series: HourlyPoint[];
};

export type CoolingRate = {
  case_id: string;
  name: string;
  temp_18h: { hachioji: number; tokyo: number };
  temp_05h: { hachioji: number; tokyo: number };
  cooling_amount: { hachioji: number; tokyo: number };
  hourly_cooling_rate: { hachioji: number; tokyo: number };
};

export type HeatBundle = {
  bundle_version: string;
  bundle_schema_version: string;
  generated_at: string;
  attribution: {
    source_name: string;
    source_url: string;
    processing_ja: string;
  };
  stations: Array<{
    key: StationKey;
    station_id: string;
    name: string;
    prefecture: string;
    type: string;
  }>;
  summary: {
    all_time_record_high: {
      hachioji: { temp: number; date: string };
      tokyo: { temp: number; date: string };
    };
    recent_averages_2020_2025: {
      heatstroke_days: Record<StationKey, number>;
      midsummer_days: Record<StationKey, number>;
      min_temp_ge25_days: Record<StationKey, number>;
      median_daily_range_c: Record<StationKey, number>;
    };
  };
  annual_comparison: AnnualRow[];
  hourly_cases: HourlyCase[];
  cooling_rates: CoolingRate[];
};

export const heatBundle = bundleJson as unknown as HeatBundle;
export const heatLock = lockJson;

export const summary = heatBundle.summary;
export const annualComparison = heatBundle.annual_comparison;
export const hourlyCases = heatBundle.hourly_cases;
export const coolingRates = heatBundle.cooling_rates;

export const fmt = (val: number, digits = 1) => val.toFixed(digits);

export type HeatMetric = "heatstroke_days" | "min_temp_ge25_days";
export const recentYears = annualComparison.filter(row => row.year >= 2020 && row.year <= 2025);
export const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
export const recentDifference = (metric: HeatMetric) => average(recentYears.map(row => row.hachioji[metric] - row.tokyo[metric]));
export const signed = (value: number, digits = 1) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;

// Same annual common-homogeneity intervals as the first article (H1/H2).
// Boundary years 2008 and 2014 are intentionally not connected or pooled.
export const comparisonPeriods = [
  { start: 1990, end: 2002 },
  { start: 2003, end: 2007 },
  { start: 2009, end: 2013 },
  { start: 2015, end: 2025 },
];

export const caseDate = (item: HourlyCase) => item.series[0].date;
export const caseLabel = (item: HourlyCase) => caseDate(item).replaceAll("-", "/");
export const validTemperature = (point: HourlyPoint, station: "hachioji" | "tokyo") =>
  point[station].quality === 8 && Number.isFinite(point[station].temp) ? point[station].temp : null;
export const temperatureDifference = (point: HourlyPoint) => {
  const h = validTemperature(point, "hachioji");
  const t = validTemperature(point, "tokyo");
  return h === null || t === null ? null : Math.round((h - t) * 10) / 10;
};

export function caseCooling(item: HourlyCase) {
  const start = item.series.find(point => point.date === caseDate(item) && point.hour === 18);
  const end = item.series.find(point => point.date !== caseDate(item) && point.hour === 5);
  if (!start || !end) throw new Error(`Missing cooling endpoints: ${item.id}`);
  const hours = (Date.parse(end.datetime) - Date.parse(start.datetime)) / 3_600_000;
  if (hours !== 11) throw new Error(`Invalid cooling interval: ${item.id}`);
  const values = (station: "hachioji" | "tokyo") => {
    const from = validTemperature(start, station);
    const to = validTemperature(end, station);
    if (from === null || to === null) throw new Error(`Invalid cooling temperature: ${item.id}`);
    const drop = Math.round((from - to) * 10) / 10;
    return { from, to, drop, rate: drop / hours };
  };
  return { hours, hachioji: values("hachioji"), tokyo: values("tokyo") };
}
