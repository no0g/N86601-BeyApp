"use server";

import { redirect } from "next/navigation";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validators";

export async function createUserAction(formData) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/dashboard/admin?error=Invalid%20user%20details");
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username }
  });

  if (existing) {
    redirect("/dashboard/admin?error=Username%20already%20exists");
  }

  await prisma.user.create({
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password)
    }
  });

  redirect("/dashboard/admin?success=User%20created");
}
