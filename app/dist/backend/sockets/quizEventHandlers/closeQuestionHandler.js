"use strict";
/**
 * closeQuestionHandler.ts - Handles closing a quiz question, sending results, and locking further answers
 *
 * This handler processes the quiz_close_question event, which:
 * - Locks the question to prevent further answers
 * - Computes the correct answers
 * - Fetches the leaderboard
 * - Sends results to students, teacher, and projection screens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quizState_1 = require("../quizState");
const tournamentState_1 = require("../tournamentUtils/tournamentState");
const computeLeaderboard_1 = require("../tournamentUtils/computeLeaderboard");
// Import logger
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('CloseQuestionHandler');
// Debugging tournament state import
logger.debug(`[CloseQuestion] tournamentState imported: ${!!tournamentState_1.tournamentState}`);
logger.debug(`[CloseQuestion] tournamentState is empty object: ${Object.keys(tournamentState_1.tournamentState).length === 0}`);
function handleCloseQuestion(io, socket, { quizId, questionUid }) {
    logger.info(`[CloseQuestion] Received for quiz ${quizId}, question ${questionUid}`);
    const state = quizState_1.quizState[quizId];
    if (!state) {
        logger.warn(`[CloseQuestion] No quiz state for ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : état du quiz introuvable.'
        });
        return;
    }
    // Lock further answers for this question
    if (!state.lockedQuestions)
        state.lockedQuestions = {};
    state.lockedQuestions[questionUid] = true;
    // --- CRITICAL FIX: In quiz mode, ensure currentQuestionUid is set to the closed question ---
    if (!state.tournament_code) {
        state.currentQuestionUid = questionUid;
        logger.debug(`[CloseQuestionHandler] [QUIZ MODE] Set quizState[${quizId}].currentQuestionUid = ${questionUid} on close`);
    }
    // Find correct answers for the question
    const question = (state.questions || []).find(q => q.uid === questionUid);
    logger.debug('[CloseQuestion] Looking for questionUid:', questionUid);
    logger.debug('[CloseQuestion] Found question:', question);
    logger.debug('[CloseQuestion] Question reponses:', question === null || question === void 0 ? void 0 : question.reponses);
    const correctAnswers = question
        ? (question.reponses || []).map((r, idx) => r.correct ? idx : null).filter(idx => idx !== null)
        : [];
    logger.debug('[CloseQuestion] Computed correctAnswers:', correctAnswers);
    // Find the tournament code linked to this quiz
    let tournamentCode = state.tournament_code;
    if (!tournamentCode) {
        logger.error(`[CloseQuestion] No tournament_code found in quizState for quizId=${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : code du tournoi introuvable.'
        });
        return;
    }
    // --- Get leaderboard from tournamentState if available, using shared utility ---
    let leaderboard = [];
    let playerCount = 0; // Track number of players
    try {
        const tState = tournamentState_1.tournamentState[tournamentCode];
        if (tState && tState.participants) {
            // Convert Set<string> to Record<string, QuestionState> as required by computeLeaderboard
            const askedQuestionsRecord = {};
            tState.askedQuestions.forEach(uid => {
                // Find the question in questions array
                const question = tState.questions.find(q => q.uid === uid);
                if (question) {
                    // Convert boolean 'correct' to number[] if needed
                    let correctAnswers;
                    if (typeof question.correct === 'boolean') {
                        correctAnswers = question.correct ? [0] : [];
                    }
                    else {
                        correctAnswers = question.correct || [];
                    }
                    askedQuestionsRecord[uid] = {
                        uid,
                        totalTime: question.temps || 0,
                        correctAnswers
                    };
                }
            });
            const totalQuestions = tState.questions.length;
            leaderboard = (0, computeLeaderboard_1.computeLeaderboard)(tState, askedQuestionsRecord, totalQuestions);
            playerCount = leaderboard.length;
        }
        else {
            logger.warn(`[CloseQuestion] No tournamentState or participants for code ${tournamentCode}, falling back to manual leaderboard construction.`);
            // Manually construct a leaderboard since we can't pass QuizState to computeLeaderboard
            if (state.participants) {
                leaderboard = Object.values(state.participants).map(p => ({
                    id: p.id,
                    username: p.name || p.id,
                    score: p.score || 0
                }));
                playerCount = leaderboard.length;
            }
        }
    }
    catch (err) {
        logger.error(`[CloseQuestion] Error fetching leaderboard from tournamentState:`, err);
    }
    // Send each user their score, placement, correct answers, and player count (no full leaderboard)
    if (state.participants) {
        leaderboard.forEach((entry, idx) => {
            var _a;
            const socketId = (_a = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === entry.id)) === null || _a === void 0 ? void 0 : _a[0];
            if (socketId) {
                io.to(socketId).emit('quiz_question_results', {
                    score: entry.score,
                    placement: idx + 1,
                    correctAnswers,
                    playerCount,
                });
            }
        });
    }
    // Send to projector room (full leaderboard + player count)
    io.to(`projection_${quizId}`).emit('quiz_question_results', {
        leaderboard,
        correctAnswers,
        playerCount,
    });
    // Log sockets in projection and tournament rooms before emitting
    const projectionRoom = io.sockets.adapter.rooms.get(`projection_${quizId}`);
    const tournamentRoom = io.sockets.adapter.rooms.get(`live_${tournamentCode}`);
    logger.info(`[CloseQuestion] Sockets in projection_${quizId}:`, projectionRoom ? Array.from(projectionRoom) : []);
    logger.info(`[CloseQuestion] Sockets in live_${quizId}:`, tournamentRoom ? Array.from(tournamentRoom) : []);
    // Emit question closed event to all live tournament participants (students)
    logger.info(`[CloseQuestion] Emitting quiz_question_closed to live_${tournamentCode}`);
    io.to(`live_${tournamentCode}`).emit('quiz_question_closed', {
        questionUid,
        correctAnswers,
        leaderboard,
        playerCount,
    });
    logger.info(`[CloseQuestion] Emitting quiz_question_closed to projection_${quizId}`);
    io.to(`projection_${quizId}`).emit('quiz_question_closed', {
        questionUid,
        correctAnswers,
        leaderboard,
        playerCount,
    });
    logger.info(`[CloseQuestion] Results sent for quiz ${quizId}, question ${questionUid}`);
    // Emit success message after sending results
    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Question closed successfully.'
    });
}
// Using both export syntaxes for compatibility
exports.default = handleCloseQuestion;
module.exports = handleCloseQuestion;
