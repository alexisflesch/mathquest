"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameAnswerHandler = gameAnswerHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const sharedLeaderboard_1 = require("../sharedLeaderboard");
const logger = (0, logger_1.default)('GameAnswerHandler');
function gameAnswerHandler(io, socket) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');
    // Define the handler function
    const handler = async (payload) => {
        // First log to ensure we're receiving the event
        console.log('[GAME_ANSWER EVENT RECEIVED]', payload, 'Socket ID:', socket.id, 'Connected:', socket.connected);
        logger.info({ socketId: socket.id, event: 'game_answer', payload, connected: socket.connected }, 'TOP OF HANDLER: gameAnswerHandler invoked');
        // Variable to track answer correctness, defined at the top level so it's available to all code paths
        let isCorrect = false;
        // Zod validation for payload
        const parseResult = socketEvents_zod_1.gameAnswerPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid payload',
                details: errorDetails
            }, 'Invalid game answer payload');
            const errorPayload = {
                message: 'Invalid game answer payload',
                code: 'INVALID_PAYLOAD',
                details: errorDetails
            };
            // Emit error response
            socket.emit('game_error', errorPayload);
            return;
        }
        const { accessCode, userId, questionId, answer, timeSpent } = parseResult.data;
        try {
            logger.debug({ accessCode, userId, questionId, answer, timeSpent }, 'Looking up gameInstance');
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    initiatorUserId: true,
                    playMode: true
                }
            });
            logger.debug({ gameInstance }, 'Result of gameInstance lookup');
            if (!gameInstance) {
                logger.warn({ socketId: socket.id, error: 'Game not found', accessCode }, 'EARLY RETURN: Game instance not found');
                const errorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: game not found');
                socket.emit('game_error', errorPayload);
                return;
            }
            if (gameInstance.isDiffered) {
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    logger.warn({ socketId: socket.id, error: 'Differed mode not available', accessCode }, 'EARLY RETURN: Differed window not available');
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: differed window not available');
                    socket.emit('game_error', errorPayload);
                    return;
                }
            }
            // Extra logging before participant lookup
            logger.debug({ accessCode, userId, questionId }, 'Looking up participant');
            let participant;
            try {
                participant = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId },
                    include: { user: true }
                });
            }
            catch (err) {
                logger.error({ err, accessCode, userId, questionId }, 'Error during participant lookup');
                socket.emit('game_error', { message: 'Error looking up participant.' });
                return;
            }
            logger.debug({ participant }, 'Result of participant lookup');
            if (!participant) {
                logger.warn({ socketId: socket.id, error: 'Participant not found', userId, gameInstanceId: gameInstance.id }, 'EARLY RETURN: Participant not found');
                const errorPayload = { message: 'Participant not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: participant not found');
                socket.emit('game_error', errorPayload);
                return;
            }
            if (gameInstance.isDiffered && participant.completedAt) {
                logger.warn({ socketId: socket.id, error: 'Already completed', userId, gameInstanceId: gameInstance.id }, 'EARLY RETURN: Already completed tournament');
                const errorPayload = { message: 'You have already completed this tournament.' };
                logger.warn({ errorPayload }, 'Emitting game_error: already completed');
                socket.emit('game_error', errorPayload);
                return;
            }
            const participantService = new gameParticipantService_1.GameParticipantService();
            logger.debug({ userId, gameInstanceId: gameInstance.id, questionId, answer, timeSpent }, 'Calling participantService.submitAnswer');
            await participantService.submitAnswer(gameInstance.id, userId, {
                questionUid: questionId,
                answer,
                timeTakenMs: timeSpent
            });
            // Determine if the answer is correct
            const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionId } });
            if (question && Array.isArray(question.correctAnswers) && typeof answer === 'number' && answer >= 0 && answer < question.correctAnswers.length) {
                isCorrect = question.correctAnswers[answer] === true;
                logger.debug({ isCorrect, questionId, answer }, 'Determined answer correctness');
            }
            // Refetch participant to get updated score
            const updatedParticipant = await prisma_1.prisma.gameParticipant.findUnique({
                where: { id: participant.id },
                include: { user: true }
            });
            logger.debug({ updatedParticipant }, 'Result of updated participant lookup');
            if (!updatedParticipant || !updatedParticipant.user) {
                logger.warn({ socketId: socket.id, error: 'Error fetching updated participant', participantId: participant.id }, 'EARLY RETURN: Error fetching updated participant');
                // This should ideally not happen if the previous findFirst succeeded
                const errorPayload = { message: 'Error fetching updated participant data.' };
                logger.warn({ errorPayload }, 'Emitting game_error: error fetching updated participant');
                socket.emit('game_error', errorPayload);
                return;
            }
            // Use shared leaderboard calculation
            const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
            logger.debug({ leaderboard }, 'Leaderboard data');
            if (gameInstance.isDiffered) {
                // Self-paced mode: no leaderboard, use only documented events
                // 1. Get the current question and check correctness
                const question = await prisma_1.prisma.question.findUnique({ where: { uid: questionId } });
                // 2. Send answer_received (always) with correctness info and correct answers
                socket.emit('answer_received', {
                    questionId,
                    timeSpent,
                    correct: isCorrect,
                    correctAnswers: question && Array.isArray(question.correctAnswers) ? question.correctAnswers : undefined,
                    explanation: question?.explanation || undefined
                });
                // 3. Get GameInstance to find gameTemplateId
                const gameInst = await prisma_1.prisma.gameInstance.findUnique({ where: { id: participant.gameInstanceId } });
                if (!gameInst) {
                    socket.emit('game_error', { message: 'Game instance not found for participant.' });
                    return;
                }
                const allQuestions = await prisma_1.prisma.questionsInGameTemplate.findMany({
                    where: { gameTemplateId: gameInst.gameTemplateId },
                    orderBy: { sequence: 'asc' }
                });
                // 4. Use participant.answers (array) to determine which questions are answered
                const answersArr = Array.isArray(participant.answers) ? participant.answers : [];
                // For practice mode, we don't automatically send the next question
                // Instead, the client will request the next question after showing feedback
                logger.info({ accessCode, userId, questionId }, 'Waiting for client to request next question via request_next_question event');
                // Count total answered questions to determine if this was the last one
                console.log(`[GAME_ANSWER] Raw answers array:`, JSON.stringify(answersArr));
                // More robust extraction of questionUid
                const answeredQuestions = [];
                for (const a of answersArr) {
                    if (a && typeof a === 'object' && 'questionUid' in a && typeof a.questionUid === 'string') {
                        answeredQuestions.push(a.questionUid);
                    }
                }
                // Add the current question if it's missing from the answers array
                if (questionId && !answeredQuestions.includes(questionId)) {
                    console.log(`[GAME_ANSWER] Adding current questionId ${questionId} to answered questions`);
                    answeredQuestions.push(questionId);
                }
                const answeredSet = new Set(answeredQuestions);
                const totalQuestions = allQuestions.length;
                console.log(`[GAME_ANSWER] Found ${answeredSet.size}/${totalQuestions} answered questions:`, Array.from(answeredSet));
                logger.debug({
                    answeredQuestions,
                    totalQuestions,
                    answeredSetSize: answeredSet.size,
                    allQuestionIds: allQuestions.map(q => q.questionUid)
                }, 'Checking if all questions are answered');
                // Check if this was the last question, but don't automatically end the game
                console.log(`[GAME_ANSWER] Checking if all questions are answered: answeredSet.size=${answeredSet.size}, totalQuestions=${totalQuestions}`);
                logger.debug({
                    answeredSet: Array.from(answeredSet),
                    totalQuestions,
                    answersArr: JSON.stringify(answersArr)
                }, 'Detailed answer checking');
                if (answeredSet.size >= totalQuestions) {
                    // This is the last question - but we'll wait for the player to request the end of game
                    // after they've reviewed the feedback for the last question
                    console.log(`[GAME_ANSWER] All questions answered! Waiting for player to request game end via request_next_question`);
                    logger.info({ accessCode, userId, questionId }, 'All questions answered, waiting for request_next_question to complete game');
                    // We've answered all questions, but we don't automatically send game_ended
                    // The client will call request_next_question after showing feedback, 
                    // and that handler will detect that there are no more questions and end the game
                }
                else {
                    console.log(`[GAME_ANSWER] Not all questions answered yet. Waiting for client to request next question.`);
                }
            }
            else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
                    roomName = `game_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit('leaderboard_update', { leaderboard });
            }
            // We've already sent the answer_received event for differed mode, so only emit it here for non-differed mode
            if (!gameInstance.isDiffered) {
                logger.info({ questionId, timeSpent }, 'Emitting answer_received for non-differed mode');
                try {
                    // Make sure we send back a response even if something fails
                    // Use the isCorrect value if available, otherwise default to false
                    socket.emit('answer_received', { questionId, timeSpent, correct: isCorrect !== undefined ? isCorrect : false });
                    console.log(`[GAME_ANSWER] Successfully emitted answer_received for question ${questionId} to socket ${socket.id}`);
                }
                catch (emitError) {
                    logger.error({ emitError, socketId: socket.id }, 'Error emitting answer_received');
                    console.error('[GAME_ANSWER] Error emitting answer_received:', emitError);
                }
            }
        }
        catch (err) {
            logger.error({ err, accessCode, userId, questionId }, 'Unexpected error in gameAnswerHandler');
            try {
                // Try to send error response
                socket.emit('game_error', { message: 'Unexpected error during answer submission.' });
                // Also send back answer_received to unblock the client
                if (questionId && timeSpent !== undefined) {
                    socket.emit('answer_received', { questionId, timeSpent, correct: false });
                    console.log(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionId}`);
                }
            }
            catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error sending error response');
            }
        }
    };
    // Handle the next_question event for practice mode
    // Add the handler to the socket
    socket.on('game_answer', handler);
    return handler;
}
