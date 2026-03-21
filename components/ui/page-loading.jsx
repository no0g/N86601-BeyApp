const loadingLines = [
  "Multi Nanairo is crafting your new blade.",
  "Your combo is assembling on the BeyCrafting machine.",
  "The Xtreme Line is charging for launch.",
  "Ratchet locks are snapping into place.",
  "Bit tuning is underway in the pit."
];

export function PageLoading({
  title = "Loading...",
  subtitle = "Preparing your BeyApp view.",
  detail = loadingLines[0]
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-12 text-center shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-slate-900" />
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
        <div className="text-xs uppercase tracking-[0.24em] text-emerald-700">{detail}</div>
      </div>
    </div>
  );
}
