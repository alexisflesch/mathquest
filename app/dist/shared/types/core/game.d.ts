/**
 * Game-related shared types
 */
export type PlayMode = 'quiz' | 'tournament' | 'practice' | 'class';
export interface GameTemplate {
    id: string;
    name: string;
    gradeLevel?: string | null;
    themes: string[];
    discipline?: string | null;
    description?: string | null;
    defaultMode?: PlayMode | null;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    creator?: any;
    questions?: any[];
    gameInstances?: GameInstance[];
}
export interface GameInstance {
    id: string;
    name: string;
    accessCode: string;
    status: string;
    playMode: PlayMode;
    leaderboard?: any;
    currentQuestionIndex?: number | null;
    settings?: any;
    createdAt: Date;
    startedAt?: Date | null;
    endedAt?: Date | null;
    differedAvailableFrom?: Date | null;
    differedAvailableTo?: Date | null;
    isDiffered: boolean;
    gameTemplateId: string;
    initiatorUserId?: string | null;
    gameTemplate?: GameTemplate;
    initiatorUser?: any;
    participants?: GameParticipantRecord[];
}
export interface GameParticipantRecord {
    id: string;
    joinedAt: Date;
    avatarAnimal?: string;
    answers?: any;
    gameInstanceId: string;
    userId: string;
    gameInstance?: GameInstance;
    user?: any;
}
export interface GameTemplateCreationData {
    name: string;
    gradeLevel?: string;
    themes: string[];
    discipline?: string;
    description?: string;
    defaultMode?: PlayMode;
    creatorId: string;
}
export interface GameTemplateUpdateData {
    name?: string;
    gradeLevel?: string;
    themes?: string[];
    discipline?: string;
    description?: string;
    defaultMode?: PlayMode;
}
export interface GameInstanceCreationData {
    name: string;
    accessCode: string;
    status: string;
    playMode: PlayMode;
    gameTemplateId: string;
    initiatorUserId?: string;
    settings?: any;
    isDiffered?: boolean;
    differedAvailableFrom?: Date;
    differedAvailableTo?: Date;
}
export interface GameInstanceUpdateData {
    name?: string;
    status?: string;
    currentQuestionIndex?: number | null;
    leaderboard?: any;
    settings?: any;
    startedAt?: Date | null;
    endedAt?: Date | null;
}
/**
 * Game state interface for runtime game management
 * Used to track active game state in Redis and memory
 */
export interface GameState {
    /** Database ID of the game instance */
    gameId: string;
    /** Access code for joining the game */
    accessCode: string;
    /** Current status of the game */
    status: 'pending' | 'active' | 'paused' | 'completed';
    /** Index of the current question being displayed */
    currentQuestionIndex: number;
    /** Array of question UIDs in order */
    questionUids: string[];
    /** Data of the current question (sent to clients) */
    questionData?: any;
    /** Timestamp when game started */
    startedAt?: number;
    /** Whether answers are currently locked */
    answersLocked: boolean;
    /** Timer state using shared timer interface */
    timer: import('./timer').GameTimerState;
    /** Game mode for this instance */
    gameMode: PlayMode;
    /** Linked quiz/template ID if applicable */
    linkedQuizId?: string | null;
    /** Game configuration settings */
    settings: {
        /** Multiplier for question time limits */
        timeMultiplier: number;
        /** Whether to show leaderboard between questions */
        showLeaderboard: boolean;
    };
}
/**
 * Full game state response from getFullGameState service
 * This is the canonical payload structure sent to projection and dashboard
 */
export interface FullGameStateResponse {
    /** Access code for the game */
    accessCode: string;
    /** Current game state */
    gameState: GameState;
    /** List of participants in the game */
    participants: any[];
    /** Answers submitted by participants */
    answers: Record<string, any[]>;
    /** Current leaderboard data */
    leaderboard: any[];
}
/**
 * Game status enumeration
 * Represents the current lifecycle state of a game instance
 */
export type GameStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived';
