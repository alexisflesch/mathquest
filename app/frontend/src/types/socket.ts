/**
 * Socket.IO Type Definitions
 * 
 * Centralized type definitions for Socket.IO events and data structures
 * to eliminate 'any' types and provide proper type safety.
 */

import { Socket } from 'socket.io-client';

// Answer types for different question formats
export type AnswerValue = number | number[] | string | string[] | boolean;

// Socket configuration types
export interface SocketConfig {
    query?: Record<string, string>;
    auth?: Record<string, string>;
    timeout?: number;
    [key: string]: unknown;
}

// Base socket configuration
export interface BaseSocketConfig {
    [key: string]: unknown;
}

// Question-related types for socket events
export interface SocketQuestion {
    uid: string;
    text: string;
    type: string;
    answers: Array<{
        text: string;
        correct: boolean;
    }>;
    title?: string;
    time?: number;
    difficulty?: number;
    discipline?: string;
    level?: string;
    themes?: string[];
    explanation?: string;
    // Tournament-specific properties
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    questionState?: 'active' | 'paused' | 'stopped';
}

// Answer submission interface
export interface AnswerSubmission {
    accessCode: string;
    userId: string;
    questionId: string;
    answer: AnswerValue;
    timeSpent: number;
}

// Answer feedback interface
export interface AnswerFeedback {
    rejected?: boolean;
    received?: boolean;
    message?: string;
    correct?: boolean;
    questionId?: string;
    timeSpent?: number;
    correctAnswers?: number[];
    explanation?: string;
}

// Socket event handlers
export interface SocketEventHandlers {
    [event: string]: (...args: unknown[]) => void;
}

// Mock socket interface for testing
export interface MockSocket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    on: jest.Mock;
    off: jest.Mock;
    emit: jest.Mock;
    connect: jest.Mock;
    disconnect: jest.Mock;
    once: jest.Mock;
}

// Enhanced Socket type with proper typing
export interface TypedSocket extends Socket {
    on<T = unknown>(event: string, listener: (...args: T[]) => void): this;
    emit<T = unknown>(event: string, ...args: T[]): this;
    once<T = unknown>(event: string, listener: (...args: T[]) => void): this;
}

// Participant data structure
export interface SocketParticipant {
    id: string;
    username: string;
    avatar?: string;
    score?: number;
    connected?: boolean;
    ready?: boolean;
}

// Game state structures
export interface GameStateUpdate {
    status: 'waiting' | 'active' | 'paused' | 'finished';
    currentQuestion?: SocketQuestion;
    questionIndex?: number;
    totalQuestions?: number;
    timer?: number;
    participants?: SocketParticipant[];
}

// Timer update structure - what frontend receives in timer_update events
export interface TimerUpdate {
    timeLeft: number;
    status?: 'play' | 'pause' | 'stop';
    timestamp?: number;
}

// Game timer object - what backend sends in game_timer_updated events
export interface GameTimer {
    isPaused: boolean;
    timeRemaining?: number;
    startedAt?: number;
    duration?: number;
}

// Game timer update event payload
export interface GameTimerUpdate {
    timer: GameTimer;
}

// Teacher socket payload interfaces
export interface SetQuestionPayload {
    gameId: string | null;
    questionUid: string;
}

export interface TimerActionPayload {
    gameId: string | null;
    action: 'start' | 'pause' | 'stop';
    duration?: number;
}

export interface GameErrorDetails {
    message?: string;
    code?: string;
    details?: Record<string, unknown>;
    error?: string;
}

export type { Socket } from 'socket.io-client';
