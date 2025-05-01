const createLogger = require('../../logger');
const logger = createLogger('SetQuestionHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentQuestion } = require('../tournamentHandler');
const prisma = require('../../db'); // Ensure prisma is required

async function handleSetQuestion(io, socket, prisma, { quizId, questionUid, chrono, code }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized access to set question for quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    const idx = quizState[quizId].questions.findIndex(q => q.uid === questionUid);
    if (idx === -1) {
        logger.warn(`Question UID ${questionUid} not found in quiz ${quizId}`);
        return;
    }

    logger.info(`Setting question ${questionUid} (idx: ${idx}) for quiz ${quizId}, chrono: ${chrono}, tournament code: ${code || 'none'}`);
    quizState[quizId].currentQuestionIdx = idx;
    quizState[quizId].timerQuestionId = questionUid;
    quizState[quizId].timerStatus = 'play';
    quizState[quizId].chrono = typeof chrono === 'number'
        ? { timeLeft: chrono, running: true }
        : { timeLeft: null, running: false };
    quizState[quizId].timerTimeLeft = typeof chrono === 'number' ? chrono : null;
    quizState[quizId].timerTimestamp = Date.now();
    quizState[quizId].locked = false;
    quizState[quizId].ended = false;

    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    // --- PATCH: Toujours mettre à jour le statut du tournoi en base si code défini ---
    if (code) {
        try {
            // Recherche le tournoi par code
            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
            // Log sockets in lobby before emitting redirect
            const socketsInLobby = await io.in(`lobby_${code}`).allSockets();
            logger.info(`[DEBUG] Sockets in lobby_${code} before redirect:`, Array.from(socketsInLobby));
            // Si le tournoi est trouvé et son statut est "en préparation", le mettre à jour
            if (tournoi && tournoi.statut === "en préparation") {
                await prisma.tournoi.update({
                    where: { code },
                    data: { statut: "en cours" }
                });
                logger.info(`Tournoi ${code} status updated from "en préparation" to "en cours"`);
                // --- INVERSION LOGIQUE ---
                // On n'émet la redirection que quand la base est à jour
                const isQuizLinked = await prisma.quiz.findFirst({ where: { tournament_code: code } });
                if (isQuizLinked) {
                    logger.info(`Emitting redirect_to_tournament for quiz-linked tournament ${code}`);
                    io.to(`lobby_${code}`).emit("redirect_to_tournament", { code });
                } else {
                    logger.info(`Emitting tournament_started for classic tournament ${code}`);
                    io.to(`lobby_${code}`).emit("tournament_started", { code });
                }
            }
        } catch (error) {
            logger.error(`Error updating tournament status for code ${code}:`, error);
        }
    }

    // --- Gestion des questions du tournoi (si state mémoire présent) ---
    if (code && tournamentState[code] && Array.isArray(tournamentState[code].questions)) {
        // Reset the "stopped" flag when setting a new question - this is critical to allow students to answer
        if (tournamentState[code].stopped) {
            logger.info(`Resetting stopped flag for tournament ${code} when setting new question ${questionUid}`);
            tournamentState[code].stopped = false;
        }

        const tournamentIdx = tournamentState[code].questions.findIndex(q => q.uid === questionUid);
        if (tournamentIdx === -1) {
            logger.error(`[QUIZMODE] Question UID ${questionUid} not found in tournamentState[${code}].questions`);
        } else {
            triggerTournamentQuestion(io, code, tournamentIdx, quizId, typeof chrono === 'number' ? chrono : null);
        }
    }
}

module.exports = handleSetQuestion;
