import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { buildComboPerformance } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPercent, isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" opacity="0.15" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" opacity="0.15" />
          <polyline fill="none" stroke="#22c55e" strokeWidth="4" points={buildPolyline(combinedPoints, width, height, padding)} />
          <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points={buildPolyline(tournamentPoints, width, height, padding)} />
          <polyline fill="none" stroke="#06b6d4" strokeWidth="3" points={buildPolyline(trainingPoints, width, height, padding)} />
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>{timeline.length} logged results in timeline</div>
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Combined</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Tournament</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Training</span>
        </div>
        <div>{formatDate(timeline[0].playedAt)} to {formatDate(timeline[timeline.length - 1].playedAt)}</div>
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

export default async function ComboPerformancePage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  const combos = await prisma.combo.findMany({
    where: session.role === "ADMIN" ? {} : { ownerId: session.sub },
    include: {
      owner: {
        select: {
          displayName: true,
          username: true
        }
      }
    },
    orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }]
  });

  const selectedCombo =
    combos.find((combo) => combo.id === params?.comboId) ||
    combos[0] ||
    null;

  if (!selectedCombo) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Combo Performance</CardTitle>
            <CardDescription>Create at least one combo to unlock performance tracking.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [tournamentMatches, trainingMatches] = await Promise.all([
    prisma.match.findMany({
      where: { yourComboId: selectedCombo.id },
      include: { yourCombo: true },
      orderBy: { playedAt: "asc" }
    }),
    prisma.trainingMatch.findMany({
      where: {
        OR: [{ yourComboId: selectedCombo.id }, { opponentComboId: selectedCombo.id }]
      },
      include: {
        yourCombo: true,
        opponentCombo: true
      },
      orderBy: { playedAt: "asc" }
    })
  ]);

  const performance = buildComboPerformance({
    comboId: selectedCombo.id,
    tournamentMatches,
    trainingMatches
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Combo Performance</CardTitle>
          <CardDescription>
            Historical trend lines and performance stats for each saved combo across training and tournaments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {combos.map((combo) => (
              <Link
                key={combo.id}
                href={`/dashboard/performance?comboId=${combo.id}`}
                className={`rounded-2xl border px-4 py-2 text-sm ${
                  combo.id === selectedCombo.id ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-border hover:bg-muted"
                }`}
              >
                <div className="font-medium">{combo.name}</div>
                <div className="text-xs text-muted-foreground">{combo.owner.displayName}</div>
              </Link>
            ))}
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{selectedCombo.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{comboLabel(selectedCombo)}</div>
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
                  <div className="text-muted-foreground">{finishTypeLabels[entry.finishType]} • {formatDate(entry.playedAt)}</div>
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
