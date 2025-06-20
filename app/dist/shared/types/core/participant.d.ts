/**
 * Core Participant Types
 *
 * Consolidated participant/user type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical participant types
 * that should be used throughout the application.
 */
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
 * Lobby participant interface for pre-game lobby management
 * Used specifically in tournament lobbies before games start
 */
export interface LobbyParticipant {
    /** Socket ID serving as temporary identifier */
    id: string;
    /** Display name for the participant */
    username: string;
    /** Avatar emoji representation */
    avatarEmoji: string;
    /** Optional cookie ID for session tracking */
    cookie_id?: string;
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
