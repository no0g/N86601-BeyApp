import { PageLoading } from "@/components/ui/page-loading";

export default function PerformanceLoading() {
  return (
    <PageLoading
      title="Loading combo performance..."
      subtitle="Pulling training logs, tournament finishes, and trend lines."
      details={[
        "Multi Nanairo is tuning the data for your next build.",
        "The BeyCrafting machine is reading your combo history.",
        "Tournament points are being calibrated for the graph.",
        "Training records are spinning up in the stadium feed.",
        "Blade resonance is syncing with the performance tracker.",
        "The pit crew is sorting finish types and match stats.",
        "Xtreme Dash patterns are being mapped on the chart.",
        "Your BeyApp analyst is assembling the next matchup report."
      ]}
    />
  );
}
