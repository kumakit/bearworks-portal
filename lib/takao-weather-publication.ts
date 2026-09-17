import bundleJson from "@/app/(monetized)/labs/takao-weather-shift/data/takao-weather-shift-2026-09-17.r1.json";
import lockJson from "@/app/(monetized)/labs/takao-weather-shift/data/takao-weather-shift-2026-09-17.r1.lock.json";

export type AnnualSummary = {
  total_days: number;
  gas_days: number;
  gas_days_pct: number;
  apparent_sunny_gas_days: number;
  apparent_sunny_gas_days_pct: number;
  afternoon_shift_days: number;
  rain_snow_border_days: number;
};

export type MonthlySummaryRow = {
  month: number;
  total_days: number;
  gas_days: number;
  apparent_sunny_gas_days: number;
  afternoon_shift_days: number;
  rain_snow_border_days: number;
  avg_summit_humidity: number;
  avg_base_humidity: number;
  humidity_gap: number;
};

export type SummerHourlySlot = {
  hour: number;
  hour_label: string;
  rain_probability: number;
  heavy_rain_probability: number;
  high_humidity_rate: number;
  gas_probability: number;
  avg_temperature: number;
  avg_cloud_cover: number;
};

export type MechanismStep = {
  step: number;
  title: string;
  description: string;
};

export type RiskCheckerLevel = {
  code: "safe" | "notice" | "warning" | "danger";
  label: string;
  color: "emerald" | "amber" | "orange" | "rose";
  score_range: [number, number];
};

export type TakaoWeatherBundle = {
  metadata: {
    generated_at: string;
    dataset_version: string;
    year: number;
    points: {
      takao_summit: { name: string; latitude: number; longitude: number; elevation: number };
      hachioji: { name: string; latitude: number; longitude: number; elevation: number };
    };
    description: string;
  };
  annual_summary: AnnualSummary;
  monthly_summary: MonthlySummaryRow[];
  summer_hourly_matrix: SummerHourlySlot[];
  mechanisms: MechanismStep[];
  risk_checker_engine: {
    description: string;
    levels: RiskCheckerLevel[];
  };
};

export const takaoWeatherBundle = bundleJson as unknown as TakaoWeatherBundle;
export const takaoWeatherLock = lockJson as {
  file: string;
  byte_size: number;
  sha256: string;
  generated_at: string;
};

export const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];
