import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { formatDate, formatPercent, isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildTournamentComboRecords(matches) {
  const records = new Map();

  for (const match of matches) {
    const comboId = match.yourCombo.id;

    if (!records.has(comboId)) {
      records.set(comboId, { combo: match.yourCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }

    if (match.winner === "YOUR") {
      records.get(comboId).wins += 1;
    } else if (match.winner === "OPPONENT") {
      records.get(comboId).losses += 1;
    } else {
      records.get(comboId).draws += 1;
    }

    records.get(comboId).points += match.pointsDelta;
  }

  return [...records.values()]
    .map((entry) => ({
      ...entry,
      total: entry.wins + entry.losses + entry.draws,
      winRate: entry.wins + entry.losses === 0 ? 0 : entry.wins / (entry.wins + entry.losses)
    }))
    .sort((a, b) => b.wins - a.wins || b.points - a.points || b.winRate - a.winRate);
}

function buildTrainingComboRecords(trainingMatches) {
  const records = new Map();

  for (const match of trainingMatches) {
    const yourComboId = match.yourCombo.id;
    const opponentComboId = match.opponentCombo.id;

    if (!records.has(yourComboId)) {
      records.set(yourComboId, { combo: match.yourCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }
    if (!records.has(opponentComboId)) {
      records.set(opponentComboId, { combo: match.opponentCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }

    if (match.winner === "YOUR") {
      records.get(yourComboId).wins += 1;
      records.get(opponentComboId).losses += 1;
    } else if (match.winner === "OPPONENT") {
      records.get(yourComboId).losses += 1;
      records.get(opponentComboId).wins += 1;
    } else {
      records.get(yourComboId).draws += 1;
      records.get(opponentComboId).draws += 1;
    }

    records.get(yourComboId).points += match.pointsDelta;
    records.get(opponentComboId).points -= match.pointsDelta;
  }

  return [...records.values()]
    .map((entry) => ({
      ...entry,
      total: entry.wins + entry.losses + entry.draws,
      winRate: entry.wins + entry.losses === 0 ? 0 : entry.wins / (entry.wins + entry.losses)
    }))
    .sort((a, b) => b.wins - a.wins || b.points - a.points || b.winRate - a.winRate);
}

function withRanking(records) {
  return records.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

async function getUserOverview(session) {
  if (session.role === "ADMIN") {
    const [users, combos, decks, trainingSessions, tournaments, matches, trainingMatches] = await Promise.all([
      prisma.user.count(),
      prisma.combo.count(),
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
    prisma.combo.count({ where: { ownerId: session.sub } }),
    prisma.deck.count({ where: { ownerId: session.sub } }),
    prisma.trainingSession.count(),
    prisma.tournament.count(),
    prisma.match.count(),
    prisma.combo.findMany({
      where: { ownerId: session.sub },
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

  const teamTournamentRanks = withRanking(buildTournamentComboRecords(matches));
  const teamTrainingRanks = withRanking(buildTrainingComboRecords(trainingMatches));
  const userTournamentRanks = teamTournamentRanks.filter((entry) => entry.combo.ownerId === session.sub);
  const userTrainingRanks = teamTrainingRanks.filter((entry) => entry.combo.ownerId === session.sub);

  return {
    comboCount,
    deckCount,
    trainingCount,
    tournamentCount,
    matchCount,
    latestCombos,
    userTournamentRanks,
    teamTournamentRanks: teamTournamentRanks.slice(0, 8),
    userTrainingRanks,
    teamTrainingRanks: teamTrainingRanks.slice(0, 8)
  };
}

export default async function DashboardPage() {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const data = await getUserOverview(session);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-xl shadow-slate-200/60 backdrop-blur">
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

          <Card>
            <CardHeader>
              <CardTitle>Latest users</CardTitle>
              <CardDescription>Newly created players and admin shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.latestUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</div>
                </div>
              ))}
              <div className="flex flex-wrap gap-4 text-sm font-medium text-emerald-700">
                <Link href="/dashboard/admin">Open admin console</Link>
                <Link href="/dashboard/training">Open training</Link>
                <Link href="/dashboard/tournaments">Open tournaments</Link>
              </div>
            </CardContent>
          </Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent combos</CardTitle>
              <CardDescription>Your latest saved builds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.latestCombos.length ? (
                data.latestCombos.map((combo) => (
                  <div key={combo.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                    <div>
                      <div className="font-medium">{combo.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {comboLabel(combo)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDate(combo.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                  No combos saved yet. Start in the combo builder.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Tournament Combo Ranking</CardTitle>
                <CardDescription>Your combos ranked within the overall tournament ladder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.userTournamentRanks.length ? (
                  data.userTournamentRanks.slice(0, 5).map((entry) => (
                    <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
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
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    No tournament ranking yet for your combos.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Tournament Ranking</CardTitle>
                <CardDescription>Top combo ladder across the whole team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.teamTournamentRanks.length ? (
                  data.teamTournamentRanks.slice(0, 5).map((entry) => (
                    <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
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
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    No tournament ranking data yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Training Combo Ranking</CardTitle>
                <CardDescription>Your combos ranked within the overall training ladder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.userTrainingRanks.length ? (
                  data.userTrainingRanks.slice(0, 5).map((entry) => (
                    <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
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
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    No training ranking yet for your combos.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Training Ranking</CardTitle>
                <CardDescription>Top internal testing combo ladder across the whole team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.teamTrainingRanks.length ? (
                  data.teamTrainingRanks.slice(0, 5).map((entry) => (
                    <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
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
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                    No training ranking data yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
