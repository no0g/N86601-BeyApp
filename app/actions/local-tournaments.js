"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  buildInitialTopCutMatches,
  buildNextEliminationRound,
  buildQualifierRanking,
  buildRoundRobinMatches,
  buildSwissRoundMatches,
  normalizeTopCutSize
} from "@/lib/local-tournament";
import { prisma } from "@/lib/prisma";
import { localMatchReportSchema, localTournamentSchema } from "@/lib/validators";

const REDIRECT_BASE = "/dashboard/local-tournaments";

function errorRedirect(message) {
  redirect(`${REDIRECT_BASE}?error=${encodeURIComponent(message)}`);
}

function successRedirect(message) {
  redirect(`${REDIRECT_BASE}?success=${encodeURIComponent(message)}`);
}

export async function createLocalTournamentAction(formData) {
  const session = await requireSession();
  const parsed = localTournamentSchema.safeParse({
    name: formData.get("name"),
    qualifierFormat: formData.get("qualifierFormat"),
    swissRounds: formData.get("swissRounds"),
    topCutSize: formData.get("topCutSize")
  });
  const participantIds = formData.getAll("participantIds").map(String).filter(Boolean);

  if (!parsed.success) {
    errorRedirect("Invalid local tournament details");
  }
  if (participantIds.length < 2) {
    errorRedirect("Select at least 2 participants");
  }

  const error = await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { id: { in: participantIds } },
      orderBy: { displayName: "asc" }
    });
    if (users.length < 2) {
      return "Could not resolve selected participants";
    }

    const topCutSize = normalizeTopCutSize(parsed.data.topCutSize, users.length);
    const swissRounds =
      parsed.data.qualifierFormat === "SWISS"
        ? parsed.data.swissRounds || Math.max(1, Math.ceil(Math.log2(users.length)))
        : null;

    const existing = await tx.localTournament.findFirst({
      where: {
        ownerId: session.sub,
        name: parsed.data.name
      }
    });
    if (existing) {
      return "You already have a local tournament with that name";
    }

    const tournament = await tx.localTournament.create({
      data: {
        name: parsed.data.name,
        qualifierFormat: parsed.data.qualifierFormat,
        swissRounds,
        topCutSize,
        ownerId: session.sub
      }
    });

    await tx.localTournamentParticipant.createMany({
      data: users.map((user, index) => ({
        tournamentId: tournament.id,
        userId: user.id,
        seed: index + 1
      }))
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Local tournament created");
}

export async function deleteLocalTournamentAction(formData) {
  const session = await requireSession();
  const tournamentId = String(formData.get("localTournamentId") || "");
  if (!tournamentId) {
    errorRedirect("Local tournament not found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await tx.localTournament.findUnique({
      where: { id: tournamentId }
    });
    if (!tournament) {
      return "Local tournament not found";
    }
    if (session.role !== "ADMIN" && tournament.ownerId !== session.sub) {
      return "Only owner or admin can delete this tournament";
    }
    await tx.localTournament.delete({ where: { id: tournamentId } });
    return null;
  });

  if (error) {
    errorRedirect(error);
  }
  successRedirect("Local tournament deleted");
}

export async function generateQualifierAction(formData) {
  await requireSession();
  const tournamentId = String(formData.get("localTournamentId") || "");
  if (!tournamentId) {
    errorRedirect("Local tournament not found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await tx.localTournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: { user: true },
          orderBy: { seed: "asc" }
        },
        matches: {
          where: { stage: "QUALIFIER" }
        }
      }
    });
    if (!tournament) return "Local tournament not found";
    if (tournament.matches.length) return "Qualifier matches already generated";
    if (tournament.participants.length < 2) return "Need at least 2 participants";

    const createdMatches =
      tournament.qualifierFormat === "ROUND_ROBIN"
        ? buildRoundRobinMatches(tournament.participants)
        : buildSwissRoundMatches(tournament.participants, [], 1);

    await tx.localTournamentMatch.createMany({
      data: createdMatches.map((match) => ({
        tournamentId,
        ...match
      }))
    });
    await tx.localTournament.update({
      where: { id: tournamentId },
      data: { status: "QUALIFIER" }
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Qualifier schedule generated");
}

export async function generateNextSwissRoundAction(formData) {
  await requireSession();
  const tournamentId = String(formData.get("localTournamentId") || "");
  if (!tournamentId) {
    errorRedirect("Local tournament not found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await tx.localTournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: { user: true },
          orderBy: { seed: "asc" }
        },
        matches: {
          where: { stage: "QUALIFIER" },
          orderBy: [{ roundNumber: "asc" }, { tableNumber: "asc" }]
        }
      }
    });
    if (!tournament) return "Local tournament not found";
    if (tournament.qualifierFormat !== "SWISS") return "This tournament is not Swiss";
    if (!tournament.matches.length) return "Generate qualifier first";

    const currentRound = Math.max(...tournament.matches.map((match) => match.roundNumber));
    if (currentRound >= (tournament.swissRounds || currentRound)) {
      return "Swiss qualifier rounds already complete";
    }
    const pendingInCurrent = tournament.matches.some(
      (match) => match.roundNumber === currentRound && match.status !== "COMPLETED"
    );
    if (pendingInCurrent) {
      return "Complete the current Swiss round first";
    }

    const nextMatches = buildSwissRoundMatches(tournament.participants, tournament.matches, currentRound + 1);
    await tx.localTournamentMatch.createMany({
      data: nextMatches.map((match) => ({
        tournamentId,
        ...match
      }))
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Next Swiss round generated");
}

export async function reportLocalMatchAction(formData) {
  await requireSession();
  const parsed = localMatchReportSchema.safeParse({
    localMatchId: formData.get("localMatchId"),
    result: formData.get("result"),
    scoreA: formData.get("scoreA"),
    scoreB: formData.get("scoreB")
  });
  if (!parsed.success) {
    errorRedirect("Invalid match report");
  }

  const error = await prisma.$transaction(async (tx) => {
    const match = await tx.localTournamentMatch.findUnique({
      where: { id: parsed.data.localMatchId }
    });
    if (!match) return "Match not found";
    if (match.status === "COMPLETED") return "Match already reported";
    if (!match.playerAId || !match.playerBId) return "Cannot report BYE match manually";
    if (match.stage !== "QUALIFIER" && parsed.data.result === "DRAW") {
      return "Draw is only allowed during qualifier stage";
    }

    const winnerId =
      parsed.data.result === "A_WIN"
        ? match.playerAId
        : parsed.data.result === "B_WIN"
          ? match.playerBId
          : null;

    await tx.localTournamentMatch.update({
      where: { id: parsed.data.localMatchId },
      data: {
        status: "COMPLETED",
        result: parsed.data.result,
        winnerId,
        scoreA: parsed.data.scoreA,
        scoreB: parsed.data.scoreB
      }
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Match result saved");
}

export async function startTopCutAction(formData) {
  await requireSession();
  const tournamentId = String(formData.get("localTournamentId") || "");
  if (!tournamentId) {
    errorRedirect("Local tournament not found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await tx.localTournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: { user: true },
          orderBy: { seed: "asc" }
        },
        matches: {
          where: { stage: "QUALIFIER" },
          orderBy: [{ roundNumber: "asc" }, { tableNumber: "asc" }]
        }
      }
    });
    if (!tournament) return "Local tournament not found";
    if (!tournament.matches.length) return "Generate qualifier matches first";
    if (tournament.matches.some((match) => match.status !== "COMPLETED")) {
      return "Complete qualifier matches first";
    }

    const ranking = buildQualifierRanking(tournament.participants, tournament.matches);
    const topCut = normalizeTopCutSize(tournament.topCutSize, ranking.length);
    const qualifiedIds = new Set(ranking.slice(0, topCut).map((entry) => entry.participant.id));

    await Promise.all(
      ranking.map((entry, index) =>
        tx.localTournamentParticipant.update({
          where: { id: entry.participant.id },
          data: {
            qualified: qualifiedIds.has(entry.participant.id),
            seed: index + 1
          }
        })
      )
    );

    const alreadyHasElimination = await tx.localTournamentMatch.count({
      where: {
        tournamentId,
        stage: { in: ["UPPER", "LOWER", "GRAND_FINAL"] }
      }
    });
    if (alreadyHasElimination > 0) {
      return "Elimination bracket already started";
    }

    const qualifiedParticipants = ranking
      .slice(0, topCut)
      .map((entry, index) => ({ ...entry.participant, seed: index + 1 }));
    const initialUpper = buildInitialTopCutMatches(qualifiedParticipants);

    await tx.localTournamentMatch.createMany({
      data: initialUpper.map((match) => ({
        tournamentId,
        ...match
      }))
    });

    await tx.localTournament.update({
      where: { id: tournamentId },
      data: { status: "ELIMINATION" }
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Top cut seeded and elimination started");
}

export async function generateNextEliminationRoundAction(formData) {
  await requireSession();
  const tournamentId = String(formData.get("localTournamentId") || "");
  if (!tournamentId) {
    errorRedirect("Local tournament not found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const tournament = await tx.localTournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          where: { qualified: true },
          include: { user: true },
          orderBy: { seed: "asc" }
        },
        matches: {
          where: {
            stage: { in: ["UPPER", "LOWER", "GRAND_FINAL"] }
          },
          orderBy: [{ stage: "asc" }, { roundNumber: "asc" }, { tableNumber: "asc" }]
        }
      }
    });
    if (!tournament) return "Local tournament not found";
    if (!tournament.participants.length) return "Top cut has not been seeded";

    const next = buildNextEliminationRound(tournament.participants, tournament.matches);
    if (next.reason) {
      return next.reason;
    }
    if (next.completed) {
      await tx.localTournament.update({
        where: { id: tournamentId },
        data: { status: "COMPLETED" }
      });
      return null;
    }
    if (!next.matches.length) {
      return "No further elimination matches can be generated now";
    }

    await tx.localTournamentMatch.createMany({
      data: next.matches.map((match) => ({
        tournamentId,
        ...match
      }))
    });

    return null;
  });

  if (error) {
    errorRedirect(error);
  }

  successRedirect("Next elimination round generated");
}

