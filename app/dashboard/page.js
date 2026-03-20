import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { comboLabel } from "@/lib/beyblade-data";
import { formatDate } from "@/lib/utils";

async function getUserOverview(session) {
  if (session.role === "ADMIN") {
    const [users, combos, decks, tournaments, matches] = await Promise.all([
      prisma.user.count(),
      prisma.combo.count(),
      prisma.deck.count(),
      prisma.tournament.count(),
      prisma.match.count()
    ]);

    const latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6
    });

    return { users, combos, decks, tournaments, matches, latestUsers };
  }

  const [comboCount, deckCount, tournamentCount, matchCount, latestCombos] = await Promise.all([
    prisma.combo.count({ where: { ownerId: session.sub } }),
    prisma.deck.count({ where: { ownerId: session.sub } }),
    prisma.tournament.count({ where: { ownerId: session.sub } }),
    prisma.match.count({
      where: {
        tournament: { ownerId: session.sub }
      }
    }),
    prisma.combo.findMany({
      where: { ownerId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return { comboCount, deckCount, tournamentCount, matchCount, latestCombos };
}

export default async function DashboardPage() {
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
            ? "Manage player accounts and review usage across the whole app."
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
              ["Tournaments", data.tournaments],
              ["Matches", data.matches]
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
              <CardDescription>Newly created players.</CardDescription>
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
              <Link href="/dashboard/admin" className="text-sm font-medium text-emerald-700">
                Open admin console
              </Link>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Saved combos", data.comboCount],
              ["Decks", data.deckCount],
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
        </>
      )}
    </div>
  );
}
