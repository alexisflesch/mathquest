/**
 * Configuration Module Exports
 * 
 * Central point for importing all configuration values and utilities.
 */

// Re-export existing configuration
export { API_URL, SOCKET_CONFIG } from '../config';

// Re-export game configuration
export {
    GAME_CONFIG,
    TIMER_CONFIG,
    SOCKET_TIMING_CONFIG,
    UI_CONFIG,
    GAME_FLOW_CONFIG,
    TEST_CONFIG,
    TOURNAMENT_CONFIG,
    validateGameConfig,
    type TimerConfig,
    type SocketTimingConfig,
    type UIConfig,
    type GameFlowConfig,
    type TestConfig,
    type TournamentConfig,
    type GameConfig,
} from './gameConfig';

// Default export for convenience
export { default as gameConfig } from './gameConfig';
