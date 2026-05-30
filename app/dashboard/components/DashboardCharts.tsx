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
} from "recharts";
import { HourlyMetric, formatNumber } from "../lib/dashboardUtils";

interface DashboardChartsProps {
  hourlyData: HourlyMetric[];
}

// カスタムすりガラス風ツールチップ
function CustomTooltip({ active, payload, label, theme }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-gray-100/50 text-xs">
      <p className="font-extrabold text-primary mb-2 border-b pb-1 border-gray-100">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-6 py-0.5 font-medium">
          <div className="flex items-center gap-1.5 text-muted">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
          </div>
          <span className="font-bold text-primary">
            {formatNumber(entry.value)} 件
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts({ hourlyData }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"google" | "cloudflare">("google");

  return (
    <div className="rounded-[2.5rem] p-6 md:p-8 border bg-white shadow-soft border-gray-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="text-xl font-bold text-primary">アクティビティ推移</h3>
            <p className="text-xs text-muted font-medium mt-0.5">直近24時間の時間ごとのデータ</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100/50">
          <button
            onClick={() => setActiveTab("google")}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "google"
                ? "bg-white text-purple-600 shadow-soft border border-purple-50"
                : "text-muted hover:text-primary"
            }`}
          >
            ♊ Google AI Studio
          </button>
          <button
            onClick={() => setActiveTab("cloudflare")}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === "cloudflare"
                ? "bg-white text-orange-600 shadow-soft border border-orange-50"
                : "text-muted hover:text-primary"
            }`}
          >
            ☁️ Cloudflare Security
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
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#googleErrGradient)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
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
