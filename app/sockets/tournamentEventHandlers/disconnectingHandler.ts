/**
 * disconnectingHandler.ts - Tournament Disconnecting Handler
 * 
 * This module handles the disconnecting event for tournament participants.
 */

import { Server, Socket } from 'socket.io';
import { TournamentState, Participant } from '../types/tournamentTypes';
import { tournamentState } from '../tournamentUtils/tournamentState';
import { emitQuizConnectedCount } from '../quizUtils';
import prisma from '../../db';

// Import logger
import createLogger from '../../logger';
const logger = createLogger('DisconnectTournamentHandler');

/**
 * Handle disconnecting event for tournament participants
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 */
async function handleDisconnecting(
    io: Server,
    socket: Socket
): Promise<void> {
    logger.info(`disconnecting: socket.id=${socket.id}`);
    // Find which tournament states this socket was part of
    for (const stateKey in tournamentState) {
        const state: TournamentState | undefined = tournamentState[stateKey];
        if (state?.socketToJoueur && state.socketToJoueur[socket.id]) {
            const joueurId = state.socketToJoueur[socket.id];
            logger.info(`Socket ${socket.id} (joueurId: ${joueurId}) disconnecting from tournament state ${stateKey}`);
            // Remove the socket mapping. Participant data remains for scoring (in live) or potential rejoin (in differed).
            delete state.socketToJoueur[socket.id];

            // --- Emit real-time participant update to tournament room ---
            // Only emit for live tournaments (not differed)
            if (!state.isDiffered && state.participants) {
                const participantsList = Object.values(state.participants).map(p => ({
                    id: p.id,
                    pseudo: p.pseudo,
                    avatar: p.avatar,
                }));
                io.to(`live_${stateKey}`).emit("tournament_participants_update", {
                    participants: participantsList,
                    playerCount: participantsList.length
                });
            }

            // Update connected count for any linked quiz
            await emitQuizConnectedCount(io, prisma, stateKey);

            // If it's a differed state with no other sockets mapped to it, clean it up?
            // Let's NOT clean up differed state here, allow rejoin or timeout/end logic to handle it.
            // if (state.isDiffered && Object.keys(state.socketToJoueur).length === 0) {
            //     logger.info(`Cleaning up differed state ${stateKey} as last socket disconnected.`);
            //     if (state.timer) clearTimeout(state.timer);
            //     // Maybe save progress?
            //     // delete tournamentState[stateKey]; // Or keep for potential rejoin?
            // }

            // No need to emit participant_left for the tournament room itself usually.
            // Lobby handler might handle participant list updates.
        }
    }
}

export default handleDisconnecting;
