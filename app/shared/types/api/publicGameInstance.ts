/**
 * Minimal public game instance info for lobby and public API consumers.
 *
 * Only includes non-sensitive fields required by the frontend lobby page.
 *
 * Canonical: Used by /api/v1/games/:code for non-admin consumers.
 */

import { z } from 'zod';
import type { PlayMode } from '../core/game';


import type { PracticeSettings } from '../practice/session';

export const PublicGameInstanceSchema = z.object({
    accessCode: z.string(),
    playMode: z.string(), // Should be PlayMode, but string for Zod compatibility
    linkedQuizId: z.string().nullable().optional(),
    status: z.string(),
    name: z.string().optional(),
    practiceSettings: z
        .object({
            gradeLevel: z.string(),
            discipline: z.string(),
            themes: z.array(z.string()),
            questionCount: z.number(),
            showImmediateFeedback: z.boolean(),
            allowRetry: z.boolean(),
            randomizeQuestions: z.boolean(),
            gameTemplateId: z.string().optional(),
        })
        .optional(),
});

export type PublicGameInstance = z.infer<typeof PublicGameInstanceSchema> & {
    practiceSettings?: PracticeSettings;
};
