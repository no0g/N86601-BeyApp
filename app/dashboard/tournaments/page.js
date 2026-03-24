import {
  createMatchAction,
  createTournamentAction,
  deleteMatchAction,
  deleteTournamentAction,
  updateMatchAction,
  updateTournamentAction
} from "@/app/actions/tournaments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { beybladeData, comboLabel, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

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

function comboOptionLabel(combo) {
  return `${combo.name} - ${combo.owner.displayName}`;
}

export default async function TournamentsPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  await requireSession();
  const params = await searchParams;

  const [combos, tournaments] = await Promise.all([
    prisma.combo.findMany({
      include: {
        owner: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }]
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
            yourCombo: {
              include: {
                owner: {
                  select: {
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          },
          orderBy: { playedAt: "desc" }
        }
      },
      orderBy: [{ createdAt: "desc" }]
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create tournament</CardTitle>
            <CardDescription>Create an event that the whole team can view and update.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTournamentAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament name</Label>
                <Input id="name" name="name" placeholder="March Practice Cup" required />
              </div>
              <SubmitButton pendingLabel="Creating...">Create tournament</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log match</CardTitle>
            <CardDescription>Everyone can log or update shared tournament records using saved team combos.</CardDescription>
          </CardHeader>
          <CardContent>
            {combos.length === 0 || tournaments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Create at least one tournament and save at least one combo before logging matches.
              </div>
            ) : (
              <form action={createMatchAction} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tournamentId">Tournament</Label>
                  <Select id="tournamentId" name="tournamentId" required>
                    <option value="">Select tournament</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name} - {tournament.owner.displayName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yourComboId">Your combo</Label>
                  <Select id="yourComboId" name="yourComboId" required>
                    <option value="">Select combo</option>
                    {combos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {comboOptionLabel(combo)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground md:col-span-2">
                  Opponent combo name will be generated automatically from the selected blade, ratchet, and bit.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opponentBladeId">Opponent blade</Label>
                  <Select id="opponentBladeId" name="opponentBladeId" required>
                    <option value="">Select blade</option>
                    {beybladeData.blades.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.altname || part.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opponentRatchetId">Opponent ratchet</Label>
                  <Select id="opponentRatchetId" name="opponentRatchetId" required>
                    <option value="">Select ratchet</option>
                    {beybladeData.ratchets.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.altname || part.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opponentBitId">Opponent bit</Label>
                  <Select id="opponentBitId" name="opponentBitId" required>
                    <option value="">Select bit</option>
                    {beybladeData.bits.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.altname || part.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="winner">Result</Label>
                  <Select id="winner" name="winner" required>
                    <option value="YOUR">Your combo won</option>
                    <option value="OPPONENT">Opponent combo won</option>
                    <option value="DRAW">Draw</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finishType">Finish type</Label>
                  <Select id="finishType" name="finishType" required>
                    <option value="XTREME">Xtreme Finish (+/- 3)</option>
                    <option value="BURST">Burst Finish (+/- 2)</option>
                    <option value="OVER">Over Finish (+/- 2)</option>
                    <option value="SPIN">Spin Finish (+/- 1)</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <SubmitButton pendingLabel="Saving match...">Save match</SubmitButton>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All tournaments</CardTitle>
          <CardDescription>Shared team tournament history. Any user can update these records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournaments.length ? (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Owner: {tournament.owner.displayName} (@{tournament.owner.username}) | {tournament.matches.length} matches logged
                    </div>
                  </div>
                </div>
                <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm font-medium">Edit or delete tournament</summary>
                  <form action={updateTournamentAction} className="mt-4 flex flex-wrap gap-3">
                    <input type="hidden" name="tournamentId" value={tournament.id} />
                    <div className="min-w-[240px] flex-1 space-y-2">
                      <Label htmlFor={`tournament-name-${tournament.id}`}>Tournament name</Label>
                      <Input
                        id={`tournament-name-${tournament.id}`}
                        name="name"
                        defaultValue={tournament.name}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <SubmitButton pendingLabel="Updating tournament...">Save changes</SubmitButton>
                      <button
                        type="submit"
                        formAction={deleteTournamentAction}
                        name="tournamentId"
                        value={tournament.id}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                      >
                        Delete tournament
                      </button>
                    </div>
                  </form>
                </details>

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
                        <div className="mt-1 text-sm text-muted-foreground">
                          Team combo owner: {match.yourCombo.owner.displayName} (@{match.yourCombo.owner.username})
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
                          {finishTypeLabels[match.finishType]} | Point delta:{" "}
                          {match.pointsDelta > 0 ? `+${match.pointsDelta}` : match.pointsDelta}
                        </div>
                        <details className="mt-4 rounded-xl border border-border bg-white/60 p-3">
                          <summary className="cursor-pointer text-sm font-medium">Edit or delete log</summary>
                          <form action={updateMatchAction} className="mt-4 grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="matchId" value={match.id} />
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`tournament-${match.id}`}>Tournament</Label>
                              <Select id={`tournament-${match.id}`} name="tournamentId" defaultValue={tournament.id} required>
                                {tournaments.map((tournamentItem) => (
                                  <option key={tournamentItem.id} value={tournamentItem.id}>
                                    {tournamentItem.name} - {tournamentItem.owner.displayName}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`your-combo-${match.id}`}>Your combo</Label>
                              <Select id={`your-combo-${match.id}`} name="yourComboId" defaultValue={match.yourComboId} required>
                                {combos.map((combo) => (
                                  <option key={combo.id} value={combo.id}>
                                    {comboOptionLabel(combo)}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground md:col-span-2">
                              Opponent combo name will be generated automatically from the selected blade, ratchet, and bit.
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`opponent-blade-${match.id}`}>Opponent blade</Label>
                              <Select id={`opponent-blade-${match.id}`} name="opponentBladeId" defaultValue={match.opponentBladeId} required>
                                {beybladeData.blades.map((part) => (
                                  <option key={part.id} value={part.id}>
                                    {part.altname || part.name}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`opponent-ratchet-${match.id}`}>Opponent ratchet</Label>
                              <Select
                                id={`opponent-ratchet-${match.id}`}
                                name="opponentRatchetId"
                                defaultValue={match.opponentRatchetId}
                                required
                              >
                                {beybladeData.ratchets.map((part) => (
                                  <option key={part.id} value={part.id}>
                                    {part.altname || part.name}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`opponent-bit-${match.id}`}>Opponent bit</Label>
                              <Select id={`opponent-bit-${match.id}`} name="opponentBitId" defaultValue={match.opponentBitId} required>
                                {beybladeData.bits.map((part) => (
                                  <option key={part.id} value={part.id}>
                                    {part.altname || part.name}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`winner-${match.id}`}>Result</Label>
                              <Select id={`winner-${match.id}`} name="winner" defaultValue={match.winner} required>
                                <option value="YOUR">Your combo won</option>
                                <option value="OPPONENT">Opponent combo won</option>
                                <option value="DRAW">Draw</option>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`finish-${match.id}`}>Finish type</Label>
                              <Select id={`finish-${match.id}`} name="finishType" defaultValue={match.finishType} required>
                                <option value="XTREME">Xtreme Finish (+/- 3)</option>
                                <option value="BURST">Burst Finish (+/- 2)</option>
                                <option value="OVER">Over Finish (+/- 2)</option>
                                <option value="SPIN">Spin Finish (+/- 1)</option>
                              </Select>
                            </div>
                            <div className="flex flex-wrap gap-3 md:col-span-2">
                              <SubmitButton pendingLabel="Updating log...">Save changes</SubmitButton>
                              <button
                                type="submit"
                                formAction={deleteMatchAction}
                                name="matchId"
                                value={match.id}
                                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                              >
                                Delete log
                              </button>
                            </div>
                          </form>
                        </details>
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
    </div>
  );
}
