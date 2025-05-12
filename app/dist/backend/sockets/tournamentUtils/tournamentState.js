/**
 * tournamentState.ts - Tournament State Management
 *
 * This module provides a centralized in-memory state store for all active tournaments.
 */
const tournamentState = {};
export { tournamentState };
// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tournamentState };
}
