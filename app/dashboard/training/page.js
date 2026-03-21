import { createTrainingMatchAction, createTrainingSessionAction } from "@/app/actions/training";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { formatDate, isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const finishTypeLabels = {
  XTREME: "Xtreme Finish",
  BURST: "Burst Finish",
  OVER: "Over Finish",
  SPIN: "Spin Finish"
};

export default async function TrainingPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  if (session.role === "ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
          <CardDescription>The hardcoded admin account is reserved for reporting only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [yourCombos, allCombos, trainingSessions] = await Promise.all([
    prisma.combo.findMany({
      where: { ownerId: session.sub },
      orderBy: { createdAt: "desc" }
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
      orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }]
    }),
    prisma.trainingSession.findMany({
      where: { ownerId: session.sub },
      include: {
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create training session</CardTitle>
            <CardDescription>Group internal testing matches against your own or teammate combos.</CardDescription>
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
            <CardDescription>Pick your combo and an opponent combo from the team list.</CardDescription>
          </CardHeader>
          <CardContent>
            {yourCombos.length === 0 || allCombos.length < 2 || trainingSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Create at least one training session and save at least one combo before logging internal matches.
              </div>
            ) : (
              <form action={createTrainingMatchAction} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="trainingSessionId">Training session</Label>
                  <Select id="trainingSessionId" name="trainingSessionId" required>
                    <option value="">Select training session</option>
                    {trainingSessions.map((trainingSession) => (
                      <option key={trainingSession.id} value={trainingSession.id}>
                        {trainingSession.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yourComboId">Your combo</Label>
                  <Select id="yourComboId" name="yourComboId" required>
                    <option value="">Select your combo</option>
                    {yourCombos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combo.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opponentComboId">Opponent combo</Label>
                  <Select id="opponentComboId" name="opponentComboId" required>
                    <option value="">Select team combo</option>
                    {allCombos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combo.name} - {combo.owner.displayName}
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
          <CardTitle>Training sessions</CardTitle>
          <CardDescription>Your internal practice logs against team combos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trainingSessions.length ? (
            trainingSessions.map((trainingSession) => (
              <div key={trainingSession.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{trainingSession.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {trainingSession.matches.length} matches logged
                    </div>
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
                          <div className="text-xs text-muted-foreground">{formatDate(match.playedAt)}</div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {comboLabel(match.yourCombo)} vs {comboLabel(match.opponentCombo)}
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
