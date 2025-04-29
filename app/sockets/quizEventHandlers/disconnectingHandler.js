const createLogger = require('../../logger');
const logger = createLogger('DisconnectQuizHandler');
const quizState = require('../quizState');
const { emitQuizConnectedCount } = require('../quizUtils');

// Note: prisma is not needed here, but passed for consistency
async function handleDisconnecting(io, socket, prisma) {
    logger.info(`disconnecting: socket.id=${socket.id}`);
    for (const quizId in quizState) {
        // Retirer le socket du Set des connectés
        if (quizState[quizId].connectedSockets && quizState[quizId].connectedSockets.has(socket.id)) {
            quizState[quizId].connectedSockets.delete(socket.id);
            logger.info(`[QUIZ_CONNECTED] Suppression socket ${socket.id} de quiz ${quizId}. Sockets restants:`, Array.from(quizState[quizId].connectedSockets));
            // Émettre le nombre de connectés mis à jour
            // --- Calcul du nombre total de connectés (lobby + live) ---
            let code = null;
            if (quizState[quizId] && quizState[quizId].tournament_code) {
                code = quizState[quizId].tournament_code;
            } else {
                try {
                    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
                    if (quiz && quiz.tournament_code) code = quiz.tournament_code;
                } catch (e) { logger.error('Erreur récupération code tournoi', e); }
            }
            if (code) await emitQuizConnectedCount(io, prisma, code);
        }
        if (quizState[quizId].profSocketId === socket.id) {
            quizState[quizId].profSocketId = null;
            logger.info(`Professor disconnected from quiz ${quizId}`);
            // Optionally emit an update to other clients in the quiz room
            // io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
        }
    }
    // Appeler emitQuizConnectedCount après qu'un étudiant se déconnecte
    const code = Object.keys(socket.rooms).find((room) => room.startsWith('lobby_') || room.startsWith('tournament_'));
    if (code) {
        const cleanCode = code.replace(/^(lobby_|tournament_)/, '');
        await emitQuizConnectedCount(io, prisma, cleanCode);
    }
}

module.exports = handleDisconnecting;
