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
// Using JavaScript bridge files that handle both TypeScript and legacy versions
const handleJoinQuiz = require('./quizEventHandlers/joinQuizHandler.js');
const handleSetQuestion = require('./quizEventHandlers/setQuestionHandler.js');
const handleTimerAction = require('./quizEventHandlers/timerActionHandler.js');
const handleSetTimer = require('./quizEventHandlers/setTimerHandler.js');
const handleLock = require('./quizEventHandlers/lockHandler.js');
const handleUnlock = require('./quizEventHandlers/unlockHandler.js');
const handleEnd = require('./quizEventHandlers/endHandler.js');
const handlePause = require('./quizEventHandlers/pauseHandler.js');
const handleResume = require('./quizEventHandlers/resumeHandler.js');
const handleDisconnecting = require('./quizEventHandlers/disconnectingHandler.js');
const handleCloseQuestion = require('./quizEventHandlers/closeQuestionHandler.js');
const { patchQuizStateForBroadcast } = require('./quizUtils.legacy.js');

// --- Shared quiz state initialization for dashboard and projector ---
async function ensureQuizStateInitialized(quizId, prisma, socket, role = null, teacherId = null) {
    // CRITICAL FIX: Import the quizState object correctly
    const { quizState } = require('./quizState');
    if (!quizState[quizId]) {
        quizState[quizId] = {
            currentQuestionUid: null,
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: (role === 'teacher') ? socket.id : null,
            profTeacherId: (role === 'teacher') ? teacherId : null,
            timerStatus: 'stop',
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set(),
            questionTimers: {},
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

            // Always set quizId as 'id' property to help with patching
            quizState[quizId].id = quizId;

        } catch (e) {
            const logger = require('../logger')("QuizEvents");
            logger.error(`[ensureQuizStateInitialized] Error loading quiz ${quizId} questions:`, e);
        }
    } else {
        // CRITICAL FIX: If state already exists, ensure currentQuestionUid and timerQuestionId are in sync if timer is active
        if (quizState[quizId].timerStatus === 'play' &&
            quizState[quizId].timerQuestionId &&
            quizState[quizId].currentQuestionUid !== quizState[quizId].timerQuestionId) {

            logger.warn(`[ensureQuizStateInitialized] Fixing mismatch: currentQuestionUid=${quizState[quizId].currentQuestionUid}, active timerQuestionId=${quizState[quizId].timerQuestionId}`);
            quizState[quizId].currentQuestionUid = quizState[quizId].timerQuestionId;
        }

        // Ensure quizId is set as 'id' property
        quizState[quizId].id = quizId;
    }
    return quizState[quizId];
}

function registerQuizEvents(io, socket, prisma) {
    logger.info(`[DEBUG] registerQuizEvents for socket.id=${socket.id}`);
    // Register handlers
    socket.on("join_quiz", (payload) => handleJoinQuiz(io, socket, prisma, payload));
    socket.on("quiz_set_question", (payload) => {
        handleSetQuestion(io, socket, prisma, payload);
        const { quizState } = require('./quizState');
        const { quizId } = payload;
        // Ensure askedQuestions set is initialized
        if (!quizState[quizId].askedQuestions) {
            quizState[quizId].askedQuestions = new Set();
        }

        // Add the current question UID to the askedQuestions set
        const currentQuestion = quizState[quizId].questions.find(q => q.uid === quizState[quizId].currentQuestionUid);
        if (currentQuestion && currentQuestion.uid) {
            quizState[quizId].askedQuestions.add(currentQuestion.uid);
            logger.debug(`[quiz_set_question] Added question UID ${currentQuestion.uid} to askedQuestions for quiz ${quizId}`);
        }
    });
    socket.on("quiz_timer_action", (payload) => handleTimerAction(io, socket, prisma, payload));
    socket.on("quiz_set_timer", (payload) => handleSetTimer(io, socket, prisma, payload));
    socket.on("quiz_lock", (payload) => handleLock(io, socket, prisma, payload));
    socket.on("quiz_unlock", (payload) => handleUnlock(io, socket, prisma, payload));
    socket.on("quiz_end", async (payload) => {
        const { quizState } = require('./quizState');
        const { quizId } = payload;
        if (!payload.tournamentCode && quizState[quizId]?.tournament_code) {
            payload.tournamentCode = quizState[quizId].tournament_code;
            logger.info(`[quiz_end] Retrieved tournamentCode from quizState for quizId=${quizId}: ${payload.tournamentCode}`);
        }
        if (!payload.tournamentCode) {
            logger.warn(`[quiz_end] No tournamentCode found for quizId=${quizId}. Cannot proceed.`);
            return;
        }
        handleEnd(io, socket, prisma, payload);
    });
    socket.on("quiz_pause", (payload) => handlePause(io, socket, prisma, payload));
    socket.on("quiz_resume", (payload) => handleResume(io, socket, prisma, payload));
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma)); // Pass prisma if needed by handler
    socket.on("quiz_close_question", (payload) => handleCloseQuestion(io, socket, payload));

    // Add handler for get_quiz_state event
    socket.on("get_quiz_state", ({ quizId }) => {
        const { quizState } = require('./quizState');
        logger.info(`[get_quiz_state] Socket ${socket.id} requested quiz state for quiz ${quizId}, current state: ${JSON.stringify({
            currentQuestionUid: quizState[quizId]?.currentQuestionUid,
            timerStatus: quizState[quizId]?.timerStatus,
            timerQuestionId: quizState[quizId]?.timerQuestionId
        })}`);

        if (quizState[quizId]) {
            const state = quizState[quizId];

            // CRITICAL FIX: Ensure currentQuestionUid matches timerQuestionId when timer is active
            if (state.timerQuestionId && state.timerStatus === 'play') {
                if (state.currentQuestionUid !== state.timerQuestionId) {
                    logger.warn(`[get_quiz_state] FIXING MISMATCH: currentQuestionUid=${state.currentQuestionUid} doesn't match active timer questionId=${state.timerQuestionId}`);
                    state.currentQuestionUid = state.timerQuestionId;
                }
            }

            // Store the initial timer value if not present (for backward compatibility)
            if (state.chrono && typeof state.chrono.timeLeft === 'number' && !state.timerInitialValue) {
                state.timerInitialValue = state.chrono.timeLeft;
            }
            // Determine if this socket is a teacher/projector (full state) or student (filtered)
            const isTeacherOrProjector = socket.rooms.has(`dashboard_${quizId}`) || socket.rooms.has(`projection_${quizId}`);
            if (!isTeacherOrProjector) {
                // STUDENT: Only send current question (no correct answers)
                const currentQuestion = state.questions.find(q => q.uid === state.currentQuestionUid);
                let question = null;
                if (currentQuestion) {
                    // Remove 'correct' field from answers
                    question = {
                        uid: currentQuestion.uid,
                        texte: currentQuestion.texte,
                        type: currentQuestion.type,
                        answers: Array.isArray(currentQuestion.answers)
                            ? currentQuestion.answers.map(a => ({ texte: a.texte }))
                            : [],
                    };
                }
                const filteredState = {
                    currentQuestionUid: state.currentQuestionUid,
                    question,
                    chrono: state.chrono,
                    locked: state.locked,
                    ended: state.ended,
                };
                socket.emit("quiz_state", filteredState);
                logger.debug(`[get_quiz_state] Sent filtered quiz state for quiz ${quizId} to student, UID: ${filteredState.currentQuestionUid}`);
                return;
            }
            // TEACHER/PROJECTOR: Full state, with timer patch
            if (state.chrono && state.chrono.running && typeof state.timerInitialValue === 'number' && state.timerTimestamp) {
                const now = Date.now();
                const elapsed = Math.floor((now - state.timerTimestamp) / 1000);
                const original = state.timerInitialValue;
                const remaining = Math.max(original - elapsed, 0);
                logger.info(`[get_quiz_state] Recalculated timeLeft: original=${original}s, elapsed=${elapsed}s, remaining=${remaining}s`);
                const stateCopy = { ...state, chrono: { ...state.chrono, timeLeft: remaining }, timerTimeLeft: remaining };
                logger.debug(`[get_quiz_state] About to send state with UID: ${stateCopy.currentQuestionUid}, timerQuestionId: ${stateCopy.timerQuestionId}`);
                socket.emit("quiz_state", stateCopy);
                logger.debug(`[get_quiz_state] Sent quiz state copy for quiz ${quizId}, UID: ${stateCopy.currentQuestionUid}`);
            } else {
                logger.debug(`[get_quiz_state] About to send state with UID: ${state.currentQuestionUid}, timerQuestionId: ${state.timerQuestionId}`);
                socket.emit("quiz_state", state);
                logger.debug(`[get_quiz_state] Sent quiz state for quiz ${quizId}, UID: ${state.currentQuestionUid}`);
            }
        } else {
            logger.warn(`[get_quiz_state] Quiz state requested for non-existent quiz ${quizId}`);
            // Add timer state to logs
            logger.debug(`[get_quiz_state] Timer state: ${JSON.stringify({
                timerStatus: quizState[quizId]?.timerStatus,
                timerQuestionId: quizState[quizId]?.timerQuestionId,
                timerTimeLeft: quizState[quizId]?.timerTimeLeft,
                timerTimestamp: quizState[quizId]?.timerTimestamp
            })}`);
        }
    });

    // Add handler for updating tournament code from dashboard
    socket.on("update_tournament_code", async ({ quizId, tournamentCode, teacherId, cookie_id }) => {
        const { quizState } = require("./quizState");
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

        // --- PATCH: Immediately emit leaderboard to projection room ---
        try {
            const { quizState } = require('./quizState');
            const { tournamentState } = require('./tournamentHandler');
            const { computeLeaderboard } = require('./tournamentUtils/computeLeaderboard');
            const quiz = quizState[quizId];
            if (!quiz) return;
            const code = quiz.tournament_code;
            if (!code || !tournamentState[code]) return;
            const tState = tournamentState[code];
            const leaderboard = computeLeaderboard(tState);
            const playerCount = leaderboard.length;
            io.to(`projection_${quizId}`).emit('quiz_question_results', {
                leaderboard,
                correctAnswers: [], // No correct answers context here
                playerCount
            });
            logger.info(`[join_projection] Emitted leaderboard to projection_${quizId}`);
        } catch (err) {
            logger.error(`[join_projection] Failed to emit leaderboard:`, err);
        }
    });

    socket.on("quiz_reset_ended", ({ quizId }) => {
        const { quizState } = require('./quizState');
        if (quizState[quizId]) {
            // Reset all relevant fields for a fresh session
            quizState[quizId].ended = false;
            quizState[quizId].locked = false;
            quizState[quizId].currentQuestionUid = null;
            quizState[quizId].chrono = { timeLeft: null, running: false };
            quizState[quizId].stats = {};
            quizState[quizId].timerStatus = null;
            quizState[quizId].timerQuestionId = null;
            quizState[quizId].timerTimeLeft = null;
            quizState[quizId].timerTimestamp = null;
            // Optionally, keep profTeacherId and questions
            logger.info(`Quiz ${quizId} state fully reset for new session`);

            // --- CRITICAL FIX: Ensure ID is set before patching ---
            let state = quizState[quizId];
            state.id = quizId;
            state.quizId = quizId; // Set both properties for redundancy

            // --- PATCH: RECALCULATE TIMER FOR BROADCAST ---
            let patchedState = patchQuizStateForBroadcast(state);
            io.to(`dashboard_${quizId}`).emit("quiz_state", patchedState);
        }
    });

    socket.on("quiz_toggle_stats", ({ quizId, questionUid, show }) => {
        logger.info(`[quiz_toggle_stats] Received for quizId=${quizId}, questionUid=${questionUid}, show=${show}`);
        // Forward to projector room
        io.to(`projection_${quizId}`).emit("quiz_toggle_stats", { quizId, questionUid, show });
        logger.debug(`[quiz_toggle_stats] Forwarded to projection_${quizId}`);

        // Use shared stats utility
        try {
            const { quizState } = require('./quizState');
            const { tournamentState } = require('./tournamentHandler');
            const { computeAnswerStats } = require('./tournamentUtils/computeStats');
            const quiz = quizState[quizId];
            if (!quiz) return;
            const code = quiz.tournament_code;
            if (!code || !tournamentState[code]) return;
            const tState = tournamentState[code];
            const { stats, totalAnswers } = computeAnswerStats(tState, questionUid);
            io.to(`projection_${quizId}`).emit("quiz_answer_stats_update", {
                questionUid,
                stats,
                totalAnswers
            });
            logger.info(`[quiz_toggle_stats] Emitted quiz_answer_stats_update to projection_${quizId} for question ${questionUid}`);
        } catch (err) {
            logger.error(`[quiz_toggle_stats] Failed to emit stats:`, err);
        }
    });
}

module.exports = registerQuizEvents;