import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
  const session = await requireSession();
  return <AppShell session={session}>{children}</AppShell>;
}
