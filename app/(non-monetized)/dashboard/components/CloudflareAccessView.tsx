"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assessBlock, historyFresh, timestamp, type Collection, type CountryTrafficData } from "../lib/cloudflareCollection";

const panel = "rounded-2xl border border-gray-200 bg-white p-5 shadow-soft";
const number = (value: number) => value.toLocaleString("ja-JP");
const regionNames = new Intl.DisplayNames(["ja"], { type: "region" });
const label = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return `不明な地域（${code}）`;
  const name = regionNames.of(code);
  return name && name !== code ? name : `不明な地域（${code}）`;
};
const timeLabel = (value: unknown) => new Date(Number(value)).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const historyComparisonNote = (reason: string) => reason === "PREVIOUS_ACCUMULATING"
  ? "前の30日間の履歴を蓄積中です。"
  : reason === "PREVIOUS_MISSING" ? "前の30日間の履歴に欠測があるため比較できません。"
    : reason === "PREVIOUS_SAMPLED" ? "前の30日間に抽出された値があるため比較できません。"
      : "前の30日間の履歴を確認できないため比較できません。";
const historyCurrentNote = (state: string) => state === "ACCUMULATING"
  ? "30日分の時間別履歴を蓄積中です。"
  : state === "MISSING" ? "時間別履歴に欠測があるため、履歴を使った30日表示はできません。"
    : state === "SAMPLED" ? "時間別履歴に抽出された値があるため、履歴を使った30日表示はできません。"
      : state === "IDENTITY_MISMATCH" ? "時間別履歴の対象を確認できません。"
        : "時間別履歴を確認できません。";

interface MapFeature { code: string; path: string }
const WIDTH = 720;
const HEIGHT = 360;

function ringPath(ring: unknown): string {
  if (!Array.isArray(ring) || ring.length < 3) return "";
  const points = ring.map(point => {
    if (!Array.isArray(point) || point.length < 2 || typeof point[0] !== "number" || typeof point[1] !== "number") return null;
    const [lon, lat] = point;
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
    return `${((lon + 180) * WIDTH / 360).toFixed(1)},${((90 - lat) * HEIGHT / 180).toFixed(1)}`;
  });
  return points.includes(null) ? "" : `M${points.join("L")}Z`;
}

function geometryPath(geometry: unknown): string {
  if (!geometry || typeof geometry !== "object" || !("type" in geometry) || !("coordinates" in geometry)) return "";
  const value = geometry as { type: unknown; coordinates: unknown };
  const polygons = value.type === "Polygon" ? [value.coordinates] : value.type === "MultiPolygon" ? value.coordinates : null;
  if (!Array.isArray(polygons)) return "";
  return polygons.flatMap(polygon => Array.isArray(polygon) ? polygon.map(ringPath) : []).filter(Boolean).join("");
}

function mapColor(requests: number | undefined, max: number, selected: boolean): string {
  if (requests === undefined) return "#e5e7eb";
  if (selected) return "#1d4ed8";
  const level = max > 0 ? Math.log1p(requests) / Math.log1p(max) : 0;
  return level > .7 ? "#3b82f6" : level > .4 ? "#60a5fa" : level > .15 ? "#93c5fd" : "#bfdbfe";
}

function CountryMap({ data, selected }: { data: CountryTrafficData; selected: string | null }) {
  const [features, setFeatures] = useState<MapFeature[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/maps/ne_110m_admin_0_countries_v5.1.1.geojson", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("MAP_UNAVAILABLE"); return response.json(); })
      .then((source: unknown) => {
        if (!source || typeof source !== "object" || !("features" in source) || !Array.isArray(source.features)) throw new Error("MAP_INVALID");
        const shapes: MapFeature[] = [];
        for (const feature of source.features) {
          const code = feature?.properties?.ISO_A2_EH;
          const path = geometryPath(feature?.geometry);
          if (typeof code === "string" && /^[A-Z]{2}$/.test(code) && path) shapes.push({ code, path });
        }
        if (shapes.length < 100 || new Set(shapes.map(shape => shape.code)).size !== shapes.length) throw new Error("MAP_INVALID");
        if (!controller.signal.aborted) setFeatures(shapes);
      }).catch(() => { if (!controller.signal.aborted) setFeatures([]); });
    return () => controller.abort();
  }, []);
  if (features === null) return <p className="text-sm mt-3">地図を読み込み中です。</p>;
  if (features.length === 0) return <p className="text-sm mt-3">地図を読み込めません。国別一覧は引き続き確認できます。</p>;
  const counts = new Map(data.countries.map(item => [item.code, item.requests]));
  const max = Math.max(0, ...data.countries.map(item => item.requests));
  const mapped = new Set(features.map(feature => feature.code));
  const unmapped = data.countries.filter(item => !mapped.has(item.code));
  return <>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full rounded-lg border bg-slate-50" aria-hidden="true" focusable="false">
      {features.map(feature => <path key={feature.code} d={feature.path} fill={mapColor(counts.get(feature.code), max, feature.code === selected)} stroke="#fff" strokeWidth=".45" fillRule="evenodd" />)}
    </svg>
    {unmapped.length > 0 && <p className="text-xs mt-2">この縮尺の地図に載らない国・地域も、一覧に含めています。</p>}
    <div className="flex items-center gap-2 text-xs mt-2" aria-label="地図の凡例。薄い青ほど少なく、濃い青ほど多いリクエスト数">
      <span>少ない</span><span className="inline-flex" aria-hidden="true"><span className="w-5 h-3 bg-blue-200" /><span className="w-5 h-3 bg-blue-300" /><span className="w-5 h-3 bg-blue-400" /><span className="w-5 h-3 bg-blue-500" /></span><span>多い</span>
    </div>
    <p className="text-xs mt-1">色はリクエスト数の目安です。危険度を示しません。</p>
  </>;
}

export function CloudflareAccessView({ collection, nowUpper, defaultPeriod = "24h" }: { collection: Collection; nowUpper: number | null; defaultPeriod?: "24h" | "7d" | "30d" }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">(defaultPeriod);
  if (collection.schemaVersion !== 2) return null;
  const seriesBlock = period === "24h" ? collection.trafficSeries : period === "7d" ? collection.trafficSeries7d : collection.trafficSeries30d;
  const countryBlock = period === "24h" ? collection.countryTraffic : period === "7d" ? collection.countryTraffic7d : collection.countryTraffic30d;
  const previousBlock = period === "24h" ? collection.trafficPrevious24h : period === "7d" ? collection.trafficPrevious7d : null;
  const seriesCheck = assessBlock(seriesBlock, nowUpper);
  const countryCheck = assessBlock(countryBlock, nowUpper);
  const previousCheck = previousBlock ? assessBlock(previousBlock, nowUpper) : null;
  const history = collection.history30d;
  const historyDisplayEnabled = process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_30D_ENABLED === "true";
  const freshHistory = period === "30d" && historyFresh(history, nowUpper) ? history.value : null;
  const historyCurrent = historyDisplayEnabled && freshHistory?.current.state === "READY" ? freshHistory.current : null;
  const historyUnavailable = nowUpper === null ? "表示時刻を確認中です。"
    : history?.state === "ABSENT" || !history ? "時間別履歴の配信を待っています。"
      : history.state === "INVALID" ? "時間別履歴の形式を確認できません。"
        : !freshHistory ? "時間別履歴の更新が遅れています。"
          : historyCurrentNote(freshHistory.current.state);
  const historyComparison = process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED === "true" && historyCurrent && freshHistory?.comparison.state === "READY" ? freshHistory.comparison : null;
  const series = historyCurrent ? { totalRequests: historyCurrent.totalRequests!, points: historyCurrent.points! } : seriesCheck.usable && seriesBlock.status === "OK" ? seriesBlock.data : null;
  const countries = countryCheck.usable && countryBlock.status === "OK" ? countryBlock.data : null;
  const previous = previousCheck?.usable && previousBlock?.status === "OK" ? previousBlock.data : null;
  const points = series?.points.map(point => ({ time: timestamp(point.hour)!, requests: point.requests })) ?? [];
  const selectedCountry = countries?.countries.find(item => item.code === selected);
  const periodLabel = period === "24h" ? "24時間" : period === "7d" ? "7日間" : "30日間";
  const compareText = period === "30d" ? historyComparison
    ? `前の30日間との差 ${historyComparison.difference >= 0 ? "+" : "−"}${number(Math.abs(historyComparison.difference))} 件${historyComparison.percent === null ? "（前期間が0件のため増減率は算出できません）" : `（${historyComparison.percent >= 0 ? "+" : ""}${historyComparison.percent.toFixed(1)}%）`}。保存した1時間集計同士の比較です。`
    : historyCurrent ? process.env.NEXT_PUBLIC_CLOUDFLARE_HISTORY_COMPARE_ENABLED === "true" && freshHistory?.comparison.state === "UNAVAILABLE"
      ? historyComparisonNote(freshHistory.comparison.reason) : "前期間比較を準備中です。"
      : historyDisplayEnabled ? `${historyUnavailable} 前期間比較は利用できません。` : "この期間は前期間比較に対応していません。" : previous && series
    ? `前期間との差 ${series.totalRequests - previous.totalRequests >= 0 ? "+" : "−"}${number(Math.abs(series.totalRequests - previous.totalRequests))} 件${previous.totalRequests > 0 ? `（${series.totalRequests - previous.totalRequests >= 0 ? "+" : ""}${((series.totalRequests - previous.totalRequests) / previous.totalRequests * 100).toFixed(1)}%）` : "（前期間が0件のため増減率は算出できません）"}。${seriesBlock.precision === "estimated" ? "推計値同士の参考比較です。" : "同じ集計条件で比較しています。"}`
    : period === "24h" && !previousBlock?.attemptedAt ? "比較データを準備中です。"
      : previousCheck ? `${previousCheck.state}：${previousCheck.reason}` : "比較データを準備中です。";
  return <>
    <fieldset className={`${panel} flex flex-wrap items-center gap-3`}>
      <legend className="px-1 text-sm font-semibold">表示期間</legend>
      {([ ["24h", "24時間"], ["7d", "7日間"], ["30d", "30日間"] ] as const).map(([value, labelText]) => <button key={value} type="button" onClick={() => { setPeriod(value); setSelected(null); }} aria-pressed={period === value} className={`rounded-lg border px-4 py-2 text-sm focus:outline-2 focus:outline-blue-700 ${period === value ? "border-blue-700 bg-blue-50 font-semibold text-blue-900" : "border-gray-300"}`}>{labelText}</button>)}
    </fieldset>
    <section className="grid gap-4 sm:grid-cols-3" aria-label="アクセスの概要">
      <div className={panel}><h2 className="text-sm font-semibold text-muted">アクセス数（{periodLabel}）</h2><p className="text-2xl font-bold mt-2">{series ? `${number(series.totalRequests)} 件` : "未確認"}</p><p className="text-xs mt-2">HTTP リクエスト数</p></div>
      <div className={panel}><h2 className="text-sm font-semibold text-muted">{period === "30d" ? "前期間との比較" : `前の${periodLabel}との比較`}</h2><p className="text-sm font-bold mt-2">{period === "30d" ? compareText : series ? compareText : "未確認"}</p><p className="text-xs mt-2">{period === "30d" ? historyComparison ? "両期間の時間別履歴が揃った場合に表示します" : historyCurrent ? "同じ集計条件の前期間が揃うと表示します" : "履歴が揃うまでは比較できません" : "同じ条件の値が揃った場合に表示します"}</p></div>
      <div className={panel}><h2 className="text-sm font-semibold text-muted">集計方法（{periodLabel}）</h2><p className="text-base font-bold mt-2">{series ? historyCurrent ? "保存した時間別集計（抽出なし）" : seriesBlock.precision === "estimated" ? "サンプルから推計" : "今回の取得ではサンプリングなし" : "未確認"}</p><p className="text-xs mt-2">{period === "24h" ? `キャッシュ率：${series && "cacheRate" in series ? series.cacheRate === null || series.cacheRate === undefined ? "算出不能" : `${series.cacheRate}%` : "未確認"}` : "24時間の集計とは別の取得結果です"}</p></div>
    </section>
    <section className={panel} aria-labelledby="access-trend-title">
      <h2 id="access-trend-title" className="text-xl font-bold">アクセス推移（{period === "24h" ? "直近24時間" : periodLabel}）</h2>
      <p className="text-sm mt-2">bearworks.uk とサブドメインを含むゾーン全体の HTTP リクエスト数です。訪問人数ではありません。</p>
      {period === "30d" && !historyCurrent && historyDisplayEnabled && <p className="text-xs mt-2">{historyUnavailable} {series ? "従来の30日集計を表示しています。" : "従来の30日集計も利用できません。"}</p>}
      {series ? <>
        <p className="text-sm mt-2">この{periodLabel}には {number(series.totalRequests)} 件の HTTP リクエストがありました。{historyCurrent ? "保存した時間別集計です。今回の取得ではサンプリングされていません。" : seriesBlock.precision === "estimated" ? "サンプルからの推計値です。" : "今回の取得ではサンプリングされていません。"}</p>
        <p className="text-xs mt-1">期間：{new Date(timestamp(historyCurrent?.windowStart ?? seriesBlock.windowStart)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} ～ {new Date(timestamp(historyCurrent?.windowEnd ?? seriesBlock.windowEnd)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST。末尾の進行中の時間は含めません。</p>
        {historyCurrent && <p className="text-xs mt-1">この推移と国別アクセスは取得方法と時間の区切りが異なるため、合計が一致しない場合があります。</p>}
        <div className="h-64 mt-4" role="img" aria-label={`${periodLabel}の時間別リクエスト数。各時刻の値は下の表で確認できます。`}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
            <AreaChart data={points} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={timeLabel} minTickGap={40} />
              <YAxis allowDecimals={false} width={50} /><Tooltip formatter={value => typeof value === "number" ? `${number(value)} 件` : "未確認"} labelFormatter={timeLabel} />
              <Area dataKey="requests" name="リクエスト" stroke="#2563eb" fill="#dbeafe" type="linear" /></AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3"><summary className="cursor-pointer text-sm underline">時間別の件数を表で見る</summary><div className="max-h-64 overflow-auto"><table className="w-full text-sm mt-2"><thead><tr><th className="text-left">開始時刻（JST）</th><th className="text-right">件数</th></tr></thead><tbody>{points.map(point => <tr key={point.time} className="border-t"><td>{timeLabel(point.time)}</td><td className="text-right">{number(point.requests)}</td></tr>)}</tbody></table></div></details>
      </> : <p className="text-sm mt-3">{seriesBlock.status === "UNKNOWN" && !seriesBlock.attemptedAt ? "未配信：この期間のデータはありません。" : seriesBlock.status === "UNKNOWN" && seriesBlock.attemptedAt ? "未配信：この項目は収集設定で無効です。" : `${seriesCheck.state}：${seriesCheck.reason}`}</p>}
    </section>
    <section className={panel} aria-labelledby="country-traffic-title">
      <h2 id="country-traffic-title" className="text-xl font-bold">国別アクセス（{period === "24h" ? "直近24時間" : periodLabel}）</h2>
      <p className="text-sm mt-2">国は接続元 IP から推定した場所です。VPN などを使うと実際の所在地と異なる場合があります。</p>
      {countries ? <>
        <p className="text-sm mt-2">合計：<strong>{number(countries.totalRequests)} 件</strong>。{countryBlock.precision === "estimated" ? "サンプルからの推計値です。" : "今回の取得ではサンプリングされていません。"}</p>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)] mt-4">
          <div><CountryMap data={countries} selected={selected} />{selectedCountry && <p className="text-sm mt-2">選択中：{label(selectedCountry.code)} {number(selectedCountry.requests)} 件{countries.totalRequests > 0 ? `（${(selectedCountry.requests / countries.totalRequests * 100).toFixed(1)}%）` : ""}</p>}</div>
          <div><h3 className="font-semibold">国・地域の件数順一覧</h3><p className="text-xs mt-1">一覧には地図に載らない国・地域も含みます。</p><ol className="mt-2 max-h-80 overflow-auto divide-y">{countries.countries.map(item => <li key={item.code}><button type="button" onClick={() => setSelected(item.code)} className="w-full py-2 text-left rounded focus:outline-2 focus:outline-blue-700" aria-pressed={selected === item.code}><span className="block font-medium">{label(item.code)} <span className="text-xs">({item.code})</span></span><span className="text-sm">{number(item.requests)} 件{countries.totalRequests > 0 ? ` · ${(item.requests / countries.totalRequests * 100).toFixed(1)}%` : ""}</span></button></li>)}</ol></div>
        </div>
      </> : <p className="text-sm mt-3">{countryBlock.status === "UNKNOWN" && !countryBlock.attemptedAt ? "未配信：この期間のデータはありません。" : countryBlock.status === "UNKNOWN" && countryBlock.attemptedAt ? "未配信：この項目は収集設定で無効です。" : `${countryCheck.state}：${countryCheck.reason}`}</p>}
    </section>
  </>;
}
