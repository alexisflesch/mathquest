const createLogger = require('../../logger');
const logger = createLogger('TournamentHelpers');
const { tournamentState } = require('./tournamentState');

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


// *** Add initialTime parameter ***
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
    state.currentQuestionDuration = time; // Set current duration based on initialTime or q.temps

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
    io.to(`tournament_${code}`).emit("tournament_question", {
        question: q,
        index: idx,
        total: state.questions.length,
        remainingTime: time, // Send full time initially
        questionState: "active",
    });

    if (state.timer) clearTimeout(state.timer);

    // Only start timer automatically if not in quiz mode (classic tournament mode)
    if (!state.linkedQuizId) {
        state.timer = setTimeout(async () => {
            if (state.paused) return; // Don't proceed if paused

            logger.info(`Timer expired for question ${idx} (uid: ${q.uid}) in tournament ${code}`);

            // --- SCORING: Evaluate latest answer for each participant ---\
            const participantScores = {}; // Store scores for this question
            Object.entries(state.participants).forEach(([joueurId, participant]) => {
                const answer = state.answers[joueurId]?.[q.uid];
                const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);

                participant.score += totalScore; // Update total score
                participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };

                // Emit result to each participant
                const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                if (socketId) {
                    io.to(socketId).emit("tournament_answer_result", {
                        correct: baseScore > 0,
                        score: participant.score, // Send updated total score
                        explanation: q?.explication || null,
                        baseScore,
                        rapidity: Math.round(rapidity * 100) / 100,
                        totalScore, // Score for this question
                    });
                }
            });

            // --- Move to next question or end tournament ---\
            if (idx + 1 < state.questions.length) {
                // Use await here since sendQuestionWithState is now async
                await sendQuestionWithState(io, code, idx + 1);
            } else {
                logger.info(`Ending tournament ${code}`);
                // Build final leaderboard
                const leaderboard = Object.values(state.participants)
                    .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                    .sort((a, b) => b.score - a.score);

                io.to(`tournament_${code}`).emit("tournament_end", {
                    leaderboard,
                    // finalScore is participant-specific, maybe remove from general emit?
                });

                // --- Save all scores for live participants (including disconnected) ---\
                try {
                    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                    if (tournoi) {
                        for (const participant of Object.values(state.participants)) {
                            if (!participant.isDiffered) { // Only save live scores here
                                const joueurId = participant.id;
                                const scoreValue = participant.score;
                                // Check if joueur exists (might be socket_id if no cookie)
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
                        // Update tournament status and final leaderboard
                        await prisma.tournoi.update({
                            where: { code },
                            data: { date_fin: new Date(), statut: 'terminé', leaderboard },
                        });
                    }
                } catch (err) {
                    logger.error(`Error saving live scores or updating tournament ${code}:`, err);
                }

                io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState[code]; // Clean up state
            }
        }, time * 1000);
    }
}


module.exports = { calculateScore, sendQuestionWithState };
