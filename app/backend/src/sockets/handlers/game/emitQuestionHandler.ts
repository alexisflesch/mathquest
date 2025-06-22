import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ErrorPayload } from '@shared/types/socketEvents';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { TimingService } from '@/services/timingService';

const logger = createLogger('EmitQuestionHandler');

export interface EmitQuestionPayload {
    accessCode: string;
    userId: string;
    questionUid?: string; // If omitted, will emit the next question after current
}

export function emitQuestionHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    return async (payload: EmitQuestionPayload) => {
        logger.info({ payload }, '[DEBUG] emitQuestionHandler called');
        const { accessCode, userId, questionUid } = payload;
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
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // 2. Get participant
        const participant = await prisma.gameParticipant.findFirst({
            where: { gameInstanceId: gameInstance.id, userId }
        });
        if (!participant) {
            const errorPayload: ErrorPayload = { message: 'Participant not found.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // 3. Get all questions
        const allQuestions = await prisma.questionsInGameTemplate.findMany({
            where: { gameTemplateId: gameInstance.gameTemplateId },
            orderBy: { sequence: 'asc' },
            include: { question: true }
        });
        let targetQuestion = null;
        if (questionUid) {
            // Find the question by UID
            const found = allQuestions.find(q => q.questionUid === questionUid);
            if (found) targetQuestion = found.question;
        } else {
            // Default: emit the first unanswered or next question
            targetQuestion = allQuestions[0]?.question;
        }
        if (!targetQuestion) {
            const errorPayload: ErrorPayload = { message: 'Question not found.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // Track timing for this question
        try {
            const wasSet = await TimingService.trackQuestionStart(accessCode, targetQuestion.uid, userId);
            logger.info({ accessCode, userId, questionUid: targetQuestion.uid, wasSet }, '[DEBUG] TimingService.trackQuestionStart result');
        } catch (err) {
            logger.error({ accessCode, userId, questionUid: targetQuestion.uid, err }, '[ERROR] TimingService.trackQuestionStart failed');
        }
        // Prepare payload
        const questionIndex = allQuestions.findIndex(q => q.questionUid === targetQuestion.uid);
        const totalQuestions = allQuestions.length;
        const liveQuestionPayload = {
            question: {
                uid: targetQuestion.uid,
                text: targetQuestion.text,
                questionType: targetQuestion.questionType || QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                answerOptions: targetQuestion.answerOptions || []
            },
            timer: {
                status: 'play' as const,
                timeLeftMs: (targetQuestion.timeLimit || 30) * 1000,
                durationMs: (targetQuestion.timeLimit || 30) * 1000,
                questionUid: targetQuestion.uid,
                timestamp: Date.now(),
                localTimeLeftMs: (targetQuestion.timeLimit || 30) * 1000
            },
            questionIndex: questionIndex,
            totalQuestions: totalQuestions,
            questionState: 'active' as const
        };
        // Emit to the socket (or room as needed)
        socket.emit(SOCKET_EVENTS.GAME.GAME_QUESTION as any, liveQuestionPayload);
        logger.info({ accessCode, userId, questionUid: targetQuestion.uid }, '[DEBUG] Emitted question to user');
    };
}
