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

  const existing = await prisma.trainingSession.findFirst({
    where: {
      ownerId: session.sub,
      name: parsed.data.name
    }
  });

  if (existing) {
    redirect("/dashboard/training?error=You%20already%20have%20a%20training%20session%20with%20that%20name");
  }

  await prisma.trainingSession.create({
    data: {
      name: parsed.data.name,
      ownerId: session.sub
    }
  });

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

  if (parsed.data.yourComboId === parsed.data.opponentComboId) {
    redirect("/dashboard/training?error=Select%20two%20different%20combos%20for%20training");
  }

  const [trainingSession, yourCombo, opponentCombo] = await Promise.all([
    prisma.trainingSession.findFirst({
      where: {
        id: parsed.data.trainingSessionId,
        ownerId: session.sub
      }
    }),
    prisma.combo.findFirst({
      where: {
        id: parsed.data.yourComboId,
        ownerId: session.sub
      }
    }),
    prisma.combo.findFirst({
      where: {
        id: parsed.data.opponentComboId
      }
    })
  ]);

  if (!trainingSession || !yourCombo || !opponentCombo) {
    redirect("/dashboard/training?error=Training%20session%20or%20combo%20selection%20is%20invalid");
  }

  const finishPoints = FINISH_POINTS[parsed.data.finishType];
  const pointsDelta =
    parsed.data.winner === "YOUR" ? finishPoints : parsed.data.winner === "OPPONENT" ? -finishPoints : 0;

  await prisma.trainingMatch.create({
    data: {
      ...parsed.data,
      pointsDelta
    }
  });

  redirect("/dashboard/training?success=Training%20match%20saved");
}
