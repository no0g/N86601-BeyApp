import { PageLoading } from "@/components/ui/page-loading";

export default function SimulatorLoading() {
  return (
    <PageLoading
      title="Loading battle simulator..."
      subtitle="Preparing combo profiles and matchup model."
      details={[
        "Multi Nanairo is calibrating the simulation arena.",
        "Ratchet balance and bit behavior are being synced.",
        "The Xtreme line model is warming up for matchup projection."
      ]}
    />
  );
}

