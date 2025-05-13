/**
 * startHandler.ts - Tournament Start Handler
 * 
 * This module handles the start_tournament event, which initializes and starts a tournament.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes';
import { StartTournamentPayload } from '../types/socketTypes';
import { Question, QuestionOptionAnswer } from '../types/quizTypes';
import type { Tournoi } from '@prisma/client';
import prisma from '../../db';
import { tournamentState } from '../tournamentUtils/tournamentState';
import { sendQuestionWithState } from '../tournamentUtils/tournamentHelpers';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('StartTournamentHandler');

/**
 * Handle start_tournament event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The start tournament payload from the client
 */
async function handleStartTournament(
    io: Server,
    socket: Socket,
    { code }: StartTournamentPayload
): Promise<void> {
    try {
        logger.info(`start_tournament: code=${code}, socket.id=${socket.id}`);

        // Fetch tournament first
        const tournoi: Tournoi | null = await prisma.tournoi.findUnique({
            where: { code }
        });

        if (!tournoi) {
            logger.error(`Tournament not found for code: ${code}`);
            // Maybe emit an error back to the starter?
            socket.emit("tournament_error", { message: "Tournoi non trouvé." });
            return;
        }

        // Then fetch questions separately using the IDs stored in the tournament
        const dbQuestions = await prisma.question.findMany({
            where: {
                uid: {
                    in: tournoi.questions_ids || []
                }
            },
            orderBy: [
                { niveau: 'asc' },
                { theme: 'asc' },
            ]
        });

        // Map database questions to Question type with required fields
        const questions: Question[] = dbQuestions.map(q => {
            // Create a new object that matches Question type requirements
            const questionObj: Question = {
                uid: q.uid,
                type: q.type,
                texte: q.question || '',
                temps: q.temps || 20,
                answers: [], // Initialize with empty array
                niveau: q.niveau || '',
                theme: q.theme || '',
                discipline: q.discipline || '',
                difficulte: q.difficulte || 0,  // Convert null to 0
                explication: q.explication || '',
                title: q.titre || '',
                hidden: q.hidden || false,  // Convert null to false
            };

            // Handle reponses conversion
            if (Array.isArray(q.reponses)) {
                questionObj.reponses = q.reponses as any;
            } else {
                questionObj.reponses = [];
            }

            return questionObj;
        });

        logger.info(`Questions fetched for ${code}:`, questions.length, questions.map((q: Question) => q.uid));

        if (!questions || questions.length === 0) {
            io.to(`lobby_${code}`).emit("tournament_end", { finalScore: 0, leaderboard: [] }); // End immediately if no questions
            await prisma.tournoi.update({ where: { code }, data: { statut: 'terminé' } });
            return;
        }

        // Notify lobby clients to start countdown
        io.to(`lobby_${code}`).emit("tournament_started", { code });
        logger.info(`tournament_started emitted to lobby room lobby_${code}`);

        // For quiz-linked tournaments, also emit direct redirect event to ensure clients redirect properly
        // Check for linked quiz
        let linkedQuizId: string | null = null;
        try {
            const quiz = await prisma.quiz.findFirst({ where: { tournament_code: code } });
            linkedQuizId = quiz ? quiz.id : null;
            const tournamentHasLinkedQuiz = !!linkedQuizId;

            if (tournamentHasLinkedQuiz) {
                logger.info(`Quiz-linked tournament ${code} started, sending immediate redirect_to_tournament`);
                io.to(`lobby_${code}`).emit("redirect_to_tournament", { code });
            }
        } catch (err) {
            logger.error(`[QUIZMODE DEBUG] Error looking up quiz for tournament code ${code}:`, err);
        }

        // Update tournament status in DB
        await prisma.tournoi.update({
            where: { code },
            data: { date_debut: new Date(), statut: 'en cours' }
        });

        // Initialize state
        tournamentState[code] = {
            participants: [], // Initialize as empty array, will be populated on join_tournament
            questions: questions.map(q => ({
                ...q,
                texte: q.question || q.texte || '' // Ensure texte field exists
            })),
            currentIndex: -1, // Start at -1, will be set to 0 by sendQuestionWithState
            currentQuestionUid: undefined, // Use undefined instead of null
            answers: {}, // { joueurId: { questionUid: { answerIdx, clientTimestamp } } }
            timer: null as unknown as NodeJS.Timeout | null, // Type assertion for compatibility
            questionStart: null,
            socketToJoueur: {}, // { socketId: joueurId }
            paused: false,
            pausedRemainingTime: undefined, // Use undefined instead of null
            linkedQuizId, // Use the linkedQuizId we just fetched
            currentQuestionDuration: 20, // Default to 20 seconds
            stopped: false, // Initialize stopped state
            statut: 'en cours' as 'en cours',
            askedQuestions: new Set<string>(), // Initialize with empty set
            code, // Add the code
            tournoiId: tournoi.id // Add the tournoi ID
        };

        // Ensure askedQuestions set is initialized in tournamentState
        if (!tournamentState[code].askedQuestions) {
            tournamentState[code].askedQuestions = new Set<string>();
        }

        // Only wait 5 seconds before starting the first question if NOT linked to a quiz (classic mode)
        if (!tournamentState[code].linkedQuizId) {
            setTimeout(async () => { // Make inner function async
                if (tournamentState[code]) {
                    // Use await here since sendQuestionWithState is now async
                    await sendQuestionWithState(io, code, 0);
                    // Start the timer for the first question (classic tournaments)
                    const firstQ = tournamentState[code].questions[0];
                    const firstTime = firstQ?.temps || 20;
                    const { triggerTournamentTimerSet } = require('../tournamentUtils/tournamentTriggers');
                    triggerTournamentTimerSet(io, code, firstTime, true);
                }
            }, 5000);
        }

        // Add the first question UID to the askedQuestions set
        const firstQuestion = tournamentState[code].questions[0];
        if (firstQuestion && firstQuestion.uid) {
            tournamentState[code].askedQuestions.add(firstQuestion.uid);
            logger.debug(`[startHandler] Added question UID ${firstQuestion.uid} to askedQuestions for tournament ${code}`);
            // Log the addition of the first question UID to the askedQuestions set
            logger.info(`[startHandler] Adding first question UID ${firstQuestion.uid} to askedQuestions for tournament ${code}. Current set: ${Array.from(tournamentState[code].askedQuestions).join(', ')}`);
        }

        // In quiz mode (linkedQuizId set), the teacher will trigger the first question manually
    } catch (err) {
        logger.error(`Error in start_tournament for code ${code}:`, err);
        // Consider emitting an error to the client
        socket.emit("tournament_error", { message: "Erreur lors du démarrage du tournoi." });
    }
}

export default handleStartTournament;
