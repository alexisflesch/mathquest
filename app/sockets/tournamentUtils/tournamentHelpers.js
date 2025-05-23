const createLogger = require('../../logger');
const logger = createLogger('TournamentHelpers');
const { tournamentState } = require('./tournamentState');
const { sendTournamentQuestion } = require('./sendTournamentQuestion');
const { calculateScore, scaleScoresForQuiz, saveParticipantScore } = require('./scoreUtils');

// Ensure live and differed modes share the same logic by unifying the handling of room sockets and the isDiffered flag.
function getEmitTarget(io, code, targetRoom, isDiffered) {
    return targetRoom ? io.to(targetRoom) : io.to(isDiffered ? `differed_${code}` : `live_${code}`);
}

// --- Centralized Timer Expiration Logic ---
async function handleTimerExpiration(io, code, targetRoom = null) {
    logger.info(`[handleTimerExpiration] ENTERED for code=${code}`);
    logger.info(`[handleTimerExpiration] START for code=${code} at ${new Date().toISOString()}`);
    const state = tournamentState[code];
    if (!state || state.paused || state.stopped) {
        logger.debug(`[handleTimerExpiration] Early return for code=${code}. paused=${state?.paused}, stopped=${state?.stopped}`);
        return; // Ignore if paused, stopped, or state doesn't exist
    }

    const prisma = require('../../db');
    const question = state.questions.find(q => q.uid === state.currentQuestionUid);
    if (!question) {
        logger.error(`[handleTimerExpiration] Question UID ${state.currentQuestionUid} not found in tournament state.`);
        return;
    }

    logger.info(`Timer expired for question ${state.currentQuestionUid} (uid: ${question?.uid}) in tournament ${code}`);

    // --- SCORING ---
    logger.info(`[handleTimerExpiration] Scoring for question ${question?.uid} in tournament ${code}. Participants: ${Object.keys(state.participants || {}).join(', ')}`);
    const participantScores = {};
    Object.entries(state.participants || {}).forEach(([joueurId, participant]) => {
        const answer = state.answers[joueurId]?.[question?.uid];
        if (!answer) {
            logger.warn(`[handleTimerExpiration] No answer found for participant ${joueurId} on question ${question?.uid}. Assigning score of 0.`);
        }
        // Use calculateScore helper
        const { baseScore, timePenalty, totalScore } = calculateScore(question, answer, state.questionStart, state.questions.length);
        logger.info(`[handleTimerExpiration] Participant ${joueurId}: baseScore=${baseScore}, timePenalty=${timePenalty}, totalScore=${totalScore}`);

        // Ensure participant.score is updated correctly
        if (!state.scores) state.scores = {};
        if (!state.scores[joueurId]) state.scores[joueurId] = 0;

        // Add the current question's score to the participant's total score
        state.scores[joueurId] += totalScore;
        participant.score = state.scores[joueurId];

        logger.debug(`[handleTimerExpiration] Updated total score for joueurId=${joueurId}: ${participant.score}`);

        participantScores[joueurId] = { baseScore, timePenalty, totalScore, currentTotal: participant.score };

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
                    explanation: question?.explication || null,
                    baseScore,
                    timePenalty: Math.round(timePenalty * 100) / 100,
                    totalScore, // Score for this question
                });
            }
        }
    });

    // Ensure scores are saved after calculation
    async function saveScoresAfterCalculation(prisma, code, participants) {
        if (!participants || typeof participants !== 'object') {
            logger.error(`[saveScoresAfterCalculation] Invalid participants object for code=${code}. Skipping score saving.`);
            return;
        }
        const tournoi = await prisma.tournoi.findUnique({ where: { code } });
        logger.info(`[Leaderboard Fetch] Retrieved tournoi data for code ${code}`);
        if (!tournoi) {
            logger.error(`[saveScoresAfterCalculation] Tournoi with code=${code} does not exist. Skipping score saving.`);
            return;
        }
        const tournoiId = tournoi.id;

        // Save the final scores
        for (const [joueurId, participant] of Object.entries(state.participants)) {
            // Log the score being passed to saveParticipantScore
            logger.debug(`[saveScoresAfterCalculation] Using existing score=${participant.score} for joueurId=${joueurId}`);
            await saveParticipantScore(prisma, tournoiId, participant);
        }
    }

    // Update handleTimerExpiration to save scores
    await saveScoresAfterCalculation(prisma, code, state.participants);

    // Use targetRoom for emits in differed mode, or default to io.to(`live_${code}`) for live
    const emitTarget = getEmitTarget(io, code, targetRoom, code.includes('_'));

    // Emit state update indicating the question time ended
    emitTarget.emit("tournament_question_state_update", {
        questionState: "ended",
        remainingTime: 0
    });
    logger.debug(`Emitted tournament_question_state_update(ended) for ${code}`);

    // --- Move to next question or end tournament (ONLY FOR CLASSIC TOURNAMENTS) ---
    if (!state.linkedQuizId) {
        if (state.questions.findIndex(q => q.uid === state.currentQuestionUid) + 1 < state.questions.length) {
            // --- Explication Overlay Logic ---
            if (question?.explication) {
                logger.info(`[handleTimerExpiration] Preparing to emit explication for question ${question.uid} to room ${targetRoom ? targetRoom : `live_${code}`}`);
                // Build array of correct answers (indices)
                const correctAnswers = Array.isArray(question?.reponses)
                    ? question.reponses.map((rep, idx) => rep.correct ? idx : null).filter(idx => idx !== null)
                    : [];
                // Emit correct answers to students using unified event name
                emitTarget.emit("quiz_question_results", {
                    questionUid: question.uid,
                    correctAnswers
                });
                // Wait 1.5 seconds before sending explication
                await new Promise(res => setTimeout(res, 1500));
                emitTarget.emit("explication", {
                    questionUid: question.uid,
                    explication: question.explication
                });
                logger.info(`[handleTimerExpiration] Emitted explication event for question ${question.uid} to room ${targetRoom ? targetRoom : `live_${code}`}`);
                logger.info(`[handleTimerExpiration] Emitted explication for question ${question.uid} in tournament ${code} at ${new Date().toISOString()}`);
                // Wait 5000 seconds before proceeding (for testing)
                await new Promise(res => setTimeout(res, 5 * 1000));
                logger.info(`[handleTimerExpiration] Finished explication delay for question ${question.uid} in tournament ${code} at ${new Date().toISOString()}`);
            }
            logger.info(`Classic tournament ${code}: Moving to next question at ${new Date().toISOString()}`);
            // Send the next question and set the timer
            scheduleNextQuestionWithTimer(io, code, state.questions.findIndex(q => q.uid === state.currentQuestionUid) + 1, targetRoom);
        } else {
            // --- PATCH: End tournament for differed mode (per-user room) ---
            // Detect differed mode by room naming convention (code contains '_')
            const isDiffered = code.includes('_');
            if (question) {
                // Build array of correct answers (indices)
                const correctAnswers = Array.isArray(question?.reponses)
                    ? question.reponses.map((rep, idx) => rep.correct ? idx : null).filter(idx => idx !== null)
                    : [];
                emitTarget.emit("quiz_question_results", {
                    questionUid: question.uid,
                    correctAnswers
                });
                await new Promise(res => setTimeout(res, 1500));
                if (question.explication) {
                    logger.info(`[handleTimerExpiration] Preparing to emit explication for last question ${question.uid} to room ${targetRoom ? targetRoom : `live_${code}`}`);
                    emitTarget.emit("explication", {
                        questionUid: question.uid,
                        explication: question.explication
                    });
                    logger.info(`[handleTimerExpiration] Emitted explication event for last question ${question.uid} to room ${targetRoom ? targetRoom : `live_${code}`}`);
                    logger.info(`[handleTimerExpiration] Emitted explication for last question ${question.uid} in tournament ${code} at ${new Date().toISOString()}`);
                    await new Promise(res => setTimeout(res, 5 * 1000));
                    logger.info(`[handleTimerExpiration] Finished explication delay for last question ${question.uid} in tournament ${code} at ${new Date().toISOString()}`);
                }
            }
            if (isDiffered) {
                emitTournamentEndAndRedirect(io, code, targetRoom,
                    state.participants && state.participants[Object.keys(state.participants)[0]]?.score || 0,
                    Object.values(state.participants)
                        .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                        .sort((a, b) => b.score - a.score)
                );
                try {
                    const tournoiCode = code.split('_')[0];
                    logger.info(`[DifferedEnd] Looking up tournoi for code=${tournoiCode}`);
                    const tournoi = await prisma.tournoi.findUnique({ where: { code: tournoiCode } });
                    if (tournoi) {
                        await saveAllTournamentScores(prisma, tournoi, state.participants);
                    } else {
                        logger.error(`[DifferedEnd] No tournoi found for code=${tournoiCode}`);
                    }
                } catch (err) { logger.error('[DifferedEnd] Error saving score:', err); }
                if (tournamentState[code]?.timer) clearTimeout(tournamentState[code].timer);
                delete tournamentState[code];
                return;
            } else {
                emitTournamentEndAndRedirect(io, code, null,
                    state.participants && state.participants[Object.keys(state.participants)[0]]?.score || 0,
                    Object.values(state.participants)
                        .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                        .sort((a, b) => b.score - a.score)
                );
                const { forceTournamentEnd } = require('./tournamentTriggers');
                await forceTournamentEnd(io, code);
            }
        }
    } else {
        logger.info(`Quiz-linked tournament ${code}: Timer expired, waiting for teacher action.`);
        state.stopped = true;
        // --- EMIT TO TEACHER DASHBOARD (dashboard_${quizId}) ---
        if (state.linkedQuizId) {
            // Try to get the current question UID
            let questionUid = null;
            if (typeof state.currentQuestionUid === 'string') {
                questionUid = state.currentQuestionUid;
            }
            io.to(`dashboard_${state.linkedQuizId}`).emit("quiz_timer_update", {
                status: 'stop',
                questionId: questionUid,
                timeLeft: 0,
                timestamp: Date.now()
            });
            logger.info(`[handleTimerExpiration] Emitted quiz_timer_update (stop) to dashboard_${state.linkedQuizId} (questionId=${questionUid})`);
        }
    }
    logger.info(`[handleTimerExpiration] END for code=${code} at ${new Date().toISOString()}`);
}

// Update sendQuestionWithState to accept targetRoom and use it for emits
async function sendQuestionWithState(io, code, idx, initialTime = null, targetRoom = null) {
    const prisma = require('../../db'); // Require prisma inside the function or pass it as an argument if needed frequently
    const state = tournamentState[code];
    if (!state || !state.questions || idx >= state.questions.length) {
        logger.error(`Invalid state or index for code ${code}, index ${idx}`);
        return; // Should ideally handle end of tournament here or before calling
    }

    const question = state.questions[idx];
    if (!question) {
        logger.error(`Question not found at index ${idx} for code ${code}`);
        return;
    }

    // Store both index and UID for consistent question identification
    state.currentQuestionUid = question.uid; // Explicitly store the UID for consistent communication

    // *** Use initialTime if provided, otherwise use question's time ***
    const time = initialTime !== null ? initialTime : (question.temps || 20);
    state.questionStart = Date.now();
    state.paused = false;
    state.pausedRemainingTime = null;
    state.stopped = false;            // Reset stopped state when sending a new question
    state.currentQuestionDuration = time; // Set current duration based on initialTime or question.temps

    // Ensure askedQuestions set is initialized in tournamentState
    if (!state.askedQuestions) {
        state.askedQuestions = new Set();
    }

    // Add the current question UID to the askedQuestions set
    if (question && question.uid) {
        state.askedQuestions.add(question.uid);
        logger.debug(`[sendQuestionWithState] Added question UID ${question.uid} to askedQuestions for tournament ${code}`);
        // Log the addition of the question UID to the askedQuestions set
        logger.info(`[sendQuestionWithState] Adding question UID ${question.uid} to askedQuestions for tournament ${code}. Current set: ${Array.from(state.askedQuestions).join(', ')}`);
    }

    // Filter reponses for students (remove 'correct')
    const filteredReponses = Array.isArray(question.reponses)
        ? question.reponses.map(r => ({ texte: r.texte }))
        : [];
    const filteredQuestion = {
        ...question,
        reponses: filteredReponses
    };

    // Enhanced debug logging
    logger.debug(`Preparing to emit tournament_question:`, {
        code,
        questionIndex: idx,
        questionId: question.uid,
        questionText: question.question.substring(0, 30) + (question.question.length > 30 ? '...' : ''),
        time,
        responseCount: question.reponses ? question.reponses.length : 0
    });

    // Log room info before emitting
    const roomName = `live_${code}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    logger.debug(`Emitting to room ${roomName} with ${room ? room.size : 0} connected sockets`);
    if (room && room.size > 0) {
        logger.debug(`Socket IDs in room:`, Array.from(room));
    } else {
        logger.warn(`No sockets in room ${roomName} to receive question`);
    }

    logger.info(`Emitting tournament_question (idx: ${idx}, uid: ${question.uid}) to room live_${code}`);
    logger.info(`[QUIZMODE DEBUG] Emitting tournament_question for code=${code} with state.linkedQuizId=${state.linkedQuizId}`);

    // Use targetRoom if provided, else emit to room
    if (targetRoom) {
        sendTournamentQuestion(io, targetRoom, question, idx, state.questions.length, time, "active", !!state.linkedQuizId);
    } else {
        sendTournamentQuestion(io, `live_${code}`, question, idx, state.questions.length, time, "active", !!state.linkedQuizId);
    }

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

// DRY helper: schedule question and timer for both live and differed
function scheduleNextQuestionWithTimer(io, code, idx, targetRoom = null) {
    const state = tournamentState[code];
    if (!state || !state.questions || idx >= state.questions.length) {
        logger.error(`[scheduleNextQuestionWithTimer] Invalid state or index for code=${code}, idx=${idx}`);
        return;
    }
    // Send the question
    sendQuestionWithState(io, code, idx, null, targetRoom);
    // Clear any previous timer
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
        logger.debug(`[scheduleNextQuestionWithTimer] Cleared previous timer for code=${code}`);
    }
    const question = state.questions[idx];
    const time = question.temps || 20;
    logger.info(`[scheduleNextQuestionWithTimer] Setting timer for code=${code}, idx=${idx}, duration=${time}s`);
    state.timer = setTimeout(async function () {
        logger.info(`[scheduleNextQuestionWithTimer] Timer fired for code=${code}, idx=${idx}`);
        await handleTimerExpiration(io, code, targetRoom);
    }, time * 1000);
    logger.info(`[scheduleNextQuestionWithTimer] Timer set for code=${code}, will fire at ${new Date(Date.now() + time * 1000).toISOString()}`);
}

// DRY: emit tournament_end and tournament_finished_redirect for both live and differed
function emitTournamentEndAndRedirect(io, code, targetRoom, finalScore, leaderboard) {
    const emitTarget = getEmitTarget(io, code, targetRoom, code.includes('_'));
    emitTarget.emit('tournament_end', { finalScore, leaderboard });
    emitTarget.emit('tournament_finished_redirect', { code: code.split('_')[0] });
}

// DRY helper: Save all participants' scores to the DB (live or differed)
async function saveAllTournamentScores(prisma, tournoi, participants) {
    if (!tournoi || !tournoi.id) {
        logger.error('[saveAllTournamentScores] No tournoi or tournoi.id provided');
        return;
    }
    for (const participant of Object.values(participants)) {
        if (!participant.id || participant.id.startsWith('socket_')) {
            logger.warn(`[saveAllTournamentScores] Not saving score for non-persistent participant: ${participant.id}`);
            continue;
        }
        logger.info(`[saveAllTournamentScores] Saving score for tournoiId=${tournoi.id}, joueurId=${participant.id}, score=${participant.score}`);
        const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: participant.id } });
        if (existing) {
            logger.info(`[saveAllTournamentScores] Updating existing score record id=${existing.id}`);
            await prisma.score.update({ where: { id: existing.id }, data: { score: participant.score, date_score: new Date() } });
        } else {
            logger.info(`[saveAllTournamentScores] Creating new score record`);
            await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: participant.id, score: participant.score, date_score: new Date() } });
        }
    }
    // After all scores are saved, update the leaderboard field
    await updateTournamentLeaderboard(prisma, tournoi);
}

// DRY helper: Update the leaderboard field in the tournoi table
async function updateTournamentLeaderboard(prisma, tournoi) {
    // Log when updateTournamentLeaderboard is called
    logger.info(`[updateTournamentLeaderboard] Called for tournoi ${tournoi.id}`);

    // Check if the leaderboard is already scaled and saved
    const existingTournoi = await prisma.tournoi.findUnique({ where: { id: tournoi.id } });
    if (existingTournoi && existingTournoi.leaderboard && existingTournoi.leaderboard.length > 0) {
        logger.info(`[updateTournamentLeaderboard] Skipping update as scaled leaderboard already exists for tournoi ${tournoi.id}`);
        return;
    }
    // Fetch all scores for this tournament
    const scores = await prisma.score.findMany({
        where: { tournoi_id: tournoi.id },
        include: { joueur: true },
    });
    // Build leaderboard array
    const leaderboard = scores.map(s => ({
        id: s.joueur_id,
        pseudo: s.joueur?.pseudo || 'Joueur',
        avatar: s.joueur?.avatar || null,
        score: s.score,
        isDiffered: !!s.isDiffered // fallback: not in DB, so always false unless you add it
    })).sort((a, b) => b.score - a.score);
    await prisma.tournoi.update({ where: { id: tournoi.id }, data: { leaderboard } });
}

module.exports = { calculateScore, sendQuestionWithState, handleTimerExpiration, scheduleNextQuestionWithTimer, saveParticipantScore };
