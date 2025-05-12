import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PauseResumePayload } from '../types/socketTypes';
import { quizState } from '../quizState.js'; // MODIFIED

// Import tournamentState from legacy JS using require for consistency
const { tournamentState } = require('../tournamentUtils/tournamentState.legacy.js');

// Import logger using require until logger module is converted to TypeScript
const createLogger = require('../../logger');
// Import from the legacy file for consistency during transition
const {
    patchQuizStateForBroadcast,
    updateChrono,
    emitQuizTimerUpdate
} = require('../quizUtils.legacy.js');
const { triggerTournamentTimerSet } = require('../tournamentUtils/tournamentTriggers.js'); // MODIFIED

const logger = createLogger('ResumeQuizHandler');

function handleResume(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizId, teacherId, tournamentCode }: PauseResumePayload
): void {
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[ResumeQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }

    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    logger.info(`[ResumeQuiz] Resuming quiz ${quizId}`);

    // Get the tournament code if not provided
    const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);

    // Get the correct timeLeft from the backend state as the single source of truth
    let timeLeft = null;
    if (code && tournamentState[code] && tournamentState[code].pausedRemainingTime > 0) {
        // Use tournament's stored pausedRemainingTime as the source of truth
        timeLeft = tournamentState[code].pausedRemainingTime;
        logger.info(`[ResumeQuiz] Using tournament pausedRemainingTime=${timeLeft}s as source of truth`);

        // Update quiz state with the tournament's time
        quizState[quizId].chrono.timeLeft = timeLeft;
        quizState[quizId].timerTimeLeft = timeLeft;
    } else {
        // Fallback to quiz state if no tournament
        timeLeft = quizState[quizId].chrono.timeLeft || 0;
        logger.info(`[ResumeQuiz] No tournament or pausedRemainingTime, using quizState timeLeft=${timeLeft}s`);
    }

    logger.info(`[ResumeQuiz] Resuming with timeLeft=${timeLeft}s from paused state`);

    // Add logging for any assignment to currentQuestionUid
    Object.defineProperty(quizState[quizId], 'currentQuestionUid', {
        set(value) {
            logger.debug(`[ResumeHandler] Set currentQuestionUid = ${value} for quizId=${quizId} (stack: ${new Error().stack})`);
            this._currentQuestionUid = value;
        },
        get() {
            return this._currentQuestionUid;
        },
        configurable: true
    });

    // Update quiz state flags
    quizState[quizId] = updateChrono(quizState[quizId], timeLeft, 'play');
    quizState[quizId].timerStatus = 'play';
    quizState[quizId].timerTimestamp = Date.now(); // Reset timestamp for the new run period
    quizState[quizId].timerInitialValue = timeLeft; // Store for calculation reference

    // First emit the quiz_state (with updated values) to clients
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);

    // Then emit the timer update separately for precise timing
    const currentQuestionUid = quizState[quizId].timerQuestionId || quizState[quizId].currentQuestionUid;
    emitQuizTimerUpdate(io, quizId, 'play', currentQuestionUid, timeLeft);

    logger.debug(`[ResumeQuiz] Emitted quiz_state and timer update for ${quizId}`);

    // Emit success message after resuming the quiz
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz resumed successfully.'
    });

    // If we have a tournament, handle its timer separately
    if (code) {
        logger.info(`[ResumeQuiz] Triggering timer set (resume) for linked tournament ${code} with timeLeft=${timeLeft}s`);
        // Explicitly pass timeLeft rather than null, to ensure the tournament uses the correct value
        triggerTournamentTimerSet(io, code, timeLeft, 'running'); // MODIFIED
    } else {
        logger.warn(`[ResumeQuiz] No linked tournament found for quiz ${quizId}`);
    }

    // Mark this quiz as explicitly handled by resumeHandler to avoid duplicate processing
    quizState[quizId].resumeHandled = Date.now();
}

export default handleResume;
