"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameTimerStateSchema = void 0;
const zod_1 = require("zod");
exports.gameTimerStateSchema = zod_1.z.object({
    status: zod_1.z.union([zod_1.z.literal("run"), zod_1.z.literal("pause"), zod_1.z.literal("stop")]),
    timeLeftMs: zod_1.z.number(),
    durationMs: zod_1.z.number(),
    questionUid: zod_1.z.string().nullable().optional(),
    timestamp: zod_1.z.number().nullable(),
    localTimeLeftMs: zod_1.z.number().nullable(),
    isRunning: zod_1.z.boolean().optional(),
    displayFormat: zod_1.z.enum(["mm:ss", "ss", "ms"]).optional(),
    showMilliseconds: zod_1.z.boolean().optional(),
    startedAt: zod_1.z.number().optional(),
    pausedAt: zod_1.z.number().optional(),
});
