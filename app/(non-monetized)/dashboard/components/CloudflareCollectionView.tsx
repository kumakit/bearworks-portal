"use client";

import React from "react";
import Link from "@/components/InternalLink";
import { RefreshCw } from "lucide-react";
import { CloudflareActionDistribution, CloudflareEventTimeline } from "./CloudflareCollectionCharts";
import { BLOCK_KEYS, BLOCK_LABELS, actionLabel, assessCollection, samplingNote, timestamp, type Collection } from "../lib/cloudflareCollection";

const panel = "rounded-2xl border border-gray-200 bg-white p-5 shadow-soft";
const number = (n: number) => n.toLocaleString("ja-JP");
const dateLabel = (date: string | null) => date ? new Date(timestamp(date)!).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false }) + " JST" : "未確認";

export function CloudflareCollectionView({ collection, nowUpper, loading = false, refreshing = false, failed = false, onRefresh }: {
  collection: Collection; nowUpper: number | null; loading?: boolean; refreshing?: boolean; failed?: boolean; onRefresh?: () => void;
}) {
  const assessment = assessCollection(collection, nowUpper);
  const traffic = assessment.blocks.traffic24h.usable ? collection.traffic24h.data : null;
  const summary = assessment.blocks.summary.usable ? collection.summary.data : null;
  const pages = assessment.blocks.pagesMonth.usable ? collection.pagesMonth.data : null;
  const rules = assessment.blocks.topRules.usable ? collection.topRules.data : null;
  const paths = assessment.blocks.topPaths.usable ? collection.topPaths.data : null;
  const asns = assessment.blocks.topASNs.usable ? collection.topASNs.data : null;
  const timeline = assessment.blocks.timeline.usable ? collection.timeline.data : null;
  const note = (key: keyof Collection) => assessment.blocks[key].usable && <p className="text-xs mt-2">{assessment.blocks[key].state}{collection[key].status === "PARTIAL" ? "・今回の部分データを参考表示" : ""} · {samplingNote(collection[key].sampling)}</p>;
  const unavailable = (key: keyof Collection) => <p className="text-sm mt-3">{failed ? "APIから取得できなかったため、この項目の値は確認できません。" : `${assessment.blocks[key].state}：${assessment.blocks[key].reason}`}</p>;
  const actions = failed ? ["時間をおいて再読込する。続く場合は収集APIの応答と接続を確認する"] : assessment.actions;

  return <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/dashboard" className="text-sm text-muted underline">ダッシュボード</Link><h1 className="text-3xl font-bold mt-2">Cloudflare</h1></div><button onClick={onRefresh} disabled={refreshing} className="flex gap-2 items-center rounded-xl border px-4 py-2 bg-white disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "取得中" : "再読込"}</button></header>
    {loading && <p role="status">取得状態を確認中です。</p>}
    {failed && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">APIからデータを取得できませんでした。値は表示できません。時間をおいて再読込してください。</p>}
    <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
      <section className={panel}><h2 className="text-sm font-bold text-muted">データ状態</h2><p className="text-2xl font-bold my-2">{failed ? "取得失敗" : assessment.state}</p><p className="text-sm">取得項目の判定不能 {assessment.counts.unavailable} 件 / 対象 {assessment.counts.total} 件</p><p className="text-sm mt-2">取得成功は、サイトの安全や無停止を保証するものではありません。</p><a href="#collection-details" className="text-sm underline mt-2 block">欠けた項目・期間・取得状態を見る</a></section>
      <section className={panel}><h2 className="text-sm font-bold text-muted">セキュリティ・トラフィックの兆候</h2><p className="text-2xl font-bold my-2">危険度判定は次段階</p><p className="text-sm">判定不能 0 件 / 自動判定の対象 0 件</p><p className="text-sm mt-2">初回版では取得状態とWAFの処理結果を確認できます。危険度の自動判定は次の段階で対応します。</p><a href="#waf-facts" className="text-sm underline mt-2 block">確認できたWAFの事実を見る</a></section>
    </div>
    {actions.length > 0 && <section className={panel}><h2 className="font-bold">データ収集について必要な操作</h2><ul className="list-disc pl-5 text-sm space-y-2 mt-3">{actions.map(action => <li key={action}>{action}</li>)}</ul></section>}
    <section className={panel}><h2 className="text-xl font-bold">アクセス統計（24時間）</h2>{note("traffic24h")}{traffic ? <div className="grid gap-4 sm:grid-cols-3 mt-4">
      <div><p className="text-sm">総リクエスト</p><p className="text-2xl font-bold">{number(traffic.requests)} 回</p><p className="text-xs mt-2">{samplingNote(collection.traffic24h.sampling, traffic.requests === 0)}</p></div>
      <div><p className="text-sm">APIが報告した脅威イベント</p><p className="text-2xl font-bold">{number(traffic.threatEvents)} 件</p><p className="text-xs mt-2">{samplingNote(collection.traffic24h.sampling, traffic.threatEvents === 0)}。遮断成功・攻撃成功の件数とは断定できません。</p></div>
      <div><p className="text-sm">キャッシュ率</p><p className="text-2xl font-bold">{traffic.cacheRate === null ? "算出不能" : `${traffic.cacheRate}%`}</p><p className="text-xs mt-2">配信効率の参考値です。母数0の率は算出できません。</p></div>
    </div> : unavailable("traffic24h")}</section>
    <section id="waf-facts" className={panel}><h2 className="text-xl font-bold">WAFの処理結果（7日間）</h2>{note("summary")}<p className="text-sm mt-2">遮断はリクエストへの処理、チャレンジは確認要求、記録はログへの記録を表します。1つのリクエストに複数イベントが発生する場合があります。</p>{summary ? <><p className="mt-4 font-bold">総イベント {number(summary.totalEvents)} 件</p><p className="text-xs mt-1">{samplingNote(collection.summary.sampling, summary.totalEvents === 0)}</p><CloudflareActionDistribution data={summary} /><ul className="divide-y mt-3">{Object.entries(summary.actionCounts).map(([action, value]) => <li key={action} className="flex justify-between gap-3 py-2 text-sm"><span>{actionLabel(action)}</span><span>{number(value)} 件</span></li>)}</ul></> : unavailable("summary")}<a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-sm underline block mt-4">Cloudflareで対象ゾーンのSecurity Eventsを確認する</a></section>
    <div className="grid gap-4 md:grid-cols-2">
      <section className={panel}><h2 className="font-bold">上位ルール</h2>{note("topRules")}<p className="text-xs mt-2">取得した上位一覧です。全体件数の代わりには使いません。</p>{rules ? <ul className="divide-y mt-3">{rules.length === 0 && <li className="text-sm">{samplingNote(collection.topRules.sampling, true)}</li>}{rules.map((rule, i) => <li key={i} className="py-2 text-sm break-all">{rule.rule_id} · {actionLabel(rule.action)} · {number(rule.count)} 件</li>)}</ul> : unavailable("topRules")}</section>
      <section className={panel}><h2 className="font-bold">上位パス</h2>{note("topPaths")}<p className="text-xs mt-2">パスは要求先を表します。/wp-login.phpはWordPressのログイン用パスですが、この名前だけでBotや攻撃成功を特定できません。</p>{paths ? <ul className="divide-y mt-3">{paths.length === 0 && <li className="text-sm">{samplingNote(collection.topPaths.sampling, true)}</li>}{paths.map((path, i) => <li key={i} className="py-2 text-sm break-all">{path.path} · {actionLabel(path.action)} · {number(path.count)} 件</li>)}</ul> : unavailable("topPaths")}</section>
      <section className={panel}><h2 className="font-bold">上位ネットワーク（ASN）</h2>{note("topASNs")}<p className="text-xs mt-2">ASNはアクセス元のネットワーク番号です。組織・国の情報から、個人の身元や悪意は判断できません。</p>{asns ? <ul className="divide-y mt-3">{asns.length === 0 && <li className="text-sm">{samplingNote(collection.topASNs.sampling, true)}</li>}{asns.map((asn, i) => <li key={i} className="py-2 text-sm break-all">AS{asn.asn} · {asn.org} · {asn.country} · {number(asn.count)} 件</li>)}</ul> : unavailable("topASNs")}</section>
      <section className={panel}><h2 className="font-bold">WAF時系列</h2>{note("timeline")}{timeline ? <><CloudflareEventTimeline data={timeline} /><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-xs text-left"><caption className="text-left pb-2">確認できた時間別の処理件数</caption><thead><tr><th>時刻（JST）</th><th>処理</th><th>件数</th></tr></thead><tbody>{timeline.length === 0 && <tr><td colSpan={3}>{samplingNote(collection.timeline.sampling, true)}</td></tr>}{timeline.map((event, i) => <tr key={i} className="border-t"><td className="py-2">{dateLabel(event.hour)}</td><td>{actionLabel(event.action)}</td><td>{number(event.count)}</td></tr>)}</tbody></table></div></> : unavailable("timeline")}</section>
    </div>
    <section className={panel}><h2 className="text-xl font-bold">Pages当月デプロイ</h2>{note("pagesMonth")}{pages ? <p className="text-2xl font-bold my-3">{number(pages.deploymentCount)} 件 <span className="text-sm font-normal">（UTCの月初から取得時点まで）</span></p> : unavailable("pagesMonth")}<h3 className="font-bold mt-3">利用枠は未確認</h3><p className="text-sm mt-2">利用枠判定の判定不能 1 件 / 対象 1 件。集計対象、契約上のビルド数と上限、契約の月境界が未確認です。デプロイ件数から残量を計算できません。</p>{collection.pagesMonth.source === "MOCK" ? <p className="text-sm mt-2">デモ値には本番の利用枠判定や操作案内を適用しません。</p> : <p className="text-sm mt-2">必要な操作：CloudflareでPagesの対象と契約・ビルドの利用状況を確認する。</p>}</section>
    <section id="collection-details" className={panel}><h2 className="text-xl font-bold">取得状態・期間・対象範囲</h2><p className="text-xs mt-2">期限はサーバー時刻、通信往復時間と許容誤差を含む保守的な基準で確認します。表示の時刻はJST、Pagesの月次集計はUTCです。</p><div className="divide-y mt-3">{BLOCK_KEYS.map(key => { const block = collection[key]; const check = assessment.blocks[key]; return <article key={key} id={`collection-${key}`} className="py-4 space-y-2 text-sm"><h3 className="font-bold">{BLOCK_LABELS[key]}：{check.state}</h3><p>{check.reason}</p><dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-xs">
      <div><dt className="inline font-semibold">由来：</dt><dd className="inline">{block.source === "LIVE" ? "今回の実取得" : block.source === "MOCK" ? "デモ" : "未確認"}</dd></div><div><dt className="inline font-semibold">対象：</dt><dd className="inline break-all">{block.scope ? `${block.scope.kind === "ZONE" ? "ゾーン" : "アカウント"} / ${block.scope.label}` : "未確認"}</dd></div><div><dt className="inline font-semibold">取得範囲：</dt><dd className="inline">{({ FULL: "要求範囲の取得完了", TOP_N: "上位一覧のみ", INCOMPLETE: "一部未取得", POSSIBLY_TRUNCATED: "取得上限による欠落の可能性", UNKNOWN: "未確認" })[block.coverage]}</dd></div>
      <div><dt className="inline font-semibold">集計期間：</dt><dd className="inline">{dateLabel(block.windowStart)} ～ {dateLabel(block.windowEnd)}</dd></div><div><dt className="inline font-semibold">集計方法：</dt><dd className="inline">{samplingNote(block.sampling)}</dd></div><div><dt className="inline font-semibold">最後の取得試行：</dt><dd className="inline">{dateLabel(block.attemptedAt)}</dd></div><div><dt className="inline font-semibold">取得時刻：</dt><dd className="inline">{dateLabel(block.collectedAt)}</dd></div><div><dt className="inline font-semibold">更新期限：</dt><dd className="inline">{dateLabel(block.validUntil)}</dd></div>
    </dl>{check.action && !failed && <p>必要な操作：{check.action}</p>}</article>; })}</div></section>
    <footer><Link href="/dashboard/gcp" className="text-sm underline">GCPコスト分析を見る</Link></footer>
  </main>;
}




