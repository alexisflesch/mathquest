"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameHandler = gameHandler;
const sharedLiveHandler_1 = require("./sharedLiveHandler");
/**
 * Register all game-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function gameHandler(io, socket) {
    // Register shared live handlers for join/answer
    (0, sharedLiveHandler_1.registerSharedLiveHandlers)(io, socket);
    // Import and register game-specific handlers from the ./game directory
    const { registerGameHandlers } = require('./game');
    registerGameHandlers(io, socket);
}
exports.default = gameHandler;
