/**
 * startHandler.ts - Game Start Handler
 *
 * This module handles the start_game event,
 * which initializes and starts a game instance based on the schema.
 */

import { Server, Socket } from 'socket.io';
import { GameState } from '../types/gameTypes';
import { StartGamePayload } from '../types/socketTypes';
import { Question as LocalQuestion, QuestionOptionAnswer } from '../types/quizTypes';
import type { GameInstance, Question as PrismaQuestion } from '../../../shared/prisma-client';
import prisma from '../../db';
import { gameState } from '../gameUtils/gameState';
import { sendQuestionWithState } from '../gameUtils/gameHelpers';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('StartGameHandler');

/**
 * Handle start_game event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The start game payload from the client (contains accessCode)
 */
async function handleStartGame(
    io: Server,
    socket: Socket,
    { accessCode }: StartGamePayload
): Promise<void> {
    try {
        logger.info(`start_game: accessCode=${accessCode}, socket.id=${socket.id}`);

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

        // Initialize game state
        gameState[accessCode] = {
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
            accessCode: accessCode, // Use accessCode instead of code
            gameId: gameInstance.id,
            quizTemplateId: gameInstance.quizTemplateId
        } as GameState;

        if (!gameState[accessCode].askedQuestions) {
            gameState[accessCode].askedQuestions = new Set<string>();
        }

        if (gameInstance.playMode === 'tournament' || gameInstance.playMode === 'practice') {
            setTimeout(async () => {
                if (gameState[accessCode] && !gameState[accessCode].stopped) {
                    await sendQuestionWithState(io, accessCode, 0);
                    const firstQ = gameState[accessCode].questions[0];
                    const firstTime = firstQ?.time || 20;
                    const { triggerGameTimerSet } = require('../gameUtils/gameTriggers');
                    triggerGameTimerSet(io, accessCode, firstTime, true);
                }
            }, 5000);
        }

        const firstQuestion = gameState[accessCode].questions[0];
        if (firstQuestion && firstQuestion.uid) {
            gameState[accessCode].askedQuestions.add(firstQuestion.uid);
            logger.debug(`[StartGameHandler] Added question UID ${firstQuestion.uid} to askedQuestions for game ${accessCode}. Current set: ${Array.from(gameState[accessCode].askedQuestions).join(', ')}`);
        }

    } catch (err: any) {
        logger.error(`Error in start_game for accessCode ${accessCode}:`, err);
        socket.emit("game_error", { message: err.message || "Erreur lors du démarrage de la partie." });
    }
}

export default handleStartGame;
