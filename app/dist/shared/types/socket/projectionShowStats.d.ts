import { z } from 'zod';
export declare const MultipleChoiceStatsSchema: z.ZodObject<{
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
}>;
export declare const NumericStatsSchema: z.ZodObject<{
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
}>;
export declare const ProjectionShowStatsStatsSchema: z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodNumber>, z.ZodObject<{
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
}>]>;
export declare const ProjectionShowStatsPayloadSchema: z.ZodObject<{
    questionUid: z.ZodOptional<z.ZodString>;
    show: z.ZodBoolean;
    stats: z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodNumber>, z.ZodObject<{
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
    }>]>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    stats: Record<string, number> | {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    } | {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    };
    show: boolean;
    questionUid?: string | undefined;
}, {
    timestamp: number;
    stats: Record<string, number> | {
        type: "multipleChoice";
        stats: Record<string, number>;
        totalUsers: number;
    } | {
        values: number[];
        type: "numeric";
        totalAnswers: number;
    };
    show: boolean;
    questionUid?: string | undefined;
}>;
export type ProjectionShowStatsPayload = z.infer<typeof ProjectionShowStatsPayloadSchema>;
export type MultipleChoiceStats = z.infer<typeof MultipleChoiceStatsSchema>;
export type NumericStats = z.infer<typeof NumericStatsSchema>;
