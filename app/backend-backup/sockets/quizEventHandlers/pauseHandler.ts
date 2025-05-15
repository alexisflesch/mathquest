import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PauseResumePayload } from '../types/socketTypes';
import { quizState } from '../quizState';
import { tournamentState } from '../tournamentUtils/tournamentState';
import {
    patchQuizStateForBroadcast,
    calculateRemainingTime,
    emitQuizTimerUpdate,
    synchronizeTimerValues
} from '../quizUtils';
import { triggerTournamentTimerSet } from '../tournamentUtils/tournamentTriggers';
import { triggerQuizTimerAction } from '../quizTriggers';

// Import logger
import createLogger from '../../logger';

const logger = createLogger('PauseQuizHandler');

// Helper function to log sockets in a room
async function logSocketsInRoom(io: Server, quizId: string): Promise<void> {
    const socketsInRoom = await io.in(`dashboard_${quizId}`).fetchSockets();
    logger.debug(`[PauseQuiz] Sockets in room dashboard_${quizId}:`, socketsInRoom.map(socket => socket.id));
}

async function handlePause(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizId, teacherId, tournamentCode }: PauseResumePayload
): Promise<void> {
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        prisma.quiz.findUnique({ where: { id: quizId }, select: { enseignant_id: true } }).then(async quiz => {
            if (!quiz || quiz.enseignant_id !== teacherId) {
                logger.warn(`[PauseQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
                io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                    status: 'error',
                    message: 'Erreur : accès non autorisé.'
                });
                return;
            }
            // Log all sockets in the room before emitting the event
            await logSocketsInRoom(io, quizId);

            // Emit success message after pausing the quiz
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'success',
                message: 'Quiz mis en pause.'
            });
            logger.info(`[PauseQuiz] Emitting quiz_action_response to dashboard_${quizId}`);

            // Update in-memory state for future requests
            quizState[quizId].profTeacherId = teacherId;
            // Update profSocketId to current socket
            quizState[quizId].profSocketId = socket.id;

            logger.info(`[PauseQuiz] Pausing quiz ${quizId}`);

            // Get the tournament code if not provided
            const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);

            // Synchronize timer values between quiz and tournament states
            let remaining = null;
            if (code) {
                // Calculate remaining time first
                remaining = calculateRemainingTime(quizState[quizId].chrono, quizState[quizId].timerTimestamp);
                // Then synchronize the values
                synchronizeTimerValues(quizId, code, remaining);
                logger.info(`[PauseQuiz] Synchronized with tournament ${code}, timeLeft=${remaining}s`);
            } else {
                remaining = calculateRemainingTime(quizState[quizId].chrono, quizState[quizId].timerTimestamp);
                logger.info(`[PauseQuiz] No tournament linked, calculated timeLeft=${remaining}s`);
            }

            // Update quiz state flags
            quizState[quizId].chrono.timeLeft = remaining; // Update quiz state remaining time
            quizState[quizId].chrono.running = false;

            // Mark this quiz as explicitly handled by pauseHandler to avoid duplicate processing
            quizState[quizId].pauseHandled = Date.now();

            // First emit the quiz_state (with updated values) to clients
            io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
            io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);

            // Then emit the timer update separately for precise timing
            const currentQuestionUid = quizState[quizId].timerQuestionId || quizState[quizId].currentQuestionUid;
            // Ensure currentQuestionUid is not null
            if (currentQuestionUid) {
                emitQuizTimerUpdate(io, quizId, 'pause', currentQuestionUid, remaining);
            } else {
                logger.warn(`[PauseQuiz] Missing currentQuestionUid for quiz ${quizId}`);
                emitQuizTimerUpdate(io, quizId, 'pause', '', remaining);
            }

            logger.debug(`[PauseQuiz] Emitted quiz_state and timer update for ${quizId}`);

            // Use tournamentCode from payload if present, else fallback
            if (code) {
                logger.info(`[PauseQuiz] Triggering pause for linked tournament ${code} with remaining time ${remaining}s`);
                triggerTournamentTimerSet(io, code, remaining, 'paused'); // MODIFIED
            } else {
                logger.warn(`[PauseQuiz] No linked tournament found for quiz ${quizId}`);
            }
        });
        return;
    }
    // Log all sockets in the room before emitting the event
    await logSocketsInRoom(io, quizId);

    // Emit success message after pausing the quiz
    logger.debug(`[PauseQuiz] Emitting quiz_action_response payload:`, {
        status: 'success',
        message: 'Quiz paused successfully.'
    });
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz paused successfully.'
    });
    logger.info(`[PauseQuiz] Emitting quiz_action_response to dashboard_${quizId}`);

    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    logger.info(`[PauseQuiz] Pausing quiz ${quizId}`);

    // Get the tournament code if not provided
    const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);

    // Synchronize timer values between quiz and tournament states
    let remaining = null;
    if (code) {
        // Calculate remaining time first
        remaining = calculateRemainingTime(quizState[quizId].chrono, quizState[quizId].timerTimestamp);
        // Then synchronize the values
        synchronizeTimerValues(quizId, code, remaining);
        logger.info(`[PauseQuiz] Synchronized with tournament ${code}, timeLeft=${remaining}s`);
    } else {
        remaining = calculateRemainingTime(quizState[quizId].chrono, quizState[quizId].timerTimestamp);
        logger.info(`[PauseQuiz] No tournament linked, calculated timeLeft=${remaining}s`);
    }

    // Update quiz state flags
    quizState[quizId].chrono.timeLeft = remaining; // Update quiz state remaining time
    quizState[quizId].chrono.running = false;

    // Mark this quiz as explicitly handled by pauseHandler to avoid duplicate processing
    quizState[quizId].pauseHandled = Date.now();

    // First emit the quiz_state (with updated values) to clients
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Then emit the timer update separately for precise timing
    const currentQuestionUid = quizState[quizId].timerQuestionId || quizState[quizId].currentQuestionUid;
    // Ensure currentQuestionUid is not null
    if (currentQuestionUid) {
        emitQuizTimerUpdate(io, quizId, 'pause', currentQuestionUid, remaining);
    } else {
        logger.warn(`[PauseQuiz] Missing currentQuestionUid for quiz ${quizId}`);
        emitQuizTimerUpdate(io, quizId, 'pause', '', remaining);
    }

    // Pause only the current question's timer in quiz mode
    if (currentQuestionUid !== null) {
        triggerQuizTimerAction(io, quizId, currentQuestionUid, 'pause');
        logger.info(`[PauseQuiz] Paused timer for quizId=${quizId}, questionId=${currentQuestionUid}`);
    }

    logger.debug(`[PauseQuiz] Emitted quiz_state and timer update for ${quizId}`);

    // Use tournamentCode from payload if present, else fallback
    if (code) {
        logger.info(`[PauseQuiz] Triggering pause for linked tournament ${code} with remaining time ${remaining}s`);
        triggerTournamentTimerSet(io, code, remaining, 'paused'); // MODIFIED
    } else {
        logger.warn(`[PauseQuiz] No linked tournament found for quiz ${quizId}`);
    }
}

export default handlePause;
