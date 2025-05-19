"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGameHandlers = registerGameHandlers;
const joinGame_1 = require("./joinGame");
const gameAnswer_1 = require("./gameAnswer");
const requestParticipants_1 = require("./requestParticipants");
const disconnect_1 = require("./disconnect");
function registerGameHandlers(io, socket) {
    socket.on('join_game', (0, joinGame_1.joinGameHandler)(io, socket));
    socket.on('game_answer', (0, gameAnswer_1.gameAnswerHandler)(io, socket));
    socket.on('request_participants', (0, requestParticipants_1.requestParticipantsHandler)(io, socket));
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
}
