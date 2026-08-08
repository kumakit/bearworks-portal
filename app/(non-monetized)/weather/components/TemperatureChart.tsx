"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { LocationWeather, formatTemp } from "../lib/weatherUtils";

interface TemperatureChartProps {
  locations: LocationWeather[];
}

interface ChartDataPoint {
  hour: string;
  today: number | null;
  yesterday: number | null;
  todayApparent: number | null;
  yesterdayApparent: number | null;
}

function buildChartData(location: LocationWeather): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];

  for (let h = 0; h < 24; h++) {
    const todayEntry = location.hourly.today.find((e) => e.hour === h);
    const yesterdayEntry = location.hourly.yesterday.find((e) => e.hour === h);

    points.push({
      hour: `${h}時`,
      today: todayEntry?.temp ?? null,
      yesterday: yesterdayEntry?.temp ?? null,
      todayApparent: todayEntry?.apparentTemp ?? null,
      yesterdayApparent: yesterdayEntry?.apparentTemp ?? null,
    });
  }

  return points;
}

// Custom Tooltip for the chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-gray-100 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-800">
            {entry.value !== null ? `${entry.value.toFixed(1)}°C` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TemperatureChart({ locations }: TemperatureChartProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [showApparent, setShowApparent] = useState(false);

  const location = locations[activeTab];
  if (!location) return null;

  const data = buildChartData(location);

  return (
    <div className="rounded-3xl p-6 border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <h3 className="text-lg font-bold text-gray-800">気温比較</h3>
          <span className="text-xs text-gray-400 font-medium">今日 vs 昨日</span>
        </div>

        {/* 体感温度トグル */}
        <button
          onClick={() => setShowApparent(!showApparent)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            showApparent
              ? "bg-violet-50 border-violet-200 text-violet-700"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}
        >
          🌡️ 体感温度 {showApparent ? "ON" : "OFF"}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-2xl w-fit">
        {locations.map((loc, i) => (
          <button
            key={loc.name}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === i
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {loc.name === "八王子" ? "🏠" : "🏢"} {loc.name}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="todayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="yesterdayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}°`}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="today"
              name="今日"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#todayGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="yesterday"
              name="昨日"
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#yesterdayGradient)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
              connectNulls
            />
            {showApparent && (
              <>
                <Line
                  type="monotone"
                  dataKey="todayApparent"
                  name="今日(体感)"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="yesterdayApparent"
                  name="昨日(体感)"
                  stroke="#c084fc"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
