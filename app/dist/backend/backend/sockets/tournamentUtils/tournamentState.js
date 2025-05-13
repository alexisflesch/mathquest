"use strict";
/**
 * tournamentState.ts - Tournament State Management
 *
 * This module provides a centralized in-memory state store for all active tournaments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentState = void 0;
const tournamentState = {};
exports.tournamentState = tournamentState;
// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tournamentState };
}
