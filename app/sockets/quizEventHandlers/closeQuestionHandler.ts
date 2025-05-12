/**
 * closeQuestionHandler.ts - Handles closing a quiz question, sending results, and locking further answers
 * 
 * This handler processes the quiz_close_question event, which:
 * - Locks the question to prevent further answers
 * - Computes the correct answers
 * - Fetches the leaderboard
 * - Sends results to students, teacher, and projection screens
 */

import { Server, Socket } from 'socket.io';
import { CloseQuestionPayload } from '../types/socketTypes';
import { quizState } from '../quizState';
import { tournamentState } from '../tournamentUtils/tournamentState';
import { computeLeaderboard } from '../tournamentUtils/computeLeaderboard';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('CloseQuestionHandler');

// Debugging tournament state import
logger.debug(`[CloseQuestion] tournamentState imported: ${!!tournamentState}`);
logger.debug(`[CloseQuestion] tournamentState is empty object: ${Object.keys(tournamentState).length === 0}`);

interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
    [key: string]: any;
}

function handleCloseQuestion(
    io: Server,
    socket: Socket,
    { quizId, questionUid }: CloseQuestionPayload
): void {
    logger.info(`[CloseQuestion] Received for quiz ${quizId}, question ${questionUid}`);

    const state = quizState[quizId];
    if (!state) {
        logger.warn(`[CloseQuestion] No quiz state for ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : état du quiz introuvable.'
        });
        return;
    }

    // Lock further answers for this question
    if (!state.lockedQuestions) state.lockedQuestions = {};
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
    logger.debug('[CloseQuestion] Question reponses:', question?.reponses);

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
    let leaderboard: LeaderboardEntry[] = [];
    let playerCount = 0; // Track number of players
    try {
        const tState = tournamentState[tournamentCode];
        if (tState && tState.participants) {
            const askedQuestions = tState.askedQuestions || new Set();
            const totalQuestions = tState.questions.length;
            leaderboard = computeLeaderboard(tState, askedQuestions, totalQuestions);
            playerCount = leaderboard.length;
        } else {
            logger.warn(`[CloseQuestion] No tournamentState or participants for code ${tournamentCode}, falling back to quizState leaderboard.`);
            leaderboard = computeLeaderboard(state); // fallback: use quizState participants
            playerCount = leaderboard.length;
        }
    } catch (err) {
        logger.error(`[CloseQuestion] Error fetching leaderboard from tournamentState:`, err);
    }

    // Send each user their score, placement, correct answers, and player count (no full leaderboard)
    if (state.participants) {
        leaderboard.forEach((entry, idx) => {
            const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === entry.id)?.[0];
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
export default handleCloseQuestion;
module.exports = handleCloseQuestion;
