const createLogger = require('../../logger');
const logger = createLogger('SetQuestionHandler');
const quizState = require('../quizState');
const { tournamentState, triggerTournamentQuestion } = require('../tournamentHandler');
const prisma = require('../../db'); // Ensure prisma is required

async function handleSetQuestion(io, socket, prisma, { quizId, questionIdx, chrono, code }) {
    if (!quizState[quizId] || quizState[quizId].profSocketId !== socket.id) {
        logger.warn(`Unauthorized access to set question for quiz ${quizId} from socket ${socket.id}`);
        return;
    }

    logger.info(`Setting question ${questionIdx} for quiz ${quizId}, chrono: ${chrono}, tournament code: ${code || 'none'}`);
    quizState[quizId].currentQuestionIdx = questionIdx;
    quizState[quizId].locked = false;
    quizState[quizId].ended = false;
    quizState[quizId].chrono = typeof chrono === 'number' ? { timeLeft: chrono, running: true } : { timeLeft: null, running: false };

    // Update timer action fields for consistency
    quizState[quizId].timerQuestionId = quizState[quizId].questions[questionIdx]?.uid; // Store UID
    quizState[quizId].timerTimeLeft = typeof chrono === 'number' ? chrono : null;
    quizState[quizId].timerStatus = typeof chrono === 'number' ? 'play' : null; // Assume play if time is set
    quizState[quizId].timerTimestamp = Date.now();

    io.to(`quiz_${quizId}`).emit("quiz_state", quizState[quizId]);

    if (code) {
        if (!tournamentState[code]) {
            logger.info(`Initializing tournament state for code=${code}`);
            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
            if (!tournoi) {
                logger.error(`Tournament ${code} not found for quiz ${quizId}`);
                return;
            }
            const questions = await prisma.question.findMany({
                where: { uid: { in: tournoi.questions_ids } },
                orderBy: [{ niveau: 'asc' }, { theme: 'asc' }],
            });
            tournamentState[code] = {
                participants: {},
                questions,
                currentIndex: questionIdx,
                started: true,
                answers: {},
                timer: null,
                questionStart: null,
                socketToJoueur: {},
                paused: false,
                pausedRemainingTime: null,
                linkedQuizId: quizId,
                currentQuestionDuration: typeof chrono === 'number' ? chrono : null, // Initialize duration
                stopped: false,
            };
            // Emit immediate redirect for quiz-linked tournaments
            io.to(code).emit("redirect_to_tournament", { code });
            logger.debug(`Emitted redirect_to_tournament to lobby room ${code}`);
        } else {
            tournamentState[code].linkedQuizId = quizId; // Ensure always set
            tournamentState[code].currentIndex = questionIdx;
            tournamentState[code].currentQuestionDuration = typeof chrono === 'number' ? chrono : null; // Update duration
            tournamentState[code].stopped = false; // Reset stopped state
            tournamentState[code].paused = false; // Ensure not paused
            tournamentState[code].questionStart = Date.now(); // Reset start time
        }

        // *** Pass chrono value if it's a number ***
        const initialTime = typeof chrono === 'number' ? chrono : null;
        triggerTournamentQuestion(io, code, questionIdx, quizId, initialTime); // Pass initialTime
    }
}

module.exports = handleSetQuestion;
