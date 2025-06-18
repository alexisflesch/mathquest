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
    themes: string[];
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    discipline?: string | null | undefined;
    gradeLevel?: string | null | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | null | undefined;
    description?: string | null | undefined;
    creator?: any;
    questions?: any[] | undefined;
}, {
    themes: string[];
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    discipline?: string | null | undefined;
    gradeLevel?: string | null | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | null | undefined;
    description?: string | null | undefined;
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
    isDiffered: z.ZodBoolean;
    gameTemplateId: z.ZodString;
    initiatorUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    initiatorUser: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    status: string;
    accessCode: string;
    isDiffered: boolean;
    id: string;
    playMode: "tournament" | "quiz" | "practice" | "class";
    name: string;
    createdAt: Date;
    gameTemplateId: string;
    currentQuestionIndex?: number | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    settings?: any;
    endedAt?: Date | null | undefined;
    initiatorUserId?: string | null | undefined;
    initiatorUser?: any;
}, {
    status: string;
    accessCode: string;
    isDiffered: boolean;
    id: string;
    playMode: "tournament" | "quiz" | "practice" | "class";
    name: string;
    createdAt: Date;
    gameTemplateId: string;
    currentQuestionIndex?: number | null | undefined;
    differedAvailableFrom?: Date | null | undefined;
    differedAvailableTo?: Date | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    settings?: any;
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
    answers?: any;
    user?: any;
    avatarAnimal?: string | undefined;
}, {
    userId: string;
    id: string;
    joinedAt: Date;
    gameInstanceId: string;
    answers?: any;
    user?: any;
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
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
    creatorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    themes: string[];
    name: string;
    creatorId: string;
    discipline?: string | undefined;
    gradeLevel?: string | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | undefined;
    description?: string | undefined;
}, {
    themes: string[];
    name: string;
    creatorId: string;
    discipline?: string | undefined;
    gradeLevel?: string | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | undefined;
    description?: string | undefined;
}>;
export declare const GameTemplateUpdateDataSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
}, "strip", z.ZodTypeAny, {
    discipline?: string | undefined;
    themes?: string[] | undefined;
    gradeLevel?: string | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | undefined;
    name?: string | undefined;
    description?: string | undefined;
}, {
    discipline?: string | undefined;
    themes?: string[] | undefined;
    gradeLevel?: string | undefined;
    defaultMode?: "tournament" | "quiz" | "practice" | "class" | undefined;
    name?: string | undefined;
    description?: string | undefined;
}>;
export declare const GameInstanceCreationDataSchema: z.ZodObject<{
    name: z.ZodString;
    accessCode: z.ZodString;
    status: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
    gameTemplateId: z.ZodString;
    initiatorUserId: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodAny>;
    isDiffered: z.ZodOptional<z.ZodBoolean>;
    differedAvailableFrom: z.ZodOptional<z.ZodDate>;
    differedAvailableTo: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: string;
    accessCode: string;
    playMode: "tournament" | "quiz" | "practice" | "class";
    name: string;
    gameTemplateId: string;
    isDiffered?: boolean | undefined;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    settings?: any;
    initiatorUserId?: string | undefined;
}, {
    status: string;
    accessCode: string;
    playMode: "tournament" | "quiz" | "practice" | "class";
    name: string;
    gameTemplateId: string;
    isDiffered?: boolean | undefined;
    differedAvailableFrom?: Date | undefined;
    differedAvailableTo?: Date | undefined;
    settings?: any;
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
    status?: string | undefined;
    currentQuestionIndex?: number | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    name?: string | undefined;
    settings?: any;
    endedAt?: Date | null | undefined;
}, {
    status?: string | undefined;
    currentQuestionIndex?: number | null | undefined;
    leaderboard?: any;
    startedAt?: Date | null | undefined;
    name?: string | undefined;
    settings?: any;
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
