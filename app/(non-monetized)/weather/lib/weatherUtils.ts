// WMO Weather Code utilities
// Reference: https://open-meteo.com/en/docs

export interface HourlyEntry {
  hour: number;
  temp: number;
  apparentTemp: number;
  weatherCode: number;
  precipProb: number;
  precip: number;
  windSpeed: number;
  humidity: number;
}

export interface DailySummary {
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbMax: number;
  sunrise: string;
  sunset: string;
}

export interface LocationWeather {
  name: string;
  overview: string;
  umbrella: boolean;
  umbrellaAdvice: string;
  clothingAdvice: string;
  daily: DailySummary;
  hourly: {
    today: HourlyEntry[];
    yesterday: HourlyEntry[];
  };
}

export interface WeatherData {
  updatedAt: string;
  locations: LocationWeather[];
}

// WMO Weather Code → Emoji mapping
const WMO_EMOJI: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌧️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "⛈️",
  71: "🌨️",
  73: "❄️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const WMO_TEXT_JA: Record<number, string> = {
  0: "快晴",
  1: "晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "着氷性の霧",
  51: "弱い霧雨",
  53: "霧雨",
  55: "強い霧雨",
  61: "小雨",
  63: "雨",
  65: "大雨",
  71: "小雪",
  73: "雪",
  75: "大雪",
  80: "にわか雨",
  81: "にわか雨",
  82: "激しいにわか雨",
  85: "にわか雪",
  86: "激しいにわか雪",
  95: "雷雨",
  96: "雹を伴う雷雨",
  99: "激しい雷雨",
};

export function getWeatherEmoji(code: number): string {
  return WMO_EMOJI[code] ?? "❓";
}

export function getWeatherText(code: number): string {
  return WMO_TEXT_JA[code] ?? `不明(${code})`;
}

export function formatTemp(temp: number): string {
  return `${Math.round(temp)}°`;
}

export function formatTempWithUnit(temp: number): string {
  return `${Math.round(temp)}°C`;
}

export function getRelativeTime(isoString: string): string {
  const updated = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${Math.floor(diffHours / 24)}日前`;
}

// Returns a CSS gradient color based on temperature
export function getTempColor(temp: number): string {
  if (temp <= 5) return "#60a5fa";   // blue-400
  if (temp <= 15) return "#38bdf8";  // sky-400
  if (temp <= 20) return "#34d399";  // emerald-400
  if (temp <= 25) return "#fbbf24";  // amber-400
  if (temp <= 30) return "#fb923c";  // orange-400
  return "#f87171";                   // red-400
}

// Determine if weather code implies rain
export function isRainyWeather(code: number): boolean {
  return [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
}
