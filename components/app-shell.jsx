import Image from "next/image";
import Link from "next/link";
import { Trophy, ShieldCheck, Swords, Users, LayoutDashboard, LogOut, KeyRound, Dumbbell } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";

const baseLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/combos", label: "Combo Builder", icon: Swords },
  { href: "/dashboard/decks", label: "Decks", icon: ShieldCheck },
  { href: "/dashboard/training", label: "Training", icon: Dumbbell },
  { href: "/dashboard/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/dashboard/settings", label: "Settings", icon: KeyRound }
];

export function AppShell({ session, children }) {
  const links =
    session.role === "ADMIN"
      ? [
          ...baseLinks.filter((item) => item.href !== "/dashboard/decks" && item.href !== "/dashboard/combos"),
          { href: "/dashboard/admin", label: "Admin", icon: Users }
        ]
      : baseLinks;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="space-y-2 border-b border-border pb-5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="N86601 Beyblade Club"
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl object-contain"
              />
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">N86601</div>
                <div className="text-2xl font-semibold">BeyApp</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Badge>{session.role}</Badge>
              <span className="text-sm text-muted-foreground">{session.displayName}</span>
            </div>
          </div>

          <nav className="mt-5 space-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <form action={logoutAction} className="mt-8">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
