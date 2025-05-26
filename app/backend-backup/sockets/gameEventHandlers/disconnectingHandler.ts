/**
 * disconnectingHandler.ts - Game Disconnecting Handler
 * 
 * This module handles the disconnecting event for game participants.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState } from '../types/tournamentTypes'; // Will be renamed to GameState in separate PR
import { tournamentState } from '../tournamentUtils/tournamentState'; // Will be renamed to gameState in separate PR
import { emitQuizConnectedCount } from '../quizUtils';
import prisma from '../../db';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('DisconnectGameHandler');

/**
 * Handle disconnecting event for game participants
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 */
async function handleDisconnecting(
    io: Server,
    socket: Socket
): Promise<void> {
    logger.info(`disconnecting: socket.id=${socket.id}`);

    // Find which game states this socket was part of
    for (const accessCode in tournamentState) {
        const state: TournamentState | undefined = tournamentState[accessCode];
        if (state?.socketToPlayerId && state.socketToPlayerId[socket.id]) {
            const playerId = state.socketToPlayerId[socket.id];
            logger.info(`Socket ${socket.id} (playerId: ${playerId}) disconnecting from game ${accessCode}`);

            // Remove the socket mapping. Participant data remains for scoring or potential rejoin.
            delete state.socketToPlayerId[socket.id];

            // Emit real-time participant update to game room
            if (state.participants) {
                const participantsList = Object.values(state.participants).map(p => ({
                    id: p.id,
                    name: p.username, // will be renamed in UI, keeping username in state for now
                    avatar: p.avatar,
                }));

                io.to(`game_${accessCode}`).emit("game_participants_update", {
                    participants: participantsList,
                    playerCount: participantsList.length
                });
            }

            // Update connected count for the quiz template if applicable
            await emitQuizConnectedCount(io, prisma, accessCode);
        }
    }
}

export default handleDisconnecting;
