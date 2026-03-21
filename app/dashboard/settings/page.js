import { changePasswordAction } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

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
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Signed in as {session.displayName} ({session.username})
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            {session.role === "ADMIN"
              ? "The hardcoded admin password lives in environment variables and is not changed from the UI."
              : "Update your account password here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.role === "ADMIN" ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Change `ADMIN_PASSWORD` in your environment before deploying if you want a different admin password.
            </div>
          ) : (
            <form action={changePasswordAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextPassword">New password</Label>
                <Input id="nextPassword" name="nextPassword" type="password" required />
              </div>
              <div className="md:col-span-2">
                <SubmitButton pendingLabel="Updating...">Update password</SubmitButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
