const quizState = require('./quizState'); // Ajouté pour accéder au profSocketId

// Utilitaire pour émettre le nombre de connectés UNIQUEMENT dans le tournoi actif
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

    // Count sockets in both the live tournament room and the lobby rooms
    const liveRoom = io.sockets.adapter.rooms.get(`tournament_${code}`) || new Set();
    const lobbyRoom = io.sockets.adapter.rooms.get(`${code}`) || new Set();
    const lobbyRoomAlt = io.sockets.adapter.rooms.get(`lobby_${code}`) || new Set();

    // Combine all socket IDs (Set to avoid duplicates)
    const allSocketIds = new Set([
        ...liveRoom,
        ...lobbyRoom,
        ...lobbyRoomAlt
    ]);

    const room = io.sockets.adapter.rooms.get(`quiz_${quizId}`);
    console.info('[QUIZ_CONNECTED] quiz_connected_count room members:', room ? Array.from(room) : []);

    // Récupère le socketId du prof pour ce quiz
    const profSocketId = quizState[quizId]?.profSocketId;

    // Exclut le prof du comptage
    let totalCount = 0;
    for (const socketId of allSocketIds) {
        if (socketId !== profSocketId) totalCount++;
    }

    console.info(`[QUIZ_CONNECTED] EMIT quiz_connected_count quizId=${quizId} code=${code} totalSansProf=${totalCount}`);
    io.to(`quiz_${quizId}`).emit("quiz_connected_count", { count: totalCount });
    // Also emit directly to the teacher's socket if available
    if (profSocketId) {
        io.to(profSocketId).emit("quiz_connected_count", { count: totalCount });
    }
}

module.exports = { emitQuizConnectedCount };