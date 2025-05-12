/**
 * joinQuizHandler.ts - Handler for joining a quiz
 * 
 * This handler manages the process of a user joining a quiz session.
 * It initializes the quiz state if needed, loads questions, and handles
 * teacher/student/projector connections.
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { JoinQuizPayload } from '../types/socketTypes';
import { quizState } from '../quizState.js';
import { QuizState, Question, QuestionTimer } from '../types/quizTypes';

// Import from legacy file for consistency during transition
const { emitQuizConnectedCount, patchQuizStateForBroadcast } = require('../quizUtils.legacy.js');

// Import logger using require until logger module is converted to TypeScript
const createLogger = require('../../logger');
const logger = createLogger('JoinQuizHandler');

/**
 * Handler for join_quiz event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma client for database operations
 * @param payload - Join quiz payload containing quizId, role and optional teacherId
 */
async function handleJoinQuiz(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    { quizId, role, teacherId }: JoinQuizPayload
): Promise<void> {
    logger.info(`[DEBUG] handleJoinQuiz called for quizId=${quizId}, role=${role}, socket.id=${socket.id}`);
    socket.join(`dashboard_${quizId}`);
    logger.info(`Socket ${socket.id} joined room dashboard_${quizId} with role ${role}`);
    socket.emit("joined_room", {
        room: `dashboard_${quizId}`,
        socketId: socket.id,
        rooms: Array.from(socket.rooms),
    });

    // Initialize quiz state if it doesn't exist
    if (!quizState[quizId]) {
        quizState[quizId] = {
            currentQuestionUid: null, // Required by QuizState interface
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: (role === 'teacher') ? socket.id : null,
            profTeacherId: (role === 'teacher') ? teacherId : undefined,
            timerStatus: 'stop' as 'play' | 'pause' | 'stop',
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set<string>(),
            questionTimers: {}, // For per-question timers
        } as QuizState;

        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
            if (quiz && quiz.questions_ids) {
                const orderedQuestions: Question[] = [];
                const questionsData = await prisma.question.findMany({ where: { uid: { in: quiz.questions_ids } } });
                const questionMap = new Map(questionsData.map(q => [q.uid, q]));

                quiz.questions_ids.forEach(uid => {
                    if (questionMap.has(uid)) {
                        // Map DB question fields to Question interface
                        const dbQuestion = questionMap.get(uid);
                        if (dbQuestion) {
                            const question: Question = {
                                uid: dbQuestion.uid,
                                texte: dbQuestion.question || '', // Map question to texte field
                                type: dbQuestion.type,
                                temps: dbQuestion.temps || undefined,
                                theme: dbQuestion.theme,
                                difficulte: dbQuestion.difficulte || undefined,
                                niveau: dbQuestion.niveau || undefined,
                                discipline: dbQuestion.discipline,
                                explication: dbQuestion.explication || undefined,
                                hidden: dbQuestion.hidden || undefined,
                                // Map reponses to answers if needed
                                answers: Array.isArray(dbQuestion.reponses) ?
                                    dbQuestion.reponses.map((r: any) => ({ texte: r.texte, correct: r.correct })) :
                                    []
                            };
                            orderedQuestions.push(question);
                        }
                    }
                });

                quizState[quizId].questions = orderedQuestions;

                // Initialize questionTimers for all questions
                quizState[quizId].questionTimers = {};
                orderedQuestions.forEach(q => {
                    if (q && q.uid) {
                        quizState[quizId].questionTimers![q.uid] = {
                            status: 'stop',
                            timeLeft: q.temps || 20,
                            initialTime: q.temps || 20,
                            timestamp: null
                        };
                    }
                });

                logger.info(`Loaded ${orderedQuestions.length} questions for quiz ${quizId}`);

                // Set default currentQuestionUid and currentQuestionIdx if not set and questions exist
                if (
                    quizState[quizId].questions &&
                    quizState[quizId].questions.length > 0 &&
                    !quizState[quizId].currentQuestionUid
                ) {
                    quizState[quizId].currentQuestionUid = quizState[quizId].questions[0].uid;
                    quizState[quizId].currentQuestionIdx = 0;
                    logger.info(`[JoinQuiz] Set default currentQuestionUid to ${quizState[quizId].currentQuestionUid} for quiz ${quizId}`);
                }
            }
        } catch (e) {
            logger.error(`Error loading quiz ${quizId} questions:`, e);
        }
    }

    // PATCH: If timer edits exist in questionTimers, apply them to the question objects (only if not first init)
    if (quizState[quizId]?.questionTimers && Object.keys(quizState[quizId]?.questionTimers || {}).length > 0) {
        const orderedQuestions = quizState[quizId].questions;
        orderedQuestions.forEach(q => {
            const timers = quizState[quizId]?.questionTimers || {};
            if (
                q && q.uid &&
                timers[q.uid] &&
                typeof timers[q.uid]?.initialTime === 'number'
            ) {
                q.temps = timers[q.uid].initialTime;
            }
        });
    }

    // Always update profTeacherId and profSocketId when the teacher dashboard joins
    if (role === 'teacher') {
        quizState[quizId].profSocketId = socket.id;
        if (teacherId) quizState[quizId].profTeacherId = teacherId;
        logger.info(`Updated professor socket ID and teacherId for quiz ${quizId}`);
    }

    // Always ensure tournament_code is set in quizState
    if (!quizState[quizId].tournament_code) {
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
            if (quiz && quiz.tournament_code) {
                quizState[quizId].tournament_code = quiz.tournament_code;
                logger.info(`[JoinQuiz] Set tournament_code for quizId=${quizId}: ${quiz.tournament_code}`);
            } else {
                logger.warn(`[JoinQuiz] No tournament_code found in DB for quizId=${quizId}`);
            }
        } catch (e) {
            logger.error(`[JoinQuiz] Error fetching tournament_code for quizId=${quizId}:`, e);
        }
    }

    // --- Add socket to the list of connected sockets ---
    if (!quizState[quizId].connectedSockets) quizState[quizId].connectedSockets = new Set();
    quizState[quizId].connectedSockets.add(socket.id);
    logger.info(`[QUIZ_CONNECTED] Ajout socket ${socket.id} à quiz ${quizId}. Sockets connectés:`, Array.from(quizState[quizId].connectedSockets));

    // Emit the number of connected users
    // --- Calculate total connected (lobby + live) ---
    let code: string | null = null;
    if (quizState[quizId] && quizState[quizId].tournament_code) {
        code = quizState[quizId].tournament_code;
    } else {
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
            if (quiz && quiz.tournament_code) code = quiz.tournament_code;
        } catch (e) {
            logger.error('Erreur récupération code tournoi', e);
        }
    }

    if (code) await emitQuizConnectedCount(io, prisma, code);
    else logger.warn(`[QUIZ_CONNECTED] Aucun code tournoi trouvé pour quizId=${quizId}`);

    if (!quizState[quizId].id) {
        quizState[quizId].id = quizId;
    }

    socket.emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
}

export default handleJoinQuiz;
