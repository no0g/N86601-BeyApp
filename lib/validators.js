import { z } from "zod";

export const credentialsSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9._-]+$/i),
  password: z.string().min(8).max(72)
});

export const createUserSchema = credentialsSchema.extend({
  displayName: z.string().min(2).max(50)
});

export const comboSchema = z.object({
  name: z.string().min(2).max(50),
  bladeId: z.string().min(1),
  ratchetId: z.string().min(1),
  bitId: z.string().min(1)
});

export const deckSchema = z.object({
  name: z.string().min(2).max(50),
  comboA: z.string().min(1),
  comboB: z.string().min(1),
  comboC: z.string().min(1)
});

export const tournamentSchema = z.object({
  name: z.string().min(2).max(50)
});

export const trainingSessionSchema = z.object({
  name: z.string().min(2).max(50)
});

export const matchSchema = z.object({
  tournamentId: z.string().min(1),
  yourComboId: z.string().min(1),
  opponentBladeId: z.string().min(1),
  opponentRatchetId: z.string().min(1),
  opponentBitId: z.string().min(1),
  winner: z.enum(["YOUR", "OPPONENT", "DRAW"]),
  finishType: z.enum(["XTREME", "BURST", "OVER", "SPIN"])
});

export const trainingMatchSchema = z.object({
  trainingSessionId: z.string().min(1),
  yourComboId: z.string().min(1),
  opponentComboId: z.string().min(1),
  winner: z.enum(["YOUR", "OPPONENT", "DRAW"]),
  finishType: z.enum(["XTREME", "BURST", "OVER", "SPIN"])
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  nextPassword: z.string().min(8).max(72)
});
