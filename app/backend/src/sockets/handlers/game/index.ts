import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinGameHandler } from './joinGame';
import { gameAnswerHandler } from './gameAnswer';
import { requestParticipantsHandler } from './requestParticipants';
import { disconnectHandler } from './disconnect';

export function registerGameHandlers(io: SocketIOServer, socket: Socket) {
    // Debug all events received
    socket.onAny((event, ...args) => {
        // eslint-disable-next-line no-console
        console.log(`[SOCKET.IO onAny] Event received:`, event, args);
    });

    // Register direct handlers on socket instance
    socket.on('join_game', joinGameHandler(io, socket));

    // Enhanced handler for game_answer with additional logging
    socket.on('game_answer', (payload) => {
        console.log('[DIRECT HANDLER] game_answer event received with payload:', payload);
        console.log(`Socket ID: ${socket.id}, Connected: ${socket.connected}`);

        // Forward to the regular handler
        try {
            // For debugging purposes, log the handler type
            console.log('[DIRECT HANDLER] Handler type:', typeof gameAnswerHandler(io, socket));

            const handlerFn = gameAnswerHandler(io, socket);
            handlerFn(payload);
        } catch (error) {
            console.error('[DIRECT HANDLER] Error in game_answer handler:', error);

            // Ensure the client gets a response even if the handler fails
            try {
                socket.emit('answer_received', {
                    questionId: payload.questionId || 'unknown',
                    timeSpent: payload.timeSpent || 0
                });
            } catch (emitError) {
                console.error('[DIRECT HANDLER] Failed to send error response:', emitError);
            }
        }
    });

    socket.on('request_participants', requestParticipantsHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));
}

export { registerTournamentHandlers } from '../tournament/index';
