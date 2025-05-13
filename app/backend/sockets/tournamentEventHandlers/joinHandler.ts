/**
 * joinHandler.ts - Tournament Join Handler (Stub)
 * 
 * This is a temporary stub implementation that will be completed later.
 */

import { Server, Socket } from 'socket.io';
import { JoinTournamentPayload } from '../types/socketTypes';
import { tournamentState } from '../tournamentUtils/tournamentState';
import createLogger from '../../logger';

/**
 * Handle join_tournament event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The join payload from the client
 */
async function handleJoinTournament(
    io: Server,
    socket: Socket,
    payload: JoinTournamentPayload
): Promise<void> {
    const { code, cookie_id, pseudo, avatar, isDiffered } = payload;

    // Create a logger
    const logger = createLogger('JoinHandler');

    logger.info(`Player ${pseudo || 'unknown'} (${socket.id}) joined tournament ${code}`);

    try {
        // Join the room for this tournament
        const roomName = `live_${code}`;
        socket.join(roomName);

        // Add participant to tournament state if not already there
        if (!tournamentState[code]) {
            tournamentState[code] = {
                participants: [],
                questions: [],
                currentIndex: -1, // Initialize currentIndex, -1 indicates no question selected yet
                answers: {},
                timer: null,
                questionStart: null,
                paused: false,
                stopped: false,
                currentQuestionDuration: 0, // Default or from settings
                socketToJoueur: {},
                askedQuestions: new Set<string>(),
                statut: 'en préparation' // Corrected from status to statut
            };
        }

        // Check if participant already exists (by cookie_id, which maps to participant.id)
        const participantExists = tournamentState[code]?.participants?.some(
            (p) => p.id === cookie_id
        );

        if (!participantExists && cookie_id && pseudo && tournamentState[code]?.participants) {
            // Add participant to tournament state
            tournamentState[code].participants.push({
                id: cookie_id, // Use id as per TournamentParticipant type
                socketId: socket.id,
                pseudo,
                avatar: avatar || '', // Ensure avatar is a string
                answers: [],
                score: 0 // Initialize score
            });
        }

        // Map socket.id to joueurId (cookie_id) for easy lookup
        if (cookie_id) {
            tournamentState[code].socketToJoueur[socket.id] = cookie_id;
            logger.debug(`Mapped socket ${socket.id} to joueurId ${cookie_id} for tournament ${code}`);
        } else {
            logger.warn(`No cookie_id provided for socket ${socket.id} in tournament ${code}, cannot map socket to joueur.`);
        }

        // Confirm to the client that they've joined
        socket.emit('joined_tournament', {
            code,
            socketId: socket.id
        });

        // Emit current tournament state if available
        // Use currentIndex to check if a question is active
        if (tournamentState[code].currentIndex !== -1 && tournamentState[code].questions.length > tournamentState[code].currentIndex) {
            const currentQuestion = tournamentState[code].questions[tournamentState[code].currentIndex];
            if (currentQuestion) {
                socket.emit('tournament_question', {
                    ...currentQuestion,
                    index: tournamentState[code].currentIndex, // Use currentIndex
                    total: tournamentState[code].questions.length
                });
            }
        }

        logger.debug(`Tournament ${code} now has ${tournamentState[code]?.participants?.length || 0} participants`);
    } catch (error) {
        logger.error(`Error in handleJoinTournament: ${error}`);
        socket.emit('tournament_error', {
            message: 'Failed to join tournament',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}

export default handleJoinTournament;
