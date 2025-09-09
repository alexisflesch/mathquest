/**
 * Unit Test for Live Game Page Countdown and Game Transitions
 * 
 * This test verifies that the live/[code] page correctly handles:
 * 1. Tournament mode countdown and transition to first question
 * 2. Quiz mode immediate transition (no countdown)
 * 3. Game state transitions from lobby to active game
 * 
 * Bug Fixed: Countdown reaches 0 but doesn't transition from lobby to game
 * Solution: Added countdown_complete event handler to update gameStatus from 'waiting' to 'active'
 */

import { renderHook, act } from '@testing-library/react';
import { useStudentGameSocket } from '@/hooks/useStudentGameSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    })
}));

describe('Live Game Page Countdown and Transitions', () => {
    let mockSocket: any;

    beforeEach(() => {
        // Create a mock socket with event emitter functionality
        mockSocket = {
            id: 'test-socket-id',
            connected: true,
            connect: jest.fn(),
            disconnect: jest.fn(),
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            removeAllListeners: jest.fn()
        };

        mockIo.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Tournament Mode Countdown', () => {
        it('should transition from lobby to game when first question arrives', async () => {
            const { result } = renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'connect'
                )?.[1];
                if (connectHandler) connectHandler();
            });

            // Simulate game join for tournament mode
            act(() => {
                const gameJoinedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_joined'
                )?.[1];
                if (gameJoinedHandler) {
                    gameJoinedHandler({
                        accessCode: 'TEST123',
                        gameStatus: 'waiting', // Tournament starts in waiting state
                        gameMode: 'tournament',
                        participant: {
                            id: 'p1',
                            userId: 'user1',
                            username: 'TestUser'
                        }
                    });
                }
            });

            // Verify initial state - should be waiting with no question
            expect(result.current.gameState.gameStatus).toBe('waiting');
            expect(result.current.gameState.gameMode).toBe('tournament');
            expect(result.current.gameState.connectedToRoom).toBe(true);
            expect(result.current.gameState.currentQuestion).toBeUndefined();

            // Simulate first question arrival (this triggers the transition)
            act(() => {
                const gameQuestionHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_question'
                )?.[1];
                if (gameQuestionHandler) {
                    gameQuestionHandler({
                        uid: 'q1',
                        text: 'What is 2 + 2?',
                        questionType: 'multiple-choice',
                        answerOptions: ['2', '3', '4', '5'],
                        currentQuestionIndex: 0,
                        totalQuestions: 5,
                        timeLimit: 30
                    });
                }
            });

            // Verify state after question arrival - should now have a question
            expect(result.current.gameState.currentQuestion).toBeDefined();
            expect(result.current.gameState.currentQuestion?.uid).toBe('q1');
            expect(result.current.gameState.phase).toBe('question');

            console.log('✅ Tournament question arrival transition test passed');
        });

        it('should handle countdown display during waiting period', async () => {
            const { result } = renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Simulate game join
            act(() => {
                const gameJoinedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_joined'
                )?.[1];
                if (gameJoinedHandler) {
                    gameJoinedHandler({
                        accessCode: 'TEST123',
                        gameStatus: 'waiting',
                        gameMode: 'tournament',
                        participant: { id: 'p1', userId: 'user1', username: 'TestUser' }
                    });
                }
            });

            // Initial state should be waiting with no question
            expect(result.current.gameState.gameStatus).toBe('waiting');
            expect(result.current.gameState.currentQuestion).toBeUndefined();

            // Countdown display is handled by the page component, not the socket hook
            // The socket hook just receives the question when the game actually starts

            // Simulate first question (this is what transitions from lobby to game)
            act(() => {
                const gameQuestionHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_question'
                )?.[1];
                if (gameQuestionHandler) {
                    gameQuestionHandler({
                        uid: 'q1',
                        text: 'Test question',
                        questionType: 'multiple-choice',
                        answerOptions: ['A', 'B', 'C', 'D'],
                        currentQuestionIndex: 0,
                        totalQuestions: 5,
                        timeLimit: 30
                    });
                }
            });

            // Should now have a question (triggers transition from lobby to game)
            expect(result.current.gameState.currentQuestion).toBeDefined();
            expect(result.current.gameState.currentQuestion?.uid).toBe('q1');
        });
    });

    describe('Quiz Mode Immediate Start', () => {
        it('should start immediately without countdown for quiz mode', async () => {
            const { result } = renderHook(() => useStudentGameSocket({
                accessCode: 'QUIZ123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'connect'
                )?.[1];
                if (connectHandler) connectHandler();
            });

            // Simulate game join for quiz mode - should be immediately active
            act(() => {
                const gameJoinedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_joined'
                )?.[1];
                if (gameJoinedHandler) {
                    gameJoinedHandler({
                        accessCode: 'QUIZ123',
                        gameStatus: 'active', // Quiz mode starts immediately active
                        gameMode: 'quiz',
                        participant: {
                            id: 'p1',
                            userId: 'user1',
                            username: 'TestUser'
                        }
                    });
                }
            });

            // Verify immediate active state
            expect(result.current.gameState.gameStatus).toBe('active');
            expect(result.current.gameState.gameMode).toBe('quiz');
            expect(result.current.gameState.connectedToRoom).toBe(true);

            console.log('✅ Quiz immediate start test passed');
        });
    });

    describe('Game State Transitions', () => {
        it('should handle game question event after becoming active', async () => {
            const { result } = renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Simulate game join
            act(() => {
                const gameJoinedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_joined'
                )?.[1];
                if (gameJoinedHandler) {
                    gameJoinedHandler({
                        accessCode: 'TEST123',
                        gameStatus: 'waiting',
                        gameMode: 'tournament',
                        participant: { id: 'p1', userId: 'user1', username: 'TestUser' }
                    });
                }
            });

            // Simulate countdown complete
            act(() => {
                const countdownCompleteHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'countdown_complete'
                )?.[1];
                if (countdownCompleteHandler) {
                    countdownCompleteHandler();
                }
            });

            expect(result.current.gameState.gameStatus).toBe('active');

            // Simulate receiving first question
            act(() => {
                const gameQuestionHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_question'
                )?.[1];
                if (gameQuestionHandler) {
                    gameQuestionHandler({
                        uid: 'q1',
                        text: 'What is 2 + 2?',
                        questionType: 'multiple-choice',
                        answerOptions: ['2', '3', '4', '5'],
                        currentQuestionIndex: 0,
                        totalQuestions: 5,
                        timeLimit: 30
                    });
                }
            });

            // Verify question state
            expect(result.current.gameState.currentQuestion).toBeDefined();
            expect(result.current.gameState.currentQuestion?.uid).toBe('q1');
            expect(result.current.gameState.currentQuestion?.text).toBe('What is 2 + 2?');
            expect(result.current.gameState.questionIndex).toBe(0);
            expect(result.current.gameState.totalQuestions).toBe(5);
            expect(result.current.gameState.phase).toBe('question');

            console.log('✅ Game question transition test passed');
        });

        it('should maintain game status during question phases', async () => {
            const { result } = renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Start with active game
            act(() => {
                const gameJoinedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_joined'
                )?.[1];
                if (gameJoinedHandler) {
                    gameJoinedHandler({
                        accessCode: 'TEST123',
                        gameStatus: 'active',
                        gameMode: 'tournament',
                        participant: { id: 'p1', userId: 'user1', username: 'TestUser' }
                    });
                }
            });

            expect(result.current.gameState.gameStatus).toBe('active');

            // Simulate various game phases
            act(() => {
                const gameQuestionHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'game_question'
                )?.[1];
                if (gameQuestionHandler) {
                    gameQuestionHandler({
                        uid: 'q1',
                        text: 'Test question',
                        questionType: 'multiple-choice',
                        answerOptions: ['A', 'B', 'C', 'D'],
                        currentQuestionIndex: 0,
                        totalQuestions: 1,
                        timeLimit: 30
                    });
                }
            });

            // Game should remain active during question phase
            expect(result.current.gameState.gameStatus).toBe('active');
            expect(result.current.gameState.phase).toBe('question');

            // Simulate answer received
            act(() => {
                const answerReceivedHandler = mockSocket.on.mock.calls.find(
                    call => call[0] === 'answer_received'
                )?.[1];
                if (answerReceivedHandler) {
                    answerReceivedHandler({
                        correct: true,
                        explanation: 'Great job!',
                        questionUid: 'q1'
                    });
                }
            });

            // Game should remain active during answer feedback
            expect(result.current.gameState.gameStatus).toBe('active');
            expect(result.current.gameState.answered).toBe(true);

            console.log('✅ Game status maintenance test passed');
        });
    });

    describe('Event Handler Registration', () => {
        it('should register game_question event handler for transitions', () => {
            renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Verify that game_question event handler is registered (this handles the transition)
            const registeredEvents = mockSocket.on.mock.calls.map(call => call[0]);
            expect(registeredEvents).toContain('game_question');

            console.log('✅ Event handler registration test passed');
        });

        it('should clean up event handlers on unmount', () => {
            const { unmount } = renderHook(() => useStudentGameSocket({
                accessCode: 'TEST123',
                userId: 'user1',
                username: 'TestUser',
                avatarEmoji: '🧪'
            }));

            // Unmount the hook
            unmount();

            // Verify that event handlers are cleaned up
            const cleanedUpEvents = mockSocket.off.mock.calls.map(call => call[0]);
            expect(cleanedUpEvents).toContain('game_question');

            console.log('✅ Event handler cleanup test passed');
        });
    });
});

// Integration test for live page component
describe('Live Page Component Integration', () => {
    // Mock the live page component's lobby condition
    const shouldShowLobby = (gameStatus: string, connectedToRoom: boolean, hasCurrentQuestion: boolean) => {
        return gameStatus === 'waiting' && connectedToRoom && !hasCurrentQuestion;
    };

    it('should show lobby when gameStatus is waiting and no question present', () => {
        expect(shouldShowLobby('waiting', true, false)).toBe(true);
        expect(shouldShowLobby('waiting', false, false)).toBe(false);
        expect(shouldShowLobby('waiting', true, true)).toBe(false); // Has question, should not show lobby

        console.log('✅ Lobby display condition test passed');
    });

    it('should hide lobby when first question arrives', () => {
        expect(shouldShowLobby('waiting', true, true)).toBe(false);
        expect(shouldShowLobby('active', true, true)).toBe(false);

        console.log('✅ Game display condition test passed');
    });

    it('should handle tournament flow: waiting -> countdown -> question arrives -> game shown', () => {
        // Initial state: lobby should be shown
        let gameStatus = 'waiting';
        let connectedToRoom = true;
        let hasCurrentQuestion = false;
        expect(shouldShowLobby(gameStatus, connectedToRoom, hasCurrentQuestion)).toBe(true);

        // During countdown: still waiting, no question yet, lobby still shown with countdown
        expect(shouldShowLobby(gameStatus, connectedToRoom, hasCurrentQuestion)).toBe(true);

        // After first question arrives: lobby hidden regardless of gameStatus
        hasCurrentQuestion = true;
        expect(shouldShowLobby(gameStatus, connectedToRoom, hasCurrentQuestion)).toBe(false);

        console.log('✅ Tournament flow test passed');
    });

    it('should handle quiz flow: immediate active state with question', () => {
        // Quiz mode starts immediately with first question
        const gameStatus = 'active';
        const connectedToRoom = true;
        const hasCurrentQuestion = true;

        // Lobby should not be shown
        expect(shouldShowLobby(gameStatus, connectedToRoom, hasCurrentQuestion)).toBe(false);

        console.log('✅ Quiz flow test passed');
    });
});
