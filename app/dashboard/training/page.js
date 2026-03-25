import {
  createTrainingMatchAction,
  createTrainingSessionAction,
  deleteTrainingMatchAction,
  deleteTrainingSessionAction,
  updateTrainingMatchAction,
  updateTrainingSessionAction
} from "@/app/actions/training";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const finishTypeLabels = {
  XTREME: "Xtreme Finish",
  BURST: "Burst Finish",
  OVER: "Over Finish",
  SPIN: "Spin Finish"
};

function comboOptionLabel(combo) {
  return `${combo.name} - ${combo.owner.displayName}`;
}

export default async function TrainingPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  const [teamCombos, trainingSessions] = await Promise.all([
    prisma.combo.findMany({
      where: {
        archivedAt: null
      },
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
            yourCombo: {
              include: {
                owner: {
                  select: {
                    username: true,
                    displayName: true
                  }
                }
              }
            },
            opponentCombo: {
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
            <CardTitle>Create training session</CardTitle>
            <CardDescription>Create a shared internal practice session visible to the whole team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTrainingSessionAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Training session name</Label>
                <Input id="name" name="name" placeholder="Saturday Sparring" required />
              </div>
              <SubmitButton pendingLabel="Creating...">Create training session</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log training match</CardTitle>
            <CardDescription>Everyone can log or update shared training records using any saved team combo.</CardDescription>
          </CardHeader>
          <CardContent>
            {teamCombos.length < 2 || trainingSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Create at least one training session and save at least two combos before logging internal matches.
              </div>
            ) : (
              <form action={createTrainingMatchAction} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="trainingSessionId">Training session</Label>
                  <Select id="trainingSessionId" name="trainingSessionId" required>
                    <option value="">Select training session</option>
                    {trainingSessions.map((trainingSession) => (
                      <option key={trainingSession.id} value={trainingSession.id}>
                        {trainingSession.name} - {trainingSession.owner.displayName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yourComboId">Your combo</Label>
                  <Select id="yourComboId" name="yourComboId" required>
                    <option value="">Select your combo</option>
                    {teamCombos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {comboOptionLabel(combo)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opponentComboId">Opponent combo</Label>
                  <Select id="opponentComboId" name="opponentComboId" required>
                    <option value="">Select team combo</option>
                    {teamCombos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {comboOptionLabel(combo)}
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
                  <SubmitButton pendingLabel="Saving training match...">Save training match</SubmitButton>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All training sessions</CardTitle>
          <CardDescription>Shared team practice logs. Any user can update these records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trainingSessions.length ? (
            trainingSessions.map((trainingSession) => (
              <div key={trainingSession.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{trainingSession.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Owner: {trainingSession.owner.displayName} (@{trainingSession.owner.username}) | {trainingSession.matches.length} matches logged
                    </div>
                  </div>
                </div>
                <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm font-medium">Edit or delete training session</summary>
                  <form action={updateTrainingSessionAction} className="mt-4 flex flex-wrap gap-3">
                    <input type="hidden" name="trainingSessionId" value={trainingSession.id} />
                    <div className="min-w-[240px] flex-1 space-y-2">
                      <Label htmlFor={`training-session-name-${trainingSession.id}`}>Training session name</Label>
                      <Input
                        id={`training-session-name-${trainingSession.id}`}
                        name="name"
                        defaultValue={trainingSession.name}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <SubmitButton pendingLabel="Updating session...">Save changes</SubmitButton>
                      {session.role === "ADMIN" || session.sub === trainingSession.owner.id ? (
                        <button
                          type="submit"
                          formAction={deleteTrainingSessionAction}
                          name="trainingSessionId"
                          value={trainingSession.id}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                        >
                          Delete session
                        </button>
                      ) : null}
                    </div>
                  </form>
                </details>
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
                        <div className="mt-1 text-sm text-muted-foreground">
                          Your combo owner: {match.yourCombo.owner.displayName} (@{match.yourCombo.owner.username})
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Opponent owner: {match.opponentCombo.owner.displayName} (@{match.opponentCombo.owner.username})
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
                          {finishTypeLabels[match.finishType]} | Point delta:{" "}
                          {match.pointsDelta > 0 ? `+${match.pointsDelta}` : match.pointsDelta}
                        </div>
                        <details className="mt-4 rounded-xl border border-border bg-white/60 p-3">
                          <summary className="cursor-pointer text-sm font-medium">Edit or delete log</summary>
                          <form action={updateTrainingMatchAction} className="mt-4 grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="trainingMatchId" value={match.id} />
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`training-session-${match.id}`}>Training session</Label>
                              <Select
                                id={`training-session-${match.id}`}
                                name="trainingSessionId"
                                defaultValue={trainingSession.id}
                                required
                              >
                                {trainingSessions.map((sessionItem) => (
                                  <option key={sessionItem.id} value={sessionItem.id}>
                                    {sessionItem.name} - {sessionItem.owner.displayName}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`your-combo-${match.id}`}>Your combo</Label>
                              <Select id={`your-combo-${match.id}`} name="yourComboId" defaultValue={match.yourComboId} required>
                                {teamCombos.map((combo) => (
                                  <option key={combo.id} value={combo.id}>
                                    {comboOptionLabel(combo)}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`opponent-combo-${match.id}`}>Opponent combo</Label>
                              <Select
                                id={`opponent-combo-${match.id}`}
                                name="opponentComboId"
                                defaultValue={match.opponentComboId}
                                required
                              >
                                {teamCombos.map((combo) => (
                                  <option key={combo.id} value={combo.id}>
                                    {comboOptionLabel(combo)}
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
                              {session.role === "ADMIN" || session.sub === trainingSession.owner.id ? (
                                <button
                                  type="submit"
                                  formAction={deleteTrainingMatchAction}
                                  name="trainingMatchId"
                                  value={match.id}
                                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                                >
                                  Delete log
                                </button>
                              ) : null}
                            </div>
                          </form>
                        </details>
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
