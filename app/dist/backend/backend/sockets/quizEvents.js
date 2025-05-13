"use strict";
/**
 * quizEvents.ts - Quiz Socket Event Registration
 *
 * This module imports individual event handlers for quiz-related actions
 * and registers them with the Socket.IO socket instance.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureQuizStateInitialized = ensureQuizStateInitialized;
exports.registerQuizEvents = registerQuizEvents;
const quizUtils_1 = require("./quizUtils");
const quizState_1 = require("./quizState");
// Import logger properly using ES import
const logger_1 = __importDefault(require("../logger"));
const logger = (0, logger_1.default)('QuizEvents');
// Import handlers
// Some are imported as TypeScript modules
const setQuestionHandler_1 = __importDefault(require("./quizEventHandlers/setQuestionHandler"));
const timerActionHandler_1 = __importDefault(require("./quizEventHandlers/timerActionHandler"));
const setTimerHandler_1 = require("./quizEventHandlers/setTimerHandler"); // Changed from default to named import
const lockHandler_1 = __importDefault(require("./quizEventHandlers/lockHandler"));
const unlockHandler_1 = __importDefault(require("./quizEventHandlers/unlockHandler"));
const endHandler_1 = __importDefault(require("./quizEventHandlers/endHandler"));
const pauseHandler_1 = __importDefault(require("./quizEventHandlers/pauseHandler"));
const resumeHandler_1 = __importDefault(require("./quizEventHandlers/resumeHandler"));
// All handlers are now properly imported as TypeScript modules
const joinQuizHandler_1 = __importDefault(require("./quizEventHandlers/joinQuizHandler"));
const disconnectingHandler_1 = __importDefault(require("./quizEventHandlers/disconnectingHandler"));
const handleCloseQuestion = require('./quizEventHandlers/closeQuestionHandler');
/**
 * Initialize quiz state if it doesn't already exist
 * @param quizId - Quiz ID
 * @param prisma - Prisma client
 * @param socket - Socket connection
 * @param role - User role ('teacher', 'projector', etc.)
 * @param teacherId - Teacher ID if role is 'teacher'
 */
async function ensureQuizStateInitialized(quizId, prisma, socket, role = null, teacherId = null) {
    // Using the imported quizState from the module
    if (!quizState_1.quizState[quizId]) {
        quizState_1.quizState[quizId] = {
            currentQuestionUid: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: (role === 'prof' || role === 'teacher') ? socket.id : undefined,
            profTeacherId: (role === 'prof' || role === 'teacher') ? teacherId || '' : '',
            timerStatus: undefined,
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set(),
        };
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
            if (quiz && quiz.questions_ids) {
                const orderedQuestions = []; // Using any[] temporarily until Question type is properly defined
                const questionsData = await prisma.question.findMany({
                    where: { uid: { in: quiz.questions_ids } }
                });
                const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                quiz.questions_ids.forEach(uid => {
                    if (questionMap.has(uid)) {
                        orderedQuestions.push(questionMap.get(uid));
                    }
                });
                quizState_1.quizState[quizId].questions = orderedQuestions;
            }
            if (quiz && quiz.tournament_code) {
                quizState_1.quizState[quizId].tournament_code = quiz.tournament_code;
            }
            // Always set quizId as 'id' property to help with patching
            quizState_1.quizState[quizId].id = quizId;
        }
        catch (e) {
            logger.error(`[ensureQuizStateInitialized] Error loading quiz ${quizId} questions:`, e);
        }
    }
    else {
        // CRITICAL FIX: If state already exists, ensure currentQuestionUid and timerQuestionId are in sync if timer is active
        if (quizState_1.quizState[quizId].timerStatus === 'play' &&
            quizState_1.quizState[quizId].timerQuestionId &&
            quizState_1.quizState[quizId].currentQuestionUid !== quizState_1.quizState[quizId].timerQuestionId) {
            logger.warn(`[ensureQuizStateInitialized] Fixing mismatch: currentQuestionUid=${quizState_1.quizState[quizId].currentQuestionUid}, active timerQuestionId=${quizState_1.quizState[quizId].timerQuestionId}`);
            quizState_1.quizState[quizId].currentQuestionUid = quizState_1.quizState[quizId].timerQuestionId;
        }
        // Ensure quizId is set as 'id' property
        quizState_1.quizState[quizId].id = quizId;
    }
    return quizState_1.quizState[quizId];
}
/**
 * Register all quiz-related event handlers for a socket
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 */
function registerQuizEvents(io, socket, prisma) {
    logger.info(`[DEBUG] registerQuizEvents for socket.id=${socket.id}`);
    // Register handlers
    socket.on("join_quiz", (payload) => (0, joinQuizHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_set_question", (payload) => {
        (0, setQuestionHandler_1.default)(io, socket, prisma, payload);
        const { quizId } = payload;
        // Ensure askedQuestions set is initialized
        if (!quizState_1.quizState[quizId].askedQuestions) {
            quizState_1.quizState[quizId].askedQuestions = new Set();
        }
        // Add the current question UID to the askedQuestions set
        const currentQuestion = quizState_1.quizState[quizId].questions.find((q) => q.uid === quizState_1.quizState[quizId].currentQuestionUid);
        if (currentQuestion && currentQuestion.uid) {
            quizState_1.quizState[quizId].askedQuestions.add(currentQuestion.uid);
        }
    });
    socket.on("quiz_timer_action", (payload) => (0, timerActionHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_set_timer", (payload) => (0, setTimerHandler_1.handleSetTimer)(io, socket, prisma, payload));
    socket.on("quiz_lock", (payload) => (0, lockHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_unlock", (payload) => (0, unlockHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_end", (payload) => (0, endHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_pause", (payload) => (0, pauseHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_resume", (payload) => (0, resumeHandler_1.default)(io, socket, prisma, payload));
    socket.on("quiz_close_question", (payload) => handleCloseQuestion(io, socket, prisma, payload));
    // Handle disconnections
    socket.on("disconnecting", () => (0, disconnectingHandler_1.default)(io, socket, prisma));
    // Get quiz state (should already be initialized by join_quiz)
    socket.on("get_quiz_state", async ({ quizId }) => {
        logger.info(`[get_quiz_state] Request for quizId=${quizId}`);
        if (!quizId)
            return;
        const { quizState } = require('./quizState');
        if (!quizState[quizId]) {
            logger.warn(`[get_quiz_state] No state exists for quizId=${quizId}`);
            socket.emit("quiz_state", { notFound: true });
            return;
        }
        // Patch state with calculated fields before sending
        const patchedState = (0, quizUtils_1.patchQuizStateForBroadcast)(quizState[quizId]);
        socket.emit("quiz_state", patchedState);
    });
}
