"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTournamentHandlers = void 0;
exports.registerGameHandlers = registerGameHandlers;
const joinGame_1 = require("./joinGame");
const gameAnswer_1 = require("./gameAnswer");
const requestParticipants_1 = require("./requestParticipants");
const disconnect_1 = require("./disconnect");
function registerGameHandlers(io, socket) {
    // Debug all events received
    socket.onAny((event, ...args) => {
        // eslint-disable-next-line no-console
        console.log(`[SOCKET.IO onAny] Event received:`, event, args);
    });
    // Register direct handlers on socket instance
    socket.on('join_game', (0, joinGame_1.joinGameHandler)(io, socket));
    // Enhanced handler for game_answer with additional logging
    socket.on('game_answer', (payload) => {
        console.log('[DIRECT HANDLER] game_answer event received with payload:', payload);
        console.log(`Socket ID: ${socket.id}, Connected: ${socket.connected}`);
        // Forward to the regular handler
        try {
            // For debugging purposes, log the handler type
            console.log('[DIRECT HANDLER] Handler type:', typeof (0, gameAnswer_1.gameAnswerHandler)(io, socket));
            const handlerFn = (0, gameAnswer_1.gameAnswerHandler)(io, socket);
            handlerFn(payload);
        }
        catch (error) {
            console.error('[DIRECT HANDLER] Error in game_answer handler:', error);
            // Ensure the client gets a response even if the handler fails
            try {
                socket.emit('answer_received', {
                    questionId: payload.questionId || 'unknown',
                    timeSpent: payload.timeSpent || 0
                });
            }
            catch (emitError) {
                console.error('[DIRECT HANDLER] Failed to send error response:', emitError);
            }
        }
    });
    socket.on('request_participants', (0, requestParticipants_1.requestParticipantsHandler)(io, socket));
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
var index_1 = require("../tournament/index");
Object.defineProperty(exports, "registerTournamentHandlers", { enumerable: true, get: function () { return index_1.registerTournamentHandlers; } });
