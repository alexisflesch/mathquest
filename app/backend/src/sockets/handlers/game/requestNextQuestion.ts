import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ErrorPayload } from '@shared/types/socketEvents';
import { GAME_EVENTS } from '@shared/types/socket/events';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { requestNextQuestionPayloadSchema } from '@shared/types/socketEvents.zod';

const logger = createLogger('RequestNextQuestionHandler');

export function requestNextQuestionHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    return async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = requestNextQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid requestNextQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid requestNextQuestion payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit('game_error', errorPayload);
            return;
        }

        const validPayload = parseResult.data;
        const { accessCode, userId, currentQuestionUid } = validPayload;

        try {
            logger.info({ socketId: socket.id, event: 'request_next_question', accessCode, userId, currentQuestionUid }, 'Player requested next question');

            // 1. Get game instance
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    playMode: true,
                    isDiffered: true,
                    gameTemplateId: true
                }
            });

            if (!gameInstance) {
                const errorPayload: ErrorPayload = { message: 'Game not found.' };
                socket.emit('game_error', errorPayload);
                return;
            }

            // Allow request_next_question for both practice mode and deferred tournaments
            if (!gameInstance.isDiffered && gameInstance.playMode !== 'practice') {
                logger.warn({ accessCode, userId }, 'Request next question is only for practice mode or deferred tournaments');
                const errorPayload: ErrorPayload = { message: 'This operation is only for practice mode or deferred tournaments.' };
                socket.emit('game_error', errorPayload);
                return;
            }

            // 2. Get participant
            const participant = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId }
            });

            if (!participant) {
                const errorPayload: ErrorPayload = { message: 'Participant not found.' };
                socket.emit('game_error', errorPayload);
                return;
            }

            // 3. Get all questions
            const allQuestions = await prisma.questionsInGameTemplate.findMany({
                where: { gameTemplateId: gameInstance.gameTemplateId },
                orderBy: { sequence: 'asc' },
                include: {
                    question: true
                }
            });

            // 4. Use participant.answers to determine which questions are answered
            const answersArr = Array.isArray(participant.answers) ? participant.answers : [];
            const answeredSet = new Set(
                answersArr
                    .filter(a => a && typeof a === 'object' && 'questionUid' in a)
                    .map((a: any) => a.questionUid)
            );

            // 5. Find next unanswered question - skip the current one
            let nextQuestion = null;
            if (currentQuestionUid) {
                // Find the current question's index
                const currentIndex = allQuestions.findIndex(q => q.questionUid === currentQuestionUid);
                if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
                    // Get the next question
                    const nextQ = allQuestions[currentIndex + 1];
                    nextQuestion = nextQ.question;
                }
            }

            if (nextQuestion) {
                // Send next question
                logger.info({ accessCode, userId, nextQuestionUid: nextQuestion.uid }, 'Sending next question');

                // Log what we're about to send for debugging
                console.log('[REQUEST_NEXT_QUESTION] About to send question:', {
                    uid: nextQuestion.uid,
                    text: nextQuestion.text,
                    index: allQuestions.findIndex(q => q.questionUid === nextQuestion.uid)
                });

                // Create a properly formatted question payload according to QuestionData type
                const questionData = {
                    uid: nextQuestion.uid,
                    text: nextQuestion.text,
                    answerOptions: nextQuestion.answerOptions || [],
                    correctAnswers: nextQuestion.correctAnswers || [],
                    questionType: nextQuestion.questionType || QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                    timeLimit: nextQuestion.timeLimit || 30,
                    themes: nextQuestion.themes || [],
                    difficulty: nextQuestion.difficulty || 1,
                    discipline: nextQuestion.discipline || 'math',
                    title: nextQuestion.title || undefined
                };

                // Add current question index to the payload
                const questionIndex = allQuestions.findIndex(q => q.questionUid === nextQuestion.uid);
                const totalQuestions = allQuestions.length;

                // Create the proper LiveQuestionPayload structure
                const liveQuestionPayload = {
                    question: {
                        uid: nextQuestion.uid,
                        text: nextQuestion.text,
                        questionType: nextQuestion.questionType || QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                        answerOptions: nextQuestion.answerOptions || []
                    },
                    timer: {
                        status: 'play' as const,
                        timeLeftMs: (nextQuestion.timeLimit || 30) * 1000,
                        durationMs: (nextQuestion.timeLimit || 30) * 1000,
                        questionUid: nextQuestion.uid,
                        timestamp: Date.now(),
                        localTimeLeftMs: (nextQuestion.timeLimit || 30) * 1000
                    },
                    questionIndex: questionIndex,
                    totalQuestions: totalQuestions,
                    questionState: 'active' as const
                };

                // Send the question data using the proper LiveQuestionPayload structure
                socket.emit('game_question', liveQuestionPayload); // TODO: Define shared type if missing
            } else {
                // All questions answered: compute and send final score
                const total = allQuestions.length;
                // Count correct answers for this participant
                let correctCount = 0;
                for (const a of answersArr) {
                    if (a && typeof a === 'object' && 'questionUid' in a && typeof a.questionUid === 'string' && 'answer' in a) {
                        const q = await prisma.question.findUnique({ where: { uid: a.questionUid } });
                        if (q && Array.isArray(q.correctAnswers) && typeof a.answer === 'number') {
                            if (q.correctAnswers[a.answer] === true) correctCount++;
                        }
                    }
                }

                // Send final score
                logger.info({ accessCode, userId, correctCount, total }, 'Practice mode completed, sending final score');
                socket.emit('game_ended', {
                    accessCode,
                    score: correctCount,
                    totalQuestions: total,
                    correct: correctCount,
                    total: total
                }); // TODO: Define shared type if missing

                // Update participant as completed
                await prisma.gameParticipant.update({
                    where: { id: participant.id },
                    data: { completedAt: new Date() }
                });
            }
        } catch (err) {
            logger.error({ err, socketId: socket.id }, 'Error handling request_next_question');
            const errorPayload: ErrorPayload = { message: 'Error processing next question request.' };
            socket.emit('game_error', errorPayload);
        }
    };
}
