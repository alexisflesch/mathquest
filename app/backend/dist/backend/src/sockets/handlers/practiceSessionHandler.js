"use strict";
/**
 * Practice Session Socket Handlers
 *
 * Real-time socket handlers for practice session functionality.
 * Handles session creation, question flow, answer submission, and session management.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPracticeSessionHandlers = registerPracticeSessionHandlers;
exports.handlePracticeSessionDisconnect = handlePracticeSessionDisconnect;
const practiceSessionService_1 = require("@/core/services/practiceSessionService");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/practice/events");
const logger = (0, logger_1.default)('PracticeSessionHandler');
/**
 * Register practice session socket event handlers
 * @param io Socket.IO server instance
 * @param socket Connected socket
 */
function registerPracticeSessionHandlers(io, socket) {
    /**
     * START_PRACTICE_SESSION - Create and start a new practice session
     */
    socket.on(events_1.PRACTICE_EVENTS.START_PRACTICE_SESSION, async (payload) => {
        try {
            logger.info({
                socketId: socket.id,
                userId: payload.userId,
                settings: payload.settings
            }, 'Starting practice session');
            // Create new practice session
            const session = await practiceSessionService_1.practiceSessionService.createSession(payload.userId, payload.settings);
            // Join socket to practice session room for real-time updates
            const roomName = `practice:${session.sessionId}`;
            await socket.join(roomName);
            // Store session info in socket data for later use
            socket.data = {
                ...socket.data,
                practiceSessionId: session.sessionId,
                practiceUserId: payload.userId
            };
            // Send success response
            const response = {
                success: true,
                session,
                message: 'Practice session created successfully'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_CREATED, response);
            logger.info({
                sessionId: session.sessionId,
                userId: payload.userId,
                roomName
            }, 'Practice session created and socket joined room');
        }
        catch (error) {
            logger.error({
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : String(error),
                payload
            }, 'Failed to start practice session');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Unknown error'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    /**
     * GET_NEXT_PRACTICE_QUESTION - Get the next question in the session
     */
    socket.on(events_1.PRACTICE_EVENTS.GET_NEXT_PRACTICE_QUESTION, async (payload) => {
        try {
            logger.debug({
                sessionId: payload.sessionId,
                socketId: socket.id
            }, 'Getting next practice question');
            // Get next question from practice session service
            const questionData = await practiceSessionService_1.practiceSessionService.getNextQuestion(payload.sessionId);
            if (!questionData) {
                // No more questions - session complete
                const finalSession = await practiceSessionService_1.practiceSessionService.endSession(payload.sessionId);
                // Build proper completion payload with required summary
                const completedResponse = {
                    sessionId: payload.sessionId,
                    session: finalSession,
                    summary: {
                        totalQuestions: finalSession.questionPool.length,
                        correctAnswers: finalSession.statistics.correctAnswers,
                        finalAccuracy: finalSession.statistics.accuracyPercentage,
                        totalTimeSpent: finalSession.statistics.totalTimeSpent,
                        averageTimePerQuestion: finalSession.statistics.averageTimePerQuestion
                    },
                    completionMessage: 'Practice session completed - no more questions'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_COMPLETED, completedResponse);
                return;
            }
            // Build proper question ready payload with progress
            const questionResponse = {
                sessionId: payload.sessionId,
                question: questionData,
                progress: {
                    currentQuestionNumber: (questionData.questionIndex || 0) + 1,
                    totalQuestions: questionData.questionIndex ? Math.max(questionData.questionIndex + 1, 1) : 1, // Will be updated when we get session data
                    questionsRemaining: 0 // Will be calculated properly when we have session data
                },
                isRetry: false
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_QUESTION_READY, questionResponse);
            logger.debug({
                sessionId: payload.sessionId,
                questionId: questionData.uid,
                questionIndex: questionData.questionIndex
            }, 'Next practice question sent');
        }
        catch (error) {
            logger.error({ error, payload }, 'Failed to get next practice question');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Failed to get next question'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    /**
     * SUBMIT_PRACTICE_ANSWER - Submit answer for current question
     */
    socket.on(events_1.PRACTICE_EVENTS.SUBMIT_PRACTICE_ANSWER, async (payload) => {
        try {
            logger.debug({
                sessionId: payload.sessionId,
                questionUid: payload.questionUid,
                selectedAnswers: payload.selectedAnswers,
                socketId: socket.id
            }, 'Submitting practice answer');
            // Submit answer to practice session service and get result with correct answers
            const result = await practiceSessionService_1.practiceSessionService.submitAnswer(payload.sessionId, {
                questionUid: payload.questionUid,
                selectedAnswers: payload.selectedAnswers,
                timeSpentMs: payload.timeSpentMs
            });
            // If immediate feedback is enabled, send separate payloads like live tournaments
            if (result.updatedSession.settings.showImmediateFeedback) {
                // 1. Send answer confirmation first
                const submittedResponse = {
                    sessionId: payload.sessionId,
                    questionUid: payload.questionUid,
                    selectedAnswers: payload.selectedAnswers,
                    message: 'Answer submitted successfully'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_ANSWER_SUBMITTED, submittedResponse);
                // 2. Get question details first to get boolean[] correct answers and explanation
                const questionDetails = await practiceSessionService_1.practiceSessionService.getQuestionDetails(payload.questionUid);
                // 3. Send correct answers immediately using canonical event (like live tournaments)
                socket.emit('correct_answers', {
                    questionUid: payload.questionUid,
                    correctAnswers: questionDetails?.correctAnswers || []
                });
                // 4. Send feedback with explanation if available using canonical event (like live tournaments)
                if (questionDetails?.explanation) {
                    socket.emit('feedback', {
                        questionUid: payload.questionUid,
                        feedbackRemaining: 0, // No timer in practice mode
                        explanation: questionDetails.explanation
                    });
                }
                // 5. Send practice-specific statistics update
                const statisticsResponse = {
                    sessionId: payload.sessionId,
                    questionUid: payload.questionUid,
                    isCorrect: result.isCorrect,
                    correctAnswers: questionDetails?.correctAnswers || [],
                    explanation: questionDetails?.explanation,
                    canRetry: result.updatedSession.settings.allowRetry,
                    statistics: {
                        questionsAnswered: result.updatedSession.statistics.questionsAttempted,
                        correctCount: result.updatedSession.statistics.correctAnswers,
                        accuracyPercentage: result.updatedSession.statistics.accuracyPercentage
                    }
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_ANSWER_FEEDBACK, statisticsResponse);
                logger.info({
                    sessionId: payload.sessionId,
                    questionUid: payload.questionUid,
                    selectedAnswers: payload.selectedAnswers,
                    isCorrect: result.isCorrect,
                    hasExplanation: !!questionDetails?.explanation
                }, 'Practice answer submitted with immediate feedback (DRY tournament-style events)');
            }
            else {
                // No immediate feedback
                const submittedResponse = {
                    sessionId: payload.sessionId,
                    questionUid: payload.questionUid,
                    selectedAnswers: payload.selectedAnswers,
                    message: 'Answer submitted successfully'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_ANSWER_SUBMITTED, submittedResponse);
                logger.info({
                    sessionId: payload.sessionId,
                    questionUid: payload.questionUid,
                    selectedAnswers: payload.selectedAnswers
                }, 'Practice answer submitted (no immediate feedback - showImmediateFeedback is false)');
            }
        }
        catch (error) {
            logger.error({ error, payload }, 'Failed to submit practice answer');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Failed to submit answer'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    /**
     * GET_PRACTICE_SESSION_STATE - Get current session state
     */
    socket.on(events_1.PRACTICE_EVENTS.GET_PRACTICE_SESSION_STATE, async (payload) => {
        try {
            logger.debug({
                sessionId: payload.sessionId,
                socketId: socket.id
            }, 'Getting practice session state');
            const session = await practiceSessionService_1.practiceSessionService.getSession(payload.sessionId);
            if (!session) {
                const errorResponse = {
                    sessionId: payload.sessionId,
                    errorType: 'session_not_found',
                    message: 'Practice session not found'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
                return;
            }
            const stateResponse = {
                sessionId: payload.sessionId,
                session,
                success: true
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_STATE, stateResponse);
        }
        catch (error) {
            logger.error({ error, payload }, 'Failed to get practice session state');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Failed to get session state'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    /**
     * END_PRACTICE_SESSION - End the current practice session
     */
    socket.on(events_1.PRACTICE_EVENTS.END_PRACTICE_SESSION, async (payload) => {
        try {
            logger.info({
                sessionId: payload.sessionId,
                socketId: socket.id
            }, 'Ending practice session');
            // End the practice session
            const finalSession = await practiceSessionService_1.practiceSessionService.endSession(payload.sessionId);
            // Leave the practice room
            const roomName = `practice:${payload.sessionId}`;
            await socket.leave(roomName);
            // Clear practice session data from socket
            if (socket.data) {
                delete socket.data.practiceSessionId;
                delete socket.data.practiceUserId;
            }
            // Send completion response
            const completedResponse = {
                sessionId: payload.sessionId,
                session: finalSession,
                summary: {
                    totalQuestions: finalSession.questionPool.length,
                    correctAnswers: finalSession.statistics.correctAnswers,
                    finalAccuracy: finalSession.statistics.accuracyPercentage,
                    totalTimeSpent: finalSession.statistics.totalTimeSpent,
                    averageTimePerQuestion: finalSession.statistics.averageTimePerQuestion
                },
                completionMessage: 'Practice session ended successfully'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_COMPLETED, completedResponse);
            logger.info({
                sessionId: payload.sessionId,
                finalStatistics: finalSession.statistics
            }, 'Practice session ended');
        }
        catch (error) {
            logger.error({ error, payload }, 'Failed to end practice session');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Failed to end session'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    /**
     * REQUEST_PRACTICE_FEEDBACK - Request feedback for submitted answer
     */
    socket.on(events_1.PRACTICE_EVENTS.REQUEST_PRACTICE_FEEDBACK, async (payload) => {
        try {
            logger.debug({
                sessionId: payload.sessionId,
                questionUid: payload.questionUid,
                socketId: socket.id
            }, 'Requesting practice feedback');
            // Get question details with correct answers as boolean[] and explanation
            const questionDetails = await practiceSessionService_1.practiceSessionService.getQuestionDetails(payload.questionUid);
            if (!questionDetails) {
                const errorResponse = {
                    errorType: 'question_not_found',
                    message: 'Question not found'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
                return;
            }
            // Get current session to access statistics
            const session = await practiceSessionService_1.practiceSessionService.getSession(payload.sessionId);
            if (!session) {
                const errorResponse = {
                    errorType: 'session_not_found',
                    message: 'Session not found'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
                return;
            }
            // Find the submitted answer for this question
            const submittedAnswer = session.answers.find(answer => answer.questionUid === payload.questionUid);
            if (!submittedAnswer) {
                const errorResponse = {
                    errorType: 'invalid_answer',
                    message: 'No submitted answer found for this question'
                };
                socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
                return;
            }
            // Send feedback to client
            const feedbackResponse = {
                sessionId: payload.sessionId,
                questionUid: payload.questionUid,
                isCorrect: submittedAnswer.isCorrect,
                correctAnswers: questionDetails.correctAnswers,
                explanation: questionDetails.explanation,
                canRetry: false, // For now, no retries allowed
                statistics: {
                    questionsAnswered: session.statistics.questionsAttempted,
                    correctCount: session.statistics.correctAnswers,
                    accuracyPercentage: session.statistics.accuracyPercentage
                }
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_ANSWER_FEEDBACK, feedbackResponse);
            logger.info({
                sessionId: payload.sessionId,
                questionUid: payload.questionUid,
                isCorrect: submittedAnswer.isCorrect
            }, 'Practice feedback sent');
        }
        catch (error) {
            logger.error({ error, payload }, 'Failed to get practice feedback');
            const errorResponse = {
                errorType: 'server_error',
                message: error instanceof Error ? error.message : 'Failed to get feedback'
            };
            socket.emit(events_1.PRACTICE_EVENTS.PRACTICE_SESSION_ERROR, errorResponse);
        }
    });
    logger.debug({ socketId: socket.id }, 'Practice session handlers registered');
}
/**
 * Handle practice session cleanup on socket disconnect
 * @param io Socket.IO server instance
 * @param socket Disconnecting socket
 */
function handlePracticeSessionDisconnect(io, socket) {
    // Check if socket was in a practice session
    if (socket.data?.practiceSessionId) {
        const sessionId = socket.data.practiceSessionId;
        const userId = socket.data.practiceUserId;
        logger.info({
            socketId: socket.id,
            sessionId,
            userId
        }, 'Socket disconnected with active practice session - cleaning up');
        // Note: We don't automatically end the session on disconnect
        // The session remains active and user can reconnect
        // Only clean up socket-specific data
        // Leave practice room
        const roomName = `practice:${sessionId}`;
        socket.leave(roomName);
        logger.debug({
            sessionId,
            roomName
        }, 'Socket left practice session room on disconnect');
    }
}
exports.default = registerPracticeSessionHandlers;
