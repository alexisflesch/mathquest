import { z } from "zod";
export declare const participantSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    avatar: z.ZodString;
    score: z.ZodNumber;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
    socketId: z.ZodOptional<z.ZodString>;
    scoredQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}>;
export declare const tournamentAnswerSchema: z.ZodObject<{
    questionUid: z.ZodOptional<z.ZodString>;
    answerIdx: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
    value: z.ZodOptional<z.ZodAny>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    clientTimestamp: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    timePenalty: z.ZodOptional<z.ZodNumber>;
    baseScore: z.ZodOptional<z.ZodNumber>;
    timeMs: z.ZodOptional<z.ZodNumber>;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    value?: any;
    score?: number | undefined;
    questionUid?: string | undefined;
    timestamp?: number | undefined;
    answerIdx?: number | number[] | undefined;
    clientTimestamp?: number | undefined;
    timePenalty?: number | undefined;
    baseScore?: number | undefined;
    timeMs?: number | undefined;
    isCorrect?: boolean | undefined;
}, {
    value?: any;
    score?: number | undefined;
    questionUid?: string | undefined;
    timestamp?: number | undefined;
    answerIdx?: number | number[] | undefined;
    clientTimestamp?: number | undefined;
    timePenalty?: number | undefined;
    baseScore?: number | undefined;
    timeMs?: number | undefined;
    isCorrect?: boolean | undefined;
}>;
export declare const tournamentParticipantSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    avatar: z.ZodString;
    score: z.ZodNumber;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
    socketId: z.ZodOptional<z.ZodString>;
    scoredQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
} & {
    answers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionUid: z.ZodOptional<z.ZodString>;
        answerIdx: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
        value: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        clientTimestamp: z.ZodOptional<z.ZodNumber>;
        score: z.ZodOptional<z.ZodNumber>;
        timePenalty: z.ZodOptional<z.ZodNumber>;
        baseScore: z.ZodOptional<z.ZodNumber>;
        timeMs: z.ZodOptional<z.ZodNumber>;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        score?: number | undefined;
        questionUid?: string | undefined;
        timestamp?: number | undefined;
        answerIdx?: number | number[] | undefined;
        clientTimestamp?: number | undefined;
        timePenalty?: number | undefined;
        baseScore?: number | undefined;
        timeMs?: number | undefined;
        isCorrect?: boolean | undefined;
    }, {
        value?: any;
        score?: number | undefined;
        questionUid?: string | undefined;
        timestamp?: number | undefined;
        answerIdx?: number | number[] | undefined;
        clientTimestamp?: number | undefined;
        timePenalty?: number | undefined;
        baseScore?: number | undefined;
        timeMs?: number | undefined;
        isCorrect?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    answers?: {
        value?: any;
        score?: number | undefined;
        questionUid?: string | undefined;
        timestamp?: number | undefined;
        answerIdx?: number | number[] | undefined;
        clientTimestamp?: number | undefined;
        timePenalty?: number | undefined;
        baseScore?: number | undefined;
        timeMs?: number | undefined;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    answers?: {
        value?: any;
        score?: number | undefined;
        questionUid?: string | undefined;
        timestamp?: number | undefined;
        answerIdx?: number | number[] | undefined;
        clientTimestamp?: number | undefined;
        timePenalty?: number | undefined;
        baseScore?: number | undefined;
        timeMs?: number | undefined;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}>;
export declare const leaderboardEntrySchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    username: string;
    id: string;
    score: number;
    avatar?: string | undefined;
}, {
    username: string;
    id: string;
    score: number;
    avatar?: string | undefined;
}>;
