/**
 * API Constants for MathQuest
 * 
 * Centralized API endpoint definitions to eliminate hardcoded URLs
 * throughout the application.
 */

// Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';
export const FRONTEND_API_BASE = '/api';

// Authentication Endpoints (Frontend API routes)
export const FRONTEND_AUTH_ENDPOINTS = {
    LOGIN: '/api/auth/universal-login',
    LOGOUT: '/api/auth/logout',
    STATUS: '/api/auth/status',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    UPGRADE: '/api/auth/upgrade',
    RESET_PASSWORD_CONFIRM: '/api/v1/auth/reset-password/confirm',
    CLEAR_COOKIES: '/api/auth/clear-cookies'
} as const;

// Backend API Endpoints (V1 API)
export const BACKEND_ENDPOINTS = {
    // Questions
    QUESTIONS: 'questions',
    QUESTIONS_FILTERS: 'questions/filters',
    QUESTIONS_COUNT: 'questions/count',

    // Games
    GAMES: 'games',
    GAMES_CREATE: 'games',
    GAMES_STATE: (code: string) => `games/${code}/state`,
    GAMES_JOIN: (code: string) => `games/${code}/join`,

    // Quizzes
    QUIZZES: 'quizzes',
    QUIZ_QUESTIONS: (quizId: string) => `quizzes/${quizId}/questions`,

    // Tournaments
    TOURNAMENTS: 'tournaments',
    TOURNAMENT_CODE: (code: string) => `tournaments/${code}`,
    TOURNAMENT_VERIFY: (code: string) => `tournaments/${code}/verify`,
    TOURNAMENT_LEADERBOARD: (code: string) => `tournaments/${code}/leaderboard`,
    TOURNAMENT_STATUS: (code: string) => `tournaments/${code}/status`,
    MY_TOURNAMENTS: 'tournaments/my-tournaments',

    // Players
    PLAYER_LOOKUP: 'players/lookup',

    // Stats
    STATS: 'stats'
} as const;

// Debug Endpoints
export const DEBUG_ENDPOINTS = {
    COOKIES: '/api/debug-cookies',
    SOCKET_STATS: (socketUrl: string) => `${socketUrl}/api/stats`
} as const;

// HTTP Methods
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE'
} as const;

// Content Types
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded'
} as const;

// API Response Headers
export const API_HEADERS = {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    ACCEPT: 'Accept',
    USER_AGENT: 'User-Agent'
} as const;

// Common API configuration
export const API_CONFIG = {
    TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 second
} as const;

// Socket.IO configuration
export const SOCKET_ENDPOINTS = {
    PATH: '/api/socket.io',
    NAMESPACE: '/'
} as const;
