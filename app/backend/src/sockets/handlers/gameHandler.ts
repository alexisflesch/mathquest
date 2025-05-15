import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService';

// Create a handler-specific logger
const logger = createLogger('GameHandler');

// Redis key prefixes
const GAME_KEY_PREFIX = 'mathquest:game:';
const PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
const ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';

// Define game state interface
export interface GameState {
    gameId: string;              // Database ID of the game instance
    accessCode: string;          // Access code for joining
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionIndex: number; // Index of the current question
    questionIds: string[];       // IDs of questions in the quiz
    questionData?: any;          // Data of the current question (sent to clients)
    startedAt?: number;          // Timestamp when game started
    answersLocked?: boolean;     // Whether answers are locked
    timer: {
        startedAt: number;       // When the timer started
        duration: number;        // Total duration in milliseconds
        isPaused: boolean;       // Whether timer is paused
        pausedAt?: number;       // When it was paused
        timeRemaining?: number;  // Time remaining when paused
    };
    settings: {                  // Game settings
        timeMultiplier: number;  // Multiplier for question time limits
        showLeaderboard: boolean; // Whether to show leaderboard between questions
    };
}

// Define event payload types
export interface JoinGamePayload {
    accessCode: string;   // The unique code for the game
    playerId: string;     // Unique identifier for the player
    username: string;     // Display name for the player
    avatarUrl?: string;   // Optional URL to player's avatar image
}

export interface GameAnswerPayload {
    accessCode: string;   // The unique code for the game
    questionId: string;   // ID of the question being answered
    answer: any;          // The player's answer (format depends on question type)
    timeSpent?: number;   // How long the player took to answer (ms)
}

/**
 * Register all game-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function registerGameHandlers(io: SocketIOServer, socket: Socket): void {
    // Player joining a game
    socket.on('join_game', async (payload: JoinGamePayload) => {
        const { accessCode, playerId, username, avatarUrl } = payload;
        logger.info({ accessCode, playerId, username, socketId: socket.id }, 'Player joining game');

        try {
            // Verify the game exists
            const gameInstance = await prisma.gameInstance.findFirst({
                where: { accessCode }
            });

            if (!gameInstance) {
                logger.warn({ accessCode }, 'Game not found');
                socket.emit('error', {
                    code: 'GAME_NOT_FOUND',
                    message: 'Game not found with the provided access code',
                });
                return;
            }

            // Check if game is in an active state
            if (gameInstance.status !== 'active') {
                logger.warn({ accessCode, status: gameInstance.status }, 'Game not in active state');
                socket.emit('error', {
                    code: 'GAME_NOT_ACTIVE',
                    message: 'This game is not currently active',
                });
                return;
            }

            // Initialize game state if not already done
            const fullState = await gameStateService.getFullGameState(accessCode);
            let gameState = fullState ? fullState.gameState : null;

            if (!gameState) {
                gameState = await gameStateService.initializeGameState(gameInstance.id);
                if (!gameState) {
                    throw new Error('Failed to initialize game state');
                }
            }

            // Create or update player participant record
            const participant = {
                id: socket.id,
                playerId,
                username,
                avatarUrl: avatarUrl || '',
                joinedAt: Date.now(),
                score: 0,
                online: true
            };

            // Store participant in Redis
            await redisClient.hset(
                `${PARTICIPANTS_KEY_PREFIX}${accessCode}`,
                socket.id,
                JSON.stringify(participant)
            );

            // Join the game room
            const roomName = `game_${accessCode}`;
            await socket.join(roomName);

            logger.info({ accessCode, playerId, socketId: socket.id }, 'Player joined game room');

            // Create a GameParticipant record if needed
            try {
                const existingParticipant = await prisma.gameParticipant.findFirst({
                    where: {
                        gameInstanceId: gameInstance.id,
                        playerId
                    }
                });

                if (!existingParticipant) {
                    await prisma.gameParticipant.create({
                        data: {
                            gameInstanceId: gameInstance.id,
                            playerId,
                            score: 0 // Initialize score, though it defaults to 0 in schema
                            // Note: The schema doesn't have displayName or status fields
                        }
                    });
                }
            } catch (dbError) {
                logger.error({ accessCode, playerId, error: dbError }, 'Error creating game participant record');
                // Continue even if DB record fails, as Redis is the primary store during game
            }

            // Get all participants for this game
            const participants = await getAllParticipants(accessCode);

            // Notify player they've joined the game
            socket.emit('game_joined', {
                gameId: gameInstance.id,
                accessCode: gameInstance.accessCode,
                currentQuestion: gameState.currentQuestionIndex,
                totalQuestions: gameState.questionIds.length
            });

            // Send current game state if there's an active question
            if (gameState.currentQuestionIndex >= 0) {
                const questionId = gameState.questionIds[gameState.currentQuestionIndex];
                const question = await prisma.question.findUnique({
                    where: { uid: questionId }
                });

                if (question) {
                    // Parse responses from JSON string to object
                    let responses = [];
                    if (typeof question.responses === 'string') {
                        try {
                            responses = JSON.parse(question.responses);
                        } catch (e) {
                            logger.error({ questionId, responses: question.responses, error: e }, 'Failed to parse question responses');
                            responses = []; // Default to empty array on parse error
                        }
                    } else if (Array.isArray(question.responses)) {
                        responses = question.responses; // Already an array
                    } else if (question.responses && typeof question.responses === 'object') {
                        // If it's an object but not an array, try to get values or handle as appropriate
                        // This case might need specific handling based on expected structure
                        logger.warn({ questionId, responses: question.responses }, 'Question responses is an object but not an array');
                        // For now, let's assume it might be a structure we can take values from if it has them
                        if (typeof (question.responses as any).options === 'object') {
                            responses = (question.responses as any).options; // Example if options are nested
                        } else {
                            responses = [];
                        }
                    }

                    // For multiple choice, send without correct answers
                    const options = Array.isArray(responses) ? responses.map((option: any) => ({
                        id: option.id,
                        content: option.content
                    })) : [];

                    socket.emit('game_question', {
                        question: {
                            id: question.uid,
                            content: question.text, // Ensure this matches schema: 'text'
                            type: question.questionType,
                            options,
                            timeLimit: question.timeLimit || 30
                        },
                        index: gameState.currentQuestionIndex,
                        total: gameState.questionIds.length,
                        timer: (question.timeLimit || 30) * 1000 // Convert to milliseconds
                    });
                }
            }

            // Notify other players that someone joined
            socket.to(roomName).emit('player_joined_game', {
                id: socket.id,
                username,
                playerId,
                avatarUrl
            });

            // Send updated participants list to all players
            io.to(roomName).emit('game_participants', {
                participants: participants.map(p => ({
                    id: p.id,
                    username: p.username,
                    playerId: p.playerId,
                    score: p.score,
                    avatarUrl: p.avatarUrl
                }))
            });

        } catch (error) {
            logger.error({ accessCode, playerId, error }, 'Error handling join_game event');
            socket.emit('error', {
                code: 'JOIN_GAME_ERROR',
                message: 'Failed to join game',
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Player requesting participants list
    socket.on('request_participants', async (payload: { accessCode: string }) => {
        const { accessCode } = payload;
        logger.info({ accessCode, socketId: socket.id }, 'Player requesting participants');

        try {
            // Check if the player is in the game room
            const roomName = `game_${accessCode}`;
            const inRoom = socket.rooms.has(roomName);

            if (!inRoom) {
                socket.emit('error', {
                    code: 'NOT_IN_GAME',
                    message: 'You are not in this game',
                });
                return;
            }

            // Get participants from Redis
            const participantsHash = await redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);
            if (!participantsHash || Object.keys(participantsHash).length === 0) {
                socket.emit('game_participants', { participants: [] });
                return;
            }

            // Parse participants and emit to the client
            const participants = Object.values(participantsHash).map(json => JSON.parse(json as string));
            socket.emit('game_participants', {
                participants: participants.map(p => ({
                    id: p.id,
                    username: p.username,
                    playerId: p.playerId,
                    score: p.score,
                    avatarUrl: p.avatarUrl
                }))
            });
        } catch (error) {
            logger.error({ accessCode, socketId: socket.id, error }, 'Error getting participants');
            socket.emit('error', {
                code: 'PARTICIPANTS_ERROR',
                message: 'Error retrieving participants',
            });
        }
    });

    // Player submitting an answer
    socket.on('game_answer', async (payload: GameAnswerPayload) => {
        const { accessCode, questionId, answer, timeSpent = 0 } = payload;
        logger.info({ accessCode, questionId, socketId: socket.id }, 'Player submitting answer');

        try {
            // Get the game state
            const fullState = await gameStateService.getFullGameState(accessCode);
            const gameState = fullState ? fullState.gameState : null;

            if (!gameState) {
                logger.warn({ accessCode }, 'Game state not found');
                socket.emit('error', {
                    code: 'GAME_NOT_FOUND',
                    message: 'Game state not found',
                });
                return;
            }

            // Check if the question is the current active one
            const currentQuestionId = gameState.questionIds[gameState.currentQuestionIndex];
            if (currentQuestionId !== questionId) {
                logger.warn({ accessCode, questionId, currentQuestionId }, 'Answer for non-active question');
                socket.emit('error', {
                    code: 'INVALID_QUESTION',
                    message: 'This is not the currently active question',
                });
                return;
            }

            // Check if answers are locked
            if (gameState.answersLocked) {
                logger.warn({ accessCode, questionId }, 'Answers are locked');
                socket.emit('error', {
                    code: 'ANSWERS_LOCKED',
                    message: 'Answers are currently locked',
                });
                return;
            }

            // Get participant data
            const participantRaw = await redisClient.hget(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`, socket.id);
            if (!participantRaw) {
                logger.warn({ accessCode, socketId: socket.id }, 'Participant not found');
                socket.emit('error', {
                    code: 'NOT_PARTICIPANT',
                    message: 'You are not a registered participant in this game',
                });
                return;
            }

            const participant = JSON.parse(participantRaw);

            // Store the answer in Redis
            const answerData = {
                socketId: socket.id,
                playerId: participant.playerId,
                answer,
                timeSpent,
                submittedAt: Date.now(),
            };

            await redisClient.hset(
                `${ANSWERS_KEY_PREFIX}${accessCode}:${questionId}`,
                socket.id,
                JSON.stringify(answerData)
            );

            logger.info({ accessCode, questionId, socketId: socket.id }, 'Answer recorded');

            // Confirm receipt to the player
            socket.emit('answer_received', {
                questionId,
                timeSpent
            });

            // Get current answer count for progress tracking
            const answersCount = await redisClient.hlen(`${ANSWERS_KEY_PREFIX}${accessCode}:${questionId}`);
            const participantsCount = await redisClient.hlen(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);

            // Notify teacher control about answer progress
            // Fetch gameInstance to get the ID for the teacher control room
            const gameInstance = await prisma.gameInstance.findFirst({ where: { accessCode } });
            if (gameInstance) {
                const teacherRoom = `teacher_control_${gameInstance.id}`;
                io.to(teacherRoom).emit('answer_progress', {
                    questionId,
                    answered: answersCount,
                    total: participantsCount,
                    percentage: participantsCount > 0 ? Math.round((answersCount / participantsCount) * 100) : 0
                });
            }

        } catch (error) {
            logger.error({ accessCode, questionId, error }, 'Error handling game_answer event');
            socket.emit('error', {
                code: 'ANSWER_ERROR',
                message: 'Failed to record answer',
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Handle client disconnect 
    socket.on('disconnect', async () => {
        logger.info({ socketId: socket.id }, 'Socket disconnected');

        try {
            // Find which games this socket might be part of
            const gameKeys = await redisClient.keys(`${PARTICIPANTS_KEY_PREFIX}*`);

            for (const key of gameKeys) {
                const exists = await redisClient.hexists(key, socket.id);
                if (exists) {
                    // Get access code from the key
                    const accessCode = key.replace(PARTICIPANTS_KEY_PREFIX, '');
                    logger.info({ accessCode, socketId: socket.id }, 'Player left game');

                    // Get participant data
                    const participantRaw = await redisClient.hget(key, socket.id);
                    if (participantRaw) {
                        const participant = JSON.parse(participantRaw);

                        // Mark as offline but don't remove yet (or remove, depending on desired logic)
                        // For now, let's remove them from the active list for immediate feedback
                        await redisClient.hdel(key, socket.id);
                        // Optionally, could mark as offline: participant.online = false; await redisClient.hset(key, socket.id, JSON.stringify(participant));

                        // Notify other players
                        const roomName = `game_${accessCode}`;
                        io.to(roomName).emit('player_left_game', { id: socket.id, username: participant.username });

                        // Update participants list
                        const participants = await getAllParticipants(accessCode);
                        io.to(roomName).emit('game_participants', {
                            participants: participants.filter(p => p.online !== false) // Filter out those explicitly marked offline or removed
                                .map(p => ({
                                    id: p.id,
                                    username: p.username,
                                    playerId: p.playerId,
                                    score: p.score,
                                    avatarUrl: p.avatarUrl
                                }))
                        });
                    }
                }
            }
        } catch (error) {
            logger.error({ error }, 'Error handling player disconnect');
        }
    });
}

/**
 * Helper to get all participants for a game
 * @param accessCode The game access code
 * @returns Array of participant objects
 */
async function getAllParticipants(accessCode: string): Promise<any[]> {
    const participantsRaw = await redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${accessCode}`);

    if (!participantsRaw) {
        return [];
    }

    return Object.values(participantsRaw).map(json => JSON.parse(json as string));
}

export default registerGameHandlers;
