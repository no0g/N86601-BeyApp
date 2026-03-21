"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_USERNAME,
  authenticateUser,
  createSession,
  destroySession,
  hashPassword,
  requireSession
} from "@/lib/auth";
import { credentialsSchema, passwordChangeSchema } from "@/lib/validators";

export async function loginAction(formData) {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/login?error=Invalid%20credentials%20format");
  }

  const user = await authenticateUser(parsed.data.username, parsed.data.password);
  if (!user) {
    redirect("/login?error=Wrong%20username%20or%20password");
  }

  await createSession({
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN" && session.username === ADMIN_USERNAME) {
    redirect("/dashboard/settings?error=Hardcoded%20admin%20password%20must%20be%20changed%20in%20environment%20variables");
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    nextPassword: formData.get("nextPassword")
  });

  if (!parsed.success) {
    redirect("/dashboard/settings?error=Password%20must%20be%20at%20least%208%20characters");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub }
  });

  if (!user) {
    redirect("/login");
  }

  const valid = await authenticateUser(user.username, parsed.data.currentPassword);
  if (!valid) {
    redirect("/dashboard/settings?error=Current%20password%20is%20incorrect");
  }

  const passwordHash = await hashPassword(parsed.data.nextPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      forcePasswordChange: false
    }
  });

  redirect("/dashboard/settings?success=Password%20updated");
}
