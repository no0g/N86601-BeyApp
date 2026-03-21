"use client";

import { useEffect, useState } from "react";

const loadingLines = [
  "Multi Nanairo is crafting your new blade.",
  "Your combo is assembling on the BeyCrafting machine.",
  "The Xtreme Line is charging for launch.",
  "Ratchet locks are snapping into place.",
  "Bit tuning is underway in the pit.",
  "The launcher rail is calibrating for an Xtreme Dash.",
  "Bird Kazami is checking the matchup notes.",
  "The stadium crew is setting the next Beybattle."
];

export function PageLoading({
  title = "Loading...",
  subtitle = "Preparing your BeyApp view.",
  details = loadingLines
}) {
  const [detailIndex, setDetailIndex] = useState(0);

  useEffect(() => {
    if (details.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setDetailIndex((currentIndex) => (currentIndex + 1) % details.length);
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [details]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-slate-950/40">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-slate-900" />
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
        <div className="text-xs uppercase tracking-[0.24em] text-emerald-700">
          {details[detailIndex] || loadingLines[0]}
        </div>
      </div>
    </div>
  );
}
