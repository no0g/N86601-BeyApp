"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainingMatchSchema, trainingSessionSchema } from "@/lib/validators";

const FINISH_POINTS = {
  XTREME: 3,
  BURST: 2,
  OVER: 2,
  SPIN: 1
};

async function validateTrainingMatch(tx, sessionUserId, data, ignoreMatchId) {
  if (data.yourComboId === data.opponentComboId) {
    return "Select two different combos for training";
  }

  const [trainingSession, yourCombo, opponentCombo, existingMatch] = await Promise.all([
    tx.trainingSession.findFirst({
      where: {
        id: data.trainingSessionId,
        ownerId: sessionUserId
      }
    }),
    tx.combo.findFirst({
      where: {
        id: data.yourComboId,
        ownerId: sessionUserId
      }
    }),
    tx.combo.findFirst({
      where: {
        id: data.opponentComboId
      }
    }),
    ignoreMatchId
      ? tx.trainingMatch.findFirst({
          where: {
            id: ignoreMatchId,
            trainingSession: {
              ownerId: sessionUserId
            }
          }
        })
      : Promise.resolve(true)
  ]);

  if (!trainingSession || !yourCombo || !opponentCombo || !existingMatch) {
    return "Training session or combo selection is invalid";
  }

  return null;
}

export async function createTrainingSessionAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20own%20training%20sessions");
  }

  const parsed = trainingSessionSchema.safeParse({
    name: formData.get("name")
  });

  if (!parsed.success) {
    redirect("/dashboard/training?error=Invalid%20training%20session%20name");
  }

  const error = await prisma.$transaction(async (tx) => {
    const existing = await tx.trainingSession.findFirst({
      where: {
        ownerId: session.sub,
        name: parsed.data.name
      }
    });

    if (existing) {
      return "You already have a training session with that name";
    }

    await tx.trainingSession.create({
      data: {
        name: parsed.data.name,
        ownerId: session.sub
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20session%20created");
}

export async function createTrainingMatchAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20log%20training%20matches");
  }

  const parsed = trainingMatchSchema.safeParse({
    trainingSessionId: formData.get("trainingSessionId"),
    yourComboId: formData.get("yourComboId"),
    opponentComboId: formData.get("opponentComboId"),
    winner: formData.get("winner"),
    finishType: formData.get("finishType")
  });

  if (!parsed.success) {
    redirect("/dashboard/training?error=Invalid%20training%20match%20details");
  }

  const error = await prisma.$transaction(async (tx) => {
    const validationError = await validateTrainingMatch(tx, session.sub, parsed.data);
    if (validationError) {
      return validationError;
    }

    const finishPoints = FINISH_POINTS[parsed.data.finishType];
    const pointsDelta =
      parsed.data.winner === "YOUR" ? finishPoints : parsed.data.winner === "OPPONENT" ? -finishPoints : 0;

    await tx.trainingMatch.create({
      data: {
        ...parsed.data,
        pointsDelta
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20match%20saved");
}

export async function updateTrainingSessionAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20own%20training%20sessions");
  }

  const trainingSessionId = String(formData.get("trainingSessionId") || "");
  const parsed = trainingSessionSchema.safeParse({
    name: formData.get("name")
  });

  if (!trainingSessionId || !parsed.success) {
    redirect("/dashboard/training?error=Invalid%20training%20session%20name");
  }

  const error = await prisma.$transaction(async (tx) => {
    const trainingSession = await tx.trainingSession.findFirst({
      where: {
        id: trainingSessionId,
        ownerId: session.sub
      }
    });

    if (!trainingSession) {
      return "Training session not found";
    }

    const existing = await tx.trainingSession.findFirst({
      where: {
        ownerId: session.sub,
        name: parsed.data.name,
        id: { not: trainingSessionId }
      }
    });

    if (existing) {
      return "You already have a training session with that name";
    }

    await tx.trainingSession.update({
      where: { id: trainingSessionId },
      data: { name: parsed.data.name }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20session%20updated");
}

export async function deleteTrainingSessionAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20own%20training%20sessions");
  }

  const trainingSessionId = String(formData.get("trainingSessionId") || "");

  if (!trainingSessionId) {
    redirect("/dashboard/training?error=Training%20session%20not%20found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const trainingSession = await tx.trainingSession.findFirst({
      where: {
        id: trainingSessionId,
        ownerId: session.sub
      }
    });

    if (!trainingSession) {
      return "Training session not found";
    }

    await tx.trainingSession.delete({
      where: { id: trainingSessionId }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20session%20deleted");
}

export async function updateTrainingMatchAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20log%20training%20matches");
  }

  const trainingMatchId = String(formData.get("trainingMatchId") || "");
  const parsed = trainingMatchSchema.safeParse({
    trainingSessionId: formData.get("trainingSessionId"),
    yourComboId: formData.get("yourComboId"),
    opponentComboId: formData.get("opponentComboId"),
    winner: formData.get("winner"),
    finishType: formData.get("finishType")
  });

  if (!trainingMatchId || !parsed.success) {
    redirect("/dashboard/training?error=Invalid%20training%20match%20details");
  }

  const error = await prisma.$transaction(async (tx) => {
    const validationError = await validateTrainingMatch(tx, session.sub, parsed.data, trainingMatchId);
    if (validationError) {
      return validationError;
    }

    const finishPoints = FINISH_POINTS[parsed.data.finishType];
    const pointsDelta =
      parsed.data.winner === "YOUR" ? finishPoints : parsed.data.winner === "OPPONENT" ? -finishPoints : 0;

    await tx.trainingMatch.update({
      where: { id: trainingMatchId },
      data: {
        ...parsed.data,
        pointsDelta
      }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20match%20updated");
}

export async function deleteTrainingMatchAction(formData) {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/dashboard/training?error=Hardcoded%20admin%20account%20cannot%20log%20training%20matches");
  }

  const trainingMatchId = String(formData.get("trainingMatchId") || "");

  if (!trainingMatchId) {
    redirect("/dashboard/training?error=Training%20match%20not%20found");
  }

  const error = await prisma.$transaction(async (tx) => {
    const trainingMatch = await tx.trainingMatch.findFirst({
      where: {
        id: trainingMatchId,
        trainingSession: {
          ownerId: session.sub
        }
      }
    });

    if (!trainingMatch) {
      return "Training match not found";
    }

    await tx.trainingMatch.delete({
      where: { id: trainingMatchId }
    });

    return null;
  });

  if (error) {
    redirect(`/dashboard/training?error=${encodeURIComponent(error)}`);
  }

  redirect("/dashboard/training?success=Training%20match%20deleted");
}
