import { Server } from 'socket.io';
import { updateQuestionTimer, emitQuizTimerUpdate, patchQuizStateForBroadcast } from '@sockets/quizUtils'; // Assuming quizUtils.ts provides these
import { quizState, getQuestionTimer } from '@sockets/quizState'; // Assuming quizState.ts or its bridge provides these

// Import from TypeScript file without .js extension
import * as tournamentHandler from '@sockets/tournamentHandler';
const { tournamentState } = tournamentHandler; // Destructure tournamentState

import createLogger from '@logger'; // Changed to import and alias
import { sendTournamentQuestion } from '@sockets/tournamentUtils/sendTournamentQuestion'; // Bridge to sendTournamentQuestion.ts
import type { TournamentQuestionPayload } from '@sockets/tournamentUtils/sendTournamentQuestion'; // Correct type-only import
import { triggerTournamentQuestion } from '@sockets/tournamentUtils/tournamentTriggers'; // Import from TypeScript file
import { Question } from '@sockets/types/quizTypes'; // Assuming this type exists

const logger = createLogger('QuizTriggers');

// In-memory object to track countdown timeouts per quiz/question
const quizTimerCountdowns: Record<string, Record<string, NodeJS.Timeout | null>> = {};

function clearQuizCountdown(quizId: string, questionUid: string): void {
    if (quizTimerCountdowns[quizId] && quizTimerCountdowns[quizId][questionUid]) {
        clearTimeout(quizTimerCountdowns[quizId][questionUid] as NodeJS.Timeout);
        quizTimerCountdowns[quizId][questionUid] = null;
    }
}

/**
 * Sends the current question to the tournament room if the quiz is linked to a tournament.
 */
export function sendQuestionToTournament(io: Server, quizId: string, questionUid: string): void {
    if (!quizState[quizId]) {
        logger.warn('[sendQuestionToTournament] Quiz state not found for ' + quizId);
        return;
    }

    let code = quizState[quizId].tournament_code;
    if (!code) {
        // MODIFIED: Access tournamentState via tournamentHandler
        const linkedTournamentCode = Object.keys(tournamentHandler.tournamentState).find(c => tournamentHandler.tournamentState[c] && tournamentHandler.tournamentState[c].linkedQuizId === quizId);
        if (!linkedTournamentCode) {
            logger.debug('[sendQuestionToTournament] No linked tournament found for quiz ' + quizId);
            return;
        }
        code = linkedTournamentCode;
    }

    // MODIFIED: Access tournamentState via tournamentHandler
    if (!tournamentHandler.tournamentState[code]) {
        logger.warn('[sendQuestionToTournament] Tournament state not found for code ' + code);
        return;
    }

    // MODIFIED: Access tournamentState via tournamentHandler
    if (!tournamentHandler.tournamentState[code].questions || !Array.isArray(tournamentHandler.tournamentState[code].questions)) {
        logger.warn('[sendQuestionToTournament] Tournament ' + code + ' questions array not initialized');
        return;
    }

    const question = tournamentHandler.tournamentState[code].questions.find((q: Question) => q.uid === questionUid);
    if (!question) {
        logger.warn('[sendQuestionToTournament] Question ' + questionUid + ' not found in tournament ' + code);
        return;
    }

    tournamentHandler.tournamentState[code].currentQuestionUid = questionUid;
    const index = tournamentHandler.tournamentState[code].questions.findIndex((q: Question) => q.uid === questionUid);
    const total = tournamentHandler.tournamentState[code].questions.length;

    logger.info('[sendQuestionToTournament] Sending question ' + questionUid + ' to live_' + code + '. Index: ' + index + ', Total: ' + total);

    try {
        const timer = getQuestionTimer(quizId, questionUid);
        const timeLeft = timer ? timer.timeLeft : (question.time || 20);
        const questionStateStatus = timer ? (timer.status === 'play' ? 'active' : timer.status) : 'stopped';

        // Use triggerTournamentQuestion from tournamentUtils to ensure proper state update
        triggerTournamentQuestion(io, code, index, quizId, timeLeft, questionUid); // Pass index, it might be used or ignored if questionUid is primary

        // Then also directly send to ensure immediate update
        const targetEmitter = io.to(`game_${code}`);
        const tournoiStateFromQuiz = questionStateStatus === 'active' ? 'running' : questionStateStatus as 'paused' | 'stopped';

        const payload: TournamentQuestionPayload = {
            code,
            question,
            timer: timeLeft,
            tournoiState: tournoiStateFromQuiz,
            questionIndex: index,
            questionUid
        };
        sendTournamentQuestion(targetEmitter, payload);

        logger.info('[sendQuestionToTournament] Successfully sent question ' + questionUid + ' to live_' + code);
    } catch (err: any) {
        logger.error('[sendQuestionToTournament] Error sending question: ' + (err.message || err));
    }
}

/**
 * Triggers the timer action for a quiz question (play, pause, stop).
 */
export function triggerQuizTimerAction(io: Server, quizId: string, questionUid: string, action: 'play' | 'pause' | 'stop', timeLeft?: number): void {
    logger.info('[triggerQuizTimerAction] Called with: quizId = ' + quizId + ', questionUid = ' + questionUid + ', action = ' + action + ', timeLeft = ' + timeLeft);
    logger.debug('[triggerQuizTimerAction] Debug: Initial state of quizTimerCountdowns: ' + Object.keys(quizTimerCountdowns).length + ' quiz(zes), ' + (quizTimerCountdowns[quizId] ? Object.keys(quizTimerCountdowns[quizId]).length : 0) + ' timers for this quiz');

    updateQuestionTimer(quizId, questionUid, action, timeLeft);

    if (!quizTimerCountdowns[quizId]) {
        logger.debug('[triggerQuizTimerAction] Debug: Initializing quizTimerCountdowns for quizId = ' + quizId);
        quizTimerCountdowns[quizId] = {};
    }

    logger.info('[triggerQuizTimerAction] Clearing existing countdown for quizId = ' + quizId + ', questionUid = ' + questionUid);
    clearQuizCountdown(quizId, questionUid);

    const timer = getQuestionTimer(quizId, questionUid);

    if (!timer) {
        logger.error('[triggerQuizTimerAction] Timer not found for quizId = ' + quizId + ', questionUid = ' + questionUid + '. Cannot proceed with action ' + action + '.');
        return;
    }

    logger.info('[triggerQuizTimerAction] After update: quizId = ' + quizId + ', questionUid = ' + questionUid + ', action = ' + action + ', status = ' + timer.status + ', timeLeft = ' + timer.timeLeft + ', timestamp = ' + timer.timestamp);
    logger.debug('[triggerQuizTimerAction] Debug: Timer object immediately after fetching: ' + JSON.stringify(timer));
    logger.debug('[triggerQuizTimerAction] Debug: Condition check: action = ' + action + ', timer.timeLeft = ' + timer.timeLeft + ', timer.status = ' + timer.status);

    if (action === 'play' && timer.timeLeft && timer.timeLeft > 0 && timer.status === 'play') {
        const msLeft = Math.max(0, Math.round(timer.timeLeft * 1000));
        logger.info('[triggerQuizTimerAction] Starting countdown for quizId = ' + quizId + ', questionUid = ' + questionUid + ', msLeft = ' + msLeft);
        logger.debug('[triggerQuizTimerAction] Debug: Setting timeout for quizId = ' + quizId + ', questionUid = ' + questionUid + ', msLeft = ' + msLeft);

        quizTimerCountdowns[quizId][questionUid] = setTimeout(() => {
            logger.info('[triggerQuizTimerAction] Countdown expired for quizId = ' + quizId + ', questionUid = ' + questionUid);
            updateQuestionTimer(quizId, questionUid, 'stop', 0);
            emitQuizTimerUpdate(io, quizId, 'stop', questionUid, 0);
            if (quizState[quizId]) {
                // Ensure 'id' or 'quizId' is part of the state for patchQuizStateForBroadcast if needed
                // quizState[quizId].id = quizId; 
                io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
            }
        }, msLeft);
        logger.debug('[triggerQuizTimerAction] Debug: Timeout set for quizId = ' + quizId + ', questionUid = ' + questionUid);
    } else {
        if (action === 'play') {
            logger.info('[triggerQuizTimerAction] Not starting countdown: action = play, but timer.status = ' + timer.status + ', timeLeft = ' + timer.timeLeft);
        }
    }

    const activeTimers = quizTimerCountdowns[quizId] ? Object.keys(quizTimerCountdowns[quizId]).filter(qId => quizTimerCountdowns[quizId][qId] !== null) : [];
    logger.debug('[triggerQuizTimerAction] Debug: Final state of quizTimerCountdowns: ' + activeTimers.length + ' active timers. Active question IDs: [' + activeTimers.join(', ') + ']');

    emitQuizTimerUpdate(io, quizId, action, questionUid, timer.timeLeft);
    if (quizState[quizId]) {
        io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
    }
}

/**
 * Sets the timer value for a quiz question (edit duration).
 */
export function triggerQuizSetTimer(io: Server, quizId: string, questionUid: string, timeLeft: number): void {
    const timer = getQuestionTimer(quizId, questionUid);
    if (timer) {
        timer.timeLeft = timeLeft;
        timer.initialTime = timeLeft; // Also update initialTime if this means resetting the timer's origin
        emitQuizTimerUpdate(io, quizId, timer.status, questionUid, timeLeft);
        if (quizState[quizId]) {
            io.to(`dashboard_${quizId}`).emit('quiz_state', patchQuizStateForBroadcast(quizState[quizId]));
        }
    } else {
        logger.warn('[triggerQuizSetTimer] Timer not found for quizId = ' + quizId + ', questionUid = ' + questionUid);
    }
}
