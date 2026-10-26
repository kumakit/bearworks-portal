import data from "@/app/(monetized)/labs/hachioji-aging/data/hachioji-aging-2026-10-26.r1.json";
export const agingBundle = data;
export type AgingRegion = (typeof data.regions)[number];
export const agingNumber = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
export const agingShare = (value: number | null) => value === null ? "算出なし" : `${value.toFixed(1)}%`;
export const agingSigned = (value: number, digits = 0) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${new Intl.NumberFormat("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(value))}`;
