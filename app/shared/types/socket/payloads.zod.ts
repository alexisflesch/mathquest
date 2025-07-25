// Generated by ts-to-zod
import { z } from "zod";

export const setQuestionPayloadSchema = z.object({
  quizId: z.string(),
  questionUid: z.string(),
  questionIdx: z.number().optional(),
  teacherId: z.string().optional(),
  tournamentCode: z.string().optional(),
});

export const timerActionPayloadSchema = z.object({
  action: z.union([z.literal("run"), z.literal("pause"), z.literal("stop"), z.literal("edit")]),
  accessCode: z.string(),
  questionUid: z.string(), // REQUIRED, canonical
  /**
   * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
   */
  durationMs: z.number().int().nonnegative({ message: "durationMs must be a non-negative integer (ms)." }).optional(),
});

export const setTimerPayloadSchema = z.object({
  gameId: z.string(),
  time: z.number(),
  questionUid: z.string().optional(),
});

export const lockUnlockPayloadSchema = z.object({
  quizId: z.string(),
  teacherId: z.string().optional(),
  tournamentCode: z.string().optional(),
});

export const endQuizPayloadSchema = z.object({
  quizId: z.string(),
  teacherId: z.string().optional(),
  tournamentCode: z.string().optional(),
  forceEnd: z.boolean().optional(),
});

export const closeQuestionPayloadSchema = z.object({
  quizId: z.string(),
  questionUid: z.string(),
  teacherId: z.string().optional(),
});

export const joinQuizPayloadSchema = z.object({
  quizId: z.string(),
  role: z.union([
    z.literal("teacher"),
    z.literal("student"),
    z.literal("projector"),
  ]),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
});

export const getQuizStatePayloadSchema = z.object({
  quizId: z.string(),
});

export const pauseResumePayloadSchema = z.object({
  quizId: z.string(),
  teacherId: z.string().optional(),
  tournamentCode: z.string().optional(),
});

export const joinTournamentPayloadSchema = z.object({
  code: z.string(),
  username: z.string().optional(),
  avatar: z.string().optional(),
  isDeferred: z.boolean().optional(),
  userId: z.string().optional(),
  classId: z.string().optional(),
  cookieId: z.string().optional(),
});

export const tournamentAnswerPayloadSchema = z.object({
  code: z.string(),
  questionUid: z.string(),
  answerIdx: z.union([z.number(), z.array(z.number())]),
  clientTimestamp: z.number(),
  isDeferred: z.boolean().optional(),
});

export const updateTournamentCodePayloadSchema = z.object({
  gameId: z.string(),
  newCode: z.string(),
});

export const updateAvatarPayloadSchema = z.object({
  tournamentCode: z.string(),
  newAvatar: z.string(),
});

// Canonical alias: use only timerActionPayloadSchema everywhere
export const quizTimerActionPayloadSchema = timerActionPayloadSchema;

export const gameTimerUpdatePayloadSchema = z.object({
  questionUid: z.string().optional(),
  timer: z
    .object({
      startedAt: z.number().optional(),
      durationMs: z.number().optional(),
      isPaused: z.boolean().optional(),
      timeRemainingMs: z.number().optional(),
    })
    .optional(),
});

export const startTournamentPayloadSchema = z.object({
  code: z.string(),
  teacherId: z.string(),
});

export const pauseTournamentPayloadSchema = z.object({
  code: z.string(),
});

export const resumeTournamentPayloadSchema = z.object({
  code: z.string(),
});

// Type exports from Zod schemas
export type SetTimerPayload = z.infer<typeof setTimerPayloadSchema>;
export type UpdateTournamentCodePayload = z.infer<typeof updateTournamentCodePayloadSchema>;
