"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerActionPayloadSchema = exports.gameTimerStateSchema = void 0;
const zod_1 = require("zod");
exports.gameTimerStateSchema = zod_1.z.object({
    status: zod_1.z.union([zod_1.z.literal("run"), zod_1.z.literal("pause"), zod_1.z.literal("stop")]),
    timerEndDateMs: zod_1.z.number(),
    questionUid: zod_1.z.string(),
});
// Canonical timer action payload schema (for actions from frontend)
exports.timerActionPayloadSchema = zod_1.z.object({
    accessCode: zod_1.z.string().min(1, { message: "Access code cannot be empty." }),
    action: zod_1.z.enum(['run', 'pause', 'stop'], {
        errorMap: () => ({ message: "Action must be one of: run, pause, stop" }),
    }),
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs: zod_1.z.number().int().nonnegative({ message: "timerEndDateMs must be a non-negative integer (ms since epoch, UTC)." }).optional(),
    /**
     * Target time in milliseconds (duration or remaining time, NOT a date).
     * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
     */
    targetTimeMs: zod_1.z.number().int().nonnegative({ message: "targetTimeMs must be a non-negative integer." }).optional(),
    questionUid: zod_1.z.string().min(1, { message: "Question UID cannot be empty." }).optional(),
});
