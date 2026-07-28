"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Zap, Globe, ShieldAlert } from "lucide-react";
import { DashboardData, normalizeDashboardData } from "../lib/dashboardUtils";
import { DetailPageLayout } from "../components/DetailPageLayout";
import { WAFCharts } from "../components/WAFCharts";
import { MetricCard } from "../components/MetricCard";

const DASHBOARD_API_URL = "/api/dashboard-data";

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
      cloudflarePages: {
        currentMonthBuilds: 42,
        limitBuilds: 500,
        usagePercent: 8.4,
      },
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
  const cloudflarePages = data.summary.cloudflarePages || {
    currentMonthBuilds: 0,
    limitBuilds: 500,
    usagePercent: 0.0,
  };

  return (
    <DetailPageLayout
      title="Cloudflare"
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

      {/* Section 1: Cloudflare Pages */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">⚡ Cloudflare Pages</h2>
          <p className="text-xs text-muted font-medium mt-0.5">静的サイト・Webアプリのホスティング枠の消費状況</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard
            title="Pages 当月ビルド数"
            value={`${cloudflarePages.currentMonthBuilds} / ${cloudflarePages.limitBuilds}`}
            unit=" 回"
            description="無料枠500回/月に対する現在のビルド（デプロイ）回数（毎月1日にリセット）"
            icon={<Zap size={20} />}
            theme="cloudflare"
            trend={{
              value: `${cloudflarePages.usagePercent}% 使用`,
              isPositive: cloudflarePages.usagePercent < 80,
            }}
          />
          
          <div className="rounded-[2rem] p-6 border border-orange-100/50 bg-white/80 backdrop-blur-md shadow-soft flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-500" />
            <div>
              <span className="text-xs font-semibold tracking-wider text-muted block mb-1">
                Pages 無料枠ステータス
              </span>
              <h4 className="text-lg font-bold text-primary mt-1">
                {cloudflarePages.currentMonthBuilds >= cloudflarePages.limitBuilds ? "🚨 制限に達しました" : "✅ 正常稼働中"}
              </h4>
              <p className="text-[11px] text-muted/90 mt-2 leading-relaxed">
                無料プランのビルド回数上限は月間 500 回です。これを超えると、新しいコミットの自動ビルドが一時的に停止されます。
              </p>
            </div>
            
            {/* プログレスバー表示 */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold text-muted mb-1">
                <span>使用率: {cloudflarePages.usagePercent}%</span>
                <span>残り: {Math.max(0, cloudflarePages.limitBuilds - cloudflarePages.currentMonthBuilds)} 回</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    cloudflarePages.usagePercent > 90 ? "bg-red-500" : cloudflarePages.usagePercent > 70 ? "bg-amber-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(100, cloudflarePages.usagePercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-100 my-2" />

      {/* Section 2: Cloudflare WAF */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">🛡️ Web Application Firewall (WAF)</h2>
          <p className="text-xs text-muted font-medium mt-0.5">脅威のブロックやアクセスセキュリティ統計</p>
        </div>
        
        {/* WAFサマリカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard
            title="直近24時間 総リクエスト数"
            value={data.summary.cloudflareTotalRequests24h}
            unit=" 回"
            description="Cloudflare 経由でプロキシされた全リクエスト数"
            icon={<Globe size={20} />}
            theme="cloudflare"
            trend={{
              value: `${data.summary.cloudflareCacheRate24h}% キャッシュ率`,
              isPositive: true,
            }}
          />
          <MetricCard
            title="直近24時間 総ブロック・脅威数"
            value={data.summary.cloudflareTotalThreats24h}
            unit=" 件"
            description="セキュリティルールで検知・ブロックされたアクセス"
            icon={<ShieldAlert size={20} />}
            theme="cloudflare"
            trend={{
              value: data.summary.cloudflareTotalThreats24h > 100 ? "脅威検出増加" : "平常",
              isPositive: data.summary.cloudflareTotalThreats24h <= 100,
            }}
          />
        </div>

        {/* WAF Charts & Tables */}
        <WAFCharts wafDetails={wafDetails} />
      </section>
    </DetailPageLayout>
  );
}
