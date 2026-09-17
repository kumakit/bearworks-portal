"use client";

import { useState } from "react";
import {
  gearDaysSummary,
  monthlyComparison,
} from "@/lib/takao-gear-publication";

const colorTakao = "#059669"; // エメラルド（山頂）
const colorHachioji = "#f97316"; // オレンジ（八王子麓）
const colorTokyo = "#2563eb"; // ブルー（都心）
const colorCold = "#3b82f6"; // 防寒着
const colorRain = "#6366f1"; // 雨具
const colorIce = "#ef4444"; // 軽アイゼン・凍結

/**
 * チャート1: 麓（都心/八王子） vs 高尾山頂 体感温度ギャップ（12ヶ月推移）
 */
export function ApparentTempGapChart() {
  const [baseStation, setBaseStation] = useState<"hachioji" | "tokyo">("hachioji");

  const isHachioji = baseStation === "hachioji";
  const title = isHachioji
    ? "麓（八王子駅前） vs 高尾山頂 体感温度の月別ギャップ"
    : "都心（新宿・大手町） vs 高尾山頂 体感温度の月別ギャップ";

  const rows = monthlyComparison;
  // 縦軸範囲: -5℃ 〜 40℃
  const minY = -5;
  const maxY = 42;
  const height = 280;
  const width = 640;
  const paddingX = 45;
  const paddingY = 35;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const x = (month: number) => paddingX + ((month - 1) / 11) * chartWidth;
  const y = (val: number) => paddingY + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;

  // 麓データ
  const baseTemps = rows.map((r) => isHachioji ? r.hachioji.midday_temp : r.tokyo.midday_temp);
  const takaoApparents = rows.map((r) => r.takao.midday_apparent_temp);

  const basePath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${x(r.month)},${y(baseTemps[i])}`)
    .join(" ");

  const takaoPath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${x(r.month)},${y(takaoApparents[i])}`)
    .join(" ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">
            日中12時の平均気温と、風速冷却を加味した山頂体感温度（AT）の差
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setBaseStation("hachioji")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              isHachioji ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            八王子麓 基準
          </button>
          <button
            type="button"
            onClick={() => setBaseStation("tokyo")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              !isHachioji ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            東京都心 基準
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title}
          className="w-full min-w-[540px]"
        >
          {/* 目盛線 */}
          {[0, 10, 20, 30, 40].map((val) => (
            <g key={val}>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y(val)}
                y2={y(val)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text x={paddingX - 8} y={y(val) + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {val}℃
              </text>
            </g>
          ))}

          {/* 10℃の危険ライン（防寒着必須境界） */}
          <line
            x1={paddingX}
            x2={width - paddingX}
            y1={y(10)}
            y2={y(10)}
            stroke="#93c5fd"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text x={width - paddingX} y={y(10) - 5} textAnchor="end" fontSize="10" fill="#2563eb" fontWeight="bold">
            防寒着必須ライン（体感10℃）
          </text>

          {/* 月軸 */}
          {rows.map((r) => (
            <g key={r.month}>
              <line x1={x(r.month)} x2={x(r.month)} y1={paddingY} y2={height - paddingY} stroke="#f8fafc" />
              <text x={x(r.month)} y={height - paddingY + 18} textAnchor="middle" fontSize="11" fill="#64748b">
                {r.month}月
              </text>
            </g>
          ))}

          {/* ギャップ塗りつぶし領域 */}
          <path
            d={`${basePath} L${x(12)},${y(takaoApparents[11])} ${rows
              .slice()
              .reverse()
              .map((r, i) => `L${x(r.month)},${y(takaoApparents[11 - i])}`)
              .join(" ")} Z`}
            fill="#10b981"
            fillOpacity="0.12"
          />

          {/* 折れ線 */}
          <path d={basePath} fill="none" stroke={isHachioji ? colorHachioji : colorTokyo} strokeWidth="2.5" />
          <path d={takaoPath} fill="none" stroke={colorTakao} strokeWidth="2.5" />

          {/* プロット点とギャップ表示 */}
          {rows.map((r, i) => {
            const bx = x(r.month);
            const by = y(baseTemps[i]);
            const ty = y(takaoApparents[i]);
            const gapVal = Math.round((takaoApparents[i] - baseTemps[i]) * 10) / 10;

            return (
              <g key={r.month}>
                <circle cx={bx} cy={by} r="3.5" fill={isHachioji ? colorHachioji : colorTokyo} />
                <circle cx={bx} cy={ty} r="3.5" fill={colorTakao} />
                {/* 差分ラベル（4, 8, 11月などの代表月） */}
                {(r.month === 1 || r.month === 5 || r.month === 8 || r.month === 11) && (
                  <text
                    x={bx}
                    y={(by + ty) / 2 + 3}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#047857"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {gapVal > 0 ? `+${gapVal}` : gapVal}℃
                  </text>
                )}
              </g>
            );
          })}

          {/* 凡例 */}
          <g transform={`translate(${paddingX + 10}, 18)`}>
            <circle cx="0" cy="0" r="4" fill={isHachioji ? colorHachioji : colorTokyo} />
            <text x="8" y="3" fontSize="11" fill="#334155" fontWeight="bold">
              {isHachioji ? "八王子麓の昼気温" : "都心の昼気温"}
            </text>

            <circle cx="150" cy="0" r="4" fill={colorTakao} />
            <text x="158" y="3" fontSize="11" fill="#334155" fontWeight="bold">
              高尾山頂の昼体感温度
            </text>

            <rect x="310" y="-5" width="16" height="10" fill="#10b981" fillOpacity="0.2" />
            <text x="332" y="3" fontSize="11" fill="#334155">
              体感ギャップ（標高減率＋風冷え）
            </text>
          </g>
        </svg>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        ※高尾山頂（標高599m）は日中平均で風速3〜5m/sが吹き、標高差（約-2.9℃）と風冷え（約-2〜3℃）により、麓との体感温度差は年間を通じて概ね4〜6℃低くなります。特に11月〜4月は山頂体感温度が10℃を下回ります。
      </p>
    </div>
  );
}

/**
 * チャート2: 「山装備が必要な日」月別・年間日数カウント（スタック/グループバー）
 */
export function GearDaysCountChart() {
  const summary = gearDaysSummary;
  const rows = summary.monthly_gear_days;

  const width = 640;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxVal = 31;
  const barWidth = 14;
  const groupSpacing = chartWidth / 12;

  const y = (val: number) => paddingY + chartHeight - (val / maxVal) * chartHeight;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900">「山装備が必要な日」の月別発生日数</h4>
          <p className="mt-1 text-xs text-slate-500">
            高尾山頂において各防護ギア（防寒着・雨具・軽アイゼン）が必要となった日数（年間366日集計）
          </p>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
          <p className="text-xs font-bold text-blue-800">防寒着 必須日</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-blue-900">{summary.warm_clothes_required_days}</span>
            <span className="text-xs font-bold text-blue-700">日 / 年</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700">年間 {((summary.warm_clothes_required_days / summary.total_days) * 100).toFixed(0)}% の日で防寒着が必須</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
          <p className="text-xs font-bold text-indigo-800">レインウェア 必須日</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-indigo-900">{summary.rainwear_required_days}</span>
            <span className="text-xs font-bold text-indigo-700">日 / 年</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700">年間 {((summary.rainwear_required_days / summary.total_days) * 100).toFixed(0)}% で降水（1mm以上）</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5">
          <p className="text-xs font-bold text-rose-800">軽アイゼン 警戒日</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-rose-900">{summary.crampons_caution_days}</span>
            <span className="text-xs font-bold text-rose-700">日 / 年</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-700">12〜2月に降水＋氷点下で凍結</p>
        </div>
      </div>

      {/* SVG 棒グラフ */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="山装備が必要な日の月別発生日数グラフ"
          className="w-full min-w-[540px]"
        >
          {/* Y目盛線 */}
          {[0, 10, 20, 30].map((val) => (
            <g key={val}>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y(val)}
                y2={y(val)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text x={paddingX - 8} y={y(val) + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {val}日
              </text>
            </g>
          ))}

          {/* 月ごとのバー */}
          {rows.map((r, i) => {
            const cx = paddingX + i * groupSpacing + groupSpacing / 2;
            const b1X = cx - barWidth - 1;
            const b2X = cx;
            const b3X = cx + barWidth + 1;

            const hWarm = chartHeight - (y(r.warm_clothes_days) - paddingY);
            const hRain = chartHeight - (y(r.rainwear_days) - paddingY);
            const hIce = chartHeight - (y(r.crampons_days) - paddingY);

            return (
              <g key={r.month}>
                {/* 防寒着バー */}
                <rect
                  x={b1X}
                  y={y(r.warm_clothes_days)}
                  width={barWidth}
                  height={hWarm}
                  fill={colorCold}
                  rx="2"
                />

                {/* 雨具バー */}
                <rect
                  x={b2X}
                  y={y(r.rainwear_days)}
                  width={barWidth}
                  height={hRain}
                  fill={colorRain}
                  rx="2"
                />

                {/* アイゼンバー */}
                {r.crampons_days > 0 && (
                  <rect
                    x={b3X}
                    y={y(r.crampons_days)}
                    width={barWidth}
                    height={hIce}
                    fill={colorIce}
                    rx="2"
                  />
                )}

                {/* Xラベル */}
                <text x={cx} y={height - paddingY + 16} textAnchor="middle" fontSize="11" fill="#64748b">
                  {r.month}月
                </text>
              </g>
            );
          })}

          {/* 凡例 */}
          <g transform={`translate(${paddingX + 20}, 15)`}>
            <rect x="0" y="-6" width="10" height="10" fill={colorCold} rx="2" />
            <text x="14" y="3" fontSize="11" fill="#334155" fontWeight="bold">
              防寒着（体感&lt;10℃）
            </text>

            <rect x="150" y="-6" width="10" height="10" fill={colorRain} rx="2" />
            <text x="164" y="3" fontSize="11" fill="#334155" fontWeight="bold">
              レインウェア（降水&ge;1mm）
            </text>

            <rect x="330" y="-6" width="10" height="10" fill={colorIce} rx="2" />
            <text x="344" y="3" fontSize="11" fill="#334155" fontWeight="bold">
              軽アイゼン（凍結警戒）
            </text>
          </g>
        </svg>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        ※11月〜3月は「ほぼ全日（月25〜30日）」で防寒着が必要となり、12月〜2月は降水後の凍結による軽アイゼン警戒日が月数日〜10日発生します。「都心で暖かいから」と軽装で訪れると、山頂で低体温症や転倒事故を招くリスクがデータからも裏付けられます。
      </p>
    </div>
  );
}
