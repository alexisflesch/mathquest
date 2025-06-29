import { z } from "zod";
import type { GameTimerState } from "./timer";

export const gameTimerStateSchema = z.object({
    status: z.union([z.literal("run"), z.literal("pause"), z.literal("stop")]),
    timerEndDateMs: z.number(),
    questionUid: z.string(),
});

// Canonical timer action payload schema (for actions from frontend)
export const timerActionPayloadSchema = z.object({
    accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
    action: z.enum(['run', 'pause', 'stop'], {
        errorMap: () => ({ message: "Action must be one of: run, pause, stop" }),
    }),
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs: z.number().int().nonnegative({ message: "timerEndDateMs must be a non-negative integer (ms since epoch, UTC)." }).optional(),
    /**
     * Target time in milliseconds (duration or remaining time, NOT a date).
     * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
     */
    targetTimeMs: z.number().int().nonnegative({ message: "targetTimeMs must be a non-negative integer." }).optional(),
    questionUid: z.string().min(1, { message: "Question UID cannot be empty." }).optional(),
});
export type GameTimerStateSchema = typeof gameTimerStateSchema;
export type GameTimerStateZ = z.infer<typeof gameTimerStateSchema>;
