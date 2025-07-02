import { z } from 'zod';
export declare const ProjectionShowStatsStatsSchema: z.ZodRecord<z.ZodString, z.ZodNumber>;
export declare const ProjectionShowStatsPayloadSchema: z.ZodObject<{
    questionUid: z.ZodString;
    show: z.ZodBoolean;
    stats: z.ZodRecord<z.ZodString, z.ZodNumber>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    show: boolean;
    stats: Record<string, number>;
    timestamp: number;
}, {
    questionUid: string;
    show: boolean;
    stats: Record<string, number>;
    timestamp: number;
}>;
export type ProjectionShowStatsPayload = z.infer<typeof ProjectionShowStatsPayloadSchema>;
