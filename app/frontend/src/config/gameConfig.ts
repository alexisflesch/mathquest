/**
 * Game Configuration
 * 
 * Centralized configuration for all game-related timing, intervals, and thresholds.
 * This replaces hard-coded values throughout the application with type-safe defaults
 * that can be overridden via environment variables.
 */

// Environment variable parsing utilities
const parseIntEnv = (envVar: string | undefined, defaultValue: number): number => {
    if (!envVar) return defaultValue;
    const parsed = parseInt(envVar, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolEnv = (envVar: string | undefined, defaultValue: boolean): boolean => {
    if (!envVar) return defaultValue;
    return envVar.toLowerCase() === 'true';
};

// Timer Configuration
export const TIMER_CONFIG = {
    // Default timer durations (in seconds)
    DEFAULT_QUESTION_TIME: parseIntEnv(process.env.NEXT_PUBLIC_DEFAULT_QUESTION_TIME, 30),
    DEFAULT_QUIZ_TIME: parseIntEnv(process.env.NEXT_PUBLIC_DEFAULT_QUIZ_TIME, 20),
    DEFAULT_PRACTICE_TIME: parseIntEnv(process.env.NEXT_PUBLIC_DEFAULT_PRACTICE_TIME, 60),

    // Timer intervals and thresholds (in milliseconds)
    COUNTDOWN_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_COUNTDOWN_INTERVAL, 1000),

    // Role-based UI update intervals - students only see seconds, so they don't need frequent updates
    UI_UPDATE_INTERVAL_TEACHER: parseIntEnv(process.env.NEXT_PUBLIC_TIMER_UI_UPDATE_INTERVAL_TEACHER, 1000), // 1 second for teachers
    UI_UPDATE_INTERVAL_STUDENT: parseIntEnv(process.env.NEXT_PUBLIC_TIMER_UI_UPDATE_INTERVAL_STUDENT, 1000), // 1 second for students
    UI_UPDATE_INTERVAL_PROJECTION: parseIntEnv(process.env.NEXT_PUBLIC_TIMER_UI_UPDATE_INTERVAL_PROJECTION, 100), // 100ms for smooth projection animations

    // Legacy fallback
    UI_UPDATE_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_TIMER_UI_UPDATE_INTERVAL, 1000), // Default to 1 second

    WARNING_THRESHOLD: parseIntEnv(process.env.NEXT_PUBLIC_WARNING_THRESHOLD, 10), // seconds
    CRITICAL_THRESHOLD: parseIntEnv(process.env.NEXT_PUBLIC_CRITICAL_THRESHOLD, 5), // seconds

    // Auto-advance timing
    ANSWER_DISPLAY_DURATION: parseIntEnv(process.env.NEXT_PUBLIC_ANSWER_DISPLAY_DURATION, 3000),
    RESULT_DISPLAY_DURATION: parseIntEnv(process.env.NEXT_PUBLIC_RESULT_DISPLAY_DURATION, 5000),
} as const;

// Socket Configuration Extensions
export const SOCKET_TIMING_CONFIG = {
    // Connection timeouts
    CONNECTION_TIMEOUT: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_CONNECTION_TIMEOUT, 30000),
    RECONNECTION_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_RECONNECTION_DELAY, 1000),
    RECONNECTION_DELAY_MAX: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_RECONNECTION_DELAY_MAX, 10000),

    // Event timeouts
    EVENT_RESPONSE_TIMEOUT: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_EVENT_TIMEOUT, 10000),
    HEARTBEAT_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_HEARTBEAT_INTERVAL, 25000),

    // Retry configuration
    MAX_RETRY_ATTEMPTS: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_MAX_RETRIES, 3),
    RETRY_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_RETRY_DELAY, 2000),
} as const;

// UI Update Configuration
export const UI_CONFIG = {
    // Update intervals and debounce times (in milliseconds)
    LEADERBOARD_UPDATE_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_LEADERBOARD_UPDATE_INTERVAL, 200),
    TIMER_UPDATE_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_TIMER_UPDATE_INTERVAL, 100),
    SCORE_ANIMATION_DURATION: parseIntEnv(process.env.NEXT_PUBLIC_SCORE_ANIMATION_DURATION, 1000),

    // Debounce and throttle values
    INPUT_DEBOUNCE_MS: parseIntEnv(process.env.NEXT_PUBLIC_INPUT_DEBOUNCE_MS, 300),
    SCROLL_THROTTLE_MS: parseIntEnv(process.env.NEXT_PUBLIC_SCROLL_THROTTLE_MS, 100),

    // Animation preferences
    ENABLE_ANIMATIONS: parseBoolEnv(process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS, true),
    REDUCE_MOTION: parseBoolEnv(process.env.NEXT_PUBLIC_REDUCE_MOTION, false),
} as const;

// Game Flow Configuration
export const GAME_FLOW_CONFIG = {
    // Phase transitions (in milliseconds)
    LOBBY_TO_GAME_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_LOBBY_TO_GAME_DELAY, 3000),
    QUESTION_TO_ANSWER_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_QUESTION_TO_ANSWER_DELAY, 1000),
    ANSWER_TO_NEXT_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_ANSWER_TO_NEXT_DELAY, 2000),
    GAME_END_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_GAME_END_DELAY, 5000),

    // Auto-progression settings
    AUTO_START_ENABLED: parseBoolEnv(process.env.NEXT_PUBLIC_AUTO_START_ENABLED, true),
    AUTO_NEXT_QUESTION: parseBoolEnv(process.env.NEXT_PUBLIC_AUTO_NEXT_QUESTION, true),

    // Participation requirements
    MIN_PLAYERS_TO_START: parseIntEnv(process.env.NEXT_PUBLIC_MIN_PLAYERS_TO_START, 1),
    MAX_PLAYERS_PER_GAME: parseIntEnv(process.env.NEXT_PUBLIC_MAX_PLAYERS_PER_GAME, 50),
} as const;

// Test and Development Configuration
export const TEST_CONFIG = {
    // Test timeouts (in milliseconds)
    DEFAULT_TEST_TIMEOUT: parseIntEnv(process.env.NEXT_PUBLIC_TEST_TIMEOUT, 5000),
    SOCKET_TEST_TIMEOUT: parseIntEnv(process.env.NEXT_PUBLIC_SOCKET_TEST_TIMEOUT, 10000),
    INTEGRATION_TEST_TIMEOUT: parseIntEnv(process.env.NEXT_PUBLIC_INTEGRATION_TEST_TIMEOUT, 30000),

    // Mock delays for testing
    MOCK_NETWORK_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_MOCK_NETWORK_DELAY, 100),
    MOCK_PROCESSING_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_MOCK_PROCESSING_DELAY, 500),

    // Debug features
    ENABLE_DEBUG_LOGS: parseBoolEnv(process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS, false),
    ENABLE_PERFORMANCE_MONITORING: parseBoolEnv(process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING, false),
} as const;

// Tournament-specific Configuration
export const TOURNAMENT_CONFIG = {
    // Round timing
    DEFAULT_ROUND_TIME: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_ROUND_TIME, 180), // 3 minutes
    BREAK_BETWEEN_ROUNDS: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_BREAK_TIME, 30000), // 30 seconds

    // Leaderboard updates
    LEADERBOARD_REFRESH_INTERVAL: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_LEADERBOARD_INTERVAL, 1000),
    RANK_CALCULATION_DELAY: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_RANK_DELAY, 500),

    // Elimination settings
    ELIMINATION_PERCENTAGE: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_ELIMINATION_PCT, 50),
    MIN_PLAYERS_FOR_ELIMINATION: parseIntEnv(process.env.NEXT_PUBLIC_TOURNAMENT_MIN_ELIMINATION, 4),
} as const;

// Consolidated Game Configuration
export const GAME_CONFIG = {
    timer: TIMER_CONFIG,
    socket: SOCKET_TIMING_CONFIG,
    ui: UI_CONFIG,
    flow: GAME_FLOW_CONFIG,
    test: TEST_CONFIG,
    tournament: TOURNAMENT_CONFIG,
} as const;

// Type definitions for configuration
export type TimerConfig = typeof TIMER_CONFIG;
export type SocketTimingConfig = typeof SOCKET_TIMING_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type GameFlowConfig = typeof GAME_FLOW_CONFIG;
export type TestConfig = typeof TEST_CONFIG;
export type TournamentConfig = typeof TOURNAMENT_CONFIG;
export type GameConfig = typeof GAME_CONFIG;

// Configuration validation
export const validateGameConfig = (): boolean => {
    const errors: string[] = [];

    // Validate timer configurations
    if (TIMER_CONFIG.DEFAULT_QUESTION_TIME <= 0) {
        errors.push('DEFAULT_QUESTION_TIME must be positive');
    }

    if (TIMER_CONFIG.COUNTDOWN_INTERVAL <= 0) {
        errors.push('COUNTDOWN_INTERVAL must be positive');
    }

    // Validate socket timing
    if (SOCKET_TIMING_CONFIG.CONNECTION_TIMEOUT <= 0) {
        errors.push('CONNECTION_TIMEOUT must be positive');
    }

    // Validate UI update intervals
    if (UI_CONFIG.TIMER_UPDATE_INTERVAL <= 0) {
        errors.push('TIMER_UPDATE_INTERVAL must be positive');
    }

    // Validate game flow timing
    if (GAME_FLOW_CONFIG.MIN_PLAYERS_TO_START <= 0) {
        errors.push('MIN_PLAYERS_TO_START must be positive');
    }

    if (errors.length > 0) {
        console.error('Game configuration validation errors:', errors);
        return false;
    }

    return true;
};

// Initialize and validate configuration on module load
if (typeof window !== 'undefined') {
    // Only validate in browser environment
    validateGameConfig();
}

// Default export for convenience
export default GAME_CONFIG;
