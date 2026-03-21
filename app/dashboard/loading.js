import { PageLoading } from "@/components/ui/page-loading";

export default function Loading() {
  return (
    <PageLoading
      title="Loading dashboard"
      subtitle="Syncing combos, decks, training, and tournaments."
      details={[
        "Your combo is assembling on the BeyCrafting machine.",
        "The Xtreme Line is charging for launch.",
        "Training logs are spinning into place.",
        "Tournament records are locking onto the stadium rail.",
        "Bit tuning is underway in the pit.",
        "The launch crew is checking your ratchets.",
        "Multi Nanairo is refining the next setup.",
        "The next Beybattle panel is coming online."
      ]}
    />
  );
}
