const createLogger = require('../../logger');
const logger = createLogger('TournamentTriggers');
const { tournamentState } = require('./tournamentState');
// Import helpers at the top level now
const { sendQuestionWithState, handleTimerExpiration, calculateScore, saveParticipantScore } = require('./tournamentHelpers');

// --- Trigger Functions (Exported) ---

// Sends the question data and sets initial state, but DOES NOT start the timer itself.
// Timer is started via triggerTournamentTimerSet.
function triggerTournamentQuestion(io, code, index, linkedQuizId = null, initialTime = null) {
    const state = tournamentState[code];
    if (!state || !state.questions || index >= state.questions.length) {
        logger.error(`[TriggerQuestion] Invalid state or index for code ${code}, index ${index}`);
        return;
    }
    state.linkedQuizId = linkedQuizId; // Ensure linkedQuizId is set

    logger.debug(`[TriggerQuestion] Called: code=${code}, index=${index}, linkedQuizId=${linkedQuizId || 'none'}, initialTime=${initialTime}`);

    // Call sendQuestionWithState to emit the question and set base state
    // This now correctly resets paused/stopped flags.
    // No need for await here as the caller doesn't depend on the result immediately
    sendQuestionWithState(io, code, index, initialTime);

    // IMPORTANT: The timer is NOT started here. It must be started by a subsequent
    // call to triggerTournamentTimerSet (e.g., from quizHandler's setQuestion or timerAction).
    logger.debug(`[TriggerQuestion] Emitted question for ${code}. Timer must be started separately via triggerTournamentTimerSet.`);
}

// Pauses the currently running timer.
function triggerTournamentPause(io, code, remainingTime = null) {
    const state = tournamentState[code];
    if (!state || state.isDiffered || state.paused || state.stopped) {
        logger.warn(`[TriggerPause] Ignoring pause for ${code}. State: isDiffered=${state?.isDiffered}, paused=${state?.paused}, stopped=${state?.stopped}`);
        return; // Ignore if differed, already paused, or stopped
    }

    // Clear the active timer
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    // Calculate or use provided remaining time
    let pausedTime;
    if (typeof remainingTime === 'number') {
        pausedTime = remainingTime;
        logger.debug(`[TriggerPause] Using provided remaining time: ${pausedTime}s`);
    } else {
        const elapsed = (Date.now() - state.questionStart) / 1000;
        const timeAllowed = state.currentQuestionDuration || state.questions[state.currentIndex]?.temps || 20;
        pausedTime = Math.max(0, timeAllowed - elapsed);
        logger.debug(`[TriggerPause] Calculated remaining time: ${pausedTime}s (elapsed: ${elapsed}s, timeAllowed: ${timeAllowed}s)`);
    }

    // Update state
    state.paused = true;
    state.pausedRemainingTime = pausedTime;
    state.stopped = false; // Pausing overrides stopped

    logger.info(`[TriggerPause] Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
    io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "paused", remainingTime: state.pausedRemainingTime });
}

// Resumes a paused timer. Use triggerTournamentTimerSet(..., timeLeft, true) instead.
// This function is deprecated and will be removed after refactoring handlers.
function triggerTournamentResume(io, code) {
    logger.warn(`[DEPRECATED] triggerTournamentResume called for ${code}. Use triggerTournamentTimerSet(..., timeLeft, true) instead.`);
    const state = tournamentState[code];
    if (state && state.paused) {
        const timeLeft = state.pausedRemainingTime;
        triggerTournamentTimerSet(io, code, timeLeft, true); // Delegate to the main timer function
    }
}

// The primary function to control the timer: start, stop, edit duration.
// - timeLeft > 0: Starts or updates the timer. If forceActive=true, ensures it runs even if previously stopped/paused.
// - timeLeft = 0: Stops the timer and marks the state as stopped.
function triggerTournamentTimerSet(io, code, timeLeft, forceActive = false) {
    const state = tournamentState[code];
    if (!state || state.isDiffered) {
        logger.warn(`[TimerSet] Ignoring timer set for ${code}. State: exists=${!!state}, isDiffered=${state?.isDiffered}`);
        return; // Ignore if no state or differed mode
    }

    logger.info(`[TimerSet] Setting timer: code=${code}, timeLeft=${timeLeft}s, forceActive=${forceActive}`);
    // Add debug log for timer setup
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
        logger.debug(`[TimerSet] Cleared existing timer for ${code}`);
    }

    // --- Handle Stop Condition (timeLeft === 0) ---
    if (timeLeft === 0) {
        state.stopped = true;
        state.paused = false; // Stop overrides pause
        state.currentQuestionDuration = 0;
        state.pausedRemainingTime = null;
        logger.info(`[TimerSet] Stopping timer for ${code}.`);
        io.to(`tournament_${code}`).emit("tournament_set_timer", {
            timeLeft: 0,
            questionState: "stopped" // Use specific state for stop
        });
        // --- NEW: Also notify dashboard if quiz-linked ---
        if (state.linkedQuizId) {
            // Try to get the current question UID
            let questionUid = null;
            if (typeof state.currentIndex === 'number' && state.questions && state.questions[state.currentIndex]) {
                questionUid = state.questions[state.currentIndex].uid;
            }
            io.to(`quiz_${state.linkedQuizId}`).emit("quiz_timer_update", {
                status: 'stop',
                questionId: questionUid,
                timeLeft: 0,
                timestamp: Date.now()
            });
            logger.info(`[TimerSet] Emitted quiz_timer_update (stop) to quiz_${state.linkedQuizId} (questionId=${questionUid})`);
        }
        // Note: We don't call handleTimerExpiration here, stopping is an explicit action.
        return; // Stop processing here
    }

    // --- Handle Start/Resume/Edit Condition (timeLeft > 0) ---
    // Reset flags if forcing active state (e.g., on Play/Resume)
    if (forceActive) {
        state.stopped = false;
        state.paused = false;
        state.pausedRemainingTime = null;
        state.questionStart = Date.now(); // Reset start time for accurate rapidity on resume
        logger.info(`[TimerSet] forceActive=true: Reset stopped/paused flags, reset questionStart for ${code}`);
    } else {
        // If not forcing active, respect existing stopped/paused state when only *editing* timer
        if (state.stopped) {
            state.currentQuestionDuration = timeLeft; // Update duration but keep stopped
            logger.info(`[TimerSet] Updating duration to ${timeLeft}s for stopped tournament ${code}. It remains stopped.`);
            io.to(`tournament_${code}`).emit("tournament_set_timer", {
                timeLeft: timeLeft,
                questionState: "stopped"
            });
            return; // Stop processing, timer doesn't run
        }
        if (state.paused) {
            state.pausedRemainingTime = timeLeft; // Update remaining time but keep paused
            state.currentQuestionDuration = timeLeft; // Also update the intended duration
            logger.info(`[TimerSet] Updating remaining time to ${timeLeft}s for paused tournament ${code}. It remains paused.`);
            io.to(`tournament_set_timer`, {
                timeLeft: timeLeft,
                questionState: "paused"
            });
            return; // Stop processing, timer doesn't run yet
        }
        // If neither stopped nor paused, we are just editing the timer while it's running
        state.questionStart = Date.now(); // Reset start time as the duration changed
        logger.info(`[TimerSet] Editing running timer for ${code} to ${timeLeft}s. Resetting questionStart.`);
    }

    // If we reach here, the timer should be active (running)
    state.currentQuestionDuration = timeLeft; // Store the current duration
    state.paused = false; // Ensure not paused
    state.stopped = false; // Ensure not stopped

    logger.info(`[TimerSet] Starting timer for ${code} with duration ${timeLeft}s.`);
    io.to(`tournament_${code}`).emit("tournament_set_timer", {
        timeLeft: timeLeft,
        questionState: "active" // Timer is now active
    });
    // Emit explicit resume signal for UI best practice
    if (forceActive) {
        io.to(`tournament_${code}`).emit("tournament_question_state_update", {
            questionState: "active",
            remainingTime: timeLeft
        });
        logger.info(`[TimerSet] Emitted tournament_question_state_update (active) for ${code}`);
    }

    if (timeLeft > 0 && (!state.stopped && !state.paused)) {
        logger.info(`[TimerSet] Actually setting setTimeout for code=${code}, duration=${timeLeft}s`);
    }

    // Start the actual timer
    state.timer = setTimeout(() => {
        logger.info(`[TimerSet] setTimeout fired for code=${code}`);
        handleTimerExpiration(io, code);
    }, timeLeft * 1000);
}


// --- Force end of tournament, save scores, update leaderboard, emit redirect ---
// (forceTournamentEnd function remains largely the same, ensure logging uses new style)
async function forceTournamentEnd(io, code) {
    const state = tournamentState[code];
    if (!state) {
        logger.warn(`[ForceEnd] Ignoring force end for non-existent tournament ${code}`);
        return;
    }
    // Clear any running timer
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    const prisma = require('../../db');
    logger.info(`[ForceEnd] Forcing end of tournament ${code}`);

    const leaderboard = Object.values(state.participants || {})
        .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
        .sort((a, b) => b.score - a.score);
    logger.info(`[ForceEnd] Computed leaderboard for ${code}:`, leaderboard.length, 'participants');
    io.to(`tournament_${code}`).emit("tournament_end", { leaderboard });

    try {
        const tournoi = await prisma.tournoi.findUnique({ where: { code } });
        logger.info(`[ForceEnd] Prisma tournoi found: ${tournoi ? tournoi.id : 'not found'}`);
        if (tournoi) {
            for (const participant of Object.values(state.participants || {})) {
                if (!participant.isDiffered && participant.id && !participant.id.startsWith('socket_')) {
                    await saveParticipantScore(prisma, tournoi.id, participant);
                }
            }
            logger.info(`[ForceEnd] Updating tournoi ${code} leaderboard and status to 'terminé'`);
            await prisma.tournoi.update({ where: { code }, data: { date_fin: new Date(), statut: 'terminé', leaderboard } });
        }
    } catch (err) {
        logger.error(`[ForceEnd] Error saving scores/updating tournament ${code}:`, err);
    }

    logger.info(`[ForceEnd] Emitting tournament_finished_redirect to tournament_${code}`);
    io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
    delete tournamentState[code];
    logger.info(`[ForceEnd] Deleted tournament state for ${code}`);
}


module.exports = {
    triggerTournamentQuestion,
    triggerTournamentPause,
    // triggerTournamentResume, // Deprecated
    triggerTournamentTimerSet,
    forceTournamentEnd,
};
