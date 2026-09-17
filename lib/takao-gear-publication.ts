import bundleJson from "@/app/(monetized)/labs/takao-gear/data/takao-gear-2026-09-17.r1.json";
import lockJson from "@/app/(monetized)/labs/takao-gear/data/takao-gear-2026-09-17.r1.lock.json";

export type RouteDifficulty = "beginner" | "intermediate" | "advanced";

export type RouteItem = {
  id: string;
  name: string;
  distance_km: number;
  elevation_gain_m: number;
  estimated_time_up_min: number;
  paved_ratio: number;
  difficulty: RouteDifficulty;
  footwear_normal: string;
  footwear_rain: string;
  features: string;
};

export type LayeringPresetKey = "freezing" | "cold" | "mild" | "warm";

export type LayeringPreset = {
  key: LayeringPresetKey;
  label: string;
  temp_range: string;
  base: string;
  mid: string;
  outer: string;
  gear: string[];
};

export type MonthlyComparisonRow = {
  month: number;
  month_name: string;
  takao: {
    avg_temp: number;
    avg_apparent_temp: number;
    midday_temp: number;
    midday_apparent_temp: number;
    morning_apparent_temp: number;
    avg_wind_speed: number;
  };
  hachioji: {
    midday_temp: number;
    midday_apparent_temp: number;
  };
  tokyo: {
    midday_temp: number;
    midday_apparent_temp: number;
  };
  gap: {
    temp_gap: number;
    apparent_gap: number;
    tokyo_apparent_gap: number;
    departure_gap: number;
  };
};

export type MonthlyGearDay = {
  month: number;
  month_name: string;
  total_days: number;
  warm_clothes_days: number;
  rainwear_days: number;
  crampons_days: number;
  mud_risk_days: number;
};

export type GearDaysSummary = {
  total_days: number;
  warm_clothes_required_days: number;
  rainwear_required_days: number;
  crampons_caution_days: number;
  mud_risk_days: number;
  monthly_gear_days: MonthlyGearDay[];
};

export type TakaoGearBundle = {
  bundle_version: string;
  bundle_schema_version: string;
  generated_at: string;
  attribution: {
    source_name: string;
    source_url: string;
    processing_ja: string;
  };
  coordinates: {
    takao_summit: { name: string; latitude: number; longitude: number; elevation: number };
    hachioji: { name: string; latitude: number; longitude: number; elevation: number };
    tokyo: { name: string; latitude: number; longitude: number; elevation: number };
  };
  routes: RouteItem[];
  layering_presets: Record<LayeringPresetKey, LayeringPreset>;
  monthly_comparison: MonthlyComparisonRow[];
  gear_days_summary: GearDaysSummary;
};

export const takaoGearBundle = bundleJson as unknown as TakaoGearBundle;
export const takaoGearLock = lockJson;

export const routes = takaoGearBundle.routes;
export const layeringPresets = takaoGearBundle.layering_presets;
export const monthlyComparison = takaoGearBundle.monthly_comparison;
export const gearDaysSummary = takaoGearBundle.gear_days_summary;

export const fmt = (val: number, digits = 1) => val.toFixed(digits);
