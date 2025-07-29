import { z } from 'zod';
export declare const ProjectionShowStatsStatsSchema: z.ZodRecord<z.ZodString, z.ZodNumber>;
export declare const ProjectionShowStatsPayloadSchema: z.ZodObject<{
    questionUid: z.ZodOptional<z.ZodString>;
    show: z.ZodBoolean;
    stats: z.ZodRecord<z.ZodString, z.ZodNumber>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    show: boolean;
    stats: Record<string, number>;
    questionUid?: string | undefined;
}, {
    timestamp: number;
    show: boolean;
    stats: Record<string, number>;
    questionUid?: string | undefined;
}>;
export type ProjectionShowStatsPayload = z.infer<typeof ProjectionShowStatsPayloadSchema>;
