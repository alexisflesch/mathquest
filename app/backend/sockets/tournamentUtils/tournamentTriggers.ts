/**
 * tournamentTriggers.ts - Trigger functions for tournament events
 * 
 * This module contains functions that trigger various tournament events,
 * such as sending questions, starting/stopping timers, and handling answers.
 */

import { Server } from 'socket.io';
import { Question } from '../types/quizTypes';
import { TournamentState, TournamentParticipant, TournamentAnswer } from '../types/tournamentTypes';

import createLogger from '../../logger'; // Changed from alias to relative path
const logger = createLogger('TournamentTriggers');

import { tournamentState } from './tournamentState'; // Use TS import for tournamentState
// Import helpers at the top level now
// Assuming tournamentHelpers will also be converted or has a bridge
// Move handleTimerExpiration to be dynamically required to break circular dependency
// Will import only when needed to avoid circular dependencies
import { calculateScore, saveParticipantScore } from './scoreUtils'; // Corrected: .js or .ts extension is usually not needed for module imports

import { updateQuestionTimer } from '../quizUtils'; // Use TS import for quizUtils
import { quizState } from '../quizState'; // Assuming quizState.js is the bridge for quizState.ts
import prisma from '../../db'; // Import prisma instance
import { sendTournamentQuestion } from './sharedTournamentUtils';

// --- Trigger Functions (Exported) ---

/**
 * Sends a tournament question to participants
 * 
 * Sends the question data and sets initial state, but DOES NOT start the timer itself.
 * Timer is started via triggerTournamentTimerSet.
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param index - Question index in the tournament questions array
 * @param linkedQuizId - Optional linked quiz ID if this is a quiz-linked tournament
 * @param initialTime - Optional initial time for the question timer
 * @param targetQuestionUid - Optional specific question UID to send
 */
function triggerTournamentQuestion(
    io: Server,
    code: string,
    index: number,
    linkedQuizId: string | null = null,
    initialTime: number | null = null,
    targetQuestionUid: string | null = null
): void {
    const state = tournamentState[code];
    if (!state || !state.questions) {
        logger.error(`[TriggerQuestion] Invalid state or missing questions for code ${code}`);
        return;
    }

    // CRITICAL FIX: If a specific targetQuestionUid is provided, find it in the questions array
    // This ensures we activate exactly the question requested by UID regardless of array ordering
    let targetIndex = index;
    let targetQuestion: Question | null = null;

    if (targetQuestionUid) {
        // Find the question by UID (overrides the index parameter)
        const foundIndex = state.questions.findIndex((q: Question) => q.uid === targetQuestionUid);
        if (foundIndex !== -1) {
            targetIndex = foundIndex;
            targetQuestion = state.questions[foundIndex];
            logger.info(`[TriggerQuestion] Found requested question ${targetQuestionUid} at index ${targetIndex}`);
        } else {
            logger.error(`[TriggerQuestion] Requested question ${targetQuestionUid} not found in tournament ${code}`);
            return; // Don't proceed with an invalid question
        }
    } else if (index >= state.questions.length) {
        logger.error(`[TriggerQuestion] Invalid index ${index} for code ${code}, questions length ${state.questions.length}`);
        return;
    }

    state.linkedQuizId = linkedQuizId; // Ensure linkedQuizId is set

    // Store both the index and the actual UID for consistency
    const questionUid = targetQuestion ? targetQuestion.uid : state.questions[targetIndex]?.uid;
    state.currentQuestionUid = questionUid; // Store the UID explicitly

    logger.info(`[TriggerQuestion] Called: code=${code}, index=${targetIndex}, questionUid=${questionUid}, linkedQuizId=${linkedQuizId || 'none'}, initialTime=${initialTime}`);

    // For quiz-linked tournaments, ensure all lobby clients are redirected when a question is triggered
    if (linkedQuizId) {
        logger.info(`[TriggerQuestion] This is a quiz-linked tournament, ensuring lobby clients are redirected`);
        io.to(`lobby_${code}`).emit('tournament_redirect', {
            redirectTo: 'live',
            code
        });
    }

    // Construct the payload object for sendTournamentQuestion
    const payload = {
        code,
        question: state.questions[targetIndex],
        timer: state.settings?.timer || 60,
        tournoiState: state.paused ? 'paused' : state.stopped ? 'stopped' : 'running' as 'paused' | 'stopped' | 'running',
        questionIndex: targetIndex,
        questionId: questionUid
    };

    // Call sendTournamentQuestion with the constructed payload
    sendTournamentQuestion(io.to(`live_${code}`), payload);

    // Update the timer display for linked quizzes if initialTime is provided
    if (linkedQuizId && initialTime !== null) {
        logger.info(`[TriggerQuestion] Setting initial time=${initialTime} for linked quiz ${linkedQuizId}`);

        // Find teacher socket ID from quizState
        const teacherSocketId = quizState[linkedQuizId]?.profSocketId;
        if (teacherSocketId) {
            io.to(teacherSocketId).emit('quiz_timer_update', {
                timeLeft: initialTime,
                status: 'pause', // Always start paused, the start event will change this
                questionId: questionUid
            });
        } else {
            logger.warn(`[TriggerQuestion] No teacher socket ID found for linkedQuizId=${linkedQuizId}`);
        }
    }
}

/**
 * Sets the tournament timer
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param timeLeft - Time left in seconds
 * @param forceQuestionState - Optional force state ('running', 'paused', 'stopped')
 */
function triggerTournamentTimerSet(
    io: Server,
    code: string,
    timeLeft: number,
    forceQuestionState: string | null = null
): void {
    // Validate parameters
    if (!code || typeof code !== 'string') {
        logger.error(`[SetTimer] Invalid tournament code: ${code}`);
        return;
    }

    if (typeof timeLeft !== 'number' || timeLeft < 0) {
        logger.error(`[SetTimer] Invalid timeLeft value: ${timeLeft}`);
        timeLeft = 0; // Defensive: ensure non-negative timeLeft
    }

    // Check for tournament state
    if (!tournamentState[code]) {
        logger.error(`[SetTimer] Tournament with code ${code} not found`);
        return;
    }

    const state = tournamentState[code];
    const questionUid = state.currentQuestionUid;

    if (!questionUid) {
        logger.error(`[SetTimer] No current question set for tournament ${code}`);
        return;
    }

    // Determine question state (running, paused, stopped)
    let questionState = forceQuestionState;

    // If not forcing a state, infer it from tournament state
    if (!questionState) {
        if (state.stopped) {
            questionState = 'stopped';
        } else if (state.paused) {
            questionState = 'paused';
        } else {
            questionState = 'running';
        }
    }

    logger.info(`[SetTimer] Setting timer for tournament ${code}, question ${questionUid}, timeLeft=${timeLeft}, state=${questionState}`);

    // Update tournament state
    if (state.questionTimers && state.questionTimers[questionUid]) {
        state.questionTimers[questionUid].timeLeft = timeLeft;
        state.questionTimers[questionUid].lastUpdateTime = Date.now();

        if (questionState === 'running') {
            state.questionTimers[questionUid].status = 'play';
        } else {
            state.questionTimers[questionUid].status = questionState === 'paused' ? 'pause' : 'stop';
        }
    } else {
        // Initialize timer state if it doesn't exist
        if (!state.questionTimers) {
            state.questionTimers = {};
        }

        state.questionTimers[questionUid] = {
            timeLeft,
            initialTime: timeLeft,
            lastUpdateTime: Date.now(),
            status: questionState === 'running' ? 'play' : questionState === 'paused' ? 'pause' : 'stop'
        };
    }

    // Emit timer update to all participants
    io.to(`live_${code}`).emit('tournament_set_timer', {
        timeLeft,
        questionState
    });

    // Handle timer expiration logic if timer is set to zero
    if (timeLeft === 0 && questionUid) {
        // Dynamically import to avoid circular dependencies
        const { handleTimerExpiration } = require('./tournamentHelpers');
        handleTimerExpiration(io, code, questionUid);
    }
}

/**
 * Processes an answer submission in a tournament
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param participantId - Participant ID
 * @param answer - The submitted answer
 * @param questionUid - Question UID
 */
function triggerTournamentAnswer(
    io: Server,
    code: string,
    participantId: string,
    answer: string | number,
    questionUid: string
): void {
    if (!code || !tournamentState[code]) {
        logger.error(`[TriggerAnswer] Invalid tournament code: ${code}`);
        return;
    }

    const state = tournamentState[code];

    // Validate the question exists
    const questionIndex = state.questions.findIndex((q: Question) => q.uid === questionUid);
    if (questionIndex === -1) {
        logger.error(`[TriggerAnswer] Question ${questionUid} not found in tournament ${code}`);
        return;
    }

    // Find the participant
    const participant = state.participants?.find(
        (p: TournamentParticipant) => p.id === participantId
    );

    if (!participant) {
        logger.error(`[TriggerAnswer] Participant ${participantId} not found in tournament ${code}`);
        return;
    }

    // Get the current question
    const question = state.questions[questionIndex];

    // Handle the timing components
    const now = Date.now();
    const timerState = state.questionTimers?.[questionUid];

    let answerTimeMs = 0;
    if (timerState) {
        // Calculate answer time based on initial time and time left
        const initialTimeMs = timerState.initialTime * 1000;
        const timeLeftMs = timerState.timeLeft * 1000;
        answerTimeMs = initialTimeMs - timeLeftMs;
    }

    // Convert answer to appropriate type if possible
    let processedAnswer: string | number = answer;
    if (question.type === 'number' || question.type === 'numeric') {
        // Normalize numeric answers
        try {
            // Handle comma as decimal separator
            if (typeof answer === 'string' && answer.includes(',')) {
                processedAnswer = parseFloat(answer.replace(',', '.'));
            }
            // Handle already numeric or dot-decimal answers
            else if (typeof answer === 'string') {
                processedAnswer = parseFloat(answer);
            }

            // Handle NaN
            if (isNaN(processedAnswer as number)) {
                processedAnswer = answer; // Keep original if not parseable
            }
        } catch (e) {
            // Keep original answer if parsing fails
            logger.warn(`[TriggerAnswer] Could not parse numeric answer: ${answer}`);
            processedAnswer = answer;
        }
    }

    // Prepare the answer object
    const answerObject: TournamentAnswer = {
        questionUid,
        value: processedAnswer,
        timeMs: answerTimeMs,
        timestamp: now,
        isCorrect: false // Will be determined during scoring
    };

    // Score the answer immediately
    try {
        // Create the processed answer object for the new calculateScore signature
        const processedAnswerForScoring = {
            answerIdx: answerObject.answerIdx,
            clientTimestamp: answerObject.clientTimestamp || 0,
            serverReceiveTime: answerObject.serverReceiveTime,
            isCorrect: false, // Will be determined by scoring
            timeMs: answerTimeMs,
            value: answerObject.value
        };

        // Call calculateScore with the new signature (3 args instead of 4)
        const scoreResult = calculateScore(
            question,
            processedAnswerForScoring,
            state.questions.length
        );

        // Map the result to the expected properties
        answerObject.isCorrect = scoreResult.scoreBeforePenalty > 0;
        const totalScore = scoreResult.normalizedQuestionScore;
        answerObject.score = totalScore;
        answerObject.baseScore = scoreResult.scoreBeforePenalty;
        answerObject.timePenalty = scoreResult.timePenalty;

        logger.info(`[TriggerAnswer] Scored answer for ${participantId}: correct=${answerObject.isCorrect}, score=${totalScore}`);
    } catch (error) {
        logger.error(`[TriggerAnswer] Error scoring answer: ${error instanceof Error ? error.message : String(error)}`);
        answerObject.score = 0;
    }

    // Store the answer
    if (!participant.answers) {
        participant.answers = [];
    }

    // Check for existing answer to this question and replace if found
    const existingAnswerIndex = participant.answers.findIndex(
        (a: TournamentAnswer) => a.questionUid === questionUid
    );

    if (existingAnswerIndex !== -1) {
        participant.answers[existingAnswerIndex] = answerObject;
        logger.info(`[TriggerAnswer] Replaced previous answer for participant ${participantId}, question ${questionUid}`);
    } else {
        participant.answers.push(answerObject);
        logger.info(`[TriggerAnswer] Stored new answer for participant ${participantId}, question ${questionUid}`);
    }

    // Update participant's total score
    let totalScore = 0;
    if (participant.answers && participant.answers.length > 0) {
        totalScore = participant.answers.reduce(
            (sum: number, ans: TournamentAnswer) => sum + (ans.score || 0),
            0
        );
    }
    participant.score = totalScore;

    // Save score to database for persistent tournaments
    if (state.tournamentId && participant.socketId) { // Defensive guard for participant.socketId was already added
        saveParticipantScore(prisma, state.tournamentId, participant)
            .catch((err: Error) => logger.error(`[TriggerAnswer] Error saving score: ${err.message}`));
    }

    // Acknowledge receipt to the participant
    if (participant.socketId) { // Guard against undefined socketId
        io.to(participant.socketId).emit('tournament_answer_response', {
            status: 'success',
            questionUid,
            totalScore,
            answerReceived: processedAnswer
        });
    } else {
        logger.warn(`[TriggerAnswer] Participant ${participantId} has no socketId, cannot send answer response.`);
    }

    // Notify teachers/hosts of the answer (without showing correctness)
    io.to(`host_${code}`).emit('tournament_answer_received', {
        participantId,
        questionUid,
        timestamp: now
    });
}

// Export functions in TypeScript style
export {
    triggerTournamentQuestion,
    triggerTournamentTimerSet,
    triggerTournamentAnswer
};

// Export defaults for convenience
export default {
    triggerTournamentQuestion,
    triggerTournamentTimerSet,
    triggerTournamentAnswer
};

// CommonJS compatibility - export before any circular dependencies can interfere
if (typeof module !== 'undefined' && module.exports) {
    // Directly assign the functions to prevent circular dependency issues
    module.exports = {
        triggerTournamentQuestion,
        triggerTournamentTimerSet,
        triggerTournamentAnswer,
        default: { // Ensure default is also an object if accessed like loadedModule.default.triggerTournamentQuestion
            triggerTournamentQuestion,
            triggerTournamentTimerSet,
            triggerTournamentAnswer
        }
    };
}
