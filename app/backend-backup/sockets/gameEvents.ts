/**
 * gameEvents.ts - Register game-related socket.io event handlers
 * 
 * This file centralizes all game-related socket event handling by importing
 * handler functions from individual files and registering them with socket.io.
 * Each handler is in its own file for modularity and maintainability.
 * 
 * Previously known as tournamentEvents.ts, now renamed to reflect the new
 * GameInstance model in the schema.
 */

import { Server, Socket } from 'socket.io';
import {
    StartGamePayload,
    JoinGamePayload,
    GameAnswerPayload
} from '@sockets/types/socketTypes';

// Import handlers - now using proper ESM imports for TypeScript files
import handleStartGame from '@sockets/gameEventHandlers/startHandler';
import handleJoinGame from '@sockets/gameEventHandlers/joinHandler';
import handleGameAnswer from '@sockets/gameEventHandlers/answerHandler';
import handleGamePause from '@sockets/gameEventHandlers/pauseHandler';
import handleGameResume from '@sockets/gameEventHandlers/resumeHandler';
import handleDisconnecting from '@sockets/gameEventHandlers/disconnectingHandler';

// Create logger for this module
import createLogger from '@logger';
const logger = createLogger('GameEvents');

/**
 * Register all game-related socket event handlers
 * 
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
function registerGameEvents(io: Server, socket: Socket): void {
    logger.debug(`[registerGameEvents] Registering game event handlers for socket ${socket.id}`);

    // Register event handlers with their respective payloads
    socket.on("start_game", (payload: StartGamePayload) => {
        logger.debug(`[start_game] Received from socket ${socket.id}`);
        handleStartGame(io, socket, payload);
    });

    socket.on("join_game", (payload: JoinGamePayload) => {
        logger.debug(`[join_game] Received from socket ${socket.id}`);
        handleJoinGame(io, socket, payload);
    });

    socket.on("game_answer", (payload: GameAnswerPayload) => {
        logger.debug(`[game_answer] Received from socket ${socket.id}`);
        handleGameAnswer(io, socket, payload);
    });

    socket.on("game_pause", (payload: any) => {
        logger.debug(`[game_pause] Received from socket ${socket.id}`);
        handleGamePause(io, socket, payload);
    });

    socket.on("game_resume", (payload: any) => {
        logger.debug(`[game_resume] Received from socket ${socket.id}`);
        handleGameResume(io, socket, payload);
    });

    socket.on("disconnecting", () => {
        logger.debug(`[disconnecting] Socket ${socket.id} disconnecting`);
        handleDisconnecting(io, socket);
    });
}

export default registerGameEvents;
