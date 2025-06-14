/**
 * Game-related shared types
 */

export type PlayMode = 'quiz' | 'tournament' | 'practice' | 'class'; // Use union type for Prisma compatibility

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
    isDiffered: boolean;
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
    isDiffered?: boolean;
    differedAvailableFrom?: Date;
    differedAvailableTo?: Date;
}

export interface GameInstanceUpdateData {
    name?: string;
    status?: string;
    currentQuestionIndex?: number | null; // Allow null for Prisma compatibility
    leaderboard?: any;
    settings?: any;
    startedAt?: Date | null; // Allow null for Prisma compatibility
    endedAt?: Date | null; // Allow null for Prisma compatibility
}
