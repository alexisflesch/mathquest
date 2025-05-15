/**
 * answerHandler.ts - Game Answer Handler
 * 
 * This module handles the game_answer event, which is emitted when a player
 * submits an answer to a game question.
 */

import { Server, Socket } from 'socket.io';
import { GameAnswerPayload } from '../types/socketTypes';
import { GameState } from '../types/gameTypes';
import { gameState } from '../gameUtils/gameState';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('GameAnswerHandler');

/**
 * Handle game_answer event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The answer payload from the client
 */
function handleGameAnswer(
    io: Server,
    socket: Socket,
    { accessCode, playerId, questionUid, answer, clientTimestamp }: GameAnswerPayload
): void {
    logger.info(`game_answer received for Q_UID: ${questionUid} from socket ${socket.id}`);
    const serverReceiveTime = Date.now(); // Capture server receive time

    // Determine the correct state
    const state = gameState[accessCode];

    // Verify we have a valid state and player
    if (!state) {
        logger.warn(`game_answer: State not found for accessCode ${accessCode}. Ignoring.`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "state_error",
            message: "Erreur de session, impossible de traiter la réponse."
        });
        return;
    }

    // Verify the player exists in the state
    let foundPlayerId = playerId;
    if (!foundPlayerId && state.socketToPlayerId) {
        foundPlayerId = state.socketToPlayerId[socket.id];
    }

    if (!foundPlayerId) {
        logger.warn(`game_answer: Player not found for socket ${socket.id} in game ${accessCode}. Ignoring.`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "player_not_found",
            message: "Joueur non trouvé dans la partie."
        });
        return;
    }

    const question = state.questions.find(q => q.uid === state.currentQuestionUid);
    if (!question) {
        logger.error(`[AnswerHandler] Question UID ${state.currentQuestionUid} not found in game state.`);
        return;
    }

    // Update all references to question properties
    const qIdx = state.questions.indexOf(question);

    if (qIdx < 0 || !state.questions || qIdx >= state.questions.length) {
        logger.warn(`game_answer: Invalid question index (${qIdx}) or missing questions for game ${accessCode}. Ignoring.`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "invalid_question_index",
            message: "Question non valide ou non trouvée."
        });
        return;
    }

    // Check if the answer is for the *current* question
    if (question.uid !== questionUid) {
        logger.warn(`game_answer: Answer received for wrong question (expected ${question.uid}, got ${questionUid}) for game ${accessCode}. Ignoring.`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "wrong_question",
            message: "Réponse à une question incorrecte."
        });
        return;
    }

    const timeAllowed = state.currentQuestionDuration || question.time || 20;
    const questionStart = state.questionStart;

    if (!questionStart) {
        logger.warn(`game_answer: questionStart missing for game ${accessCode}. Ignoring.`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "question_not_started",
            message: "La question n'a pas encore démarré."
        });
        return;
    }

    // Enhanced logging about game state
    const isPaused = state.paused;
    const isStopped = state.stopped;
    const elapsed = (serverReceiveTime - questionStart) / 1000;
    const remaining = timeAllowed - elapsed;

    logger.debug(`game_answer: Received answer for questionUid=${questionUid}, answer=${JSON.stringify(answer)}, clientTimestamp=${clientTimestamp}`);

    // First check if the question is stopped - reject answers if it is
    if (state.stopped) {
        logger.warn(`game_answer: Answer rejected because question is stopped for game ${accessCode}`);
        socket.emit("game_answer_result", {
            questionUid,
            rejected: true,
            reason: "stopped",
            message: "Trop tard, la question est terminée !"
        });
        return;
    }

    // Always accept answers when the question is paused, regardless of time elapsed
    if (!state.paused) {
        // Only check timing if the question is NOT paused
        // Check timing using server receive time with grace period
        if ((serverReceiveTime - questionStart) > timeAllowed * 1000 + 500) { // Add 500ms grace period
            logger.warn(`game_answer: Answer too late (server time, ${timeAllowed}s allowed) for game ${accessCode}. Ignoring.`);
            // Send rejection response back to client
            socket.emit("game_answer_result", {
                questionUid,
                rejected: true,
                reason: "too_late",
                message: "Trop tard, le temps est écoulé !"
            });
            return;
        }
    }

    // Process the answer
    const timeMs = clientTimestamp ? clientTimestamp - questionStart : serverReceiveTime - questionStart;

    // Convert numeric array answer if needed (for multiple-choice questions)
    let processedAnswer = answer;
    if (typeof answer === 'number') {
        processedAnswer = answer; // Single number answer
    }

    // Calculate correctness and score
    let isCorrect = false;
    let baseScore = 10; // Default base score

    // Calculate score based on answer type and correctness
    // This will depend on the question type and correct answer format
    // For simplicity, assuming we're checking against an array of correct answer indices
    if (Array.isArray(question.correctAnswers)) {
        if (Array.isArray(processedAnswer)) {
            // For multiple-choice questions with multiple correct answers
            isCorrect = JSON.stringify(processedAnswer.sort()) === JSON.stringify(question.correctAnswers.sort());
        } else if (typeof processedAnswer === 'number') {
            // For single-answer questions
            isCorrect = question.correctAnswers.includes(processedAnswer);
        }
    } else if (question.correctAnswers !== undefined) {
        // Single correct answer
        isCorrect = processedAnswer === question.correctAnswers;
    }

    // Time bonus calculation (faster answers get more points)
    const timePenalty = Math.floor((timeMs / 1000) * 2);
    const scoreWithTimePenalty = Math.max(0, baseScore - timePenalty);
    const finalScore = isCorrect ? scoreWithTimePenalty : 0;

    // Store the answer in tournament state
    if (!state.answers[foundPlayerId]) {
        state.answers[foundPlayerId] = {};
    }

    state.answers[foundPlayerId][questionUid] = {
        value: processedAnswer,
        clientTimestamp,
        serverReceiveTime,
        timeMs,
        isCorrect,
        baseScore,
        timePenalty,
        score: finalScore
    };

    // Update the player's total score
    const participant = state.participants?.find(p => p.id === foundPlayerId);
    if (participant) {
        participant.score = (participant.score || 0) + finalScore;
        if (!participant.answers) participant.answers = [];

        participant.answers.push({
            questionUid,
            value: processedAnswer,
            timeMs,
            isCorrect,
            score: finalScore
        });
    }

    // Send acknowledgment to the client
    socket.emit("game_answer_result", {
        questionUid,
        rejected: false,
        answerReceived: processedAnswer,
        isCorrect,
        score: finalScore
    });

    logger.info(`game_answer processed for player ${foundPlayerId}, question ${questionUid}, correct: ${isCorrect}, score: ${finalScore}`);
}

export default handleGameAnswer;
