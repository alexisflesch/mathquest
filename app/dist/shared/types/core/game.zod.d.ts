/**
 * Zod schemas for game-related types
 */
import { z } from 'zod';
export declare const PlayModeSchema: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
export declare const GameTemplateBaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    themes: z.ZodArray<z.ZodString, "many">;
    discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    creatorId: z.ZodString;
    creator: z.ZodOptional<z.ZodAny>;
    questions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    themes: string[];
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    description?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
    creator?: any;
    questions?: any[] | undefined;
}, {
    id: string;
    name: string;
    themes: string[];
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    gradeLevel?: string | null | undefined;
    discipline?: string | null | undefined;
    description?: string | null | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
    creator?: any;
    questions?: any[] | undefined;
}>;
export declare const GameInstanceBaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    accessCode: z.ZodString;
    status: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
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
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    gameTemplateId: string;
    leaderboard?: any;
    currentQuestionIndex?: number | null | undefined;
    settings?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    initiatorUserId?: string | null | undefined;
    initiatorUser?: any;
}, {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    gameTemplateId: string;
    leaderboard?: any;
    currentQuestionIndex?: number | null | undefined;
    settings?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
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
    id: string;
    joinedAt: Date;
    gameInstanceId: string;
    userId: string;
    avatarAnimal?: string | undefined;
    answers?: any;
    user?: any;
}, {
    id: string;
    joinedAt: Date;
    gameInstanceId: string;
    userId: string;
    avatarAnimal?: string | undefined;
    answers?: any;
    user?: any;
}>;
export declare const GameTemplateSchema: z.ZodType<any>;
export declare const GameInstanceSchema: z.ZodType<any>;
export declare const GameTemplateCreationDataSchema: z.ZodObject<{
    name: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodArray<z.ZodString, "many">;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
    creatorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    themes: string[];
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}, {
    name: string;
    themes: string[];
    creatorId: string;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}>;
export declare const GameTemplateUpdateDataSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}, {
    name?: string | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}>;
export declare const GameInstanceCreationDataSchema: z.ZodObject<{
    name: z.ZodString;
    accessCode: z.ZodString;
    status: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
    gameTemplateId: z.ZodString;
    initiatorUserId: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodAny>;
    differedAvailableFrom: z.ZodOptional<z.ZodDate>;
    differedAvailableTo: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: string;
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    gameTemplateId: string;
    settings?: any;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    initiatorUserId?: string | undefined;
}, {
    name: string;
    status: string;
    accessCode: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    gameTemplateId: string;
    settings?: any;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    initiatorUserId?: string | undefined;
}>;
export declare const GameInstanceUpdateDataSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    currentQuestionIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    leaderboard: z.ZodOptional<z.ZodAny>;
    settings: z.ZodOptional<z.ZodAny>;
    startedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: string | undefined;
    leaderboard?: any;
    currentQuestionIndex?: number | null | undefined;
    settings?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
}, {
    name?: string | undefined;
    status?: string | undefined;
    leaderboard?: any;
    currentQuestionIndex?: number | null | undefined;
    settings?: any;
    startedAt?: Date | null | undefined;
    endedAt?: Date | null | undefined;
}>;
export type PlayMode = z.infer<typeof PlayModeSchema>;
export type GameTemplate = z.infer<typeof GameTemplateSchema>;
export type GameInstance = z.infer<typeof GameInstanceSchema>;
export type GameParticipantRecord = z.infer<typeof GameParticipantRecordSchema>;
export type GameTemplateCreationData = z.infer<typeof GameTemplateCreationDataSchema>;
export type GameTemplateUpdateData = z.infer<typeof GameTemplateUpdateDataSchema>;
export type GameInstanceCreationData = z.infer<typeof GameInstanceCreationDataSchema>;
export type GameInstanceUpdateData = z.infer<typeof GameInstanceUpdateDataSchema>;
