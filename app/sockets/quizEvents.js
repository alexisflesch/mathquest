/**
 * quizEvents.js - Quiz Socket Event Registration
 *
 * This module imports individual event handlers for quiz-related actions
 * and registers them with the Socket.IO socket instance.
 */

// Import required modules and state
const createLogger = require('../logger');
const logger = createLogger('QuizEvents');
// Import individual handlers
const handleJoinQuiz = require('./quizEventHandlers/joinQuizHandler');
const handleSetQuestion = require('./quizEventHandlers/setQuestionHandler');
const handleTimerAction = require('./quizEventHandlers/timerActionHandler');
const handleSetTimer = require('./quizEventHandlers/setTimerHandler');
const handleLock = require('./quizEventHandlers/lockHandler');
const handleUnlock = require('./quizEventHandlers/unlockHandler');
const handleEnd = require('./quizEventHandlers/endHandler');
const handlePause = require('./quizEventHandlers/pauseHandler');
const handleResume = require('./quizEventHandlers/resumeHandler');
const handleDisconnecting = require('./quizEventHandlers/disconnectingHandler'); // Added
const handleCloseQuestion = require('./quizEventHandlers/closeQuestionHandler');

// --- Shared quiz state initialization for dashboard and projector ---
async function ensureQuizStateInitialized(quizId, prisma, socket, role = null, teacherId = null) {
    const quizState = require('./quizState');
    if (!quizState[quizId]) {
        quizState[quizId] = {
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: (role === 'prof' || role === 'teacher') ? socket.id : null,
            profTeacherId: (role === 'prof' || role === 'teacher') ? teacherId : null,
            timerStatus: null,
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set(),
        };
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
            if (quiz && quiz.questions_ids) {
                const orderedQuestions = [];
                const questionsData = await prisma.question.findMany({ where: { uid: { in: quiz.questions_ids } } });
                const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                quiz.questions_ids.forEach(uid => {
                    if (questionMap.has(uid)) {
                        orderedQuestions.push(questionMap.get(uid));
                    }
                });
                quizState[quizId].questions = orderedQuestions;
            }
            if (quiz && quiz.tournament_code) {
                quizState[quizId].tournament_code = quiz.tournament_code;
            }
        } catch (e) {
            const logger = require('../logger')("QuizEvents");
            logger.error(`[ensureQuizStateInitialized] Error loading quiz ${quizId} questions:`, e);
        }
    }
    return quizState[quizId];
}

function registerQuizEvents(io, socket, prisma) {
    logger.info(`[DEBUG] registerQuizEvents for socket.id=${socket.id}`);
    // Register handlers
    socket.on("join_quiz", (payload) => handleJoinQuiz(io, socket, prisma, payload));
    socket.on("quiz_set_question", (payload) => handleSetQuestion(io, socket, prisma, payload));
    socket.on("quiz_timer_action", (payload) => handleTimerAction(io, socket, prisma, payload));
    socket.on("quiz_set_timer", (payload) => handleSetTimer(io, socket, prisma, payload));
    socket.on("quiz_lock", (payload) => handleLock(io, socket, prisma, payload));
    socket.on("quiz_unlock", (payload) => handleUnlock(io, socket, prisma, payload));
    socket.on("quiz_end", (payload) => handleEnd(io, socket, prisma, payload));
    socket.on("quiz_pause", (payload) => handlePause(io, socket, prisma, payload));
    socket.on("quiz_resume", (payload) => handleResume(io, socket, prisma, payload));
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma)); // Pass prisma if needed by handler
    socket.on("quiz_close_question", (payload) => handleCloseQuestion(io, socket, payload));

    // Add handler for get_quiz_state event
    socket.on("get_quiz_state", ({ quizId }) => {
        const quizState = require('./quizState');
        logger.info(`Socket ${socket.id} requested quiz state for quiz ${quizId}`);
        if (quizState[quizId]) {
            socket.emit("quiz_state", quizState[quizId]);
            logger.debug(`Sent quiz state for quiz ${quizId}`, quizState[quizId]);
        } else {
            logger.warn(`Quiz state requested for non-existent quiz ${quizId}`);
        }
    });

    // Add handler for updating tournament code from dashboard
    socket.on("update_tournament_code", async ({ quizId, tournamentCode, teacherId, cookie_id }) => {
        const quizState = require("./quizState");
        if (!quizId || !tournamentCode) {
            logger.warn(`[update_tournament_code] Missing quizId or tournamentCode`);
            return;
        }
        if (!quizState[quizId]) {
            logger.warn(`[update_tournament_code] No quizState found for quizId=${quizId}`);
            return;
        }
        quizState[quizId].tournament_code = tournamentCode;
        logger.info(`[update_tournament_code] Updated quizState[${quizId}].tournament_code to ${tournamentCode}`);
    });

    // Add handler for projector view joining the projection room
    socket.on("join_projection", async ({ quizId, teacherId, cookie_id }) => {
        socket.join(`projection_${quizId}`);
        logger.info(`Socket ${socket.id} joined room projection_${quizId} (projector)`);
        // Ensure quiz state is initialized for the projector
        await ensureQuizStateInitialized(quizId, prisma, socket);
        socket.emit("joined_room", {
            room: `projection_${quizId}`,
            socketId: socket.id,
            rooms: Array.from(socket.rooms),
        });
    });

    socket.on("quiz_reset_ended", ({ quizId }) => {
        const quizState = require('./quizState');
        if (quizState[quizId]) {
            // Reset all relevant fields for a fresh session
            quizState[quizId].ended = false;
            quizState[quizId].locked = false;
            quizState[quizId].currentQuestionIdx = null;
            quizState[quizId].chrono = { timeLeft: null, running: false };
            quizState[quizId].stats = {};
            quizState[quizId].timerStatus = null;
            quizState[quizId].timerQuestionId = null;
            quizState[quizId].timerTimeLeft = null;
            quizState[quizId].timerTimestamp = null;
            // Optionally, keep profTeacherId and questions
            logger.info(`Quiz ${quizId} state fully reset for new session`);
            io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);
        }
    });

    socket.on("quiz_toggle_stats", ({ quizId, questionUid, show }) => {
        logger.info(`[quiz_toggle_stats] Received for quizId=${quizId}, questionUid=${questionUid}, show=${show}`);
        // Forward to projector room
        io.to(`projection_${quizId}`).emit("quiz_toggle_stats", { quizId, questionUid, show });
        logger.debug(`[quiz_toggle_stats] Forwarded to projection_${quizId}`);
    });
}

module.exports = registerQuizEvents;