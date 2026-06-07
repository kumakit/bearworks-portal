/**
 * 🌌 Personal Dashboard Frontend Utilities & Types
 */

export interface HourlyMetric {
  hour: string; // "00:00", "01:00", etc.
  googleRequests: number;
  googleErrors: number;
  cloudflareRequests: number;
  cloudflareThreats: number;
}

export interface ProjectBilling {
  id: string;
  costUSD: number;
}

export interface GoogleBilling {
  limitUSD: number;
  currentMonthTotalUSD: number;
  usagePercent: number;
  projects: ProjectBilling[];
  modelCosts: { [key: string]: number }; // e.g. { "Gemini 1.5 Pro": 1.20 }
}

export interface DailyCost30d {
  date: string; // "05-20", etc.
  costs: { [projectId: string]: number }; // Mapping of projectId -> cost
  total: number;
}

export interface BigQueryUsage {
  limitQueryGB: number;
  currentMonthQueryGB: number;
  usageQueryPercent: number;
  limitStorageGB: number;
  currentMonthStorageGB: number;
  usageStoragePercent: number;
}

export interface DailyBigQueryUsage30d {
  date: string;
  usageGB: number;
}

export interface DashboardSummary {
  googleTotalRequests24h: number;
  googleTotalErrors24h: number;
  googleErrorRate24h: number;
  cloudflareTotalRequests24h: number;
  cloudflareTotalThreats24h: number;
  cloudflareCacheRate24h: number;
  googleBilling: GoogleBilling;
  bigqueryUsage: BigQueryUsage;
}

export interface DashboardData {
  updatedAt: string; // ISO String
  summary: DashboardSummary;
  hourly: HourlyMetric[];
  dailyCosts30d: DailyCost30d[];
  bigqueryDailyUsage30d: DailyBigQueryUsage30d[];
}


/**
 * 日付文字列を相対表記（「〇分前」など）に変換する
 */
export function getRelativeTime(isoString: string): string {
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  } catch (e) {
    return "不明";
  }
}

/**
 * 日時の読みやすい日本語表記を取得する
 */
export function formatJstTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Tokyo",
    }) + " JST";
  } catch (e) {
    return "不明";
  }
}

/**
 * 数値の千単位にカンマを付与して文字列にする (例: 15432 -> "15,432")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ja-JP");
}
