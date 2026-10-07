"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { actionLabel, timestamp, type SummaryData } from "../lib/cloudflareCollection";
import type { WAFHourlyEvent } from "../lib/dashboardUtils";

const colors = ["#dc2626", "#d97706", "#2563eb", "#059669", "#6b7280", "#7c3aed"];
const countLabel = (value: unknown) => typeof value === "number" ? `${value.toLocaleString("ja-JP")} 件` : "未確認";
const timeLabel = (value: unknown) => new Date(Number(value)).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

/** 検証済みのsummaryだけを受け取る。失敗時は親がこのグラフを描画しない。 */
export function CloudflareActionDistribution({ data }: { data: SummaryData }) {
  const groups = new Map<string, number>();
  for (const [action, count] of Object.entries(data.actionCounts)) {
    const name = actionLabel(action);
    groups.set(name, (groups.get(name) ?? 0) + count);
  }
  const values = [...groups].map(([name, value]) => ({ name, value }));
  if (data.totalEvents === 0) return <p className="text-xs mt-3">この集計ではイベントが観測されず、分布は表示できません。</p>;
  return <div className="h-64 mt-3" role="img" aria-label="取得したWAFイベントの処理種別分布。件数は下の一覧に記載しています。">
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
      <PieChart><Pie data={values} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
        {values.map((item, i) => <Cell key={item.name} fill={colors[i % colors.length]} />)}
      </Pie><Tooltip formatter={value => countLabel(value)} /></PieChart>
    </ResponsiveContainer>
  </div>;
}

/** 要求した時間の観測点だけを集計する。欠けた時間へ0を補わない。 */
export function CloudflareEventTimeline({ data }: { data: WAFHourlyEvent[] }) {
  if (data.length === 0) return <p className="text-xs mt-3">この集計ではイベントが観測されず、時系列グラフは表示できません。</p>;
  const groups = new Map<number, number>();
  for (const event of data) {
    const time = timestamp(event.hour)!;
    const value = (groups.get(time) ?? 0) + event.count;
    if (!Number.isSafeInteger(value)) return <p className="text-xs mt-3">グラフ用の合計が数値の範囲を超えています。下の取得値を確認してください。</p>;
    groups.set(time, value);
  }
  const values = [...groups].map(([time, count]) => ({ time, count })).sort((a, b) => a.time - b.time);
  return <div className="h-64 mt-3" role="img" aria-label="取得した時間別WAFイベント件数。欠けた時間に0件は補っていません。件数は下の一覧に記載しています。">
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
      <AreaChart data={values} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={timeLabel} minTickGap={40} />
        <YAxis allowDecimals={false} width={45} />
        <Tooltip formatter={value => countLabel(value)} labelFormatter={timeLabel} />
        <Area dataKey="count" name="取得した処理イベント" stroke="#2563eb" fill="#dbeafe" type="linear" />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
