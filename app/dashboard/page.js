import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { buildRankings, buildTournamentComboRecords, buildTrainingComboRecords } from "@/lib/performance";
import { formatPercent, isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildTrainingRankings(trainingMatches) {
  return buildRankings(buildTrainingComboRecords(trainingMatches));
}

function buildTournamentRankings(matches) {
  return buildRankings(buildTournamentComboRecords(matches));
}

async function getUserOverview(session) {
  if (session.role === "ADMIN") {
    const [users, combos, decks, trainingSessions, tournaments, matches, trainingMatches] = await Promise.all([
      prisma.user.count(),
      prisma.combo.count({ where: { archivedAt: null } }),
      prisma.deck.count(),
      prisma.trainingSession.count(),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.trainingMatch.count()
    ]);

    const latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6
    });

    return { users, combos, decks, trainingSessions, tournaments, matches, trainingMatches, latestUsers };
  }

  const [comboCount, deckCount, trainingCount, tournamentCount, matchCount, latestCombos, matches, trainingMatches] =
    await Promise.all([
    prisma.combo.count({ where: { ownerId: session.sub, archivedAt: null } }),
    prisma.deck.count({ where: { ownerId: session.sub } }),
    prisma.trainingSession.count(),
    prisma.tournament.count(),
    prisma.match.count(),
    prisma.combo.findMany({
      where: { ownerId: session.sub, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.match.findMany({
      include: {
        yourCombo: true
      }
    }),
    prisma.trainingMatch.findMany({
      include: {
        yourCombo: true,
        opponentCombo: true
      }
    })
  ]);

  const teamTournamentRankings = buildTournamentRankings(matches);
  const teamTrainingRankings = buildTrainingRankings(trainingMatches);
  const userTournamentRanks = {
    overall: teamTournamentRankings.overall.filter((entry) => entry.combo.ownerId === session.sub),
    winRate: teamTournamentRankings.winRate.filter((entry) => entry.combo.ownerId === session.sub),
    points: teamTournamentRankings.points.filter((entry) => entry.combo.ownerId === session.sub)
  };
  const userTrainingRanks = {
    overall: teamTrainingRankings.overall.filter((entry) => entry.combo.ownerId === session.sub),
    winRate: teamTrainingRankings.winRate.filter((entry) => entry.combo.ownerId === session.sub),
    points: teamTrainingRankings.points.filter((entry) => entry.combo.ownerId === session.sub)
  };

  return {
    comboCount,
    deckCount,
    trainingCount,
    tournamentCount,
    matchCount,
    latestCombos,
    userTournamentRanks,
    teamTournamentRanks: {
      overall: teamTournamentRankings.overall.slice(0, 8),
      winRate: teamTournamentRankings.winRate.slice(0, 8),
      points: teamTournamentRankings.points.slice(0, 8)
    },
    userTrainingRanks,
    teamTrainingRanks: {
      overall: teamTrainingRankings.overall.slice(0, 8),
      winRate: teamTrainingRankings.winRate.slice(0, 8),
      points: teamTrainingRankings.points.slice(0, 8)
    }
  };
}

function metricValue(entry, metric) {
  if (metric === "overall") {
    return `${entry.overallScore} score`;
  }

  if (metric === "winRate") {
    return formatPercent(entry.winRate);
  }

  return `${entry.points > 0 ? `+${entry.points}` : entry.points} pts`;
}

function RankingList({ entries, emptyText, metric }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return entries.slice(0, 5).map((entry) => (
    <div key={`${metric}-${entry.combo.id}`} className="rounded-2xl border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">
            #{entry.rank} {entry.combo.name}
          </div>
          <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{entry.wins}-{entry.losses}-{entry.draws}</div>
          <div>{formatPercent(entry.winRate)} win rate</div>
          <div>{entry.points > 0 ? `+${entry.points}` : entry.points} pts</div>
          <div>{metricValue(entry, metric)}</div>
        </div>
      </div>
    </div>
  ));
}

export default async function DashboardPage() {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const data = await getUserOverview(session);

  return (
    <div className="space-y-6">
      <section className="solid-surface rounded-[2rem] border p-8 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/40">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{session.role}</Badge>
          <h1 className="text-3xl font-semibold">Welcome, {session.displayName}</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {session.role === "ADMIN"
            ? "Manage player accounts, review usage across the whole app, and jump directly into training or tournament logging."
            : "Build combos, form legal decks, and log tournament matchups for your Beyblade X testing."}
        </p>
      </section>

      {session.role === "ADMIN" ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Users", data.users],
              ["Combos", data.combos],
              ["Decks", data.decks],
              ["Training", data.trainingSessions],
              ["Tournaments", data.tournaments],
              ["Tournament matches", data.matches],
              ["Training matches", data.trainingMatches]
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-3xl">{value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <CollapsibleSection
            title="Latest users"
            description="Newly created players and admin shortcuts."
            defaultOpen={false}
            contentClassName="space-y-3"
          >
              {data.latestUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                  </div>
                  <LocalDateTime value={user.createdAt} className="text-sm text-muted-foreground" />
                </div>
              ))}
              <div className="flex flex-wrap gap-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <Link href="/dashboard/admin">Open admin console</Link>
                <Link href="/dashboard/training">Open training</Link>
                <Link href="/dashboard/tournaments">Open tournaments</Link>
                <Link href="/dashboard/performance">Open performance</Link>
              </div>
          </CollapsibleSection>
        </>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Saved combos", data.comboCount],
              ["Decks", data.deckCount],
              ["Training", data.trainingCount],
              ["Tournaments", data.tournamentCount],
              ["Logged matches", data.matchCount]
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-3xl">{value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <CollapsibleSection
            title="Recent combos"
            description="Your latest saved builds."
            defaultOpen={false}
            contentClassName="space-y-3"
          >
              {data.latestCombos.length ? (
                data.latestCombos.map((combo) => (
                  <div key={combo.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                    <div>
                      <div className="font-medium">{combo.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {comboLabel(combo)}
                      </div>
                    </div>
                    <LocalDateTime value={combo.createdAt} className="text-sm text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                  No combos saved yet. Start in the combo builder.
                </div>
              )}
          </CollapsibleSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Tournament Combo Rankings</CardTitle>
                <CardDescription>Your combos ranked by overall score, win rate, and points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Overall</div>
                  <RankingList entries={data.userTournamentRanks.overall} emptyText="No tournament ranking yet for your combos." metric="overall" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Win Rate</div>
                  <RankingList entries={data.userTournamentRanks.winRate} emptyText="No win-rate tournament ranking yet for your combos." metric="winRate" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Points</div>
                  <RankingList entries={data.userTournamentRanks.points} emptyText="No points-based tournament ranking yet for your combos." metric="points" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Tournament Rankings</CardTitle>
                <CardDescription>Team ladder split by overall score, win rate, and points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Overall</div>
                  <RankingList entries={data.teamTournamentRanks.overall} emptyText="No tournament ranking data yet." metric="overall" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Win Rate</div>
                  <RankingList entries={data.teamTournamentRanks.winRate} emptyText="No win-rate tournament ranking data yet." metric="winRate" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Points</div>
                  <RankingList entries={data.teamTournamentRanks.points} emptyText="No points-based tournament ranking data yet." metric="points" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Training Combo Rankings</CardTitle>
                <CardDescription>Your combos ranked by overall score, win rate, and points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Overall</div>
                  <RankingList entries={data.userTrainingRanks.overall} emptyText="No training ranking yet for your combos." metric="overall" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Win Rate</div>
                  <RankingList entries={data.userTrainingRanks.winRate} emptyText="No win-rate training ranking yet for your combos." metric="winRate" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Points</div>
                  <RankingList entries={data.userTrainingRanks.points} emptyText="No points-based training ranking yet for your combos." metric="points" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Training Rankings</CardTitle>
                <CardDescription>Team ladder split by overall score, win rate, and points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Overall</div>
                  <RankingList entries={data.teamTrainingRanks.overall} emptyText="No training ranking data yet." metric="overall" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Win Rate</div>
                  <RankingList entries={data.teamTrainingRanks.winRate} emptyText="No win-rate training ranking data yet." metric="winRate" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold">By Points</div>
                  <RankingList entries={data.teamTrainingRanks.points} emptyText="No points-based training ranking data yet." metric="points" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
