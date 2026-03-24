"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { comboLabel, computeComboStats, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { matchSchema, tournamentSchema } from "@/lib/validators";

const FINISH_POINTS = {
  XTREME: 3,
  BURST: 2,
  OVER: 2,
  SPIN: 1
};

function getPointsDelta(winner, finishType) {
  const finishPoints = FINISH_POINTS[finishType];
  return winner === "YOUR" ? finishPoints : winner === "OPPONENT" ? -finishPoints : 0;
}

function buildOpponentComboName({ opponentBladeId, opponentRatchetId, opponentBitId }) {
  return comboLabel({
    bladeId: opponentBladeId,
    ratchetId: opponentRatchetId,
    bitId: opponentBitId
  });
}

async function findTournament(tx, tournamentId) {
  return tx.tournament.findFirst({
    where: {
      id: tournamentId
    },
    include: {
      owner: {
        select: {
          id: true
        }
      }
    }
  });
}

function canDeleteOwnedRecord(session, ownerId) {
  return session.role === "ADMIN" || session.sub === ownerId;
}

async function findSelectableCombo(tx, comboId) {
  return tx.combo.findFirst({
    where: { id: comboId }
  });
}

async function validateTournamentMatch(tx, session, data, matchId) {
  try {
    computeComboStats(data.opponentBladeId, data.opponentRatchetId, data.opponentBitId);
  } catch {
    return "Opponent combo selection is invalid";
  }

  const [tournament, yourCombo, existingMatch] = await Promise.all([
    findTournament(tx, data.tournamentId),
    findSelectableCombo(tx, data.yourComboId),
    matchId
      ? tx.match.findFirst({
          where: {
            id: matchId
          }
        })
      : Promise.resolve(true)
  ]);

  if (!tournament || !yourCombo || !existingMatch) {
    return "Tournament or your combo selection is invalid";
  }

  const opponentBlade = getPartById(data.opponentBladeId);
  const opponentRatchet = getPartById(data.opponentRatchetId);
  const opponentBit = getPartById(data.opponentBitId);

  if (!opponentBlade || !opponentRatchet || !opponentBit) {
    return "Opponent combo selection is invalid";
  }

  return null;
}

export async function createTournamentAction(formData) {
  const session = await requireSession();
  const parsed = tournamentSchema.safeParse({
    name: formData.get("name")
  });

  if (!parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20tournament%20name");
  }

  const error = await prisma.$transaction(async (tx) => {
    const existing = await tx.tournament.findFirst({
      where: {
        ownerId: session.sub,
        name: parsed.data.name
      }
    });

    if (existing) {
      return "You already have a tournament with that name";
    }

    await tx.tournament.create({
      data: {
        name: parsed.data.name,
        ownerId: session.sub
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Tournament%20created");
}

export async function updateTournamentAction(formData) {
  const session = await requireSession();
  const tournamentId = String(formData.get("tournamentId") || "");
  const parsed = tournamentSchema.safeParse({
    name: formData.get("name")
  });

  if (!tournamentId || !parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20tournament%20name");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await findTournament(tx, tournamentId);

    if (!tournament) {
      return "Tournament not found";
    }

    const existing = await tx.tournament.findFirst({
      where: {
        ownerId: tournament.owner.id,
        name: parsed.data.name,
        id: { not: tournamentId }
      }
    });

    if (existing) {
      return "You already have a tournament with that name";
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { name: parsed.data.name }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Tournament%20updated");
}

export async function deleteTournamentAction(formData) {
  const session = await requireSession();
  const tournamentId = String(formData.get("tournamentId") || "");

  if (!tournamentId) {
    redirect("/dashboard/tournaments?error=Tournament%20not%20found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await findTournament(tx, tournamentId);

    if (!tournament) {
      return "Tournament not found";
    }

    if (!canDeleteOwnedRecord(session, tournament.owner.id)) {
      return "Only the tournament owner or admin can delete this tournament";
    }

    await tx.tournament.delete({
      where: { id: tournamentId }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Tournament%20deleted");
}

export async function createMatchAction(formData) {
  const session = await requireSession();
  const parsed = matchSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    yourComboId: formData.get("yourComboId"),
    opponentBladeId: formData.get("opponentBladeId"),
    opponentRatchetId: formData.get("opponentRatchetId"),
    opponentBitId: formData.get("opponentBitId"),
    winner: formData.get("winner"),
    finishType: formData.get("finishType")
  });

  if (!parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20match%20details");
  }

  const error = await prisma.$transaction(async (tx) => {
    const validationError = await validateTournamentMatch(tx, session, parsed.data);
    if (validationError) {
      return validationError;
    }

    await tx.match.create({
      data: {
        ...parsed.data,
        opponentComboName: buildOpponentComboName(parsed.data),
        pointsDelta: getPointsDelta(parsed.data.winner, parsed.data.finishType)
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Match%20saved");
}

export async function updateMatchAction(formData) {
  const session = await requireSession();
  const matchId = String(formData.get("matchId") || "");
  const parsed = matchSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    yourComboId: formData.get("yourComboId"),
    opponentBladeId: formData.get("opponentBladeId"),
    opponentRatchetId: formData.get("opponentRatchetId"),
    opponentBitId: formData.get("opponentBitId"),
    winner: formData.get("winner"),
    finishType: formData.get("finishType")
  });

  if (!matchId || !parsed.success) {
    redirect("/dashboard/tournaments?error=Invalid%20match%20details");
  }

  const error = await prisma.$transaction(async (tx) => {
    const validationError = await validateTournamentMatch(tx, session, parsed.data, matchId);
    if (validationError) {
      return validationError;
    }

    await tx.match.update({
      where: { id: matchId },
      data: {
        ...parsed.data,
        opponentComboName: buildOpponentComboName(parsed.data),
        pointsDelta: getPointsDelta(parsed.data.winner, parsed.data.finishType)
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Match%20updated");
}

export async function deleteMatchAction(formData) {
  const session = await requireSession();
  const matchId = String(formData.get("matchId") || "");

  if (!matchId) {
    redirect("/dashboard/tournaments?error=Match%20not%20found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findFirst({
      where: {
        id: matchId
      },
      include: {
        tournament: {
          include: {
            owner: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!match) {
      return "Match not found";
    }

    if (!canDeleteOwnedRecord(session, match.tournament.owner.id)) {
      return "Only the tournament owner or admin can delete this log";
    }

    await tx.match.delete({
      where: { id: matchId }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/tournaments?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/tournaments?success=Match%20deleted");
}
