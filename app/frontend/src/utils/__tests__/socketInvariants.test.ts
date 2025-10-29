/**
 * Tests for Socket Invariants
 * Phase 4: Guardrails
 */

import { EventEmitter } from 'events';
import {
    checkListenerCount,
    checkAllListenerCounts,
    getListenerDiagnostics
} from '../socketInvariants';

// Mock Socket.IO client
class MockSocket extends EventEmitter {
    constructor() {
        super();
    }
}

describe('Socket Invariants', () => {
    let mockSocket: MockSocket;

    beforeEach(() => {
        mockSocket = new MockSocket();
        // Clear console methods to avoid noise
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('checkListenerCount', () => {
        it('should not warn for low listener counts', () => {
            const mockHandler = jest.fn();
            mockSocket.on('test_event', mockHandler);

            checkListenerCount(mockSocket as any, 'test_event');

            expect(console.warn).not.toHaveBeenCalled();
        });

        it('should warn when listener count exceeds warning threshold', () => {
            // Add 5 listeners (warning threshold)
            for (let i = 0; i < 5; i++) {
                mockSocket.on('test_event', jest.fn());
            }

            checkListenerCount(mockSocket as any, 'test_event');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('High listener count for "test_event": 5 listeners')
            );
        });

        it('should throw in development when critical threshold exceeded', () => {
            // Add 10 listeners (critical threshold)
            for (let i = 0; i < 10; i++) {
                mockSocket.on('test_event', jest.fn());
            }

            // In development (NODE_ENV=test), should throw
            expect(() => {
                checkListenerCount(mockSocket as any, 'test_event');
            }).toThrow('INVARIANT VIOLATION');
        });
    });

    describe('checkAllListenerCounts', () => {
        it('should check multiple events', () => {
            // Add listeners to multiple events
            mockSocket.on('event1', jest.fn());
            mockSocket.on('event2', jest.fn());
            mockSocket.on('event3', jest.fn());

            checkAllListenerCounts(mockSocket as any);

            // Should not warn for low counts
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('should warn for multiple events with high counts', () => {
            // Add 5 listeners to two different events
            for (let i = 0; i < 5; i++) {
                mockSocket.on('event1', jest.fn());
                mockSocket.on('event2', jest.fn());
            }

            // Mock checkListenerCount to avoid throwing
            jest.spyOn(console, 'warn');

            try {
                checkAllListenerCounts(mockSocket as any);
            } catch (e) {
                // Ignore throw in test env
            }

            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('getListenerDiagnostics', () => {
        it('should return empty diagnostics for null socket', () => {
            const diagnostics = getListenerDiagnostics(null);

            expect(diagnostics).toEqual({
                totalEvents: 0,
                totalListeners: 0,
                eventDetails: [],
                violations: 0
            });
        });

        it('should return diagnostics for socket with listeners', () => {
            mockSocket.on('event1', jest.fn());
            mockSocket.on('event1', jest.fn());
            mockSocket.on('event2', jest.fn());

            const diagnostics = getListenerDiagnostics(mockSocket as any);

            expect(diagnostics.totalEvents).toBe(2);
            expect(diagnostics.totalListeners).toBe(3);
            expect(diagnostics.eventDetails).toHaveLength(2);
            expect(diagnostics.violations).toBe(0); // No high counts
        });

        it('should detect violations for high listener counts', () => {
            // Add 6 listeners to one event (exceeds warning threshold)
            for (let i = 0; i < 6; i++) {
                mockSocket.on('test_event', jest.fn());
            }

            const diagnostics = getListenerDiagnostics(mockSocket as any);

            expect(diagnostics.violations).toBe(1);
            expect(diagnostics.eventDetails[0].isHigh).toBe(true);
            expect(diagnostics.eventDetails[0].count).toBe(6);
        });

        it('should sort events by listener count descending', () => {
            // Add different numbers of listeners
            mockSocket.on('low', jest.fn());

            for (let i = 0; i < 3; i++) {
                mockSocket.on('medium', jest.fn());
            }

            for (let i = 0; i < 5; i++) {
                mockSocket.on('high', jest.fn());
            }

            const diagnostics = getListenerDiagnostics(mockSocket as any);

            expect(diagnostics.eventDetails[0].event).toBe('high');
            expect(diagnostics.eventDetails[0].count).toBe(5);
            expect(diagnostics.eventDetails[1].event).toBe('medium');
            expect(diagnostics.eventDetails[1].count).toBe(3);
            expect(diagnostics.eventDetails[2].event).toBe('low');
            expect(diagnostics.eventDetails[2].count).toBe(1);
        });
    });

    describe('Listener Leak Detection', () => {
        it('should detect memory leaks from missing cleanup', () => {
            // Simulate useEffect without cleanup
            const simulateEffectWithoutCleanup = () => {
                mockSocket.on('game_question', jest.fn());
            };

            // Run effect multiple times (simulating re-renders)
            simulateEffectWithoutCleanup();
            simulateEffectWithoutCleanup();
            simulateEffectWithoutCleanup();

            const diagnostics = getListenerDiagnostics(mockSocket as any);

            expect(diagnostics.eventDetails[0].count).toBe(3);
            expect(console.warn).not.toHaveBeenCalled(); // Not yet at threshold
        });

        it('should catch listener storm', () => {
            // Simulate rapid reconnects without cleanup
            for (let i = 0; i < 10; i++) {
                mockSocket.on('join_game', jest.fn());
            }

            expect(() => {
                checkListenerCount(mockSocket as any, 'join_game');
            }).toThrow();
        });
    });
});
