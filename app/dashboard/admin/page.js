import { createUserAction } from "@/app/actions/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { comboLabel, getPartById } from "@/lib/beyblade-data";
import { buildRankings, buildTournamentComboRecords, buildTrainingComboRecords } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { formatPercent, isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const finishTypeLabels = {
  XTREME: "Xtreme Finish",
  BURST: "Burst Finish",
  OVER: "Over Finish",
  SPIN: "Spin Finish"
};

function opponentComboLabel(match) {
  const blade = getPartById(match.opponentBladeId);
  const ratchet = getPartById(match.opponentRatchetId);
  const bit = getPartById(match.opponentBitId);
  return `${blade?.altname || blade?.name || "?"} ${ratchet?.altname || ratchet?.name || "?"} ${bit?.altname || bit?.name || "?"}`;
}

function buildTournamentRankings(matches) {
  const rankings = buildRankings(buildTournamentComboRecords(matches));
  return {
    overall: rankings.overall.slice(0, 8),
    winRate: rankings.winRate.slice(0, 8),
    points: rankings.points.slice(0, 8)
  };
}

function buildTrainingRankings(trainingMatches) {
  const rankings = buildRankings(buildTrainingComboRecords(trainingMatches));
  return {
    overall: rankings.overall.slice(0, 8),
    winRate: rankings.winRate.slice(0, 8),
    points: rankings.points.slice(0, 8)
  };
}

export default async function AdminPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  await requireAdmin();
  const params = await searchParams;

  const [users, counts, matches, trainingMatches, combos, decks, tournaments, trainingSessions] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            combos: true,
            decks: true,
            tournaments: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    Promise.all([
      prisma.user.count(),
      prisma.combo.count(),
      prisma.deck.count(),
      prisma.trainingSession.count(),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.trainingMatch.count()
    ]),
    prisma.match.findMany({
      include: {
        yourCombo: true
      }
    }),
    prisma.trainingMatch.findMany({
      include: {
        yourCombo: true,
        opponentCombo: true,
        trainingSession: {
          include: {
            owner: {
              select: {
                username: true,
                displayName: true
              }
            }
          }
        }
      }
    }),
    prisma.combo.findMany({
      include: {
        owner: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.deck.findMany({
      include: {
        owner: {
          select: {
            username: true,
            displayName: true
          }
        },
        slots: {
          orderBy: { slot: "asc" },
          include: {
            combo: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.tournament.findMany({
      include: {
        owner: {
          select: {
            username: true,
            displayName: true
          }
        },
        matches: {
          include: {
            yourCombo: true
          },
          orderBy: { playedAt: "desc" }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.trainingSession.findMany({
      include: {
        owner: {
          select: {
            username: true,
            displayName: true
          }
        },
        matches: {
          include: {
            yourCombo: true,
            opponentCombo: true
          },
          orderBy: { playedAt: "desc" }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    })
  ]);

  const [userCount, comboCount, deckCount, trainingSessionCount, tournamentCount, matchCount, trainingMatchCount] = counts;
  const topTournamentCombos = buildTournamentRankings(matches);
  const topTrainingCombos = buildTrainingRankings(trainingMatches);

  return (
    <div className="space-y-6">
      {params?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </div>
      ) : null}
      {params?.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.success}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Users", userCount],
          ["Combos", comboCount],
          ["Decks", deckCount],
          ["Training", trainingSessionCount],
          ["Tournaments", tournamentCount],
          ["Tournament matches", matchCount],
          ["Training matches", trainingMatchCount]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3 2xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Create user</CardTitle>
            <CardDescription>Players cannot self-register. Only the admin can create accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createUserAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" placeholder="Nugroho" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="nugroho" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <SubmitButton pendingLabel="Creating user...">Create user</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top tournament combos by overall</CardTitle>
            <CardDescription>Overall score is total points plus total logged matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTournamentCombos.overall.length ? (
              topTournamentCombos.overall.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{entry.overallScore} score</div>
                      <div className="text-muted-foreground">{entry.points} points</div>
                      <div className="text-muted-foreground">{entry.total} matches</div>
                      <div className="text-muted-foreground">{formatPercent(entry.winRate)} win rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No match history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top tournament combos by win rate</CardTitle>
            <CardDescription>Higher win rate ranks first, then match count and points.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTournamentCombos.winRate.length ? (
              topTournamentCombos.winRate.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{formatPercent(entry.winRate)}</div>
                      <div className="text-muted-foreground">{entry.wins}-{entry.losses}-{entry.draws}</div>
                      <div className="text-muted-foreground">{entry.points} points</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No tournament history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top tournament combos by points</CardTitle>
            <CardDescription>Higher net tournament points rank first, then wins and win rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTournamentCombos.points.length ? (
              topTournamentCombos.points.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{entry.points} points</div>
                      <div className="text-muted-foreground">{entry.wins}-{entry.losses}-{entry.draws}</div>
                      <div className="text-muted-foreground">{formatPercent(entry.winRate)} win rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No tournament history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top training combos by overall</CardTitle>
            <CardDescription>Overall score is total points plus total logged matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTrainingCombos.overall.length ? (
              topTrainingCombos.overall.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{entry.overallScore} score</div>
                      <div className="text-muted-foreground">{entry.points} points</div>
                      <div className="text-muted-foreground">{entry.total} matches</div>
                      <div className="text-muted-foreground">{formatPercent(entry.winRate)} win rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No training history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top training combos by win rate</CardTitle>
            <CardDescription>Higher win rate ranks first, then match count and points.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTrainingCombos.winRate.length ? (
              topTrainingCombos.winRate.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{formatPercent(entry.winRate)}</div>
                      <div className="text-muted-foreground">{entry.wins}-{entry.losses}-{entry.draws}</div>
                      <div className="text-muted-foreground">{entry.points} points</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No training history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top training combos by points</CardTitle>
            <CardDescription>Higher net training points rank first, then wins and win rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTrainingCombos.points.length ? (
              topTrainingCombos.points.map((entry) => (
                <div key={entry.combo.id} className="rounded-2xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">#{entry.rank} {entry.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(entry.combo)}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{entry.points} points</div>
                      <div className="text-muted-foreground">{entry.wins}-{entry.losses}-{entry.draws}</div>
                      <div className="text-muted-foreground">{formatPercent(entry.winRate)} win rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No training history yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>Usage stats across every created account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length ? (
            users.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-[1.4fr,1fr]">
                <div>
                  <div className="font-semibold">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-muted p-2">
                    <div className="text-muted-foreground">Combos</div>
                    <div className="text-sm font-semibold">{user._count.combos}</div>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <div className="text-muted-foreground">Decks</div>
                    <div className="text-sm font-semibold">{user._count.decks}</div>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <div className="text-muted-foreground">Tournaments</div>
                    <div className="text-sm font-semibold">{user._count.tournaments}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No users created yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All combos</CardTitle>
          <CardDescription>Read-only list of every combo created by all users.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {combos.length ? (
            combos.map((combo) => (
              <div key={combo.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{combo.name}</div>
                    <div className="text-sm text-muted-foreground">{comboLabel(combo)}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{combo.owner.displayName}</div>
                    <div>@{combo.owner.username}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="stat-tile stat-tile--rose">
                    <div className="stat-tile-label">ATK</div>
                    <div className="stat-tile-value">{combo.attack}</div>
                  </div>
                  <div className="stat-tile stat-tile--sky">
                    <div className="stat-tile-label">DEF</div>
                    <div className="stat-tile-value">{combo.defense}</div>
                  </div>
                  <div className="stat-tile stat-tile--emerald">
                    <div className="stat-tile-label">STA</div>
                    <div className="stat-tile-value">{combo.stamina}</div>
                  </div>
                  <div className="stat-tile stat-tile--amber">
                    <div className="stat-tile-label">XTR</div>
                    <div className="stat-tile-value">{combo.xtreme}</div>
                  </div>
                  <div className="stat-tile stat-tile--cyan">
                    <div className="stat-tile-label">BUR</div>
                    <div className="stat-tile-value">{combo.burst}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No combos created yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All decks</CardTitle>
          <CardDescription>Read-only list of every saved deck across all users.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {decks.length ? (
            decks.map((deck) => (
              <div key={deck.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{deck.name}</div>
                    <div className="text-sm text-muted-foreground">{deck.owner.displayName}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>@{deck.owner.username}</div>
                    <LocalDateTime value={deck.createdAt} />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {deck.slots.map((slot) => (
                    <div key={slot.id} className="rounded-xl bg-muted/60 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Slot {slot.slot}
                      </div>
                      <div className="font-medium">{slot.combo.name}</div>
                      <div className="text-sm text-muted-foreground">{comboLabel(slot.combo)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No decks created yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All tournaments and logs</CardTitle>
          <CardDescription>Read-only list of tournaments with every logged match.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournaments.length ? (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.owner.displayName} (@{tournament.owner.username})
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{tournament.matches.length} matches</div>
                    <LocalDateTime value={tournament.createdAt} />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {tournament.matches.length ? (
                    tournament.matches.map((match) => (
                      <div key={match.id} className="rounded-xl bg-muted/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            {match.yourCombo.name} vs {match.opponentComboName}
                          </div>
                          <LocalDateTime value={match.playedAt} className="text-xs text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {comboLabel(match.yourCombo)} vs {opponentComboLabel(match)}
                        </div>
                        <div className="mt-2 text-sm">
                          Result:{" "}
                          <span className="font-semibold">
                            {match.winner === "YOUR"
                              ? `${match.yourCombo.name} won`
                              : match.winner === "OPPONENT"
                                ? `${match.opponentComboName} won`
                                : "Draw"}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {finishTypeLabels[match.finishType]} | Point delta: {match.pointsDelta > 0 ? `+${match.pointsDelta}` : match.pointsDelta}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                      No matches logged yet.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No tournaments created yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All training sessions and logs</CardTitle>
          <CardDescription>Read-only list of training sessions with every internal practice match.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trainingSessions.length ? (
            trainingSessions.map((trainingSession) => (
              <div key={trainingSession.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{trainingSession.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {trainingSession.owner.displayName} (@{trainingSession.owner.username})
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{trainingSession.matches.length} matches</div>
                    <LocalDateTime value={trainingSession.createdAt} />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {trainingSession.matches.length ? (
                    trainingSession.matches.map((match) => (
                      <div key={match.id} className="rounded-xl bg-muted/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            {match.yourCombo.name} vs {match.opponentCombo.name}
                          </div>
                          <LocalDateTime value={match.playedAt} className="text-xs text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {comboLabel(match.yourCombo)} vs {comboLabel(match.opponentCombo)}
                        </div>
                        <div className="mt-2 text-sm">
                          Result:{" "}
                          <span className="font-semibold">
                            {match.winner === "YOUR"
                              ? `${match.yourCombo.name} won`
                              : match.winner === "OPPONENT"
                                ? `${match.opponentCombo.name} won`
                                : "Draw"}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {finishTypeLabels[match.finishType]} | Point delta: {match.pointsDelta > 0 ? `+${match.pointsDelta}` : match.pointsDelta}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                      No training matches logged yet.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No training sessions created yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
