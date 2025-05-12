"use strict";
/**
 * startHandler.ts - Tournament Start Handler
 *
 * This module handles the start_tournament event, which initializes and starts a tournament.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import using require for now until these are converted to TypeScript
// TODO: Convert these imports to TypeScript imports when available
const prisma = require('../../db');
const createLogger = require('../../logger');
const logger = createLogger('StartTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState.legacy.js');
const { sendQuestionWithState } = require('../tournamentUtils/tournamentHelpers');
/**
 * Handle start_tournament event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The start tournament payload from the client
 */
async function handleStartTournament(io, socket, { code }) {
    try {
        logger.info(`start_tournament: code=${code}, socket.id=${socket.id}`);
        // Fetch tournament first
        const tournoi = await prisma.tournoi.findUnique({
            where: { code }
        });
        if (!tournoi) {
            logger.error(`Tournament not found for code: ${code}`);
            // Maybe emit an error back to the starter?
            socket.emit("tournament_error", { message: "Tournoi non trouvé." });
            return;
        }
        // Then fetch questions separately using the IDs stored in the tournament
        const questions = await prisma.question.findMany({
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
        logger.info(`Questions fetched for ${code}:`, questions.length, questions.map((q) => q.uid));
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
        let linkedQuizId = null;
        try {
            const quiz = await prisma.quiz.findFirst({ where: { tournament_code: code } });
            linkedQuizId = quiz ? quiz.id : null;
            const tournamentHasLinkedQuiz = !!linkedQuizId;
            if (tournamentHasLinkedQuiz) {
                logger.info(`Quiz-linked tournament ${code} started, sending immediate redirect_to_tournament`);
                io.to(`lobby_${code}`).emit("redirect_to_tournament", { code });
            }
        }
        catch (err) {
            logger.error(`[QUIZMODE DEBUG] Error looking up quiz for tournament code ${code}:`, err);
        }
        // Update tournament status in DB
        await prisma.tournoi.update({
            where: { code },
            data: { date_debut: new Date(), statut: 'en cours' }
        });
        // Initialize state
        tournamentState[code] = {
            participants: {}, // Will be populated on join_tournament
            questions,
            currentIndex: -1, // Start at -1, will be set to 0 by sendQuestionWithState
            currentQuestionUid: null,
            started: true,
            answers: {}, // { joueurId: { questionUid: { answerIdx, clientTimestamp } } }
            timer: null,
            questionStart: null,
            socketToJoueur: {}, // { socketId: joueurId }
            paused: false,
            pausedRemainingTime: null,
            linkedQuizId, // Use the linkedQuizId we just fetched
            currentQuestionDuration: 20, // Default to 20 seconds
            stopped: false, // Initialize stopped state
            statut: 'en cours'
        };
        // Ensure askedQuestions set is initialized in tournamentState
        if (!tournamentState[code].askedQuestions) {
            tournamentState[code].askedQuestions = new Set();
        }
        // Only wait 5 seconds before starting the first question if NOT linked to a quiz (classic mode)
        if (!tournamentState[code].linkedQuizId) {
            setTimeout(async () => {
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
    }
    catch (err) {
        logger.error(`Error in start_tournament for code ${code}:`, err);
        // Consider emitting an error to the client
        socket.emit("tournament_error", { message: "Erreur lors du démarrage du tournoi." });
    }
}
exports.default = handleStartTournament;
