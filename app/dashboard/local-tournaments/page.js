import {
  createLocalTournamentAction,
  deleteLocalTournamentAction,
  generateNextEliminationRoundAction,
  generateNextSwissRoundAction,
  generateQualifierAction,
  reportLocalMatchAction,
  startTopCutAction
} from "@/app/actions/local-tournaments";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { buildQualifierRanking, localStageLabel } from "@/lib/local-tournament";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function stageOrder(stage) {
  if (stage === "QUALIFIER") return 0;
  if (stage === "UPPER") return 1;
  if (stage === "LOWER") return 2;
  return 3;
}

export default async function LocalTournamentPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  const [users, tournaments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        username: true
      }
    }),
    prisma.localTournament.findMany({
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true
              }
            }
          },
          orderBy: { seed: "asc" }
        },
        matches: {
          include: {
            playerA: {
              include: {
                user: {
                  select: {
                    displayName: true,
                    username: true
                  }
                }
              }
            },
            playerB: {
              include: {
                user: {
                  select: {
                    displayName: true,
                    username: true
                  }
                }
              }
            },
            winner: {
              include: {
                user: {
                  select: {
                    displayName: true,
                    username: true
                  }
                }
              }
            }
          },
          orderBy: [{ stage: "asc" }, { roundNumber: "asc" }, { tableNumber: "asc" }]
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

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

      <CollapsibleSection
        title="Create local tournament"
        description="Round robin or Swiss qualifier, then top cut into upper/lower elimination."
      >
        <form action={createLocalTournamentAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament name</Label>
            <Input id="name" name="name" placeholder="N86601 March Internal Cup" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualifierFormat">Qualifier format</Label>
            <Select id="qualifierFormat" name="qualifierFormat" defaultValue="ROUND_ROBIN" required>
              <option value="ROUND_ROBIN">Round robin</option>
              <option value="SWISS">Swiss</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="swissRounds">Swiss rounds (only for Swiss)</Label>
            <Input id="swissRounds" name="swissRounds" type="number" min={1} max={20} placeholder="Auto if empty" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topCutSize">Top cut size</Label>
            <Input id="topCutSize" name="topCutSize" type="number" min={2} max={128} defaultValue={8} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Participants</Label>
            <div className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <input type="checkbox" name="participantIds" value={user.id} defaultChecked />
                  <span>
                    {user.displayName} <span className="text-muted-foreground">(@{user.username})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Creating...">Create local tournament</SubmitButton>
          </div>
        </form>
      </CollapsibleSection>

      <CollapsibleSection
        title="Local tournaments"
        description="Manage qualifier rounds, ranking, and elimination bracket."
        defaultOpen={false}
        contentClassName="space-y-4"
      >
        {tournaments.length ? (
          tournaments.map((tournament) => {
            const qualifierMatches = tournament.matches.filter((match) => match.stage === "QUALIFIER");
            const eliminationMatches = tournament.matches.filter((match) => match.stage !== "QUALIFIER");
            const ranking = buildQualifierRanking(tournament.participants, qualifierMatches);
            const groupedMatches = tournament.matches.reduce((acc, match) => {
              const key = `${match.stage}-${match.roundNumber}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(match);
              return acc;
            }, {});
            const sortedGroups = Object.keys(groupedMatches).sort((a, b) => {
              const [stageA, roundA] = a.split("-");
              const [stageB, roundB] = b.split("-");
              if (stageOrder(stageA) !== stageOrder(stageB)) {
                return stageOrder(stageA) - stageOrder(stageB);
              }
              return Number(roundA) - Number(roundB);
            });

            return (
              <details key={tournament.id} className="rounded-2xl border border-border p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{tournament.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {tournament.qualifierFormat === "ROUND_ROBIN" ? "Round robin" : `Swiss (${tournament.swissRounds || 0} rounds)`} | Top cut {tournament.topCutSize} | {tournament.status}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Owner: {tournament.owner.displayName} (@{tournament.owner.username}) • {tournament.participants.length} participants
                      </div>
                    </div>
                    <LocalDateTime value={tournament.createdAt} className="text-xs text-muted-foreground" />
                  </div>
                </summary>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={generateQualifierAction}>
                    <input type="hidden" name="localTournamentId" value={tournament.id} />
                    <SubmitButton pendingLabel="Generating...">Generate qualifier</SubmitButton>
                  </form>
                  {tournament.qualifierFormat === "SWISS" ? (
                    <form action={generateNextSwissRoundAction}>
                      <input type="hidden" name="localTournamentId" value={tournament.id} />
                      <SubmitButton pendingLabel="Generating...">Next Swiss round</SubmitButton>
                    </form>
                  ) : null}
                  <form action={startTopCutAction}>
                    <input type="hidden" name="localTournamentId" value={tournament.id} />
                    <SubmitButton pendingLabel="Seeding...">Start top cut</SubmitButton>
                  </form>
                  <form action={generateNextEliminationRoundAction}>
                    <input type="hidden" name="localTournamentId" value={tournament.id} />
                    <SubmitButton pendingLabel="Generating...">Next elimination round</SubmitButton>
                  </form>
                  {session.role === "ADMIN" || session.sub === tournament.ownerId ? (
                    <form action={deleteLocalTournamentAction}>
                      <button
                        type="submit"
                        name="localTournamentId"
                        value={tournament.id}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="mb-3 text-sm font-semibold">Participant ranking</div>
                    <div className="space-y-2">
                      {ranking.map((entry) => (
                        <div key={entry.participant.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                          <div>
                            #{entry.rank} {entry.participant.user.displayName}
                            <span className="text-muted-foreground"> (@{entry.participant.user.username})</span>
                          </div>
                          <div className="text-muted-foreground">
                            {entry.matchPoints} pts • {entry.wins}-{entry.losses}-{entry.draws}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-4">
                    <div className="mb-3 text-sm font-semibold">Stage summary</div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Qualifier matches: {qualifierMatches.length}</div>
                      <div>Elimination matches: {eliminationMatches.length}</div>
                      <div>
                        Pending matches: {tournament.matches.filter((match) => match.status === "PENDING").length}
                      </div>
                      <div>
                        Qualified participants: {tournament.participants.filter((participant) => participant.qualified).length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {sortedGroups.length ? (
                    sortedGroups.map((groupKey) => {
                      const [stage, roundValue] = groupKey.split("-");
                      const roundNumber = Number(roundValue);
                      const matches = groupedMatches[groupKey];
                      return (
                        <details key={groupKey} className="rounded-xl border border-border bg-muted/20 p-3">
                          <summary className="cursor-pointer text-sm font-medium">
                            {localStageLabel(stage)} - Round {roundNumber} ({matches.length} matches)
                          </summary>
                          <div className="mt-3 space-y-2">
                            {matches.map((match) => {
                              const nameA = match.playerA?.user.displayName || "BYE";
                              const nameB = match.playerB?.user.displayName || "BYE";
                              const canReport = match.status === "PENDING" && match.playerAId && match.playerBId;
                              return (
                                <div key={match.id} className="rounded-xl border border-border bg-white/70 p-3 dark:bg-slate-900/40">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <div className="font-medium">
                                      Table {match.tableNumber}: {nameA} vs {nameB}
                                    </div>
                                    <div className="text-muted-foreground">{match.status}</div>
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {match.status === "COMPLETED"
                                      ? `Result: ${
                                          match.result === "A_WIN"
                                            ? `${nameA} won`
                                            : match.result === "B_WIN"
                                              ? `${nameB} won`
                                              : "Draw"
                                        } (${match.scoreA}-${match.scoreB})`
                                      : "Awaiting result"}
                                  </div>
                                  {canReport ? (
                                    <form action={reportLocalMatchAction} className="mt-3 grid gap-2 md:grid-cols-4">
                                      <input type="hidden" name="localMatchId" value={match.id} />
                                      <Select name="result" defaultValue="A_WIN" required>
                                        <option value="A_WIN">Player A won</option>
                                        <option value="B_WIN">Player B won</option>
                                        {stage === "QUALIFIER" ? <option value="DRAW">Draw</option> : null}
                                      </Select>
                                      <Input name="scoreA" type="number" min={0} max={99} defaultValue={0} />
                                      <Input name="scoreB" type="number" min={0} max={99} defaultValue={0} />
                                      <SubmitButton pendingLabel="Saving...">Save result</SubmitButton>
                                    </form>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No matches generated yet.
                    </div>
                  )}
                </div>
              </details>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No local tournaments yet.
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

