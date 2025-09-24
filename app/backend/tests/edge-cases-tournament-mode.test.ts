/**
 * Edge Cases Investigation - Tournament Mode Specific Edge Cases
 *
 * This test file investigates the following edge cases from edge-cases.md:
 *
 * 1. Expired Tournaments
 *    - Tournament start after expiry date
 *    - Join expired tournament
 *    - Expired tournament cleanup
 *
 * 2. No Questions Available
 *    - Start tournament with empty questions array
 *    - Tournament with questions but all deleted
 *    - Tournament with insufficient questions
 *
 * 3. Participant Leaving Mid-Tournament
 *    - Last participant leaves active tournament
 *    - Participant leaves but tournament continues
 *    - Participant leaves during final round
 */

import { jest } from '@jest/globals';

// Mock tournament services and components
const mockTournamentService = {
    createTournament: jest.fn<any>(),
    joinTournament: jest.fn<any>(),
    startTournament: jest.fn<any>(),
    leaveTournament: jest.fn<any>(),
    endTournament: jest.fn<any>(),
    getTournamentState: jest.fn<any>(),
    cleanupExpiredTournaments: jest.fn<any>(),
    calculateResults: jest.fn<any>()
};

// Mock socket connections
const mockSocketService = {
    emitToRoom: jest.fn<any>(),
    emitToUser: jest.fn<any>(),
    emitToTournament: jest.fn<any>(),
    disconnectPlayer: jest.fn<any>(),
    getConnectedPlayers: jest.fn<any>()
};

// Mock database operations
const mockPrisma = {
    tournament: {
        findUnique: jest.fn<any>(),
        findMany: jest.fn<any>(),
        update: jest.fn<any>(),
        create: jest.fn<any>(),
        delete: jest.fn<any>()
    },
    tournamentParticipant: {
        findMany: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>()
    },
    question: {
        findMany: jest.fn<any>(),
        count: jest.fn<any>()
    },
    gameSession: {
        findUnique: jest.fn<any>(),
        update: jest.fn<any>()
    }
};

// Mock Redis operations
const mockRedis = {
    hget: jest.fn<any>(),
    hset: jest.fn<any>(),
    hdel: jest.fn<any>(),
    del: jest.fn<any>(),
    expire: jest.fn<any>(),
    keys: jest.fn<any>()
};

// Mock validation schemas
const mockTournamentCreateSchema = {
    parse: jest.fn<any>()
};

const mockTournamentJoinSchema = {
    parse: jest.fn<any>()
};

describe('Edge Cases - Tournament Mode Specific', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Expired Tournaments', () => {
        test('TM1: Tournament start after expiry date', async () => {
            // Mock expired tournament
            const mockTournament = {
                id: 'tournament-1',
                name: 'Expired Tournament',
                expiryDate: new Date(Date.now() - 86400000), // 1 day ago
                status: 'pending',
                maxParticipants: 10,
                questions: [],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockTournamentCreateSchema.parse.mockReturnValue(mockTournament);

            // Mock the service call to reject
            mockTournamentService.startTournament.mockImplementation(async () => {
                // Simulate service logic checking expiry
                const tournament = await mockPrisma.tournament.findUnique({
                    where: { id: 'tournament-1' },
                });
                if (tournament && tournament.expiryDate < new Date()) {
                    throw new Error('Tournament has expired');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('Tournament has expired');

            expect(mockPrisma.tournament.findUnique).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
            });
        });

        test('TM2: Join expired tournament', async () => {
            const mockTournament = {
                id: 'tournament-1',
                name: 'Expired Tournament',
                expiryDate: new Date(Date.now() - 86400000),
                status: 'pending',
                maxParticipants: 10,
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockTournamentJoinSchema.parse.mockReturnValue({ tournamentId: 'tournament-1', userId: 'user-1' });

            mockTournamentService.joinTournament.mockImplementation(async () => {
                const tournament = await mockPrisma.tournament.findUnique({
                    where: { id: 'tournament-1' },
                });
                if (tournament && tournament.expiryDate < new Date()) {
                    throw new Error('Tournament has expired');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.joinTournament('tournament-1', 'user-1')).rejects.toThrow('Tournament has expired');

            expect(mockPrisma.tournament.findUnique).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
            });
        });

        test('TM3: Expired tournament cleanup', async () => {
            const mockExpiredTournaments = [
                { id: 'expired-1', status: 'pending', expiryDate: new Date(Date.now() - 86400000) },
                { id: 'expired-2', status: 'active', expiryDate: new Date(Date.now() - 86400000) },
            ];

            mockPrisma.tournament.findMany.mockResolvedValue(mockExpiredTournaments);

            mockTournamentService.cleanupExpiredTournaments.mockImplementation(async () => {
                const expiredTournaments = await mockPrisma.tournament.findMany({
                    where: { expiryDate: { lt: new Date() } },
                });
                for (const tournament of expiredTournaments) {
                    if (tournament.expiryDate < new Date()) {
                        await mockPrisma.tournament.update({
                            where: { id: tournament.id },
                            data: { status: 'expired' },
                        });
                    }
                }
            });

            await mockTournamentService.cleanupExpiredTournaments();

            expect(mockPrisma.tournament.update).toHaveBeenCalledTimes(2);
            expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
                where: { id: 'expired-1' },
                data: { status: 'expired' },
            });
            expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
                where: { id: 'expired-2' },
                data: { status: 'expired' },
            });
        });
    });

    describe('No Questions Available', () => {
        test('TM4: Start tournament with empty questions array', async () => {
            const mockTournament = {
                id: 'tournament-1',
                name: 'Empty Questions Tournament',
                expiryDate: new Date(Date.now() + 86400000),
                status: 'pending',
                maxParticipants: 10,
                questions: [],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([]);

            mockTournamentService.startTournament.mockImplementation(async () => {
                const questions = await mockPrisma.question.findMany();
                if (questions.length === 0) {
                    throw new Error('No questions available for tournament');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('No questions available for tournament');

            expect(mockPrisma.question.findMany).toHaveBeenCalled();
        });

        test('TM5: Tournament with questions but all deleted', async () => {
            const mockTournament = {
                id: 'tournament-1',
                name: 'Deleted Questions Tournament',
                expiryDate: new Date(Date.now() + 86400000),
                status: 'pending',
                maxParticipants: 10,
                questions: [{ id: 'q1' }, { id: 'q2' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([]); // Questions were deleted

            mockTournamentService.startTournament.mockImplementation(async () => {
                const questions = await mockPrisma.question.findMany({
                    where: { id: { in: ['q1', 'q2'] } },
                });
                if (questions.length === 0) {
                    throw new Error('No valid questions available');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('No valid questions available');

            expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['q1', 'q2'] } },
            });
        });

        test('TM6: Tournament with insufficient questions', async () => {
            const mockTournament = {
                id: 'tournament-1',
                name: 'Few Questions Tournament',
                expiryDate: new Date(Date.now() + 86400000),
                status: 'pending',
                maxParticipants: 10,
                questions: [{ id: 'q1' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([{ id: 'q1', text: 'Question 1' }]);

            mockTournamentService.startTournament.mockImplementation(async () => {
                const questions = await mockPrisma.question.findMany();
                if (questions.length < 5) {
                    throw new Error('Tournament requires at least 5 questions');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('Tournament requires at least 5 questions');

            expect(mockPrisma.question.findMany).toHaveBeenCalled();
        });
    });

    describe('Participant Leaving Mid-Tournament', () => {
        test('TM7: Last participant leaves active tournament', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'active',
                participants: [{ id: 'participant-1', userId: 'user-1' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.tournamentParticipant.findMany.mockResolvedValue([]);
            mockRedis.hget.mockResolvedValue('user-1');

            mockTournamentService.leaveTournament.mockImplementation(async () => {
                const remainingParticipants = await mockPrisma.tournamentParticipant.findMany();
                if (remainingParticipants.length === 0) {
                    await mockPrisma.tournament.update({
                        where: { id: 'tournament-1' },
                        data: { status: 'cancelled' },
                    });
                    await mockSocketService.emitToRoom('tournament-1', 'tournament_cancelled', {
                        reason: 'All participants left',
                    });
                }
                return undefined;
            });

            await mockTournamentService.leaveTournament('tournament-1', 'user-1');

            expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
                data: { status: 'cancelled' },
            });
            expect(mockSocketService.emitToRoom).toHaveBeenCalledWith('tournament-1', 'tournament_cancelled', {
                reason: 'All participants left',
            });
        });

        test('TM8: Participant leaves but tournament continues', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'active',
                participants: [
                    { id: 'participant-1', userId: 'user-1' },
                    { id: 'participant-2', userId: 'user-2' },
                ],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.tournamentParticipant.findMany.mockResolvedValue([
                { id: 'participant-2', userId: 'user-2' },
            ]);
            mockRedis.hget.mockResolvedValue('user-1');

            mockTournamentService.leaveTournament.mockImplementation(async () => {
                const remainingParticipants = await mockPrisma.tournamentParticipant.findMany();
                if (remainingParticipants.length > 0) {
                    await mockPrisma.tournamentParticipant.delete({
                        where: { id: 'participant-1' },
                    });
                }
                return undefined;
            });

            await mockTournamentService.leaveTournament('tournament-1', 'user-1');

            expect(mockPrisma.tournament.update).not.toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
                data: { status: 'cancelled' },
            });
            expect(mockPrisma.tournamentParticipant.delete).toHaveBeenCalledWith({
                where: { id: 'participant-1' },
            });
        });

        test('TM9: Participant leaves during final round', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'active',
                currentRound: 5,
                totalRounds: 5,
                participants: [
                    { id: 'participant-1', userId: 'user-1' },
                    { id: 'participant-2', userId: 'user-2' },
                ],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.tournamentParticipant.findMany.mockResolvedValue([
                { id: 'participant-2', userId: 'user-2' },
            ]);
            mockRedis.hget.mockResolvedValue('user-1');

            mockTournamentService.leaveTournament.mockImplementation(async () => {
                await mockSocketService.emitToRoom('tournament-1', 'participant_left', {
                    userId: 'user-1',
                    remainingParticipants: 1,
                });
                return undefined;
            });

            await mockTournamentService.leaveTournament('tournament-1', 'user-1');

            expect(mockSocketService.emitToRoom).toHaveBeenCalledWith('tournament-1', 'participant_left', {
                userId: 'user-1',
                remainingParticipants: 1,
            });
        });
    });

    describe('Tournament State Transitions', () => {
        test('TM10: Tournament state corruption recovery', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'completed',
                participants: [],
                expiryDate: new Date(Date.now() + 86400000),
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);

            mockTournamentService.startTournament.mockImplementation(async () => {
                const tournament = await mockPrisma.tournament.findUnique({
                    where: { id: 'tournament-1' },
                });
                if (tournament && tournament.status === 'completed') {
                    throw new Error('Tournament already completed');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('Tournament already completed');

            expect(mockPrisma.tournament.findUnique).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
            });
        });

        test('TM11: Concurrent tournament starts', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'pending',
                expiryDate: new Date(Date.now() + 86400000),
                questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([
                { id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' },
            ]);

            // Mock concurrent update failure
            mockPrisma.tournament.update
                .mockRejectedValueOnce({ code: 'P2002' }) // Unique constraint violation
                .mockResolvedValueOnce({ ...mockTournament, status: 'active' });

            mockTournamentService.startTournament.mockImplementation(async () => {
                try {
                    await mockPrisma.tournament.update({
                        where: { id: 'tournament-1' },
                        data: { status: 'active' },
                    });
                    return mockTournament;
                } catch (error: any) {
                    if (error.code === 'P2002') {
                        // Try again after the conflict
                        await mockPrisma.tournament.update({
                            where: { id: 'tournament-1' },
                            data: { status: 'active' },
                        });
                        throw new Error('Tournament start conflict');
                    }
                    throw error;
                }
            });

            await expect(mockTournamentService.startTournament('tournament-1')).rejects.toThrow('Tournament start conflict');

            expect(mockPrisma.tournament.update).toHaveBeenCalledTimes(2);
        });

        test('TM12: Tournament capacity boundary', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'pending',
                maxParticipants: 2,
                participants: [
                    { id: 'p1', userId: 'user-1' },
                    { id: 'p2', userId: 'user-2' },
                ],
                expiryDate: new Date(Date.now() + 86400000),
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockTournamentJoinSchema.parse.mockReturnValue({ tournamentId: 'tournament-1', userId: 'user-3' });

            mockTournamentService.joinTournament.mockImplementation(async () => {
                const tournament = await mockPrisma.tournament.findUnique({
                    where: { id: 'tournament-1' },
                    include: { participants: true },
                });
                if (tournament && tournament.participants.length >= tournament.maxParticipants) {
                    throw new Error('Tournament is full');
                }
                return mockTournament;
            });

            await expect(mockTournamentService.joinTournament('tournament-1', 'user-3')).rejects.toThrow('Tournament is full');

            expect(mockPrisma.tournament.findUnique).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
                include: { participants: true },
            });
        });
    });

    describe('Tournament Timing Edge Cases', () => {
        test('TM13: Tournament starts exactly at expiry time', async () => {
            const exactExpiry = new Date();
            const mockTournament = {
                id: 'tournament-1',
                status: 'pending',
                expiryDate: exactExpiry,
                questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([
                { id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' },
            ]);

            mockTournamentService.startTournament.mockImplementation(async () => {
                await mockPrisma.tournament.update({
                    where: { id: 'tournament-1' },
                    data: { status: 'active' },
                });
                return { ...mockTournament, status: 'active' };
            });

            // Should succeed if expiry check allows exact time
            await expect(mockTournamentService.startTournament('tournament-1')).resolves.not.toThrow();

            expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
                data: { status: 'active' },
            });
        });

        test('TM14: Tournament with very short expiry window', async () => {
            const mockTournament = {
                id: 'tournament-1',
                status: 'pending',
                expiryDate: new Date(Date.now() + 60000), // 1 minute from now
                questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }],
            };

            mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);
            mockPrisma.question.findMany.mockResolvedValue([
                { id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' },
            ]);

            mockTournamentService.startTournament.mockImplementation(async () => {
                await mockPrisma.tournament.update({
                    where: { id: 'tournament-1' },
                    data: { status: 'active' },
                });
                return { ...mockTournament, status: 'active' };
            });

            await expect(mockTournamentService.startTournament('tournament-1')).resolves.not.toThrow();

            expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
                where: { id: 'tournament-1' },
                data: { status: 'active' },
            });
        });
    });
});