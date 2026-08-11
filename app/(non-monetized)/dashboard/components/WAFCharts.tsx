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
} from "recharts";
import { WAFDetails, formatNumber } from "../lib/dashboardUtils";

interface WAFChartsProps {
  wafDetails: WAFDetails;
}

const ACTION_COLORS: { [action: string]: string } = {
  block: "#ef4444",
  managed_challenge: "#f59e0b",
  js_challenge: "#3b82f6",
  log: "#10b981",
  allow: "#6b7280",
  unknown: "#9ca3af",
};

const ACTION_NAMES: { [action: string]: string } = {
  block: "ブロック (Block)",
  managed_challenge: "マネージドチャレンジ",
  js_challenge: "JSチャレンジ",
  log: "ログ記録 (Log)",
  allow: "許可 (Allow)",
  unknown: "その他",
};

// カスタムすりガラス風ツールチップ
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-gray-100/50 text-xs">
      <p className="font-extrabold text-primary mb-2 border-b pb-1 border-gray-100">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-6 py-0.5 font-medium">
          <div className="flex items-center gap-1.5 text-muted">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || ACTION_COLORS[entry.name] || "#ccc" }}
            />
            <span>{ACTION_NAMES[entry.name] || entry.name}:</span>
          </div>
          <span className="font-bold text-primary">
            {formatNumber(entry.value)} 件
          </span>
        </div>
      ))}
    </div>
  );
}

export function WAFCharts({ wafDetails }: WAFChartsProps) {
  const { action_summary, top_rules, top_paths, top_asns, hourly_timeline } = wafDetails;

  // 1. ドーナツチャート用データ
  const pieData = React.useMemo(() => {
    return Object.entries(action_summary || {}).map(([action, val]) => ({
      name: action,
      value: val,
    })).sort((a, b) => b.value - a.value);
  }, [action_summary]);

  // 2. 時系列データ (1時間ごとを集計してパース)
  const timelineData = React.useMemo(() => {
    if (!hourly_timeline || hourly_timeline.length === 0) return [];
    const map: { [hour: string]: { [action: string]: number } } = {};
    
    hourly_timeline.forEach((item) => {
      let label = item.hour;
      try {
        const d = new Date(item.hour);
        // 時系列が見やすくなるように "06-05 JST" または "06-05 12:00" のような表記に
        label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
      } catch (e) {}

      if (!map[label]) {
        map[label] = {};
      }
      map[label][item.action] = (map[label][item.action] || 0) + item.count;
    });

    return Object.entries(map).map(([time, actions]) => ({
      time,
      ...actions,
    })).sort((a, b) => a.time.localeCompare(b.time));
  }, [hourly_timeline]);

  // アクション一覧を動的抽出
  const actionTypes = React.useMemo(() => {
    const types = new Set<string>();
    timelineData.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "time") types.add(k);
      });
    });
    return Array.from(types);
  }, [timelineData]);

  // 最大カウントの算出（各要素の合計値の最大）
  const maxRulesCount = top_rules && top_rules.length > 0 ? top_rules[0].count : 1;
  const maxPathsCount = top_paths && top_paths.length > 0 ? top_paths[0].count : 1;
  const maxASNsCount = top_asns && top_asns.length > 0 ? top_asns[0].count : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* 2カラム構成: 総数/アクション別分布 & 時系列推移 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* アクション別分布 (ドーナツチャート) */}
        <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col items-center justify-between">
          <div className="w-full mb-2">
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🛡️ アクション別分布</h3>
            <p className="text-[10px] text-muted font-medium">ファイアウォール動作の分類</p>
          </div>
          
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ACTION_COLORS[entry.name] || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${formatNumber(value)} 件`, ACTION_NAMES[name] || name]}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem", border: "1px solid #f3f4f6" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* 中央のテキスト */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-primary">{formatNumber(wafDetails.total_events)}</span>
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider">総イベント</span>
            </div>
          </div>

          {/* 凡例リスト */}
          <div className="w-full flex flex-col gap-1.5 mt-2 text-xs">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between font-medium">
                <div className="flex items-center gap-2 text-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACTION_COLORS[entry.name] || "#ccc" }} />
                  <span className="font-bold">{ACTION_NAMES[entry.name] || entry.name}</span>
                </div>
                <span className="font-extrabold text-primary">
                  {formatNumber(entry.value)} 件 ({((entry.value / (wafDetails.total_events || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 時系列推移グラフ (積層AreaChart) */}
        <div className="md:col-span-2 rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">📈 WAF イベント時系列推移 (7日間)</h3>
            <p className="text-[10px] text-muted font-medium">時間ごとの検知およびアクション数</p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {actionTypes.map((type) => (
                    <linearGradient key={`grad-${type}`} id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTION_COLORS[type] || "#ccc"} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={ACTION_COLORS[type] || "#ccc"} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 8, fill: "#9ca3af", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#f3f4f6" }}
                  // 1日 (24時間) ごとに大体ラベルを表示
                  interval={Math.max(1, Math.floor(timelineData.length / 7))}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={30}
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: 10, fontWeight: 600 }}
                  formatter={(value) => ACTION_NAMES[value] || value}
                />
                {actionTypes.map((type) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={type}
                    stackId="1"
                    stroke={ACTION_COLORS[type] || "#ccc"}
                    strokeWidth={2}
                    fill={`url(#grad-${type})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 詳細テーブルセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 攻撃ルール TOP10 */}
        <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">⚔️ トリガーされた攻撃ルール TOP 10</h3>
            <p className="text-[10px] text-muted font-medium">どのようなルールにより遮断されたか</p>
          </div>
          
          <div className="flex flex-col gap-2.5 overflow-hidden">
            {top_rules && top_rules.length > 0 ? (
              top_rules.map((rule, idx) => {
                const pct = (rule.count / maxRulesCount) * 100;
                return (
                  <div key={idx} className="relative rounded-2xl p-3 border border-gray-100/40 overflow-hidden bg-gray-50/20">
                    {/* 進捗バックグラウンドバー */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-red-500/5 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex justify-between items-center text-xs font-semibold">
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        <span className="font-extrabold text-primary">ID: {rule.rule_id}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <span
                            className="px-1.5 py-0.5 rounded-full font-bold uppercase text-[8px]"
                            style={{
                              backgroundColor: `${ACTION_COLORS[rule.action] || "#ccc"}15`,
                              color: ACTION_COLORS[rule.action] || "#ccc",
                            }}
                          >
                            {ACTION_NAMES[rule.action] || rule.action}
                          </span>
                          <span>•</span>
                          <span className="font-bold">ソース: {rule.source}</span>
                        </div>
                      </div>
                      <span className="font-black text-primary bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-soft">
                        {formatNumber(rule.count)} 件
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted font-bold py-8 text-center">データがありません</p>
            )}
          </div>
        </div>

        {/* 攻撃対象パス TOP10 */}
        <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🎯 攻撃対象パス (リクエストURL) TOP 10</h3>
            <p className="text-[10px] text-muted font-medium">悪意あるアクセスが集中した標的パス</p>
          </div>

          <div className="flex flex-col gap-2.5 overflow-hidden">
            {top_paths && top_paths.length > 0 ? (
              top_paths.map((path, idx) => {
                const pct = (path.count / maxPathsCount) * 100;
                return (
                  <div key={idx} className="relative rounded-2xl p-3 border border-gray-100/40 overflow-hidden bg-gray-50/20">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-blue-500/5 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex justify-between items-center text-xs font-semibold">
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        <span className="font-extrabold text-primary truncate block" title={path.path}>
                          {path.path}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <span
                            className="px-1.5 py-0.5 rounded-full font-bold uppercase text-[8px]"
                            style={{
                              backgroundColor: `${ACTION_COLORS[path.action] || "#ccc"}15`,
                              color: ACTION_COLORS[path.action] || "#ccc",
                            }}
                          >
                            {ACTION_NAMES[path.action] || path.action}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-primary bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-soft shrink-0">
                        {formatNumber(path.count)} 件
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted font-bold py-8 text-center">データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* 攻撃元ネットワーク TOP 10 (ASN & 国情報) */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🌐 攻撃元ネットワーク (ASN/自律システム) TOP 10</h3>
          <p className="text-[10px] text-muted font-medium">悪意あるアクセスの発信元ネットワークおよび国</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top_asns && top_asns.length > 0 ? (
            top_asns.map((asn, idx) => {
              const pct = (asn.count / maxASNsCount) * 100;
              return (
                <div key={idx} className="relative rounded-2xl p-3.5 border border-gray-100/40 overflow-hidden bg-gray-50/20">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-purple-500/5 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex justify-between items-center text-xs font-semibold">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <span className="font-extrabold text-primary truncate block" title={asn.org}>
                        {asn.org}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span className="font-extrabold">ASN: {asn.asn}</span>
                        <span>•</span>
                        <span className="font-bold flex items-center gap-1">
                          📍 {asn.country}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-primary bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-soft shrink-0">
                      {formatNumber(asn.count)} 件
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-2 text-xs text-muted font-bold py-8 text-center">データがありません</p>
          )}
        </div>
      </div>

      {/* ボットスコア分布カード (Graceful Fallback) */}
      <div className="rounded-[2.5rem] p-6 border bg-white shadow-soft border-gray-100 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-muted mb-1">🤖 ボットスコア分布 (Bot Score Distribution)</h3>
          <p className="text-[10px] text-muted font-medium">リクエストの自動化（ボット化）スコア判定</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-amber-800 font-semibold leading-relaxed max-w-[80%]">
            ⚠️ <strong>お知らせ:</strong> ボット解析（Bot Score Analytics）は Cloudflare Pro 以上の有料プランでのみサポートされています。
            当サイトは現在 Free プランで運用されているため、この機能は無効（ graceful fallback ）となっています。
          </p>
          <span className="text-[10px] bg-amber-100/60 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-extrabold shrink-0">
            PRO PLAN REQUIRED
          </span>
        </div>
      </div>
    </div>
  );
}

export default WAFCharts;
