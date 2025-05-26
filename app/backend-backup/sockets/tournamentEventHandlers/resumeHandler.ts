/**
 * resumeHandler.ts - Tournament Resume Handler
 * 
 * This module handles the tournament_resume event, resuming a paused tournament question.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState, Participant, TournamentParticipant } from '../types/tournamentTypes';
import { ResumeTournamentPayload } from '../types/socketTypes';
import { tournamentState } from '../tournamentUtils/tournamentState';
import { sendQuestionWithState } from '../tournamentUtils/tournamentHelpers';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('ResumeTournamentHandler');

/**
 * Handle tournament_resume event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The resume payload from the client
 */
function handleTournamentResume(
    io: Server,
    socket: Socket,
    { code }: ResumeTournamentPayload
): void {
    const state: TournamentState | undefined = tournamentState[code]; // Only applicable to live tournaments
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
        io.to(`game_${code}`).emit("tournament_question_state_update", {
            questionState: "active",
            remainingTime: remaining
        });

        // Restart timer
        if (state.timer) clearTimeout(state.timer);

        // Re-use the timer logic from sendQuestionWithState (needs refactoring there ideally)
        state.timer = setTimeout(async () => {
            // --- This logic is duplicated from sendQuestionWithState ---
            // TODO: Refactor timer logic into a separate reusable function
            const prisma = require('../../db'); // Need prisma here too
            const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
            if (!state || !state.questions || !currentQuestion) {
                logger.error(`Timer expired after resume, but state/question invalid for ${code}, question UID ${state?.currentQuestionUid}`);
                return;
            }

            if (state.paused) return; // Check pause again just in case

            logger.info(`Timer expired after resume for question UID ${state.currentQuestionUid} in tournament ${code}`);

            const { calculateScore } = require('../tournamentUtils/tournamentHelpers'); // Import calculateScore

            // --- SCORING ---
            const participantScores: Record<string, any> = {};
            if (state.participants && Array.isArray(state.participants)) {
                // Convert array to object with IDs as keys
                const participantsObj = state.participants.reduce((obj, p) => {
                    if (p.id) obj[p.id] = p;
                    return obj;
                }, {} as Record<string, TournamentParticipant>);

                Object.entries(participantsObj).forEach(([joueurId, participant]) => {
                    const answer = state.answers?.[joueurId]?.[currentQuestion.uid || ''];
                    const { baseScore, rapidity, totalScore } = calculateScore(currentQuestion, answer, state.questionStart || Date.now());

                    if (participant) {
                        participant.score = (participant.score || 0) + totalScore;
                        participantScores[joueurId] = {
                            baseScore,
                            rapidity,
                            totalScore,
                            currentTotal: participant.score
                        };

                        const socketId = Object.entries(state.socketToPlayerId || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                        if (socketId) {
                            io.to(socketId).emit("tournament_answer_result", {
                                correct: baseScore > 0,
                                score: participant.score,
                                explanation: currentQuestion?.explanation || null,
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
                await sendQuestionWithState(io, code, nextIndex, nextQuestion.uid); // Pass the index and uid
            } else {
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

                io.to(`game_${code}`).emit("tournament_end", { leaderboard });
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
                                    } else {
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
                                statut: 'terminé' as const,
                                leaderboard
                            }
                        });
                    }
                } catch (err) {
                    logger.error(`Error saving scores/updating tournament ${code} after resume:`, err);
                }
                io.to(`game_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState[code];
            }
            // --- End of duplicated logic ---
        }, remaining * 1000);
    } else {
        logger.warn(`Received tournament_resume for ${code}, but state not found, is differed, or not paused.`);
    }
}

export default handleTournamentResume;
