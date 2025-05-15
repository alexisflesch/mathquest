/**
 * joinQuizTemplateDashboardHandler.ts - Handler for a teacher joining a quiz template dashboard.
 *
 * This handler manages a teacher connecting to view and potentially prepare a QuizTemplate.
 * It loads the template's questions and initializes a state for dashboard operations.
 * This is distinct from players joining a live GameInstance.
 */

import { Server, Socket } from 'socket.io';
// Use PrismaClient from the shared output directory
import { PrismaClient, Question as PrismaQuestion, QuizTemplate, QuestionsInQuizTemplate } from '../../../shared/prisma-client';
import { JoinQuizTemplateDashboardPayload } from '../types/socketTypes';
import { quizState } from '../quizState';
import { QuizState, Question as LocalQuestion, QuestionOptionAnswer } from '../types/quizTypes';
import { patchQuizStateForBroadcast } from '../quizUtils';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('JoinQuizTemplateDashboardHandler');

/**
 * Handler for join_quiz_template_dashboard event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma client for database operations
 * @param payload - Payload containing quizTemplateId and teacherId
 */
async function handleJoinQuizTemplateDashboard(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizTemplateId, teacherId }: JoinQuizTemplateDashboardPayload
): Promise<void> {
    logger.info(`[DEBUG] handleJoinQuizTemplateDashboard called for quizTemplateId=${quizTemplateId}, teacherId=${teacherId}, socket.id=${socket.id}`);

    let currentQuizTemplate: (
        QuizTemplate &
        { questions: (QuestionsInQuizTemplate & { question: PrismaQuestion })[] }
    ) | null = null;

    try {
        currentQuizTemplate = await prisma.quizTemplate.findUnique({
            where: { id: quizTemplateId },
            include: {
                questions: { // Relation to QuestionsInQuizTemplate
                    include: {
                        question: true // Include the actual Question model
                    },
                    orderBy: {
                        sequence: 'asc'
                    }
                }
            }
        });
    } catch (e) {
        logger.error(`Error fetching QuizTemplate ${quizTemplateId}:`, e);
        socket.emit("dashboard_error", { message: "Erreur lors du chargement du modèle de quiz." });
        return;
    }

    if (!currentQuizTemplate) {
        logger.warn(`QuizTemplate not found for id: ${quizTemplateId}`);
        socket.emit("dashboard_error", { message: "Modèle de quiz non trouvé." });
        return;
    }

    if (currentQuizTemplate.creatorTeacherId !== teacherId) {
        logger.warn(`Unauthorized attempt to access QuizTemplate ${quizTemplateId} by teacher ${teacherId}. Owner is ${currentQuizTemplate.creatorTeacherId}.`);
        socket.emit("dashboard_error", { message: "Accès non autorisé à ce modèle de quiz." });
        return;
    }

    const roomName = `quiz_template_dashboard_${quizTemplateId}`;
    socket.join(roomName);
    logger.info(`Socket ${socket.id} joined room ${roomName} for QuizTemplate ${quizTemplateId}`);
    socket.emit("joined_room", {
        room: roomName,
        socketId: socket.id,
        rooms: Array.from(socket.rooms),
    });

    // Ensure quizState for the templateId exists and initialize if not
    if (!quizState[quizTemplateId]) {
        quizState[quizTemplateId] = {
            id: quizTemplateId,
            currentQuestionUid: null,
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            profTeacherId: teacherId,
            timerStatus: 'stop',
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set<string>(), // Initialize connectedSockets here
            questionTimers: {},
        } as QuizState;
    } else {
        // If state already exists, update teacher info
        quizState[quizTemplateId].profSocketId = socket.id;
        quizState[quizTemplateId].profTeacherId = teacherId;
        // Explicitly ensure connectedSockets is initialized if it somehow wasn't (e.g. older state structure)
        if (!quizState[quizTemplateId].connectedSockets) {
            quizState[quizTemplateId].connectedSockets = new Set<string>();
        }
    }

    // At this point, quizState[quizTemplateId] is defined.
    // And quizState[quizTemplateId].connectedSockets is also now guaranteed to be defined.
    const currentDashboardState = quizState[quizTemplateId]; // No need for non-null assertion if the above logic is sound

    // Defensive check directly on connectedSockets before use, if QuizState type still has it as optional
    if (!currentDashboardState.connectedSockets) {
        currentDashboardState.connectedSockets = new Set<string>();
    }

    currentDashboardState.connectedSockets.add(socket.id);
    logger.info(`[DASHBOARD_CONN] Socket ${socket.id} added to QuizTemplate ${quizTemplateId}. Connected:`, Array.from(currentDashboardState.connectedSockets));

    const localQuestions: LocalQuestion[] = currentQuizTemplate.questions.map(qtq => {
        const pq = qtq.question;
        let parsedResponses: QuestionOptionAnswer[] = [];
        try {
            if (pq.responses && Array.isArray(pq.responses)) {
                parsedResponses = pq.responses.map((r: any) => ({
                    text: r.text || r.texte || '',
                    correct: typeof r.correct === 'boolean' ? r.correct : false
                })) as QuestionOptionAnswer[];
            } else if (typeof pq.responses === 'string') {
                const parsedJson = JSON.parse(pq.responses);
                if (Array.isArray(parsedJson)) {
                    parsedResponses = parsedJson.map((r: any) => ({
                        text: r.text || r.texte || '',
                        correct: typeof r.correct === 'boolean' ? r.correct : false
                    })) as QuestionOptionAnswer[];
                }
            }
        } catch (e) {
            logger.error(`Error parsing responses for question ${pq.uid} in template ${quizTemplateId}:`, pq.responses, e);
        }

        return {
            uid: pq.uid,
            text: pq.text || '',
            type: pq.questionType,
            answers: parsedResponses,
            time: pq.timeLimit || 20,
            explanation: pq.explanation || undefined,
            tags: pq.tags || [],
            themes: pq.themes || [],
            difficulty: pq.difficulty || undefined,
            gradeLevel: pq.gradeLevel || undefined,
            discipline: pq.discipline || undefined,
            title: pq.title || undefined,
            hidden: pq.isHidden || false,
        };
    });

    quizState[quizTemplateId].questions = localQuestions;
    quizState[quizTemplateId].questionTimers = {};
    localQuestions.forEach(q => {
        if (q && q.uid) {
            quizState[quizTemplateId].questionTimers![q.uid] = {
                status: 'stop',
                timeLeft: q.time || 20,
                initialTime: q.time || 20,
                timestamp: null
            };
        }
    });
    logger.info(`Loaded ${localQuestions.length} questions for QuizTemplate ${quizTemplateId} dashboard.`);

    if (
        quizState[quizTemplateId].questions.length > 0 &&
        !quizState[quizTemplateId].currentQuestionUid
    ) {
        quizState[quizTemplateId].currentQuestionUid = quizState[quizTemplateId].questions[0].uid;
        quizState[quizTemplateId].currentQuestionIdx = 0;
        logger.info(`[JoinQuizTemplateDashboard] Set default currentQuestionUid to ${quizState[quizTemplateId].currentQuestionUid} for template ${quizTemplateId}`);
    }

    socket.emit("quiz_template_dashboard_state", patchQuizStateForBroadcast(quizState[quizTemplateId]));
    logger.info(`Emitted quiz_template_dashboard_state for ${quizTemplateId} to socket ${socket.id}`);

    socket.on('disconnect', () => {
        if (quizState[quizTemplateId] && quizState[quizTemplateId].connectedSockets) {
            quizState[quizTemplateId].connectedSockets.delete(socket.id);
            logger.info(`[DASHBOARD_CONN] Socket ${socket.id} removed from QuizTemplate ${quizTemplateId}. Connected:`, Array.from(quizState[quizTemplateId].connectedSockets));
            if (quizState[quizTemplateId].profSocketId === socket.id) {
                logger.info(`Teacher socket ${socket.id} disconnected from QuizTemplate ${quizTemplateId} dashboard.`);
            }
            if (quizState[quizTemplateId].connectedSockets.size === 0) {
                logger.info(`No more sockets connected to QuizTemplate ${quizTemplateId} dashboard. State can be cleaned up if desired.`);
                // delete quizState[quizTemplateId]; // Optional: cleanup state
            }
        }
    });
}

export default handleJoinQuizTemplateDashboard;
