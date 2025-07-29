"use strict";
/**
 * Core Participant Types
 *
 * Consolidated participant/user type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical participant types
 * that should be used throughout the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantStatus = exports.ParticipationType = void 0;
/**
 * Participation type enum to distinguish between live and deferred participation
 */
var ParticipationType;
(function (ParticipationType) {
    ParticipationType["LIVE"] = "LIVE";
    ParticipationType["DEFERRED"] = "DEFERRED";
})(ParticipationType || (exports.ParticipationType = ParticipationType = {}));
/**
 * Participant status enum for unified join flow
 * Tracks the participant's current state in the game lifecycle
 */
var ParticipantStatus;
(function (ParticipantStatus) {
    /** Participant is in the lobby waiting for game to start */
    ParticipantStatus["PENDING"] = "PENDING";
    /** Participant is actively playing the game */
    ParticipantStatus["ACTIVE"] = "ACTIVE";
    /** Participant has completed the game */
    ParticipantStatus["COMPLETED"] = "COMPLETED";
    /** Participant left before game started */
    ParticipantStatus["LEFT"] = "LEFT";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
