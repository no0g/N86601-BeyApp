import { PageLoading } from "@/components/ui/page-loading";

export default function LocalTournamentLoading() {
  return (
    <PageLoading
      title="Loading local tournament..."
      subtitle="Preparing participants, ranking table, and bracket stages."
      details={[
        "The qualifier board is syncing round pairings.",
        "Upper and lower bracket paths are being assembled.",
        "Final stage routes are loading into the tournament engine."
      ]}
    />
  );
}

