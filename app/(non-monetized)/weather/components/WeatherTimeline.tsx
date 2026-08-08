"use client";

import { useState } from "react";
import { LocationWeather, getWeatherEmoji, formatTemp } from "../lib/weatherUtils";

interface WeatherTimelineProps {
  locations: LocationWeather[];
}

export default function WeatherTimeline({ locations }: WeatherTimelineProps) {
  const [activeTab, setActiveTab] = useState(0);
  const location = locations[activeTab];
  if (!location) return null;

  const currentHour = new Date().getHours();
  // 6時〜23時の間かつ、偶数時間(6, 8, 10...)または23時のデータを抽出
  const hourlyData = location.hourly.today.filter((entry) => {
    return entry.hour >= 6 && entry.hour <= 23 && (entry.hour % 2 === 0 || entry.hour === 23);
  });

  return (
    <div className="rounded-3xl p-6 border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌤️</span>
          <h3 className="text-lg font-bold text-gray-800">天気タイムライン</h3>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
          {locations.map((loc, i) => (
            <button
              key={loc.name}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                activeTab === i
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {loc.name === "八王子" ? "🏠" : "🏢"} {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2 pt-4">
        <div className="flex gap-1 min-w-max sm:min-w-full">
          {hourlyData.map((entry) => {
            // 現在時刻が奇数の場合、直前の偶数時間（現在時刻-1）を「現在の時間帯」として扱う
            const displayCurrentHour = currentHour % 2 !== 0 ? currentHour - 1 : currentHour;
            const isCurrent = entry.hour === displayCurrentHour || (currentHour === 23 && entry.hour === 23);
            const isPast = entry.hour < displayCurrentHour;

            return (
              <div
                key={entry.hour}
                className={`flex flex-col items-center py-3 px-2 rounded-2xl min-w-[52px] flex-1 transition-all ${
                  isCurrent
                    ? "bg-blue-50 border-2 border-blue-200 shadow-sm scale-105"
                    : isPast
                    ? "opacity-50"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* 時刻 */}
                <span
                  className={`text-[10px] font-semibold mb-1.5 ${
                    isCurrent ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {entry.hour}時
                </span>

                {/* 天気アイコン */}
                <span className="text-xl mb-1">
                  {getWeatherEmoji(entry.weatherCode)}
                </span>

                {/* 気温 */}
                <span
                  className={`text-sm font-bold mb-1.5 ${
                    isCurrent ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {formatTemp(entry.temp)}
                </span>

                {/* 降水確率バー */}
                <div className="w-6 h-14 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute bottom-0 w-full rounded-full transition-all ${
                      entry.precipProb >= 60
                        ? "bg-blue-500"
                        : entry.precipProb >= 30
                        ? "bg-blue-300"
                        : "bg-blue-200"
                    }`}
                    style={{ height: `${Math.max(entry.precipProb, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 mt-1 font-medium">
                  {entry.precipProb}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 justify-end">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-200 rounded-full" />
          <span>降水確率</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-50 border-2 border-blue-200 rounded" />
          <span>現在の時刻</span>
        </div>
      </div>
    </div>
  );
}
