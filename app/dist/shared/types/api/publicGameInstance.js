"use strict";
/**
 * Minimal public game instance info for lobby and public API consumers.
 *
 * Only includes non-sensitive fields required by the frontend lobby page.
 *
 * Canonical: Used by /api/v1/games/:code for non-admin consumers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicGameInstanceSchema = void 0;
const zod_1 = require("zod");
exports.PublicGameInstanceSchema = zod_1.z.object({
    accessCode: zod_1.z.string(),
    playMode: zod_1.z.string(), // Should be PlayMode, but string for Zod compatibility
    linkedQuizId: zod_1.z.string().nullable().optional(),
    status: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    practiceSettings: zod_1.z
        .object({
        gradeLevel: zod_1.z.string(),
        discipline: zod_1.z.string(),
        themes: zod_1.z.array(zod_1.z.string()),
        questionCount: zod_1.z.number(),
        showImmediateFeedback: zod_1.z.boolean(),
        allowRetry: zod_1.z.boolean(),
        randomizeQuestions: zod_1.z.boolean(),
        gameTemplateId: zod_1.z.string().optional(),
    })
        .optional(),
});
