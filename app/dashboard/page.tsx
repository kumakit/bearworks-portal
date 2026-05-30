"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Zap,
  Globe,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  DashboardData,
  getRelativeTime,
  formatJstTime,
} from "./lib/dashboardUtils";
import { MetricCard } from "./components/MetricCard";
import { DashboardCharts } from "./components/DashboardCharts";

const DASHBOARD_API_URL = "https://apps.bearworks.uk/api/dashboard/data.json";

// 動的モックデータの生成 (APIが利用できない場合の完全なフォールバック)
function getMockData(): DashboardData {
  const now = new Date();
  const hourly = [];
  
  for (let i = 23; i >= 0; i--) {
    const target = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = `${String(target.getHours()).padStart(2, "0")}:00`;
    const hour = target.getHours();

    const activity = hour < 6 || hour > 23 ? 0.3 : 0.8;
    const googleReq = Math.floor((Math.sin(hour * 0.26) * 15 + 25) * activity);
    const googleErr = Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
    
    const cfReq = Math.floor((Math.sin(hour * 0.26) * 150 + 450) * (activity + 0.2));
    const cfThreat = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;

    hourly.push({
      hour: hourStr,
      googleRequests: googleReq,
      googleErrors: googleReq > 0 ? googleErr : 0,
      cloudflareRequests: cfReq,
      cloudflareThreats: cfThreat,
    });
  }

  const googleTotal = hourly.reduce((sum, h) => sum + h.googleRequests, 0);
  const googleErrors = hourly.reduce((sum, h) => sum + h.googleErrors, 0);
  const cfTotal = hourly.reduce((sum, h) => sum + h.cloudflareRequests, 0);
  const cfThreats = hourly.reduce((sum, h) => sum + h.cloudflareThreats, 0);

  return {
    updatedAt: now.toISOString(),
    summary: {
      googleTotalRequests24h: googleTotal,
      googleTotalErrors24h: googleErrors,
      googleErrorRate24h: parseFloat(((googleErrors / googleTotal) * 100).toFixed(2)),
      cloudflareTotalRequests24h: cfTotal,
      cloudflareTotalThreats24h: cfThreats,
      cloudflareCacheRate24h: 54.8,
    },
    hourly,
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(DASHBOARD_API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
      setUsingMock(false);
      setError(null);
    } catch (err) {
      console.warn("Dashboard API unavailable, using mock data:", err);
      setData(getMockData());
      setUsingMock(true);
      setError("本番 API サーバーから実データを取得できなかったため、モックデータを表示しています。");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl w-full mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="animate-spin text-4xl text-purple-500">🌀</div>
          <p className="text-muted font-bold tracking-wide">ダッシュボードデータを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Navigation Backlink */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors tracking-wide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          BEARWORKS.UK
        </a>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold tracking-wider">
            🛡️ CLOUDFLARE ACCESS PROTECTED
          </span>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-soft transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={`${refreshing ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b pb-6 border-gray-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            🌌 Personal Mission Control Dashboard
          </h1>
          <p className="text-sm text-muted mt-1 font-semibold">
            Google AI Studio のリソース使用状況と Cloudflare のセキュリティステータス
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-1.5 mt-4 md:mt-0 text-[11px] font-semibold text-muted bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0">
          <Clock size={12} className="text-purple-500" />
          <span>最終収集: {getRelativeTime(data.updatedAt)}</span>
        </div>
      </div>

      {/* Mock Fallback Warning Alert */}
      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex items-start gap-3 text-amber-800 shadow-soft">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold">デモモード動作中 (フォールバック)</h4>
            <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">
              {error} 本番環境へのデプロイ後にAPIキーが設定されると、自動的にリアルタイムデータに切り替わります。
            </p>
          </div>
        </div>
      )}

      {/* Bento Grid layout for metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gemini API Requests */}
        <MetricCard
          title="AI Studio リクエスト数 (24h)"
          value={data.summary.googleTotalRequests24h}
          unit="回"
          description="Generative Language API への総呼び出し回数"
          icon={<Zap size={20} />}
          theme="google"
        />

        {/* Gemini API Error Rate */}
        <MetricCard
          title="AI Studio エラー率 (24h)"
          value={data.summary.googleErrorRate24h}
          unit="%"
          description={`総エラー発生数: ${data.summary.googleTotalErrors24h} 回`}
          icon={<ShieldAlert size={20} />}
          theme="google"
          trend={{
            value: data.summary.googleErrorRate24h > 1.0 ? "やや高め" : "安定",
            isPositive: data.summary.googleErrorRate24h < 1.0,
          }}
        />

        {/* Cloudflare Security threats */}
        <MetricCard
          title="CF ブロック脅威数 (24h)"
          value={data.summary.cloudflareTotalThreats24h}
          unit="件"
          description="WAF やボットルールによって検知・遮断された悪意ある通信"
          icon={<ShieldAlert size={20} />}
          theme="cloudflare"
          trend={{
            value: "正常範囲",
            isPositive: true,
          }}
        />

        {/* Cloudflare Traffic */}
        <MetricCard
          title="CF 総トラフィック (24h)"
          value={data.summary.cloudflareTotalRequests24h}
          unit="reqs"
          description="Cloudflare エッジを通過した全リクエストトラフィック"
          icon={<Globe size={20} />}
          theme="cloudflare"
        />

        {/* Cloudflare Cache Rate */}
        <MetricCard
          title="CF キャッシュヒット率 (24h)"
          value={data.summary.cloudflareCacheRate24h}
          unit="%"
          description="エッジサーバーでキャッシュ処理され、オリジン負荷を低減した割合"
          icon={<Activity size={20} />}
          theme="cloudflare"
        />

        {/* Google Billing Info (Mocked / Conceptual) */}
        <MetricCard
          title="AI Studio 課金ステータス"
          value="Free Tier"
          description="現在無料枠（毎月の無料割り当て枠内）で正常に稼働中"
          icon={<ArrowUpRight size={20} />}
          theme="google"
        />
      </div>

      {/* Main Charts */}
      <div className="w-full">
        <DashboardCharts hourlyData={data.hourly} />
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted/60 py-8 border-t border-gray-100 flex flex-col gap-2 mt-4 font-semibold">
        <p>
          GCP TimeSeries Monitoring • Cloudflare Zone Analytics Dashboard
        </p>
        <p className="text-[10px]">
          Data updated hourly • Protected by Cloudflare ZTNA • UI by Antigravity AI
        </p>
      </footer>
    </main>
  );
}
