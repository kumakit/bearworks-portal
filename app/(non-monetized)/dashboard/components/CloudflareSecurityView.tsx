"use client";

import React, { useState } from "react";
import { assessSecurityBlock, type SecurityCollection, type SecurityKey } from "../lib/cloudflareSecurity";
import { timestamp } from "../lib/cloudflareCollection";

const periods: { key: SecurityKey; label: string; hours: number }[] = [
  { key: "securityTrend24h", label: "24時間", hours: 24 },
  { key: "securityTrend7d", label: "7日間", hours: 168 },
  { key: "securityTrend30d", label: "30日間", hours: 720 },
];
const date = (value: string) => new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function CloudflareSecurityView({ security, nowUpper }: { security: SecurityCollection; nowUpper: number | null }) {
  const [selected, setSelected] = useState<SecurityKey>("securityTrend24h");
  const period = periods.find(item => item.key === selected)!;
  const block = security[selected];
  const state = assessSecurityBlock(block, nowUpper);
  const points = state.usable ? block.points ?? [] : [];
  const start = timestamp(block.windowStart);
  const maximum = Math.max(1, ...points.map(point => point.count));
  const dots = start === null ? [] : points.map(point => {
    const hour = timestamp(point.hour)!;
    return { ...point, x: 34 + (hour - start) / (period.hours * 3600000) * 646, y: 154 - point.count / maximum * 124 };
  });
  return <details className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
    <summary className="cursor-pointer rounded font-semibold focus:outline-2 focus:outline-blue-700">Firewall イベントの記録数（参考）</summary>
    <div className="mt-4 space-y-4 text-sm">
      <p>Cloudflare が抽出を含めて集計した時間別の記録です。HTTP リクエスト数や訪問人数とは別の値です。攻撃・遮断・安全性の判定ではありません。</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="参考データの期間">
        {periods.map(item => <button key={item.key} type="button" aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}
          className="rounded-lg border px-3 py-2 focus:outline-2 focus:outline-blue-700 aria-pressed:bg-blue-100">{item.label}</button>)}
      </div>
      <div role="status"><strong>{period.label}：{state.state}</strong>。{state.reason}</div>
      {state.usable && <>
        <p>値を取得できた時間 {points.length} / {period.hours}。返らなかった時間は未確認です。直近の時間は集計の反映待ちの可能性もあります。</p>
        {block.sampling === "ADAPTIVE" && <p>推計を含みます。下の一覧で、推計された時間を確認できます。</p>}
        <svg viewBox="0 0 700 185" role="img" aria-label={`${period.label}の時間別 Firewall イベント。点は値が返った時間のみ。詳細は下の表を参照。`} className="w-full max-w-full rounded border bg-slate-50">
          <line x1="34" y1="154" x2="680" y2="154" stroke="#64748b" />
          <line x1="34" y1="30" x2="34" y2="154" stroke="#64748b" />
          {dots.map(point => <circle key={point.hour} cx={point.x} cy={point.y} r="3.5" fill={point.sampleInterval > 1 ? "#075985" : "#334155"} stroke={point.sampleInterval > 1 ? "#075985" : "none"} strokeWidth="2"><title>{`${date(point.hour)}：${point.count} 件${point.sampleInterval > 1 ? "（推計）" : ""}`}</title></circle>)}
          <text x="34" y="177" fontSize="12" fill="#334155">開始</text><text x="650" y="177" fontSize="12" fill="#334155">終了</text>
        </svg>
        <p>点のない時間を 0 件とは扱いません。返却値が 0 の点も、実際のイベントがなかった証明ではありません。</p>
        <div className="max-h-72 overflow-auto rounded border">
          <table className="w-full text-left"><caption className="sr-only">値が返った時間の一覧</caption>
            <thead className="sticky top-0 bg-slate-100"><tr><th scope="col" className="p-2">時間（日本時間）</th><th scope="col" className="p-2">返却値</th><th scope="col" className="p-2">集計</th></tr></thead>
            <tbody>{points.map(point => <tr key={point.hour} className="border-t"><td className="p-2">{date(point.hour)}</td><td className="p-2">{point.count.toLocaleString("ja-JP")} 件</td><td className="p-2">{point.sampleInterval > 1 ? "推計" : "今回の取得では抽出なし"}</td></tr>)}</tbody>
          </table>
        </div>
      </>}
    </div>
  </details>;
}
