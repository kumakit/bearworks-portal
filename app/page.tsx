export const runtime = "edge";

import { SystemMonitor } from "@/components/SystemMonitor";
import { Github, MapPin, User, Terminal, Database, Globe, Bot, Book, BarChart3, Hand, Sparkles, CloudSun, Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-5xl w-full flex flex-col gap-8 pb-12">
      {/* Top Header / Pill */}
      <header className="flex justify-center pt-4">
        <div className="bg-white px-4 py-2 rounded-full shadow-soft flex items-center gap-2 text-sm font-medium border border-gray-100">
          <img src="/icon.png" alt="Bear Icon" className="w-5 h-5 rounded-full" />
          <span>bearworks.uk</span>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">

        {/* Intro Hero (2 cols, span 1 row) */}
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-soft border border-gray-100 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
            <span className="icon-with-blob animate-wave">
              <Hand size={40} className="text-accent-yellow" />
              <span className="blob blob-yellow blob-sm"></span>
            </span>{" "}
            HI! I DESIGN & BUILD <br />
            <span className="text-accent-blue">DATA EXPERIENCES</span>, <br />
            APPS{" "}
            <span className="icon-with-blob">
              <Sparkles size={32} className="text-accent-pink" />
              <span className="blob blob-pink blob-sm"></span>
            </span>{" "}
            & MODELS.
          </h1>
          <p className="mt-4 text-muted text-lg font-medium max-w-lg">
            Welcome to bearworks.uk. This is the central hub for monitoring and navigating my digital ecosystem.
          </p>
        </div>

        {/* Profile Card (1 col) */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full w-fit border border-gray-100">
              <span className="icon-with-blob">
                <User size={14} className="text-accent-pink" />
                <span className="blob blob-pink"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide">PROFILE</span>
            </div>
            <img src="/icon.png" alt="KUMA" className="w-12 h-12 rounded-full shadow-sm border border-gray-100" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">KUMA</h2>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              Data Scientist & Developer exploring the{" "}
              <span className="icon-with-blob">
                <Database size={14} className="text-blue-500" />
                <span className="blob blob-blue"></span>
              </span>{" "}
              intersection of data,{" "}
              <span className="icon-with-blob">
                <Globe size={14} className="text-green-500" />
                <span className="blob blob-green"></span>
              </span>{" "}
              web, and{" "}
              <span className="icon-with-blob">
                <Bot size={14} className="text-purple-500" />
                <span className="blob blob-purple"></span>
              </span>{" "}
              automation.
            </p>
          </div>
          <div className="mt-auto">
            <a
              href="https://www.google.com/maps/place/Hachioji,+Tokyo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-muted hover:text-primary transition-colors w-fit"
            >
              <span className="icon-with-blob">
                <MapPin size={14} className="text-blue-500" />
                <span className="blob blob-blue"></span>
              </span>
              <span>Hachioji, Tokyo</span>
            </a>
          </div>
        </div>

        {/* GitHub Contribution Card (2 cols) */}
        <a href="https://github.com/kumakit" target="_blank" rel="noopener noreferrer" className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 flex flex-col group hover:shadow-lg transition-all hover:-translate-y-1 block">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className="icon-with-blob">
                <Github size={14} className="text-primary" />
                <span className="blob blob-gray"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide">GITHUB</span>
            </div>
          </div>
          <div className="block w-full mt-auto">
            <div className="bg-gray-50 rounded-2xl p-4 overflow-hidden flex items-center justify-center min-h-[120px] border border-gray-100">
              {/* Re-using the chart from previous site, but inverted for light theme */}
              <img src="https://ghchart.rshah.org/3B82F6/kumakit" alt="Github Chart" className="w-full opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </a>

        {/* MkDocs Card */}
        <div className="bg-[#F0FDF4] rounded-[2.5rem] p-8 shadow-soft border border-green-50 flex flex-col gap-6 group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="icon-with-blob text-2xl">
              <Book size={32} className="text-green-600" />
              <span className="blob blob-green blob-lg"></span>
            </span>
            <SystemMonitor url="https://docs.bearworks.uk/" />
          </div>
          <div className="mt-auto">
            <a href="https://docs.bearworks.uk/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
              <h3 className="text-2xl font-bold text-primary group-hover:text-green-600 transition-colors">Data Science Docs (MkDocs)</h3>
              <p className="text-green-900/60 text-sm mt-1 font-medium">Hosted on Netlify</p>
            </a>
          </div>
        </div>

        {/* Toukei Kentei Drill (1 col) */}
        <div className="bg-[#F5F3FF] rounded-[2.5rem] p-8 shadow-soft border border-purple-50 flex flex-col gap-6 group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="icon-with-blob text-2xl">
              <BarChart3 size={32} className="text-purple-600" />
              <span className="blob blob-purple blob-lg"></span>
            </span>
            <SystemMonitor url="https://toukei.bearworks.uk/" />
          </div>
          <div className="mt-auto">
            <a href="https://toukei.bearworks.uk/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
              <h3 className="text-2xl font-bold text-primary group-hover:text-purple-600 transition-colors">Toukei Kentei Drill</h3>
              <p className="text-purple-900/60 text-sm mt-1 font-medium">Web Application on Cloudflare Pages</p>
            </a>
          </div>
        </div>

        {/* OCI Data Apps (1 col) */}
        <div className="bg-[#EFF6FF] rounded-[2.5rem] p-8 shadow-soft border border-blue-50 flex flex-col gap-6 group hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="icon-with-blob text-2xl">
              <Terminal size={32} className="text-blue-600" />
              <span className="blob blob-blue blob-lg"></span>
            </span>
            <SystemMonitor url="https://apps.bearworks.uk/" />
          </div>
          <div className="mt-auto">
            <a href="https://apps.bearworks.uk/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
              <h3 className="text-2xl font-bold text-primary group-hover:text-blue-600 transition-colors">AI Apps (Streamlit + Ollama)</h3>
              <p className="text-blue-900/60 text-sm mt-1 font-medium">Hosted on OCI via Cloudflare</p>
            </a>
          </div>
        </div>

        {/* Weather Dashboard (1 col) */}
        <a href="/weather" className="bg-[#FFF7ED] rounded-[2.5rem] p-8 shadow-soft border border-orange-50 flex flex-col gap-6 group hover:shadow-lg transition-all hover:-translate-y-1 block">
          <div className="flex justify-between items-start">
            <span className="icon-with-blob text-2xl">
              <CloudSun size={32} className="text-orange-500" />
              <span className="blob blob-yellow blob-lg"></span>
            </span>
          </div>
          <div className="mt-auto">
            <h3 className="text-2xl font-bold text-primary group-hover:text-orange-500 transition-colors">Weather Dashboard</h3>
            <p className="text-orange-900/60 text-sm mt-1 font-medium">八王子 🏠 ↔ 新宿 🏢</p>
          </div>
        </a>

        {/* Dashboard Card (1 col) */}
        <a href="/dashboard" className="bg-[#FAF5FF] rounded-[2.5rem] p-8 shadow-soft border border-purple-50 flex flex-col gap-6 group hover:shadow-lg transition-all hover:-translate-y-1 block">
          <div className="flex justify-between items-start">
            <span className="icon-with-blob text-2xl">
              <Activity size={32} className="text-purple-600" />
              <span className="blob blob-purple blob-lg"></span>
            </span>
          </div>
          <div className="mt-auto">
            <h3 className="text-2xl font-bold text-primary group-hover:text-purple-500 transition-colors">Mission Control Dashboard</h3>
            <p className="text-purple-900/60 text-sm mt-1 font-medium">Google AI Studio & Cloudflare</p>
          </div>
        </a>

      </div>
    </main>
  );
}
