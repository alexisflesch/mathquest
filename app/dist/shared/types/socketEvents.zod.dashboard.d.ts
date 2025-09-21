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
    discipline: string;
    text: string;
    questionType: string;
    durationMs: number;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    title?: string | null | undefined;
    answerOptions?: string[] | undefined;
    tags?: string[] | undefined;
    uid?: string | undefined;
    difficulty?: number | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    excludedFrom?: string[] | undefined;
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
    discipline: string;
    text: string;
    questionType: string;
    durationMs: number;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    title?: string | null | undefined;
    answerOptions?: string[] | undefined;
    tags?: string[] | undefined;
    uid?: string | undefined;
    difficulty?: number | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    excludedFrom?: string[] | undefined;
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
    discipline: string;
    text: string;
    questionType: string;
    durationMs: number;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    title?: string | null | undefined;
    answerOptions?: string[] | undefined;
    tags?: string[] | undefined;
    uid?: string | undefined;
    difficulty?: number | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    excludedFrom?: string[] | undefined;
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
    discipline: string;
    text: string;
    questionType: string;
    durationMs: number;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    title?: string | null | undefined;
    answerOptions?: string[] | undefined;
    tags?: string[] | undefined;
    uid?: string | undefined;
    difficulty?: number | undefined;
    author?: string | null | undefined;
    explanation?: string | null | undefined;
    excludedFrom?: string[] | undefined;
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
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
    answerStats: z.ZodOptional<z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodNumber>, z.ZodObject<{
        type: z.ZodLiteral<"multipleChoice">;
        stats: z.ZodRecord<z.ZodString, z.ZodNumber>;
        totalUsers: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    }, {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"numeric">;
        values: z.ZodArray<z.ZodNumber, "many">;
        totalAnswers: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    }, {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    }>]>>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    status: "pending" | "completed" | "active" | "paused";
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
    gameId: string;
    timer: {
        status: "run" | "pause" | "stop";
        questionUid: string;
        timerEndDateMs: number;
    };
    templateName: string;
    gameInstanceName: string;
    currentQuestionUid: string | null;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number> | {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    } | {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    } | undefined;
}, {
    accessCode: string;
    status: "pending" | "completed" | "active" | "paused";
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
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
    gameId: string;
    timer: {
        status: "run" | "pause" | "stop";
        questionUid: string;
        timerEndDateMs: number;
    };
    templateName: string;
    gameInstanceName: string;
    currentQuestionUid: string | null;
    answersLocked: boolean;
    participantCount: number;
    answerStats?: Record<string, number> | {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    } | {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    } | undefined;
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
    teacherId?: string | undefined;
    gameId?: string | undefined;
}, {
    show: boolean;
    terminatedQuestions: Record<string, boolean>;
    accessCode?: string | undefined;
    teacherId?: string | undefined;
    gameId?: string | undefined;
}>;
export type ShowCorrectAnswersPayload = z.infer<typeof showCorrectAnswersPayloadSchema>;
