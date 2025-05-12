const { quizState, getQuestionTimer } = require('./quizState');
const createLogger = require('../logger'); // Ensure logger is imported
const logger = createLogger('QuizUtils'); // Create a logger instance

// Utilitaire pour émettre le nombre de connectés UNIQUEMENT dans le tournoi actif
async function emitQuizConnectedCount(io, prisma, code) {
    if (!code) return;
    let quizId = null;
    try {
        const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
        if (quiz && quiz.id) quizId = quiz.id;
    } catch (e) {
        console.error('[QUIZ_CONNECTED] Erreur récupération quizId pour code', code, e);
    }
    if (!quizId) return;

    // Count sockets in both the live tournament room and the lobby rooms
    const liveRoom = io.sockets.adapter.rooms.get(`live_${code}`) || new Set();
    const lobbyRoom = io.sockets.adapter.rooms.get(`${code}`) || new Set();
    const lobbyRoomAlt = io.sockets.adapter.rooms.get(`lobby_${code}`) || new Set();

    // Combine all socket IDs (Set to avoid duplicates)
    const allSocketIds = new Set([
        ...liveRoom,
        ...lobbyRoom,
        ...lobbyRoomAlt
    ]);

    const room = io.sockets.adapter.rooms.get(`dashboard_${quizId}`);
    console.info('[QUIZ_CONNECTED] quiz_connected_count room members:', room ? Array.from(room) : []);

    // Récupère le socketId du prof pour ce quiz
    const profSocketId = quizState[quizId]?.profSocketId;

    // Exclut le prof du comptage
    let totalCount = 0;
    for (const socketId of allSocketIds) {
        if (socketId !== profSocketId) totalCount++;
    }

    console.info(`[QUIZ_CONNECTED] EMIT quiz_connected_count quizId=${quizId} code=${code} totalSansProf=${totalCount}`);
    io.to(`dashboard_${quizId}`).emit("quiz_connected_count", { count: totalCount });
    // Also emit directly to the teacher's socket if available
    if (profSocketId) {
        io.to(profSocketId).emit("quiz_connected_count", { count: totalCount });
    }
}

// Centralized function to emit quiz_timer_update
function emitQuizTimerUpdate(io, quizId, status, questionId, timeLeft) {
    io.to(quizId).emit('quiz_timer_update', { quizId, status, questionId, timeLeft });
}

// Helper to patch quiz state with recalculated timer for broadcast
function patchQuizStateForBroadcast(state) {
    if (!state) {
        logger.warn('[patchQuizStateForBroadcast] Received null or undefined state.');
        return state;
    }

    // CRITICAL FIX: Ensure we have a valid quizId in state.id
    if (!state.id && state.quizId) {
        logger.warn(`[patchQuizStateForBroadcast] Missing state.id but found state.quizId: ${state.quizId}. Setting id.`);
        state.id = state.quizId;
    }

    // Ensure state.id (quizId) is present for logging context
    const quizIdForLog = state.id || 'UNKNOWN_QUIZ_ID';
    logger.info(`[patchQuizStateForBroadcast] Patching state for quizId: ${quizIdForLog}, currentQuestionUid: ${state.currentQuestionUid}, currentQuestionIdx: ${state.currentQuestionIdx}`);

    // CRITICAL FIX: If timerQuestionId exists and is different from currentQuestionUid, sync them
    if (state.timerQuestionId && state.timerStatus === 'play' && state.currentQuestionUid !== state.timerQuestionId) {
        logger.warn(`[patchQuizStateForBroadcast] Fixing mismatch: currentQuestionUid=${state.currentQuestionUid}, active timerQuestionId=${state.timerQuestionId}`);
        state.currentQuestionUid = state.timerQuestionId;
    }

    let currentQuestionObject = null;
    if (state.questions && Array.isArray(state.questions) && state.questions.length > 0) {
        if (state.currentQuestionUid) {
            currentQuestionObject = state.questions.find(q => q.uid === state.currentQuestionUid);
            if (currentQuestionObject) {
                logger.info(`[patchQuizStateForBroadcast] Found question by UID ${state.currentQuestionUid} for quiz ${quizIdForLog}. Question title: ${currentQuestionObject.enonce ? currentQuestionObject.enonce.substring(0, 30) : 'N/A'}`);
            } else {
                logger.warn(`[patchQuizStateForBroadcast] Question UID ${state.currentQuestionUid} NOT FOUND in questions array for quiz ${quizIdForLog}. Questions available: ${state.questions.map(q => q.uid).join(', ')}`);
            }
        } else if (typeof state.currentQuestionIdx === 'number' && state.currentQuestionIdx >= 0 && state.currentQuestionIdx < state.questions.length) {
            currentQuestionObject = state.questions[state.currentQuestionIdx];
            logger.info(`[patchQuizStateForBroadcast] Found question by Idx ${state.currentQuestionIdx} for quiz ${quizIdForLog}. UID: ${currentQuestionObject?.uid}. Question title: ${currentQuestionObject?.enonce ? currentQuestionObject.enonce.substring(0, 30) : 'N/A'}`);
            if (currentQuestionObject && state.currentQuestionUid && currentQuestionObject.uid !== state.currentQuestionUid) {
                logger.warn(`[patchQuizStateForBroadcast] Mismatch! currentQuestionUid is ${state.currentQuestionUid} but question from Idx ${state.currentQuestionIdx} is ${currentQuestionObject.uid} for quiz ${quizIdForLog}`);
            }
        } else {
            logger.warn(`[patchQuizStateForBroadcast] Could not determine current question for quiz ${quizIdForLog}. No valid currentQuestionUid or currentQuestionIdx. UID: ${state.currentQuestionUid}, Idx: ${state.currentQuestionIdx}`);
        }
    } else {
        logger.warn(`[patchQuizStateForBroadcast] Questions array is missing, empty, or not an array for quiz ${quizIdForLog}. Cannot determine current question.`);
    }

    const now = Date.now();
    let patchedState = { ...state, currentQuestion: currentQuestionObject };

    if (state.timerQuestionId) {
        const questionTimer = getQuestionTimer(quizIdForLog, state.timerQuestionId); // Use quizIdForLog

        if (questionTimer && questionTimer.status === 'play' && questionTimer.timestamp) {
            const elapsed = (now - questionTimer.timestamp) / 1000;
            const original = questionTimer.initialTime;
            const remaining = Math.max(original - elapsed, 0);
            const remainingPrecise = Math.round(remaining * 10) / 10;

            logger.info(`[patchQuizStateForBroadcast] Recalculating PLAYING timer for quiz ${quizIdForLog}, qUID ${state.timerQuestionId}: initial=${original}, elapsed=${elapsed.toFixed(1)}, remaining=${remainingPrecise}`);

            patchedState = {
                ...patchedState,
                currentQuestion: currentQuestionObject // Explicitly add current question
            };
        }
    }

    return patchedState;
}

// Function to update chrono in quiz state
function updateChrono(state, timeLeft, status) {
    if (!state) return state;

    // Update chrono status based on timer status
    const running = status === 'play';

    // Create updated chrono object
    const chrono = {
        ...(state.chrono || {}),
        timeLeft: timeLeft !== undefined ? timeLeft : state.chrono?.timeLeft,
        running
    };

    return {
        ...state,
        chrono
    };
}

// Function to create an initialized chrono object
function initializeChrono(initialTime = 20) {
    return {
        timeLeft: initialTime,
        running: false,
    };
}

// Function to calculate remaining time based on chrono and timestamp
function calculateRemainingTime(chrono, timestamp) {
    if (!chrono || !chrono.timeLeft || !timestamp || !chrono.running) {
        return chrono?.timeLeft || 0;
    }

    const elapsed = (Date.now() - timestamp) / 1000; // seconds
    return Math.max(0, chrono.timeLeft - elapsed);
}

/**
 * Updates a question's timer state
 * @param {string} quizId - The quiz ID
 * @param {string} questionId - The question ID
 * @param {string} status - The timer status ('play', 'pause', or 'stop')
 * @param {number} timeLeft - The remaining time in seconds
 * @returns {void}
 */
// Add debug logs to trace timeLeft in updateQuestionTimer
function updateQuestionTimer(quizId, questionId, status, timeLeft) {
    console.debug(`[updateQuestionTimer] Debug: Called with quizId=${quizId}, questionId=${questionId}, action=${status}, timeLeft=${timeLeft}`);

    const questionTimer = getQuestionTimer(quizId, questionId);
    console.debug(`[updateQuestionTimer] Debug: Timer before update:`, JSON.stringify(questionTimer));

    if (!questionTimer) {
        console.error(`[updateQuestionTimer] Timer for question ${questionId} in quiz ${quizId} not found`);
        return;
    }
    const prevStatus = questionTimer.status;
    console.info(`[updateQuestionTimer][BEFORE] quizId=${quizId}, questionId=${questionId}, status=${status}, prevStatus=${prevStatus}, timeLeft=${questionTimer.timeLeft}, timestamp=${questionTimer.timestamp}`);

    // Log all timers for this quiz for debugging
    if (quizState[quizId] && quizState[quizId].questionTimers) {
        const timers = Object.entries(quizState[quizId].questionTimers).map(([qid, t]) => `${qid}: status=${t.status}, timeLeft=${t.timeLeft}, ts=${t.timestamp}`).join(' | ');
        console.info(`[updateQuestionTimer][DEBUG] All timers for quizId=${quizId}: ${timers}`);
    }

    // Strict state transition guards for quiz timers
    if (status === 'play') {
        console.info(`[updateQuestionTimer][ACTION] Setting questionId=${questionId} in quizId=${quizId} to PLAY`);
        if (prevStatus === 'play' && questionTimer.timeLeft > 0) {
            console.warn(`[updateQuestionTimer] Ignoring play: timer already running for quizId=${quizId}, questionId=${questionId}`);
            return;
        }
        if (prevStatus === 'pause') {
            if (typeof questionTimer.timeLeft !== 'number' || questionTimer.timeLeft <= 0) {
                console.error(`[updateQuestionTimer] Cannot resume: paused timer has invalid timeLeft for quizId=${quizId}, questionId=${questionId}`);
                return;
            }
        } else {
            questionTimer.timeLeft = questionTimer.initialTime;
        }
        questionTimer.status = 'play';
        questionTimer.timestamp = Date.now();
        console.info(`[updateQuestionTimer][PLAY] quizId=${quizId}, questionId=${questionId}, timeLeft=${questionTimer.timeLeft}`);
    } else if (status === 'pause') {
        console.info(`[updateQuestionTimer][ACTION] Setting questionId=${questionId} in quizId=${quizId} to PAUSE`);
        if (prevStatus !== 'play' || !questionTimer.timestamp) {
            console.warn(`[updateQuestionTimer] Cannot pause: timer not running for quizId=${quizId}, questionId=${questionId}, prevStatus=${prevStatus}`);
            return;
        }
        const elapsed = (Date.now() - questionTimer.timestamp) / 1000;
        questionTimer.timeLeft = Math.max(0, questionTimer.timeLeft - elapsed);
        questionTimer.status = 'pause';
        questionTimer.timestamp = null;
        console.info(`[updateQuestionTimer][PAUSE] quizId=${quizId}, questionId=${questionId}, elapsed=${elapsed}, newTimeLeft=${questionTimer.timeLeft}`);
    } else if (status === 'stop') {
        console.info(`[updateQuestionTimer][ACTION] Setting questionId=${questionId} in quizId=${quizId} to STOP`);
        questionTimer.status = 'stop';
        questionTimer.timeLeft = questionTimer.initialTime;
        questionTimer.timestamp = null;
        console.info(`[updateQuestionTimer][STOP] quizId=${quizId}, questionId=${questionId}, reset to initialTime=${questionTimer.initialTime}`);
    } else {
        console.warn(`[updateQuestionTimer] Unknown status=${status} for quizId=${quizId}, questionId=${questionId}`);
        return;
    }

    console.debug(`[updateQuestionTimer] Debug: Timer after update:`, JSON.stringify(questionTimer));
    console.info(`[updateQuestionTimer][AFTER] quizId=${quizId}, questionId=${questionId}, status=${questionTimer.status}, timeLeft=${questionTimer.timeLeft}, timestamp=${questionTimer.timestamp}`);

    // Additional log to trace status changes
    console.debug(`[updateQuestionTimer] Debug: Timer status change for questionId=${questionId}: status=${questionTimer.status}`);
}

/**
 * Calculates the precise remaining time for a question
 * @param {string} quizId - The quiz ID
 * @param {string} questionId - The question ID
 * @returns {number} The remaining time in seconds
 */
function calculateQuestionRemainingTime(quizId, questionId) {
    const questionTimer = getQuestionTimer(quizId, questionId);
    if (!questionTimer) {
        console.error(`[calculateQuestionRemainingTime] Timer for question ${questionId} in quiz ${quizId} not found`);
        return 0;
    }
    if (questionTimer.status === 'play' && questionTimer.timestamp) {
        const elapsed = (Date.now() - questionTimer.timestamp) / 1000;
        const remaining = Math.max(0, questionTimer.timeLeft - elapsed);
        console.info(`[calculateQuestionRemainingTime] quizId=${quizId}, questionId=${questionId}, status=play, timeLeft=${questionTimer.timeLeft}, timestamp=${questionTimer.timestamp}, elapsed=${elapsed}, remaining=${remaining}`);
        return remaining;
    }
    console.info(`[calculateQuestionRemainingTime] quizId=${quizId}, questionId=${questionId}, status=${questionTimer.status}, timeLeft=${questionTimer.timeLeft}, timestamp=${questionTimer.timestamp}`);
    return questionTimer.timeLeft;
}

/**
 * Synchronizes timer values between quiz and tournament
 */
function synchronizeTimerValues(quizId, tournamentCode, timeLeft) {
    // Get the tournament state from the exported object
    const { tournamentState } = require('./tournamentHandler');

    if (!tournamentState[tournamentCode]) {
        console.error(`[synchronizeTimerValues] Tournament ${tournamentCode} not found`);
        return;
    }

    if (!quizState[quizId]) {
        console.error(`[synchronizeTimerValues] Quiz ${quizId} not found`);
        return;
    }

    // Get the current question being timed
    const questionId = quizState[quizId].timerQuestionId;
    if (!questionId) {
        console.warn(`[synchronizeTimerValues] No active question in quiz ${quizId}`);
        return;
    }

    // Update tournament state with the question ID and duration
    tournamentState[tournamentCode].currentQuestionUid = questionId;
    tournamentState[tournamentCode].currentQuestionDuration = timeLeft;

    console.info(`[synchronizeTimerValues] Synchronized timer values between quiz ${quizId} and tournament ${tournamentCode}: questionId=${questionId}, timeLeft=${timeLeft}`);
}

module.exports = {
    emitQuizConnectedCount,
    emitQuizTimerUpdate,
    patchQuizStateForBroadcast,
    updateChrono,
    initializeChrono,
    calculateRemainingTime,
    updateQuestionTimer,
    calculateQuestionRemainingTime,
    synchronizeTimerValues
};