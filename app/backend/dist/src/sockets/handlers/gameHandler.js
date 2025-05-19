"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameHandler = gameHandler;
const game_1 = require("./game");
/**
 * Register all game-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function gameHandler(io, socket) {
    // Register all handlers from the refactored module
    (0, game_1.registerGameHandlers)(io, socket);
}
exports.default = gameHandler;
