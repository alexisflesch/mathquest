/**
 * setQuestionHandler.ts - Handler for setting the active question in a quiz
 *
 * Updates the quiz state with the new question index and timer settings.
 * If linked to a tournament, it triggers the corresponding question update
 * and starts the timer in the tournament state using trigger functions.
 *
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
import { quizState, getQuestionTimer } from '../quizState.js';
import { patchQuizStateForBroadcast, updateQuestionTimer } from '../quizUtils';
// Import using require for now until these are converted to TypeScript
// TODO: Convert these imports to TypeScript imports when available
const createLogger = require('../../logger');
const logger = createLogger('SetQuestionHandler');
const { tournamentState, triggerTournamentQuestion, triggerTournamentTimerSet } = require('../tournamentHandler');
const { triggerQuizTimerAction } = require('../quizTriggers');
/**
 * Handle quiz_set_question event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 * @param payload - Event payload containing quizId, questionUid, etc.
 */
async function handleSetQuestion(io, socket, prisma, { quizId, questionUid, questionIdx, tournamentCode, teacherId }) {
    // Initialize quizState if it doesn't exist
    if (!quizState[quizId]) {
        logger.info(`[SetQuestion] Creating new quizState for quizId=${quizId}`);
        quizState[quizId] = {
            currentQuestionUid: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            profTeacherId: teacherId,
            questionTimers: {},
            connectedSockets: new Set(),
        };
        try {
            // Load quiz data
            const quiz = await prisma.quiz.findUnique({
                where: { id: quizId },
                select: { enseignant_id: true, questions_ids: true, tournament_code: true }
            });
            if (quiz) {
                // Update the teacher ID and load questions
                quizState[quizId].profTeacherId = quiz.enseignant_id;
                if (quiz.tournament_code) {
                    quizState[quizId].tournament_code = quiz.tournament_code;
                }
                if (quiz.questions_ids && quiz.questions_ids.length > 0) {
                    // Fetch questions from database
                    const questionsData = await prisma.question.findMany({
                        where: { uid: { in: quiz.questions_ids } }
                    });
                    // Maintain the order from questions_ids
                    const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                    const orderedQuestions = []; // Using 'any' temporarily until Question type is properly defined
                    quiz.questions_ids.forEach(uid => {
                        if (questionMap.has(uid)) {
                            orderedQuestions.push(questionMap.get(uid));
                        }
                    });
                    quizState[quizId].questions = orderedQuestions;
                }
            }
        }
        catch (err) {
            logger.error(`[SetQuestion] Error loading quiz data for ${quizId}:`, err);
        }
    }
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { enseignant_id: true }
        });
        if (!quiz || quiz.enseignant_id !== teacherId) {
            logger.warn(`[SetQuestion] Unauthorized access for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
            return;
        }
        // Update in-memory state for future requests
        if (quizState[quizId]) {
            quizState[quizId].profTeacherId = teacherId;
        }
        else {
            logger.error(`[SetQuestion] quizState[${quizId}] is still undefined after initialization attempt`);
            return;
        }
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;
    // Check if questions array is initialized
    if (!quizState[quizId].questions || !Array.isArray(quizState[quizId].questions)) {
        logger.error(`[SetQuestion] Questions array not properly initialized for quiz ${quizId}`);
        socket.emit('quiz_action_response', {
            success: false,
            error: 'Questions not loaded. Please try again.'
        });
        return;
    }
    // Find question by UID
    const questionIndex = quizState[quizId].questions.findIndex(q => q.uid === questionUid);
    if (questionIndex === -1) {
        logger.error(`[SetQuestion] Question with UID ${questionUid} not found in quiz ${quizId}`);
        socket.emit('quiz_action_response', {
            success: false,
            error: 'Question not found. Please refresh and try again.'
        });
        return;
    }
    // Use provided questionIdx if available, otherwise use computed index
    const finalQuestionIdx = typeof questionIdx === 'number' ? questionIdx : questionIndex;
    // Update current question UID and index in quiz state
    logger.info(`[SetQuestion] Setting current question to UID=${questionUid}, idx=${finalQuestionIdx} for quiz ${quizId}`);
    quizState[quizId].currentQuestionUid = questionUid;
    quizState[quizId].currentQuestionIdx = finalQuestionIdx;
    // Reset lock state (questions start unlocked)
    quizState[quizId].locked = false;
    // Start or reset timer for this question
    updateQuestionTimer(quizId, questionUid, 'stop');
    const questionTimer = getQuestionTimer(quizId, questionUid);
    if (questionTimer) {
        // Update global timer fields to match question-specific timer
        quizState[quizId].timerStatus = questionTimer.status;
        quizState[quizId].timerQuestionId = questionUid;
        quizState[quizId].timerTimeLeft = questionTimer.timeLeft;
        quizState[quizId].timerTimestamp = questionTimer.timestamp;
        logger.info(`[SetQuestion] Reset timer for question ${questionUid}: status=${questionTimer.status}, timeLeft=${questionTimer.timeLeft}`);
    }
    else {
        logger.warn(`[SetQuestion] Failed to get or create timer for question ${questionUid}`);
    }
    // Prepare dashboard state for broadcast (with current question object)
    const dashboardState = patchQuizStateForBroadcast(quizState[quizId]);
    // Broadcast updated state to dashboard room
    io.to(`dashboard_${quizId}`).emit('quiz_state_update', dashboardState);
    logger.info(`[SetQuestion] Emitted quiz_state_update to dashboard_${quizId}`);
    // Trigger tournament question change if linked to a tournament
    if (tournamentCode) {
        logger.info(`[SetQuestion] Triggering tournament question update for code=${tournamentCode}, questionUid=${questionUid}`);
        try {
            await triggerTournamentQuestion(io, tournamentCode, questionUid);
            // If we have a timer for this question, sync it to tournament
            if (questionTimer) {
                triggerTournamentTimerSet(io, tournamentCode, questionTimer.timeLeft);
            }
        }
        catch (e) {
            logger.error(`[SetQuestion] Error triggering tournament question: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    // Send success response to requesting client
    socket.emit('quiz_action_response', {
        success: true,
        action: 'set_question',
        questionUid,
        questionIdx: finalQuestionIdx
    });
    // Notify admin of action
    logger.info(`[SetQuestion] Question ${questionUid} set for quiz ${quizId} by teacher ${teacherId}`);
}
export default handleSetQuestion;
