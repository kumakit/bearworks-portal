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
