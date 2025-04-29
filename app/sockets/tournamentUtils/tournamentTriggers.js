const createLogger = require('../../logger');
const logger = createLogger('TournamentTriggers');
const { tournamentState } = require('./tournamentState');
const { sendQuestionWithState } = require('./tournamentHelpers'); // Import helper

// --- Trigger Functions (Exported) ---
// *** Add initialTime parameter ***
function triggerTournamentQuestion(io, code, index, linkedQuizId = null, initialTime = null) {
    const state = tournamentState[code];
    if (!state || !state.questions || index >= state.questions.length) {
        logger.error(`Invalid state or index for code ${code}, index ${index}`);
        return;
    }
    state.linkedQuizId = linkedQuizId;

    // Enhanced debug logging
    logger.debug(`triggerTournamentQuestion called with code=${code}, index=${index}, linkedQuizId=${linkedQuizId || 'none'}`);
    logger.debug(`Tournament state before sending question:`, {
        currentIndex: state.currentIndex,
        questionCount: state.questions.length,
        question: state.questions[index] ? {
            uid: state.questions[index].uid,
            question: state.questions[index].question,
            type: state.questions[index].type
        } : 'not found'
    });

    // Log room info
    const roomName = `tournament_${code}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    logger.debug(`Room ${roomName} has ${room ? room.size : 0} connected sockets`);
    if (room && room.size > 0) {
        logger.debug(`Sockets in room:`, Array.from(room));
    }

    // *** Pass initialTime to sendQuestionWithState ***
    // No need for await here as the caller doesn't depend on the result immediately
    sendQuestionWithState(io, code, index, initialTime);
}

function triggerTournamentPause(io, code) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = (Date.now() - state.questionStart) / 1000;
        // Use currentQuestionDuration if available, otherwise fallback
        const timeAllowed = state.currentQuestionDuration || state.questions[state.currentIndex]?.temps || 20;
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

        // Set paused flag to true
        state.paused = true;

        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "paused", remainingTime: state.pausedRemainingTime });
    }
}

function triggerTournamentResume(io, code) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && state.paused) {
        state.paused = false;
        // Use currentQuestionDuration if available, otherwise fallback
        const timeAllowed = state.currentQuestionDuration || state.questions[state.currentIndex]?.temps || 20;
        state.questionStart = Date.now() - (timeAllowed - state.pausedRemainingTime) * 1000; // Adjust start time
        const remaining = state.pausedRemainingTime;
        state.pausedRemainingTime = null;

        logger.info(`Resuming tournament ${code}. Remaining time: ${remaining.toFixed(1)}s`);
        io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "active", remainingTime: remaining });

        // Restart timer
        if (state.timer) clearTimeout(state.timer);
        // Re-use the timer logic from sendQuestionWithState (needs refactoring there ideally)
        state.timer = setTimeout(async () => {
            // --- This logic is duplicated from sendQuestionWithState ---
            // TODO: Refactor timer logic into a separate reusable function
            const prisma = require('../../db'); // Need prisma here too
            const idx = state.currentIndex;
            const q = state.questions[idx];

            if (state.paused) return; // Check pause again just in case

            logger.info(`Timer expired after resume for question ${idx} (uid: ${q.uid}) in tournament ${code}`);

            const { calculateScore } = require('./tournamentHelpers'); // Import calculateScore

            // --- SCORING ---
            const participantScores = {};
            Object.entries(state.participants).forEach(([joueurId, participant]) => {
                const answer = state.answers[joueurId]?.[q.uid];
                const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);
                participant.score += totalScore;
                participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };
                const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                if (socketId) {
                    io.to(socketId).emit("tournament_answer_result", {
                        correct: baseScore > 0, score: participant.score, explanation: q?.explication || null,
                        baseScore, rapidity: Math.round(rapidity * 100) / 100, totalScore,
                    });
                }
            });

            // --- Move to next question or end ---
            if (idx + 1 < state.questions.length) {
                await sendQuestionWithState(io, code, idx + 1); // Use await
            } else {
                logger.info(`Ending tournament ${code} after resume timer`);
                const leaderboard = Object.values(state.participants)
                    .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                    .sort((a, b) => b.score - a.score);
                io.to(`tournament_${code}`).emit("tournament_end", { leaderboard });
                try {
                    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                    if (tournoi) {
                        for (const participant of Object.values(state.participants)) {
                            if (!participant.isDiffered) {
                                const joueurId = participant.id;
                                const scoreValue = participant.score;
                                if (!joueurId.startsWith('socket_')) {
                                    const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                                    if (existing) {
                                        await prisma.score.update({ where: { id: existing.id }, data: { score: scoreValue, date_score: new Date() } });
                                    } else {
                                        await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: joueurId, score: scoreValue, date_score: new Date() } });
                                    }
                                }
                            }
                        }
                        await prisma.tournoi.update({ where: { code }, data: { date_fin: new Date(), statut: 'terminé', leaderboard } });
                    }
                } catch (err) { logger.error(`Error saving scores/updating tournament ${code} after resume:`, err); }
                io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState[code];
            }
            // --- End of duplicated logic ---
        }, remaining * 1000);
    }
}

function triggerTournamentTimerSet(io, code, timeLeft) {
    const state = tournamentState[code];
    if (state) {
        logger.info(`Timer set to ${timeLeft} seconds for tournament ${code}`);

        // Clear any existing timer
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        // Update state
        if (timeLeft === 0) {
            // If timer is set to 0, consider the question "stopped"
            state.stopped = true; // Use explicit stopped state
            state.paused = false; // Not paused - this is a stopped state
            state.currentQuestionDuration = 0; // Update duration

            // Notify clients that time is up
            io.to(`tournament_${code}`).emit("tournament_set_timer", {
                timeLeft: 0,
                questionState: "stopped"
            });
        } else {
            // For other time settings, update the remaining time
            state.stopped = false; // Ensure not in stopped state

            // If paused, just store the new time
            if (state.paused) {
                state.pausedRemainingTime = timeLeft;
                state.currentQuestionDuration = timeLeft; // Update duration
                io.to(`tournament_${code}`).emit("tournament_set_timer", {
                    timeLeft,
                    questionState: "paused"
                });
            } else {
                // Active: restart timer and update duration
                const oldDuration = state.currentQuestionDuration; // Log old value
                state.questionStart = Date.now(); // Reset start time for new duration
                state.currentQuestionDuration = timeLeft; // Update duration

                // Re-use the timer logic from sendQuestionWithState (needs refactoring there ideally)
                state.timer = setTimeout(async () => {
                    // --- This logic is duplicated from sendQuestionWithState ---
                    // TODO: Refactor timer logic into a separate reusable function
                    const prisma = require('../../db'); // Need prisma here too
                    const idx = state.currentIndex;
                    const q = state.questions[idx];

                    if (state.paused) return; // Check pause again just in case

                    logger.info(`Timer expired after set timer for question ${idx} (uid: ${q.uid}) in tournament ${code}`);

                    const { calculateScore } = require('./tournamentHelpers'); // Import calculateScore

                    // --- SCORING ---
                    const participantScores = {};
                    Object.entries(state.participants).forEach(([joueurId, participant]) => {
                        const answer = state.answers[joueurId]?.[q.uid];
                        const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);
                        participant.score += totalScore;
                        participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };
                        const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                        if (socketId) {
                            io.to(socketId).emit("tournament_answer_result", {
                                correct: baseScore > 0, score: participant.score, explanation: q?.explication || null,
                                baseScore, rapidity: Math.round(rapidity * 100) / 100, totalScore,
                            });
                        }
                    });

                    // --- Move to next question or end ---
                    if (idx + 1 < state.questions.length) {
                        await sendQuestionWithState(io, code, idx + 1); // Use await
                    } else {
                        logger.info(`Ending tournament ${code} after set timer`);
                        const leaderboard = Object.values(state.participants)
                            .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                            .sort((a, b) => b.score - a.score);
                        io.to(`tournament_${code}`).emit("tournament_end", { leaderboard });
                        try {
                            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                            if (tournoi) {
                                for (const participant of Object.values(state.participants)) {
                                    if (!participant.isDiffered) {
                                        const joueurId = participant.id;
                                        const scoreValue = participant.score;
                                        if (!joueurId.startsWith('socket_')) {
                                            const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                                            if (existing) {
                                                await prisma.score.update({ where: { id: existing.id }, data: { score: scoreValue, date_score: new Date() } });
                                            } else {
                                                await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: joueurId, score: scoreValue, date_score: new Date() } });
                                            }
                                        }
                                    }
                                }
                                await prisma.tournoi.update({ where: { code }, data: { date_fin: new Date(), statut: 'terminé', leaderboard } });
                            }
                        } catch (err) { logger.error(`Error saving scores/updating tournament ${code} after set timer:`, err); }
                        io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
                        delete tournamentState[code];
                    }
                    // --- End of duplicated logic ---
                }, timeLeft * 1000);

                io.to(`tournament_${code}`).emit("tournament_set_timer", {
                    timeLeft,
                    questionState: "active"
                });
            }
        }
    }
}

// --- Force end of tournament, save scores, update leaderboard, emit redirect ---
async function forceTournamentEnd(io, code) {
    const state = tournamentState[code];
    if (!state) return;
    const prisma = require('../../db');
    logger.info(`[FORCE END] Forcing end of tournament ${code}`);
    logger.info(`[FORCE END] Tournament state:`, JSON.stringify(state, null, 2));
    // Calculer le score final pour chaque participant (même si pas de question active)
    const leaderboard = Object.values(state.participants || {})
        .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
        .sort((a, b) => b.score - a.score);
    logger.info(`[FORCE END] Computed leaderboard:`, JSON.stringify(leaderboard, null, 2));
    io.to(`tournament_${code}`).emit("tournament_end", { leaderboard });
    try {
        const tournoi = await prisma.tournoi.findUnique({ where: { code } });
        logger.info(`[FORCE END] Prisma tournoi found:`, tournoi ? tournoi.id : 'not found');
        if (tournoi) {
            for (const participant of Object.values(state.participants || {})) {
                logger.info(`[FORCE END] Saving score for participant:`, participant);
                if (!participant.isDiffered && participant.id && !participant.id.startsWith('socket_')) {
                    const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: participant.id } });
                    if (existing) {
                        logger.info(`[FORCE END] Updating existing score for joueur_id=${participant.id}`);
                        await prisma.score.update({ where: { id: existing.id }, data: { score: participant.score, date_score: new Date() } });
                    } else {
                        logger.info(`[FORCE END] Creating new score for joueur_id=${participant.id}`);
                        await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: participant.id, score: participant.score, date_score: new Date() } });
                    }
                }
            }
            logger.info(`[FORCE END] Updating tournoi leaderboard and status`);
            await prisma.tournoi.update({ where: { code }, data: { date_fin: new Date(), statut: 'terminé', leaderboard } });
        }
    } catch (err) { logger.error(`[FORCE END] Error saving scores/updating tournament ${code}:`, err); }
    logger.info(`[FORCE END] Emitting tournament_finished_redirect to all clients`);
    io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
    delete tournamentState[code];
}

module.exports = {
    triggerTournamentQuestion,
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet,
    forceTournamentEnd,
};
