const handleJoinQuiz = (io, socket, prisma, quizState, logger) => async ({ quizId, role }) => {
    socket.join(`quiz_${quizId}`);
    logger.info(`Socket ${socket.id} joined room quiz_${quizId} with role ${role}`);
    socket.emit("joined_room", {
        room: `quiz_${quizId}`,
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
                logger.info(`Loaded ${orderedQuestions.length} questions for quiz ${quizId}`);
            }
        } catch (e) {
            logger.error(`Error loading quiz ${quizId} questions:`, e);
        }
    } else if (role === 'prof') {
        quizState[quizId].profSocketId = socket.id;
        logger.info(`Updated professor socket ID for quiz ${quizId}`);
    }

    socket.emit("quiz_state", quizState[quizId]);
};

module.exports = handleJoinQuiz;
