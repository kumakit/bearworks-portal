"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  GoogleBilling,
  DailyCost30d,
  DailyBigQueryUsage30d,
  GCPFreeTierUsage,
  formatNumber,
  formatJPY,
} from "../lib/dashboardUtils";

interface GCPChartsProps {
  googleBilling: GoogleBilling;
  dailyCosts30d: DailyCost30d[];
  bigqueryDailyUsage30d: DailyBigQueryUsage30d[];
  gcpFreeTier: GCPFreeTierUsage;
}

const COLORS_SERVERS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6b7280"];

// カスタムすりガラス風ツールチップ
function ChartTooltip({ active, payload, label, isCost = false }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-gray-100/50 text-xs">
      <p className="font-extrabold text-primary mb-2 border-b pb-1 border-gray-100">{label}</p>
      {payload.map((entry: any, index: number) => {
        let displayValue = "";
        if (entry.unit) {
          displayValue = `${entry.value.toFixed(1)}${entry.unit}`;
        } else if (isCost || entry.name.includes("コスト") || entry.name.includes("bearworks")) {
          displayValue = formatJPY(entry.value);
        } else {
          displayValue = `${formatNumber(entry.value)} GB`;
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

export function GCPCharts({
  googleBilling,
  dailyCosts30d,
  bigqueryDailyUsage30d,
  gcpFreeTier,
}: GCPChartsProps) {
  // 1. サービス別内訳 (ドーナツチャート) 用データ
  const modelCostData = React.useMemo(() => {
    return Object.entries(googleBilling.modelCosts || {}).map(([model, cost]) => ({
      name: model,
      value: cost,
    })).sort((a, b) => b.value - a.value);
  }, [googleBilling.modelCosts]);

  // 2. プロジェクト別コスト (横棒グラフ) 用データ
  const projectCostData = React.useMemo(() => {
    return (googleBilling.projects || []).map((proj) => ({
      name: proj.id,
      cost: proj.costJPY,
    })).sort((a, b) => b.cost - a.cost);
  }, [googleBilling.projects]);

  // 3. 日次積層コストグラフのプロジェクト一覧
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

  const projectColors: { [key: string]: string } = {
    "bearworks-prod": "#8b5cf6",
    "bearworks-dev": "#c084fc",
    "default": "#94a3b8",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 2カラム: コスト内訳 (ドーナツ) & プロジェクト別比較 (横棒) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* サービス・モデル別コスト内訳 */}
        <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col items-center justify-between">
          <div className="w-full mb-2">
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">📊 サービス別コスト内訳</h3>
            <p className="text-[10px] text-muted font-medium">Gemini モデルや BigQuery の内訳</p>
          </div>

          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelCostData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {modelCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_SERVERS[index % COLORS_SERVERS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatJPY(value)}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem", border: "1px solid #f3f4f6" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-primary">
                {formatJPY(googleBilling.currentMonthTotalJPY)}
              </span>
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider">当月総額</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-1.5 mt-2 text-xs">
            {modelCostData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between font-medium">
                <div className="flex items-center gap-2 text-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_SERVERS[idx % COLORS_SERVERS.length] }} />
                  <span className="font-bold">{entry.name}</span>
                </div>
                <span className="font-extrabold text-primary">
                  {formatJPY(entry.value)} ({((entry.value / (googleBilling.currentMonthTotalJPY || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* プロジェクト別コスト比較 */}
        <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🏗️ プロジェクト別コスト比較</h3>
            <p className="text-[10px] text-muted font-medium">GCP プロジェクトごとの消費状況</p>
          </div>

          <div className="h-[230px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectCostData}
                layout="vertical"
                margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `¥${value}`} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#4b5563", fontWeight: "bold" }} width={100} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [formatJPY(value), "コスト"]}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem", border: "1px solid #f3f4f6" }}
                />
                <Bar dataKey="cost" name="コスト" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={16}>
                  {projectCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={projectColors[entry.name] || projectColors["default"]} />
                  ))}
                  <LabelList
                    dataKey="cost"
                    position="right"
                    formatter={(value: any) => formatJPY(value)}
                    style={{ fontSize: 10, fill: "#4b5563", fontWeight: "bold" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 30日日次積層コストグラフ */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">📈 日次コスト推移 (30日間)</h3>
          <p className="text-[10px] text-muted font-medium">過去30日間の日次積層コスト（プロジェクト別）</p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCosts30d} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }} tickLine={false} axisLine={{ stroke: "#f3f4f6" }} />
              <YAxis
                domain={[0, (dataMax: number) => {
                  if (typeof dataMax !== "number" || isNaN(dataMax) || !isFinite(dataMax)) return 60;
                  return Math.max(60, Math.ceil(dataMax));
                }]}
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip content={<ChartTooltip isCost={true} />} />
              <Legend verticalAlign="top" height={30} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* GCP Always Free 枠の監視進捗バー群 */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🆓 GCP Always Free 枠 監視</h3>
          <p className="text-[10px] text-muted font-medium">無料範囲内に収まっているかを判定（毎月リセット）</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          {Object.entries(gcpFreeTier).map(([key, item]) => {
            const isCritical = item.usage_percent > 85;
            const isWarning = item.usage_percent > 50;
            return (
              <div key={key} className="p-4 rounded-2xl bg-gray-50/40 border border-gray-100/40 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-primary font-bold">{item.service}</span>
                  <span
                    className={
                      isCritical
                        ? "text-red-500 animate-pulse font-extrabold"
                        : isWarning
                        ? "text-amber-500 font-extrabold"
                        : "text-purple-600 font-extrabold"
                    }
                  >
                    {item.usage_percent.toFixed(1)}%
                  </span>
                </div>

                {/* プログレスバー */}
                <div className="w-full bg-purple-50/60 rounded-full h-2.5 overflow-hidden border border-purple-100/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      isCritical
                        ? "from-red-400 to-red-600"
                        : isWarning
                        ? "from-amber-400 to-amber-500"
                        : "from-blue-400 to-purple-600"
                    }`}
                    style={{ width: `${Math.min(item.usage_percent, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-muted font-bold">
                  <span>消費量: {formatNumber(item.current)} {item.unit}</span>
                  <span>制限: {formatNumber(item.limit)} {item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BigQuery クエリ使用量 AreaChart */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">📊 BigQuery 日次クエリ使用量 (30日間)</h3>
          <p className="text-[10px] text-muted font-medium">過去30日間の日次クエリ解析量（GB）</p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bigqueryDailyUsage30d} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gcpBqUsageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }} tickLine={false} axisLine={{ stroke: "#f3f4f6" }} />
              <YAxis
                domain={[0, (dataMax: number) => {
                  if (typeof dataMax !== "number" || isNaN(dataMax) || !isFinite(dataMax)) return 40;
                  return Math.max(40, Math.ceil(dataMax));
                }]}
                tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} GB`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" height={30} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
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
                fill="url(#gcpBqUsageGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default GCPCharts;
