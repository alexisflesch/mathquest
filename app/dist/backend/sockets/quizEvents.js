/**
 * quizEvents.ts - Quiz Socket Event Registration
 *
 * This module imports individual event handlers for quiz-related actions
 * and registers them with the Socket.IO socket instance.
 */
import { patchQuizStateForBroadcast } from './quizUtils';
// Import logger using require until logger module is converted to TypeScript
const createLogger = require('../logger');
const logger = createLogger('QuizEvents');
// Import handlers
// Some are imported as TypeScript modules
import handleSetQuestion from './quizEventHandlers/setQuestionHandler';
import handleTimerAction from './quizEventHandlers/timerActionHandler';
import { handleSetTimer } from './quizEventHandlers/setTimerHandler'; // Changed from default to named import
import handleLock from './quizEventHandlers/lockHandler';
import handleUnlock from './quizEventHandlers/unlockHandler';
import handleEnd from './quizEventHandlers/endHandler';
import handlePause from './quizEventHandlers/pauseHandler';
import handleResume from './quizEventHandlers/resumeHandler';
// Others are still imported as JS modules until they are converted
// TODO: Convert these to TypeScript imports as the handlers are migrated
const handleJoinQuiz = require('./quizEventHandlers/joinQuizHandler');
const handleDisconnecting = require('./quizEventHandlers/disconnectingHandler');
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
    // Import quizState directly from the TS module now
    const { quizState } = require('./quizState');
    if (!quizState[quizId]) {
        quizState[quizId] = {
            currentQuestionUid: null,
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
                quizState[quizId].questions = orderedQuestions;
            }
            if (quiz && quiz.tournament_code) {
                quizState[quizId].tournament_code = quiz.tournament_code;
            }
            // Always set quizId as 'id' property to help with patching
            quizState[quizId].id = quizId;
        }
        catch (e) {
            logger.error(`[ensureQuizStateInitialized] Error loading quiz ${quizId} questions:`, e);
        }
    }
    else {
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
/**
 * Register all quiz-related event handlers for a socket
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 */
function registerQuizEvents(io, socket, prisma) {
    logger.info(`[DEBUG] registerQuizEvents for socket.id=${socket.id}`);
    // Register handlers
    socket.on("join_quiz", (payload) => handleJoinQuiz(io, socket, prisma, payload));
    socket.on("quiz_set_question", (payload) => {
        handleSetQuestion(io, socket, prisma, payload);
        // Get quizState after handling the event
        const { quizState } = require('./quizState');
        const { quizId } = payload;
        // Ensure askedQuestions set is initialized
        if (!quizState[quizId].askedQuestions) {
            quizState[quizId].askedQuestions = new Set();
        }
        // Add the current question UID to the askedQuestions set
        const currentQuestion = quizState[quizId].questions.find((q) => q.uid === quizState[quizId].currentQuestionUid);
        if (currentQuestion && currentQuestion.uid) {
            quizState[quizId].askedQuestions.add(currentQuestion.uid);
        }
    });
    socket.on("quiz_timer_action", (payload) => handleTimerAction(io, socket, prisma, payload));
    socket.on("quiz_set_timer", (payload) => handleSetTimer(io, socket, prisma, payload));
    socket.on("quiz_lock", (payload) => handleLock(io, socket, prisma, payload));
    socket.on("quiz_unlock", (payload) => handleUnlock(io, socket, prisma, payload));
    socket.on("quiz_end", (payload) => handleEnd(io, socket, prisma, payload));
    socket.on("quiz_pause", (payload) => handlePause(io, socket, prisma, payload));
    socket.on("quiz_resume", (payload) => handleResume(io, socket, prisma, payload));
    socket.on("quiz_close_question", (payload) => handleCloseQuestion(io, socket, prisma, payload));
    // Handle disconnections
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma));
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
        const patchedState = patchQuizStateForBroadcast(quizState[quizId]);
        socket.emit("quiz_state", patchedState);
    });
}
export { ensureQuizStateInitialized, registerQuizEvents };
