/**
 * Game-related shared types
 */

export type PlayMode = 'quiz' | 'tournament' | 'practice'; // Use union type for Prisma compatibility

export interface GameTemplate {
    id: string;
    name: string;
    gradeLevel?: string | null; // Allow null for Prisma compatibility
    themes: string[];
    discipline?: string | null; // Allow null for Prisma compatibility
    description?: string | null; // Allow null for Prisma compatibility
    defaultMode?: PlayMode | null; // Allow null for Prisma compatibility
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    // Relations
    creator?: any; // User type would go here
    questions?: any[]; // QuestionsInGameTemplate[] would go here
    gameInstances?: GameInstance[];
}

export interface GameInstance {
    id: string;
    name: string;
    accessCode: string;
    status: string;
    playMode: PlayMode;
    leaderboard?: any; // JSON
    currentQuestionIndex?: number | null; // Allow null for Prisma compatibility
    settings?: any; // JSON
    createdAt: Date;
    startedAt?: Date | null; // Allow null for Prisma compatibility
    endedAt?: Date | null; // Allow null for Prisma compatibility
    differedAvailableFrom?: Date | null; // Allow null for Prisma compatibility
    differedAvailableTo?: Date | null; // Allow null for Prisma compatibility
    gameTemplateId: string;
    initiatorUserId?: string | null; // Allow null for Prisma compatibility
    // Relations
    gameTemplate?: GameTemplate;
    initiatorUser?: any; // User type would go here
    participants?: GameParticipantRecord[]; // GameParticipant[] would go here
}

export interface GameParticipantRecord {
    id: string;
    joinedAt: Date;
    avatarAnimal?: string;
    answers?: any; // JSON
    gameInstanceId: string;
    userId: string;
    // Relations
    gameInstance?: GameInstance;
    user?: any; // User type would go here
}

// Creation/Update interfaces
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
    differedAvailableFrom?: Date;
    differedAvailableTo?: Date;
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
    /** Canonical timer state for the current question (projection/dashboard only) */
    timer?: import('./timer').GameTimerState;
    /** Timestamp when game started */
    startedAt?: number;
    /** Whether answers are currently locked */
    answersLocked: boolean;
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
 * Game status enumeration
 * Represents the current lifecycle state of a game instance
 */
export type GameStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived';
