import { z } from "zod";
export declare const chronoSchema: z.ZodObject<{
    timeLeftMs: z.ZodNullable<z.ZodNumber>;
    running: z.ZodBoolean;
    status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
}, "strip", z.ZodTypeAny, {
    running: boolean;
    timeLeftMs: number | null;
    status?: "play" | "pause" | "stop" | undefined;
}, {
    running: boolean;
    timeLeftMs: number | null;
    status?: "play" | "pause" | "stop" | undefined;
}>;
export declare const questionTimerSchema: z.ZodObject<{
    status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
    timeLeftMs: z.ZodNumber;
    initialTimeMs: z.ZodNumber;
    timestamp: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "play" | "pause" | "stop";
    timeLeftMs: number;
    initialTimeMs: number;
    timestamp: number | null;
}, {
    status: "play" | "pause" | "stop";
    timeLeftMs: number;
    initialTimeMs: number;
    timestamp: number | null;
}>;
export declare const baseQuizStateSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodAny, "many">;
    chrono: z.ZodObject<{
        timeLeftMs: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    }, "strip", z.ZodTypeAny, {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    }, {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    }>;
    locked: z.ZodBoolean;
    ended: z.ZodBoolean;
    currentQuestionidx: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    questions: any[];
    chrono: {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    };
    locked: boolean;
    ended: boolean;
    currentQuestionidx?: number | null | undefined;
}, {
    questions: any[];
    chrono: {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    };
    locked: boolean;
    ended: boolean;
    currentQuestionidx?: number | null | undefined;
}>;
export declare const extendedQuizStateSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodAny, "many">;
    chrono: z.ZodObject<{
        timeLeftMs: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    }, "strip", z.ZodTypeAny, {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    }, {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    }>;
    locked: z.ZodBoolean;
    ended: z.ZodBoolean;
    currentQuestionidx: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
} & {
    id: z.ZodOptional<z.ZodString>;
    quizId: z.ZodOptional<z.ZodString>;
    currentQuestionUid: z.ZodNullable<z.ZodString>;
    stats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    profSocketId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profTeacherId: z.ZodOptional<z.ZodString>;
    timerStatus: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    timerQuestionUid: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    timerTimeLeftMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    timerTimestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    timerInitialValueMs: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    tournament_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    connectedSockets: z.ZodOptional<z.ZodSet<z.ZodString>>;
    questionTimers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
        timeLeftMs: z.ZodNumber;
        initialTimeMs: z.ZodNumber;
        timestamp: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "play" | "pause" | "stop";
        timeLeftMs: number;
        initialTimeMs: number;
        timestamp: number | null;
    }, {
        status: "play" | "pause" | "stop";
        timeLeftMs: number;
        initialTimeMs: number;
        timestamp: number | null;
    }>>>;
    pauseHandled: z.ZodOptional<z.ZodNumber>;
    resumeHandled: z.ZodOptional<z.ZodNumber>;
    lockedQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    socketToJoueur: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    participants: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    askedQuestions: z.ZodOptional<z.ZodSet<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    questions: any[];
    chrono: {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    };
    locked: boolean;
    ended: boolean;
    currentQuestionUid: string | null;
    currentQuestionidx?: number | null | undefined;
    id?: string | undefined;
    quizId?: string | undefined;
    stats?: Record<string, any> | undefined;
    profSocketId?: string | null | undefined;
    profTeacherId?: string | undefined;
    timerStatus?: "play" | "pause" | "stop" | undefined;
    timerQuestionUid?: string | null | undefined;
    timerTimeLeftMs?: number | null | undefined;
    timerTimestamp?: number | null | undefined;
    timerInitialValueMs?: number | null | undefined;
    tournament_code?: string | null | undefined;
    connectedSockets?: Set<string> | undefined;
    questionTimers?: Record<string, {
        status: "play" | "pause" | "stop";
        timeLeftMs: number;
        initialTimeMs: number;
        timestamp: number | null;
    }> | undefined;
    pauseHandled?: number | undefined;
    resumeHandled?: number | undefined;
    lockedQuestions?: Record<string, boolean> | undefined;
    socketToJoueur?: Record<string, string> | undefined;
    participants?: Record<string, any> | undefined;
    askedQuestions?: Set<string> | undefined;
}, {
    questions: any[];
    chrono: {
        running: boolean;
        timeLeftMs: number | null;
        status?: "play" | "pause" | "stop" | undefined;
    };
    locked: boolean;
    ended: boolean;
    currentQuestionUid: string | null;
    currentQuestionidx?: number | null | undefined;
    id?: string | undefined;
    quizId?: string | undefined;
    stats?: Record<string, any> | undefined;
    profSocketId?: string | null | undefined;
    profTeacherId?: string | undefined;
    timerStatus?: "play" | "pause" | "stop" | undefined;
    timerQuestionUid?: string | null | undefined;
    timerTimeLeftMs?: number | null | undefined;
    timerTimestamp?: number | null | undefined;
    timerInitialValueMs?: number | null | undefined;
    tournament_code?: string | null | undefined;
    connectedSockets?: Set<string> | undefined;
    questionTimers?: Record<string, {
        status: "play" | "pause" | "stop";
        timeLeftMs: number;
        initialTimeMs: number;
        timestamp: number | null;
    }> | undefined;
    pauseHandled?: number | undefined;
    resumeHandled?: number | undefined;
    lockedQuestions?: Record<string, boolean> | undefined;
    socketToJoueur?: Record<string, string> | undefined;
    participants?: Record<string, any> | undefined;
    askedQuestions?: Set<string> | undefined;
}>;
