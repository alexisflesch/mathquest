import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

// Create a helper-specific logger
const logger = createLogger('GameHelpers');

// Redis key prefixes
export const GAME_KEY_PREFIX = 'mathquest:game:';
export const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
export const ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';

// Define the type here since it is not exported from types.ts
export interface GameParticipant {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    joinedAt?: number;
    score?: number;
    online?: boolean;
}

/**
 * Helper to get all participants for a game
 * @param accessCode The game access code
 * @returns Array of participant objects
 */
export async function getAllParticipants(accessCode: string): Promise<GameParticipant[]> {
    const participantsRaw = await redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);

    if (!participantsRaw) {
        return [];
    }

    return Object.values(participantsRaw).map(json => JSON.parse(json as string));
}
