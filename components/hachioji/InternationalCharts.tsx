"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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

export interface InternationalAnalysisProp {
  decomposition: {
    fromDate: string;
    toDate: string;
    totalFrom: number;
    totalTo: number;
    totalDiff: number;
    totalChangePercent: number;
    japaneseFrom: number;
    japaneseTo: number;
    japaneseDiff: number;
    japaneseChangePercent: number;
    foreignFrom: number;
    foreignTo: number;
    foreignDiff: number;
    foreignChangePercent: number;
    offsetRatioPercent: number;
  };
  indexSummary: {
    baseYear: number;
    latestYear: number;
    years: number;
    foreignRatio: number;
    foreignCagrPercent: number;
    japaneseCagrPercent: number;
    totalCagrPercent: number;
    series: {
      year: number;
      date: string;
      foreign: number;
      japanese: number;
      total: number;
      foreignShare: number;
      foreignIndex: number;
      japaneseIndex: number;
      totalIndex: number;
    }[];
  };
  yoySummary: {
    periods: {
      pre2020: { label: string; years: number; avgForeignDiff: number };
      stagnation: { label: string; years: number; avgForeignDiff: number };
      post2022: {
        label: string;
        years: number;
        avgForeignDiff: number;
        maxYear: number;
        maxDiff: number;
        ratioToPre2020Avg: number;
      };
    };
    rows: {
      year: number;
      date: string;
      foreignDiff: number;
      foreignYoYPct: number;
      japaneseDiff: number;
      totalDiff: number;
    }[];
  };
  nationalitySummary: {
    categories: {
      name: string;
      from: number;
      to: number;
      diff: number;
      ratio: number;
      contributionPercent: number;
      fromShare: number;
      toShare: number;
      sharePointDiff: number;
    }[];
    threeEmerging: {
      names: string[];
      diffSum: number;
      contributionPercent: number;
    };
    annualShares: {
      year: number;
      date: string;
      foreign: number;
      counts: Record<string, number>;
      shares: Record<string, number>;
    }[];
  };
  nearbySummary: {
    date: string;
    medianShare: number;
    medianForeign: number;
    cities: {
      code: string;
      name: string;
      total: number;
      japanese: number;
      foreign: number;
      share: number;
      isHachioji: boolean;
    }[];
  };
}

export interface TownMapEntry {
  code: string;
  name: string;
  status: "comparable" | "suppressed" | "boundary_changed";
  path: string;
  foreign2024: number | null;
  total2024: number | null;
  share2024: number | null;
  foreign2026: number | null;
  total2026: number | null;
  share2026: number | null;
  foreignDiff: number | null;
  sharePointDiff: number | null;
  note?: string;
}

export interface TownMapProp {
  generatedOn: string;
  viewBox: string;
  comparisonDates: { from: string; to: string };
  suppressionRule: string;
  boundaryChangedRule: string;
  counts: {
    totalTowns: number;
    comparableTowns: number;
    suppressedTowns: number;
    boundaryChangedTowns: number;
  };
  cityTotals: {
    from: { date: string; total: number; foreign: number; share: number };
    to: { date: string; total: number; foreign: number; share: number };
  };
  stations: { name: string; x: number; y: number }[];
  top10Increase: Omit<TownMapEntry, "path">[];
  bottom10Change: Omit<TownMapEntry, "path">[];
  towns: TownMapEntry[];
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

function SimpleTooltip({
  active,
  payload,
  label,
  unit,
  decimals = 0,
  signedMode = false,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  unit: string;
  decimals?: number;
  signedMode?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
      <p className="mb-1 font-bold text-slate-900">{label}</p>
      {payload.map((entry) => {
        const val = Number(entry.value);
        const text = signedMode
          ? `${signed(Math.round(val))}${unit}`
          : decimals > 0
          ? `${val.toFixed(decimals)}${unit}`
          : `${n(Math.round(val))}${unit}`;
        return (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? "#0f766e" }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PopulationDecompositionChart({
  analysis,
}: {
  analysis: InternationalAnalysisProp;
}) {
  const { decomposition } = analysis;
  const bars = [
    {
      name: "日本人住民",
      diff: decomposition.japaneseDiff,
      pct: decomposition.japaneseChangePercent,
      fill: "#be123c",
    },
    {
      name: "外国人住民",
      diff: decomposition.foreignDiff,
      pct: decomposition.foreignChangePercent,
      fill: "#0f766e",
    },
    {
      name: "差し引き総人口",
      diff: decomposition.totalDiff,
      pct: decomposition.totalChangePercent,
      fill: "#334155",
    },
  ];

  return (
    <figure className={card}>
      <figcaption className="font-bold text-slate-900">
        13年間の人口変化の内訳（2013年10月1日 → 2026年10月1日）
      </figcaption>
      <p className="mt-1 text-xs text-slate-600">
        単位：人 · 日本人住民の減少（{signed(decomposition.japaneseDiff)}人）と外国人住民の増加（
        {signed(decomposition.foreignDiff)}人）の差し引きが総人口の変化（
        {signed(decomposition.totalDiff)}人）
      </p>
      <div
        className="mt-3 h-[250px] w-full min-w-0"
        role="img"
        aria-label="2013年から2026年までの人口変化の内訳。日本人住民はマイナス15,539人、外国人住民はプラス10,964人、総人口はマイナス4,575人。"
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
          <BarChart data={bars} margin={{ top: 14, right: 16, left: 6, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" vertical={false} />
            <ReferenceLine y={0} stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#0f172a" }} tickLine={false} />
            <YAxis
              domain={[-20000, 15000]}
              ticks={[-20000, -10000, 0, 10000]}
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => (v === 0 ? "0" : signed(v))}
            />
            <Tooltip content={<SimpleTooltip unit="人" signedMode />} />
            <Bar dataKey="diff" name="13年間の増減" radius={[4, 4, 4, 4]} isAnimationActive={false}>
              {bars.map((b) => (
                <Cell key={b.name} fill={b.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        {bars.map((b) => (
          <div key={b.name} className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-700">{b.name}</p>
            <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
              {signed(b.diff)}人
              <span className="ml-1.5 text-xs font-normal text-slate-600">
                （{b.pct > 0 ? "+" : ""}
                {b.pct.toFixed(1)}％）
              </span>
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function InternationalTrendCharts({
  analysis,
}: {
  analysis: InternationalAnalysisProp;
}) {
  const [view, setView] = useState<"index" | "yoy">("index");
  const { indexSummary, yoySummary } = analysis;
  const yoyMap = new Map(yoySummary.rows.map((r) => [r.year, r]));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <figure className={card}>
          <figcaption className="font-bold text-slate-900">外国人住民数</figcaption>
          <p className="text-xs text-slate-600">各年10月1日 · 住民基本台帳 · 単位：人</p>
          <div
            className="mt-2 h-[220px] w-full min-w-0"
            role="img"
            aria-label="外国人住民数の推移。2013年の8,997人から2026年の19,961人へ増加。"
          >
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
              <LineChart data={indexSummary.series} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#334155" }} interval={3} tickLine={false} />
                <YAxis
                  domain={[0, 22000]}
                  ticks={[0, 5000, 10000, 15000, 20000]}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) => n(v)}
                />
                <Tooltip content={<SimpleTooltip unit="人" />} />
                <Line
                  type="monotone"
                  dataKey="foreign"
                  name="外国人住民数"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>

        <figure className={card}>
          <figcaption className="font-bold text-slate-900">総人口に占める外国人住民の割合</figcaption>
          <p className="text-xs text-slate-600">各年10月1日 · 住民基本台帳 · 単位：％</p>
          <div
            className="mt-2 h-[220px] w-full min-w-0"
            role="img"
            aria-label="総人口に占める外国人住民の割合の推移。2013年の1.60％から2026年の3.57％へ上昇。"
          >
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
              <LineChart data={indexSummary.series} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#334155" }} interval={3} tickLine={false} />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<SimpleTooltip unit="％" decimals={2} />} />
                <Line
                  type="monotone"
                  dataKey="foreignShare"
                  name="外国人住民割合"
                  stroke="#0369a1"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#ffffff", stroke: "#0369a1", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>

      <figure className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <figcaption className="font-bold text-slate-900">
              {view === "index"
                ? "2013年＝100 とした指数と年平均成長率（2013～2026年）"
                : "年ごとの外国人住民数の増減（2014～2026年・前年差）"}
            </figcaption>
            <p className="mt-1 text-xs text-slate-600">
              {view === "index"
                ? `2013年を100とした相対値 · 外国人は${indexSummary.foreignRatio}倍（年平均 +${indexSummary.foreignCagrPercent.toFixed(2)}％）`
                : "単位：人（各年10月1日の前年差） · 薄い帯は2020～2021年の停滞期"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="グラフ切り替え">
            <button
              type="button"
              className={buttonClass(view === "index")}
              aria-pressed={view === "index"}
              onClick={() => setView("index")}
            >
              2013年＝100 指数
            </button>
            <button
              type="button"
              className={buttonClass(view === "yoy")}
              aria-pressed={view === "yoy"}
              onClick={() => setView("yoy")}
            >
              年ごとの増加人数
            </button>
          </div>
        </div>

        {view === "index" ? (
          <>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-[3px] border-teal-700" aria-hidden="true" />
                外国人住民（年平均 +{indexSummary.foreignCagrPercent.toFixed(2)}％）
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-slate-700" aria-hidden="true" />
                総人口（年平均 {indexSummary.totalCagrPercent.toFixed(2)}％）
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-rose-700" aria-hidden="true" />
                日本人住民（年平均 {indexSummary.japaneseCagrPercent.toFixed(2)}％）
              </li>
            </ul>
            <div
              className="mt-3 h-[270px] w-full min-w-0"
              role="img"
              aria-label="2013年を100とした指数。外国人住民は2026年に221.9、総人口は99.2、日本人住民は97.2。"
            >
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
                <LineChart data={indexSummary.series} margin={{ top: 10, right: 14, left: 2, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#334155" }} interval={1} tickLine={false} />
                  <YAxis
                    domain={[80, 240]}
                    ticks={[100, 140, 180, 220]}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<SimpleTooltip unit="" decimals={1} />} />
                  <ReferenceLine y={100} stroke="#64748b" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="foreignIndex"
                    name="外国人住民指数"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalIndex"
                    name="総人口指数"
                    stroke="#334155"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="japaneseIndex"
                    name="日本人住民指数"
                    stroke="#be123c"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-sky-700" aria-hidden="true" />
                2014～2019年（年平均 +{n(yoySummary.periods.pre2020.avgForeignDiff)}人）
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-rose-700" aria-hidden="true" />
                2020～2021年 停滞期（平均 {signed(yoySummary.periods.stagnation.avgForeignDiff)}人）
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-teal-700" aria-hidden="true" />
                2022～2026年（年平均 +{n(yoySummary.periods.post2022.avgForeignDiff)}人）
              </li>
            </ul>
            <div
              className="mt-3 h-[270px] w-full min-w-0"
              role="img"
              aria-label="年ごとの外国人住民数の前年差。2020年はマイナス239人、2021年はプラス17人で停滞し、2022年以降は年平均1,413人増加。"
            >
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
                <BarChart data={yoySummary.rows} margin={{ top: 10, right: 12, left: 4, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" vertical={false} />
                  <ReferenceArea x1={2020} x2={2021} fill="#fef3c7" fillOpacity={0.75} />
                  <ReferenceLine y={0} stroke="#475569" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#334155" }} interval={1} tickLine={false} />
                  <YAxis
                    domain={[-500, 2500]}
                    ticks={[-500, 0, 500, 1000, 1500, 2000, 2500]}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(v) => (v === 0 ? "0" : signed(v))}
                  />
                  <Tooltip content={<SimpleTooltip unit="人" signedMode />} />
                  <Bar dataKey="foreignDiff" name="外国人住民 前年差" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {yoySummary.rows.map((r) => {
                      const fill =
                        r.year <= 2019
                          ? "#0369a1"
                          : r.year <= 2021
                          ? r.foreignDiff < 0
                            ? "#be123c"
                            : "#94a3b8"
                          : "#0f766e";
                      return <Cell key={r.year} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </figure>

      <details className={card}>
        <summary className="cursor-pointer font-semibold text-teal-900">14年分の人口と割合を表で見る</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm leading-6">
            <caption className="sr-only">八王子市、各年10月1日。人数の単位は人</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="p-2 text-left">年</th>
                <th scope="col" className="p-2 text-right">外国人</th>
                <th scope="col" className="p-2 text-right">前年差</th>
                <th scope="col" className="p-2 text-right">指数（2013=100）</th>
                <th scope="col" className="p-2 text-right">総人口</th>
                <th scope="col" className="p-2 text-right">割合</th>
              </tr>
            </thead>
            <tbody>
              {indexSummary.series.map((row) => {
                const yoy = yoyMap.get(row.year);
                return (
                  <tr key={row.date} className="border-t border-slate-200">
                    <th scope="row" className="p-2 text-left font-normal">{row.year}</th>
                    <td className="p-2 text-right tabular-nums">{n(row.foreign)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {yoy ? signed(yoy.foreignDiff) : "—"}
                    </td>
                    <td className="p-2 text-right tabular-nums">{row.foreignIndex.toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">{n(row.total)}</td>
                    <td className="p-2 text-right tabular-nums">{row.foreignShare.toFixed(2)}％</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  "中国": "#0f766e",
  "ベトナム": "#d97706",
  "ネパール": "#0284c7",
  "フィリピン": "#7c3aed",
  "ミャンマー": "#e11d48",
  "この5区分以外": "#94a3b8",
};

export function NationalityContributionCharts({
  analysis,
}: {
  analysis: InternationalAnalysisProp;
}) {
  const [tab, setTab] = useState<"contrib" | "stacked">("contrib");
  const { categories, annualShares } = analysis.nationalitySummary;
  const sortedByDiff = [...categories].sort((a, b) => b.diff - a.diff);

  const stackedData = annualShares.map((row) => ({
    year: row.year,
    ...row.shares,
  }));

  return (
    <figure className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="font-bold text-slate-900">
            {tab === "contrib"
              ? "国籍・地域別の増加人数と寄与（2013年 → 2026年）"
              : "国籍・地域別の構成比の14年推移（100％積み上げ）"}
          </figcaption>
          <p className="mt-1 text-xs text-slate-600">
            {tab === "contrib"
              ? "2013年10月1日と2026年10月1日の比較 · 増加人数順に並べています"
              : "各年10月1日 · 外国人住民全体を100％とした構成比（％）"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="国籍・地域の表示切り替え">
          <button
            type="button"
            className={buttonClass(tab === "contrib")}
            aria-pressed={tab === "contrib"}
            onClick={() => setTab("contrib")}
          >
            増加人数・倍率
          </button>
          <button
            type="button"
            className={buttonClass(tab === "stacked")}
            aria-pressed={tab === "stacked"}
            onClick={() => setTab("stacked")}
          >
            構成比の推移（100％）
          </button>
        </div>
      </div>

      {tab === "contrib" ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div
            className="h-[270px] w-full min-w-0"
            role="img"
            aria-label="国籍・地域別の増加人数。この5区分以外がプラス3,230人、中国がプラス2,685人、ベトナムがプラス2,034人。"
          >
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
              <BarChart
                data={sortedByDiff}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 6, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 3500]}
                  ticks={[0, 1000, 2000, 3000]}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickFormatter={(v) => `+${n(v)}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fontSize: 12, fill: "#0f172a" }}
                  tickLine={false}
                />
                <Tooltip content={<SimpleTooltip unit="人" signedMode />} />
                <Bar dataKey="diff" name="増加人数" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {sortedByDiff.map((c) => (
                    <Cell key={c.name} fill={CAT_COLORS[c.name] ?? "#0f766e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2.5 text-sm">
            {sortedByDiff.map((c) => (
              <li key={c.name} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-slate-900">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CAT_COLORS[c.name] }}
                      aria-hidden="true"
                    />
                    {c.name}
                  </span>
                  <span className="font-bold tabular-nums text-teal-950">
                    {signed(c.diff)}人
                  </span>
                </div>
                <p className="mt-1 text-xs tabular-nums text-slate-600">
                  {n(c.from)}人 → {n(c.to)}人（{c.ratio.toFixed(1)}倍 · 増加の{c.contributionPercent.toFixed(1)}％ · 構成比 {c.fromShare.toFixed(1)}％ → {c.toShare.toFixed(1)}％）
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
            {["中国", "ベトナム", "ネパール", "フィリピン", "ミャンマー", "この5区分以外"].map((name) => (
              <li key={name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: CAT_COLORS[name] }}
                  aria-hidden="true"
                />
                {name}
              </li>
            ))}
          </ul>
          <div
            className="mt-3 h-[290px] w-full min-w-0"
            role="img"
            aria-label="2013年から2026年までの国籍・地域別構成比の100％積み上げ面グラフ。中国は41.3％から32.1％に下がり、ベトナム・ネパール・ミャンマーの合計構成比が広がっている。"
          >
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
              <AreaChart data={stackedData} margin={{ top: 10, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#334155" }} interval={1} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<SimpleTooltip unit="％" decimals={1} />} />
                {["中国", "ベトナム", "ネパール", "フィリピン", "ミャンマー", "この5区分以外"].map((name) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stackId="1"
                    stroke={CAT_COLORS[name]}
                    fill={CAT_COLORS[name]}
                    fillOpacity={0.85}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <p className="mt-3 text-xs leading-6 text-slate-600">
        「この5区分以外」は各年の総数から同じ5区分を引いた残りです。国籍・地域の総数や、個人の背景はこの表から分かりません。
      </p>

      <details className="mt-4 rounded-xl bg-slate-50 p-4">
        <summary className="cursor-pointer font-semibold text-teal-900">
          6区分の人数・増加への寄与・倍率を表で見る
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">国籍・地域別の人数、増減、寄与率、倍率（2013年→2026年）</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="p-2 text-left">区分</th>
                <th scope="col" className="p-2 text-right">2013年</th>
                <th scope="col" className="p-2 text-right">2026年</th>
                <th scope="col" className="p-2 text-right">増減</th>
                <th scope="col" className="p-2 text-right">寄与率</th>
                <th scope="col" className="p-2 text-right">倍率</th>
                <th scope="col" className="p-2 text-right">構成比差</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.name} className="border-t border-slate-200">
                  <th scope="row" className="p-2 text-left font-normal">{c.name}</th>
                  <td className="p-2 text-right tabular-nums">{n(c.from)}人</td>
                  <td className="p-2 text-right tabular-nums">{n(c.to)}人</td>
                  <td className="p-2 text-right tabular-nums">{signed(c.diff)}人</td>
                  <td className="p-2 text-right tabular-nums">{c.contributionPercent.toFixed(1)}％</td>
                  <td className="p-2 text-right tabular-nums">{c.ratio.toFixed(2)}倍</td>
                  <td className="p-2 text-right tabular-nums">
                    {c.sharePointDiff > 0 ? "+" : ""}
                    {c.sharePointDiff.toFixed(1)}pt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function TownForeignMap({ townMap }: { townMap: TownMapProp }) {
  const [metric, setMetric] = useState<"diff" | "share2026">("diff");
  const [tableTab, setTableTab] = useState<"top" | "bottom">("top");
  const [selectedCode, setSelectedCode] = useState<string>(
    townMap.top10Increase[0]?.code ?? townMap.towns[0].code
  );
  const selected = townMap.towns.find((t) => t.code === selectedCode) ?? townMap.towns[0];

  const getFill = (t: TownMapEntry) => {
    if (t.status === "boundary_changed") return "url(#hatch-boundary-changed)";
    if (t.status === "suppressed") return "#e2e8f0";
    if (metric === "diff") {
      const d = t.sharePointDiff ?? 0;
      if (d < 0) return "#0284c7";
      if (d < 0.5) return "#d1fae5";
      if (d < 1.5) return "#5eead4";
      if (d < 2.5) return "#0d9488";
      return "#115e59";
    }
    const s = t.share2026 ?? 0;
    if (s < 2) return "#ecfdf5";
    if (s < 4) return "#99f6e4";
    if (s < 6) return "#2dd4bf";
    if (s < 10) return "#0f766e";
    return "#134e4a";
  };

  const legendItems =
    metric === "diff"
      ? [
          { color: "#0284c7", label: "低下（0pt未満）" },
          { color: "#d1fae5", label: "0〜+0.5pt未満" },
          { color: "#5eead4", label: "+0.5〜+1.5pt未満" },
          { color: "#0d9488", label: "+1.5〜+2.5pt未満" },
          { color: "#115e59", label: "+2.5pt以上" },
        ]
      : [
          { color: "#ecfdf5", label: "2％未満" },
          { color: "#99f6e4", label: "2〜4％未満" },
          { color: "#2dd4bf", label: "4〜6％未満" },
          { color: "#0f766e", label: "6〜10％未満" },
          { color: "#134e4a", label: "10％以上" },
        ];

  const tableRows = tableTab === "top" ? townMap.top10Increase : townMap.bottom10Change;

  return (
    <figure className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="font-bold text-slate-900">
            {metric === "diff"
              ? "町丁別の外国人住民割合の変化（2024年4月末 → 2026年10月末）"
              : "町丁別の外国人住民割合（2026年10月末）"}
          </figcaption>
          <p className="mt-1 text-xs text-slate-600">
            全199町丁（比較可能 {townMap.counts.comparableTowns} · 少数非表示{" "}
            {townMap.counts.suppressedTowns} · 区域変更対象外 {townMap.counts.boundaryChangedTowns}）
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="地図の指標切り替え">
          <button
            type="button"
            className={buttonClass(metric === "diff")}
            aria-pressed={metric === "diff"}
            onClick={() => setMetric("diff")}
          >
            割合の変化（ポイント差）
          </button>
          <button
            type="button"
            className={buttonClass(metric === "share2026")}
            aria-pressed={metric === "share2026"}
            onClick={() => setMetric("share2026")}
          >
            2026年10月の割合
          </button>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
        {legendItems.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-slate-200"
            aria-hidden="true"
          />
          少数（個別数値非表示）
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-slate-400"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 2px, #ffffff 2px, #ffffff 5px)",
            }}
            aria-hidden="true"
          />
          区域変更あり（比較対象外）
        </li>
      </ul>

      <svg
        viewBox={townMap.viewBox}
        className="mt-3 h-auto w-full rounded-xl border border-slate-200 bg-slate-50"
        role="img"
        aria-label="八王子市の町丁別外国人住民地図。下の町丁選択と上位・下位10町丁表でも値を確認できます。"
      >
        <defs>
          <pattern
            id="hatch-boundary-changed"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="#ffffff" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="2.5" />
          </pattern>
        </defs>
        {townMap.towns.map((t) => {
          const isSelected = t.code === selected.code;
          return (
            <path
              key={t.code}
              d={t.path}
              fill={getFill(t)}
              fillRule="evenodd"
              stroke={isSelected ? "#0f172a" : "#64748b"}
              strokeWidth={isSelected ? 2 : 0.45}
              role="button"
              tabIndex={0}
              aria-label={
                t.status === "comparable"
                  ? `${t.name}：2026年10月 ${t.share2026?.toFixed(2)}％、変化 ${
                      (t.sharePointDiff ?? 0) > 0 ? "+" : ""
                    }${t.sharePointDiff?.toFixed(2)}ポイント`
                  : `${t.name}：${t.note}`
              }
              onClick={() => setSelectedCode(t.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCode(t.code);
                }
              }}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <title>
                {t.status === "comparable"
                  ? `${t.name} (${t.share2026?.toFixed(2)}% / ${
                      (t.sharePointDiff ?? 0) > 0 ? "+" : ""
                    }${t.sharePointDiff?.toFixed(2)}pt)`
                  : `${t.name}（非表示・対象外）`}
              </title>
            </path>
          );
        })}
        {townMap.stations.map((st) => (
          <g key={st.name} pointerEvents="none">
            <circle cx={st.x} cy={st.y} r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
            <text
              x={st.x + 6}
              y={st.y + 4}
              fontSize="11"
              fontWeight="700"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2.5"
              paintOrder="stroke"
            >
              {st.name}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-4 space-y-3">
        <label htmlFor="town-map-select" className="block text-sm font-semibold text-slate-900">
          町丁を選んで数値を確認する
        </label>
        <select
          id="town-map-select"
          value={selected.code}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900"
        >
          {townMap.towns.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
              {t.status === "comparable"
                ? ` · ${t.share2026?.toFixed(2)}％（${
                    (t.sharePointDiff ?? 0) > 0 ? "+" : ""
                  }${t.sharePointDiff?.toFixed(2)}pt）`
                : t.status === "boundary_changed"
                ? " · 区域変更あり（比較対象外）"
                : " · 少数（個別数値非表示）"}
            </option>
          ))}
        </select>

        <div aria-live="polite" className="rounded-xl bg-teal-50 p-4 text-sm">
          <p className="font-bold text-teal-950">{selected.name}</p>
          {selected.status === "comparable" ? (
            <div className="mt-1.5 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
              <p className="tabular-nums">
                2024年4月末：{n(selected.foreign2024!)}人 / {n(selected.total2024!)}人（
                <strong>{selected.share2024!.toFixed(2)}％</strong>）
              </p>
              <p className="tabular-nums">
                2026年10月末：{n(selected.foreign2026!)}人 / {n(selected.total2026!)}人（
                <strong>{selected.share2026!.toFixed(2)}％</strong>）
              </p>
              <p className="tabular-nums">
                変化：<strong>{signed(selected.foreignDiff!)}人</strong>（
                <strong>
                  {selected.sharePointDiff! > 0 ? "+" : ""}
                  {selected.sharePointDiff!.toFixed(2)}ポイント
                </strong>
                ）
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs leading-6 text-slate-700">{selected.note}</p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">割合の変化（ポイント差）上位・下位10町丁</p>
          <div className="flex gap-2" role="group" aria-label="上位・下位の切り替え">
            <button
              type="button"
              className={buttonClass(tableTab === "top")}
              aria-pressed={tableTab === "top"}
              onClick={() => setTableTab("top")}
            >
              上昇 上位10
            </button>
            <button
              type="button"
              className={buttonClass(tableTab === "bottom")}
              aria-pressed={tableTab === "bottom"}
              onClick={() => setTableTab("bottom")}
            >
              低下・変化小 10
            </button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">
              町丁別の外国人住民割合の変化（2024年4月末→2026年10月末、比較可能180町丁より）
            </caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="p-2 text-left">町丁名</th>
                <th scope="col" className="p-2 text-right">2024年4月</th>
                <th scope="col" className="p-2 text-right">2026年10月</th>
                <th scope="col" className="p-2 text-right">人数差</th>
                <th scope="col" className="p-2 text-right">割合差</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.code} className="border-t border-slate-200">
                  <th scope="row" className="p-2 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => setSelectedCode(row.code)}
                      className="text-left font-semibold text-teal-900 underline decoration-teal-200 underline-offset-4"
                    >
                      {row.name}
                    </button>
                  </th>
                  <td className="p-2 text-right tabular-nums">
                    {row.share2024!.toFixed(2)}％（{n(row.foreign2024!)}人）
                  </td>
                  <td className="p-2 text-right tabular-nums">
                    {row.share2026!.toFixed(2)}％（{n(row.foreign2026!)}人）
                  </td>
                  <td className="p-2 text-right tabular-nums">{signed(row.foreignDiff!)}人</td>
                  <td className="p-2 text-right font-bold tabular-nums">
                    {row.sharePointDiff! > 0 ? "+" : ""}
                    {row.sharePointDiff!.toFixed(2)}pt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-600">
        出典：八王子市「町丁別世帯数及び人口」（CC BY 4.0）、政府統計の総合窓口（e-Stat）「令和2年国勢調査 町丁・字等境界データ」を加工して作成。境界は統計用であり、行政上の正式境界と一致しない場合があります。全市合計は各月末CSVのため{" "}
        {n(townMap.cityTotals.to.foreign)}人（2026年10月末）となり、上部の東京都10月1日表（19,961人）とは基準日が異なります。少人数（外国人10人未満または総人口100人未満）の{townMap.counts.suppressedTowns}町丁と、上野第二地区の住所変更対象{townMap.counts.boundaryChangedTowns}町丁は個別数値を非表示としています。
      </p>
    </figure>
  );
}

export function NearbyCitiesScatterChart({
  analysis,
}: {
  analysis: InternationalAnalysisProp;
}) {
  const { nearbySummary } = analysis;
  const sorted = [...nearbySummary.cities].sort((a, b) => b.foreign - a.foreign);
  const maxPeople = Math.ceil(Math.max(...sorted.map((c) => c.foreign)) / 5000) * 5000;
  const maxRate = Math.ceil(Math.max(...sorted.map((c) => c.share)));

  return (
    <div className="space-y-5">
      <figure className={card}>
        <figcaption className="font-bold text-slate-900">
          近隣6市の外国人住民数と総人口比の分布（2026年10月1日）
        </figcaption>
        <p className="mt-1 text-xs text-slate-600">
          横軸：外国人住民数（人） · 縦軸：総人口に占める割合（％） · 点線：6市の中央値（{nearbySummary.medianShare.toFixed(2)}％）
        </p>
        <div
          className="mt-3 h-[280px] w-full min-w-0"
          role="img"
          aria-label="近隣6市の外国人住民数と割合の散布図。八王子市は人数最多の19,961人で割合3.57％、立川市は割合最高の3.66％で人数6,876人。6市中央値は2.90％。"
        >
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
            <ScatterChart margin={{ top: 16, right: 20, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="#cbd5e1" />
              <XAxis
                type="number"
                dataKey="foreign"
                name="外国人住民数"
                domain={[0, 22000]}
                ticks={[0, 5000, 10000, 15000, 20000]}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickFormatter={(v) => n(v)}
              />
              <YAxis
                type="number"
                dataKey="share"
                name="総人口比"
                domain={[2, 4]}
                ticks={[2, 2.5, 3, 3.5, 4]}
                tick={{ fontSize: 11, fill: "#475569" }}
                width={42}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <ZAxis range={[120, 120]} />
              <ReferenceLine
                y={nearbySummary.medianShare}
                stroke="#b45309"
                strokeDasharray="4 4"
                label={{
                  value: `6市中央値 ${nearbySummary.medianShare.toFixed(2)}%`,
                  position: "insideTopRight",
                  fill: "#92400e",
                  fontSize: 11,
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const city = payload[0]?.payload as InternationalAnalysisProp["nearbySummary"]["cities"][number] | undefined;
                  if (!city) return null;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
                      <p className="font-bold text-slate-900">{city.name}</p>
                      <p className="mt-1 tabular-nums text-slate-700">
                        外国人住民：{n(city.foreign)}人（総人口比 {city.share.toFixed(2)}％）
                      </p>
                      <p className="tabular-nums text-slate-600">総人口：{n(city.total)}人</p>
                    </div>
                  );
                }}
              />
              <Scatter name="近隣6市" data={sorted} isAnimationActive={false}>
                {sorted.map((city) => (
                  <Cell
                    key={city.code}
                    fill={city.isHachioji ? "#0f766e" : "#0369a1"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <table className="mt-4 w-full table-fixed text-sm leading-6">
          <caption className="sr-only">外国人住民数と、各市の総人口に占める割合</caption>
          <thead>
            <tr>
              <th scope="col" className="w-1/4 pr-2 text-left">市</th>
              <th scope="col" className="px-2 text-left">人数</th>
              <th scope="col" className="pl-2 text-left">総人口比</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.code}
                className={row.isHachioji ? "bg-teal-50" : "border-t border-slate-100"}
              >
                <th scope="row" className="py-2 pr-2 text-left">{row.name}</th>
                <td className="px-2 py-2 tabular-nums">
                  {n(row.foreign)}人
                  <div className="h-2 rounded bg-slate-100" aria-hidden="true">
                    <div
                      className="h-2 rounded bg-teal-700"
                      style={{ width: `${(row.foreign / maxPeople) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="py-2 pl-2 tabular-nums">
                  {row.share.toFixed(2)}％
                  <div className="h-2 rounded bg-slate-100" aria-hidden="true">
                    <div
                      className="h-2 rounded bg-sky-700"
                      style={{ width: `${(row.share / maxRate) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-6 text-slate-600">
          棒はそれぞれ0から表示。全幅は人数が{n(maxPeople)}人、割合が{maxRate}％です。散布図は違いを見やすくするため縦軸を2.0％から表示しています。
        </p>
      </figure>
    </div>
  );
}
