import React from "react";
import { formatNumber } from "../lib/dashboardUtils";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  description?: string;
  icon: React.ReactNode;
  theme?: "google" | "cloudflare" | "default";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  unit = "",
  description,
  icon,
  theme = "default",
  trend,
}: MetricCardProps) {
  // テーマごとのスタイル定義
  const themeStyles = {
    google: {
      cardBg: "bg-white/80 backdrop-blur-md border border-purple-100/50 hover:border-purple-200",
      accentLine: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
      iconBg: "bg-purple-50 text-purple-600",
      glowColor: "group-hover:shadow-[0_8px_30px_rgb(167,139,250,0.15)]",
    },
    cloudflare: {
      cardBg: "bg-white/80 backdrop-blur-md border border-orange-100/50 hover:border-orange-200",
      accentLine: "bg-gradient-to-r from-orange-500 to-yellow-500",
      iconBg: "bg-orange-50 text-orange-600",
      glowColor: "group-hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)]",
    },
    default: {
      cardBg: "bg-white/80 backdrop-blur-md border border-gray-100 hover:border-gray-200",
      accentLine: "bg-gray-200",
      iconBg: "bg-gray-50 text-gray-600",
      glowColor: "group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
    },
  };

  const styles = themeStyles[theme];

  return (
    <div
      className={`group rounded-[2rem] p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 block relative overflow-hidden ${styles.cardBg} ${styles.glowColor}`}
    >
      {/* 上部の美しいネオンアクセントライン */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.accentLine}`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-muted block mb-1">
            {title.toUpperCase()}
          </span>
          <h3 className="text-3xl font-extrabold text-primary tracking-tight flex items-baseline">
            {typeof value === "number" ? formatNumber(value) : value}
            {unit && <span className="text-sm font-semibold text-muted ml-1">{unit}</span>}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${styles.iconBg} transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        {description && (
          <p className="text-xs text-muted font-medium max-w-[80%] leading-relaxed">
            {description}
          </p>
        )}
        
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
              trend.isPositive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.isPositive ? "↓" : "↑"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
export default MetricCard;
