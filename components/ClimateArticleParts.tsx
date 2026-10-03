import type { ReactNode } from "react";

export function ClimateLesson({ children, title }: { children: ReactNode; title: string }) {
  return <aside className="mt-6 rounded-2xl border-l-4 border-indigo-400 bg-indigo-50 px-5 py-5 text-indigo-950">
    <p className="text-xs font-bold tracking-wider text-indigo-700">統計の読み方</p><h3 className="mt-2 font-bold">{title}</h3><div className="mt-3 space-y-3 text-sm leading-7">{children}</div>
  </aside>;
}

export function ClimateSection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6 space-y-5">
    <div className="flex items-baseline gap-3 border-t border-slate-200 pt-8"><span aria-hidden="true" className="font-mono text-sm text-slate-500">{number}</span><h2 id={`${id}-heading`} className="text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl">{title}</h2></div>{children}
  </section>;
}

export function ClimateQuizzes({ items }: { items: { question: string; answer: string }[] }) {
  return <div className="space-y-3">{items.map((item, i) => <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-indigo-300 open:bg-indigo-50/40">
    <summary className="cursor-pointer font-semibold leading-relaxed"><span className="mr-3 font-mono text-sm text-indigo-700">Q{i + 1}</span>{item.question}</summary><p className="mt-4 text-sm leading-7 text-slate-700">{item.answer}</p>
  </details>)}</div>;
}

export function ClimateDownloads({ hash, version }: { hash: string; version: string }) {
  return <details className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
    <summary className="cursor-pointer font-semibold">原本をダウンロード・検証情報を見る</summary>
    <p className="mt-3 leading-7">原本は気象庁から取得したままのCSV（Shift_JIS）です。気温・降水量の値と品質情報・均質番号を保持しています。データ版：{version}。</p>
    <div className="mt-3 flex flex-wrap gap-4 text-sky-800 underline"><a download href="/data/hachioji-rain-autumn/jma-daily-2009-2025-20261004.csv">観測CSV原本（約502KB）</a><a download href="/data/hachioji-rain-autumn/source-manifest.json">取得条件と原本のハッシュ</a></div>
    <p className="mt-3 break-all text-xs text-slate-600">この記事の固定集計データのSHA-256：{hash}</p>
  </details>;
}
