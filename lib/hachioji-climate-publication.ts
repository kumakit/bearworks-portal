import "server-only";

import bundleJson from "@/app/(monetized)/labs/hachioji-climate/data/hachioji-climate-2026-08-11.r1.json";
import lockJson from "@/app/(monetized)/labs/hachioji-climate/data/hachioji-climate-2026-08-11.r1.lock.json";

type Metrics = {
  heatstroke_days: number;
  median_daily_range_c: number;
  midsummer_days: number;
  min_temp_ge25_days: number;
  winter_days: number;
};

type AnnualRow = {
  metrics: Metrics;
  period_id: number;
  station_key: string;
};

type Segment = {
  delta: number;
  period_end: number;
  period_start: number;
  period_type: "annual" | "summer" | "winter";
};

type Hypothesis = {
  hypothesis_id: string;
  metric: string;
  outcome: "supported" | "not_supported";
  permission: "allowed" | "caution" | "prohibited";
  segments: Segment[];
  threshold_description: string;
};

type Station = {
  display_name_ja: string;
  jma_observation_number: string;
  observation_kind_code: string;
  station_key: string;
};

type PublicationBundle = {
  aggregates: { annual: AnnualRow[] };
  analysis_scope: {
    complete_winter_seasons: { first: number; last: number };
    end_date: string;
    start_date: string;
  };
  attribution: { processing_ja: string; source_ja: string; source_url: string };
  bundle_version: string;
  hypotheses: Hypothesis[];
  quality_contract: {
    aggregatable_codes: number[];
    publication_coverage_threshold: number;
  };
  schema_version: string;
  stations: Station[];
  warnings: Array<{
    code: string;
    counts_by_station?: Record<string, number>;
    message_ja: string;
  }>;
};

export const climateBundle = bundleJson as PublicationBundle;
export const climateLock = lockJson;

const stationOrder = ["hachioji", "fuchu", "ome", "tokyo"];

export const recentStationSummaries = stationOrder.map((stationKey) => {
  const rows = climateBundle.aggregates.annual.filter(
    (row) => row.station_key === stationKey && row.period_id >= 2020 && row.period_id <= 2025,
  );
  const station = climateBundle.stations.find((item) => item.station_key === stationKey);
  if (!station || rows.length !== 6) {
    throw new Error(`Missing 2020-2025 climate data for ${stationKey}`);
  }

  const average = (metric: keyof Metrics) =>
    rows.reduce((sum, row) => sum + row.metrics[metric], 0) / rows.length;

  return {
    key: stationKey,
    name: station.display_name_ja,
    heatstrokeDays: average("heatstroke_days"),
    midsummerDays: average("midsummer_days"),
    tropicalNightEquivalentDays: average("min_temp_ge25_days"),
    winterDays: average("winter_days"),
    dailyRange: average("median_daily_range_c"),
  };
});

export const hypothesisById = Object.fromEntries(
  climateBundle.hypotheses.map((hypothesis) => [hypothesis.hypothesis_id, hypothesis]),
) as Record<string, Hypothesis>;

export function deltaRange(hypothesisId: string) {
  const deltas = hypothesisById[hypothesisId].segments.map((segment) => segment.delta);
  return { min: Math.min(...deltas), max: Math.max(...deltas) };
}
