import bundle from "@/app/(monetized)/labs/hachioji-snow/data/hachioji-snow-2026-09-14.r1.json";
import lock from "@/app/(monetized)/labs/hachioji-snow/data/lock.json";

export const snowBundle = bundle;
export const snowLock = lock;
export type SnowCase = typeof bundle.cases[number];
export const percent = (n: number) => `${(100 * n).toFixed(1)}%`;
export function quantile(values: number[], p: number) {
  const a = [...values].sort((x, y) => x - y);
  const i = (a.length - 1) * p;
  return a[Math.floor(i)] + (a[Math.ceil(i)] - a[Math.floor(i)]) * (i % 1);
}
export function regression(points: number[][]) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[2], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  let xx = 0, yy = 0, xy = 0;
  for (const p of points) { xx += (p[2] - mx) ** 2; yy += (p[1] - my) ** 2; xy += (p[2] - mx) * (p[1] - my); }
  return { r: xy / Math.sqrt(xx * yy), slope: xy / xx, intercept: my - xy / xx * mx };
}
