"use strict";
// Utility functions for deferred tournament logic
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeferredTournament = isDeferredTournament;
exports.isDeferredAvailable = isDeferredAvailable;
/**
 * Determines if a game instance is in deferred mode based on status and deferred window fields
 * @param gameInstance - The game instance to check
 * @returns True if the game is in deferred mode and within the deferred window
 */
function isDeferredTournament(gameInstance) {
    // Only tournaments can be deferred
    if (gameInstance.playMode !== 'tournament') {
        return false;
    }
    // Must be ended status to be deferred
    if (gameInstance.status !== 'ended') {
        return false;
    }
    // Must have deferred window fields set
    if (!gameInstance.differedAvailableFrom || !gameInstance.differedAvailableTo) {
        return false;
    }
    const now = new Date();
    const from = new Date(gameInstance.differedAvailableFrom);
    const to = new Date(gameInstance.differedAvailableTo);
    // Check if we're within the deferred window
    return now >= from && now <= to;
}
/**
 * Checks if a game is available for deferred mode (ended tournament with deferred window)
 * @param gameInstance - The game instance to check
 * @returns True if the game is available for deferred mode (regardless of current time)
 */
function isDeferredAvailable(gameInstance) {
    // Only tournaments can be deferred
    if (gameInstance.playMode !== 'tournament') {
        return false;
    }
    // Must be ended status to be deferred
    if (gameInstance.status !== 'ended') {
        return false;
    }
    // Must have deferred window fields set
    return !!(gameInstance.differedAvailableFrom && gameInstance.differedAvailableTo);
}
