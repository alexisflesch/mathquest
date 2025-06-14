"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameInstanceUpdateDataSchema = exports.GameInstanceCreationDataSchema = exports.GameTemplateUpdateDataSchema = exports.GameTemplateCreationDataSchema = exports.GameInstanceSchema = exports.GameTemplateSchema = exports.GameParticipantRecordSchema = exports.GameInstanceBaseSchema = exports.GameTemplateBaseSchema = exports.PlayModeSchema = void 0;
/**
 * Zod schemas for game-related types
 */
const zod_1 = require("zod");
exports.PlayModeSchema = zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']);
// Base schemas without circular references
exports.GameTemplateBaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    gradeLevel: zod_1.z.string().nullable().optional(),
    themes: zod_1.z.array(zod_1.z.string()),
    discipline: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    defaultMode: exports.PlayModeSchema.nullable().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    creatorId: zod_1.z.string(),
    // Relations
    creator: zod_1.z.any().optional(), // User type would go here
    questions: zod_1.z.array(zod_1.z.any()).optional() // QuestionsInGameTemplate[] would go here
});
exports.GameInstanceBaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    accessCode: zod_1.z.string(),
    status: zod_1.z.string(),
    playMode: exports.PlayModeSchema,
    leaderboard: zod_1.z.any().optional(), // JSON
    currentQuestionIndex: zod_1.z.number().nullable().optional(),
    settings: zod_1.z.any().optional(), // JSON
    createdAt: zod_1.z.date(),
    startedAt: zod_1.z.date().nullable().optional(),
    endedAt: zod_1.z.date().nullable().optional(),
    differedAvailableFrom: zod_1.z.date().nullable().optional(),
    differedAvailableTo: zod_1.z.date().nullable().optional(),
    isDiffered: zod_1.z.boolean(),
    gameTemplateId: zod_1.z.string(),
    initiatorUserId: zod_1.z.string().nullable().optional(),
    // Relations
    initiatorUser: zod_1.z.any().optional() // User type would go here
});
exports.GameParticipantRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    joinedAt: zod_1.z.date(),
    avatarAnimal: zod_1.z.string().optional(),
    answers: zod_1.z.any().optional(), // JSON - could be more specific later
    gameInstanceId: zod_1.z.string(),
    userId: zod_1.z.string(),
    // Relations
    user: zod_1.z.any().optional() // User type would go here
});
// Full schemas with lazy evaluation for circular references
exports.GameTemplateSchema = exports.GameTemplateBaseSchema.extend({
    gameInstances: zod_1.z.array(zod_1.z.lazy(() => exports.GameInstanceSchema)).optional()
});
exports.GameInstanceSchema = exports.GameInstanceBaseSchema.extend({
    gameTemplate: zod_1.z.lazy(() => exports.GameTemplateSchema).optional(),
    participants: zod_1.z.array(exports.GameParticipantRecordSchema).optional()
});
// Creation/Update schemas
exports.GameTemplateCreationDataSchema = zod_1.z.object({
    name: zod_1.z.string(),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()),
    discipline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    defaultMode: exports.PlayModeSchema.optional(),
    creatorId: zod_1.z.string()
});
exports.GameTemplateUpdateDataSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    discipline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    defaultMode: exports.PlayModeSchema.optional()
});
exports.GameInstanceCreationDataSchema = zod_1.z.object({
    name: zod_1.z.string(),
    accessCode: zod_1.z.string(),
    status: zod_1.z.string(),
    playMode: exports.PlayModeSchema,
    gameTemplateId: zod_1.z.string(),
    initiatorUserId: zod_1.z.string().optional(),
    settings: zod_1.z.any().optional(),
    isDiffered: zod_1.z.boolean().optional(),
    differedAvailableFrom: zod_1.z.date().optional(),
    differedAvailableTo: zod_1.z.date().optional()
});
exports.GameInstanceUpdateDataSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    currentQuestionIndex: zod_1.z.number().nullable().optional(),
    leaderboard: zod_1.z.any().optional(),
    settings: zod_1.z.any().optional(),
    startedAt: zod_1.z.date().nullable().optional(),
    endedAt: zod_1.z.date().nullable().optional()
});
