"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  ShieldCheck,
  Swords,
  Users,
  LayoutDashboard,
  LogOut,
  KeyRound,
  Dumbbell,
  Menu,
  X
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const baseLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/combos", label: "Combo Builder", icon: Swords },
  { href: "/dashboard/decks", label: "Decks", icon: ShieldCheck },
  { href: "/dashboard/training", label: "Training", icon: Dumbbell },
  { href: "/dashboard/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/dashboard/settings", label: "Settings", icon: KeyRound }
];

function ShellSidebar({ links, session, onNavigate }) {
  return (
    <div className="solid-surface shell-sidebar flex h-full flex-col rounded-3xl border p-5 shadow-xl shadow-slate-200/60 dark:bg-slate-900/88">
      <div className="space-y-2 border-b border-border pb-5">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
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

      <div className="mt-4">
        <ThemeToggle className="w-full justify-center" />
      </div>

      <nav className="mt-5 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
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
    </div>
  );
}

export function AppShell({ session, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links =
    session.role === "ADMIN"
      ? [
          ...baseLinks.filter((item) => item.href !== "/dashboard/decks" && item.href !== "/dashboard/combos"),
          { href: "/dashboard/admin", label: "Admin", icon: Users }
        ]
      : baseLinks;

  return (
    <div className="app-shell min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:hidden">
        <div className="solid-surface flex items-center justify-between rounded-3xl border px-4 py-3 shadow-lg shadow-slate-200/50 dark:bg-slate-900/85 dark:shadow-slate-950/40">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="N86601 Beyblade Club"
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-contain"
            />
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">N86601</div>
              <div className="text-lg font-semibold">BeyApp</div>
            </div>
          </Link>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-background p-3 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <ThemeToggle />
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 w-[86vw] max-w-sm p-4">
            <ShellSidebar links={links} session={session} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 pb-6 lg:grid-cols-[260px,1fr] lg:pt-6">
        <aside className="hidden lg:block">
          <ShellSidebar links={links} session={session} />
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
