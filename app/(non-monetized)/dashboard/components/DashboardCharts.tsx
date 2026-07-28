"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { HourlyMetric, DailyCost30d, DailyBigQueryUsage30d, formatNumber } from "../lib/dashboardUtils";

interface DashboardChartsProps {
  hourlyData: HourlyMetric[];
  dailyCosts30d: DailyCost30d[];
  bigqueryDailyUsage30d: DailyBigQueryUsage30d[];
}

// カスタムすりガラス風ツールチップ
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-gray-100/50 text-xs">
      <p className="font-extrabold text-primary mb-2 border-b pb-1 border-gray-100">{label}</p>
      {payload.map((entry: any, index: number) => {
        let displayValue = "";
        
        // 明示的に unit が設定されている場合はそれを優先
        if (entry.unit) {
          displayValue = `${entry.value.toFixed(1)}${entry.unit}`;
        } else {
          // コストデータかどうかを判別（値が小数の場合、または名前にコストやプロジェクト名が含まれる場合）
          const isCost = 
            entry.name.includes("コスト") || 
            entry.name.includes("bearworks") || 
            (typeof entry.value === "number" && !Number.isInteger(entry.value)) ||
            (entry.name.includes("cost") || entry.name.includes("Total"));
            
          if (isCost) {
            displayValue = `¥${entry.value.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}`;
          } else {
            displayValue = `${formatNumber(entry.value)} 件`;
          }
        }

        return (
          <div key={index} className="flex items-center justify-between gap-6 py-0.5 font-medium">
            <div className="flex items-center gap-1.5 text-muted">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
            </div>
            <span className="font-bold text-primary">
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}


export function DashboardCharts({ hourlyData, dailyCosts30d, bigqueryDailyUsage30d }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"google" | "cloudflare" | "billing" | "bigquery">("google");

  // 日次コストグラフのプロジェクト一覧を動的に抽出
  const projectKeys = React.useMemo(() => {
    if (!dailyCosts30d || dailyCosts30d.length === 0) return [];
    const keys = new Set<string>();
    dailyCosts30d.forEach((d) => {
      if (d.costs) {
        Object.keys(d.costs).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [dailyCosts30d]);

  // プロジェクトの色分けマップ (Stitchデザインのパープル系)
  const projectColors: { [key: string]: string } = {
    "bearworks-prod": "#8b5cf6",
    "bearworks-dev": "#c084fc",
    "Gemini API Key in OCI": "#3b82f6",
    "N100": "#10b981",
    "bearworks-apps": "#ec4899",
    "mission-control": "#f59e0b",
    "default": "#94a3b8",
  };

  return (
    <div className="rounded-[2.5rem] p-6 md:p-8 border bg-white shadow-soft border-gray-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {activeTab === "billing" 
                ? "Google AI Studio 月間コスト" 
                : activeTab === "bigquery"
                ? "BigQuery クエリ解析量"
                : "アクティビティ推移"}
            </h3>
            <p className="text-xs text-muted font-medium mt-0.5">
              {activeTab === "billing" 
                ? "過去30日間の日次積層コスト（プロジェクト別）" 
                : activeTab === "bigquery"
                ? "過去30日間の日次クエリ解析量（GB）"
                : "直近24時間の時間ごとのデータ"}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100/50 flex-wrap">
          <button
            onClick={() => setActiveTab("google")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "google"
                ? "bg-white text-purple-600 shadow-soft border border-purple-50"
                : "text-muted hover:text-primary"
            }`}
          >
            ♊ AI Studio リクエスト
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "billing"
                ? "bg-white text-purple-600 shadow-soft border border-purple-50"
                : "text-muted hover:text-primary"
            }`}
          >
            💰 AI Studio コスト (30日)
          </button>
          <button
            onClick={() => setActiveTab("bigquery")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "bigquery"
                ? "bg-white text-blue-600 shadow-soft border border-blue-50"
                : "text-muted hover:text-primary"
            }`}
          >
            📊 BigQuery 使用量 (30日)
          </button>
          <button
            onClick={() => setActiveTab("cloudflare")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "cloudflare"
                ? "bg-white text-orange-600 shadow-soft border border-orange-50"
                : "text-muted hover:text-primary"
            }`}
          >
            ☁️ CF セキュリティ
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[320px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "google" ? (
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="googleReqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="googleErrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "#f3f4f6" }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 10 }}
              />
              <Area
                type="monotone"
                dataKey="googleRequests"
                name="Gemini API リクエスト数"
                unit=" 回"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#googleReqGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="googleErrors"
                name="エラー発生件数"
                unit=" 回"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#googleErrGradient)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
              />
            </AreaChart>
          ) : activeTab === "billing" ? (
            <BarChart data={dailyCosts30d} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "#f3f4f6" }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `¥${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingBottom: 10 }}
              />
              {/* クレジット枠制限に基づく1日あたりの推奨限界値（1550円 / 30日 ≒ 51.6円）のライン */}
              <ReferenceLine
                y={51.6}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: "1日目安上限 (¥51.6)",
                  fill: "#ef4444",
                  fontSize: 8,
                  fontWeight: "bold",
                  position: "top",
                }}
              />
              {projectKeys.map((projKey) => (
                <Bar
                  key={projKey}
                  dataKey={`costs.${projKey}`}
                  name={projKey}
                  stackId="a"
                  fill={projectColors[projKey] || projectColors["default"]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          ) : activeTab === "bigquery" ? (
            <AreaChart data={bigqueryDailyUsage30d} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bqUsageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "#f3f4f6" }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} GB`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingBottom: 10 }}
              />
              {/* 無料枠 1TB/月 に対する1日あたりの推奨限界値（1024 GB / 30日 ≒ 34.13 GB）のライン */}
              <ReferenceLine
                y={34.13}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: "1日目安上限 (34.1 GB)",
                  fill: "#ef4444",
                  fontSize: 8,
                  fontWeight: "bold",
                  position: "top",
                }}
              />
              <Area
                type="monotone"
                dataKey="usageGB"
                name="クエリ解析量"
                unit=" GB"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#bqUsageGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cfReqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfThreatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "#f3f4f6" }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 10 }}
              />
              <Area
                type="monotone"
                dataKey="cloudflareRequests"
                name="総アクセスリクエスト数"
                unit=" 回"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#cfReqGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="cloudflareThreats"
                name="ブロックされた脅威数"
                unit=" 件"
                stroke="#111827"
                strokeWidth={2}
                fill="url(#cfThreatGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export default DashboardCharts;

