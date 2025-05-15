"use strict";
/**
 * startHandler.ts - Tournament Start Handler
 *
 * This module handles the start_tournament event, which initializes and starts a tournament.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const tournamentState_1 = require("../tournamentUtils/tournamentState");
const tournamentHelpers_1 = require("../tournamentUtils/tournamentHelpers");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('StartTournamentHandler');
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
        const tournoi = await db_1.default.tournoi.findUnique({
            where: { code }
        });
        if (!tournoi) {
            logger.error(`Tournament not found for code: ${code}`);
            // Maybe emit an error back to the starter?
            socket.emit("tournament_error", { message: "Tournoi non trouvé." });
            return;
        }
        // Then fetch questions separately using the IDs stored in the tournament
        const dbQuestions = await db_1.default.question.findMany({
            where: {
                uid: {
                    in: tournoi.questions_ids || []
                }
            },
            orderBy: [
                { gradeLevel: 'asc' }, // Corrected: was niveau
                { discipline: 'asc' }
            ]
        });
        // Map database questions to Question type with required fields
        const questions = dbQuestions.map(q => {
            // Create a new object that matches Question type requirements
            const questionObj = {
                uid: q.uid,
                type: q.type,
                text: q.question || '',
                time: q.temps || 20,
                answers: [], // Initialize with empty array
                gradeLevel: q.gradeLevel || '', // Corrected: was q.niveau
                themes: q.themes || [], // Corrected: use themes array from Prisma model
                discipline: q.discipline || '',
                difficulty: q.difficulte || 0, // Convert null to 0
                explanation: q.explication || '',
                title: q.titre || '',
                hidden: q.hidden || false, // Convert null to false
            };
            // Handle reponses conversion
            if (Array.isArray(q.reponses)) {
                questionObj.answers = q.question;
            }
            else {
                questionObj.answers = [];
            }
            return questionObj;
        });
        logger.info(`Questions fetched for ${code}:`, questions.length, questions.map((q) => q.uid));
        if (!questions || questions.length === 0) {
            io.to(`lobby_${code}`).emit("tournament_end", { finalScore: 0, leaderboard: [] }); // End immediately if no questions
            await db_1.default.tournoi.update({ where: { code }, data: { statut: 'terminé' } });
            return;
        }
        // Notify lobby clients to start countdown
        io.to(`lobby_${code}`).emit("tournament_started", { code });
        logger.info(`tournament_started emitted to lobby room lobby_${code}`);
        // For quiz-linked tournaments, also emit direct redirect event to ensure clients redirect properly
        // Check for linked quiz
        let linkedQuizId = null;
        try {
            const quiz = await db_1.default.quiz.findFirst({ where: { tournament_code: code } });
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
        await db_1.default.tournoi.update({
            where: { code },
            data: { date_debut: new Date(), statut: 'en cours' }
        });
        // Initialize state
        tournamentState_1.tournamentState[code] = {
            participants: [], // Initialize as empty array, will be populated on join_tournament
            questions: questions.map(q => (Object.assign(Object.assign({}, q), { texte: q.question || q.text || '' // Ensure texte field exists
             }))),
            currentIndex: -1, // Start at -1, will be set to 0 by sendQuestionWithState
            currentQuestionUid: undefined, // Use undefined instead of null
            answers: {}, // { joueurId: { questionUid: { answerIdx, clientTimestamp } } }
            timer: null, // Type assertion for compatibility
            questionStart: null,
            socketToPlayerId: {}, // { socketId: joueurId }
            paused: false,
            pausedRemainingTime: undefined, // Use undefined instead of null
            linkedQuizId, // Use the linkedQuizId we just fetched
            currentQuestionDuration: 20, // Default to 20 seconds
            stopped: false, // Initialize stopped state
            status: 'preparing',
            askedQuestions: new Set(), // Initialize with empty set
            code, // Add the code
            tournamentId: tournoi.id // Add the tournoi ID
        };
        // Ensure askedQuestions set is initialized in tournamentState
        if (!tournamentState_1.tournamentState[code].askedQuestions) {
            tournamentState_1.tournamentState[code].askedQuestions = new Set();
        }
        // Only wait 5 seconds before starting the first question if NOT linked to a quiz (classic mode)
        if (!tournamentState_1.tournamentState[code].linkedQuizId) {
            setTimeout(async () => {
                if (tournamentState_1.tournamentState[code]) {
                    // Use await here since sendQuestionWithState is now async
                    await (0, tournamentHelpers_1.sendQuestionWithState)(io, code, 0);
                    // Start the timer for the first question (classic tournaments)
                    const firstQ = tournamentState_1.tournamentState[code].questions[0];
                    const firstTime = (firstQ === null || firstQ === void 0 ? void 0 : firstQ.time) || 20;
                    const { triggerTournamentTimerSet } = require('../tournamentUtils/tournamentTriggers');
                    triggerTournamentTimerSet(io, code, firstTime, true);
                }
            }, 5000);
        }
        // Add the first question UID to the askedQuestions set
        const firstQuestion = tournamentState_1.tournamentState[code].questions[0];
        if (firstQuestion && firstQuestion.uid) {
            tournamentState_1.tournamentState[code].askedQuestions.add(firstQuestion.uid);
            logger.debug(`[startHandler] Added question UID ${firstQuestion.uid} to askedQuestions for tournament ${code}`);
            // Log the addition of the first question UID to the askedQuestions set
            logger.info(`[startHandler] Adding first question UID ${firstQuestion.uid} to askedQuestions for tournament ${code}. Current set: ${Array.from(tournamentState_1.tournamentState[code].askedQuestions).join(', ')}`);
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
