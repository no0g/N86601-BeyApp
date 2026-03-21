import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  if (isBuildPhase) {
    return children;
  }

  const session = await requireSession();
  return <AppShell session={session}>{children}</AppShell>;
}
