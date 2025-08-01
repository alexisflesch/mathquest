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
    isHidden: z.ZodOptional<z.ZodBoolean>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    durationMs: number;
    text: string;
    answerOptions: string[];
    questionType: string;
    correctAnswers: boolean[];
    discipline: string;
    uid?: string | undefined;
    title?: string | undefined;
    explanation?: string | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    author?: string | undefined;
    tags?: string[] | undefined;
    isHidden?: boolean | undefined;
}, {
    durationMs: number;
    text: string;
    answerOptions: string[];
    questionType: string;
    correctAnswers: boolean[];
    discipline: string;
    uid?: string | undefined;
    title?: string | undefined;
    explanation?: string | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    author?: string | undefined;
    tags?: string[] | undefined;
    isHidden?: boolean | undefined;
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
        isHidden: z.ZodOptional<z.ZodBoolean>;
        durationMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        durationMs: number;
        text: string;
        answerOptions: string[];
        questionType: string;
        correctAnswers: boolean[];
        discipline: string;
        uid?: string | undefined;
        title?: string | undefined;
        explanation?: string | undefined;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        author?: string | undefined;
        tags?: string[] | undefined;
        isHidden?: boolean | undefined;
    }, {
        durationMs: number;
        text: string;
        answerOptions: string[];
        questionType: string;
        correctAnswers: boolean[];
        discipline: string;
        uid?: string | undefined;
        title?: string | undefined;
        explanation?: string | undefined;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        author?: string | undefined;
        tags?: string[] | undefined;
        isHidden?: boolean | undefined;
    }>, "many">;
    timer: z.ZodObject<{
        status: z.ZodUnion<[z.ZodLiteral<"run">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
        timerEndDateMs: z.ZodNumber;
        questionUid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }>;
    answersLocked: z.ZodBoolean;
    participantCount: z.ZodNumber;
    answerStats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "active" | "paused" | "completed";
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    answersLocked: boolean;
    accessCode: string;
    currentQuestionUid: string | null;
    gameId: string;
    templateName: string;
    gameInstanceName: string;
    questions: {
        durationMs: number;
        text: string;
        answerOptions: string[];
        questionType: string;
        correctAnswers: boolean[];
        discipline: string;
        uid?: string | undefined;
        title?: string | undefined;
        explanation?: string | undefined;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        author?: string | undefined;
        tags?: string[] | undefined;
        isHidden?: boolean | undefined;
    }[];
    participantCount: number;
    answerStats?: Record<string, number> | undefined;
}, {
    status: "pending" | "active" | "paused" | "completed";
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    answersLocked: boolean;
    accessCode: string;
    currentQuestionUid: string | null;
    gameId: string;
    templateName: string;
    gameInstanceName: string;
    questions: {
        durationMs: number;
        text: string;
        answerOptions: string[];
        questionType: string;
        correctAnswers: boolean[];
        discipline: string;
        uid?: string | undefined;
        title?: string | undefined;
        explanation?: string | undefined;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        author?: string | undefined;
        tags?: string[] | undefined;
        isHidden?: boolean | undefined;
    }[];
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
    terminatedQuestions: Record<string, boolean>;
    show: boolean;
    accessCode?: string | undefined;
    gameId?: string | undefined;
    teacherId?: string | undefined;
}, {
    terminatedQuestions: Record<string, boolean>;
    show: boolean;
    accessCode?: string | undefined;
    gameId?: string | undefined;
    teacherId?: string | undefined;
}>;
export type ShowCorrectAnswersPayload = z.infer<typeof showCorrectAnswersPayloadSchema>;
