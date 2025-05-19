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
    // Optionally: registerGameHandlers(io, socket); // keep if there are other game-specific events
}
exports.default = gameHandler;
