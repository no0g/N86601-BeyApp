"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { PageLoading } from "@/components/ui/page-loading";

const finishTypeLabels = {
  XTREME: "Xtreme Finish",
  BURST: "Burst Finish",
  OVER: "Over Finish",
  SPIN: "Spin Finish"
};

function formatPoints(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function buildPolyline(points, width, height, padding) {
  if (points.length === 1) {
    const x = width / 2;
    const y = height / 2;
    return `${x},${y}`;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function PerformanceChart({ timeline }) {
  if (!timeline.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
        No historical matches logged for this combo yet.
      </div>
    );
  }

  const width = 720;
  const height = 280;
  const padding = 24;
  const tournamentPoints = timeline.map((entry, index) => ({ index, value: entry.tournamentCumulative }));
  const trainingPoints = timeline.map((entry, index) => ({ index, value: entry.trainingCumulative }));
  const combinedPoints = timeline.map((entry, index) => ({ index, value: entry.combinedCumulative }));
  const latest = timeline[timeline.length - 1];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Performance Trend</div>
            <div className="text-sm text-muted-foreground">
              Higher lines mean stronger cumulative point performance over time.
            </div>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-muted px-3 py-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Combined line
              </div>
              <div className="mt-1 text-muted-foreground">Tournament and training points added together.</div>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Tournament line
              </div>
              <div className="mt-1 text-muted-foreground">Only official tournament match results.</div>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                Training line
              </div>
              <div className="mt-1 text-muted-foreground">Only internal practice and sparring results.</div>
            </div>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" opacity="0.15" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" opacity="0.15" />
          <polyline fill="none" stroke="#22c55e" strokeWidth="4" points={buildPolyline(combinedPoints, width, height, padding)} />
          <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points={buildPolyline(tournamentPoints, width, height, padding)} />
          <polyline fill="none" stroke="#06b6d4" strokeWidth="3" points={buildPolyline(trainingPoints, width, height, padding)} />
        </svg>
      </div>
      <div className="grid gap-3 text-sm text-muted-foreground lg:grid-cols-[1fr,1fr,1fr]">
        <div className="rounded-2xl border border-border px-4 py-3">
          <div className="font-medium text-foreground">How to read it</div>
          <div className="mt-1">Upward movement means the combo gained points. Flat sections mean no net change. Downward movement means losses pulled the score down.</div>
        </div>
        <div className="rounded-2xl border border-border px-4 py-3">
          <div className="font-medium text-foreground">Current totals</div>
          <div className="mt-1">
            Combined {formatPoints(latest.combinedCumulative)} • Tournament {formatPoints(latest.tournamentCumulative)} • Training {formatPoints(latest.trainingCumulative)}
          </div>
        </div>
        <div className="rounded-2xl border border-border px-4 py-3">
          <div className="font-medium text-foreground">Timeline window</div>
          <div className="mt-1">
            {timeline.length} logged results from <LocalDateTime value={timeline[0].playedAt} /> to <LocalDateTime value={latest.playedAt} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, entry }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{formatPoints(entry.points)} pts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div>{entry.wins}-{entry.losses}-{entry.draws}</div>
        <div>{entry.total} matches</div>
        <div>{formatPercent(entry.winRate)} win rate</div>
        <div>{entry.overallScore} overall score</div>
      </CardContent>
    </Card>
  );
}

function FinishBreakdown({ entry }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(finishTypeLabels).map(([key, label]) => (
        <div key={key} className="rounded-2xl bg-muted px-4 py-3 text-sm">
          <div className="text-muted-foreground">{label}</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{entry.finishTypes[key] || 0}</div>
        </div>
      ))}
    </div>
  );
}

function WorstMatchupCard({ matchup }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worst Matchup</CardTitle>
        <CardDescription>Based on tracked training head-to-head results for this combo.</CardDescription>
      </CardHeader>
      <CardContent>
        {matchup ? (
          <div className="space-y-3">
            <div>
              <div className="text-lg font-semibold">{matchup.opponent.name}</div>
              <div className="text-sm text-muted-foreground">{matchup.opponent.owner?.displayName || "Team combo"}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="text-muted-foreground">Record</div>
                <div className="mt-1 font-semibold text-foreground">{matchup.wins}-{matchup.losses}-{matchup.draws}</div>
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="text-muted-foreground">Win rate</div>
                <div className="mt-1 font-semibold text-foreground">{formatPercent(matchup.winRate)}</div>
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="text-muted-foreground">Point delta</div>
                <div className="mt-1 font-semibold text-foreground">{formatPoints(matchup.points)}</div>
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="text-muted-foreground">Matches</div>
                <div className="mt-1 font-semibold text-foreground">{matchup.total}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No training head-to-head matchup data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformanceBrowser({
  combos,
  performances,
  currentPage,
  totalPages,
  initialComboId,
  previousPageHref,
  nextPageHref
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedComboId, setSelectedComboId] = useState(initialComboId);
  const selectedCombo = useMemo(
    () => combos.find((combo) => combo.id === selectedComboId) || combos[0],
    [combos, selectedComboId]
  );
  const performance = performances[selectedCombo.id];

  function navigateToPage(href) {
    if (!href) {
      return;
    }

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="space-y-6">
      {isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <PageLoading
              title="Loading next performance page..."
              subtitle="Fetching the next bundle of combos and match history."
              details={[
                "The stadium archive is opening the next set of combo records.",
                "Battle logs are spinning in from the next performance page.",
                "The analytics crew is unpacking the next batch of Bey results.",
                "Training and tournament history are syncing for the next lineup."
              ]}
            />
          </div>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Combo Performance</CardTitle>
          <CardDescription>
            Historical trend lines and performance stats for each saved combo across training and tournaments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Combo page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              {previousPageHref ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(previousPageHref)}
                  className="rounded-2xl border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  ← Previous
                </button>
              ) : (
                <span className="rounded-2xl border border-border px-3 py-2 text-sm text-muted-foreground">← Previous</span>
              )}
              {nextPageHref ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(nextPageHref)}
                  className="rounded-2xl border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Next →
                </button>
              ) : (
                <span className="rounded-2xl border border-border px-3 py-2 text-sm text-muted-foreground">Next →</span>
              )}
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {combos.map((combo, index) => (
              <button
                key={combo.id}
                type="button"
                onClick={() => setSelectedComboId(combo.id)}
                className={`rounded-2xl border px-4 py-2 text-left text-sm transition ${
                  combo.id === selectedCombo.id ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-border hover:bg-muted"
                }`}
              >
                <div className="font-medium">{combo.name}</div>
                <div className="text-xs text-muted-foreground">{combo.owner.displayName}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Slot {index + 1}</div>
              </button>
            ))}
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="grid gap-5 lg:grid-cols-[220px,1fr]">
              <div className="overflow-hidden rounded-3xl border border-border bg-muted/40 p-4">
                {selectedCombo.bladeImageSrc ? (
                  <img
                    src={selectedCombo.bladeImageSrc}
                    alt={selectedCombo.bladeName}
                    className="h-[190px] w-full object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-[190px] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
                    No blade image
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-lg font-semibold">{selectedCombo.bladeName}</div>
                  <div className="text-sm text-muted-foreground">{selectedCombo.bladeSource}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-semibold">{selectedCombo.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{selectedCombo.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {selectedCombo.owner.displayName} @{selectedCombo.owner.username}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
                  {[
                    ["ATK", selectedCombo.attack],
                    ["DEF", selectedCombo.defense],
                    ["STA", selectedCombo.stamina],
                    ["XTR", selectedCombo.xtreme],
                    ["BUR", selectedCombo.burst]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-muted px-3 py-2">
                      <div className="text-muted-foreground">{label}</div>
                      <div className="text-base font-semibold text-foreground">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    <div className="text-muted-foreground">Selected combo page slot</div>
                    <div className="mt-1 font-semibold text-foreground">{combos.findIndex((combo) => combo.id === selectedCombo.id) + 1} / {combos.length}</div>
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    <div className="text-muted-foreground">Blade line</div>
                    <div className="mt-1 font-semibold text-foreground">{selectedCombo.bladeLine}</div>
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    <div className="text-muted-foreground">Spin type</div>
                    <div className="mt-1 font-semibold text-foreground">{selectedCombo.bladeSpinType}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-muted-foreground">Weight</div>
                      <div className="mt-1 text-lg font-semibold text-foreground">{selectedCombo.weight.toFixed(1)}g</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Blade {selectedCombo.weightDetails.blade?.toFixed(1) ?? "?"}g</div>
                      <div>Ratchet {selectedCombo.weightDetails.ratchet?.toFixed(1) ?? "?"}g</div>
                      <div>Bit {selectedCombo.weightDetails.bit?.toFixed(1) ?? "?"}g</div>
                    </div>
                  </div>
                  {selectedCombo.weightWarnings?.length ? (
                    <div className="mt-3 space-y-2">
                      {selectedCombo.weightWarnings.map((warning) => (
                        <div
                          key={warning}
                          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"
                        >
                          Warning: {warning}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PerformanceChart timeline={performance.timeline} />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Combined" entry={performance.combined} />
        <SummaryCard title="Tournament" entry={performance.tournament} />
        <SummaryCard title="Training" entry={performance.training} />
      </section>

      <WorstMatchupCard matchup={performance.worstMatchup} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Finish Breakdown</CardTitle>
            <CardDescription>Finish-type usage from this combo’s tournament history.</CardDescription>
          </CardHeader>
          <CardContent>
            <FinishBreakdown entry={performance.tournament} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Finish Breakdown</CardTitle>
            <CardDescription>Finish-type usage from this combo’s training history.</CardDescription>
          </CardHeader>
          <CardContent>
            <FinishBreakdown entry={performance.training} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Match History</CardTitle>
          <CardDescription>Latest tournament and training results for the selected combo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {performance.recentHistory.length ? (
            performance.recentHistory.map((entry) => (
              <div key={`${entry.mode}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{entry.mode === "TOURNAMENT" ? "Tournament" : "Training"} vs {entry.label}</div>
                  <div className="text-muted-foreground">
                    {finishTypeLabels[entry.finishType]} • <LocalDateTime value={entry.playedAt} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{entry.result}</div>
                  <div className="text-muted-foreground">{formatPoints(entry.points)} pts</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              No match history for this combo yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
