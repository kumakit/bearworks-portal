"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CloudflareCollectionView } from "../components/CloudflareCollectionView";

import { clockUpperBound, parseCollection, syncClock, type ClockAnchor, type Collection } from "../lib/cloudflareCollection";


export default function CloudflareWafPage() {
  const [collection, setCollection] = useState<Collection>(() => parseCollection(null));
  const [anchor, setAnchor] = useState<ClockAnchor | null>(null);
  const [mono, setMono] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef<AbortController | null>(null);
  const clock = useRef<ClockAnchor | null>(null);
  const mounted = useRef(true);
  const fetching = useRef(false);
  const lastFetchMono = useRef(0);
  const fetchData = useCallback(async (invalidate = false) => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller; fetching.current = true;
    if (invalidate) { clock.current = null; setAnchor(null); }
    setRefreshing(true);
    const start = performance.now(); lastFetchMono.current = start;
    try {
      const response = await fetch("/api/dashboard-data", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
      if (!response.ok) throw new Error("FETCH_FAILED");
      const payload: unknown = await response.json(); const receive = performance.now();
      if (controller.signal.aborted || !mounted.current) return;
      const meta = payload && typeof payload === "object" && "responseMeta" in payload ? payload.responseMeta : null;
      const next = syncClock(meta, start, receive, clock.current); clock.current = next;
      setCollection(parseCollection(payload)); setAnchor(next); setMono(receive); setFailed(false);
    } catch {
      if (controller.signal.aborted || !mounted.current) return;
      clock.current = null; setAnchor(null); setCollection(parseCollection(null)); setFailed(true);
    } finally {
      if (!controller.signal.aborted && mounted.current) { fetching.current = false; setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => { if (mounted.current) void fetchData(); });
    const onVisibility = () => {
      clock.current = null; setAnchor(null);
      if (document.visibilityState === "visible") void fetchData(true);
      else { active.current?.abort(); fetching.current = false; }
    };
    const onPageShow = () => { if (document.visibilityState === "visible") void fetchData(true); };
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const current = performance.now(); setMono(current);
      const interrupted = current < lastTick || current - lastTick > 2500;
      lastTick = current;
      if (document.visibilityState !== "visible" || fetching.current) return;
      if (interrupted) { void fetchData(true); return; }
      const base = clock.current;
      if (base ? clockUpperBound(base, current) === null : current - lastFetchMono.current >= 60_000) void fetchData();
    }, 1000);
    document.addEventListener("visibilitychange", onVisibility); window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onPageShow);
    document.addEventListener("resume", onPageShow);
    return () => { mounted.current = false; active.current?.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pageshow", onPageShow); window.removeEventListener("focus", onPageShow); document.removeEventListener("resume", onPageShow); };
  }, [fetchData]);

  return <CloudflareCollectionView collection={collection} nowUpper={clockUpperBound(anchor, mono)} loading={loading} refreshing={refreshing} failed={failed} onRefresh={() => void fetchData()} />;
}
