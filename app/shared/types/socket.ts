/**
 * Socket Types - Main export file
 * Re-exports all socket-related types from the socket subdirectory
 */

// Re-export individual modules to avoid naming conflicts
import * as SocketEvents from './socket/events';
import * as SocketPayloads from './socket/payloads';
import * as DashboardPayloads from './socket/dashboardPayloads';

export { SocketEvents, SocketPayloads, DashboardPayloads };

// Re-export commonly used types directly
export type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
    JoinGamePayload,
    GameStateUpdatePayload,
    PlayerJoinedGamePayload,
    ErrorPayload,
    NotificationPayload
} from './socketEvents';

// Generic socket types
export type SocketResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
};

export type SocketError = {
    code: string;
    message: string;
    details?: any;
};

export type RoomInfo = {
    roomId: string;
    participants: number;
    isActive: boolean;
    gameType?: string;
};

export type ConnectionStatus = {
    connected: boolean;
    roomId?: string;
    userId?: string;
    timestamp: number;
};

// Common socket event types
export type JoinRoomEvent = {
    roomId: string;
    userId: string;
    userInfo: {
        username: string;
        avatar?: string;
    };
};

export type LeaveRoomEvent = {
    roomId: string;
    userId: string;
};

export type GameUpdateEvent = {
    roomId: string;
    gameState: any;
    timestamp: number;
};

// Socket configuration type
export type SocketConfig = {
    url: string;
    auth?: {
        token?: string;
        userId?: string;
    };
    timeout?: number;
    options?: {
        timeout?: number;
        autoConnect?: boolean;
        transports?: string[];
        forceNew?: boolean;
    };
};
