import bundleJson from "@/app/(monetized)/labs/hachioji-chill/data/hachioji-chill-2026-09-18.r1.json";
import lockJson from "@/app/(monetized)/labs/hachioji-chill/data/hachioji-chill-2026-09-18.r1.lock.json";

export type StationKey = "hachioji" | "tokyo";
export type DiurnalStationKey = "hachioji" | "tokyo" | "fuchu" | "ome";
export type ChillConditionKey = "calm_dry" | "windy" | "precip" | "normal";

export type HourlyProfileItem = {
  hour: number;
  sample_size: number;
  hachioji: {
    median: number;
    q25: number;
    q75: number;
    mean: number;
  };
  tokyo: {
    median: number;
    q25: number;
    q75: number;
    mean: number;
  };
  delta: {
    median: number;
    q25: number;
    q75: number;
    mean: number;
  };
};

export type HistogramBin = {
  range_label: string;
  bin_min: number;
  bin_max: number;
  count: number;
  pct: number;
};

export type ConditionStats = {
  count: number;
  median: number;
  q25: number;
  q75: number;
  mean: number;
  pct_le_minus3: number;
  pct_le_minus5: number;
};

export type ConditionItem = {
  name: string;
  description: string;
  stats: ConditionStats;
};

export type CalendarDay = {
  date: string;
  season: number;
  hachioji_7am: number;
  tokyo_7am: number;
  delta_7am: number;
  delta_8am: number | null;
  delta_14pm: number | null;
  night_wind_avg: number | null;
  night_precip_sum: number;
  condition: ChillConditionKey;
};

export type RepresentativeCase = {
  id: string;
  name: string;
  date: string;
  description: string;
  hachioji_7am: number;
  tokyo_7am: number;
  delta_7am: number;
  condition: string;
};

export type DiurnalRangeItem = {
  count: number;
  median: number;
  q25: number;
  q75: number;
  mean: number;
  min: number;
  max: number;
};

export type ChillStation = {
  key: StationKey;
  name: string;
  code: string;
  block_no: string;
  kind: string;
  elements_available: string[];
  note: string;
};

export type ChillLock = {
  lock_schema_version: string;
  bundle_file: string;
  bundle_version: string;
  bundle_schema_version: string;
  bundle_byte_size: number;
  bundle_sha256: string;
  generated_at: string;
};

export type ChillBundle = {
  bundle_version: string;
  bundle_schema_version: string;
  generated_at: string;
  attribution: {
    source_name: string;
    source_url: string;
    license_terms: string;
  };
  stations: ChillStation[];
  summary: {
    period: {
      hourly_start: string;
      hourly_end: string;
      hourly_seasons_count: number;
      total_days_analyzed: number;
    };
    morning_7am: {
      median_gap: number;
      mean_gap: number;
      q25_gap: number;
      q75_gap: number;
      pct_hachioji_colder: number;
      pct_gap_le_minus3: number;
      pct_gap_le_minus5: number;
      max_negative_gap: number;
    };
    afternoon_14pm: {
      median_gap: number;
      mean_gap: number;
    };
    diurnal_range_winter: {
      hachioji_median: number;
      tokyo_median: number;
      difference_median: number;
    };
  };
  hourly_profile: HourlyProfileItem[];
  morning_gap_histogram: HistogramBin[];
  condition_summary: {
    calm_dry: ConditionItem;
    windy: ConditionItem;
    precip: ConditionItem;
  };
  diurnal_range_comparison: Record<DiurnalStationKey, DiurnalRangeItem>;
  calendar_days: CalendarDay[];
  representative_cases: RepresentativeCase[];
};

export const chillBundle = bundleJson as unknown as ChillBundle;
export const chillLock = lockJson as ChillLock;

export const summary = chillBundle.summary;
export const hourlyProfile = chillBundle.hourly_profile;
export const morningHistogram = chillBundle.morning_gap_histogram;
export const conditionSummary = chillBundle.condition_summary;
export const diurnalRange = chillBundle.diurnal_range_comparison;
export const calendarDays = chillBundle.calendar_days;
export const representativeCases = chillBundle.representative_cases;

export function fmt(value: number | null | undefined, digits: number = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "―";
  return value.toFixed(digits);
}

export function signed(value: number | null | undefined, digits: number = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "―";
  const formatted = Math.abs(value).toFixed(digits);
  if (parseFloat(formatted) === 0) return formatted;
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatted}`;
}

export const availableSeasons: number[] = Array.from(
  new Set(calendarDays.map((d) => d.season))
).sort((a, b) => b - a);

export function getAvailableSeasons(): number[] {
  return availableSeasons;
}
