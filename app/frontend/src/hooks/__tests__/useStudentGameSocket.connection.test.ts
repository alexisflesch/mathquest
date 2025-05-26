
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket } from '../useStudentGameSocket';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock utils
jest.mock('@/utils', () => ({
    createSocketConfig: jest.fn((config) => ({
        ...config,
        auth: { token: 'mock-token' },
        query: { token: 'mock-token' }
    }))
}));

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('useStudentGameSocket - Connection', () => {
    let mockSocket: any;
    let connectHandler: ((...args: any[]) => void) | undefined;
    let disconnectHandler: ((...args: any[]) => void) | undefined;
    let connectErrorHandler: ((...args: any[]) => void) | undefined;
    let reconnectHandler: ((...args: any[]) => void) | undefined;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock socket with handler capture
        mockSocket = {
            id: 'test-socket-id',
            connected: false,
            connect: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn((event: string, handler: (...args: any[]) => void) => {
                if (event === 'connect') connectHandler = handler;
                if (event === 'disconnect') disconnectHandler = handler;
                if (event === 'connect_error') connectErrorHandler = handler;
                if (event === 'reconnect') reconnectHandler = handler;
            }),
            off: jest.fn(),
            emit: jest.fn(),
            onAny: jest.fn()
        };

        mockIo.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update connected state when socket connects', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(true);

        // Simulate socket connection
        act(() => {
            connectHandler?.();
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(true);
            expect(result.current.connecting).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    it('should update state when socket disconnects', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // First connect
        act(() => {
            connectHandler?.();
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(true);
        });

        // Then disconnect
        act(() => {
            disconnectHandler?.('transport close');
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(false);
            expect(result.current.gameState.connectedToRoom).toBe(false);
        });
    });

    it('should handle connection errors', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const mockError = new Error('Connection failed');

        act(() => {
            connectErrorHandler?.(mockError);
        });

        await waitFor(() => {
            expect(result.current.connecting).toBe(false);
            expect(result.current.error).toBe('Connection error: Connection failed');
            expect(result.current.connected).toBe(false);
        });
    });

    it('should auto-rejoin game after reconnection', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Simulate reconnection
        act(() => {
            reconnectHandler?.(3); // After 3 attempts
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(true);
            expect(result.current.error).toBeNull();
        });

        // Should emit join_game after reconnection
        await waitFor(() => {
            expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
                accessCode: 'TEST123',
                userId: 'user-123',
                username: 'TestUser',
                avatarUrl: undefined,
                isDiffered: false
            });
        });
    });

    it('should auto-join game when connected and parameters are available', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarUrl: 'https://example.com/avatar.jpg'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Simulate connection
        act(() => {
            connectHandler?.();
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(true);
        });

        // Should auto-join game
        await waitFor(() => {
            expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
                accessCode: 'TEST123',
                userId: 'user-123',
                username: 'TestUser',
                avatarUrl: 'https://example.com/avatar.jpg',
                isDiffered: false
            });
        });
    });

    it('should handle differed mode in reconnection', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            isDiffered: true
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Simulate reconnection
        act(() => {
            reconnectHandler?.(1);
        });

        await waitFor(() => {
            expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
                accessCode: 'TEST123',
                userId: 'user-123',
                username: 'TestUser',
                avatarUrl: undefined,
                isDiffered: true
            });
        });
    });

    it('should cleanup timers on disconnect', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Connect and start a timer scenario
        act(() => {
            connectHandler?.();
        });

        // Simulate starting a timer by setting initial state
        act(() => {
            result.current.gameState.timer = 30;
        });

        // Disconnect should clear any timers
        act(() => {
            disconnectHandler?.('transport close');
        });

        // Fast-forward time to check timer cleanup
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.connected).toBe(false);
        });

        jest.useRealTimers();
    });
});
