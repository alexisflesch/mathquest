/**
 * joinHandler.ts - Game Join Handler
 * 
 * Handles players joining a game instance.
 */

import { Server, Socket } from 'socket.io';
import { JoinGamePayload } from '../types/socketTypes';
import { gameState } from '../gameUtils/gameState';
import createLogger from '../../logger';

/**
 * Handle join_game event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The join payload from the client
 */
async function handleJoinGame(
    io: Server,
    socket: Socket,
    payload: JoinGamePayload
): Promise<void> {
    const { accessCode, playerId, playerName, avatarUrl, isDeferredMode } = payload;

    // Create a logger
    const logger = createLogger('JoinGameHandler');

    logger.info(`Player ${playerName || 'unknown'} (${socket.id}) joined game ${accessCode}`);

    try {
        // Join the room for this game
        const roomName = `live_${accessCode}`;
        socket.join(roomName);

        // Add participant to game state if not already there
        if (!gameState[accessCode]) {
            gameState[accessCode] = {
                participants: [],
                questions: [],
                currentIndex: -1, // Initialize currentIndex, -1 indicates no question selected yet
                answers: {},
                timer: null,
                questionStart: null,
                paused: false,
                stopped: false,
                currentQuestionDuration: 0, // Default or from settings
                socketToPlayerId: {},
                askedQuestions: new Set<string>(),
                status: 'preparing'
            };
        }

        // Check if participant already exists (by playerId)
        const participantExists = gameState[accessCode]?.participants?.some(
            (p) => p.id === playerId
        );

        if (!participantExists && playerId && playerName && gameState[accessCode]?.participants) {
            // Add participant to game state
            gameState[accessCode].participants.push({
                id: playerId,
                socketId: socket.id,
                username: playerName || '', // Using username in state structure for now
                avatar: avatarUrl || '', // Using avatar in state structure for now
                answers: [],
                score: 0 // Initialize score
            });
        }

        // Map socket.id to playerId for easy lookup
        if (playerId) {
            gameState[accessCode].socketToPlayerId[socket.id] = playerId;
            logger.debug(`Mapped socket ${socket.id} to playerId ${playerId} for game ${accessCode}`);
        } else {
            logger.warn(`No playerId provided for socket ${socket.id} in game ${accessCode}, cannot map socket to player.`);
        }

        // Confirm to the client that they've joined
        socket.emit('joined_game', {
            accessCode,
            socketId: socket.id
        });

        // Emit current game state if available
        // Use currentIndex to check if a question is active
        if (gameState[accessCode].currentIndex !== -1 && gameState[accessCode].questions.length > gameState[accessCode].currentIndex) {
            const currentQuestion = gameState[accessCode].questions[gameState[accessCode].currentIndex];
            if (currentQuestion) {
                socket.emit('game_question', {
                    ...currentQuestion,
                    index: gameState[accessCode].currentIndex, // Use currentIndex
                    total: gameState[accessCode].questions.length
                });
            }
        }

        logger.debug(`Game ${accessCode} now has ${gameState[accessCode]?.participants?.length || 0} participants`);
    } catch (error) {
        logger.error(`Error in handleJoinGame: ${error}`);
        socket.emit('game_error', {
            message: 'Failed to join game',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}

export default handleJoinGame;
