import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import { GAME_EVENTS } from '@shared/types/socket/events';
import { GameParticipant } from '@shared/types/core';

// Create a helper-specific logger
const logger = createLogger('GameHelpers');

// Redis key prefixes
export const GAME_KEY_PREFIX = 'mathquest:game:';
export const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
export const ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';

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

    // Modernized: Canonical, flat payload for game_question
    const { questionDataForStudentSchema } = await import('@/../../shared/types/socketEvents.zod');
    let canonicalPayload = {
        ...filteredQuestion,
        currentQuestionIndex: 0,
        totalQuestions: 1
    };

    // Ensure timeLimit is present and valid (schema requires positive integer)
    if (canonicalPayload.timeLimit == null || canonicalPayload.timeLimit <= 0) {
        logger.warn(`Question ${canonicalPayload.uid} has invalid timeLimit: ${canonicalPayload.timeLimit}, using default 30s`);
        canonicalPayload.timeLimit = 30; // Default to 30 seconds
    }
    const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
    if (!parseResult.success) {
        logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
        return;
    }
    if (mode === 'practice') {
        // target is a socket
        logger.info({ targetSocketId: target.id, event: 'game_question', payloadJson: JSON.stringify(canonicalPayload) }, 'Emitting canonical game_question to practice mode socket');
        logger.info({ socketConnected: target.connected, socketId: target.id }, 'Socket connection state');
        try {
            target.emit('game_question', canonicalPayload);
            logger.info('game_question event emitted');
        } catch (err) {
            logger.error({ err }, 'Error emitting game_question');
        }
    } else {
        // target is a room string
        io.to(target).emit('game_question', canonicalPayload);
    }
    // Timer logic (if needed)
    // For practice, timer is per-player; for quiz, timer is per-room/teacher controlled
    // (Implement timer logic here if required)
}
