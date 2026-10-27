import data from "@/app/(monetized)/labs/hachioji-city-center/data/hachioji-city-center-2026-10-27.r1.json";

export const cityCenterBundle = data;
export type CityCenterData = typeof data;
export const cityNumber = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
export const citySigned = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${cityNumber(Math.abs(value))}`;
export const cityPercent = (value: number | null) => value === null ? "算出なし" : `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(1)}%`;
