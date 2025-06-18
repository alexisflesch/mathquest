import { z } from "zod";
export declare const answerSchema: z.ZodObject<{
    text: z.ZodString;
    correct: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    text: string;
    correct: boolean;
}, {
    text: string;
    correct: boolean;
}>;
export declare const baseQuestionSchema: z.ZodObject<{
    uid: z.ZodString;
    text: z.ZodString;
    questionType: z.ZodString;
    answers: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        correct: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        text: string;
        correct: boolean;
    }, {
        text: string;
        correct: boolean;
    }>, "many">;
    time: z.ZodOptional<z.ZodNumber>;
    explanation: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    text: string;
    questionType: string;
    answers: {
        text: string;
        correct: boolean;
    }[];
    explanation?: string | undefined;
    tags?: string[] | undefined;
    time?: number | undefined;
}, {
    uid: string;
    text: string;
    questionType: string;
    answers: {
        text: string;
        correct: boolean;
    }[];
    explanation?: string | undefined;
    tags?: string[] | undefined;
    time?: number | undefined;
}>;
