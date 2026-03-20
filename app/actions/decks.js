"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deckSchema } from "@/lib/validators";

async function validateDeckInput(ownerId, deckName, comboIds, ignoreDeckId) {
  if (new Set(comboIds).size !== 3) {
    return "Choose 3 different combos";
  }

  const combos = await prisma.combo.findMany({
    where: {
      ownerId,
      id: { in: comboIds }
    }
  });

  if (combos.length !== 3) {
    return "One or more combos are invalid";
  }

  const usedParts = new Set();
  for (const combo of combos) {
    for (const part of [combo.bladeId, combo.ratchetId, combo.bitId]) {
      if (usedParts.has(part)) {
        return "Deck cannot repeat any blade, ratchet, or bit";
      }
      usedParts.add(part);
    }
  }

  const existing = await prisma.deck.findFirst({
    where: {
      ownerId,
      name: deckName,
      ...(ignoreDeckId ? { id: { not: ignoreDeckId } } : {})
    }
  });

  if (existing) {
    return "You already have a deck with that name";
  }

  return null;
}

export async function createDeckAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/decks?error=Hardcoded%20admin%20account%20cannot%20own%20decks");
  }

  const parsed = deckSchema.safeParse({
    name: formData.get("name"),
    comboA: formData.get("comboA"),
    comboB: formData.get("comboB"),
    comboC: formData.get("comboC")
  });

  if (!parsed.success) {
    redirect("/dashboard/decks?error=Invalid%20deck%20details");
  }

  const comboIds = [parsed.data.comboA, parsed.data.comboB, parsed.data.comboC];
  const error = await validateDeckInput(session.sub, parsed.data.name, comboIds);
  if (error) {
    redirect(`/dashboard/decks?error=${encodeURIComponent(error)}`);
  }

  await prisma.deck.create({
    data: {
      name: parsed.data.name,
      ownerId: session.sub,
      slots: {
        create: [
          { slot: 1, comboId: parsed.data.comboA },
          { slot: 2, comboId: parsed.data.comboB },
          { slot: 3, comboId: parsed.data.comboC }
        ]
      }
    }
  });

  redirect("/dashboard/decks?success=Deck%20saved");
}

export async function updateDeckAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/decks?error=Hardcoded%20admin%20account%20cannot%20own%20decks");
  }

  const deckId = String(formData.get("deckId") || "");
  const parsed = deckSchema.safeParse({
    name: formData.get("name"),
    comboA: formData.get("comboA"),
    comboB: formData.get("comboB"),
    comboC: formData.get("comboC")
  });

  if (!deckId || !parsed.success) {
    redirect("/dashboard/decks?error=Invalid%20deck%20details");
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      ownerId: session.sub
    }
  });

  if (!deck) {
    redirect("/dashboard/decks?error=Deck%20not%20found");
  }

  const comboIds = [parsed.data.comboA, parsed.data.comboB, parsed.data.comboC];
  const error = await validateDeckInput(session.sub, parsed.data.name, comboIds, deckId);
  if (error) {
    redirect(`/dashboard/decks?error=${encodeURIComponent(error)}`);
  }

  await prisma.deck.update({
    where: { id: deckId },
    data: {
      name: parsed.data.name,
      slots: {
        deleteMany: {},
        create: [
          { slot: 1, comboId: parsed.data.comboA },
          { slot: 2, comboId: parsed.data.comboB },
          { slot: 3, comboId: parsed.data.comboC }
        ]
      }
    }
  });

  redirect("/dashboard/decks?success=Deck%20updated");
}

export async function deleteDeckAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/decks?error=Hardcoded%20admin%20account%20cannot%20own%20decks");
  }

  const deckId = String(formData.get("deckId") || "");

  if (!deckId) {
    redirect("/dashboard/decks?error=Deck%20not%20found");
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      ownerId: session.sub
    }
  });

  if (!deck) {
    redirect("/dashboard/decks?error=Deck%20not%20found");
  }

  await prisma.deck.delete({
    where: { id: deckId }
  });

  redirect("/dashboard/decks?success=Deck%20deleted");
}
