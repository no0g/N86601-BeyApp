import { createComboAction, deleteComboAction, updateComboAction } from "@/app/actions/combos";
import { ComboBuilderForm } from "@/components/features/combo-builder-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { beybladeData, comboLabel } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";

export default async function CombosPage({ searchParams }) {
  const session = await requireSession();
  const params = await searchParams;

  const combos =
    session.role === "ADMIN"
      ? []
      : await prisma.combo.findMany({
          where: { ownerId: session.sub },
          orderBy: { createdAt: "desc" }
        });

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
              <CardDescription>Every saved combo can be used in decks and tournaments.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {combos.length ? (
                combos.map((combo) => (
                  <div key={combo.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{combo.name}</div>
                        <div className="text-sm text-muted-foreground">{comboLabel(combo)}</div>
                      </div>
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
                    <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                      <summary className="cursor-pointer text-sm font-medium">Edit or delete</summary>
                      <form action={updateComboAction} className="mt-4 grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="comboId" value={combo.id} />
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`name-${combo.id}`}>Combo name</Label>
                          <Input id={`name-${combo.id}`} name="name" defaultValue={combo.name} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`blade-${combo.id}`}>Blade</Label>
                          <Select id={`blade-${combo.id}`} name="bladeId" defaultValue={combo.bladeId} required>
                            {beybladeData.blades.map((part) => (
                              <option key={part.id} value={part.id}>
                                {part.altname || part.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`ratchet-${combo.id}`}>Ratchet</Label>
                          <Select id={`ratchet-${combo.id}`} name="ratchetId" defaultValue={combo.ratchetId} required>
                            {beybladeData.ratchets.map((part) => (
                              <option key={part.id} value={part.id}>
                                {part.altname || part.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`bit-${combo.id}`}>Bit</Label>
                          <Select id={`bit-${combo.id}`} name="bitId" defaultValue={combo.bitId} required>
                            {beybladeData.bits.map((part) => (
                              <option key={part.id} value={part.id}>
                                {part.altname || part.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-3 md:col-span-2">
                          <SubmitButton pendingLabel="Updating combo...">Save changes</SubmitButton>
                          <button
                            type="submit"
                            formAction={deleteComboAction}
                            name="comboId"
                            value={combo.id}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                          >
                            Delete combo
                          </button>
                        </div>
                      </form>
                    </details>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No combos saved yet.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
