const quizState = require('./quizState'); // Ajouté pour accéder au profSocketId

// Utilitaire pour émettre le nombre de connectés (lobby + live) à la room quiz_${quizId}
async function emitQuizConnectedCount(io, prisma, code) {
    if (!code) return;
    let quizId = null;
    try {
        const quiz = await prisma.quiz.findUnique({ where: { tournament_code: code }, select: { id: true } });
        if (quiz && quiz.id) quizId = quiz.id;
    } catch (e) {
        console.error('[QUIZ_CONNECTED] Erreur récupération quizId pour code', code, e);
    }
    if (!quizId) return;

    // Compter les sockets dans lobby et live, en excluant le prof
    const lobbyRoom = io.sockets.adapter.rooms.get(`lobby_${code}`) || new Set();
    const liveRoom = io.sockets.adapter.rooms.get(`tournament_${code}`) || new Set();
    const allSockets = new Set([...lobbyRoom, ...liveRoom]);

    // Récupère le socketId du prof pour ce quiz
    const profSocketId = quizState[quizId]?.profSocketId;

    // Exclut le prof du comptage
    let totalCount = 0;
    for (const socketId of allSockets) {
        if (socketId !== profSocketId) totalCount++;
    }

    console.info(`[QUIZ_CONNECTED] EMIT quiz_connected_count quizId=${quizId} code=${code} totalSansProf=${totalCount}`);
    io.to(`quiz_${quizId}`).emit("quiz_connected_count", { count: totalCount });
}

module.exports = { emitQuizConnectedCount };