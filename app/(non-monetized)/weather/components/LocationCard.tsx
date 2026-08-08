"use client";

import { LocationWeather, getWeatherEmoji, getWeatherText, formatTemp } from "../lib/weatherUtils";

interface LocationCardProps {
  location: LocationWeather;
}

export default function LocationCard({ location }: LocationCardProps) {
  const { name, overview, daily } = location;
  const emoji = getWeatherEmoji(daily.weatherCode);
  const weatherText = getWeatherText(daily.weatherCode);

  const isHome = name === "八王子";

  return (
    <div className="rounded-3xl p-6 border bg-white shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isHome ? "🏠" : "🏢"}</span>
          <h3 className="text-lg font-bold text-gray-800">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{emoji}</span>
          <span className="text-sm font-medium text-gray-500">{weatherText}</span>
        </div>
      </div>

      {/* 気温 */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
          {formatTemp(daily.tempMax)}
        </span>
        <span className="text-lg text-gray-400 font-medium">
          / {formatTemp(daily.tempMin)}
        </span>
      </div>

      {/* 概況テキスト */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {overview}
      </p>

      {/* メタデータ */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50">
          <span className="text-base mb-0.5">💧</span>
          <span className="font-semibold text-gray-700">{daily.precipitationSum}mm</span>
          <span>降水量</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50">
          <span className="text-base mb-0.5">🌅</span>
          <span className="font-semibold text-gray-700">{daily.sunrise}</span>
          <span>日の出</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50">
          <span className="text-base mb-0.5">🌇</span>
          <span className="font-semibold text-gray-700">{daily.sunset}</span>
          <span>日の入</span>
        </div>
      </div>
    </div>
  );
}
