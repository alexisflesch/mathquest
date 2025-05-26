/**
 * tournamentHelpers.ts - Utility functions for tournament operations
 * 
 * This module provides helper functions for tournament operations like:
 * - Managing tournament state
 * - Sending questions to participants
 * - Handling timer expiration
 * - Computing statistics
 */

import { Server, Socket } from 'socket.io'; // Added Socket for individual emissions
import { Question } from '../types/quizTypes';
import { TournamentState, TournamentParticipant, TournamentAnswer, TournamentStateContainer } from '../types/tournamentTypes';
import { ProcessedAnswerForScoring } from './scoreUtils'; // Import ProcessedAnswerForScoring

import createLogger from '../../logger';
const logger = createLogger('TournamentHelpers');

import { tournamentState as importedTournamentState } from './tournamentState';
const tournamentState: TournamentStateContainer = importedTournamentState;

import { calculateScore, saveParticipantScore } from './scoreUtils';
import { emitQuestionResults, TournamentRoomName, QuizRoomName, QuestionResultsParams } from '../sharedLiveLogic/emitQuestionResults';
import { sendQuestion as sendSharedQuestion } from '../sharedLiveLogic/sendQuestion';
import { emitParticipantScoreUpdate } from '../sharedLiveLogic/emitParticipantScoreUpdate';
import prisma from '../../db';
// import { updateLeaderboardAndEmit } from './leaderboardUtils'; // To be re-evaluated

// Placeholder for rank calculation - replace with actual implementation
function calculateRanks(participants: TournamentParticipant[]): Map<string, number> {
    const sortedParticipants = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));
    const ranks = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < sortedParticipants.length; i++) {
        if (i > 0 && (sortedParticipants[i].score || 0) < (sortedParticipants[i - 1].score || 0)) {
            currentRank = i + 1;
        }
        ranks.set(sortedParticipants[i].id, currentRank);
    }
    return ranks;
}


/**
 * Gets the target to emit events to - handles live/differed mode
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 * @param isDiffered - Whether the tournament is in differed mode
 * @returns The Socket.IO broadcast target
 */
function getEmitTarget(io: Server, code: string, targetRoom: string | null = null, isDiffered: boolean = false) {
    return targetRoom ? io.to(targetRoom) : io.to(isDiffered ? `differed_${code}` : `game_${code}`);
}

/**
 * Centralized timer expiration logic
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param targetRoom - Optional specific room to target
 */
async function handleTimerExpiration(io: Server, code: string, targetRoom: string | null = null): Promise<void> {
    logger.info(`[handleTimerExpiration] ENTERED for code=${code}`);

    const state: TournamentState | undefined = tournamentState[code]; // state is of type TournamentState
    if (!state || state.paused || state.stopped) {
        logger.debug(`[handleTimerExpiration] Early return for code=${code}. paused=${state?.paused}, stopped=${state?.stopped}`);
        return;
    }

    const currentQuestionUid = state.currentQuestionUid;
    if (!currentQuestionUid) {
        logger.error(`[handleTimerExpiration] currentQuestionUid is not set for tournament ${code}. Cannot process scores.`);
        return;
    }

    const question = state.questions.find((q: Question) => q.uid === currentQuestionUid);
    if (!question) {
        logger.error(`[handleTimerExpiration] Question UID ${currentQuestionUid} not found in tournament state.`);
        return;
    }

    logger.info(`Timer expired for question ${currentQuestionUid} (type: ${question.type}) in tournament ${code}`);

    // --- SCORE PROCESSING & INDIVIDUAL UPDATES ---
    const totalQuestionsInEvent = state.questions.length;
    const questionStartTime = state.questionStart || Date.now(); // Fallback for questionStart

    for (const participant of state.participants || []) { // participant is of type TournamentParticipant
        let participantAnswerStore = state.answers?.[participant.id];
        let rawAnswer: TournamentAnswer | undefined = participantAnswerStore?.[currentQuestionUid]; // rawAnswer is of type TournamentAnswer

        let scoreForThisQuestion = 0;
        // let processedAnswerForScoring: ProcessedAnswerForScoring; // Declared inside if block

        if (rawAnswer && question.answers) {
            const clientTs = typeof rawAnswer.clientTimestamp === 'number' ? rawAnswer.clientTimestamp : questionStartTime;
            const timeMs = Math.max(0, clientTs - questionStartTime);
            let isCorrectOverall = false;
            let submittedValue: string | string[] | undefined = undefined;
            let answerIndices: number | number[] | undefined = rawAnswer.answerIdx;

            if (question.type === 'QCU' || (question.type === 'QCM' && question.answers.filter(r => r.correct).length === 1)) {
                const correctOptionIndex = question.answers.findIndex(r => r.correct);
                if (rawAnswer.answerIdx === correctOptionIndex) {
                    isCorrectOverall = true;
                }
                if (typeof rawAnswer.answerIdx === 'number' && question.answers[rawAnswer.answerIdx]) {
                    submittedValue = question.answers[rawAnswer.answerIdx].text;
                }
            } else if (question.type === 'QCM') {
                if (Array.isArray(rawAnswer.answerIdx)) {
                    submittedValue = rawAnswer.answerIdx.map(idx => question.answers?.[idx]?.text).filter(t => !!t) as string[];
                } else if (typeof rawAnswer.answerIdx === 'number' && question.answers?.[rawAnswer.answerIdx]) {
                    submittedValue = question.answers[rawAnswer.answerIdx].text;
                }
            }

            const processedAnswerForScoring: ProcessedAnswerForScoring = {
                answerIdx: answerIndices,
                clientTimestamp: clientTs,
                serverReceiveTime: rawAnswer.serverReceiveTime,
                isCorrect: isCorrectOverall,
                value: submittedValue,
                timeMs: timeMs,
            };

            const scoreResult = calculateScore(question, processedAnswerForScoring, totalQuestionsInEvent);
            scoreForThisQuestion = scoreResult.normalizedQuestionScore;

            if (question.type === 'QCM') {
                // For QCM, isCorrect should reflect if any points were scored before penalty
                processedAnswerForScoring.isCorrect = scoreResult.scoreBeforePenalty > 0;
            }

            rawAnswer.score = scoreResult.normalizedQuestionScore;
            rawAnswer.baseScore = scoreResult.scoreBeforePenalty;
            rawAnswer.timePenalty = scoreResult.timePenalty;
            rawAnswer.isCorrect = processedAnswerForScoring.isCorrect;
            rawAnswer.value = processedAnswerForScoring.value;
            rawAnswer.timeMs = processedAnswerForScoring.timeMs;

        } else {
            logger.debug(`[handleTimerExpiration] No answer for participant ${participant.id} on Q ${currentQuestionUid}, or Q has no responses. Score: 0`);

            const noAnswerEntry: TournamentAnswer = { // Explicitly typed variable
                questionUid: currentQuestionUid,
                answerIdx: undefined,
                clientTimestamp: questionStartTime,
                serverReceiveTime: Date.now(), // This property must be recognized by TournamentAnswer type
                isCorrect: false,
                value: "Pas de réponse",
                timeMs: (question.time || 0) * 1000,
                score: 0,
                baseScore: 0,
                timePenalty: (question.time || 0) > 0 ? 500 : 0
            };

            if (!state.answers) {
                state.answers = {};
            }
            if (!state.answers[participant.id]) {
                state.answers[participant.id] = {};
            }
            state.answers[participant.id][currentQuestionUid] = noAnswerEntry;
            rawAnswer = noAnswerEntry; // So that scoreForThisQuestion (0) is correctly assigned below
            scoreForThisQuestion = 0; // Explicitly set, though noAnswerEntry.score is 0
        }

        // Update participant's total score by summing `score` from all their answers
        let newTotalScore = 0;
        if (state.answers && state.answers[participant.id]) {
            newTotalScore = Object.values(state.answers[participant.id]).reduce(
                (sum, ans: TournamentAnswer) => sum + (ans.score || 0), 0
            );
        }
        participant.score = newTotalScore;

        // Optional: Store this question's score in participant.scoredQuestions if used elsewhere
        if (!participant.scoredQuestions) {
            participant.scoredQuestions = {};
        }
        participant.scoredQuestions[currentQuestionUid] = scoreForThisQuestion;

        // Save score to DB
        if (state.tournamentId && participant.id && !participant.id.startsWith('socket_')) {
            saveParticipantScore(prisma, state.tournamentId, { id: participant.id, score: participant.score })
                .catch((err: Error) => logger.error(`[handleTimerExpiration] DB Score Save Error for ${participant.id}: ${err.message}`));
        }
    }

    // --- CALCULATE RANKS & EMIT INDIVIDUAL SCORE UPDATES ---
    const ranks = calculateRanks(state.participants || []);
    for (const participant of state.participants || []) {
        const participantSocketId = Object.keys(state.socketToPlayerId || {}).find(
            socketId => state.socketToPlayerId?.[socketId] === participant.id
        );
        if (participantSocketId) {
            const targetSocket = io.sockets.sockets.get(participantSocketId);
            if (targetSocket) {
                const rank = ranks.get(participant.id) || 0;
                emitParticipantScoreUpdate(targetSocket, {
                    newTotalScore: participant.score || 0,
                    currentRank: rank
                });
            } else {
                logger.warn(`[handleTimerExpiration] Socket instance NOT FOUND for socket ID ${participantSocketId}`);
            }
        } else {
            logger.warn(`[handleTimerExpiration] Socket ID NOT FOUND for participant ${participant.id} to emit score update.`);
        }
    }

    // --- EMIT QUESTION RESULTS (Correct Answers) ---
    if (question.answers && currentQuestionUid) {
        // Get the correct answer texts (preferred for display)
        const correctAnswersText = question.answers
            .filter(ans => ans.correct)
            .map(ans => ans.text);

        // Create leaderboard data
        const leaderboardData = (state.participants || []).map(p => ({
            id: p.id,
            name: p.username || 'Anonymous',
            score: p.score || 0,
            rank: ranks.get(p.id) || 0
        })).sort((a, b) => a.rank - b.rank);

        // Prepare the results parameters
        const resultsParams: QuestionResultsParams = {
            questionUid: currentQuestionUid,
            correctAnswers: correctAnswersText,
            leaderboard: leaderboardData
        };

        // Convert the room target to the appropriate type
        const roomTarget = targetRoom ?
            (targetRoom.startsWith('game_') ? targetRoom as TournamentRoomName : targetRoom as QuizRoomName) :
            `game_${code}` as TournamentRoomName;

        // Emit the results using the updated signature
        emitQuestionResults(io, roomTarget, resultsParams);
    } else {
        logger.warn(`[handleTimerExpiration] Could not find question responses for UID: ${currentQuestionUid} to emit correct answers.`);
    }

    // --- LEADERBOARD UPDATE (If applicable) ---
    // updateLeaderboardAndEmit(io, code, state); // Re-evaluate if leaderboardUtils.ts is restored/used

    // --- STOPPING CONDITION & AUTO PROGRESSION (largely unchanged) ---
    if (state.settings?.autoProgress && state.askedQuestions.size >= state.questions.length) {
        logger.info(`[handleTimerExpiration] Tournament ${code} has shown all questions. autoProgress=${state.settings?.autoProgress}, asked=${state.askedQuestions.size}, total=${state.questions.length}`);

        // In auto-progress mode, stop the tournament when all questions have been shown
        state.stopped = true;

        // Emit a special event to mark the end of the tournament
        io.to(`game_${code}`).emit('tournament_finished', {
            message: 'Le tournoi est terminé !'
        });

        logger.info(`[handleTimerExpiration] Marked tournament ${code} as stopped and emitted tournament_finished event`);

        // For linked quiz mode, we would not progress automatically but would wait for teacher actions
        if (state.linkedQuizId) {
            logger.info(`[handleTimerExpiration] Tournament ${code} is linked to quiz ${state.linkedQuizId}, not sending any more questions automatically`);
        }

        return;
    }

    // --- AUTO PROGRESSION ---
    // Find the next question index
    if (!state.settings?.autoProgress) {
        logger.info(`[handleTimerExpiration] Tournament ${code} is not set to auto-progress. Waiting for manual advancement.`);
        return;
    }

    if (state.linkedQuizId) {
        logger.info(`[handleTimerExpiration] Tournament ${code} is linked to quiz ${state.linkedQuizId}, not advancing automatically`);
        return;
    }

    // Auto-progress logic (non-linked tournaments only)
    let nextIndex = -1;
    const currentIndex = state.questions.findIndex((q: Question) => q.uid === currentQuestionUid);

    if (currentIndex !== -1) {
        // Simple progression: move to the next question in the array
        nextIndex = currentIndex + 1;
    }

    // Check if we have a valid next question
    if (nextIndex >= 0 && nextIndex < state.questions.length) {
        logger.info(`[handleTimerExpiration] Auto-advancing to next question (index ${nextIndex}) for tournament ${code}`);

        const nextQuestion = state.questions[nextIndex];
        const nextQuestionUid = nextQuestion.uid;

        // Record that we've asked this question
        state.askedQuestions.add(nextQuestionUid);

        logger.info(`[handleTimerExpiration] Added question UID ${nextQuestionUid} to askedQuestions for tournament ${code}`);
        logger.debug(`[handleTimerExpiration] Current asked questions: ${Array.from(state.askedQuestions).join(', ')}`);

        // Send the next question
        try {
            sendQuestionWithState(io, code, nextIndex, nextQuestionUid);
        } catch (error) {
            logger.error(`[handleTimerExpiration] Error in sendQuestionWithState: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
        // No more questions left - we should have caught this above, but just in case
        logger.info(`[handleTimerExpiration] No more questions to show for tournament ${code}. Stopping...`);
        state.stopped = true;

        io.to(`game_${code}`).emit('tournament_finished', {
            message: 'Le tournoi est terminé !'
        });
    }

    logger.info(`[handleTimerExpiration] END for code=${code} at ${new Date().toISOString()}`);
}

/**
 * Sends a question to tournament participants with the current state
 * 
 * @param io - Socket.IO server instance
 * @param code - Tournament code
 * @param questionIndex - Index of the question to send
 * @param questionUid - UID of the question to send
 * @param targetRoom - Optional specific room to target 
 * @param isDiffered - Whether the tournament is in differed mode
 */
function sendQuestionWithState(
    io: Server,
    code: string,
    questionIndex: number,
    questionUid: string | undefined = undefined,
    targetRoom: string | null = null,
    isDiffered: boolean = false
): void {
    const state = tournamentState[code];
    if (!state || !state.questions || state.questions.length === 0) {
        logger.error(`[sendQuestionWithState] Invalid state for code ${code}`);
        return;
    }

    // If questionIndex is out of bounds, warn but continue with clamped value
    if (questionIndex < 0 || questionIndex >= state.questions.length) {
        logger.warn(`[sendQuestionWithState] Question index ${questionIndex} out of bounds for tournament ${code}. Clamping to valid range.`);
        questionIndex = Math.max(0, Math.min(questionIndex, state.questions.length - 1));
    }

    // Update the current question in the tournament state
    const question = questionUid
        ? state.questions.find((q: Question) => q.uid === questionUid)
        : state.questions[questionIndex];

    if (!question) {
        logger.error(`[sendQuestionWithState] Could not find question at index ${questionIndex} or UID ${questionUid} for tournament ${code}`);
        return;
    }

    const questionId = question.uid;
    state.currentQuestionUid = questionId;
    state.currentIndex = questionIndex; // Ensure current index is set
    state.currentQuestionIndex = questionIndex; // For backward compatibility
    state.questionStart = Date.now(); // Set the question start time

    const timer = state.settings?.timer || 60;
    logger.info(`[sendQuestionWithState] Preparing to send question ${questionId} to tournament ${code} with timer=${timer}s`);

    // Initialize or update the question timer with the full time
    if (!state.questionTimers) {
        state.questionTimers = {};
    }

    state.questionTimers[questionId] = {
        timeLeft: timer,
        initialTime: timer,
        lastUpdateTime: Date.now(),
        status: (state.paused || state.stopped) ? 'pause' : 'play'
    };

    // Determine the room name for the shared sendQuestion function
    const roomName = targetRoom ?? (isDiffered ? `differed_${code}` : `game_${code}`);

    // Prepare mode-specific data
    const modeSpecificData = {
        tournoiState: state.paused ? 'paused' : state.stopped ? 'stopped' : 'running',
        // questionId: questionId, // questionId is part of FilteredQuestion in shared sendQuestion
        code: code // Include tournament code if needed by client for this event
    };

    // Send the question data to clients using the shared function
    try {
        sendSharedQuestion(
            io,
            roomName,
            question, // The full question object
            timer,
            questionIndex,
            state.questions.length,
            modeSpecificData
        );
    } catch (err) {
        logger.error(`[sendQuestionWithState] Error sending question via shared function: ${err instanceof Error ? err.message : String(err)}`);
    }

    logger.info(`[sendQuestionWithState] Successfully initiated sending question ${questionId} to room ${roomName} for tournament ${code}`);

    // For logging and debugging
    const participantsCount = state.participants?.length || 0;
    const answeredCount = state.participants?.filter((p: TournamentParticipant) =>
        p.answers?.some((a: TournamentAnswer) => a.questionUid === questionId)
    ).length || 0;

    logger.debug(`[sendQuestionWithState] Tournament ${code} has ${participantsCount} participants, ${answeredCount} have answered question ${questionId}`);
}

/**
 * Named exports for destructuring import
 */
export {
    getEmitTarget,
    handleTimerExpiration,
    sendQuestionWithState,
};
