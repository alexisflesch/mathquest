import { z } from "zod";
export declare const gameTimerStateSchema: z.ZodObject<{
    status: z.ZodUnion<[z.ZodLiteral<"run">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
    timerEndDateMs: z.ZodNumber;
    questionUid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "run" | "pause" | "stop";
    timerEndDateMs: number;
    questionUid: string;
}, {
    status: "run" | "pause" | "stop";
    timerEndDateMs: number;
    questionUid: string;
}>;
export declare const timerActionPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    action: z.ZodEnum<["run", "pause", "stop", "edit"]>;
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs: z.ZodOptional<z.ZodNumber>;
    /**
     * Target time in milliseconds (duration or remaining time, NOT a date).
     * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
     */
    targetTimeMs: z.ZodOptional<z.ZodNumber>;
    /**
     * Question UID for question-specific timer operations (REQUIRED, canonical)
     */
    questionUid: z.ZodString;
    /**
     * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
     */
    durationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    accessCode: string;
    action: "run" | "pause" | "stop" | "edit";
    durationMs?: number | undefined;
    timerEndDateMs?: number | undefined;
    targetTimeMs?: number | undefined;
}, {
    questionUid: string;
    accessCode: string;
    action: "run" | "pause" | "stop" | "edit";
    durationMs?: number | undefined;
    timerEndDateMs?: number | undefined;
    targetTimeMs?: number | undefined;
}>;
export type GameTimerStateSchema = typeof gameTimerStateSchema;
export type GameTimerStateZ = z.infer<typeof gameTimerStateSchema>;
