import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { GAME_EVENTS } from '@shared/types/socket/events';

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
    avatarEmoji?: string;
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

/**
 * Send the first question to a socket (practice) or room (quiz), and start timer if needed.
 * @param io Socket.IO server
 * @param target Socket or room string
 * @param gameInstance Prisma gameInstance (with template)
 * @param questionsInTemplate Ordered list of questions
 * @param mode 'practice' | 'quiz'
 */
export async function sendFirstQuestionAndStartTimer({
    io,
    target,
    gameInstance,
    questionsInTemplate,
    mode
}: {
    io: any,
    target: any, // Socket or room string
    gameInstance: any,
    questionsInTemplate: any[],
    mode: 'practice' | 'quiz'
}) {
    logger.info({ gameInstanceId: gameInstance.id, targetId: target.id, mode, questionsCount: questionsInTemplate.length }, 'Inside sendFirstQuestionAndStartTimer');
    if (!questionsInTemplate.length) {
        logger.warn({ gameInstanceId: gameInstance.id, mode }, 'No questions in template, cannot send first question.');
        return;
    }
    const firstQ = questionsInTemplate[0].question;

    // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
    const { filterQuestionForClient } = await import('@/../../shared/types/quiz/liveQuestion');
    const filteredQuestion = filterQuestionForClient(firstQ);

    const payload = {
        question: filteredQuestion,
        index: 0,
        timer: firstQ.timeLimit || 30 // Include timer duration
    };
    if (mode === 'practice') {
        // target is a socket
        logger.info({ targetSocketId: target.id, event: 'game_question', payloadJson: JSON.stringify(payload) }, 'Emitting game_question to practice mode socket');

        // Check if the socket is connected and valid
        logger.info({ socketConnected: target.connected, socketId: target.id }, 'Socket connection state');

        try {
            // Emit with an explicit acknowledgement callback
            target.emit('game_question', payload, (ack: any) => {
                logger.info({ ack }, 'game_question acknowledged');
            });
            logger.info('game_question event emitted');
        } catch (err) {
            logger.error({ err }, 'Error emitting game_question');
        }
    } else {
        // target is a room string
        io.to(target).emit('game_question', payload);
    }
    // Timer logic (if needed)
    // For practice, timer is per-player; for quiz, timer is per-room/teacher controlled
    // (Implement timer logic here if required)
}
