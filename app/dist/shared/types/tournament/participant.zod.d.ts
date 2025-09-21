import { z } from "zod";
export declare const participantSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    avatar: z.ZodString;
    score: z.ZodNumber;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
    socketId: z.ZodOptional<z.ZodString>;
    scoredQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}, {
    username: string;
    id: string;
    score: number;
    avatar: string;
    socketId?: string | undefined;
    isDeferred?: boolean | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}>;
