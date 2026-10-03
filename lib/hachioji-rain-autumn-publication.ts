import rain from "@/app/(monetized)/labs/hachioji-rain/data/hachioji-rain-2026-10-04.r1.json";
import rainLock from "@/app/(monetized)/labs/hachioji-rain/data/hachioji-rain-2026-10-04.r1.lock.json";
import autumn from "@/app/(monetized)/labs/hachioji-autumn/data/hachioji-autumn-2026-10-04.r1.json";
import autumnLock from "@/app/(monetized)/labs/hachioji-autumn/data/hachioji-autumn-2026-10-04.r1.lock.json";

export { rain as rainBundle, rainLock, autumn as autumnBundle, autumnLock };
export type RainData = typeof rain.main;
export type AutumnData = typeof autumn.main;
export const climateNumber = (value: number, digits = 1) => value.toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits });
