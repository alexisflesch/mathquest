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
    avatar: string;
    id: string;
    score: number;
    isDeferred?: boolean | undefined;
    socketId?: string | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}, {
    username: string;
    avatar: string;
    id: string;
    score: number;
    isDeferred?: boolean | undefined;
    socketId?: string | undefined;
    scoredQuestions?: Record<string, number> | undefined;
}>;
