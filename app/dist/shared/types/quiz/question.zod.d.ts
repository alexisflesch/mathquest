import { z } from "zod";
declare const rawQuestionSchema: z.ZodObject<{
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
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }, {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }>>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}>;
export declare const questionSchema: z.ZodEffects<z.ZodObject<{
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
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }, {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }>>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}>, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    uid?: string | undefined;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}>;
export type Question = z.infer<typeof rawQuestionSchema>;
export declare const questionCreationSchema: z.ZodObject<Omit<{
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
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }, {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }>>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
}, "uid">, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}, {
    text: string;
    questionType: string;
    durationMs: number;
    discipline: string;
    title?: string | null | undefined;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}>;
export type QuestionCreationData = z.infer<typeof questionCreationSchema>;
export declare const questionUpdateSchema: z.ZodObject<{
    uid: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    text: z.ZodOptional<z.ZodString>;
    questionType: z.ZodOptional<z.ZodString>;
    discipline: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    difficulty: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    gradeLevel: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    author: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    explanation: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    excludedFrom: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    multipleChoiceQuestion: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        answerOptions: z.ZodArray<z.ZodString, "many">;
        correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    }, "strip", z.ZodTypeAny, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }>>>;
    numericQuestion: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        correctAnswer: z.ZodNumber;
        tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }, {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    }>>>;
    answerOptions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    correctAnswers: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>>;
}, "strip", z.ZodTypeAny, {
    uid?: string | undefined;
    title?: string | null | undefined;
    text?: string | undefined;
    questionType?: string | undefined;
    durationMs?: number | undefined;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}, {
    uid?: string | undefined;
    title?: string | null | undefined;
    text?: string | undefined;
    questionType?: string | undefined;
    durationMs?: number | undefined;
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    tags?: string[] | undefined;
    difficulty?: number | undefined;
    explanation?: string | null | undefined;
    author?: string | null | undefined;
    excludedFrom?: string[] | undefined;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        unit?: string | null | undefined;
        tolerance?: number | null | undefined;
    } | undefined;
}>;
export type QuestionUpdateData = z.infer<typeof questionUpdateSchema>;
export {};
