/**
 * Authentication Constants
 * 
 * Centralized constants for authentication to prevent cookie name mismatches
 * and ensure consistency across the entire application.
 * 
 * NEVER use hardcoded cookie names - always import from this file!
 */

import { FRONTEND_AUTH_ENDPOINTS } from './api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Cookie Names
export const COOKIE_NAMES = {
    TEACHER_TOKEN: 'teacherToken',
    AUTH_TOKEN: 'authToken',
    STUDENT_SESSION: 'studentSession'
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
    TEACHER_ID: 'mathquest_teacher_id',
    USERNAME: 'mathquest_username',
    AVATAR: 'mathquest_avatar',
    COOKIE_ID: 'mathquest_cookie_id',
    PSEUDO: 'mathquest_pseudo'
} as const;

// API Endpoints - Reference centralized API constants
export const AUTH_ENDPOINTS = FRONTEND_AUTH_ENDPOINTS;

// Auth States
export const AUTH_STATES = {
    ANONYMOUS: 'anonymous',
    GUEST: 'guest',
    STUDENT: 'student',
    TEACHER: 'teacher'
} as const;

export type AuthState = typeof AUTH_STATES[keyof typeof AUTH_STATES];
export type CookieName = typeof COOKIE_NAMES[keyof typeof COOKIE_NAMES];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
