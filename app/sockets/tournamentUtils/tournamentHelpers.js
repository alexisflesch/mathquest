const createLogger = require('../../logger');
const logger = createLogger('TournamentHelpers');
const { tournamentState } = require('./tournamentState');
const { sendTournamentQuestion } = require('./sendTournamentQuestion');

// Helper function to calculate score (extracted for clarity)
function calculateScore(question, answer, questionStartTime) {
    let baseScore = 0, rapidity = 0, totalScore = 0;
    const timeAllowed = question.temps || 20;

    if (answer) {
        if (question.type === 'choix_multiple') {
            const selected = Array.isArray(answer.answerIdx) ? answer.answerIdx : [answer.answerIdx];
            let good = 0, bad = 0, totalGood = 0;
            question.reponses.forEach((rep, idx) => {
                if (rep.correct) totalGood++;
                if (selected.includes(idx)) {
                    if (rep.correct) good++;
                    else bad++;
                }
            });
            let raw = 100 * good - 100 * bad;
            baseScore = Math.max(0, Math.min(100, totalGood ? raw / totalGood : 0));
        } else {
            const correct = question?.reponses[answer.answerIdx]?.correct;
            baseScore = correct ? 100 : 0;
        }

        if (questionStartTime && answer.clientTimestamp) {
            const timeUsed = (answer.clientTimestamp - questionStartTime) / 1000;
            // Ensure timeUsed doesn't exceed timeAllowed for score calculation
            const effectiveTimeUsed = Math.min(timeUsed, timeAllowed);
            rapidity = Math.max(0, Math.min(5, 5 * (1 - effectiveTimeUsed / timeAllowed)));
        }
        totalScore = Math.round(baseScore + rapidity);
    }
    return { baseScore, rapidity, totalScore };
}

// --- Centralized Timer Expiration Logic ---
async function handleTimerExpiration(io, code) {
    logger.info(`[handleTimerExpiration] ENTERED for code=${code}`);
    const state = tournamentState[code];
    if (!state || state.paused || state.stopped) {
        logger.debug(`[handleTimerExpiration] Early return for code=${code}. paused=${state?.paused}, stopped=${state?.stopped}`);
        return; // Ignore if paused, stopped, or state doesn't exist
    }

    const prisma = require('../../db');
    const idx = state.currentIndex;
    const q = state.questions[idx];

    logger.info(`Timer expired for question ${idx} (uid: ${q?.uid}) in tournament ${code}`);

    // --- SCORING ---
    const participantScores = {};
    Object.entries(state.participants || {}).forEach(([joueurId, participant]) => {
        const answer = state.answers[joueurId]?.[q?.uid];
        // Use calculateScore helper
        const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);

        participant.score += totalScore; // Update total score
        participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };

        // Emit result to each participant
        const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
        if (socketId) {
            if (state.linkedQuizId) {
                // QUIZ MODE: Do not send correctness or explanation
                io.to(socketId).emit("tournament_answer_result", {
                    received: true
                });
            } else {
                // Classic mode: send full feedback
                io.to(socketId).emit("tournament_answer_result", {
                    correct: baseScore > 0,
                    score: participant.score, // Send updated total score
                    explanation: q?.explication || null,
                    baseScore,
                    rapidity: Math.round(rapidity * 100) / 100,
                    totalScore, // Score for this question
                });
            }
        }
    });

    // Emit state update indicating the question time ended
    io.to(`tournament_${code}`).emit("tournament_question_state_update", {
        questionState: "ended",
        remainingTime: 0
    });
    logger.debug(`Emitted tournament_question_state_update(ended) for ${code}`);

    // --- Move to next question or end tournament (ONLY FOR CLASSIC TOURNAMENTS) ---
    if (!state.linkedQuizId) {
        if (idx + 1 < state.questions.length) {
            logger.info(`Classic tournament ${code}: Moving to next question`);
            // Send the next question
            await sendQuestionWithState(io, code, idx + 1, null);
            // Start the timer for the next question
            const nextQ = state.questions[idx + 1];
            const nextTime = nextQ?.temps || 20;
            const { triggerTournamentTimerSet } = require('./tournamentTriggers');
            triggerTournamentTimerSet(io, code, nextTime, true);
        } else {
            logger.info(`Classic tournament ${code}: Ending after last question`);
            const { forceTournamentEnd } = require('./tournamentTriggers');
            await forceTournamentEnd(io, code);
        }
    } else {
        logger.info(`Quiz-linked tournament ${code}: Timer expired, waiting for teacher action.`);
        state.stopped = true;
        // --- EMIT TO TEACHER DASHBOARD (quiz_${quizId}) ---
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
            logger.info(`[handleTimerExpiration] Emitted quiz_timer_update (stop) to quiz_${state.linkedQuizId} (questionId=${questionUid})`);
        }
    }
}

// *** Add initialTime parameter, remove timer logic for quiz-linked ***
async function sendQuestionWithState(io, code, idx, initialTime = null) {
    const prisma = require('../../db'); // Require prisma inside the function or pass it as an argument if needed frequently
    const state = tournamentState[code];
    if (!state || !state.questions || idx >= state.questions.length) {
        logger.error(`Invalid state or index for code ${code}, index ${idx}`);
        return; // Should ideally handle end of tournament here or before calling
    }

    const q = state.questions[idx];
    if (!q) {
        logger.error(`Question not found at index ${idx} for code ${code}`);
        return;
    }

    // *** Use initialTime if provided, otherwise use question's time ***
    const time = initialTime !== null ? initialTime : (q.temps || 20);
    state.currentIndex = idx;
    state.questionStart = Date.now();
    state.paused = false;
    state.pausedRemainingTime = null;
    state.stopped = false;            // Reset stopped state when sending a new question
    state.currentQuestionDuration = time; // Set current duration based on initialTime or q.temps

    // Filter reponses for students (remove 'correct')
    const filteredReponses = Array.isArray(q.reponses)
        ? q.reponses.map(r => ({ texte: r.texte }))
        : [];
    const filteredQuestion = {
        ...q,
        reponses: filteredReponses
    };

    // Enhanced debug logging
    logger.debug(`Preparing to emit tournament_question:`, {
        code,
        questionIndex: idx,
        questionId: q.uid,
        questionText: q.question.substring(0, 30) + (q.question.length > 30 ? '...' : ''),
        time,
        responseCount: q.reponses ? q.reponses.length : 0
    });

    // Log room info before emitting
    const roomName = `tournament_${code}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    logger.debug(`Emitting to room ${roomName} with ${room ? room.size : 0} connected sockets`);
    if (room && room.size > 0) {
        logger.debug(`Socket IDs in room:`, Array.from(room));
    } else {
        logger.warn(`No sockets in room ${roomName} to receive question`);
    }

    logger.info(`Emitting tournament_question (idx: ${idx}, uid: ${q.uid}) to room tournament_${code}`);
    logger.info(`[QUIZMODE DEBUG] Emitting tournament_question for code=${code} with state.linkedQuizId=${state.linkedQuizId}`);
    sendTournamentQuestion(io, `tournament_${code}`, q, idx, state.questions.length, time, "active", !!state.linkedQuizId);

    // --- Timer logic removed from here for quiz-linked tournaments ---
    // The timer will be started/managed by triggerTournamentTimerSet
    // For classic tournaments, the timer is started after expiration of the previous one inside handleTimerExpiration

    // Clear any *old* timer just in case (shouldn't be necessary with new flow)
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
        logger.debug(`Cleared residual timer in sendQuestionWithState for ${code}`);
    }
}

module.exports = { calculateScore, sendQuestionWithState, handleTimerExpiration };
