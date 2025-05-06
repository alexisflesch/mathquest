const createLogger = require('../../logger');
const logger = createLogger('TimerActionHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentPause, triggerTournamentTimerSet, triggerTournamentQuestion } = require('../tournamentHandler'); // Import triggerTournamentQuestion
const prisma = require('../../db'); // Ensure prisma is required
const { patchQuizStateForBroadcast } = require('../quizUtils');

async function handleTimerAction(io, socket, prisma, { status, questionId, timeLeft, quizId, teacherId, tournamentCode }) {
    logger.info(`[TimerAction] Received: status=${status}, question=${questionId}, timeLeft=${timeLeft}, quizId=${quizId}, teacherId=${teacherId}, tournamentCode=${tournamentCode}`);

    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { enseignant_id: true } });
        if (!quiz || quiz.enseignant_id !== teacherId) {
            logger.warn(`[TimerAction] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
            return;
        }
        // Update in-memory state for future requests
        quizState[quizId].profTeacherId = teacherId;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    // Teacher/Auth check (optional but recommended)
    // ...

    // --- Update Quiz State --- (This part remains largely the same)
    // If resuming, potentially use edited time from question state
    if (status === 'play' && quizState[quizId].timerStatus === 'pause' && quizState[quizId].timerQuestionId === questionId) {
        const currentQuestionIdx = quizState[quizId].currentQuestionIdx;
        if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0) {
            const currentQuestion = quizState[quizId].questions[currentQuestionIdx];
            if (currentQuestion && typeof currentQuestion.temps === 'number' && quizState[quizId].chrono.timeLeft !== currentQuestion.temps) {
                logger.info(`[TimerAction] Resuming with updated timer value: ${currentQuestion.temps}s instead of ${timeLeft}s`);
                timeLeft = currentQuestion.temps;
            }
        }
    }

    // --- DEBUG: Log timer state before updating ---
    logger.debug('[TimerAction][BEFORE UPDATE]', {
        quizId,
        status,
        questionId,
        timeLeft,
        timerStatus: quizState[quizId].timerStatus,
        timerQuestionId: quizState[quizId].timerQuestionId,
        timerTimeLeft: quizState[quizId].timerTimeLeft,
        chrono: quizState[quizId].chrono,
        timerTimestamp: quizState[quizId].timerTimestamp,
    });

    // PATCH: If stopping, force all timer fields to 0
    if (status === 'stop') {
        quizState[quizId].timerTimeLeft = 0;
        quizState[quizId].chrono.timeLeft = 0;
        quizState[quizId].chrono.running = false;
    } else {
        quizState[quizId].timerTimeLeft = timeLeft;
        quizState[quizId].chrono.timeLeft = timeLeft;
        quizState[quizId].chrono.running = status === 'play';
    }
    quizState[quizId].timerStatus = status;
    quizState[quizId].timerQuestionId = questionId;
    quizState[quizId].timerTimestamp = Date.now();

    // --- DEBUG: Log timer state after updating ---
    logger.debug('[TimerAction][AFTER UPDATE]', {
        quizId,
        status,
        questionId,
        timeLeft,
        timerStatus: quizState[quizId].timerStatus,
        timerQuestionId: quizState[quizId].timerQuestionId,
        timerTimeLeft: quizState[quizId].timerTimeLeft,
        chrono: quizState[quizId].chrono,
        timerTimestamp: quizState[quizId].timerTimestamp,
    });

    io.to(`quiz_${quizId}`).emit("quiz_timer_update", {
        status,
        questionId,
        timeLeft,
        timestamp: quizState[quizId].timerTimestamp,
    });
    io.to(`projection_${quizId}`).emit("quiz_timer_update", {
        status,
        questionId,
        timeLeft,
        timestamp: quizState[quizId].timerTimestamp,
    });

    // Patch: Recalculate timer for dashboard broadcast
    io.to(`quiz_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[TimerAction] Emitted quiz_timer_update & quiz_state to quiz_${quizId} and projection_${quizId}`);

    // --- Update Tournament State using Triggers --- 
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { tournament_code: true }
        });
        // Use tournamentCode from payload if present, else fallback
        const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);

        if (code && tournamentState[code]) { // Ensure tournament state exists
            logger.info(`[TimerAction] Found linked tournament ${code}. Applying action: ${status}`);

            // Use trigger functions based on status
            switch (status) {
                case 'play':
                    // If resuming from stop, need to re-send question info
                    if (tournamentState[code].stopped) {
                        logger.info(`[TimerAction] Resuming from STOP for ${code}. Re-triggering question.`);
                        const idx = tournamentState[code].currentIndex;
                        // Re-trigger question first (sets state, emits question)
                        triggerTournamentQuestion(io, code, idx, quizId, timeLeft);
                    }
                    // Always set the timer (starts/resumes)
                    // forceActive = true ensures it runs even if paused/stopped
                    triggerTournamentTimerSet(io, code, timeLeft, true);
                    break;
                case 'pause':
                    // Pass the current timeLeft from quiz state as remainingTime
                    triggerTournamentPause(io, code, timeLeft);
                    break;
                case 'stop':
                    // Setting timeLeft to 0 stops the timer via the trigger
                    triggerTournamentTimerSet(io, code, 0);
                    break;
                default:
                    logger.warn(`[TimerAction] Unknown status received: ${status}`);
            }

            // Update DB status to 'en cours' only on the first 'play' action if needed
            if (status === 'play' && tournamentState[code].statut !== 'en cours') {
                logger.info(`[TimerAction] Attempting to update Tournoi ${code} status to 'en cours' in database...`);
                try {
                    await prisma.tournoi.update({
                        where: { code: code },
                        data: { statut: 'en cours' },
                    });
                    tournamentState[code].statut = 'en cours'; // Update in-memory status too
                    logger.info(`[TimerAction] Successfully updated Tournoi ${code} status to 'en cours'.`);
                } catch (dbError) {
                    logger.error(`[TimerAction] Failed to update Tournoi ${code} status to 'en cours' in database:`, dbError);
                }
            }

        } else if (code) {
            logger.warn(`[TimerAction] Tournament state for code ${code} not found in memory. Cannot apply action.`);
        } else {
            logger.warn(`[TimerAction] No tournament linked to quiz ${quizId}. Cannot apply action.`);
        }
    } catch (err) {
        logger.error(`[TimerAction] Error handling action:`, err);
    }
}

module.exports = handleTimerAction;
