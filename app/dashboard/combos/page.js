import { createComboAction, unarchiveComboAction } from "@/app/actions/combos";
import { ComboBuilderForm } from "@/components/features/combo-builder-form";
import { EditableComboCard } from "@/components/features/editable-combo-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboPartsShowcase } from "@/components/ui/combo-parts-showcase";
import { Input } from "@/components/ui/input";
import { requireSession } from "@/lib/auth";
import { comboLabel, computeComboStats, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;
const TEAM_PAGE_SIZE = 4;

function WeightReadout({ stats }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-muted-foreground">Weight</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{stats.weight.toFixed(1)}g</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Blade {stats.weightDetails.blade?.toFixed(1) ?? "?"}g</div>
          <div>Ratchet {stats.weightDetails.ratchet?.toFixed(1) ?? "?"}g</div>
          <div>Bit {stats.weightDetails.bit?.toFixed(1) ?? "?"}g</div>
        </div>
      </div>
      {stats.weightWarnings?.length ? (
        <div className="mt-3 space-y-2">
          {stats.weightWarnings.map((warning) => (
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
  );
}

export default async function CombosPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page || 1) || 1);
  const currentTeamPage = Math.max(1, Number(params?.teamPage || 1) || 1);
  const currentArchivedPage = Math.max(1, Number(params?.archivedPage || 1) || 1);
  const savedQuery = String(params?.q || "").trim();
  const teamQuery = String(params?.teamQ || "").trim();

  const savedWhere = {
    ownerId: session.sub,
    archivedAt: null,
    ...(savedQuery
      ? {
          name: {
            contains: savedQuery,
            mode: "insensitive"
          }
        }
      : {})
  };

  const teamWhere = {
    ownerId: { not: session.sub },
    archivedAt: null,
    ...(teamQuery
      ? {
          OR: [
            {
              name: {
                contains: teamQuery,
                mode: "insensitive"
              }
            },
            {
              owner: {
                displayName: {
                  contains: teamQuery,
                  mode: "insensitive"
                }
              }
            },
            {
              owner: {
                username: {
                  contains: teamQuery,
                  mode: "insensitive"
                }
              }
            }
          ]
        }
      : {})
  };

  const archivedWhere = {
    ownerId: session.sub,
    archivedAt: { not: null }
  };

  const [combos, comboCount, archivedCombos, archivedComboCount] =
    session.role === "ADMIN"
      ? [[], 0, [], 0]
      : await Promise.all([
          prisma.combo.findMany({
            where: savedWhere,
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE
          }),
          prisma.combo.count({
            where: savedWhere
          }),
          prisma.combo.findMany({
            where: archivedWhere,
            orderBy: { archivedAt: "desc" },
            skip: (currentArchivedPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE
          }),
          prisma.combo.count({
            where: archivedWhere
          })
        ]);

  const [teamCombos, teamComboCount] =
    session.role === "ADMIN"
      ? [[], 0]
      : await Promise.all([
          prisma.combo.findMany({
            where: teamWhere,
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
            where: teamWhere
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
              <form action="/dashboard/combos" className="flex flex-wrap gap-3">
                <Input
                  name="q"
                  defaultValue={savedQuery}
                  placeholder="Search your combos"
                  className="min-w-[240px] flex-1"
                />
                {teamQuery ? <input type="hidden" name="teamQ" value={teamQuery} /> : null}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Search
                </button>
              </form>
              {combos.length ? (
                combos.map((combo) => <EditableComboCard key={combo.id} combo={combo} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {savedQuery ? "No saved combos matched your search." : "No combos saved yet."}
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
                        href={`/dashboard/combos?page=${currentPage - 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}${currentArchivedPage > 1 ? `&archivedPage=${currentArchivedPage}` : ""}`}
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
                        href={`/dashboard/combos?page=${currentPage + 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}${currentArchivedPage > 1 ? `&archivedPage=${currentArchivedPage}` : ""}`}
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
              <details className="rounded-xl border border-border bg-muted/30 p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Archived combos ({archivedComboCount})
                </summary>
                <div className="mt-4 space-y-4">
                  {archivedCombos.length ? (
                    archivedCombos.map((combo) => (
                      <div key={combo.id} className="rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{combo.name}</div>
                            <div className="text-sm text-muted-foreground">{comboLabel(combo)}</div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            Archived combo. Historical deck and match records stay intact.
                          </div>
                          <form action={unarchiveComboAction}>
                            <button
                              type="submit"
                              name="comboId"
                              value={combo.id}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                            >
                              Unarchive combo
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                      No archived combos yet.
                    </div>
                  )}
                  {archivedComboCount > PAGE_SIZE ? (
                    <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        Archived page {currentArchivedPage} of {Math.ceil(archivedComboCount / PAGE_SIZE)}
                      </span>
                      <div className="flex items-center gap-2">
                        {currentArchivedPage > 1 ? (
                          <a
                            href={`/dashboard/combos?archivedPage=${currentArchivedPage - 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}${currentPage > 1 ? `&page=${currentPage}` : ""}${currentTeamPage > 1 ? `&teamPage=${currentTeamPage}` : ""}`}
                            className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                          >
                            Previous
                          </a>
                        ) : (
                          <span className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
                            Previous
                          </span>
                        )}
                        {currentArchivedPage < Math.ceil(archivedComboCount / PAGE_SIZE) ? (
                          <a
                            href={`/dashboard/combos?archivedPage=${currentArchivedPage + 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}${currentPage > 1 ? `&page=${currentPage}` : ""}${currentTeamPage > 1 ? `&teamPage=${currentTeamPage}` : ""}`}
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
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team combos</CardTitle>
              <CardDescription>Read-only view of combos created by other team members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action="/dashboard/combos" className="flex flex-wrap gap-3">
                {savedQuery ? <input type="hidden" name="q" value={savedQuery} /> : null}
                <Input
                  name="teamQ"
                  defaultValue={teamQuery}
                  placeholder="Search team combos or owner"
                  className="min-w-[240px] flex-1"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Search
                </button>
              </form>
              {teamCombos.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {teamCombos.map((combo) => {
                    const stats = computeComboStats(combo.bladeId, combo.ratchetId, combo.bitId);

                    return (
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
                      <div className="mt-4">
                        <WeightReadout stats={stats} />
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
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {teamQuery ? "No team combos matched your search." : "No other team combos yet."}
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
                        href={`/dashboard/combos?page=${currentPage}&teamPage=${currentTeamPage - 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}`}
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
                        href={`/dashboard/combos?page=${currentPage}&teamPage=${currentTeamPage + 1}${savedQuery ? `&q=${encodeURIComponent(savedQuery)}` : ""}${teamQuery ? `&teamQ=${encodeURIComponent(teamQuery)}` : ""}`}
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
