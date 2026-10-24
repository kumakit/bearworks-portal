import bundle from "@/app/(monetized)/labs/hachioji-population/data/hachioji-population-2026-10-24.r1.json";

export const populationBundle = bundle;
export type PopulationBundle = typeof bundle;
export const populationNumber = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
export const populationSigned = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${populationNumber(Math.abs(value))}`;
export const populationPercent = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(2)}%`;
