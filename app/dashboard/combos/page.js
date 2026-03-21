import { createComboAction, deleteComboAction, updateComboAction } from "@/app/actions/combos";
import { ComboBuilderForm } from "@/components/features/combo-builder-form";
import { EditableComboCard } from "@/components/features/editable-combo-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboPartsShowcase } from "@/components/ui/combo-parts-showcase";
import { requireSession } from "@/lib/auth";
import { comboLabel, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;
const TEAM_PAGE_SIZE = 4;

export default async function CombosPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page || 1) || 1);
  const currentTeamPage = Math.max(1, Number(params?.teamPage || 1) || 1);

  const [combos, comboCount] =
    session.role === "ADMIN"
      ? [[], 0]
      : await Promise.all([
          prisma.combo.findMany({
            where: { ownerId: session.sub },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE
          }),
          prisma.combo.count({
            where: { ownerId: session.sub }
          })
        ]);

  const [teamCombos, teamComboCount] =
    session.role === "ADMIN"
      ? [[], 0]
      : await Promise.all([
          prisma.combo.findMany({
            where: {
              ownerId: { not: session.sub }
            },
            include: {
              owner: {
                select: {
                  username: true,
                  displayName: true
                }
              }
            },
            orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }],
            skip: (currentTeamPage - 1) * TEAM_PAGE_SIZE,
            take: TEAM_PAGE_SIZE
          }),
          prisma.combo.count({
            where: {
              ownerId: { not: session.sub }
            }
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

      {session.role === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Combo Builder</CardTitle>
            <CardDescription>The hardcoded admin account is reserved for management and global stats.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <ComboBuilderForm action={createComboAction} />

          <Card>
            <CardHeader>
              <CardTitle>Saved combos</CardTitle>
              <CardDescription>Every saved combo can be used in decks, training, and tournaments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {combos.length ? (
                combos.map((combo) => <EditableComboCard key={combo.id} combo={combo} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No combos saved yet.
                </div>
              )}
              {comboCount > PAGE_SIZE ? (
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Page {currentPage} of {Math.ceil(comboCount / PAGE_SIZE)}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <a
                        href={`/dashboard/combos?page=${currentPage - 1}`}
                        className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Previous
                      </a>
                    ) : (
                      <span className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
                        Previous
                      </span>
                    )}
                    {currentPage < Math.ceil(comboCount / PAGE_SIZE) ? (
                      <a
                        href={`/dashboard/combos?page=${currentPage + 1}`}
                        className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Next
                      </a>
                    ) : (
                      <span className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
                        Next
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team combos</CardTitle>
              <CardDescription>Read-only view of combos created by other team members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamCombos.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {teamCombos.map((combo) => (
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
                      <div className="mt-4">
                        <ComboPartsShowcase
                          blade={getPartById(combo.bladeId)}
                          ratchet={getPartById(combo.ratchetId)}
                          bit={getPartById(combo.bitId)}
                          tiny
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-rose-50 p-2">
                          <div className="text-muted-foreground">ATK</div>
                          <div className="text-sm font-semibold">{combo.attack}</div>
                        </div>
                        <div className="rounded-xl bg-sky-50 p-2">
                          <div className="text-muted-foreground">DEF</div>
                          <div className="text-sm font-semibold">{combo.defense}</div>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-2">
                          <div className="text-muted-foreground">STA</div>
                          <div className="text-sm font-semibold">{combo.stamina}</div>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-2">
                          <div className="text-muted-foreground">XTR</div>
                          <div className="text-sm font-semibold">{combo.xtreme}</div>
                        </div>
                        <div className="rounded-xl bg-cyan-50 p-2">
                          <div className="text-muted-foreground">BUR</div>
                          <div className="text-sm font-semibold">{combo.burst}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No other team combos yet.
                </div>
              )}
              {teamComboCount > TEAM_PAGE_SIZE ? (
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Team page {currentTeamPage} of {Math.ceil(teamComboCount / TEAM_PAGE_SIZE)}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentTeamPage > 1 ? (
                      <a
                        href={`/dashboard/combos?page=${currentPage}&teamPage=${currentTeamPage - 1}`}
                        className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Previous
                      </a>
                    ) : (
                      <span className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
                        Previous
                      </span>
                    )}
                    {currentTeamPage < Math.ceil(teamComboCount / TEAM_PAGE_SIZE) ? (
                      <a
                        href={`/dashboard/combos?page=${currentPage}&teamPage=${currentTeamPage + 1}`}
                        className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Next
                      </a>
                    ) : (
                      <span className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
                        Next
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
