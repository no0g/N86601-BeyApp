import { PageLoading } from "@/components/ui/page-loading";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <PageLoading
          title="Launching N86601 BeyApp"
          subtitle="Preparing your team workspace."
          details={[
            "The Xtreme Stadium is opening for the next battle.",
            "Multi Nanairo is crafting your new blade.",
            "The BeyCrafting machine is warming up.",
            "Ratchet locks are snapping into place.",
            "The launcher rail is calibrating for launch.",
            "Bird Kazami is reviewing the lineup.",
            "The battle judge is syncing the match log.",
            "The team pit is getting your next combo ready."
          ]}
        />
      </div>
    </main>
  );
}
