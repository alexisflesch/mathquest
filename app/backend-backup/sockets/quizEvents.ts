/**
 * quizEvents.ts - Quiz Template Dashboard Socket Event Registration
 *
 * This module imports individual event handlers for quiz template dashboard-related actions
 * and registers them with the Socket.IO socket instance.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
// TODO: Rename QuizState to QuizTemplateDashboardState or similar
import { QuizState, Question } from './types/quizTypes';
import { patchQuizStateForBroadcast } from './quizUtils'; // May need to be adapted or renamed
import { quizState } from './quizState'; // This global state object might need renaming too

// Import logger properly using ES import
import createLogger from '../logger';
const logger = createLogger('QuizTemplateDashboardEvents'); // Renamed logger

// Import handlers
// Some are imported as TypeScript modules
import handleSetQuestion from './quizEventHandlers/setQuestionHandler'; // Will need updates for QuizTemplate context
import handleTimerAction from './quizEventHandlers/timerActionHandler'; // Will need updates
import { handleSetTimer } from './quizEventHandlers/setTimerHandler'; // Will need updates
import handleLock from './quizEventHandlers/lockHandler'; // Will need updates
import handleUnlock from './quizEventHandlers/unlockHandler'; // Will need updates
import handleEnd from './quizEventHandlers/endHandler'; // Will need updates
import handlePause from './quizEventHandlers/pauseHandler'; // Will need updates
import handleResume from './quizEventHandlers/resumeHandler'; // Will need updates

// Import the refactored join handler - using default import
import handleJoinQuizTemplateDashboard from './quizEventHandlers/joinQuizHandler'; // Using default export
import handleDisconnecting from './quizEventHandlers/disconnectingHandler'; // May need updates
const handleCloseQuestion = require('./quizEventHandlers/closeQuestionHandler'); // Will need updates

/**
 * Initialize quiz template dashboard state if it doesn't already exist
 * @param quizTemplateId - Quiz Template ID
 * @param prisma - Prisma client
 * @param socket - Socket connection
 * @param role - User role ('teacher', 'projector', etc.)
 * @param teacherId - Teacher ID if role is 'teacher'
 */
async function ensureQuizTemplateDashboardStateInitialized( // Renamed function
    quizTemplateId: string, // Renamed parameter
    prisma: PrismaClient,
    socket: Socket,
    role: string | null = null,
    teacherId: string | null = null
): Promise<QuizState> { // Return type might need to change if QuizState is renamed
    // Using the imported quizState from the module

    if (!quizState[quizTemplateId]) { // Use quizTemplateId as key
        quizState[quizTemplateId] = {
            currentQuestionUid: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {}, // Stats might need re-evaluation in template dashboard context
            profSocketId: (role === 'prof' || role === 'teacher') ? socket.id : undefined,
            profTeacherId: (role === 'prof' || role === 'teacher') ? teacherId || '' : '',
            timerStatus: undefined,
            timerQuestionUid: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set<string>(),
        };

        try {
            // Fetch QuizTemplate and its ordered questions
            const quizTemplate = await prisma.quizTemplate.findUnique({
                where: { id: quizTemplateId },
                include: {
                    questions: { // This relation field is correct per schema.prisma
                        include: {
                            question: true
                        },
                        orderBy: {
                            sequence: 'asc' // Correct field for ordering
                        }
                    }
                }
            });

            if (quizTemplate) {
                // Extract questions in correct order
                // Explicitly define the map callback parameter type
                const orderedQuestions = quizTemplate.questions.map((qit: any) => {
                    // Convert each Prisma Question to our local Question type
                    const question = qit.question;
                    return {
                        uid: question.uid,
                        text: question.text || '',
                        type: question.questionType,
                        answers: Array.isArray(question.responses) ?
                            question.responses.map((r: any) => ({
                                text: r.text || r.texte || '',
                                correct: !!r.correct
                            })) : [],
                        time: question.timeLimit || 20,
                        explanation: question.explanation,
                        tags: question.tags || [],
                        themes: question.themes || [],
                        difficulty: question.difficulty,
                        gradeLevel: question.gradeLevel,
                        discipline: question.discipline,
                        title: question.title,
                        hidden: question.isHidden
                    } as Question;
                });

                quizState[quizTemplateId].questions = orderedQuestions;
            }

            // Always set quizTemplateId as 'id' property to help with patching
            quizState[quizTemplateId].id = quizTemplateId;
        } catch (e) {
            logger.error(`[ensureQuizTemplateDashboardStateInitialized] Error loading quiz template ${quizTemplateId} questions:`, e);
        }
    } else {
        // CRITICAL FIX: If state already exists, ensure currentQuestionUid and timerQuestionUid are in sync if timer is active
        if (quizState[quizTemplateId].timerStatus === 'play' &&
            quizState[quizTemplateId].timerQuestionUid &&
            quizState[quizTemplateId].currentQuestionUid !== quizState[quizTemplateId].timerQuestionUid) {

            logger.warn(`[ensureQuizTemplateDashboardStateInitialized] Fixing mismatch: currentQuestionUid=${quizState[quizTemplateId].currentQuestionUid}, active timerQuestionUid=${quizState[quizTemplateId].timerQuestionUid}`);
            quizState[quizTemplateId].currentQuestionUid = quizState[quizTemplateId].timerQuestionUid;
        }

        // Ensure quizTemplateId is set as 'id' property
        quizState[quizTemplateId].id = quizTemplateId;
    }

    return quizState[quizTemplateId];
}

/**
 * Register all quiz template dashboard-related event handlers for a socket
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 */
function registerQuizTemplateDashboardEvents(io: Server, socket: Socket, prisma: PrismaClient): void { // Renamed function
    logger.info(`[DEBUG] registerQuizTemplateDashboardEvents for socket.id=${socket.id}`);

    // Register handlers with new event names and use quizTemplateId
    socket.on("join_quiz_template_dashboard", (payload) => { // Renamed event
        // Assuming payload contains quizTemplateId and teacherId
        handleJoinQuizTemplateDashboard(io, socket, prisma, payload);
    });

    // BACKWARD COMPATIBILITY: Support old event name during transition
    socket.on("join_quiz", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy join_quiz event, treating quizId as quizTemplateId`);
        // Transform payload if needed (quizId -> quizTemplateId)
        const compatPayload = {
            ...payload,
            quizTemplateId: payload.quizId
        };
        handleJoinQuizTemplateDashboard(io, socket, prisma, compatPayload);
    });

    socket.on("quiz_template_dashboard_set_question", (payload) => { // Renamed event
        // Assuming payload contains quizTemplateId
        handleSetQuestion(io, socket, prisma, payload); // This handler will need internal updates
        const { quizTemplateId } = payload; // Use quizTemplateId

        // Ensure askedQuestions set is initialized
        if (quizState[quizTemplateId] && !quizState[quizTemplateId].askedQuestions) {
            quizState[quizTemplateId].askedQuestions = new Set<string>();
        }

        // Add the current question UID to the askedQuestions set
        if (quizState[quizTemplateId] && quizState[quizTemplateId].currentQuestionUid) {
            const currentQuestionUid = quizState[quizTemplateId].currentQuestionUid;
            const currentQuestion = quizState[quizTemplateId].questions.find((q) => q.uid === currentQuestionUid);

            if (currentQuestion && quizState[quizTemplateId].askedQuestions) {
                quizState[quizTemplateId].askedQuestions.add(currentQuestion.uid);
            }
        }
    });

    // BACKWARD COMPATIBILITY: Support old event name during transition
    socket.on("quiz_set_question", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_set_question event, treating quizId as quizTemplateId`);
        // Transform payload if needed
        const compatPayload = {
            ...payload,
            quizTemplateId: payload.quizId
        };
        handleSetQuestion(io, socket, prisma, compatPayload);

        // Handle askedQuestions similarly to the new event handler
        const quizTemplateId = payload.quizId;
        if (quizState[quizTemplateId] && !quizState[quizTemplateId].askedQuestions) {
            quizState[quizTemplateId].askedQuestions = new Set<string>();
        }
        if (quizState[quizTemplateId] && quizState[quizTemplateId].currentQuestionUid) {
            const currentQuestionUid = quizState[quizTemplateId].currentQuestionUid;
            const currentQuestion = quizState[quizTemplateId].questions.find((q) => q.uid === currentQuestionUid);
            if (currentQuestion && quizState[quizTemplateId].askedQuestions) {
                quizState[quizTemplateId].askedQuestions.add(currentQuestion.uid);
            }
        }
    });

    // Update other event names and ensure handlers are adapted for quizTemplateId
    socket.on("quiz_template_dashboard_timer_action", (payload) => handleTimerAction(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_set_timer", (payload) => handleSetTimer(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_lock", (payload) => handleLock(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_unlock", (payload) => handleUnlock(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_end", (payload) => handleEnd(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_pause", (payload) => handlePause(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_resume", (payload) => handleResume(io, socket, prisma, payload)); // Renamed
    socket.on("quiz_template_dashboard_close_question", (payload) => handleCloseQuestion(io, socket, prisma, payload)); // Renamed

    // BACKWARD COMPATIBILITY: Support old event names during transition
    socket.on("quiz_timer_action", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_timer_action event, treating quizId as quizTemplateId`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleTimerAction(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_set_timer", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_set_timer event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleSetTimer(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_lock", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_lock event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleLock(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_unlock", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_unlock event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleUnlock(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_end", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_end event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleEnd(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_pause", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_pause event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handlePause(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_resume", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_resume event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleResume(io, socket, prisma, compatPayload);
    });
    socket.on("quiz_close_question", (payload) => {
        logger.info(`[COMPATIBILITY] Received legacy quiz_close_question event`);
        const compatPayload = { ...payload, quizTemplateId: payload.quizId };
        handleCloseQuestion(io, socket, prisma, compatPayload);
    });

    // Handle disconnections
    // handleDisconnecting might need to iterate through quizState using quizTemplateId
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma));

    // Get quiz template dashboard state
    socket.on("get_quiz_template_dashboard_state", async ({ quizTemplateId }) => { // Renamed event, use quizTemplateId
        logger.info(`[get_quiz_template_dashboard_state] Request for quizTemplateId=${quizTemplateId}`);
        if (!quizTemplateId) return;

        if (!quizState[quizTemplateId]) {
            logger.warn(`[get_quiz_template_dashboard_state] No state exists for quizTemplateId=${quizTemplateId}`);
            socket.emit("quiz_template_dashboard_state", { notFound: true }); // Renamed emitted event
            return;
        }

        // Patch state with calculated fields before sending
        // patchQuizStateForBroadcast might need adaptation for the new context
        const patchedState = patchQuizStateForBroadcast(quizState[quizTemplateId]);
        socket.emit("quiz_template_dashboard_state", patchedState); // Renamed emitted event
    });

    // BACKWARD COMPATIBILITY: Support old event name during transition
    socket.on("get_quiz_state", async ({ quizId }) => {
        logger.info(`[COMPATIBILITY] Received legacy get_quiz_state event for quizId=${quizId}`);
        const quizTemplateId = quizId; // Treat quizId as quizTemplateId

        if (!quizTemplateId) return;

        if (!quizState[quizTemplateId]) {
            logger.warn(`[get_quiz_state] No state exists for quizTemplateId=${quizTemplateId}`);
            socket.emit("quiz_state", { notFound: true }); // Using old event name for response
            return;
        }

        // Patch state with calculated fields before sending
        const patchedState = patchQuizStateForBroadcast(quizState[quizTemplateId]);
        socket.emit("quiz_state", patchedState); // Using old event name for response
    });
}

// Export renamed functions
export { ensureQuizTemplateDashboardStateInitialized, registerQuizTemplateDashboardEvents };
