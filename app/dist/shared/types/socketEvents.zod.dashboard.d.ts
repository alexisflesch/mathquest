import { z } from 'zod';
export declare const questionForDashboardSchema: z.ZodEffects<z.ZodObject<{
    uid: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    text: z.ZodString;
    questionType: z.ZodString;
    discipline: z.ZodString;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    difficulty: z.ZodOptional<z.ZodNumber>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    durationMs: z.ZodNumber;
} & {
    multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
        answerOptions: z.ZodArray<z.ZodString, "many">;
        correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    }, "strip", z.ZodTypeAny, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }>>;
    numericQuestion: z.ZodOptional<z.ZodObject<{
        correctAnswer: z.ZodNumber;
        tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    }, {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    }>>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | null | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | null | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    } | undefined;
}>, {
    text: string;
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | null | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    discipline: string;
    durationMs: number;
    uid?: string | undefined;
    title?: string | null | undefined;
    themes?: string[] | undefined;
    difficulty?: number | undefined;
    gradeLevel?: string | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    tags?: string[] | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | null | undefined;
        unit?: string | null | undefined;
    } | undefined;
}>;
export declare const gameControlStatePayloadSchema: z.ZodObject<{
    gameId: z.ZodString;
    accessCode: z.ZodString;
    templateName: z.ZodString;
    gameInstanceName: z.ZodString;
    status: z.ZodEnum<["pending", "active", "paused", "completed"]>;
    currentQuestionUid: z.ZodNullable<z.ZodString>;
    questions: z.ZodArray<z.ZodEffects<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        text: z.ZodString;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    } & {
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        text: string;
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, {
        text: string;
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        text: string;
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, "many">;
    timer: z.ZodObject<{
        status: z.ZodUnion<[z.ZodLiteral<"run">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
        timerEndDateMs: z.ZodNumber;
        questionUid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "run" | "pause" | "stop";
        questionUid: string;
        timerEndDateMs: number;
    }, {
        status: "run" | "pause" | "stop";
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
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    timer: {
        status: "run" | "pause" | "stop";
        questionUid: string;
        timerEndDateMs: number;
    };
    answersLocked: boolean;
    currentQuestionUid: string | null;
    gameId: string;
    templateName: string;
    gameInstanceName: string;
    participantCount: number;
    answerStats?: Record<string, number> | undefined;
}, {
    status: "pending" | "completed" | "active" | "paused";
    accessCode: string;
    questions: {
        text: string;
        questionType: string;
        discipline: string;
        durationMs: number;
        uid?: string | undefined;
        title?: string | null | undefined;
        themes?: string[] | undefined;
        difficulty?: number | undefined;
        gradeLevel?: string | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        tags?: string[] | undefined;
        excludedFrom?: string[] | undefined;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    timer: {
        status: "run" | "pause" | "stop";
        questionUid: string;
        timerEndDateMs: number;
    };
    answersLocked: boolean;
    currentQuestionUid: string | null;
    gameId: string;
    templateName: string;
    gameInstanceName: string;
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
