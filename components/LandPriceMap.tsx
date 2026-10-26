"use client";

import { useState } from "react";
import { landWorldPixel, landMan as m, type LandPricePoint } from "@/lib/hachioji-land-prices-publication";

const bands = ["#0e7490", "#2563eb", "#7c3aed", "#be123c"];
function color(price: number) { return bands[price < 100000 ? 0 : price < 150000 ? 1 : price < 250000 ? 2 : 3]; }

export default function LandPriceMap({ points }: { points: LandPricePoint[] }) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState(points[0].id);
  const [zoom, setZoom] = useState(12);
  const [tileFailed, setTileFailed] = useState(false);
  const chosen = points.find(p => p.id === selected)!;
  const center = landWorldPixel(enabled && zoom > 12 ? chosen.longitude : 139.335, enabled && zoom > 12 ? chosen.latitude : 35.661, zoom);
  const left = center.x - 420, top = center.y - 250;
  const tiles = [];
  for (let tx = Math.floor(left / 256); tx <= Math.floor((left + 840) / 256); tx++) {
    for (let ty = Math.floor(top / 256); ty <= Math.floor((top + 500) / 256); ty++) tiles.push({ tx, ty });
  }
  return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <p className="text-sm">標準地の代表点です。敷地境界や売地を示す地図ではありません。価格時点：2026年1月1日。</p>
    {!enabled ? <button className="rounded-xl bg-cyan-800 px-5 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cyan-600" onClick={() => setEnabled(true)}>八王子の124地点を地図で見る</button> : <>
      <div className="flex flex-wrap items-center gap-3"><label className="text-sm font-semibold" htmlFor="land-zoom">表示範囲</label><select id="land-zoom" className="rounded-lg border border-slate-400 bg-white p-2" value={zoom} onChange={e => { setZoom(Number(e.target.value)); setTileFailed(false); }}><option value={12}>八王子全体</option><option value={13}>選択地点の周辺</option><option value={15}>選択地点を拡大</option></select></div>
      <a href="#land-point" className="inline-block text-sm text-sky-800 underline">地図の点を飛ばして所在地から選ぶ</a>
      <svg viewBox="0 0 840 500" role="group" aria-label="八王子市内の住宅地標準地点地図。下の地点選択と表でも確認できます" className="h-auto w-full rounded-xl border border-slate-200 bg-slate-100">
        {tiles.map(t => <image key={`${zoom}-${t.tx}-${t.ty}`} href={`https://cyberjapandata.gsi.go.jp/xyz/pale/${zoom}/${t.tx}/${t.ty}.png`} x={t.tx * 256 - left} y={t.ty * 256 - top} width="256" height="256" onError={() => setTileFailed(true)} />)}
        {points.map(p => { const pos = landWorldPixel(p.longitude, p.latitude, zoom); const x = pos.x - left, y = pos.y - top; if (x < 0 || x > 840 || y < 0 || y > 500 || p.id === chosen.id) return null;
          return <circle key={p.id} cx={x} cy={y} r="5" fill={color(p.price)} stroke="white" strokeWidth="1.4" role="button" tabIndex={0} aria-label={`${p.address}、${m(p.price)}万円/㎡`} onClick={() => setSelected(p.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(p.id); } }} className="cursor-pointer focus:stroke-black focus:stroke-[4px]"><title>{`${p.id} ${m(p.price)}万円/㎡`}</title></circle>;
        })}
        {(() => { const pos = landWorldPixel(chosen.longitude, chosen.latitude, zoom); return <g aria-hidden="true"><circle cx={pos.x - left} cy={pos.y - top} r="11" fill="white" stroke="#0f172a" strokeWidth="3" /><circle cx={pos.x - left} cy={pos.y - top} r="6" fill={color(chosen.price)} /></g>; })()}
      </svg>
      {tileFailed && <p role="status" className="text-sm text-amber-900">背景地図を読み込めませんでした。点の位置関係と下の地点選択・表で価格を確認できます。</p>}
      <p className="text-xs">背景地図：<a href="https://maps.gsi.go.jp/development/ichiran.html" className="underline">地理院タイル（淡色地図）</a>。地点・価格：国土交通省、bearworks.uk加工。</p>
    </>}
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="価格の凡例">{["10万円/㎡未満", "10〜15万円/㎡未満", "15〜25万円/㎡未満", "25万円/㎡以上"].map((label, i) => <span key={label} className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: bands[i] }} />{label}</span>)}</div>
    <label htmlFor="land-point" className="block text-sm font-semibold">所在地から地点を選ぶ（地図を開かずにも確認できます）</label>
    <select id="land-point" value={selected} onChange={e => setSelected(e.target.value)} className="w-full min-w-0 rounded-xl border border-slate-400 bg-white p-3 text-sm">{points.map(p => <option value={p.id} key={p.id}>{p.id} · {p.address.replace("東京都　", "")} · {m(p.price)}万円/㎡</option>)}</select>
    <div aria-live="polite" className="rounded-xl bg-cyan-50 p-4"><p className="text-sm font-semibold">{chosen.id}</p><p className="break-words">{chosen.address}</p><p className="mt-2 text-2xl font-bold text-cyan-950">{m(chosen.price)}<span className="ml-1 text-sm font-normal">万円/㎡</span></p><p className="mt-1 text-xs">2026年1月1日 · 標準地の公示価格</p></div>
  </div>;
}
