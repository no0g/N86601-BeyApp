import Image from "next/image";
import Link from "next/link";
import { getOptionalSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getOptionalSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(239,68,68,0.18),_transparent_25%),linear-gradient(180deg,_#020617,_#0f172a)] text-white">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="N86601 Beyblade Club"
              width={72}
              height={72}
              className="h-14 w-14 rounded-2xl object-contain"
            />
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-sky-300">N86601 Team</div>
              <div className="text-xl font-semibold">BeyApp</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href={session ? "/dashboard" : "/login"}>
              <Button variant="secondary">{session ? "Open Dashboard" : "Sign In"}</Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-4 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              N86601 Team Beyblade Tool
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl">
              Run your Beyblade X club with one shared tool for combos, decks, and tournament tracking.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              N86601 BeyApp gives your team a clean workflow for testing parts, building legal decks, logging match results, and reviewing performance across the whole club.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href={session ? "/dashboard" : "/login"}>
                <Button className="bg-white text-slate-950 hover:bg-slate-100">
                  {session ? "Go to dashboard" : "Enter the app"}
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  See features
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm uppercase tracking-[0.2em] text-sky-300">Build</div>
                <p className="mt-3 text-sm text-slate-300">
                  Create Beyblade X combos with stat previews from your parts dataset.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm uppercase tracking-[0.2em] text-rose-300">Deck</div>
                <p className="mt-3 text-sm text-slate-300">
                  Assemble 3-combo decks with no repeated components across the lineup.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm uppercase tracking-[0.2em] text-emerald-300">Track</div>
                <p className="mt-3 text-sm text-slate-300">
                  Log your combo versus custom opponent combos with Beyblade X finish scoring.
                </p>
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(239,68,68,0.22),_transparent_35%)] blur-2xl" />
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(30,41,59,0.9))] p-6">
                <Image
                  src="/logo.png"
                  alt="N86601 Beyblade Club logo"
                  width={700}
                  height={700}
                  className="mx-auto h-auto w-full max-w-xl object-contain"
                  priority
                />
              </div>
            </div>
          </section>
        </main>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 pb-20 pt-10 text-slate-900">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Admin-controlled access", "Users cannot self-register. The admin creates all accounts and can review club-wide usage."],
            ["Combo builder", "Preview attack, defense, stamina, Xtreme Dash, and burst resistance before saving a build."],
            ["Deck validation", "Build legal 3-combo decks while enforcing no repeated blade, ratchet, or bit parts."],
            ["Tournament analysis", "Track results, finish types, and point deltas for your combo against any opponent combo."]
          ].map(([title, body]) => (
            <div key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
