import data from "@/app/(monetized)/labs/hachioji-land-prices/data/hachioji-land-prices-2026-10-26.r1.json";

export const landPriceBundle = data;
export type LandPricePoint = (typeof data.points)[number];
export type LandPriceCity = (typeof data.cities)[number];
export const landYen = (value: number) => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(value);
export const landMan = (value: number) => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(value / 10000);
export const landPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

/** Web Mercator world pixel coordinates; same transform for GSI tiles and points. */
export function landWorldPixel(longitude: number, latitude: number, zoom: number) {
  const size = 256 * 2 ** zoom;
  const sin = Math.sin(latitude * Math.PI / 180);
  return { x: (longitude + 180) / 360 * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
}
