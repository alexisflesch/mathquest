/**
 * setQuestionHandler.ts - Handler for setting the active question in a quiz template dashboard
 * 
 * Updates the quiz template dashboard state with the new question.
 * This handler is used in the teacher dashboard for QuizTemplates to manage
 * which question is currently being displayed and configured.
 * 
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question within a QuizTemplate.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { QuizTemplateDashboardSetQuestionPayload } from '../types/socketTypes'; // Using new payload type
import { QuizState } from '../types/quizTypes';
import { quizState, getQuestionTimer } from '../quizState';
import {
    patchQuizStateForBroadcast,
    initializeChrono,
    calculateRemainingTime,
    updateQuestionTimer,
    emitQuizTimerUpdate
} from '../quizUtils';
import { sendQuestion as sendSharedQuestion } from '../sharedLiveLogic/sendQuestion'; // Added import

// Import logger using ES import
import createLogger from '../../logger';
const logger = createLogger('QuizTemplateDashboardSetQuestionHandler'); // Renamed logger

/**
 * Handle quiz_template_dashboard_set_question event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 * @param payload - Event payload containing quizTemplateId, questionUid, etc.
 */
async function handleSetQuestion(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizTemplateId, questionUid, questionIdx, teacherId, startTime, preserveTimer }: QuizTemplateDashboardSetQuestionPayload
): Promise<void> {
    // Initialize quizState if it doesn't exist
    if (!quizState[quizTemplateId]) {
        logger.info(`[SetQuestion] Creating new quiz template dashboard state for quizTemplateId=${quizTemplateId}`);
        quizState[quizTemplateId] = {
            currentQuestionUid: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            profTeacherId: teacherId || '',
            timerStatus: 'stop',
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set<string>(),
            questionTimers: {},
        };
    }

    // Validate access
    if (quizState[quizTemplateId].profTeacherId !== teacherId) {
        logger.warn(`[SetQuestion] Unauthorized attempt for template ${quizTemplateId} from socket ${socket.id} (teacherId=${teacherId})`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Accès non autorisé.'
        });
        return;
    }

    // Update teacher socket ID in state
    quizState[quizTemplateId].profSocketId = socket.id;

    logger.info(`[SetQuestion] Setting current question for quizTemplateId=${quizTemplateId} to questionUid=${questionUid}`);

    // Find the question in the state
    const questionObj = quizState[quizTemplateId].questions.find(q => q.uid === questionUid);
    if (!questionObj) {
        logger.error(`[SetQuestion] Question ${questionUid} not found in template ${quizTemplateId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Question introuvable.'
        });
        return;
    }

    // Update current question information
    quizState[quizTemplateId].currentQuestionUid = questionUid;

    // If questionIdx was provided, update it
    if (typeof questionIdx === 'number') {
        quizState[quizTemplateId].currentQuestionIdx = questionIdx;
    } else {
        // Calculate index from UID
        const idx = quizState[quizTemplateId].questions.findIndex(q => q.uid === questionUid);
        quizState[quizTemplateId].currentQuestionIdx = idx >= 0 ? idx : null;
    }

    // Initialize or reset timer for this question if not preserving existing timer
    if (!preserveTimer) {
        const questionTime = questionObj.time || 20; // Default to 20 seconds if not specified

        // Ensure questionTimers exists
        if (!quizState[quizTemplateId].questionTimers) {
            quizState[quizTemplateId].questionTimers = {};
        }

        // Initialize timer for this question if not already present
        if (!quizState[quizTemplateId].questionTimers[questionUid]) {
            quizState[quizTemplateId].questionTimers[questionUid] = {
                status: 'stop',
                timeLeft: questionTime,
                initialTime: questionTime,
                timestamp: null
            };
        }

        // Update state with timer info from this question
        quizState[quizTemplateId].timerStatus = 'stop';
        quizState[quizTemplateId].timerQuestionId = questionUid;
        quizState[quizTemplateId].timerTimeLeft = quizState[quizTemplateId].questionTimers[questionUid].timeLeft;
        quizState[quizTemplateId].timerTimestamp = null;

        // Reset chrono state
        quizState[quizTemplateId].chrono = {
            timeLeft: quizState[quizTemplateId].questionTimers[questionUid].timeLeft,
            running: false
        };
    } else if (startTime !== undefined) {
        // If preserving timer and start time specified, update with provided value
        logger.info(`[SetQuestion] Preserving timer with explicit start time: ${startTime}s for question ${questionUid}`);

        // Ensure timer data structure exists
        if (!quizState[quizTemplateId].questionTimers) {
            quizState[quizTemplateId].questionTimers = {};
        }

        if (!quizState[quizTemplateId].questionTimers[questionUid]) {
            quizState[quizTemplateId].questionTimers[questionUid] = {
                status: 'stop',
                timeLeft: startTime,
                initialTime: startTime,
                timestamp: null
            };
        } else {
            // Update existing timer data
            quizState[quizTemplateId].questionTimers[questionUid].timeLeft = startTime;
        }

        quizState[quizTemplateId].timerStatus = 'stop';
        quizState[quizTemplateId].timerQuestionId = questionUid;
        quizState[quizTemplateId].timerTimeLeft = startTime;
        quizState[quizTemplateId].timerTimestamp = null;

        // Reset chrono state
        quizState[quizTemplateId].chrono = {
            timeLeft: startTime,
            running: false
        };
    }

    // Broadcast updated state to all clients in the dashboard room
    const roomName = `quiz_template_dashboard_${quizTemplateId}`;
    const patchedState = patchQuizStateForBroadcast(quizState[quizTemplateId]);

    io.to(roomName).emit('quiz_template_dashboard_state', patchedState);

    logger.info(`[SetQuestion] Emitted updated state to room ${roomName} with currentQuestionUid=${questionUid}`);

    // Send success response to the requesting client
    socket.emit('quiz_action_response', {
        status: 'success',
        message: 'Question définie avec succès.'
    });
}

export default handleSetQuestion;
