import { z } from "zod";
export declare const questionTimerStateSchema: z.ZodObject<{
    timeLeft: z.ZodNumber;
    initialTime: z.ZodNumber;
    lastUpdateTime: z.ZodNumber;
    status: z.ZodUnion<[z.ZodLiteral<"play">, z.ZodLiteral<"pause">, z.ZodLiteral<"stop">]>;
}, "strip", z.ZodTypeAny, {
    status: "play" | "pause" | "stop";
    timeLeft: number;
    initialTime: number;
    lastUpdateTime: number;
}, {
    status: "play" | "pause" | "stop";
    timeLeft: number;
    initialTime: number;
    lastUpdateTime: number;
}>;
export declare const questionStateSchema: z.ZodObject<{
    uid: z.ZodString;
    totalTime: z.ZodNumber;
    correctAnswers: z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    correctAnswers: number | number[];
    totalTime: number;
}, {
    uid: string;
    correctAnswers: number | number[];
    totalTime: number;
}>;
