"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("../quizState");
const tournamentState_1 = require("../tournamentUtils/tournamentState");
const quizUtils_1 = require("../quizUtils");
const tournamentTriggers_1 = require("../tournamentUtils/tournamentTriggers");
const quizTriggers_1 = require("../quizTriggers");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('PauseQuizHandler');
// Helper function to log sockets in a room
async function logSocketsInRoom(io, quizId) {
    const socketsInRoom = await io.in(`dashboard_${quizId}`).fetchSockets();
    logger.debug(`[PauseQuiz] Sockets in room dashboard_${quizId}:`, socketsInRoom.map(socket => socket.id));
}
async function handlePause(io, socket, prisma, { quizId, teacherId, tournamentCode }) {
    if (!quizState_1.quizState[quizId] || quizState_1.quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        prisma.quiz.findUnique({ where: { id: quizId }, select: { enseignant_id: true } }).then(async (quiz) => {
            if (!quiz || quiz.enseignant_id !== teacherId) {
                logger.warn(`[PauseQuiz] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
                io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                    status: 'error',
                    message: 'Erreur : accès non autorisé.'
                });
                return;
            }
            // Log all sockets in the room before emitting the event
            await logSocketsInRoom(io, quizId);
            // Emit success message after pausing the quiz
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'success',
                message: 'Quiz mis en pause.'
            });
            logger.info(`[PauseQuiz] Emitting quiz_action_response to dashboard_${quizId}`);
            // Update in-memory state for future requests
            quizState_1.quizState[quizId].profTeacherId = teacherId;
            // Update profSocketId to current socket
            quizState_1.quizState[quizId].profSocketId = socket.id;
            logger.info(`[PauseQuiz] Pausing quiz ${quizId}`);
            // Get the tournament code if not provided
            const code = tournamentCode || Object.keys(tournamentState_1.tournamentState).find(c => tournamentState_1.tournamentState[c] && tournamentState_1.tournamentState[c].linkedQuizId === quizId);
            // Synchronize timer values between quiz and tournament states
            let remaining = null;
            if (code) {
                // Calculate remaining time first
                remaining = (0, quizUtils_1.calculateRemainingTime)(quizState_1.quizState[quizId].chrono, quizState_1.quizState[quizId].timerTimestamp);
                // Then synchronize the values
                (0, quizUtils_1.synchronizeTimerValues)(quizId, code, remaining);
                logger.info(`[PauseQuiz] Synchronized with tournament ${code}, timeLeft=${remaining}s`);
            }
            else {
                remaining = (0, quizUtils_1.calculateRemainingTime)(quizState_1.quizState[quizId].chrono, quizState_1.quizState[quizId].timerTimestamp);
                logger.info(`[PauseQuiz] No tournament linked, calculated timeLeft=${remaining}s`);
            }
            // Update quiz state flags
            quizState_1.quizState[quizId].chrono.timeLeft = remaining; // Update quiz state remaining time
            quizState_1.quizState[quizId].chrono.running = false;
            // Mark this quiz as explicitly handled by pauseHandler to avoid duplicate processing
            quizState_1.quizState[quizId].pauseHandled = Date.now();
            // First emit the quiz_state (with updated values) to clients
            io.to(`dashboard_${quizId}`).emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
            io.to(`projection_${quizId}`).emit("quiz_state", quizState_1.quizState[quizId]);
            // Then emit the timer update separately for precise timing
            const currentQuestionUid = quizState_1.quizState[quizId].timerQuestionId || quizState_1.quizState[quizId].currentQuestionUid;
            // Ensure currentQuestionUid is not null
            if (currentQuestionUid) {
                (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'pause', currentQuestionUid, remaining);
            }
            else {
                logger.warn(`[PauseQuiz] Missing currentQuestionUid for quiz ${quizId}`);
                (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'pause', '', remaining);
            }
            logger.debug(`[PauseQuiz] Emitted quiz_state and timer update for ${quizId}`);
            // Use tournamentCode from payload if present, else fallback
            if (code) {
                logger.info(`[PauseQuiz] Triggering pause for linked tournament ${code} with remaining time ${remaining}s`);
                (0, tournamentTriggers_1.triggerTournamentTimerSet)(io, code, remaining, 'paused'); // MODIFIED
            }
            else {
                logger.warn(`[PauseQuiz] No linked tournament found for quiz ${quizId}`);
            }
        });
        return;
    }
    // Log all sockets in the room before emitting the event
    await logSocketsInRoom(io, quizId);
    // Emit success message after pausing the quiz
    logger.debug(`[PauseQuiz] Emitting quiz_action_response payload:`, {
        status: 'success',
        message: 'Quiz paused successfully.'
    });
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Quiz paused successfully.'
    });
    logger.info(`[PauseQuiz] Emitting quiz_action_response to dashboard_${quizId}`);
    // Update profSocketId to current socket
    quizState_1.quizState[quizId].profSocketId = socket.id;
    logger.info(`[PauseQuiz] Pausing quiz ${quizId}`);
    // Get the tournament code if not provided
    const code = tournamentCode || Object.keys(tournamentState_1.tournamentState).find(c => tournamentState_1.tournamentState[c] && tournamentState_1.tournamentState[c].linkedQuizId === quizId);
    // Synchronize timer values between quiz and tournament states
    let remaining = null;
    if (code) {
        // Calculate remaining time first
        remaining = (0, quizUtils_1.calculateRemainingTime)(quizState_1.quizState[quizId].chrono, quizState_1.quizState[quizId].timerTimestamp);
        // Then synchronize the values
        (0, quizUtils_1.synchronizeTimerValues)(quizId, code, remaining);
        logger.info(`[PauseQuiz] Synchronized with tournament ${code}, timeLeft=${remaining}s`);
    }
    else {
        remaining = (0, quizUtils_1.calculateRemainingTime)(quizState_1.quizState[quizId].chrono, quizState_1.quizState[quizId].timerTimestamp);
        logger.info(`[PauseQuiz] No tournament linked, calculated timeLeft=${remaining}s`);
    }
    // Update quiz state flags
    quizState_1.quizState[quizId].chrono.timeLeft = remaining; // Update quiz state remaining time
    quizState_1.quizState[quizId].chrono.running = false;
    // Mark this quiz as explicitly handled by pauseHandler to avoid duplicate processing
    quizState_1.quizState[quizId].pauseHandled = Date.now();
    // First emit the quiz_state (with updated values) to clients
    io.to(`dashboard_${quizId}`).emit("quiz_state", (0, quizUtils_1.patchQuizStateForBroadcast)(quizState_1.quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState_1.quizState[quizId]);
    // Then emit the timer update separately for precise timing
    const currentQuestionUid = quizState_1.quizState[quizId].timerQuestionId || quizState_1.quizState[quizId].currentQuestionUid;
    // Ensure currentQuestionUid is not null
    if (currentQuestionUid) {
        (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'pause', currentQuestionUid, remaining);
    }
    else {
        logger.warn(`[PauseQuiz] Missing currentQuestionUid for quiz ${quizId}`);
        (0, quizUtils_1.emitQuizTimerUpdate)(io, quizId, 'pause', '', remaining);
    }
    // Pause only the current question's timer in quiz mode
    if (currentQuestionUid !== null) {
        (0, quizTriggers_1.triggerQuizTimerAction)(io, quizId, currentQuestionUid, 'pause');
        logger.info(`[PauseQuiz] Paused timer for quizId=${quizId}, questionId=${currentQuestionUid}`);
    }
    logger.debug(`[PauseQuiz] Emitted quiz_state and timer update for ${quizId}`);
    // Use tournamentCode from payload if present, else fallback
    if (code) {
        logger.info(`[PauseQuiz] Triggering pause for linked tournament ${code} with remaining time ${remaining}s`);
        (0, tournamentTriggers_1.triggerTournamentTimerSet)(io, code, remaining, 'paused'); // MODIFIED
    }
    else {
        logger.warn(`[PauseQuiz] No linked tournament found for quiz ${quizId}`);
    }
}
exports.default = handlePause;
