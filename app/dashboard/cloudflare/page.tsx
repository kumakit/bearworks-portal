"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardData, normalizeDashboardData } from "../lib/dashboardUtils";
import { DetailPageLayout } from "../components/DetailPageLayout";
import { WAFCharts } from "../components/WAFCharts";

const DASHBOARD_API_URL = "https://apps.bearworks.uk/api/dashboard/data.json";

// 動的モックデータの生成
function getMockWafData(): DashboardData {
  const now = new Date();
  
  const waf_details = {
    period: "7d",
    total_events: 4580,
    action_summary: {
      block: 2100,
      managed_challenge: 1500,
      js_challenge: 450,
      log: 530,
    },
    top_rules: [
      { rule_id: "100015", action: "block", source: "firewallManaged", count: 890 },
      { rule_id: "100085", action: "block", source: "firewallManaged", count: 450 },
      { rule_id: "user_rule_1", action: "block", source: "user", count: 320 },
      { rule_id: "user_rule_2", action: "managed_challenge", source: "user", count: 280 },
    ],
    top_paths: [
      { path: "/wp-login.php", action: "block", count: 890 },
      { path: "/xmlrpc.php", action: "block", count: 640 },
      { path: "/api/v1/auth", action: "managed_challenge", count: 310 },
      { path: "/", action: "log", count: 120 },
    ],
    top_asns: [
      { asn: 16509, org: "Amazon.com", country: "US", count: 1500 },
      { asn: 24940, org: "Hetzner Online", country: "DE", count: 920 },
      { asn: 13335, org: "Cloudflare", country: "US", count: 450 },
    ],
    bot_distribution: {},
    hourly_timeline: Array.from({ length: 168 }, (_, i) => {
      const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      return {
        hour: targetTime.toISOString(),
        action: "block",
        count: Math.floor(Math.random() * 45) + 5,
      };
    }),
  };

  return {
    updatedAt: now.toISOString(),
    summary: {
      googleTotalRequests24h: 320,
      googleTotalErrors24h: 2,
      googleErrorRate24h: 0.62,
      cloudflareTotalRequests24h: 12500,
      cloudflareTotalThreats24h: 35,
      cloudflareCacheRate24h: 62.4,
      googleBilling: {
        limitJPY: 1550.0,
        currentMonthTotalJPY: 450.0,
        usagePercent: 29.0,
        projects: [],
        modelCosts: {},
      },
      bigqueryUsage: {
        limitQueryGB: 1024.0,
        currentMonthQueryGB: 124.5,
        usageQueryPercent: 12.16,
        limitStorageGB: 10.0,
        currentMonthStorageGB: 4.2,
        usageStoragePercent: 42.0,
      },
    },
    hourly: [],
    dailyCosts30d: [],
    bigqueryDailyUsage30d: [],
    wafDetails: waf_details,
  };
}

export default function CloudflareWafPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(DASHBOARD_API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(normalizeDashboardData(json));
      setUsingMock(false);
      setError(null);
    } catch (err) {
      console.warn("Dashboard API unavailable, using mock WAF data:", err);
      setData(getMockWafData());
      setUsingMock(true);
      setError("本番 API サーバーから実データを取得できなかったため、モックデータを表示しています。");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl w-full mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="animate-spin text-4xl text-orange-500">🌀</div>
          <p className="text-muted font-bold tracking-wide">WAF詳細データを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const wafDetails = data.wafDetails || getMockWafData().wafDetails!;

  return (
    <DetailPageLayout
      title="Cloudflare WAF"
      updatedAt={data.updatedAt}
      refreshing={refreshing}
      onRefresh={() => fetchData(true)}
      crossLinkText="GCP コスト分析を見る"
      crossLinkHref="/dashboard/gcp"
    >
      {/* Mock Fallback Warning Alert */}
      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex items-start gap-3 text-amber-800 shadow-soft mb-2">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold">デモモード動作中 (フォールバック)</h4>
            <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">
              {error} 本番環境へのデプロイ後にAPIキーが設定されると、自動的にリアルタイムデータに切り替わります。
            </p>
          </div>
        </div>
      )}

      {/* WAF Charts & Tables */}
      <WAFCharts wafDetails={wafDetails} />
    </DetailPageLayout>
  );
}
