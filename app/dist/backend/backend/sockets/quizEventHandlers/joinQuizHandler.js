"use strict";
/**
 * joinQuizHandler.ts - Handler for joining a quiz
 *
 * This handler manages the process of a user joining a quiz session.
 * It initializes the quiz state if needed, loads questions, and handles
 * teacher/student/projector connections.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("../quizState");
const quizUtils_1 = require("../quizUtils");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('JoinQuizHandler');
/**
 * Handler for join_quiz event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma client for database operations
 * @param payload - Join quiz payload containing quizId, role and optional teacherId
 */
async function handleJoinQuiz(io, socket, prisma, { quizId, role, teacherId }) {
    var _a, _b;
    logger.info(`[DEBUG] handleJoinQuiz called for quizId=${quizId}, role=${role}, socket.id=${socket.id}`);
    socket.join(`dashboard_${quizId}`);
    logger.info(`Socket ${socket.id} joined room dashboard_${quizId} with role ${role}`);
    socket.emit("joined_room", {
        room: `dashboard_${quizId}`,
        socketId: socket.id,
        rooms: Array.from(socket.rooms),
    });
    // Initialize quiz state if it doesn't exist
    if (!quizState_1.quizState[quizId]) {
        quizState_1.quizState[quizId] = {
            currentQuestionUid: null, // Required by QuizState interface
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: (role === 'teacher') ? socket.id : null,
            profTeacherId: (role === 'teacher') ? teacherId : undefined,
            timerStatus: 'stop',
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set(),
            questionTimers: {}, // For per-question timers
        };
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
            if (quiz && quiz.questions_ids) {
                const orderedQuestions = [];
                const questionsData = await prisma.question.findMany({ where: { uid: { in: quiz.questions_ids } } });
                const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                quiz.questions_ids.forEach(uid => {
                    if (questionMap.has(uid)) {
                        // Map DB question fields to Question interface
                        const dbQuestion = questionMap.get(uid);
                        if (dbQuestion) {
                            const question = {
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
                                // Use reponses as the primary field (recommended)
                                reponses: Array.isArray(dbQuestion.reponses) ?
                                    dbQuestion.reponses.map((r) => ({ texte: r.texte, correct: r.correct })) :
                                    []
                            };
                            orderedQuestions.push(question);
                        }
                    }
                });
                quizState_1.quizState[quizId].questions = orderedQuestions;
                // Initialize questionTimers for all questions
                quizState_1.quizState[quizId].questionTimers = {};
                orderedQuestions.forEach(q => {
                    if (q && q.uid) {
                        quizState_1.quizState[quizId].questionTimers[q.uid] = {
                            status: 'stop',
                            timeLeft: q.temps || 20,
                            initialTime: q.temps || 20,
                            timestamp: null
                        };
                    }
                });
                logger.info(`Loaded ${orderedQuestions.length} questions for quiz ${quizId}`);
                // Set default currentQuestionUid and currentQuestionIdx if not set and questions exist
                if (quizState_1.quizState[quizId].questions &&
                    quizState_1.quizState[quizId].questions.length > 0 &&
                    !quizState_1.quizState[quizId].currentQuestionUid) {
                    quizState_1.quizState[quizId].currentQuestionUid = quizState_1.quizState[quizId].questions[0].uid;
                    quizState_1.quizState[quizId].currentQuestionIdx = 0;
                    logger.info(`[JoinQuiz] Set default currentQuestionUid to ${quizState_1.quizState[quizId].currentQuestionUid} for quiz ${quizId}`);
                }
            }
        }
        catch (e) {
            logger.error(`Error loading quiz ${quizId} questions:`, e);
        }
    }
    // PATCH: If timer edits exist in questionTimers, apply them to the question objects (only if not first init)
    if (((_a = quizState_1.quizState[quizId]) === null || _a === void 0 ? void 0 : _a.questionTimers) && Object.keys(((_b = quizState_1.quizState[quizId]) === null || _b === void 0 ? void 0 : _b.questionTimers) || {}).length > 0) {
        const orderedQuestions = quizState_1.quizState[quizId].questions;
        orderedQuestions.forEach(q => {
            var _a, _b;
            const timers = ((_a = quizState_1.quizState[quizId]) === null || _a === void 0 ? void 0 : _a.questionTimers) || {};
            if (q && q.uid &&
                timers[q.uid] &&
                typeof ((_b = timers[q.uid]) === null || _b === void 0 ? void 0 : _b.initialTime) === 'number') {
                q.temps = timers[q.uid].initialTime;
            }
        });
    }
    // Always update profTeacherId and profSocketId when the teacher dashboard joins
    if (role === 'teacher') {
        quizState_1.quizState[quizId].profSocketId = socket.id;
        if (teacherId)
            quizState_1.quizState[quizId].profTeacherId = teacherId;
        logger.info(`Updated professor socket ID and teacherId for quiz ${quizId}`);
    }
    // Always ensure tournament_code is set in quizState
    if (!quizState_1.quizState[quizId].tournament_code) {
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
            if (quiz && quiz.tournament_code) {
                quizState_1.quizState[quizId].tournament_code = quiz.tournament_code;
                logger.info(`[JoinQuiz] Set tournament_code for quizId=${quizId}: ${quiz.tournament_code}`);
            }
            else {
                logger.warn(`[JoinQuiz] No tournament_code found in DB for quizId=${quizId}`);
            }
        }
        catch (e) {
            logger.error(`[JoinQuiz] Error fetching tournament_code for quizId=${quizId}:`, e);
        }
    }
    // --- Add socket to the list of connected sockets ---
    if (!quizState_1.quizState[quizId].connectedSockets)
        quizState_1.quizState[quizId].connectedSockets = new Set();
    quizState_1.quizState[quizId].connectedSockets.add(socket.id);
    logger.info(`[QUIZ_CONNECTED] Ajout socket ${socket.id} à quiz ${quizId}. Sockets connectés:`, Array.from(quizState_1.quizState[quizId].connectedSockets));
    // Emit the number of connected users
    // --- Calculate total connected (lobby + live) ---
    let code = null;
    if (quizState_1.quizState[quizId] && quizState_1.quizState[quizId].tournament_code) {
        code = quizState_1.quizState[quizId].tournament_code;
    }
    else {
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
            if (quiz && quiz.tournament_code)
                code = quiz.tournament_code;
        }
        catch (e) {
            logger.error('Erreur récupération code tournoi', e);
        }
    }
    if (code)
        await (0, quizUtils_1.emitQuizConnectedCount)(io, prisma, code);
    else
        logger.warn(`[QUIZ_CONNECTED] Aucun code tournoi trouvé pour quizId=${quizId}`);
    if (!quizState_1.quizState[quizId].id) {
        quizState_1.quizState[quizId].id = quizId;
    }
    socket.emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
}
exports.default = handleJoinQuiz;
