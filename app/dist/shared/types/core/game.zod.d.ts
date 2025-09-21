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
    themes: string[];
    createdAt: Date;
    updatedAt: Date;
    id: string;
    name: string;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | null | undefined;
    creator?: any;
    questions?: any[] | undefined;
    description?: string | null | undefined;
}, {
    themes: string[];
    createdAt: Date;
    updatedAt: Date;
    id: string;
    name: string;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | null | undefined;
    creator?: any;
    questions?: any[] | undefined;
    description?: string | null | undefined;
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
    status: string;
    createdAt: Date;
    id: string;
    playMode: "quiz" | "tournament" | "practice";
    name: string;
    gameTemplateId: string;
    currentQuestionIndex?: number | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    settings?: any;
    initiatorUserId?: string | null | undefined;
    initiatorUser?: any;
}, {
    accessCode: string;
    status: string;
    createdAt: Date;
    id: string;
    playMode: "quiz" | "tournament" | "practice";
    name: string;
    gameTemplateId: string;
    currentQuestionIndex?: number | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    settings?: any;
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
    themes: string[];
    name: string;
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
    description?: string | undefined;
}, {
    themes: string[];
    name: string;
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
    description?: string | undefined;
}>;
export declare const GameTemplateUpdateDataSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
}, "strip", z.ZodTypeAny, {
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
    name?: string | undefined;
    description?: string | undefined;
}, {
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | undefined;
    name?: string | undefined;
    description?: string | undefined;
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
    status: string;
    playMode: "quiz" | "tournament" | "practice";
    name: string;
    gameTemplateId: string;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    settings?: any;
    initiatorUserId?: string | undefined;
}, {
    accessCode: string;
    status: string;
    playMode: "quiz" | "tournament" | "practice";
    name: string;
    gameTemplateId: string;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    settings?: any;
    initiatorUserId?: string | undefined;
}>;
export type PlayMode = z.infer<typeof PlayModeSchema>;
export type GameTemplate = z.infer<typeof GameTemplateSchema>;
export type GameInstance = z.infer<typeof GameInstanceSchema>;
export type GameParticipantRecord = z.infer<typeof GameParticipantRecordSchema>;
export type GameTemplateCreationData = z.infer<typeof GameTemplateCreationDataSchema>;
export type GameTemplateUpdateData = z.infer<typeof GameTemplateUpdateDataSchema>;
export type GameInstanceCreationData = z.infer<typeof GameInstanceCreationDataSchema>;
