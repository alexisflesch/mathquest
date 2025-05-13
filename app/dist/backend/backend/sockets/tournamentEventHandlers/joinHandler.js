"use strict";
/**
 * joinHandler.ts - Tournament Join Handler (Stub)
 *
 * This is a temporary stub implementation that will be completed later.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handle join_tournament event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The join payload from the client
 */
async function handleJoinTournament(io, socket, payload) {
    // This is a stub implementation that delegates to the legacy JS handler
    const legacyHandler = require('./joinHandler.js');
    return legacyHandler(io, socket, payload);
}
exports.default = handleJoinTournament;
