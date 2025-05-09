const createLogger = require('../../logger');
const logger = createLogger('JoinQuizHandler');
const { quizState } = require('../quizState');
const prisma = require('../../db'); // Ensure prisma is required
const { emitQuizConnectedCount, patchQuizStateForBroadcast } = require('../quizUtils');

async function handleJoinQuiz(io, socket, prisma, { quizId, role, teacherId }) {
    logger.info(`[DEBUG] handleJoinQuiz called for quizId=${quizId}, role=${role}, socket.id=${socket.id}`);
    socket.join(`dashboard_${quizId}`);
    logger.info(`Socket ${socket.id} joined room dashboard_${quizId} with role ${role}`);
    socket.emit("joined_room", {
        room: `dashboard_${quizId}`,
        socketId: socket.id,
        rooms: Array.from(socket.rooms),
    });

    if (!quizState[quizId]) {
        quizState[quizId] = {
            currentQuestionIdx: null,
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: role === 'prof' ? socket.id : null,
            profTeacherId: (role === 'teacher' || role === 'prof') ? teacherId : null,
            timerStatus: null,
            timerQuestionId: null,
            timerTimeLeft: null,
            timerTimestamp: null,
            connectedSockets: new Set(),
            questionTimers: {}, // <-- Add this for per-question timers
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
                // Initialize questionTimers for all questions
                quizState[quizId].questionTimers = {};
                orderedQuestions.forEach(q => {
                    quizState[quizId].questionTimers[q.uid] = {
                        status: 'stop',
                        timeLeft: q.temps || 20,
                        initialTime: q.temps || 20,
                        timestamp: null
                    };
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
    if (Object.keys(quizState[quizId].questionTimers).length > 0) {
        const orderedQuestions = quizState[quizId].questions;
        orderedQuestions.forEach(q => {
            if (
                quizState[quizId].questionTimers[q.uid] &&
                typeof quizState[quizId].questionTimers[q.uid].initialTime === 'number'
            ) {
                q.temps = quizState[quizId].questionTimers[q.uid].initialTime;
            }
        });
    }

    // Always update profTeacherId and profSocketId when the teacher dashboard joins
    if (role === 'prof' || role === 'teacher') {
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

    // --- Ajout du socket à la liste des connectés ---
    if (!quizState[quizId].connectedSockets) quizState[quizId].connectedSockets = new Set();
    quizState[quizId].connectedSockets.add(socket.id);
    logger.info(`[QUIZ_CONNECTED] Ajout socket ${socket.id} à quiz ${quizId}. Sockets connectés:`, Array.from(quizState[quizId].connectedSockets));
    // Émettre le nombre de connectés
    // --- Calcul du nombre total de connectés (lobby + live) ---
    let code = null;
    if (quizState[quizId] && quizState[quizId].tournament_code) {
        code = quizState[quizId].tournament_code;
    } else {
        try {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { tournament_code: true } });
            if (quiz && quiz.tournament_code) code = quiz.tournament_code;
        } catch (e) { logger.error('Erreur récupération code tournoi', e); }
    }
    if (code) await emitQuizConnectedCount(io, prisma, code);
    else logger.warn(`[QUIZ_CONNECTED] Aucun code tournoi trouvé pour quizId=${quizId}`);

    if (!quizState[quizId].id) {
        quizState[quizId].id = quizId;
    }

    socket.emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
}

module.exports = handleJoinQuiz;
