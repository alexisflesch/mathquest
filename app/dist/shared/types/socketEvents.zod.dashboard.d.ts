import { z } from 'zod';
export declare const questionForDashboardSchema: z.ZodObject<{
    uid: z.ZodOptional<z.ZodString>;
} & {
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    answerOptions: z.ZodArray<z.ZodString, "many">;
    correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    questionType: z.ZodString;
    discipline: z.ZodString;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    difficulty: z.ZodOptional<z.ZodNumber>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    explanation: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | undefined;
    explanation?: string | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
}, {
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | undefined;
    explanation?: string | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
}>;
export declare const gameControlStatePayloadSchema: z.ZodObject<{
    gameId: z.ZodString;
    accessCode: z.ZodString;
    templateName: z.ZodString;
    gameInstanceName: z.ZodString;
    status: z.ZodEnum<["pending", "active", "paused", "completed"]>;
    currentQuestionUid: z.ZodNullable<z.ZodString>;
    questions: z.ZodArray<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
    } & {
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        explanation: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | undefined;
        explanation?: string | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
    }, {
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | undefined;
        explanation?: string | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
    }>, "many">;
    timer: z.ZodObject<{
        status: z.ZodUnion<[z.ZodLiteral<"run">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
        timerEndDateMs: z.ZodNumber;
        questionUid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pause" | "stop" | "run";
        questionUid: string;
        timerEndDateMs: number;
    }, {
        status: "pause" | "stop" | "run";
        questionUid: string;
        timerEndDateMs: number;
    }>;
    answersLocked: z.ZodBoolean;
    participantCount: z.ZodNumber;
    answerStats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "completed" | "active" | "paused";
    accessCode: string;
    questions: {
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | undefined;
        explanation?: string | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
    }[];
    timer: {
        status: "pause" | "stop" | "run";
        questionUid: string;
        timerEndDateMs: number;
    };
    gameId: string;
    templateName: string;
    gameInstanceName: string;
    currentQuestionUid: string | null;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number> | undefined;
}, {
    status: "pending" | "completed" | "active" | "paused";
    accessCode: string;
    questions: {
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | undefined;
        explanation?: string | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
    }[];
    timer: {
        status: "pause" | "stop" | "run";
        questionUid: string;
        timerEndDateMs: number;
    };
    gameId: string;
    templateName: string;
    gameInstanceName: string;
    currentQuestionUid: string | null;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number> | undefined;
}>;
export type GameControlStatePayload = z.infer<typeof gameControlStatePayloadSchema>;
export declare const showCorrectAnswersPayloadSchema: z.ZodObject<{
    gameId: z.ZodOptional<z.ZodString>;
    accessCode: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodString>;
    show: z.ZodBoolean;
    terminatedQuestions: z.ZodRecord<z.ZodString, z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    show: boolean;
    terminatedQuestions: Record<string, boolean>;
    accessCode?: string | undefined;
    gameId?: string | undefined;
    teacherId?: string | undefined;
}, {
    show: boolean;
    terminatedQuestions: Record<string, boolean>;
    accessCode?: string | undefined;
    gameId?: string | undefined;
    teacherId?: string | undefined;
}>;
export type ShowCorrectAnswersPayload = z.infer<typeof showCorrectAnswersPayloadSchema>;
