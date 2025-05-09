// closeQuestionHandler.js - Handles closing a quiz question, sending results, and locking further answers
const createLogger = require('../../logger');
const logger = createLogger('CloseQuestionHandler');
const quizState = require('../quizState');

function handleCloseQuestion(io, socket, { quizId, questionUid }) {
    logger.info(`[CloseQuestion] Received for quiz ${quizId}, question ${questionUid}`);

    const state = quizState[quizId];
    if (!state) {
        logger.warn(`[CloseQuestion] No quiz state for ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : état du quiz introuvable.'
        });
        return;
    }

    // Lock further answers for this question
    if (!state.lockedQuestions) state.lockedQuestions = {};
    state.lockedQuestions[questionUid] = true;

    // Find correct answers for the question
    const question = (state.questions || []).find(q => q.uid === questionUid);
    logger.debug('[CloseQuestion] Looking for questionUid:', questionUid);
    logger.debug('[CloseQuestion] Found question:', question);
    logger.debug('[CloseQuestion] Question reponses:', question?.reponses);
    const correctAnswers = question
        ? (question.reponses || []).map((r, idx) => r.correct ? idx : null).filter(idx => idx !== null)
        : [];
    logger.debug('[CloseQuestion] Computed correctAnswers:', correctAnswers);

    // Find the tournament code linked to this quiz
    let tournamentCode = state.tournament_code;
    if (!tournamentCode) {
        logger.error(`[CloseQuestion] No tournament_code found in quizState for quizId=${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : code du tournoi introuvable.'
        });
        return;
    }

    // --- PATCH: Get leaderboard from tournamentState if available, using shared utility ---
    let leaderboard = [];
    let playerCount = 0; // <-- NEW: Track number of players
    try {
        const { tournamentState } = require('../tournamentHandler');
        const { computeLeaderboard } = require('../tournamentUtils/computeLeaderboard');
        const tState = tournamentState[tournamentCode];
        if (tState && tState.participants) {
            const askedQuestions = tState.askedQuestions || new Set();
            const totalQuestions = tState.questions.length;
            leaderboard = computeLeaderboard(tState, askedQuestions, totalQuestions);
            playerCount = leaderboard.length;
        } else {
            logger.warn(`[CloseQuestion] No tournamentState or participants for code ${tournamentCode}, falling back to quizState leaderboard.`);
            leaderboard = computeLeaderboard(state); // fallback: use quizState participants
            playerCount = leaderboard.length;
        }
    } catch (err) {
        logger.error(`[CloseQuestion] Error fetching leaderboard from tournamentState:`, err);
    }

    // Send each user their score, placement, correct answers, and player count (no full leaderboard)
    if (state.participants) {
        leaderboard.forEach((entry, idx) => {
            const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === entry.id)?.[0];
            if (socketId) {
                io.to(socketId).emit('quiz_question_results', {
                    score: entry.score,
                    placement: idx + 1,
                    correctAnswers,
                    playerCount, // <-- NEW: send player count to user
                    // leaderboard removed from individual payload
                });
            }
        });
    }

    // Send to projector room (full leaderboard + player count)
    io.to(`projection_${quizId}`).emit('quiz_question_results', {
        leaderboard,
        correctAnswers,
        playerCount, // <-- NEW: send player count to projector
    });

    // Log sockets in projection and tournament rooms before emitting
    const projectionRoom = io.sockets.adapter.rooms.get(`projection_${quizId}`);
    const tournamentRoom = io.sockets.adapter.rooms.get(`live_${tournamentCode}`);
    logger.info(`[CloseQuestion] Sockets in projection_${quizId}:`, projectionRoom ? Array.from(projectionRoom) : []);
    logger.info(`[CloseQuestion] Sockets in live_${quizId}:`, tournamentRoom ? Array.from(tournamentRoom) : []);

    // Emit question closed event to all live tournament participants (students)
    logger.info(`[CloseQuestion] Emitting quiz_question_closed to live_${tournamentCode}`);
    io.to(`live_${tournamentCode}`).emit('quiz_question_closed', {
        questionUid,
        correctAnswers,
        leaderboard,
        playerCount, // <-- NEW: send player count to students
    });

    logger.info(`[CloseQuestion] Emitting quiz_question_closed to projection_${quizId}`);
    io.to(`projection_${quizId}`).emit('quiz_question_closed', {
        questionUid,
        correctAnswers,
        leaderboard,
        playerCount, // <-- NEW: send player count to projector
    });

    logger.info(`[CloseQuestion] Results sent for quiz ${quizId}, question ${questionUid}`);

    // Emit success message after sending results
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Question closed successfully.'
    });
}

module.exports = handleCloseQuestion;
