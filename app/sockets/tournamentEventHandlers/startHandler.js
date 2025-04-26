const prisma = require('../../db');
const createLogger = require('../../logger');
const logger = createLogger('StartTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');
const { sendQuestionWithState } = require('../tournamentUtils/tournamentHelpers');

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

        logger.info(`Questions fetched for ${code}:`, questions.length, questions.map(q => q.uid));

        if (!questions || questions.length === 0) {
            io.to(code).emit("tournament_end", { finalScore: 0, leaderboard: [] }); // End immediately if no questions
            await prisma.tournoi.update({ where: { code }, data: { statut: 'terminé' } });
            return;
        }

        // Notify lobby clients to start countdown
        io.to(code).emit("tournament_started");
        logger.info(`tournament_started emitted to lobby room ${code}`);

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
            started: true,
            answers: {}, // { joueurId: { questionUid: { answerIdx, clientTimestamp } } }
            timer: null,
            questionStart: null,
            socketToJoueur: {}, // { socketId: joueurId }
            paused: false,
            pausedRemainingTime: null,
            linkedQuizId: tournoi.linkedQuizId || null, // Initialize from DB
            currentQuestionDuration: null, // Added field
            stopped: false, // Initialize stopped state
        };

        // Only wait 5 seconds before starting the first question if NOT linked to a quiz (classic mode)
        if (!tournamentState[code].linkedQuizId) {
            setTimeout(async () => { // Make inner function async
                if (tournamentState[code]) {
                    // Use await here since sendQuestionWithState is now async
                    await sendQuestionWithState(io, code, 0);
                }
            }, 5000);
        }
        // In quiz mode (linkedQuizId set), the teacher will trigger the first question manually
    } catch (err) {
        logger.error(`Error in start_tournament for code ${code}:`, err);
        // Consider emitting an error to the client
        socket.emit("tournament_error", { message: "Erreur lors du démarrage du tournoi." });
    }
}

module.exports = handleStartTournament;
