"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { computeComboStats } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { comboSchema } from "@/lib/validators";

export async function createComboAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/combos?error=Hardcoded%20admin%20account%20is%20for%20management%20and%20reporting");
  }

  const parsed = comboSchema.safeParse({
    name: formData.get("name"),
    bladeId: formData.get("bladeId"),
    ratchetId: formData.get("ratchetId"),
    bitId: formData.get("bitId")
  });

  if (!parsed.success) {
    redirect("/dashboard/combos?error=Invalid%20combo%20input");
  }

  const stats = computeComboStats(
    parsed.data.bladeId,
    parsed.data.ratchetId,
    parsed.data.bitId
  );

  const existing = await prisma.combo.findFirst({
    where: {
      ownerId: session.sub,
      name: parsed.data.name
    }
  });

  if (existing) {
    redirect("/dashboard/combos?error=You%20already%20have%20a%20combo%20with%20that%20name");
  }

  await prisma.combo.create({
    data: {
      ...parsed.data,
      ...stats,
      ownerId: session.sub
    }
  });

  redirect("/dashboard/combos?success=Combo%20saved");
}

export async function updateComboAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/combos?error=Hardcoded%20admin%20account%20is%20for%20management%20and%20reporting");
  }

  const comboId = String(formData.get("comboId") || "");
  const parsed = comboSchema.safeParse({
    name: formData.get("name"),
    bladeId: formData.get("bladeId"),
    ratchetId: formData.get("ratchetId"),
    bitId: formData.get("bitId")
  });

  if (!comboId || !parsed.success) {
    redirect("/dashboard/combos?error=Invalid%20combo%20input");
  }

  const combo = await prisma.combo.findFirst({
    where: {
      id: comboId,
      ownerId: session.sub
    },
    include: {
      deckSlots: true,
      yourMatches: true,
      trainingYourMatches: true,
      trainingOpponentMatches: true
    }
  });

  if (!combo) {
    redirect("/dashboard/combos?error=Combo%20not%20found");
  }

  const existing = await prisma.combo.findFirst({
    where: {
      ownerId: session.sub,
      name: parsed.data.name,
      id: { not: comboId }
    }
  });

  if (existing) {
    redirect("/dashboard/combos?error=You%20already%20have%20a%20combo%20with%20that%20name");
  }

  const partChanged =
    combo.bladeId !== parsed.data.bladeId ||
    combo.ratchetId !== parsed.data.ratchetId ||
    combo.bitId !== parsed.data.bitId;

  if (
    partChanged &&
    (
      combo.deckSlots.length > 0 ||
      combo.yourMatches.length > 0 ||
      combo.trainingYourMatches.length > 0 ||
      combo.trainingOpponentMatches.length > 0
    )
  ) {
    redirect("/dashboard/combos?error=This%20combo%20is%20already%20used%20in%20a%20deck%20or%20match.%20Only%20the%20name%20can%20be%20edited");
  }

  const stats = computeComboStats(
    parsed.data.bladeId,
    parsed.data.ratchetId,
    parsed.data.bitId
  );

  await prisma.combo.update({
    where: { id: comboId },
    data: {
      ...parsed.data,
      ...stats
    }
  });

  redirect("/dashboard/combos?success=Combo%20updated");
}

export async function deleteComboAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/combos?error=Hardcoded%20admin%20account%20is%20for%20management%20and%20reporting");
  }

  const comboId = String(formData.get("comboId") || "");

  if (!comboId) {
    redirect("/dashboard/combos?error=Combo%20not%20found");
  }

  const combo = await prisma.combo.findFirst({
    where: {
      id: comboId,
      ownerId: session.sub
    },
    include: {
      deckSlots: true,
      yourMatches: true,
      trainingYourMatches: true,
      trainingOpponentMatches: true
    }
  });

  if (!combo) {
    redirect("/dashboard/combos?error=Combo%20not%20found");
  }

  if (
    combo.deckSlots.length > 0 ||
    combo.yourMatches.length > 0 ||
    combo.trainingYourMatches.length > 0 ||
    combo.trainingOpponentMatches.length > 0
  ) {
    redirect("/dashboard/combos?error=Cannot%20delete%20a%20combo%20that%20is%20already%20used%20in%20a%20deck%20or%20match");
  }

  await prisma.combo.delete({
    where: { id: comboId }
  });

  redirect("/dashboard/combos?success=Combo%20deleted");
}
