import { z } from "zod";
export declare const chronoSchema: z.ZodObject<{
    timeLeft: z.ZodNullable<z.ZodNumber>;
    running: z.ZodBoolean;
    status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
}, "strip", z.ZodTypeAny, {
    timeLeft: number | null;
    running: boolean;
    status?: "play" | "pause" | "stop" | undefined;
}, {
    timeLeft: number | null;
    running: boolean;
    status?: "play" | "pause" | "stop" | undefined;
}>;
export declare const questionTimerSchema: z.ZodObject<{
    status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
    timeLeft: z.ZodNumber;
    initialTime: z.ZodNumber;
    timestamp: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "play" | "pause" | "stop";
    timestamp: number | null;
    timeLeft: number;
    initialTime: number;
}, {
    status: "play" | "pause" | "stop";
    timestamp: number | null;
    timeLeft: number;
    initialTime: number;
}>;
export declare const baseQuizStateSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodAny, "many">;
    chrono: z.ZodObject<{
        timeLeft: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    }, "strip", z.ZodTypeAny, {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    }, {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    }>;
    locked: z.ZodBoolean;
    ended: z.ZodBoolean;
    currentQuestionIdx: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    locked: boolean;
    questions: any[];
    chrono: {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    };
    ended: boolean;
    currentQuestionIdx?: number | null | undefined;
}, {
    locked: boolean;
    questions: any[];
    chrono: {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    };
    ended: boolean;
    currentQuestionIdx?: number | null | undefined;
}>;
export declare const extendedQuizStateSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodAny, "many">;
    chrono: z.ZodObject<{
        timeLeft: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    }, "strip", z.ZodTypeAny, {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    }, {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    }>;
    locked: z.ZodBoolean;
    ended: z.ZodBoolean;
    currentQuestionIdx: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
} & {
    id: z.ZodOptional<z.ZodString>;
    quizId: z.ZodOptional<z.ZodString>;
    currentQuestionUid: z.ZodNullable<z.ZodString>;
    stats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    profSocketId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profTeacherId: z.ZodOptional<z.ZodString>;
    timerStatus: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>>;
    timerQuestionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    timerTimeLeft: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    timerTimestamp: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    timerInitialValue: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    tournament_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    connectedSockets: z.ZodOptional<z.ZodSet<z.ZodString>>;
    questionTimers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
        timeLeft: z.ZodNumber;
        initialTime: z.ZodNumber;
        timestamp: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "play" | "pause" | "stop";
        timestamp: number | null;
        timeLeft: number;
        initialTime: number;
    }, {
        status: "play" | "pause" | "stop";
        timestamp: number | null;
        timeLeft: number;
        initialTime: number;
    }>>>;
    pauseHandled: z.ZodOptional<z.ZodNumber>;
    resumeHandled: z.ZodOptional<z.ZodNumber>;
    lockedQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    socketToJoueur: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    participants: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    askedQuestions: z.ZodOptional<z.ZodSet<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    locked: boolean;
    questions: any[];
    chrono: {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    };
    ended: boolean;
    currentQuestionUid: string | null;
    id?: string | undefined;
    participants?: Record<string, any> | undefined;
    currentQuestionIdx?: number | null | undefined;
    quizId?: string | undefined;
    stats?: Record<string, any> | undefined;
    profSocketId?: string | null | undefined;
    profTeacherId?: string | undefined;
    timerStatus?: "play" | "pause" | "stop" | undefined;
    timerQuestionId?: string | null | undefined;
    timerTimeLeft?: number | null | undefined;
    timerTimestamp?: number | null | undefined;
    timerInitialValue?: number | null | undefined;
    tournament_code?: string | null | undefined;
    connectedSockets?: Set<string> | undefined;
    questionTimers?: Record<string, {
        status: "play" | "pause" | "stop";
        timestamp: number | null;
        timeLeft: number;
        initialTime: number;
    }> | undefined;
    pauseHandled?: number | undefined;
    resumeHandled?: number | undefined;
    lockedQuestions?: Record<string, boolean> | undefined;
    socketToJoueur?: Record<string, string> | undefined;
    askedQuestions?: Set<string> | undefined;
}, {
    locked: boolean;
    questions: any[];
    chrono: {
        timeLeft: number | null;
        running: boolean;
        status?: "play" | "pause" | "stop" | undefined;
    };
    ended: boolean;
    currentQuestionUid: string | null;
    id?: string | undefined;
    participants?: Record<string, any> | undefined;
    currentQuestionIdx?: number | null | undefined;
    quizId?: string | undefined;
    stats?: Record<string, any> | undefined;
    profSocketId?: string | null | undefined;
    profTeacherId?: string | undefined;
    timerStatus?: "play" | "pause" | "stop" | undefined;
    timerQuestionId?: string | null | undefined;
    timerTimeLeft?: number | null | undefined;
    timerTimestamp?: number | null | undefined;
    timerInitialValue?: number | null | undefined;
    tournament_code?: string | null | undefined;
    connectedSockets?: Set<string> | undefined;
    questionTimers?: Record<string, {
        status: "play" | "pause" | "stop";
        timestamp: number | null;
        timeLeft: number;
        initialTime: number;
    }> | undefined;
    pauseHandled?: number | undefined;
    resumeHandled?: number | undefined;
    lockedQuestions?: Record<string, boolean> | undefined;
    socketToJoueur?: Record<string, string> | undefined;
    askedQuestions?: Set<string> | undefined;
}>;
