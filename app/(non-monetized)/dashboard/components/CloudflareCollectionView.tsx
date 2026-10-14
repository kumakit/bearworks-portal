"use client";

import React from "react";
import Link from "@/components/InternalLink";
import { RefreshCw } from "lucide-react";
import { CloudflareAccessView } from "./CloudflareAccessView";
import {
  ACCESS_KEYS,
  BLOCK_LABELS,
  assessBlock,
  timestamp,
  type BlockKey,
  type Collection,
} from "../lib/cloudflareCollection";

const panel = "rounded-2xl border border-gray-200 bg-white p-5 shadow-soft";
const dateLabel = (value: string | null) => {
  const time = timestamp(value);
  return time === null ? "未確認" : `${new Date(time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false })} JST`;
};

export function CloudflareCollectionView({ collection, nowUpper, loading = false, refreshing = false, failed = false, onRefresh }: {
  collection: Collection;
  nowUpper: number | null;
  loading?: boolean;
  refreshing?: boolean;
  failed?: boolean;
  onRefresh?: () => void;
}) {
  const accessKeys = collection.schemaVersion === 2 ? ACCESS_KEYS.filter(key => {
    const block = collection[key];
    return block.status !== "UNKNOWN" || block.invalid;
  }) : [];
  const detailKeys: BlockKey[] = [...accessKeys, "pagesMonth"];
  const needsAttention = collection.schemaVersion === 2 && detailKeys.some(key => {
    const state = assessBlock(collection[key], nowUpper).state;
    return state !== "取得正常";
  });

  return <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><Link href="/dashboard" className="text-sm text-muted underline">ダッシュボード</Link><h1 className="text-3xl font-bold mt-2">Cloudflare</h1></div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="flex gap-2 items-center rounded-xl border px-4 py-2 bg-white disabled:opacity-50 focus:outline-2 focus:outline-blue-700">
        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "取得中" : "再読込"}
      </button>
    </header>
    {loading && <p role="status">取得状態を確認中です。</p>}
    {failed && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">APIからデータを取得できませんでした。値は表示できません。時間をおいて再読込してください。</p>}
    {!loading && !failed && collection.schemaVersion !== 2 && <p role="status" className={panel}>アクセス推移と国別アクセスのデータはまだ確認できません。時間をおいて再読込してください。</p>}
    {!failed && <CloudflareAccessView collection={collection} nowUpper={nowUpper} />}
    <p className="text-sm text-muted">この画面はアクセスの推移と国別の表示です。セキュリティの判定は含みません。</p>
    {!failed && collection.schemaVersion === 2 && <details className={panel}>
      <summary className="cursor-pointer rounded font-semibold focus:outline-2 focus:outline-blue-700">データについて{needsAttention ? "（要確認の項目があります）" : ""}</summary>
      <div className="mt-4 space-y-4 text-sm">
        <p>アクセスは bearworks.uk とサブドメインを含むゾーン全体の HTTP リクエスト数です。人数ではありません。期間は日本時間で表示し、取得状態はサーバー基準の時刻と項目ごとの更新期限で判定します。</p>
        <p>国が分からないアクセスや地図に載らない地域も、国別一覧と合計には含めます。30日間の前期間比は、比較に必要な履歴をまだ保存していないため表示できません。</p>
        <div className="divide-y">
          {detailKeys.map(key => {
            const block = collection[key];
            const check = assessBlock(block, nowUpper);
            return <article key={key} className="py-3 space-y-1 break-words">
              <h2 className="font-semibold">{key === "pagesMonth" ? "別の監視項目：Pages の取得状態" : BLOCK_LABELS[key]}：{check.state}</h2>
              <p>{check.reason}</p>
              <p>対象：{block.scope?.kind === "ZONE" ? "ゾーン全体" : block.scope?.kind === "ACCOUNT" ? "アカウント全体" : "未確認"} ／ 期間：{dateLabel(block.windowStart)} ～ {dateLabel(block.windowEnd)}</p>
              <p>集計：{block.precision === "estimated" || block.sampling === "ADAPTIVE" ? "サンプルから推計" : block.precision === "exact" || block.sampling === "NONE" ? "今回の取得ではサンプリングなし" : "未確認"} ／ 取得：{dateLabel(block.collectedAt)} ／ 更新期限：{dateLabel(block.validUntil)}</p>
            </article>;
          })}
        </div>
        <p>Digest はこの画面とは別に、アクセス項目と Pages の取得状態を確認します。旧 WAF 詳細は必須監視対象ではありません。</p>
      </div>
    </details>}
    <footer><Link href="/dashboard/gcp" className="text-sm underline">GCPコスト分析を見る</Link></footer>
  </main>;
}
