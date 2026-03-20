"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { computeComboStats, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { matchSchema, tournamentSchema } from "@/lib/validators";

const FINISH_POINTS = {
  XTREME: 3,
  BURST: 2,
  OVER: 2,
  SPIN: 1
};

export async function createTournamentAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/tournaments?error=Hardcoded%20admin%20account%20cannot%20own%20tournaments");
  }

  const parsed = tournamentSchema.safeParse({
    name: formData.get("name")
  });

  if (!parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20tournament%20name");
  }

  const existing = await prisma.tournament.findFirst({
    where: {
      ownerId: session.sub,
      name: parsed.data.name
    }
  });

  if (existing) {
    redirect("/dashboard/tournaments?error=You%20already%20have%20a%20tournament%20with%20that%20name");
  }

  await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      ownerId: session.sub
    }
  });

  redirect("/dashboard/tournaments?success=Tournament%20created");
}

export async function updateTournamentAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/tournaments?error=Hardcoded%20admin%20account%20cannot%20own%20tournaments");
  }

  const tournamentId = String(formData.get("tournamentId") || "");
  const parsed = tournamentSchema.safeParse({
    name: formData.get("name")
  });

  if (!tournamentId || !parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20tournament%20name");
  }

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      ownerId: session.sub
    }
  });

  if (!tournament) {
    redirect("/dashboard/tournaments?error=Tournament%20not%20found");
  }

  const existing = await prisma.tournament.findFirst({
    where: {
      ownerId: session.sub,
      name: parsed.data.name,
      id: { not: tournamentId }
    }
  });

  if (existing) {
    redirect("/dashboard/tournaments?error=You%20already%20have%20a%20tournament%20with%20that%20name");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { name: parsed.data.name }
  });

  redirect("/dashboard/tournaments?success=Tournament%20updated");
}

export async function deleteTournamentAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/tournaments?error=Hardcoded%20admin%20account%20cannot%20own%20tournaments");
  }

  const tournamentId = String(formData.get("tournamentId") || "");

  if (!tournamentId) {
    redirect("/dashboard/tournaments?error=Tournament%20not%20found");
  }

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      ownerId: session.sub
    }
  });

  if (!tournament) {
    redirect("/dashboard/tournaments?error=Tournament%20not%20found");
  }

  await prisma.tournament.delete({
    where: { id: tournamentId }
  });

  redirect("/dashboard/tournaments?success=Tournament%20deleted");
}

export async function createMatchAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/tournaments?error=Hardcoded%20admin%20account%20cannot%20log%20matches");
  }

  const parsed = matchSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    yourComboId: formData.get("yourComboId"),
    opponentComboName: formData.get("opponentComboName"),
    opponentBladeId: formData.get("opponentBladeId"),
    opponentRatchetId: formData.get("opponentRatchetId"),
    opponentBitId: formData.get("opponentBitId"),
    winner: formData.get("winner"),
    finishType: formData.get("finishType")
  });

  if (!parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20match%20details");
  }

  try {
    computeComboStats(
      parsed.data.opponentBladeId,
      parsed.data.opponentRatchetId,
      parsed.data.opponentBitId
    );
  } catch {
    redirect("/dashboard/tournaments?error=Opponent%20combo%20selection%20is%20invalid");
  }

  const [tournament, yourCombo] = await Promise.all([
    prisma.tournament.findFirst({
      where: {
        id: parsed.data.tournamentId,
        ownerId: session.sub
      }
    }),
    prisma.combo.findFirst({
      where: {
        ownerId: session.sub,
        id: parsed.data.yourComboId
      }
    })
  ]);

  if (!tournament || !yourCombo) {
    redirect("/dashboard/tournaments?error=Tournament%20or%20your%20combo%20selection%20is%20invalid");
  }

  const finishPoints = FINISH_POINTS[parsed.data.finishType];
  const pointsDelta =
    parsed.data.winner === "YOUR" ? finishPoints : parsed.data.winner === "OPPONENT" ? -finishPoints : 0;

  await prisma.match.create({
    data: {
      ...parsed.data,
      pointsDelta
    }
  });

  redirect("/dashboard/tournaments?success=Match%20saved");
}
