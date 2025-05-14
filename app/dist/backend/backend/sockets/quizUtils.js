"use strict";
/**
 * quizUtils.ts - Quiz Utility Functions
 *
 * This module provides a set of utility functions for managing quiz state
 * and connected users.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitQuizConnectedCount = emitQuizConnectedCount;
exports.emitQuizTimerUpdate = emitQuizTimerUpdate;
exports.patchQuizStateForBroadcast = patchQuizStateForBroadcast;
exports.updateChrono = updateChrono;
exports.initializeChrono = initializeChrono;
exports.calculateRemainingTime = calculateRemainingTime;
exports.updateQuestionTimer = updateQuestionTimer;
exports.calculateQuestionRemainingTime = calculateQuestionRemainingTime;
exports.synchronizeTimerValues = synchronizeTimerValues;
const quizState_1 = require("./quizState");
const tournamentState_1 = require("./tournamentUtils/tournamentState"); // Updated import
// Import logger
const logger_1 = __importDefault(require("../logger")); // Updated to import from logger.ts (via its bridge or direct .ts resolution)
const logger = (0, logger_1.default)('QuizUtils');
/**
 * Emits the connected user count for a tournament associated with a quiz
 * @param io - Socket.IO server instance
 * @param prisma - Prisma client
 * @param code - Tournament code
 */
async function emitQuizConnectedCount(io, prisma, code) {
    var _a;
    if (!code)
        return;
    let quizId = null;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { tournament_code: code },
            select: { id: true }
        });
        if (quiz && quiz.id)
            quizId = quiz.id;
    }
    catch (e) {
        console.error('[QUIZ_CONNECTED] Erreur récupération quizId pour code', code, e);
    }
    if (!quizId)
        return;
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
    const profSocketId = (_a = quizState_1.quizState[quizId]) === null || _a === void 0 ? void 0 : _a.profSocketId;
    // Exclut le prof du comptage
    let totalCount = 0;
    for (const socketId of allSocketIds) {
        if (socketId !== profSocketId)
            totalCount++;
    }
    console.info(`[QUIZ_CONNECTED] EMIT quiz_connected_count quizId=${quizId} code=${code} totalSansProf=${totalCount}`);
    io.to(`dashboard_${quizId}`).emit("quiz_connected_count", { count: totalCount });
    // Also emit directly to the teacher's socket if available
    if (profSocketId) {
        io.to(profSocketId).emit("quiz_connected_count", { count: totalCount });
    }
}
/**
 * Centralized function to emit quiz timer updates
 * @param io - Socket.IO server instance
 * @param quizId - Quiz ID
 * @param status - Timer status ('play', 'pause', 'stop')
 * @param questionId - Question ID
 * @param timeLeft - Time left in seconds
 */
function emitQuizTimerUpdate(io, quizId, status, questionId, timeLeft) {
    io.to(quizId).emit('quiz_timer_update', { quizId, status, questionId, timeLeft });
    // Also emit to the dashboard room for this quiz
    io.to(`dashboard_${quizId}`).emit('quiz_timer_update', { quizId, status, questionId, timeLeft });
}
/**
 * Helper to patch quiz state with recalculated timer for broadcast
 * @param state - The quiz state to patch
 * @returns The patched quiz state
 */
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
            currentQuestionObject = state.questions.find(q => q.uid === state.currentQuestionUid) || null;
            if (currentQuestionObject) {
                logger.info(`[patchQuizStateForBroadcast] Found question by UID ${state.currentQuestionUid} for quiz ${quizIdForLog}. Question title: ${currentQuestionObject.text ? currentQuestionObject.text.substring(0, 30) : 'N/A'}`);
            }
            else {
                logger.warn(`[patchQuizStateForBroadcast] Question UID ${state.currentQuestionUid} NOT FOUND in questions array for quiz ${quizIdForLog}. Questions available: ${state.questions.map(q => q.uid).join(', ')}`);
            }
        }
        else if (typeof state.currentQuestionIdx === 'number' && state.currentQuestionIdx >= 0 && state.currentQuestionIdx < state.questions.length) {
            currentQuestionObject = state.questions[state.currentQuestionIdx];
            logger.info(`[patchQuizStateForBroadcast] Found question by Idx ${state.currentQuestionIdx} for quiz ${quizIdForLog}. UID: ${currentQuestionObject === null || currentQuestionObject === void 0 ? void 0 : currentQuestionObject.uid}. Question title: ${(currentQuestionObject === null || currentQuestionObject === void 0 ? void 0 : currentQuestionObject.text) ? currentQuestionObject.text.substring(0, 30) : 'N/A'}`);
            if (currentQuestionObject && state.currentQuestionUid && currentQuestionObject.uid !== state.currentQuestionUid) {
                logger.warn(`[patchQuizStateForBroadcast] Mismatch! currentQuestionUid is ${state.currentQuestionUid} but question from Idx ${state.currentQuestionIdx} is ${currentQuestionObject.uid} for quiz ${quizIdForLog}`);
            }
        }
        else {
            logger.warn(`[patchQuizStateForBroadcast] Could not determine current question for quiz ${quizIdForLog}. No valid currentQuestionUid or currentQuestionIdx. UID: ${state.currentQuestionUid}, Idx: ${state.currentQuestionIdx}`);
        }
    }
    else {
        logger.warn(`[patchQuizStateForBroadcast] Questions array is missing, empty, or not an array for quiz ${quizIdForLog}. Cannot determine current question.`);
    }
    const now = Date.now();
    let patchedState = Object.assign(Object.assign({}, state), { currentQuestion: currentQuestionObject });
    if (state.timerQuestionId) {
        const questionTimer = (0, quizState_1.getQuestionTimer)(quizIdForLog, state.timerQuestionId); // Use quizIdForLog
        if (questionTimer && questionTimer.status === 'play' && questionTimer.timestamp) {
            const elapsed = (now - questionTimer.timestamp) / 1000;
            const original = questionTimer.initialTime;
            const remaining = Math.max(original - elapsed, 0);
            const remainingPrecise = Math.round(remaining * 10) / 10;
            logger.info(`[patchQuizStateForBroadcast] Recalculating PLAYING timer for quiz ${quizIdForLog}, qUID ${state.timerQuestionId}: initial=${original}, elapsed=${elapsed.toFixed(1)}, remaining=${remainingPrecise}`);
            patchedState = Object.assign(Object.assign({}, patchedState), { currentQuestion: currentQuestionObject // Explicitly add current question
             });
        }
    }
    return patchedState;
}
/**
 * Function to update chrono in quiz state
 * @param state - The quiz state to update
 * @param timeLeft - New time left value
 * @param status - Timer status
 * @returns Updated quiz state
 */
function updateChrono(state, timeLeft, status) {
    var _a;
    if (!state)
        return state;
    // Update chrono status based on timer status
    const running = status === 'play';
    // Create updated chrono object
    const chrono = Object.assign(Object.assign({}, (state.chrono || {})), { timeLeft: timeLeft !== undefined ? timeLeft : (_a = state.chrono) === null || _a === void 0 ? void 0 : _a.timeLeft, running });
    return Object.assign(Object.assign({}, state), { chrono });
}
/**
 * Function to create an initialized chrono object
 * @param initialTime - Initial time in seconds
 * @returns Initialized chrono object
 */
function initializeChrono(initialTime = 20) {
    return {
        timeLeft: initialTime,
        running: false,
    };
}
/**
 * Function to calculate remaining time based on chrono and timestamp
 * @param chrono - Chrono object
 * @param timestamp - Timestamp when timer started
 * @returns Remaining time in seconds
 */
function calculateRemainingTime(chrono, timestamp) {
    if (!chrono || !chrono.timeLeft || !timestamp || !chrono.running) {
        return (chrono === null || chrono === void 0 ? void 0 : chrono.timeLeft) || 0;
    }
    const elapsed = (Date.now() - timestamp) / 1000; // seconds
    return Math.max(0, chrono.timeLeft - elapsed);
}
/**
 * Updates a question's timer state
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @param status - The timer status ('play', 'pause', or 'stop')
 * @param timeLeft - The remaining time in seconds
 */
function updateQuestionTimer(quizId, questionId, status, timeLeft) {
    console.debug(`[updateQuestionTimer] Debug: Called with quizId=${quizId}, questionId=${questionId}, action=${status}, timeLeft=${timeLeft}`);
    const questionTimer = (0, quizState_1.getQuestionTimer)(quizId, questionId);
    console.debug(`[updateQuestionTimer] Debug: Timer before update:`, JSON.stringify(questionTimer));
    if (!questionTimer) {
        console.error(`[updateQuestionTimer] Timer for question ${questionId} in quiz ${quizId} not found`);
        return;
    }
    const prevStatus = questionTimer.status;
    console.info(`[updateQuestionTimer][BEFORE] quizId=${quizId}, questionId=${questionId}, status=${status}, prevStatus=${prevStatus}, timeLeft=${questionTimer.timeLeft}, timestamp=${questionTimer.timestamp}`);
    // Log all timers for this quiz for debugging
    if (quizState_1.quizState[quizId] && quizState_1.quizState[quizId].questionTimers) {
        const timers = Object.entries(quizState_1.quizState[quizId].questionTimers || {}).map(([qid, t]) => `${qid}: status=${t.status}, timeLeft=${t.timeLeft}, ts=${t.timestamp}`).join(' | ');
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
        }
        else {
            questionTimer.timeLeft = questionTimer.initialTime;
        }
        questionTimer.status = 'play';
        questionTimer.timestamp = Date.now();
        console.info(`[updateQuestionTimer][PLAY] quizId=${quizId}, questionId=${questionId}, timeLeft=${questionTimer.timeLeft}`);
    }
    else if (status === 'pause') {
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
    }
    else if (status === 'stop') {
        console.info(`[updateQuestionTimer][ACTION] Setting questionId=${questionId} in quizId=${quizId} to STOP`);
        questionTimer.status = 'stop';
        questionTimer.timeLeft = questionTimer.initialTime;
        questionTimer.timestamp = null;
        console.info(`[updateQuestionTimer][STOP] quizId=${quizId}, questionId=${questionId}, reset to initialTime=${questionTimer.initialTime}`);
    }
    else {
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
 * @param quizId - The quiz ID
 * @param questionId - The question ID
 * @returns The remaining time in seconds
 */
function calculateQuestionRemainingTime(quizId, questionId) {
    const questionTimer = (0, quizState_1.getQuestionTimer)(quizId, questionId);
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
 * @param quizId - Quiz ID
 * @param tournamentCode - Tournament code
 * @param timeLeft - Time left in seconds
 */
function synchronizeTimerValues(quizId, tournamentCode, timeLeft) {
    // Get the tournament state from the imported module
    // Note: Using legacy JS file for compatibility until full migration
    // const { tournamentState } = require('./tournamentUtils/tournamentState.legacy.js'); // Removed legacy require
    if (!tournamentState_1.tournamentState[tournamentCode]) {
        console.error(`[synchronizeTimerValues] Tournament ${tournamentCode} not found`);
        return;
    }
    if (!quizState_1.quizState[quizId]) {
        console.error(`[synchronizeTimerValues] Quiz ${quizId} not found`);
        return;
    }
    // Get the current question being timed
    const questionId = quizState_1.quizState[quizId].timerQuestionId;
    if (!questionId) {
        console.warn(`[synchronizeTimerValues] No active question in quiz ${quizId}`);
        return;
    }
    // Update tournament state with the question ID and duration
    tournamentState_1.tournamentState[tournamentCode].currentQuestionUid = questionId;
    tournamentState_1.tournamentState[tournamentCode].currentQuestionDuration = timeLeft;
    console.info(`[synchronizeTimerValues] Synchronized timer values between quiz ${quizId} and tournament ${tournamentCode}: questionId=${questionId}, timeLeft=${timeLeft}`);
}
