const createLogger = require('../../logger');
const logger = createLogger('ResumeTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');
const { sendQuestionWithState } = require('../tournamentUtils/tournamentHelpers'); // Import helpers

function handleTournamentResume(io, socket, { code }) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && state.paused) {
        state.paused = false;
        // Replace currentIndex with currentQuestionUid for fetching the active question
        const question = state.questions.find(q => q.uid === state.currentQuestionUid);
        if (!question) {
            logger.error(`[ResumeHandler] Question UID ${state.currentQuestionUid} not found in tournament state.`);
            return;
        }

        // Update all references to question properties
        const timeAllowed = question.temps || 20;
        state.questionStart = Date.now() - (timeAllowed - state.pausedRemainingTime) * 1000; // Adjust start time
        const remaining = state.pausedRemainingTime;
        state.pausedRemainingTime = null;

        logger.info(`Resuming tournament ${code}. Remaining time: ${remaining.toFixed(1)}s`);
        io.to(`live_${code}`).emit("tournament_question_state_update", { questionState: "active", remainingTime: remaining });

        // Restart timer
        if (state.timer) clearTimeout(state.timer);
        // Re-use the timer logic from sendQuestionWithState (needs refactoring there ideally)
        state.timer = setTimeout(async () => {
            // --- This logic is duplicated from sendQuestionWithState ---
            // TODO: Refactor timer logic into a separate reusable function
            const prisma = require('../../db'); // Need prisma here too
            const question = state.questions.find(q => q.uid === state.currentQuestionUid);
            if (!state || !state.questions || !question) {
                logger.error(`Timer expired after resume, but state/question invalid for ${code}, question UID ${state.currentQuestionUid}`);
                return;
            }

            if (state.paused) return; // Check pause again just in case

            logger.info(`Timer expired after resume for question UID ${state.currentQuestionUid} in tournament ${code}`);

            const { calculateScore } = require('../tournamentUtils/tournamentHelpers'); // Import calculateScore

            // --- SCORING ---
            const participantScores = {};
            Object.entries(state.participants).forEach(([joueurId, participant]) => {
                const answer = state.answers[joueurId]?.[question.uid];
                const { baseScore, rapidity, totalScore } = calculateScore(question, answer, state.questionStart);
                participant.score += totalScore;
                participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };
                const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                if (socketId) {
                    io.to(socketId).emit("tournament_answer_result", {
                        correct: baseScore > 0, score: participant.score, explanation: question?.explication || null,
                        baseScore, rapidity: Math.round(rapidity * 100) / 100, totalScore,
                    });
                }
            });

            // --- Move to next question or end ---
            const nextQuestion = state.questions.find(q => q.uid === state.nextQuestionUid);
            if (nextQuestion) {
                await sendQuestionWithState(io, code, nextQuestion.uid); // Use await
            } else {
                logger.info(`Ending tournament ${code} after resume timer`);
                const leaderboard = Object.values(state.participants)
                    .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                    .sort((a, b) => b.score - a.score);
                io.to(`live_${code}`).emit("tournament_end", { leaderboard });
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
                io.to(`live_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState[code];
            }
            // --- End of duplicated logic ---
        }, remaining * 1000);
    } else {
        logger.warn(`Received tournament_resume for ${code}, but state not found, is differed, or not paused.`);
    }
}

module.exports = handleTournamentResume;
