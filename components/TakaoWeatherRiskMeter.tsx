"use client";

import { useId, useState } from "react";

type BaseWeather = "sunny" | "cloudy" | "rainy";
type SummitReport = "unknown" | "clear" | "low-visibility";
type ThunderInfo = "unchecked" | "checked";
const selectClass = "min-w-0 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500";

export function TakaoWeatherRiskMeter() {
  const baseId = useId();
  const summitId = useId();
  const thunderId = useId();
  const [baseWeather, setBaseWeather] = useState<BaseWeather>("sunny");
  const [summitReport, setSummitReport] = useState<SummitReport>("unknown");
  const [thunderInfo, setThunderInfo] = useState<ThunderInfo>("unchecked");

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
      <p className="leading-7 text-slate-700">
        これは情報の読み方を練習する教材です。入力から現在の天気・霧・雷の発生確率や登山の可否を計算しません。実際の計画では最新の気象情報と現地情報を確認してください。
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
          <label htmlFor={baseId} className="mb-2 block text-sm font-semibold text-slate-900">市街地の予報</label>
          <select id={baseId} value={baseWeather} onChange={(event) => setBaseWeather(event.target.value as BaseWeather)} className={selectClass}>
            <option value="sunny">晴れ</option>
            <option value="cloudy">曇り</option>
            <option value="rainy">雨</option>
          </select>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
          <label htmlFor={summitId} className="mb-2 block text-sm font-semibold text-slate-900">山頂付近の現地情報</label>
          <select id={summitId} value={summitReport} onChange={(event) => setSummitReport(event.target.value as SummitReport)} className={selectClass}>
            <option value="unknown">未確認</option>
            <option value="clear">視界良好という報告</option>
            <option value="low-visibility">視界不良という報告</option>
          </select>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
          <label htmlFor={thunderId} className="mb-2 block text-sm font-semibold text-slate-900">最新の雷情報</label>
          <select id={thunderId} value={thunderInfo} onChange={(event) => setThunderInfo(event.target.value as ThunderInfo)} className={selectClass}>
            <option value="unchecked">未確認</option>
            <option value="checked">確認済み</option>
          </select>
        </div>
      </div>
      <div aria-live="polite" className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5 md:p-6">
        <h3 className="font-bold text-sky-950">この組み合わせから考えること</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
          <li>{baseWeather === "sunny" ? "市街地の晴れ予報だけでは、山頂の視界は決まりません。" : baseWeather === "cloudy" ? "市街地の曇り予報だけで山頂の雲の高さや視界は決まりません。雲量と視界は別の情報です。" : "市街地の雨予報を見たら、山頂側の降水情報も確認します。市街地の予報だけで山頂の雨量や視界を決めつけません。"}</li>
          <li>{summitReport === "unknown" ? "山頂付近の情報が未確認です。湿度や市街地の天気から霧を断定できません。" : summitReport === "low-visibility" ? "現地の視界不良の報告は、湿度から推測した数値より直接的な情報です。報告時刻も確認します。" : "視界良好の報告も、その時刻と地点の情報です。後の天気まで保証しません。"}</li>
          <li>{thunderInfo === "unchecked" ? "雷の情報を確認していません。過去の降水頻度は現在の雷情報の代わりになりません。" : "最新の雷情報を確認した後も、更新時刻と対象地域を見直します。"}</li>
        </ul>
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
        <a href="https://www.jma.go.jp/bosai/" target="_blank" rel="noopener noreferrer" className="text-sky-800 underline underline-offset-4">気象庁の防災情報</a>
        <a href="https://www.jma.go.jp/bosai/nowc/" target="_blank" rel="noopener noreferrer" className="text-sky-800 underline underline-offset-4">雨雲・雷のナウキャスト</a>
      </div>
    </div>
  );
}
