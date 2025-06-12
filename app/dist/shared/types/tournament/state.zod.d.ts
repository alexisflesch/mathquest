import { z } from "zod";
export declare const questionTimerStateSchema: z.ZodObject<{
    timeLeftMs: z.ZodNumber;
    initialTimeMs: z.ZodNumber;
    lastUpdateTime: z.ZodNumber;
    status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
}, "strip", z.ZodTypeAny, {
    status: "play" | "pause" | "stop";
    timeLeftMs: number;
    initialTimeMs: number;
    lastUpdateTime: number;
}, {
    status: "play" | "pause" | "stop";
    timeLeftMs: number;
    initialTimeMs: number;
    lastUpdateTime: number;
}>;
export declare const questionStateSchema: z.ZodObject<{
    uid: z.ZodString;
    totalTime: z.ZodNumber;
    correctAnswers: z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>;
}, "strip", z.ZodTypeAny, {
    correctAnswers: number | number[];
    uid: string;
    totalTime: number;
}, {
    correctAnswers: number | number[];
    uid: string;
    totalTime: number;
}>;
