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
