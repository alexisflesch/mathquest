/**
 * Zod schemas for game-related types
 */
import { z } from 'zod';
export declare const PlayModeSchema: z.ZodEnum<["quiz", "tournament", "practice"]>;
export declare const GameTemplateBaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    themes: z.ZodArray<z.ZodString, "many">;
    discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice"]>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    creatorId: z.ZodString;
    creator: z.ZodOptional<z.ZodAny>;
    questions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    themes: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    description?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | null | undefined;
    questions?: any[] | undefined;
    creator?: any;
}, {
    name: string;
    themes: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    description?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | null | undefined;
    questions?: any[] | undefined;
    creator?: any;
}>;
export declare const GameInstanceBaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    accessCode: z.ZodString;
    status: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice"]>;
    leaderboard: z.ZodOptional<z.ZodAny>;
    currentQuestionIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    settings: z.ZodOptional<z.ZodAny>;
    createdAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    differedAvailableFrom: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    differedAvailableTo: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    gameTemplateId: z.ZodString;
    initiatorUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    initiatorUser: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice";
    status: string;
    name: string;
    gameTemplateId: string;
    id: string;
    createdAt: Date;
    settings?: any;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    currentQuestionIndex?: number | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    initiatorUserId?: string | null | undefined;
    initiatorUser?: any;
}, {
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice";
    status: string;
    name: string;
    gameTemplateId: string;
    id: string;
    createdAt: Date;
    settings?: any;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    currentQuestionIndex?: number | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    initiatorUserId?: string | null | undefined;
    initiatorUser?: any;
}>;
export declare const GameParticipantRecordSchema: z.ZodObject<{
    id: z.ZodString;
    joinedAt: z.ZodDate;
    avatarAnimal: z.ZodOptional<z.ZodString>;
    answers: z.ZodOptional<z.ZodAny>;
    gameInstanceId: z.ZodString;
    userId: z.ZodString;
    user: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    joinedAt: Date;
    gameInstanceId: string;
    user?: any;
    answers?: any;
    avatarAnimal?: string | undefined;
}, {
    userId: string;
    id: string;
    joinedAt: Date;
    gameInstanceId: string;
    user?: any;
    answers?: any;
    avatarAnimal?: string | undefined;
}>;
export declare const GameTemplateSchema: z.ZodType<any>;
export declare const GameInstanceSchema: z.ZodType<any>;
export declare const GameTemplateCreationDataSchema: z.ZodObject<{
    name: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodArray<z.ZodString, "many">;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
    creatorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    themes: string[];
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
}, {
    name: string;
    themes: string[];
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
}>;
export declare const GameTemplateUpdateDataSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
}, {
    name?: string | undefined;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
}>;
export declare const GameInstanceCreationDataSchema: z.ZodObject<{
    name: z.ZodString;
    accessCode: z.ZodString;
    status: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice"]>;
    gameTemplateId: z.ZodString;
    initiatorUserId: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodAny>;
    differedAvailableFrom: z.ZodOptional<z.ZodDate>;
    differedAvailableTo: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice";
    status: string;
    name: string;
    gameTemplateId: string;
    settings?: any;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    initiatorUserId?: string | undefined;
}, {
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice";
    status: string;
    name: string;
    gameTemplateId: string;
    settings?: any;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    initiatorUserId?: string | undefined;
}>;
export type PlayMode = z.infer<typeof PlayModeSchema>;
export type GameTemplate = z.infer<typeof GameTemplateSchema>;
export type GameInstance = z.infer<typeof GameInstanceSchema>;
export type GameParticipantRecord = z.infer<typeof GameParticipantRecordSchema>;
export type GameTemplateCreationData = z.infer<typeof GameTemplateCreationDataSchema>;
export type GameTemplateUpdateData = z.infer<typeof GameTemplateUpdateDataSchema>;
export type GameInstanceCreationData = z.infer<typeof GameInstanceCreationDataSchema>;
