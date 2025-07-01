/**
 * Zod schemas for game-related types
 */
import { z } from 'zod';

export const PlayModeSchema = z.enum(['quiz', 'tournament', 'practice', 'class']);

// Base schemas without circular references
export const GameTemplateBaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    gradeLevel: z.string().nullable().optional(),
    themes: z.array(z.string()),
    discipline: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    defaultMode: PlayModeSchema.nullable().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    creatorId: z.string(),
    // Relations
    creator: z.any().optional(), // User type would go here
    questions: z.array(z.any()).optional() // QuestionsInGameTemplate[] would go here
});

export const GameInstanceBaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    accessCode: z.string(),
    status: z.string(),
    playMode: PlayModeSchema,
    leaderboard: z.any().optional(), // JSON
    currentQuestionIndex: z.number().nullable().optional(),
    settings: z.any().optional(), // JSON
    createdAt: z.coerce.date(),
    startedAt: z.coerce.date().nullable().optional(),
    endedAt: z.coerce.date().nullable().optional(),
    differedAvailableFrom: z.coerce.date().nullable().optional(),
    differedAvailableTo: z.coerce.date().nullable().optional(),
    isDiffered: z.boolean(),
    gameTemplateId: z.string(),
    initiatorUserId: z.string().nullable().optional(),
    // Relations
    initiatorUser: z.any().optional() // User type would go here
});

export const GameParticipantRecordSchema = z.object({
    id: z.string(),
    joinedAt: z.coerce.date(),
    avatarAnimal: z.string().optional(),
    answers: z.any().optional(), // JSON - could be more specific later
    gameInstanceId: z.string(),
    userId: z.string(),
    // Relations
    user: z.any().optional() // User type would go here
});

// Full schemas with lazy evaluation for circular references
export const GameTemplateSchema: z.ZodType<any> = GameTemplateBaseSchema.extend({
    gameInstances: z.array(z.lazy(() => GameInstanceSchema)).optional()
});

export const GameInstanceSchema: z.ZodType<any> = GameInstanceBaseSchema.extend({
    gameTemplate: z.lazy(() => GameTemplateSchema).optional(),
    participants: z.array(GameParticipantRecordSchema).optional()
});

// Creation/Update schemas
export const GameTemplateCreationDataSchema = z.object({
    name: z.string(),
    gradeLevel: z.string().optional(),
    themes: z.array(z.string()),
    discipline: z.string().optional(),
    description: z.string().optional(),
    defaultMode: PlayModeSchema.optional(),
    creatorId: z.string()
});

export const GameTemplateUpdateDataSchema = z.object({
    name: z.string().optional(),
    gradeLevel: z.string().optional(),
    themes: z.array(z.string()).optional(),
    discipline: z.string().optional(),
    description: z.string().optional(),
    defaultMode: PlayModeSchema.optional()
});

export const GameInstanceCreationDataSchema = z.object({
    name: z.string(),
    accessCode: z.string(),
    status: z.string(),
    playMode: PlayModeSchema,
    gameTemplateId: z.string(),
    initiatorUserId: z.string().optional(),
    settings: z.any().optional(),
    isDiffered: z.boolean().optional(),
    differedAvailableFrom: z.coerce.date().optional(),
    differedAvailableTo: z.coerce.date().optional()
});

export const GameInstanceUpdateDataSchema = z.object({
    name: z.string().optional(),
    status: z.string().optional(),
    currentQuestionIndex: z.number().nullable().optional(),
    leaderboard: z.any().optional(),
    settings: z.any().optional(),
    startedAt: z.coerce.date().nullable().optional(),
    endedAt: z.coerce.date().nullable().optional()
});

export type PlayMode = z.infer<typeof PlayModeSchema>;
export type GameTemplate = z.infer<typeof GameTemplateSchema>;
export type GameInstance = z.infer<typeof GameInstanceSchema>;
export type GameParticipantRecord = z.infer<typeof GameParticipantRecordSchema>;
export type GameTemplateCreationData = z.infer<typeof GameTemplateCreationDataSchema>;
export type GameTemplateUpdateData = z.infer<typeof GameTemplateUpdateDataSchema>;
export type GameInstanceCreationData = z.infer<typeof GameInstanceCreationDataSchema>;
export type GameInstanceUpdateData = z.infer<typeof GameInstanceUpdateDataSchema>;
