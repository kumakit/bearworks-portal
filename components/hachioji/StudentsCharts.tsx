"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const n = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${n(Math.abs(value))}`;

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const buttonClass = (active: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${
    active
      ? "border-teal-900 bg-teal-900 text-white"
      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
  }`;

export interface StudentDataProp {
  trend: {
    rows: { year: number; students: number }[];
  };
  referenceCounts: {
    date: string;
    schools: number;
    students: number;
    page: number;
    source: string;
  }[];
  moves: {
    date: string;
    school: string;
    detail: string;
    source: string;
  }[];
}

export interface StudentAnalysisProp {
  indexSummary: {
    baseYear: number;
    baseStudents: number;
    latestYear: number;
    latestStudents: number;
    latestIndex2006: number;
    peakYear: number;
    peakStudents: number;
    peakIndex2006: number;
    totalDiff: number;
    totalChangePercent: number;
    cagrPercent: number;
    series: { year: number; students: number; index2006: number }[];
  };
  yoySummary: {
    q1: number;
    median: number;
    q3: number;
    iqr: number;
    stable2017to2022Range: {
      minDiff: number;
      maxDiff: number;
    };
    rows: {
      year: number;
      students: number;
      prevStudents: number;
      diff: number;
      pct: number;
      isMoveYear: boolean;
    }[];
  };
  regressionSummary: {
    period1: {
      startYear: number;
      endYear: number;
      slope: number;
      fitted: { year: number; fitted: number }[];
    };
    period2: {
      startYear: number;
      endYear: number;
      slope: number;
      fitted: { year: number; fitted: number }[];
    };
  };
  surveySummary: {
    responses: number;
    resident: {
      percent: number;
      approxCount: number;
      ciLow: number;
      ciHigh: number;
      halfWidth: number;
    };
    intendsToLive: {
      percent: number;
      approxCount: number;
      ciLow: number;
      ciHigh: number;
      halfWidth: number;
    };
  };
}

export interface CampusLocationsProp {
  rosterDate: string;
  localView: {
    viewBox: string;
    cityPaths: string[];
    stations: { name: string; lon: number; lat: number; x: number; y: number }[];
  };
  wideView: {
    viewBox: string;
    cityPaths: string[];
    areaLabels: { name: string; x: number; y: number }[];
  };
  schools: {
    no: number;
    name: string;
    address: string;
    opened: string;
    inHachiojiCity: boolean;
  }[];
  markers: {
    id: string;
    address: string;
    fullAddress: string;
    inHachiojiCity: boolean;
    hasRelocation: boolean;
    local: { x: number; y: number };
    wide: { x: number; y: number };
    schools: { no: number; name: string; opened: string }[];
  }[];
  relocations: {
    date: string;
    school: string;
    fromCampus: string;
    fromAddress: string;
    toCampus: string;
    toAddress: string;
    summary: string;
    source: string;
    wideFrom: { x: number; y: number };
    wideTo: { x: number; y: number };
  }[];
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

function TrendTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  mode: "trend" | "index";
}) {
  if (!active || !payload || payload.length === 0) return null;
  const visible = payload.filter((item) => typeof item.value === "number");
  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
      <p className="mb-1.5 font-bold text-slate-900">{label}年</p>
      {visible.map((item) => (
        <div key={String(item.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color ?? "#0f766e" }}
            />
            {item.name}
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {mode === "index"
              ? `${Number(item.value).toFixed(1)}`
              : `${n(Math.round(Number(item.value)))}人`}
          </span>
        </div>
      ))}
    </div>
  );
}

function YoYTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as StudentAnalysisProp["yoySummary"]["rows"][number] | undefined;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
      <p className="font-bold text-slate-900">
        {label}年{row.isMoveYear ? "（キャンパス移転・再編の年）" : ""}
      </p>
      <p className="mt-1 tabular-nums text-slate-700">
        前年差：<strong className="text-slate-900">{signed(row.diff)}人</strong>（
        {row.pct > 0 ? "+" : ""}
        {row.pct.toFixed(1)}％）
      </p>
      <p className="mt-0.5 tabular-nums text-slate-600">学生数：{n(row.students)}人</p>
    </div>
  );
}

export function StudentTrendAndIndexChart({
  data,
  analysis,
}: {
  data: StudentDataProp;
  analysis: StudentAnalysisProp;
}) {
  const [mode, setMode] = useState<"trend" | "index">("trend");

  const p1Map = new Map(analysis.regressionSummary.period1.fitted.map((r) => [r.year, r.fitted]));
  const p2Map = new Map(analysis.regressionSummary.period2.fitted.map((r) => [r.year, r.fitted]));
  const indexMap = new Map(analysis.indexSummary.series.map((r) => [r.year, r.index2006]));
  const yoyMap = new Map(analysis.yoySummary.rows.map((r) => [r.year, r]));
  const refMap = new Map(
    data.referenceCounts.map((r) => [Number(r.date.slice(0, 4)), r.students])
  );

  const chartData = [
    ...data.trend.rows.map(({ year, students }) => ({
      year,
      students,
      referenceStudents: null as number | null,
      period1Fit: p1Map.get(year) ?? null,
      period2Fit: p2Map.get(year) ?? null,
      index2006: indexMap.get(year) ?? null,
    })),
    ...data.referenceCounts.map((r) => {
      const yr = Number(r.date.slice(0, 4));
      return {
        year: yr,
        students: null as number | null,
        referenceStudents: refMap.get(yr) ?? r.students,
        period1Fit: null as number | null,
        period2Fit: null as number | null,
        index2006: null as number | null,
      };
    }),
  ];

  const moveYears = data.moves.map((m) => Number(m.date.slice(0, 4)));

  return (
    <figure className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="font-bold text-slate-900">
            {mode === "trend"
              ? "市内の大学等で学ぶ学生数と区間ごとの傾き（2006～2023年・参考値2025年まで）"
              : "2006年＝100とした学生数指数（2006～2023年）"}
          </figcaption>
          <p className="mt-1 text-xs text-slate-600">
            {mode === "trend"
              ? "単位：人 · 縦軸は0から表示 · 2024・2025年は別資料の参考値のため線で結んでいません"
              : "2006年（104,130人）＝100.0 · 変化を見やすくするため縦軸は80から表示"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="表示の切り替え">
          <button
            type="button"
            className={buttonClass(mode === "trend")}
            aria-pressed={mode === "trend"}
            onClick={() => setMode("trend")}
          >
            学生数と区間傾向
          </button>
          <button
            type="button"
            className={buttonClass(mode === "index")}
            aria-pressed={mode === "index"}
            onClick={() => setMode("index")}
          >
            2006年＝100 指数
          </button>
        </div>
      </div>

      {mode === "trend" ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-[3px] border-teal-700" aria-hidden="true" />
            学生数（実績）
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 border-t-2 border-dashed border-slate-500"
              aria-hidden="true"
            />
            2006～2014年傾向（年 {analysis.regressionSummary.period1.slope.toFixed(1).replace("-", "−")}人）
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 border-t-2 border-dashed border-amber-700"
              aria-hidden="true"
            />
            2015～2023年傾向（年 {analysis.regressionSummary.period2.slope.toFixed(1).replace("-", "−")}人）
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600" aria-hidden="true" />
            参考値（2024・2025年）
          </li>
        </ul>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-[3px] border-teal-700" aria-hidden="true" />
            学生数指数（2006年＝100、2023年は{analysis.indexSummary.latestIndex2006}）
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 border-t-2 border-dashed border-slate-400"
              aria-hidden="true"
            />
            基準線（100）
          </li>
        </ul>
      )}

      <div
        className="mt-3 h-[290px] w-full min-w-0"
        role="img"
        aria-label={
          mode === "trend"
            ? "市内の大学等の学生数の折れ線と前後半の説明用直線。数値は下の18年分の数値表を参照。"
            : "2006年を100とした学生数指数の折れ線。2011年が105.7、2023年が86.2。"
        }
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 290 }}>
          {mode === "trend" ? (
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#334155" }}
                interval={2}
                tickLine={false}
              />
              <YAxis
                domain={[0, 120000]}
                ticks={[0, 30000, 60000, 90000, 120000]}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => (v === 0 ? "0" : `${v / 10000}万`)}
              />
              <Tooltip content={<TrendTooltip mode="trend" />} />
              {moveYears.map((yr) => (
                <ReferenceLine
                  key={yr}
                  x={yr}
                  stroke="#b45309"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                />
              ))}
              <Line
                type="linear"
                dataKey="period1Fit"
                name="2006～2014年傾向"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="period2Fit"
                name="2015～2023年傾向"
                stroke="#b45309"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="students"
                name="市内の大学等の学生数"
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ r: 3.5, fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="referenceStudents"
                name="参考値（市の概要）"
                stroke="transparent"
                strokeWidth={0}
                dot={{ r: 5, fill: "#d97706", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#d97706" }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={analysis.indexSummary.series}
              margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#334155" }}
                interval={2}
                tickLine={false}
              />
              <YAxis
                domain={[80, 110]}
                ticks={[80, 90, 100, 110]}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<TrendTooltip mode="index" />} />
              <ReferenceLine y={100} stroke="#64748b" strokeDasharray="4 4" />
              {moveYears.map((yr) => (
                <ReferenceLine
                  key={yr}
                  x={yr}
                  stroke="#b45309"
                  strokeDasharray="4 4"
                  strokeOpacity={0.65}
                />
              ))}
              <Line
                type="monotone"
                dataKey="index2006"
                name="学生数指数（2006年＝100）"
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ r: 3.5, fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs leading-6 text-slate-600">
        茶色の縦の点線はキャンパス再編・移転があった年（2015・2016・2023年）です。点線の傾きは過去の推移を整理する説明用の直線で、将来の予測には使いません。
      </p>

      <details className="mt-4 rounded-xl bg-slate-50 p-4">
        <summary className="cursor-pointer font-semibold text-teal-900">18年分の数値表</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <caption className="sr-only">市内の大学等で学ぶ学生数、指数、前年差（2006～2023年）</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="p-2 text-left">年</th>
                <th scope="col" className="p-2 text-right">学生数（人）</th>
                <th scope="col" className="p-2 text-right">指数（2006=100）</th>
                <th scope="col" className="p-2 text-right">前年差</th>
                <th scope="col" className="p-2 text-right">前年比</th>
              </tr>
            </thead>
            <tbody>
              {analysis.indexSummary.series.map(({ year, students, index2006 }) => {
                const yoy = yoyMap.get(year);
                return (
                  <tr key={year} className="border-t border-slate-200">
                    <th scope="row" className="p-2 text-left font-normal">
                      {year}年{yoy?.isMoveYear ? " *" : ""}
                    </th>
                    <td className="p-2 text-right tabular-nums">{n(students)}</td>
                    <td className="p-2 text-right tabular-nums">{index2006.toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {yoy ? `${signed(yoy.diff)}人` : "—"}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {yoy ? `${yoy.pct > 0 ? "+" : ""}${yoy.pct.toFixed(1)}％` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-600">* はキャンパス再編・移転があった年です。</p>
      </details>
    </figure>
  );
}

export function StudentYoYChart({ analysis }: { analysis: StudentAnalysisProp }) {
  const { q1, q3, rows } = analysis.yoySummary;
  return (
    <figure className={card}>
      <figcaption className="font-bold text-slate-900">
        前年と比べた学生数の増減（2007～2023年）
      </figcaption>
      <p className="mt-1 text-xs text-slate-600">
        単位：人（各年と前年との差） · 薄い帯はふだんの増減幅（四分位範囲：{signed(q1)}～{signed(q3)}人）
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-700" aria-hidden="true" />
          キャンパス移転・再編の年（2015・2016・2023年）
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-teal-600" aria-hidden="true" />
          増加した年
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-slate-500" aria-hidden="true" />
          その他の減少した年
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-slate-200" aria-hidden="true" />
          ふだんの増減幅（真ん中50％の範囲）
        </li>
      </ul>
      <div
        className="mt-3 h-[280px] w-full min-w-0"
        role="img"
        aria-label="2007年から2023年までの前年差の棒グラフ。2012年、2015年、2016年、2023年にマイナス3,000人を超える大きな減少がある。"
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 290 }}>
          <BarChart data={rows} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" vertical={false} />
            <ReferenceArea y1={q1} y2={q3} fill="#cbd5e1" fillOpacity={0.38} />
            <ReferenceLine y={0} stroke="#475569" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "#334155" }}
              interval={1}
              tickLine={false}
            />
            <YAxis
              domain={[-6000, 4000]}
              ticks={[-6000, -4000, -2000, 0, 2000, 4000]}
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v) => (v === 0 ? "0" : signed(v))}
            />
            <Tooltip content={<YoYTooltip />} />
            <Bar dataKey="diff" name="前年差" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {rows.map((entry) => {
                const fill = entry.isMoveYear
                  ? "#b45309"
                  : entry.diff >= 0
                  ? "#0d9488"
                  : "#64748b";
                return <Cell key={entry.year} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs leading-6 text-slate-600">
        出典：八王子市「第2期はちおうじ学園都市ビジョン」19ページの年次値をもとに算出。移転のない2012年にも−4,855人の減少があり、移転との時期の重なりは示せますが単独の原因とまでは言えません。
      </p>
    </figure>
  );
}

export function StudentSurveyConfidenceChart({
  analysis,
}: {
  analysis: StudentAnalysisProp;
}) {
  const items = [
    {
      label: "調査時点で八王子市内に住んでいた",
      ...analysis.surveySummary.resident,
    },
    {
      label: "卒業後に市内に住みたい、または住む予定",
      ...analysis.surveySummary.intendsToLive,
    },
  ];
  return (
    <figure className={card}>
      <figcaption className="font-bold text-slate-900">
        2023年の学生アンケートと95％信頼区間（回答者{n(analysis.surveySummary.responses)}人）
      </figcaption>
      <p className="mt-1 text-xs text-slate-600">
        点：回答割合（％） · 横棒の両端：無作為抽出と仮定したときの誤差の幅（Wilson 95％信頼区間）
      </p>
      <ul className="mt-4 space-y-6 text-sm leading-6">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-slate-900">{item.label}</span>
              <span className="tabular-nums text-slate-700">
                <strong className="text-base text-teal-950">{item.percent}％</strong>
                <span className="ml-2 text-xs text-slate-600">
                  （目安の幅 {item.ciLow.toFixed(1)}～{item.ciHigh.toFixed(1)}％、約{n(item.approxCount)}人）
                </span>
              </span>
            </div>
            <svg
              viewBox="0 0 500 34"
              className="mt-1.5 h-auto w-full"
              role="img"
              aria-label={`${item.label}は${item.percent}％。95％信頼区間は${item.ciLow.toFixed(1)}％から${item.ciHigh.toFixed(1)}％。`}
            >
              <rect x="0" y="10" width="500" height="10" rx="5" fill="#f1f5f9" />
              <rect
                x="0"
                y="10"
                width={item.percent * 5}
                height="10"
                rx="5"
                fill="#0f766e"
                fillOpacity="0.25"
              />
              <line
                x1={item.ciLow * 5}
                x2={item.ciHigh * 5}
                y1="15"
                y2="15"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              <line
                x1={item.ciLow * 5}
                x2={item.ciLow * 5}
                y1="9"
                y2="21"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <line
                x1={item.ciHigh * 5}
                x2={item.ciHigh * 5}
                y1="9"
                y2="21"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={item.percent * 5}
                cy="15"
                r="5.5"
                fill="#0f766e"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {[0, 25, 50, 75, 100].map((tick) => (
                <text
                  key={tick}
                  x={tick === 0 ? 2 : tick === 100 ? 498 : tick * 5}
                  y="32"
                  textAnchor={tick === 0 ? "start" : tick === 100 ? "end" : "middle"}
                  fontSize="10"
                  fill="#64748b"
                >
                  {tick}%
                </text>
              ))}
            </svg>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-6 text-slate-600">
        棒の全幅は100％。二つは別々の質問への回答です。メールと広報SNSによるWeb調査のため、回答者の偏りはこの幅には含まれません。
      </p>
    </figure>
  );
}

export function CampusLocationMap({
  campusData,
}: {
  campusData: CampusLocationsProp;
}) {
  const [view, setView] = useState<"local" | "wide">("local");
  const [selectedId, setSelectedId] = useState<string>(
    campusData.markers.find((m) => m.hasRelocation)?.id ?? campusData.markers[0].id
  );
  const selected =
    campusData.markers.find((m) => m.id === selectedId) ?? campusData.markers[0];

  const relocBySchool = new Map(campusData.relocations.map((r) => [r.school, r]));
  const selectedRelocations = selected.schools
    .map((s) => relocBySchool.get(s.name))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <figure className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="font-bold text-slate-900">
            {view === "local"
              ? "大学コンソーシアム八王子 加盟25校の位置図"
              : "八王子市内からのキャンパス移転3件（広域図）"}
          </figcaption>
          <p className="mt-1 text-xs text-slate-600">
            {view === "local"
              ? `加盟校一覧（${campusData.rosterDate}時点）の所在地を表示 · 同一所在地の2組は1つの点にまとめて表示`
              : "2015年（拓殖大）・2016年（杏林大）・2023年（中央大）の元キャンパスと移転先"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="地図の表示範囲">
          <button
            type="button"
            className={buttonClass(view === "local")}
            aria-pressed={view === "local"}
            onClick={() => setView("local")}
          >
            八王子周辺（25校）
          </button>
          <button
            type="button"
            className={buttonClass(view === "wide")}
            aria-pressed={view === "wide"}
            onClick={() => setView("wide")}
          >
            移転3件の広域図
          </button>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-teal-700" aria-hidden="true" />
          八王子市内の加盟校
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-slate-500" aria-hidden="true" />
          市外所在の加盟校（町田・日野・多摩）
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-amber-600 bg-teal-700"
            aria-hidden="true"
          />
          移転があった大学
        </li>
      </ul>

      {view === "local" ? (
        <svg
          viewBox={campusData.localView.viewBox}
          className="mt-3 h-auto w-full rounded-xl border border-slate-200 bg-slate-50"
          role="group"
          aria-label="八王子市と周辺にある大学コンソーシアム八王子加盟25校の位置図。下のプルダウンと一覧表でも所在地を確認できます。"
        >
          <g aria-hidden="true">
            {campusData.localView.cityPaths.map((d, i) => (
              <path key={i} d={d} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.7" />
            ))}
          </g>
          {campusData.localView.stations.map((st) => (
            <g key={st.name} aria-hidden="true">
              <rect
                x={st.x - 3.5}
                y={st.y - 3.5}
                width="7"
                height="7"
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <text
                x={st.x + 6}
                y={st.y + 4}
                fontSize="11"
                fontWeight="600"
                fill="#334155"
              >
                {st.name}
              </text>
            </g>
          ))}
          {campusData.markers.map((m) => {
            const isSelected = m.id === selected.id;
            const fill = m.inHachiojiCity ? "#0f766e" : "#475569";
            const label = m.schools.map((s) => s.name).join("・");
            return (
              <g key={m.id}>
                {m.hasRelocation && (
                  <circle
                    cx={m.local.x}
                    cy={m.local.y}
                    r={isSelected ? 12 : 10}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2.5"
                  />
                )}
                <circle
                  cx={m.local.x}
                  cy={m.local.y}
                  r={isSelected ? 7.5 : 6}
                  fill={fill}
                  stroke={isSelected ? "#0f172a" : "#ffffff"}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label}（${m.address}）`}
                  onClick={() => setSelectedId(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(m.id);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <title>{`${label}（${m.address}）`}</title>
                </circle>
                {m.hasRelocation && (
                  <text
                    x={m.local.x}
                    y={m.local.y - 14}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#92400e"
                    pointerEvents="none"
                  >
                    {m.schools[0].name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <svg
          viewBox={campusData.wideView.viewBox}
          className="mt-3 h-auto w-full rounded-xl border border-slate-200 bg-slate-50"
          role="img"
          aria-label="拓殖大学・杏林大学・中央大学の移転元と移転先を示す広域位置図"
        >
          <defs>
            <marker
              id="reloc-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#b45309" />
            </marker>
          </defs>
          <g aria-hidden="true">
            {campusData.wideView.cityPaths.map((d, i) => (
              <path key={i} d={d} fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            ))}
          </g>
          {campusData.wideView.areaLabels.map((area) => (
            <text
              key={area.name}
              x={area.x}
              y={area.y + (area.name === "八王子市" ? 4 : -14)}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#475569"
            >
              {area.name}
            </text>
          ))}
          {campusData.relocations.map((r, idx) => {
            const mx = (r.wideFrom.x + r.wideTo.x) / 2;
            const curveLift = idx === 0 ? -42 : idx === 1 ? -15 : 38;
            const my = (r.wideFrom.y + r.wideTo.y) / 2 + curveLift;
            return (
              <g key={r.school}>
                <path
                  d={`M ${r.wideFrom.x},${r.wideFrom.y} Q ${mx},${my} ${r.wideTo.x},${r.wideTo.y}`}
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  markerEnd="url(#reloc-arrow)"
                />
                <circle
                  cx={r.wideFrom.x}
                  cy={r.wideFrom.y}
                  r="6"
                  fill="#0f766e"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={r.wideTo.x}
                  cy={r.wideTo.y}
                  r="6"
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={r.wideFrom.x - 6}
                  y={r.wideFrom.y + (idx === 1 ? -10 : 16)}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="700"
                  fill="#0f766e"
                >
                  {r.school}（{r.date.slice(0, 4)}年）
                </text>
                <text
                  x={r.wideTo.x - 10}
                  y={r.wideTo.y + (idx === 0 ? -12 : idx === 2 ? 16 : 16)}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="600"
                  fill="#92400e"
                >
                  {r.toCampus}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <div className="mt-4 space-y-3">
        <label htmlFor="campus-select" className="block text-sm font-semibold text-slate-900">
          学校を選んで所在地を確認する
        </label>
        <select
          id="campus-select"
          value={selected.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900"
        >
          {campusData.markers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.schools.map((s) => s.name).join(" / ")} · {m.address}
              {m.inHachiojiCity ? "" : "（市外）"}
            </option>
          ))}
        </select>

        <div aria-live="polite" className="rounded-xl bg-teal-50 p-4 text-sm">
          <p className="font-bold text-teal-950">
            {selected.schools.map((s) => s.name).join("・")}
          </p>
          <p className="mt-1 text-slate-700">
            所在地：{selected.fullAddress}
            {!selected.inHachiojiCity && "（市外所在の加盟校）"}
          </p>
          {selectedRelocations.map((rel) => (
            <p key={rel.date} className="mt-2 rounded-lg bg-white/80 p-2.5 text-xs leading-6 text-slate-700">
              <strong className="text-amber-900">{rel.date.replace("-", "年")}月 移転：</strong>
              {rel.fromCampus} → {rel.toCampus}（{rel.toAddress}）。{rel.summary}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-600">
        位置図はキャンパスの場所と移転先を示すもので、各学校の学生数や地域別の学生増減を示すものではありません。境界シルエットは e-Stat「令和2年国勢調査 町丁・字等境界データ」、座標は国土地理院の住所検索APIで取得し確認しています。
      </p>

      <details className="mt-4 rounded-xl bg-slate-50 p-4">
        <summary className="cursor-pointer font-semibold text-teal-900">
          加盟25校の所在地一覧（{campusData.rosterDate}時点）
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">大学コンソーシアム八王子 加盟25校の所在地</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="p-2 text-left">学校名</th>
                <th scope="col" className="p-2 text-left">所在地</th>
                <th scope="col" className="p-2 text-left">開校年月</th>
                <th scope="col" className="p-2 text-left">区分</th>
              </tr>
            </thead>
            <tbody>
              {campusData.schools.map((s) => (
                <tr key={s.no} className="border-t border-slate-200">
                  <th scope="row" className="p-2 text-left font-normal">{s.name}</th>
                  <td className="p-2">{s.address}</td>
                  <td className="p-2 tabular-nums">{s.opened}</td>
                  <td className="p-2">{s.inHachiojiCity ? "八王子市内" : "市外"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
