"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assessBlock, timestamp, type Collection, type CountryTrafficData } from "../lib/cloudflareCollection";

const panel = "rounded-2xl border border-gray-200 bg-white p-5 shadow-soft";
const number = (value: number) => value.toLocaleString("ja-JP");
const regionNames = new Intl.DisplayNames(["ja"], { type: "region" });
const label = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return `不明な地域（${code}）`;
  const name = regionNames.of(code);
  return name && name !== code ? name : `不明な地域（${code}）`;
};
const timeLabel = (value: unknown) => new Date(Number(value)).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

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

export function CloudflareAccessView({ collection, nowUpper }: { collection: Collection; nowUpper: number | null }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (collection.schemaVersion !== 2) return null;
  const seriesCheck = assessBlock(collection.trafficSeries, nowUpper);
  const countryCheck = assessBlock(collection.countryTraffic, nowUpper);
  const series = seriesCheck.usable && collection.trafficSeries.status === "OK" ? collection.trafficSeries.data : null;
  const countries = countryCheck.usable && collection.countryTraffic.status === "OK" ? collection.countryTraffic.data : null;
  const points = series?.points.map(point => ({ time: timestamp(point.hour)!, requests: point.requests })) ?? [];
  const selectedCountry = countries?.countries.find(item => item.code === selected);
  return <>
    <section className="grid gap-4 sm:grid-cols-3" aria-label="アクセスの概要">
      <div className={panel}><h2 className="text-sm font-semibold text-muted">アクセス数（完了した24時間）</h2><p className="text-2xl font-bold mt-2">{series ? `${number(series.totalRequests)} 件` : "未確認"}</p><p className="text-xs mt-2">HTTP リクエスト数</p></div>
      <div className={panel}><h2 className="text-sm font-semibold text-muted">前の24時間との比較</h2><p className="text-xl font-bold mt-2">{series ? "比較データの準備中" : "未確認"}</p><p className="text-xs mt-2">同じ条件の値が揃ってから表示します</p></div>
      <div className={panel}><h2 className="text-sm font-semibold text-muted">キャッシュ率（同じ24時間）</h2><p className="text-2xl font-bold mt-2">{series ? series.cacheRate === null ? "算出不能" : `${series.cacheRate}%` : "未確認"}</p><p className="text-xs mt-2">キャッシュ配信したリクエストの割合</p></div>
    </section>
    <section className={panel} aria-labelledby="access-trend-title">
      <h2 id="access-trend-title" className="text-xl font-bold">アクセス推移（直近24時間）</h2>
      <p className="text-sm mt-2">bearworks.uk とサブドメインを含むゾーン全体の HTTP リクエスト数です。訪問人数ではありません。</p>
      {series ? <>
        <p className="text-sm mt-2">この24時間には {number(series.totalRequests)} 件の HTTP リクエストがありました。{collection.trafficSeries.precision === "estimated" ? "サンプルからの推計値です。" : "今回の取得ではサンプリングされていません。"}</p>
        <p className="text-xs mt-1">期間：{new Date(timestamp(collection.trafficSeries.windowStart)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} ～ {new Date(timestamp(collection.trafficSeries.windowEnd)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST。末尾の進行中の時間は含めません。</p>
        <div className="h-64 mt-4" role="img" aria-label="完了した24時間の時間別リクエスト数。各時刻の値は下の表で確認できます。">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
            <AreaChart data={points} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={timeLabel} minTickGap={40} />
              <YAxis allowDecimals={false} width={50} /><Tooltip formatter={value => typeof value === "number" ? `${number(value)} 件` : "未確認"} labelFormatter={timeLabel} />
              <Area dataKey="requests" name="リクエスト" stroke="#2563eb" fill="#dbeafe" type="linear" /></AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3"><summary className="cursor-pointer text-sm underline">時間別の件数を表で見る</summary><div className="max-h-64 overflow-auto"><table className="w-full text-sm mt-2"><thead><tr><th className="text-left">開始時刻（JST）</th><th className="text-right">件数</th></tr></thead><tbody>{points.map(point => <tr key={point.time} className="border-t"><td>{timeLabel(point.time)}</td><td className="text-right">{number(point.requests)}</td></tr>)}</tbody></table></div></details>
      </> : <p className="text-sm mt-3">{collection.trafficSeries.status === "UNKNOWN" && collection.trafficSeries.attemptedAt ? "未配信：この項目は収集設定で無効です。" : `${seriesCheck.state}：${seriesCheck.reason}`}</p>}
    </section>
    <section className={panel} aria-labelledby="country-traffic-title">
      <h2 id="country-traffic-title" className="text-xl font-bold">国別アクセス（直近24時間）</h2>
      <p className="text-sm mt-2">国は接続元 IP から推定した場所です。VPN などを使うと実際の所在地と異なる場合があります。</p>
      {countries ? <>
        <p className="text-sm mt-2">合計：<strong>{number(countries.totalRequests)} 件</strong>。{collection.countryTraffic.precision === "estimated" ? "サンプルからの推計値です。" : "今回の取得ではサンプリングされていません。"}</p>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)] mt-4">
          <div><CountryMap data={countries} selected={selected} />{selectedCountry && <p className="text-sm mt-2">選択中：{label(selectedCountry.code)} {number(selectedCountry.requests)} 件{countries.totalRequests > 0 ? `（${(selectedCountry.requests / countries.totalRequests * 100).toFixed(1)}%）` : ""}</p>}</div>
          <div><h3 className="font-semibold">国・地域の件数順一覧</h3><p className="text-xs mt-1">一覧には地図に載らない国・地域も含みます。</p><ol className="mt-2 max-h-80 overflow-auto divide-y">{countries.countries.map(item => <li key={item.code}><button type="button" onClick={() => setSelected(item.code)} className="w-full py-2 text-left rounded focus:outline-2 focus:outline-blue-700" aria-pressed={selected === item.code}><span className="block font-medium">{label(item.code)} <span className="text-xs">({item.code})</span></span><span className="text-sm">{number(item.requests)} 件{countries.totalRequests > 0 ? ` · ${(item.requests / countries.totalRequests * 100).toFixed(1)}%` : ""}</span></button></li>)}</ol></div>
        </div>
      </> : <p className="text-sm mt-3">{collection.countryTraffic.status === "UNKNOWN" && collection.countryTraffic.attemptedAt ? "未配信：この項目は収集設定で無効です。" : `${countryCheck.state}：${countryCheck.reason}`}</p>}
    </section>
  </>;
}
