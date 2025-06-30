import { z } from 'zod';
import { questionDataSchema } from '../../../../shared/types/socketEvents.zod';

// Minimal schema for projection_state payload
export const projectionStatePayloadSchema = z.object({
    gameState: z.object({
        questionData: questionDataSchema,
        // ... you can add more fields as needed for stricter validation
    }).passthrough(),
    answersLocked: z.boolean().optional(),
});

export function validateProjectionStatePayload(payload: any) {
    return projectionStatePayloadSchema.safeParse(payload);
}
