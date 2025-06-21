"use strict";
/**
 * Core Participant Types
 *
 * Consolidated participant/user type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical participant types
 * that should be used throughout the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationType = void 0;
/**
 * Participation type enum to distinguish between live and deferred participation
 */
var ParticipationType;
(function (ParticipationType) {
    ParticipationType["LIVE"] = "LIVE";
    ParticipationType["DEFERRED"] = "DEFERRED";
})(ParticipationType || (exports.ParticipationType = ParticipationType = {}));
