import { createDeckAction, deleteDeckAction, updateDeckAction } from "@/app/actions/decks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DecksPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  if (session.role === "ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Decks</CardTitle>
          <CardDescription>The hardcoded admin account is reserved for reporting only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [combos, decks] = await Promise.all([
    prisma.combo.findMany({
      where: { ownerId: session.sub },
      orderBy: { createdAt: "desc" }
    }),
    prisma.deck.findMany({
      where: { ownerId: session.sub },
      include: {
        slots: {
          orderBy: { slot: "asc" },
          include: {
            combo: true
          }
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

      <Card>
        <CardHeader>
          <CardTitle>Create deck</CardTitle>
          <CardDescription>Choose 3 saved combos with no repeated blades, ratchets, or bits.</CardDescription>
        </CardHeader>
        <CardContent>
          {combos.length < 3 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Save at least 3 combos before building a deck.
            </div>
          ) : (
            <form action={createDeckAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Deck name</Label>
                <Input id="name" name="name" placeholder="Regional Attack Deck" required />
              </div>

              {["comboA", "comboB", "comboC"].map((field, index) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>Combo {index + 1}</Label>
                  <Select id={field} name={field} required>
                    <option value="">Select combo</option>
                    {combos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combo.name} - {comboLabel(combo)}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}

              <div className="md:col-span-2">
                <SubmitButton pendingLabel="Saving deck...">Save deck</SubmitButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved decks</CardTitle>
          <CardDescription>Your 3-combo lineups.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {decks.length ? (
            decks.map((deck) => (
              <div key={deck.id} className="rounded-2xl border border-border p-4">
                <div className="font-semibold">{deck.name}</div>
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
                <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm font-medium">Edit or delete</summary>
                  <form action={updateDeckAction} className="mt-4 grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="deckId" value={deck.id} />
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`deck-name-${deck.id}`}>Deck name</Label>
                      <Input id={`deck-name-${deck.id}`} name="name" defaultValue={deck.name} required />
                    </div>
                    {["comboA", "comboB", "comboC"].map((field, index) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`${field}-${deck.id}`}>Combo {index + 1}</Label>
                        <Select
                          id={`${field}-${deck.id}`}
                          name={field}
                          defaultValue={deck.slots[index]?.comboId || ""}
                          required
                        >
                          <option value="">Select combo</option>
                          {combos.map((combo) => (
                            <option key={combo.id} value={combo.id}>
                              {combo.name} - {comboLabel(combo)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-3 md:col-span-2">
                      <SubmitButton pendingLabel="Updating deck...">Save changes</SubmitButton>
                      <button
                        type="submit"
                        formAction={deleteDeckAction}
                        name="deckId"
                        value={deck.id}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                      >
                        Delete deck
                      </button>
                    </div>
                  </form>
                </details>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No decks saved yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
