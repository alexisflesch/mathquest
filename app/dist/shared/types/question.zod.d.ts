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
    type: z.ZodString;
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
    text: string;
    uid: string;
    type: string;
    answers: {
        text: string;
        correct: boolean;
    }[];
    time?: number | undefined;
    explanation?: string | undefined;
    tags?: string[] | undefined;
}, {
    text: string;
    uid: string;
    type: string;
    answers: {
        text: string;
        correct: boolean;
    }[];
    time?: number | undefined;
    explanation?: string | undefined;
    tags?: string[] | undefined;
}>;
