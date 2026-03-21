import { PageLoading } from "@/components/ui/page-loading";

export default function Loading() {
  return (
    <PageLoading
      title="Loading dashboard"
      subtitle="Syncing combos, decks, training, and tournaments."
      detail="Your combo is assembling on the BeyCrafting machine."
    />
  );
}
