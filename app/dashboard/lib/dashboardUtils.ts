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
  costJPY: number;
}

export interface GoogleBilling {
  limitJPY: number;
  currentMonthTotalJPY: number;
  usagePercent: number;
  projects: ProjectBilling[];
  modelCosts: { [key: string]: number }; // e.g. { "Gemini 1.5 Pro": 381.3 }
}

export interface DailyCost30d {
  date: string; // "05-20", etc.
  costs: { [projectId: string]: number }; // Mapping of projectId -> cost_jpy
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

export interface FreeTierItem {
  service: string;
  limit: number;
  unit: string;
  current: number;
  usage_percent: number;
}

export interface GCPFreeTierUsage {
  bigquery_query: FreeTierItem;
  bigquery_storage: FreeTierItem;
  cloud_storage: FreeTierItem;
  compute_engine: FreeTierItem;
  cloud_run: FreeTierItem;
}

export interface WAFTopRule {
  rule_id: string;
  action: string;
  source: string;
  count: number;
}

export interface WAFTopPath {
  path: string;
  action: string;
  count: number;
}

export interface WAFTopASN {
  asn: number;
  org: string;
  country: string;
  count: number;
}

export interface WAFHourlyEvent {
  hour: string;
  action: string;
  count: number;
}

export interface WAFDetails {
  period: string;
  total_events: number;
  action_summary: { [action: string]: number };
  top_rules: WAFTopRule[];
  top_paths: WAFTopPath[];
  top_asns: WAFTopASN[];
  bot_distribution: { [botScore: string]: number };
  hourly_timeline: WAFHourlyEvent[];
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
  wafDetails?: WAFDetails;
  gcpFreeTier?: GCPFreeTierUsage;
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

/**
 * 日本円の表記にする (例: 1570 -> "¥1,570")
 */
export function formatJPY(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return "¥0";
  }
  return "¥" + num.toLocaleString("ja-JP");
}

export function normalizeDashboardData(data: any): DashboardData {
  if (!data) return data;

  const JPY_RATE = 155.0; // 移行用の為替レート

  // deep copy
  const normalized = JSON.parse(JSON.stringify(data));

  // データが古いUSD形式であるかどうかのフラグ
  const isUSDData = 
    (normalized.summary?.googleBilling?.limitUSD !== undefined) ||
    (normalized.summary?.googleBilling?.limitJPY === undefined && normalized.summary?.googleBilling?.limitUSD !== undefined);

  // 1. googleBilling の正規化
  let billing = normalized.summary?.googleBilling;
  if (billing) {
    if (billing.limitJPY === undefined && billing.limitUSD !== undefined) {
      billing.limitJPY = billing.limitUSD * JPY_RATE;
    }
    if (billing.currentMonthTotalJPY === undefined && billing.currentMonthTotalUSD !== undefined) {
      billing.currentMonthTotalJPY = billing.currentMonthTotalUSD * JPY_RATE;
    }
    if (billing.projects) {
      billing.projects = billing.projects.map((proj: any) => {
        if (proj.costJPY === undefined && proj.costUSD !== undefined) {
          return { ...proj, costJPY: proj.costUSD * JPY_RATE };
        }
        return proj;
      });
    }
    if (billing.modelCosts) {
      const modelCostsJPY: { [key: string]: number } = {};
      Object.entries(billing.modelCosts).forEach(([model, val]) => {
        const numVal = val as number;
        // USDデータ判定されている場合のみ換算
        if (isUSDData && numVal < 50) {
          modelCostsJPY[model] = parseFloat((numVal * JPY_RATE).toFixed(1));
        } else {
          modelCostsJPY[model] = numVal;
        }
      });
      billing.modelCosts = modelCostsJPY;
    }
    // usagePercent
    if (billing.limitJPY && billing.currentMonthTotalJPY) {
      billing.usagePercent = parseFloat(((billing.currentMonthTotalJPY / billing.limitJPY) * 100).toFixed(1));
    }
  }

  // 2. dailyCosts30d の正規化
  let dailyCosts = normalized.dailyCosts30d;
  if (dailyCosts && isUSDData) {
    normalized.dailyCosts30d = dailyCosts.map((d: any) => {
      const costsJPY: { [key: string]: number } = {};
      if (d.costs) {
        Object.entries(d.costs).forEach(([proj, val]) => {
          costsJPY[proj] = parseFloat(((val as number) * JPY_RATE).toFixed(1));
        });
      }
      return {
        ...d,
        costs: costsJPY,
        total: parseFloat(((d.total || 0) * JPY_RATE).toFixed(1)),
      };
    });
  }

  return normalized;
}
