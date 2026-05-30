"use client";

import { LocationWeather, getWeatherEmoji, getWeatherText, formatTemp } from "../lib/weatherUtils";

interface WeatherSummaryProps {
  locations: LocationWeather[];
}

export default function WeatherSummary({ locations }: WeatherSummaryProps) {
  // 傘が必要な拠点があるか
  const needsUmbrella = locations.some((loc) => loc.umbrella);
  // 最初の拠点の服装アドバイスを代表として使用
  const clothingAdvice = locations[0]?.clothingAdvice ?? "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 傘の要否カード */}
      <div
        className={`rounded-3xl p-6 border transition-all ${needsUmbrella
            ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"
            : "bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-100"
          }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl" role="img" aria-label={needsUmbrella ? "umbrella" : "sun"}>
            {needsUmbrella ? "☂️" : "☀️"}
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              傘
            </p>
            <p className={`text-lg font-bold ${needsUmbrella ? "text-indigo-700" : "text-sky-700"}`}>
              {needsUmbrella ? "持って行きましょう" : "必要なさそう"}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-1 line-clamp-2">
          {locations[0]?.umbrellaAdvice}
        </p>
        {/* 各拠点の降水確率 */}
        <div className="flex gap-4 mt-2">
          {locations.map((loc) => (
            <div key={loc.name} className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="text-base">{getWeatherEmoji(loc.daily.weatherCode)}</span>
              <span className="font-medium text-gray-700">{loc.name}</span>
              <span className="text-gray-400">
                降水確率 {loc.daily.precipitationProbMax}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 服装アドバイスカード */}
      <div className="rounded-3xl p-6 border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl" role="img" aria-label="clothing">
            👕
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              服装アドバイス
            </p>
            <p className="text-lg font-bold text-amber-800">
              今日のおすすめ
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-1">
          {clothingAdvice}
        </p>
        {/* 気温レンジ */}
        <div className="flex gap-4 mt-3">
          {locations.map((loc) => (
            <div key={loc.name} className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{loc.name}</span>{" "}
              {formatTemp(loc.daily.tempMin)}〜{formatTemp(loc.daily.tempMax)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
