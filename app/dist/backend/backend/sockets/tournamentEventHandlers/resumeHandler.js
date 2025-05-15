"use strict";
/**
 * resumeHandler.ts - Tournament Resume Handler
 *
 * This module handles the tournament_resume event, resuming a paused tournament question.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentState_1 = require("../tournamentUtils/tournamentState");
const tournamentHelpers_1 = require("../tournamentUtils/tournamentHelpers");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('ResumeTournamentHandler');
/**
 * Handle tournament_resume event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The resume payload from the client
 */
function handleTournamentResume(io, socket, { code }) {
    const state = tournamentState_1.tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDeferred && state.paused) {
        state.paused = false;
        // Find the current question using currentQuestionUid
        const question = state.questions.find(q => q.uid === state.currentQuestionUid);
        if (!question) {
            logger.error(`[ResumeHandler] Question UID ${state.currentQuestionUid} not found in tournament state.`);
            return;
        }
        // Update all references to question properties
        const timeAllowed = question.time || 20;
        state.questionStart = Date.now() - (timeAllowed - (state.pausedRemainingTime || 0)) * 1000; // Adjust start time
        const remaining = state.pausedRemainingTime || 0;
        state.pausedRemainingTime = undefined; // Use undefined instead of null
        logger.info(`Resuming tournament ${code}. Remaining time: ${remaining.toFixed(1)}s`);
        io.to(`live_${code}`).emit("tournament_question_state_update", {
            questionState: "active",
            remainingTime: remaining
        });
        // Restart timer
        if (state.timer)
            clearTimeout(state.timer);
        // Re-use the timer logic from sendQuestionWithState (needs refactoring there ideally)
        state.timer = setTimeout(async () => {
            // --- This logic is duplicated from sendQuestionWithState ---
            // TODO: Refactor timer logic into a separate reusable function
            const prisma = require('../../db'); // Need prisma here too
            const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
            if (!state || !state.questions || !currentQuestion) {
                logger.error(`Timer expired after resume, but state/question invalid for ${code}, question UID ${state === null || state === void 0 ? void 0 : state.currentQuestionUid}`);
                return;
            }
            if (state.paused)
                return; // Check pause again just in case
            logger.info(`Timer expired after resume for question UID ${state.currentQuestionUid} in tournament ${code}`);
            const { calculateScore } = require('../tournamentUtils/tournamentHelpers'); // Import calculateScore
            // --- SCORING ---
            const participantScores = {};
            if (state.participants && Array.isArray(state.participants)) {
                // Convert array to object with IDs as keys
                const participantsObj = state.participants.reduce((obj, p) => {
                    if (p.id)
                        obj[p.id] = p;
                    return obj;
                }, {});
                Object.entries(participantsObj).forEach(([joueurId, participant]) => {
                    var _a, _b, _c;
                    const answer = (_b = (_a = state.answers) === null || _a === void 0 ? void 0 : _a[joueurId]) === null || _b === void 0 ? void 0 : _b[currentQuestion.uid || ''];
                    const { baseScore, rapidity, totalScore } = calculateScore(currentQuestion, answer, state.questionStart || Date.now());
                    if (participant) {
                        participant.score = (participant.score || 0) + totalScore;
                        participantScores[joueurId] = {
                            baseScore,
                            rapidity,
                            totalScore,
                            currentTotal: participant.score
                        };
                        const socketId = (_c = Object.entries(state.socketToPlayerId || {}).find(([sid, jid]) => jid === joueurId)) === null || _c === void 0 ? void 0 : _c[0];
                        if (socketId) {
                            io.to(socketId).emit("tournament_answer_result", {
                                correct: baseScore > 0,
                                score: participant.score,
                                explanation: (currentQuestion === null || currentQuestion === void 0 ? void 0 : currentQuestion.explanation) || null,
                                baseScore,
                                rapidity: Math.round(rapidity * 100) / 100,
                                totalScore,
                            });
                        }
                    }
                });
            }
            // --- Move to next question or end ---
            // Find the next question (based on current index)
            const currentIndex = state.questions.findIndex(q => q.uid === state.currentQuestionUid);
            const nextIndex = currentIndex + 1;
            const nextQuestion = nextIndex < state.questions.length ? state.questions[nextIndex] : undefined;
            if (nextQuestion) {
                await (0, tournamentHelpers_1.sendQuestionWithState)(io, code, nextIndex, nextQuestion.uid); // Pass the index and uid
            }
            else {
                logger.info(`Ending tournament ${code} after resume timer`);
                const leaderboard = state.participants && Array.isArray(state.participants)
                    ? state.participants.map(p => ({
                        id: p.id,
                        username: p.username,
                        avatar: p.avatar,
                        score: p.score,
                        isDiffered: !!p.isDeferred
                    })).sort((a, b) => (b.score || 0) - (a.score || 0))
                    : [];
                io.to(`live_${code}`).emit("tournament_end", { leaderboard });
                try {
                    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                    if (tournoi && state.participants && Array.isArray(state.participants)) {
                        for (const participant of state.participants) {
                            if (!participant.isDeferred) {
                                const joueurId = participant.id;
                                const scoreValue = participant.score || 0;
                                if (!joueurId.startsWith('socket_')) {
                                    const existing = await prisma.score.findFirst({
                                        where: {
                                            tournoi_id: tournoi.id,
                                            joueur_id: joueurId
                                        }
                                    });
                                    if (existing) {
                                        await prisma.score.update({
                                            where: { id: existing.id },
                                            data: {
                                                score: scoreValue,
                                                date_score: new Date()
                                            }
                                        });
                                    }
                                    else {
                                        await prisma.score.create({
                                            data: {
                                                tournoi_id: tournoi.id,
                                                joueur_id: joueurId,
                                                score: scoreValue,
                                                date_score: new Date()
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        await prisma.tournoi.update({
                            where: { code },
                            data: {
                                date_fin: new Date(),
                                statut: 'terminé',
                                leaderboard
                            }
                        });
                    }
                }
                catch (err) {
                    logger.error(`Error saving scores/updating tournament ${code} after resume:`, err);
                }
                io.to(`live_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState_1.tournamentState[code];
            }
            // --- End of duplicated logic ---
        }, remaining * 1000);
    }
    else {
        logger.warn(`Received tournament_resume for ${code}, but state not found, is differed, or not paused.`);
    }
}
exports.default = handleTournamentResume;
