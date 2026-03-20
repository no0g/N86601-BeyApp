import Image from "next/image";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { getOptionalSession } from "@/lib/auth";

export default async function LoginPage({ searchParams }) {
  const session = await getOptionalSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#0f172a,_#064e3b_45%,_#f8fafc)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 text-white backdrop-blur">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="N86601 Beyblade Club"
              width={88}
              height={88}
              className="h-20 w-20 rounded-3xl object-contain"
              priority
            />
            <div>
              <div className="text-sm uppercase tracking-[0.35em] text-emerald-300">N86601 BeyApp</div>
              <div className="text-sm text-slate-300">Team Beyblade Tool</div>
            </div>
          </div>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">
            Beyblade X combo building, decks, and match tracking in one place.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-slate-200">
            Players only sign in with accounts created by the administrator. Admin access uses the hardcoded bootstrap credentials from your environment.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-2xl font-semibold">Build</div>
              <p className="mt-2 text-sm text-slate-300">Create and save Beyblade X combos with stat previews.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-2xl font-semibold">Deck</div>
              <p className="mt-2 text-sm text-slate-300">Assemble legal 3-combo decks with no repeated parts.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-2xl font-semibold">Track</div>
              <p className="mt-2 text-sm text-slate-300">Log tournaments, matches, and outcomes for later analysis.</p>
            </div>
          </div>
        </div>

        <Card className="rounded-[2rem] border-white/60 bg-white/90 shadow-2xl shadow-slate-950/10">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your admin account or a user account created by the admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              <SubmitButton className="w-full" pendingLabel="Signing in...">
                Enter app
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
