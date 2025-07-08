/**
 * Minimal public game instance info for lobby and public API consumers.
 *
 * Only includes non-sensitive fields required by the frontend lobby page.
 *
 * Canonical: Used by /api/v1/games/:code for non-admin consumers.
 */

import { z } from 'zod';
import type { PlayMode } from '../core/game';

export const PublicGameInstanceSchema = z.object({
    accessCode: z.string(),
    playMode: z.string(), // Should be PlayMode, but string for Zod compatibility
    linkedQuizId: z.string().nullable().optional(),
    status: z.string(),
    name: z.string().optional(),
});

export type PublicGameInstance = z.infer<typeof PublicGameInstanceSchema>;
