"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Sparkles, CreditCard } from "lucide-react";
import { DashboardData, formatJPY, formatNumber, normalizeDashboardData } from "../lib/dashboardUtils";
import { DetailPageLayout } from "../components/DetailPageLayout";
import { GCPCharts } from "../components/GCPCharts";
import { MetricCard } from "../components/MetricCard";

const DASHBOARD_API_URL = "https://apps.bearworks.uk/api/dashboard/data.json";

// 動的モックデータの生成 (GCP用)
function getMockGcpData(): DashboardData {
  const now = new Date();
  
  // 30日間の日次積層データをシミュレート
  const dailyCosts30d = [];
  const bigqueryDailyUsage30d = [];
  let accumProd = 0;
  let accumDev = 0;
  for (let i = 29; i >= 0; i--) {
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = `${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    
    const prodCost = Math.random() * 20.0 + 3.0;
    const devCost = Math.random() * 5.0 + 0.8;
    accumProd += prodCost;
    accumDev += devCost;
    
    dailyCosts30d.push({
      date: dateStr,
      costs: {
        "bearworks-prod": parseFloat(prodCost.toFixed(1)),
        "bearworks-dev": parseFloat(devCost.toFixed(1)),
      },
      total: parseFloat((prodCost + devCost).toFixed(1)),
    });

    bigqueryDailyUsage30d.push({
      date: dateStr,
      usageGB: parseFloat((Math.random() * 12 + 0.5).toFixed(1)),
    });
  }

  const currentMonthTotal = parseFloat((accumProd + accumDev).toFixed(1));
  const limitJpy = 1550.0;
  const usagePercent = parseFloat(((currentMonthTotal / limitJpy) * 100).toFixed(1));

  const gcp_free_tier = {
    bigquery_query: { service: "BigQuery (Query)", limit: 1024.0, unit: "GB", current: 124.5, usage_percent: 12.16 },
    bigquery_storage: { service: "BigQuery (Storage)", limit: 10.0, unit: "GB", current: 4.2, usage_percent: 42.0 },
    cloud_storage: { service: "Cloud Storage", limit: 5.0, unit: "GB", current: 0.4, usage_percent: 8.0 },
    compute_engine: { service: "Compute Engine", limit: 744.0, unit: "hours", current: 744.0, usage_percent: 100.0 },
    cloud_run: { service: "Cloud Run", limit: 2000000, unit: "requests", current: 2000, usage_percent: 0.1 }
  };

  return {
    updatedAt: now.toISOString(),
    summary: {
      googleTotalRequests24h: 350,
      googleTotalErrors24h: 4,
      googleErrorRate24h: 1.14,
      cloudflareTotalRequests24h: 9800,
      cloudflareTotalThreats24h: 12,
      cloudflareCacheRate24h: 58.2,
      googleBilling: {
        limitJPY: limitJpy,
        currentMonthTotalJPY: currentMonthTotal,
        usagePercent: usagePercent,
        projects: [
          { id: "bearworks-prod", costJPY: parseFloat(accumProd.toFixed(1)) },
          { id: "bearworks-dev", costJPY: parseFloat(accumDev.toFixed(1)) },
        ],
        modelCosts: {
          "Gemini Pro": parseFloat((currentMonthTotal * 0.75).toFixed(1)),
          "Gemini Flash": parseFloat((currentMonthTotal * 0.10).toFixed(1)),
          "BigQuery": parseFloat((currentMonthTotal * 0.05).toFixed(1)),
          "Firebase/Storage": parseFloat((currentMonthTotal * 0.10).toFixed(1)),
        },
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
    dailyCosts30d,
    bigqueryDailyUsage30d,
    gcpFreeTier: gcp_free_tier,
  } as any;
}

export default function GCPCostsPage() {
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
      console.warn("Dashboard API unavailable, using mock GCP data:", err);
      setData(getMockGcpData());
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
          <div className="animate-spin text-4xl text-purple-500">🌀</div>
          <p className="text-muted font-bold tracking-wide">GCPコストデータを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  // 古いデータ形式時のフォールバック
  const googleBilling = data.summary.googleBilling || {
    limitJPY: 1550.0,
    currentMonthTotalJPY: 0.0,
    usagePercent: 0.0,
    projects: [],
    modelCosts: { "Gemini Pro": 0.0, "Gemini Flash": 0.0 }
  };
  const dailyCosts30d = data.dailyCosts30d || [];
  const bigqueryDailyUsage30d = data.bigqueryDailyUsage30d || [];
  const gcpFreeTier = data.gcpFreeTier || {
    bigquery_query: { service: "BigQuery (Query)", limit: 1024.0, unit: "GB", current: 0.0, usage_percent: 0.0 },
    bigquery_storage: { service: "BigQuery (Storage)", limit: 10.0, unit: "GB", current: 0.0, usage_percent: 0.0 },
    cloud_storage: { service: "Cloud Storage", limit: 5.0, unit: "GB", current: 0.0, usage_percent: 0.0 },
    compute_engine: { service: "Compute Engine", limit: 744.0, unit: "hours", current: 0.0, usage_percent: 0.0 },
    cloud_run: { service: "Cloud Run", limit: 2000000.0, unit: "requests", current: 0.0, usage_percent: 0.0 }
  };

  // 月末予測（Forecast）の算出
  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentMonthTotal = googleBilling.currentMonthTotalJPY;
  const forecast = (currentMonthTotal / Math.max(1, today)) * daysInMonth;

  // 残りクレジット枠 (繰越クレジットがある場合は加算)
  const carryover = googleBilling.carryoverCreditJPY || 0;
  const remainingCredit = Math.max(0, googleBilling.limitJPY - googleBilling.currentMonthTotalJPY) + carryover;
  const totalBudget = googleBilling.limitJPY + carryover;
  const remainingPercent = totalBudget > 0 ? (remainingCredit / totalBudget) * 100 : 0;

  // クレジットの定義と残高の動的割り当て
  // 期限が遠いもの（終了日の遅いもの）から順番に満額を差し引き、余りを最も期限が近いもの（2027年2月18日）に割り当てる
  const rawCredits = [
    { name: "Google Developer Program premium benefit", originalValue: 1594.00, startDate: "2026年6月6日", endDate: "2027年6月6日", key: "6-6" },
    { name: "Google Developer Program premium benefit", originalValue: 1596.00, startDate: "2026年5月17日", endDate: "2027年5月17日", key: "5-17" },
    { name: "Google Developer Program premium benefit", originalValue: 1566.00, startDate: "2026年3月20日", endDate: "2027年3月20日", key: "3-20" },
    { name: "Google Developer Program premium benefit", originalValue: 1566.00, startDate: "2026年3月20日", endDate: "2027年2月18日", key: "2-18" },
  ];

  let pool = remainingCredit;
  const creditsList = rawCredits.map((c) => {
    const allocated = Math.max(0, Math.min(c.originalValue, pool));
    pool -= allocated;
    const remPercent = c.originalValue > 0 ? (allocated / c.originalValue) * 100 : 0;
    return {
      ...c,
      remainingValue: allocated,
      remainingPercent: remPercent,
      status: allocated > 0 ? "利用可能" : "消費済み",
    };
  });

  const displayCredits = [
    creditsList.find(c => c.key === "5-17")!,
    creditsList.find(c => c.key === "6-6")!,
    creditsList.find(c => c.key === "3-20")!,
    creditsList.find(c => c.key === "2-18")!,
  ].filter(Boolean);

  return (
    <DetailPageLayout
      title="GCP Costs"
      updatedAt={data.updatedAt}
      refreshing={refreshing}
      onRefresh={() => fetchData(true)}
      crossLinkText="Cloudflare WAF 詳細を見る"
      crossLinkHref="/dashboard/cloudflare"
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

      {/* KPI Cards: 今月累積, 月末予測, クレジット残高 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="💴 今月累積コスト"
          value={formatJPY(currentMonthTotal)}
          description="当月1日からのGCP総消費額"
          icon={<Sparkles size={20} />}
          theme="google"
        />

        <MetricCard
          title="📈 月末予測コスト"
          value={formatJPY(forecast)}
          description={`現在の日次平均より算出 (月末: ${daysInMonth}日基準)`}
          icon={<TrendingUp size={20} />}
          theme="google"
          trend={{
            value: forecast > googleBilling.limitJPY ? "上限超過予測" : "予算内",
            isPositive: forecast < googleBilling.limitJPY,
          }}
        />

        <MetricCard
          title="⏳ クレジット残高"
          value={formatJPY(remainingCredit)}
          description={carryover > 0
            ? `総クレジット枠 ${formatJPY(totalBudget)} に対する残高 (繰越 ¥${carryover.toLocaleString("ja-JP")} 含む)`
            : `月間予算 ${formatJPY(googleBilling.limitJPY)} に占める余剰枠`
          }
          icon={<CreditCard size={20} />}
          theme="google"
        >
          <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-muted">
              <span>クレジット残量比率</span>
              <span className={remainingPercent < 20 ? "text-red-500 font-black animate-pulse" : "text-purple-500 font-black"}>
                {remainingPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-purple-50 rounded-full h-2 overflow-hidden border border-purple-100/30">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(remainingPercent, 100)}%` }}
              />
            </div>
          </div>
        </MetricCard>
      </div>

      {/* GCP Charts & FreeTier List */}
      <GCPCharts
        googleBilling={googleBilling}
        dailyCosts30d={dailyCosts30d}
        bigqueryDailyUsage30d={bigqueryDailyUsage30d}
        gcpFreeTier={gcpFreeTier}
      />

      {/* 発行済みクレジット一覧 */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4 mt-6">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🎁 発行済みクレジット一覧</h3>
          <p className="text-[10px] text-muted font-medium">
            有効な Google Developer Program 特典クレジットの内訳 (総残高と動的連動)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-muted uppercase tracking-wider">
                <th className="py-3 px-4">クレジット名</th>
                <th className="py-3 px-4">ステータス</th>
                <th className="py-3 px-4">残りの割合</th>
                <th className="py-3 px-4">残りの値</th>
                <th className="py-3 px-4">元の値</th>
                <th className="py-3 px-4">開始日</th>
                <th className="py-3 px-4">終了日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {displayCredits.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/20 transition-colors font-medium">
                  <td className="py-3.5 px-4 text-primary font-bold">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{item.status}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-purple-50 rounded-full h-1.5 overflow-hidden border border-purple-100/10">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-purple-600 h-full rounded-full"
                          style={{ width: `${item.remainingPercent}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-[10px] text-purple-600 w-8">
                        {Math.round(item.remainingPercent)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-primary font-bold">
                    ¥{item.remainingValue.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-semibold">
                    ¥{item.originalValue.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-muted">{item.startDate}</td>
                  <td className="py-3.5 px-4 text-muted">{item.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DetailPageLayout>
  );
}
