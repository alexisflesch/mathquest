export interface JoinGamePayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    isDiffered?: boolean;
}
export interface GameAnswerPayload {
    accessCode: string;
    userId: string;
    questionId: string;
    answer: any;
    timeSpent: number;
}
export interface ErrorPayload {
    message: string;
    code?: string | number;
}
export interface GameAlreadyPlayedPayload {
    accessCode: string;
}
export interface GameJoinedPayload {
    accessCode: string;
    participant: ParticipantData;
    gameStatus: 'pending' | 'active' | 'completed' | 'archived';
    isDiffered: boolean;
    differedAvailableFrom?: string;
    differedAvailableTo?: string;
}
export interface PlayerJoinedGamePayload {
    participant: ParticipantData;
}
export interface NotificationPayload {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
}
export interface QuestionData {
    uid: string;
    title?: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    timeLimit?: number;
    currentQuestionIndex?: number;
    totalQuestions?: number;
}
export interface ParticipantData {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    score?: number;
    online?: boolean;
    joinedAt?: number | string;
}
export interface LeaderboardEntryData {
    userId: string;
    username: string;
    avatarUrl?: string;
    score: number;
    rank?: number;
}
export interface ClientToServerEvents {
    join_game: (payload: JoinGamePayload) => void;
    game_answer: (payload: GameAnswerPayload) => void;
    request_participants: (payload: {
        accessCode: string;
    }) => void;
    teacher_set_question: (payload: {
        accessCode: string;
        questionUid: string;
        questionIndex: number;
    }) => void;
    teacher_timer_action: (payload: {
        accessCode: string;
        action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';
        duration?: number;
    }) => void;
    teacher_lock_answers: (payload: {
        accessCode: string;
        lock: boolean;
    }) => void;
    teacher_end_game: (payload: {
        accessCode: string;
    }) => void;
}
export interface ServerToClientEvents {
    connect: () => void;
    disconnect: (reason: string) => void;
    connection_established: (payload: {
        socketId: string;
        timestamp: string;
        user: Partial<SocketData>;
    }) => void;
    game_joined: (payload: GameJoinedPayload) => void;
    game_question: (payload: QuestionData) => void;
    answer_received: (payload: {
        questionId: string;
        timeSpent: number;
    }) => void;
    leaderboard_update: (payload: {
        leaderboard: LeaderboardEntryData[];
    }) => void;
    player_joined_game: (payload: PlayerJoinedGamePayload) => void;
    player_left_game: (payload: {
        userId: string;
        socketId: string;
    }) => void;
    game_participants: (payload: {
        participants: ParticipantData[];
    }) => void;
    game_control_question_set: (payload: {
        questionIndex: number;
        timer: any;
    }) => void;
    game_control_question_ended: (payload: {
        questionIndex: number;
        answers: any;
        leaderboard: any;
    }) => void;
    question_ended: (payload: {
        questionIndex: number;
        questionUid?: string;
        showLeaderboard?: boolean;
    }) => void;
    game_state_update: (payload: any) => void;
    timer_update: (payload: {
        timeLeft: number | null;
        running: boolean;
        duration?: number;
    }) => void;
    answers_locked: (payload: {
        locked: boolean;
    }) => void;
    game_ended: (payload: {
        accessCode: string;
    }) => void;
    game_error: (payload: ErrorPayload) => void;
    game_already_played: (payload: GameAlreadyPlayedPayload) => void;
    notification: (payload: NotificationPayload) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    userId?: string;
    username?: string;
    role?: 'player' | 'teacher' | 'admin' | 'projector';
    accessCode?: string;
    currentGameRoom?: string;
    userId?: string;
}
