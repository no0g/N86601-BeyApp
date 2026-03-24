"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPartById } from "@/lib/beyblade-data";
import { formatDate } from "@/lib/utils";

function RecommendationCard({ recommendation, selectedRatchetName, selectedBitName }) {
  const isExactMatch =
    selectedRatchetName?.toLowerCase() === recommendation.ratchet.toLowerCase() &&
    selectedBitName?.toLowerCase() === recommendation.bit.toLowerCase();

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">
            {recommendation.ratchet} / {recommendation.bit}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {recommendation.usageCount} recorded use{recommendation.usageCount > 1 ? "s" : ""}
          </div>
        </div>
        {isExactMatch ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Matches current combo
          </span>
        ) : null}
      </div>
      {recommendation.lastSeenAt ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Last seen: {formatDate(recommendation.lastSeenAt)}
        </div>
      ) : null}
    </div>
  );
}

export function MetaRecommendations({ bladeId, ratchetId, bitId, dark = false }) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    recommendations: []
  });

  const blade = getPartById(bladeId);
  const ratchet = getPartById(ratchetId);
  const bit = getPartById(bitId);
  const bladeName = blade?.altname || blade?.name || "";

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!bladeName) {
        setState({ loading: false, error: null, recommendations: [] });
        return;
      }

      setState((current) => ({
        loading: true,
        error: null,
        recommendations: current.recommendations
      }));

      try {
        const response = await fetch(`/api/meta-recommendations?blade=${encodeURIComponent(bladeName)}`, {
          cache: "force-cache"
        });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load recommendations.");
        }

        setState({
          loading: false,
          error: null,
          recommendations: Array.isArray(data?.recommendations) ? data.recommendations : []
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load recommendations.",
          recommendations: []
        });
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [bladeName]);

  const cardClass = dark ? "border-white/10 bg-white/5 text-white" : "";
  const descriptionClass = dark ? "text-slate-300" : "";
  const loadingClass = dark ? "text-slate-300" : "text-muted-foreground";
  const emptyClass = dark
    ? "rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-300"
    : "rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground";

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={dark ? "text-white" : ""}>Meta Beys Recommendation</CardTitle>
        <CardDescription className={descriptionClass}>
          Top ratchet and bit pairings for this blade based on public Meta Beys tournament usage data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.loading ? (
          <div className={`text-sm ${loadingClass}`}>Loading recommended ratchet and bit pairings...</div>
        ) : null}
        {state.error ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            Recommendation feed unavailable right now. {state.error}
          </div>
        ) : null}
        {!state.loading && !state.error && state.recommendations.length === 0 ? (
          <div className={emptyClass}>No recommendation data found for this blade yet.</div>
        ) : null}
        {state.recommendations.length ? (
          <div className="grid gap-3">
            {state.recommendations.map((recommendation) => (
              <RecommendationCard
                key={`${recommendation.ratchet}-${recommendation.bit}`}
                recommendation={recommendation}
                selectedRatchetName={ratchet?.altname || ratchet?.name || ""}
                selectedBitName={bit?.altname || bit?.name || ""}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
