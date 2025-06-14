/**
 * startHandler.ts - Game Start Handler
 *
 * This module handles the start_tournament event (soon to be renamed start_game),
 * which initializes and starts a game instance based on the new schema.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes'; // Using original name for now
import { StartTournamentPayload } from '../types/socketTypes'; // Using original name for now
import { Question as LocalQuestion, QuestionOptionAnswer } from '../types/quizTypes';
import type { GameInstance, Question as PrismaQuestion } from '../../../shared/prisma-client'; // Adjusted import path
import prisma from '../../db';
import { tournamentState } from '../tournamentUtils/tournamentState'; // Using original name for now
import { sendQuestionWithState } from '../tournamentUtils/tournamentHelpers';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('StartGameHandler');

/**
 * Handle start_tournament event (to be renamed to start_game)
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The start tournament payload from the client (contains accessCode)
 */
async function handleStartTournament( // Function name can be updated later when event name changes
    io: Server,
    socket: Socket,
    { code: accessCode }: StartTournamentPayload // Destructure `code` as `accessCode`
): Promise<void> {
    try {
        logger.info(`start_tournament (game): accessCode=${accessCode}, socket.id=${socket.id}`);

        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                quizTemplate: {
                    include: {
                        questions: { // This is QuestionsInQuizTemplate[] relation
                            include: {
                                question: true // The actual PrismaQuestion model
                            },
                            orderBy: {
                                sequence: 'asc'
                            }
                        }
                    }
                }
            }
        });

        if (!gameInstance || !gameInstance.quizTemplate) {
            logger.error(`GameInstance or QuizTemplate not found for accessCode: ${accessCode}`);
            socket.emit("game_error", { message: "Partie non trouvée ou modèle de quiz manquant." });
            return;
        }

        // Let TypeScript infer the type of quizTemplateQuestions, which will include the nested 'question'
        const quizTemplateQuestions = gameInstance.quizTemplate.questions;

        const questions: LocalQuestion[] = quizTemplateQuestions.map(qtq => {
            const pq = qtq.question; // pq is PrismaQuestion, correctly typed due to inference
            let parsedResponses: QuestionOptionAnswer[] = [];
            try {
                // Assuming pq.responses from Prisma (type Json) is stored as QuestionOptionAnswer[]
                if (pq.responses && Array.isArray(pq.responses)) {
                    parsedResponses = pq.responses as unknown as QuestionOptionAnswer[];
                } else if (typeof pq.responses === 'string') { // Handle if it's a stringified JSON
                    const parsedJson = JSON.parse(pq.responses);
                    if (Array.isArray(parsedJson)) {
                        parsedResponses = parsedJson as unknown as QuestionOptionAnswer[];
                    }
                }
            } catch (e) {
                logger.error(`Error parsing responses for question ${pq.uid}:`, pq.responses, e);
                // Default to empty array or handle error as appropriate
            }

            return {
                uid: pq.uid,
                defaultMode: pq.questionType,
                text: pq.text || '',
                time: pq.timeLimit || 20,
                answers: parsedResponses,
                gradeLevel: pq.gradeLevel || '',
                themes: pq.themes || [],
                discipline: pq.discipline || '',
                difficulty: pq.difficulty || 0,
                explanation: pq.explanation || '',
                title: pq.title || '',
                hidden: pq.isHidden || false,
            };
        });

        logger.info(`Questions fetched for game ${accessCode}: ${questions.length}`, questions.map(q => q.uid));

        if (questions.length === 0) {
            io.to(`lobby_${accessCode}`).emit("game_end", { finalScore: 0, leaderboard: [] });
            await prisma.gameInstance.update({ where: { accessCode }, data: { status: 'completed' } });
            logger.warn(`Game ${accessCode} ended immediately as no questions were found.`);
            return;
        }

        io.to(`lobby_${accessCode}`).emit("game_started", { accessCode });
        logger.info(`game_started emitted to lobby room lobby_${accessCode}`);

        if (gameInstance.initiatorTeacherId && (gameInstance.playMode === 'class' || gameInstance.playMode === 'tournament')) {
            logger.info(`Teacher-initiated game ${accessCode} (${gameInstance.playMode}) started, sending immediate redirect_to_game`);
            io.to(`lobby_${accessCode}`).emit("redirect_to_game", { accessCode });
        }

        await prisma.gameInstance.update({
            where: { accessCode },
            data: { startedAt: new Date(), status: 'active' }
        });

        // Use tournamentState for now, can be renamed globally later
        tournamentState[accessCode] = {
            participants: [],
            questions: questions.map(q => ({ ...q })),
            currentIndex: -1,
            currentQuestionUid: undefined,
            answers: {},
            timer: null as unknown as NodeJS.Timeout | null,
            questionStart: null,
            socketToPlayerId: {},
            paused: false,
            pausedRemainingTime: undefined,
            playMode: gameInstance.playMode,
            currentQuestionDuration: questions[0]?.time || 20,
            stopped: false,
            status: 'preparing',
            askedQuestions: new Set<string>(),
            code: accessCode, // Keep 'code' for compatibility if other parts of tournamentState rely on it
            gameId: gameInstance.id,
            quizTemplateId: gameInstance.quizTemplateId
        } as TournamentState; // Cast to TournamentState for now

        if (!tournamentState[accessCode].askedQuestions) {
            tournamentState[accessCode].askedQuestions = new Set<string>();
        }

        if (gameInstance.playMode === 'tournament' || gameInstance.playMode === 'practice') {
            setTimeout(async () => {
                if (tournamentState[accessCode] && !tournamentState[accessCode].stopped) {
                    await sendQuestionWithState(io, accessCode, 0);
                    const firstQ = tournamentState[accessCode].questions[0];
                    const firstTime = firstQ?.time || 20;
                    const { triggerTournamentTimerSet } = require('../tournamentUtils/tournamentTriggers');
                    triggerTournamentTimerSet(io, accessCode, firstTime, true);
                }
            }, 5000);
        }

        const firstQuestion = tournamentState[accessCode].questions[0];
        if (firstQuestion && firstQuestion.uid) {
            tournamentState[accessCode].askedQuestions.add(firstQuestion.uid);
            logger.debug(`[StartGameHandler] Added question UID ${firstQuestion.uid} to askedQuestions for game ${accessCode}. Current set: ${Array.from(tournamentState[accessCode].askedQuestions).join(', ')}`);
        }

    } catch (err: any) {
        logger.error(`Error in start_tournament (game) for accessCode ${accessCode}:`, err);
        socket.emit("game_error", { message: err.message || "Erreur lors du démarrage de la partie." });
    }
}

export default handleStartTournament;
