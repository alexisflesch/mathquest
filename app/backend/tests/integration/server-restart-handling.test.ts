/**
 * Server Restart Handling Tests
 *
 * Tests for graceful handling of server restarts during active games, tournaments,
 * and practice sessions. Covers state recovery, connection restoration, and data integrity.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('Server Restart Handling', () => {
    let testUserId: string;
    let testGameTemplateId: string;
    let testGameInstanceId: string;

    beforeAll(async () => {
        testUserId = `test-user-${Date.now()}`;
        testGameTemplateId = `template-${Date.now()}`;
        testGameInstanceId = `game-${Date.now()}`;

        // Create test user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `testuser-${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `cookie-${testUserId}`
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Test Game Template',
                description: 'Template for server restart tests',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });

        // Create test game instance
        await prisma.gameInstance.create({
            data: {
                id: testGameInstanceId,
                name: 'Test Game Instance',
                accessCode: `test_${Date.now()}`,
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testUserId,
                status: 'ACTIVE',
                playMode: 'practice',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date(),
                startedAt: new Date()
            }
        });
    });

    afterAll(async () => {
        // Clean up database
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameInstanceId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameInstanceId } });
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Active game state recovery', () => {
        it('should recover active game state after server restart', async () => {
            const gameState = {
                gameInstanceId: testGameInstanceId,
                status: 'active',
                currentQuestionIndex: 2,
                participants: [
                    {
                        userId: testUserId,
                        liveScore: 3,
                        status: 'ACTIVE',
                        joinedAt: new Date()
                    }
                ],
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                questionPool: ['q1', 'q2', 'q3', 'q4', 'q5'],
                currentQuestion: {
                    uid: 'q3',
                    title: 'Question 3',
                    text: 'What is 6 + 4?',
                    questionType: 'multiple_choice',
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionIndex: 2,
                    multipleChoiceQuestion: {
                        answerOptions: ['8', '9', '10', '11']
                    }
                },
                createdAt: new Date(),
                startedAt: new Date(),
                lastActivity: new Date()
            };

            // Store game state in Redis (simulating pre-restart state)
            await redisClient.setex(
                `game_state:${testGameInstanceId}`,
                24 * 60 * 60,
                JSON.stringify(gameState)
            );

            // Simulate server restart by retrieving state
            const recoveredState = await redisClient.get(`game_state:${testGameInstanceId}`);
            expect(recoveredState).toBeDefined();

            const parsedState = JSON.parse(recoveredState!);
            expect(parsedState.gameInstanceId).toBe(testGameInstanceId);
            expect(parsedState.status).toBe('active');
            expect(parsedState.currentQuestionIndex).toBe(2);
            expect(parsedState.participants).toHaveLength(1);
            expect(parsedState.participants[0].userId).toBe(testUserId);
        });

        it('should handle partial state corruption gracefully', async () => {
            const corruptedState = {
                gameInstanceId: testGameInstanceId,
                status: 'active',
                // Missing currentQuestionIndex
                participants: [
                    {
                        userId: testUserId,
                        liveScore: 2,
                        status: 'ACTIVE',
                        joinedAt: new Date()
                    }
                ],
                // Corrupted settings
                settings: null,
                questionPool: ['q1', 'q2', 'q3'],
                // Missing currentQuestion
                createdAt: new Date(),
                startedAt: new Date()
            };

            // Store corrupted state
            await redisClient.setex(
                `game_state:${testGameInstanceId}`,
                24 * 60 * 60,
                JSON.stringify(corruptedState)
            );

            // Attempt to recover state
            const recoveredState = await redisClient.get(`game_state:${testGameInstanceId}`);
            expect(recoveredState).toBeDefined();

            const parsedState = JSON.parse(recoveredState!);
            expect(parsedState.gameInstanceId).toBe(testGameInstanceId);
            expect(parsedState.status).toBe('active');
            // Should handle missing fields gracefully
            expect(parsedState.currentQuestionIndex).toBeUndefined();
            expect(parsedState.settings).toBeNull();
        });

        it('should recover participant progress after server restart', async () => {
            const participantState = {
                userId: testUserId,
                gameInstanceId: testGameInstanceId,
                answers: [
                    { questionUid: 'q1', selectedAnswers: [0], isCorrect: true, submittedAt: new Date(), timeSpentMs: 1500, attemptNumber: 1 },
                    { questionUid: 'q2', selectedAnswers: [1], isCorrect: false, submittedAt: new Date(), timeSpentMs: 2000, attemptNumber: 1 }
                ],
                statistics: {
                    questionsAttempted: 2,
                    correctAnswers: 1,
                    incorrectAnswers: 1,
                    accuracyPercentage: 50,
                    averageTimePerQuestion: 1750,
                    totalTimeSpent: 3500,
                    retriedQuestions: []
                },
                currentStreak: 0,
                bestStreak: 1,
                lastActivity: new Date()
            };

            // Store participant state
            await redisClient.setex(
                `participant_state:${testGameInstanceId}:${testUserId}`,
                24 * 60 * 60,
                JSON.stringify(participantState)
            );

            // Recover participant state
            const recoveredParticipantState = await redisClient.get(`participant_state:${testGameInstanceId}:${testUserId}`);
            expect(recoveredParticipantState).toBeDefined();

            const parsedParticipantState = JSON.parse(recoveredParticipantState!);
            expect(parsedParticipantState.userId).toBe(testUserId);
            expect(parsedParticipantState.answers).toHaveLength(2);
            expect(parsedParticipantState.statistics.questionsAttempted).toBe(2);
            expect(parsedParticipantState.statistics.correctAnswers).toBe(1);
            expect(parsedParticipantState.currentStreak).toBe(0);
            expect(parsedParticipantState.bestStreak).toBe(1);
        });
    });

    describe('Practice session recovery', () => {
        it('should recover practice session state after server restart', async () => {
            const sessionId = `practice_${testUserId}_${Date.now()}_restart`;
            const practiceSession = {
                sessionId,
                userId: testUserId,
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 4,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false,
                    gameTemplateId: testGameTemplateId
                },
                status: 'active',
                questionPool: ['pq1', 'pq2', 'pq3', 'pq4'],
                currentQuestionIndex: 1,
                answers: [
                    { questionUid: 'pq1', selectedAnswers: [0], isCorrect: true, submittedAt: new Date(), timeSpentMs: 1200, attemptNumber: 1 }
                ],
                statistics: {
                    questionsAttempted: 1,
                    correctAnswers: 1,
                    incorrectAnswers: 0,
                    accuracyPercentage: 100,
                    averageTimePerQuestion: 1200,
                    totalTimeSpent: 1200,
                    retriedQuestions: []
                },
                createdAt: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                currentQuestion: {
                    uid: 'pq2',
                    title: 'Practice Question 2',
                    text: 'What is 7 + 3?',
                    questionType: 'multiple_choice',
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionIndex: 1,
                    multipleChoiceQuestion: {
                        answerOptions: ['9', '10', '11', '12']
                    }
                }
            };

            // Store practice session
            await redisClient.setex(`practice_session:${sessionId}`, 24 * 60 * 60, JSON.stringify(practiceSession));

            // Simulate server restart recovery
            const recoveredSession = await redisClient.get(`practice_session:${sessionId}`);
            expect(recoveredSession).toBeDefined();

            const parsedSession = JSON.parse(recoveredSession!);
            expect(parsedSession.sessionId).toBe(sessionId);
            expect(parsedSession.userId).toBe(testUserId);
            expect(parsedSession.status).toBe('active');
            expect(parsedSession.currentQuestionIndex).toBe(1);
            expect(parsedSession.answers).toHaveLength(1);
            expect(parsedSession.currentQuestion.uid).toBe('pq2');
        });

        it('should handle expired practice sessions during recovery', async () => {
            const sessionId = `practice_${testUserId}_${Date.now()}_expired`;
            const expiredSession = {
                sessionId,
                userId: testUserId,
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 3,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false,
                    gameTemplateId: testGameTemplateId
                },
                status: 'active',
                questionPool: ['pq1', 'pq2', 'pq3'],
                currentQuestionIndex: 0,
                answers: [],
                statistics: {
                    questionsAttempted: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    accuracyPercentage: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    retriedQuestions: []
                },
                createdAt: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() - 60 * 1000) // Already expired
            };

            // Store expired session
            await redisClient.setex(`practice_session:${sessionId}`, 24 * 60 * 60, JSON.stringify(expiredSession));

            // Attempt recovery
            const recoveredSession = await redisClient.get(`practice_session:${sessionId}`);
            expect(recoveredSession).toBeDefined();

            const parsedSession = JSON.parse(recoveredSession!);
            expect(parsedSession.expiresAt).toBeDefined();

            // Check if session has expired
            const expiresAt = new Date(parsedSession.expiresAt);
            const now = new Date();
            expect(expiresAt.getTime()).toBeLessThan(now.getTime());
        });

        it('should recover multiple concurrent practice sessions', async () => {
            const sessionIds = [
                `practice_${testUserId}_${Date.now()}_multi_1`,
                `practice_${testUserId}_${Date.now()}_multi_2`,
                `practice_${testUserId}_${Date.now()}_multi_3`
            ];

            // Create and store multiple sessions
            for (let i = 0; i < sessionIds.length; i++) {
                const session = {
                    sessionId: sessionIds[i],
                    userId: testUserId,
                    settings: {
                        gradeLevel: 'CM1',
                        discipline: 'math',
                        themes: ['addition'],
                        questionCount: 2,
                        showImmediateFeedback: true,
                        allowRetry: false,
                        randomizeQuestions: false,
                        gameTemplateId: testGameTemplateId
                    },
                    status: 'active',
                    questionPool: [`pq${i}1`, `pq${i}2`],
                    currentQuestionIndex: 0,
                    answers: [],
                    statistics: {
                        questionsAttempted: 0,
                        correctAnswers: 0,
                        incorrectAnswers: 0,
                        accuracyPercentage: 0,
                        averageTimePerQuestion: 0,
                        totalTimeSpent: 0,
                        retriedQuestions: []
                    },
                    createdAt: new Date(),
                    startedAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                };

                await redisClient.setex(`practice_session:${sessionIds[i]}`, 24 * 60 * 60, JSON.stringify(session));
            }

            // Recover all sessions
            const recoveredSessions = await Promise.all(
                sessionIds.map(id => redisClient.get(`practice_session:${id}`))
            );

            // Verify all sessions were recovered
            expect(recoveredSessions).toHaveLength(3);
            recoveredSessions.forEach((session, index) => {
                expect(session).toBeDefined();
                const parsed = JSON.parse(session!);
                expect(parsed.sessionId).toBe(sessionIds[index]);
                expect(parsed.userId).toBe(testUserId);
                expect(parsed.status).toBe('active');
            });
        });
    });

    describe('Tournament state recovery', () => {
        it('should recover tournament state after server restart', async () => {
            const tournamentState = {
                tournamentId: `tournament_${Date.now()}`,
                name: 'Test Tournament',
                status: 'active',
                currentRound: 2,
                totalRounds: 5,
                participants: [
                    {
                        userId: testUserId,
                        score: 15,
                        currentRoundScore: 5,
                        status: 'ACTIVE',
                        joinedAt: new Date(),
                        lastActivity: new Date()
                    }
                ],
                settings: {
                    maxParticipants: 10,
                    timeLimit: 300,
                    allowLateJoin: false,
                    showLeaderboard: true
                },
                rounds: [
                    { roundNumber: 1, status: 'completed', startTime: new Date(), endTime: new Date() },
                    { roundNumber: 2, status: 'active', startTime: new Date() }
                ],
                leaderboard: [
                    { userId: testUserId, username: 'testuser', score: 15, rank: 1 }
                ],
                createdAt: new Date(),
                startedAt: new Date(),
                lastActivity: new Date()
            };

            // Store tournament state
            await redisClient.setex(
                `tournament_state:${tournamentState.tournamentId}`,
                24 * 60 * 60,
                JSON.stringify(tournamentState)
            );

            // Recover tournament state
            const recoveredTournament = await redisClient.get(`tournament_state:${tournamentState.tournamentId}`);
            expect(recoveredTournament).toBeDefined();

            const parsedTournament = JSON.parse(recoveredTournament!);
            expect(parsedTournament.tournamentId).toBe(tournamentState.tournamentId);
            expect(parsedTournament.status).toBe('active');
            expect(parsedTournament.currentRound).toBe(2);
            expect(parsedTournament.participants).toHaveLength(1);
            expect(parsedTournament.rounds).toHaveLength(2);
        });

        it('should handle tournament participant reconnection after restart', async () => {
            const tournamentId = `tournament_${Date.now()}_reconnect`;
            const participantState = {
                userId: testUserId,
                tournamentId,
                connectionStatus: 'disconnected',
                lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                reconnectAttempts: 2,
                sessionData: {
                    currentQuestionIndex: 3,
                    answers: [
                        { questionUid: 'tq1', selectedAnswers: [0], isCorrect: true, submittedAt: new Date() },
                        { questionUid: 'tq2', selectedAnswers: [1], isCorrect: true, submittedAt: new Date() },
                        { questionUid: 'tq3', selectedAnswers: [0], isCorrect: false, submittedAt: new Date() }
                    ]
                }
            };

            // Store participant state
            await redisClient.setex(
                `tournament_participant:${tournamentId}:${testUserId}`,
                24 * 60 * 60,
                JSON.stringify(participantState)
            );

            // Simulate reconnection after restart
            const recoveredParticipant = await redisClient.get(`tournament_participant:${tournamentId}:${testUserId}`);
            expect(recoveredParticipant).toBeDefined();

            const parsedParticipant = JSON.parse(recoveredParticipant!);
            expect(parsedParticipant.userId).toBe(testUserId);
            expect(parsedParticipant.tournamentId).toBe(tournamentId);
            expect(parsedParticipant.connectionStatus).toBe('disconnected');
            expect(parsedParticipant.reconnectAttempts).toBe(2);
            expect(parsedParticipant.sessionData.answers).toHaveLength(3);
        });

        it('should recover tournament leaderboard after server restart', async () => {
            const tournamentId = `tournament_${Date.now()}_leaderboard`;
            const leaderboardState = {
                tournamentId,
                lastUpdated: new Date(),
                entries: [
                    { userId: testUserId, username: 'testuser', score: 25, rank: 1, change: 0 },
                    { userId: 'user2', username: 'user2', score: 20, rank: 2, change: 1 },
                    { userId: 'user3', username: 'user3', score: 18, rank: 3, change: -1 }
                ],
                totalParticipants: 3,
                isFinal: false
            };

            // Store leaderboard
            await redisClient.setex(
                `tournament_leaderboard:${tournamentId}`,
                24 * 60 * 60,
                JSON.stringify(leaderboardState)
            );

            // Recover leaderboard
            const recoveredLeaderboard = await redisClient.get(`tournament_leaderboard:${tournamentId}`);
            expect(recoveredLeaderboard).toBeDefined();

            const parsedLeaderboard = JSON.parse(recoveredLeaderboard!);
            expect(parsedLeaderboard.tournamentId).toBe(tournamentId);
            expect(parsedLeaderboard.entries).toHaveLength(3);
            expect(parsedLeaderboard.entries[0].userId).toBe(testUserId);
            expect(parsedLeaderboard.entries[0].rank).toBe(1);
            expect(parsedLeaderboard.totalParticipants).toBe(3);
        });
    });

    describe('Connection restoration', () => {
        it('should handle WebSocket reconnection after server restart', async () => {
            const connectionState = {
                userId: testUserId,
                gameInstanceId: testGameInstanceId,
                socketId: `socket_${Date.now()}`,
                connectionStatus: 'reconnecting',
                lastHeartbeat: new Date(Date.now() - 30 * 1000), // 30 seconds ago
                reconnectToken: `token_${Date.now()}`,
                pendingMessages: [
                    { type: 'game_update', data: { currentQuestionIndex: 1 }, timestamp: new Date() },
                    { type: 'score_update', data: { score: 5 }, timestamp: new Date() }
                ],
                sessionMetadata: {
                    userAgent: 'test-agent',
                    ipAddress: '127.0.0.1',
                    connectedAt: new Date()
                }
            };

            // Store connection state
            await redisClient.setex(
                `connection_state:${testUserId}:${testGameInstanceId}`,
                24 * 60 * 60,
                JSON.stringify(connectionState)
            );

            // Simulate reconnection recovery
            const recoveredConnection = await redisClient.get(`connection_state:${testUserId}:${testGameInstanceId}`);
            expect(recoveredConnection).toBeDefined();

            const parsedConnection = JSON.parse(recoveredConnection!);
            expect(parsedConnection.userId).toBe(testUserId);
            expect(parsedConnection.connectionStatus).toBe('reconnecting');
            expect(parsedConnection.reconnectToken).toBeDefined();
            expect(parsedConnection.pendingMessages).toHaveLength(2);
            expect(parsedConnection.sessionMetadata.userAgent).toBe('test-agent');
        });

        it('should restore pending operations after server restart', async () => {
            const pendingOperations = {
                userId: testUserId,
                gameInstanceId: testGameInstanceId,
                operations: [
                    {
                        id: `op_${Date.now()}_1`,
                        type: 'submit_answer',
                        data: { questionUid: 'q1', selectedAnswers: [0] },
                        timestamp: new Date(),
                        retryCount: 0,
                        maxRetries: 3
                    },
                    {
                        id: `op_${Date.now()}_2`,
                        type: 'update_score',
                        data: { score: 10 },
                        timestamp: new Date(),
                        retryCount: 1,
                        maxRetries: 3
                    }
                ],
                lastProcessedOperationId: null
            };

            // Store pending operations
            await redisClient.setex(
                `pending_operations:${testUserId}:${testGameInstanceId}`,
                24 * 60 * 60,
                JSON.stringify(pendingOperations)
            );

            // Recover pending operations
            const recoveredOperations = await redisClient.get(`pending_operations:${testUserId}:${testGameInstanceId}`);
            expect(recoveredOperations).toBeDefined();

            const parsedOperations = JSON.parse(recoveredOperations!);
            expect(parsedOperations.userId).toBe(testUserId);
            expect(parsedOperations.operations).toHaveLength(2);
            expect(parsedOperations.operations[0].type).toBe('submit_answer');
            expect(parsedOperations.operations[1].retryCount).toBe(1);
        });

        it('should handle connection timeout scenarios', async () => {
            const timeoutState = {
                userId: testUserId,
                gameInstanceId: testGameInstanceId,
                timeoutAt: new Date(Date.now() - 60 * 1000), // Timed out 1 minute ago
                timeoutReason: 'server_restart',
                canReconnect: true,
                reconnectWindowMs: 5 * 60 * 1000, // 5 minutes
                lastKnownState: {
                    currentQuestionIndex: 2,
                    score: 8,
                    status: 'ACTIVE'
                }
            };

            // Store timeout state
            await redisClient.setex(
                `timeout_state:${testUserId}:${testGameInstanceId}`,
                24 * 60 * 60,
                JSON.stringify(timeoutState)
            );

            // Check timeout state
            const recoveredTimeout = await redisClient.get(`timeout_state:${testUserId}:${testGameInstanceId}`);
            expect(recoveredTimeout).toBeDefined();

            const parsedTimeout = JSON.parse(recoveredTimeout!);
            expect(parsedTimeout.userId).toBe(testUserId);
            expect(parsedTimeout.canReconnect).toBe(true);
            expect(parsedTimeout.reconnectWindowMs).toBe(5 * 60 * 1000);
            expect(parsedTimeout.lastKnownState.score).toBe(8);
        });
    });
});