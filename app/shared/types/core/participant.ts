/**
 * Core Participant Types
 * 
 * Consolidated participant/user type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical participant types
 * that should be used throughout the application.
 */

/**
 * Participation type enum to distinguish between live and deferred participation
 */
export enum ParticipationType {
    LIVE = 'LIVE',
    DEFERRED = 'DEFERRED'
}

/**
 * Participant status enum for unified join flow
 * Tracks the participant's current state in the game lifecycle
 */
export enum ParticipantStatus {
    /** Participant is in the lobby waiting for game to start */
    PENDING = 'PENDING',
    /** Participant is actively playing the game */
    ACTIVE = 'ACTIVE',
    /** Participant has completed the game */
    COMPLETED = 'COMPLETED',
    /** Participant left before game started */
    LEFT = 'LEFT'
}

/**
 * Base participant interface with core properties
 * Used as foundation for all participant-related types
 */
export interface BaseParticipant {
    /** Unique identifier for the participant */
    id: string;
    /** Display name for the participant */
    username: string;
    /** Avatar emoji representation */
    avatarEmoji: string;
    /** Current score in the game/tournament */
    score: number;
}

/**
 * Extended participant interface for game sessions
 * Includes session-specific properties and state
 */
export interface GameParticipant extends BaseParticipant {
    /** User ID from the database */
    userId: string;
    /** Socket ID for real-time communication */
    socketId?: string;
    /** Whether participant is online/connected */
    online?: boolean;
    /** Timestamp when participant joined the session */
    joinedAt?: number | string;
    /** Whether participant is in deferred mode */
    isDeferred?: boolean;
    /** Current status in the game lifecycle */
    status?: ParticipantStatus;
    /** Number of attempts for this tournament */
    attemptCount?: number;
    /** Backup identifier for session management */
    cookieId?: string;
}

/**
 * Tournament-specific participant interface
 * Extends game participant with tournament features
 */
export interface TournamentParticipant extends GameParticipant {
    /** Questions scored by this participant */
    scoredQuestions?: Record<string, number>;
    /** Tournament-specific answer history */
    answers?: TournamentAnswer[];
}

/**
 * Leaderboard entry interface
 * Optimized for leaderboard display with ranking
 */
export interface LeaderboardEntry {
    /** User ID from database */
    userId: string;
    /** Display name */
    username: string;
    /** Avatar emoji representation */
    avatarEmoji?: string;
    /** Current score */
    score: number;
    /** Calculated rank position */
    rank?: number;
    /** Current status in the game lifecycle */
    status?: ParticipantStatus;
    /** Number of attempts for this tournament */
    attemptCount?: number;
    /** Unique ID for this specific participation (optional for backwards compatibility) */
    participationId?: string;
    /** Participation type to distinguish between live and deferred scores */
    participationType?: ParticipationType;
}

/**
 * Tournament answer interface
 * Represents a single answer in tournament context
 */
export interface TournamentAnswer {
    /** Question identifier */
    questionUid?: string;
    /** Selected answer index or indices */
    answerIdx?: number | number[];
    /** Answer value (flexible type) */
    value?: any;
    /** Server timestamp when answer was received */
    timestamp?: number;
    /** Client timestamp when answer was submitted */
    clientTimestamp?: number;
    /** Score awarded for this answer */
    score?: number;
    /** Time penalty applied */
    timePenalty?: number;
    /** Base score before penalties */
    baseScore?: number;
    /** Time spent on question in milliseconds */
    timeMs?: number;
    /** Whether the answer was correct */
    isCorrect?: boolean;
}

/**
 * Participant data interface for socket communication
 * Used in real-time communication payloads
 */
export interface ParticipantData extends GameParticipant {
    // Inherits avatarEmoji as required string from GameParticipant
}

/**
 * Type alias for backward compatibility with existing socketEvents.ts
 * @deprecated Use ParticipantData instead
 */
export type SocketParticipantData = ParticipantData;

/**
 * Type alias for backward compatibility with leaderboard systems
 * @deprecated Use LeaderboardEntry instead
 */
export type LeaderboardEntryData = LeaderboardEntry;
