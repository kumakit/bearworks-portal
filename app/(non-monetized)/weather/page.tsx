"use client";

import { useState, useEffect } from "react";
import { WeatherData, getRelativeTime } from "./lib/weatherUtils";
import WeatherSummary from "./components/WeatherSummary";
import LocationCard from "./components/LocationCard";
import TemperatureChart from "./components/TemperatureChart";
import WeatherTimeline from "./components/WeatherTimeline";

const WEATHER_API_URL = "https://apps.bearworks.uk/api/weather/weather.json";

// モックデータ（APIが利用できない場合のフォールバック）
const MOCK_DATA: WeatherData = {
  updatedAt: new Date().toISOString(),
  locations: [
    {
      name: "新宿",
      overview:
        "今日は終日晴れの穏やかな天気が続きます。最高気温は25℃で、昨日より2℃高くなる見込みです。湿度も低く過ごしやすい一日でしょう。",
      umbrella: false,
      umbrellaAdvice: "今日は終日晴れのため、傘の心配はなさそうです。",
      clothingAdvice:
        "日中は半袖で快適に過ごせます。朝晩は少しひんやりするので、薄手のカーディガンを持っておくと安心です。",
      daily: {
        weatherCode: 1,
        tempMax: 25,
        tempMin: 13,
        precipitationSum: 0,
        precipitationProbMax: 0,
        sunrise: "04:35",
        sunset: "18:39",
      },
      hourly: {
        today: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          temp: 13 + Math.sin((i - 6) * 0.26) * 7 + (i > 6 && i < 18 ? 5 : 0),
          apparentTemp: 12 + Math.sin((i - 6) * 0.26) * 8 + (i > 6 && i < 18 ? 6 : 0),
          weatherCode: i >= 6 && i <= 18 ? 0 : 1,
          precipProb: 0,
          precip: 0,
          windSpeed: 3 + Math.random() * 4,
          humidity: 80 - (i > 6 && i < 15 ? 30 : 0),
        })),
        yesterday: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          temp: 12 + Math.sin((i - 6) * 0.26) * 6 + (i > 6 && i < 18 ? 4 : 0),
          apparentTemp: 11 + Math.sin((i - 6) * 0.26) * 7 + (i > 6 && i < 18 ? 5 : 0),
          weatherCode: i >= 6 && i <= 14 ? 1 : 2,
          precipProb: i > 14 ? 20 : 0,
          precip: 0,
          windSpeed: 3 + Math.random() * 3,
          humidity: 85 - (i > 6 && i < 15 ? 25 : 0),
        })),
      },
    },
    {
      name: "八王子",
      overview:
        "朝は晴れ間が広がりますが、夕方から雲が増える見込みです。最高気温は25℃で前日より3℃高く、日中は半袖で過ごせる暖かさです。",
      umbrella: false,
      umbrellaAdvice: "夕方から雲が増えますが、雨の心配はありません。傘は不要でしょう。",
      clothingAdvice:
        "日中は半袖でOK。朝晩は薄手のカーディガンがあると安心です。",
      daily: {
        weatherCode: 2,
        tempMax: 25,
        tempMin: 13,
        precipitationSum: 0,
        precipitationProbMax: 0,
        sunrise: "04:36",
        sunset: "18:40",
      },
      hourly: {
        today: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          temp: 13 + Math.sin((i - 6) * 0.26) * 7 + (i > 6 && i < 18 ? 5 : 0),
          apparentTemp: 12 + Math.sin((i - 6) * 0.26) * 8 + (i > 6 && i < 18 ? 6 : 0),
          weatherCode: i >= 6 && i <= 15 ? 0 : i > 15 ? 2 : 1,
          precipProb: 0,
          precip: 0,
          windSpeed: 2 + Math.random() * 5,
          humidity: 85 - (i > 6 && i < 15 ? 35 : 0),
        })),
        yesterday: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          temp: 12 + Math.sin((i - 6) * 0.26) * 5 + (i > 6 && i < 18 ? 3 : 0),
          apparentTemp: 11 + Math.sin((i - 6) * 0.26) * 6 + (i > 6 && i < 18 ? 4 : 0),
          weatherCode: i < 5 ? 1 : i < 10 ? 2 : 3,
          precipProb: i > 10 ? 68 : 20,
          precip: 0,
          windSpeed: 3 + Math.random() * 4,
          humidity: 90 - (i > 6 && i < 15 ? 25 : 0),
        })),
      },
    },
  ],
};

export default function WeatherPage() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`${WEATHER_API_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: WeatherData = await res.json();
        setData(json);
      } catch (err) {
        console.warn("Weather API unavailable, using mock data:", err);
        setData(MOCK_DATA);
        setUsingMock(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="animate-spin text-4xl">🌀</div>
          <p className="text-gray-400 font-medium">天気データを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-gray-500 font-medium">
            天気データを取得できませんでした
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            bearworks.uk
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {getRelativeTime(data.updatedAt)} に更新
          </span>
        </div>
      </header>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          ☁️ パーソナル天気ダッシュボード
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          八王子 🏠 ↔ 新宿 🏢 の天気を一目で
        </p>
      </div>

      {/* Summary Cards */}
      <WeatherSummary locations={data.locations} />

      {/* Location Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.locations.map((loc) => (
          <LocationCard key={loc.name} location={loc} />
        ))}
      </div>

      {/* Temperature Chart */}
      <TemperatureChart locations={data.locations} />

      {/* Weather Timeline */}
      <WeatherTimeline locations={data.locations} />

      {/* Footer */}
      <footer className="text-center text-xs text-gray-300 py-4">
        <p>
          Data by{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-500 transition-colors"
          >
            Open-Meteo
          </a>
          {" "}• Insights by Gemini API • Updated daily at 5:00 AM JST
        </p>
      </footer>
    </main>
  );
}
