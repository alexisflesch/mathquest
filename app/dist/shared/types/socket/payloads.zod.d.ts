import { z } from "zod";
export declare const setQuestionPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    questionUid: z.ZodString;
    questionIdx: z.ZodOptional<z.ZodNumber>;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    quizId: string;
    questionIdx?: number | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}, {
    questionUid: string;
    quizId: string;
    questionIdx?: number | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}>;
export declare const timerActionPayloadSchema: z.ZodObject<{
    status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
    questionUid: z.ZodString;
    timeLeftMs: z.ZodOptional<z.ZodNumber>;
    quizId: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "play" | "pause" | "stop";
    questionUid: string;
    quizId: string;
    timeLeftMs?: number | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}, {
    status: "play" | "pause" | "stop";
    questionUid: string;
    quizId: string;
    timeLeftMs?: number | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}>;
export declare const setTimerPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    timeLeftMs: z.ZodNumber;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
    questionUid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timeLeftMs: number;
    quizId: string;
    questionUid?: string | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}, {
    timeLeftMs: number;
    quizId: string;
    questionUid?: string | undefined;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}>;
export declare const lockUnlockPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}>;
export declare const endQuizPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
    forceEnd: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
    forceEnd?: boolean | undefined;
}, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
    forceEnd?: boolean | undefined;
}>;
export declare const closeQuestionPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    questionUid: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    quizId: string;
    teacherId?: string | undefined;
}, {
    questionUid: string;
    quizId: string;
    teacherId?: string | undefined;
}>;
export declare const joinQuizPayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    role: z.ZodUnion<[z.ZodLiteral<"teacher">, z.ZodLiteral<"student">, z.ZodLiteral<"projector">]>;
    teacherId: z.ZodOptional<z.ZodString>;
    studentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "student" | "teacher" | "projector";
    quizId: string;
    teacherId?: string | undefined;
    studentId?: string | undefined;
}, {
    role: "student" | "teacher" | "projector";
    quizId: string;
    teacherId?: string | undefined;
    studentId?: string | undefined;
}>;
export declare const getQuizStatePayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    quizId: string;
}, {
    quizId: string;
}>;
export declare const pauseResumePayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
    tournamentCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}, {
    quizId: string;
    teacherId?: string | undefined;
    tournamentCode?: string | undefined;
}>;
export declare const joinTournamentPayloadSchema: z.ZodObject<{
    code: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
    userId: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    cookieId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    userId?: string | undefined;
    username?: string | undefined;
    avatar?: string | undefined;
    isDeferred?: boolean | undefined;
    cookieId?: string | undefined;
    classId?: string | undefined;
}, {
    code: string;
    userId?: string | undefined;
    username?: string | undefined;
    avatar?: string | undefined;
    isDeferred?: boolean | undefined;
    cookieId?: string | undefined;
    classId?: string | undefined;
}>;
export declare const tournamentAnswerPayloadSchema: z.ZodObject<{
    code: z.ZodString;
    questionUid: z.ZodString;
    answerIdx: z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>;
    clientTimestamp: z.ZodNumber;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    questionUid: string;
    answerIdx: number | number[];
    clientTimestamp: number;
    isDeferred?: boolean | undefined;
}, {
    code: string;
    questionUid: string;
    answerIdx: number | number[];
    clientTimestamp: number;
    isDeferred?: boolean | undefined;
}>;
export declare const updateTournamentCodePayloadSchema: z.ZodObject<{
    quizId: z.ZodString;
    newCode: z.ZodString;
    teacherId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    newCode: string;
    teacherId?: string | undefined;
}, {
    quizId: string;
    newCode: string;
    teacherId?: string | undefined;
}>;
export declare const updateAvatarPayloadSchema: z.ZodObject<{
    tournamentCode: z.ZodString;
    newAvatar: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tournamentCode: string;
    newAvatar: string;
}, {
    tournamentCode: string;
    newAvatar: string;
}>;
export declare const quizTimerActionPayloadSchema: z.ZodObject<{
    gameId: z.ZodString;
    action: z.ZodUnion<[z.ZodLiteral<"start">, z.ZodLiteral<"pause">, z.ZodLiteral<"resume">, z.ZodLiteral<"stop">, z.ZodLiteral<"set_duration">]>;
    questionUid: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    action: "pause" | "stop" | "start" | "resume" | "set_duration";
    gameId: string;
    questionUid?: string | undefined;
    durationMs?: number | undefined;
}, {
    action: "pause" | "stop" | "start" | "resume" | "set_duration";
    gameId: string;
    questionUid?: string | undefined;
    durationMs?: number | undefined;
}>;
export declare const gameTimerUpdatePayloadSchema: z.ZodObject<{
    questionUid: z.ZodOptional<z.ZodString>;
    timer: z.ZodOptional<z.ZodObject<{
        startedAt: z.ZodOptional<z.ZodNumber>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        isPaused: z.ZodOptional<z.ZodBoolean>;
        timeRemainingMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        startedAt?: number | undefined;
        durationMs?: number | undefined;
        isPaused?: boolean | undefined;
        timeRemainingMs?: number | undefined;
    }, {
        startedAt?: number | undefined;
        durationMs?: number | undefined;
        isPaused?: boolean | undefined;
        timeRemainingMs?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    questionUid?: string | undefined;
    timer?: {
        startedAt?: number | undefined;
        durationMs?: number | undefined;
        isPaused?: boolean | undefined;
        timeRemainingMs?: number | undefined;
    } | undefined;
}, {
    questionUid?: string | undefined;
    timer?: {
        startedAt?: number | undefined;
        durationMs?: number | undefined;
        isPaused?: boolean | undefined;
        timeRemainingMs?: number | undefined;
    } | undefined;
}>;
export declare const startTournamentPayloadSchema: z.ZodObject<{
    code: z.ZodString;
    teacherId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    teacherId: string;
}, {
    code: string;
    teacherId: string;
}>;
export declare const pauseTournamentPayloadSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const resumeTournamentPayloadSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
