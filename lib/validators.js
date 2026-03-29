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

export const localTournamentSchema = z.object({
  name: z.string().min(2).max(60),
  qualifierFormat: z.enum(["ROUND_ROBIN", "SWISS"]),
  swissRounds: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 1 && value <= 20), "Swiss rounds must be between 1 and 20"),
  topCutSize: z
    .union([z.string(), z.number()])
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value >= 2 && value <= 128, "Top cut must be between 2 and 128")
});

export const localMatchReportSchema = z.object({
  localMatchId: z.string().min(1),
  result: z.enum(["A_WIN", "B_WIN", "DRAW"]),
  scoreA: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => Number(value || 0))
    .refine((value) => Number.isFinite(value) && value >= 0 && value <= 99),
  scoreB: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => Number(value || 0))
    .refine((value) => Number.isFinite(value) && value >= 0 && value <= 99)
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  nextPassword: z.string().min(8).max(72)
});
