import React from "react";
import Link from "next/link";
import { RefreshCw, Clock, ArrowRight } from "lucide-react";
import { getRelativeTime } from "../lib/dashboardUtils";

interface DetailPageLayoutProps {
  title: string;
  updatedAt: string;
  refreshing: boolean;
  onRefresh: () => void;
  crossLinkText: string;
  crossLinkHref: string;
  children: React.ReactNode;
}

export function DetailPageLayout({
  title,
  updatedAt,
  refreshing,
  onRefresh,
  crossLinkText,
  crossLinkHref,
  children,
}: DetailPageLayoutProps) {
  return (
    <main className="max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Breadcrumbs & Actions */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-muted tracking-wide">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            DASHBOARD
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-primary">{title.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold tracking-wider">
            🛡️ CLOUDFLARE ACCESS PROTECTED
          </span>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-soft transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={`${refreshing ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b pb-6 border-gray-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted mt-1 font-semibold">
            Personal Mission Control - 詳細分析データ
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-1.5 mt-4 md:mt-0 text-[11px] font-semibold text-muted bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0">
          <Clock size={12} className="text-purple-500" />
          <span>最終収集: {getRelativeTime(updatedAt)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">{children}</div>

      {/* Cross link footer */}
      <footer className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link
          href={crossLinkHref}
          className="group flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/60 px-4 py-2.5 rounded-2xl transition-all duration-300 active:scale-95 border border-purple-100/40"
        >
          <span>{crossLinkText}</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1 duration-300" />
        </Link>

        <div className="text-center md:text-right text-[10px] text-muted/60 font-semibold">
          <p>GCP TimeSeries Monitoring • Cloudflare Zone Analytics Dashboard</p>
          <p className="mt-0.5">Protected by Cloudflare ZTNA • UI by Antigravity AI</p>
        </div>
      </footer>
    </main>
  );
}

export default DetailPageLayout;
