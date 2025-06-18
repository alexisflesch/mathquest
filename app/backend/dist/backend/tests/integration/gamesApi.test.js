"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../src/server");
const games_1 = require("@/api/v1/games");
const globals_1 = require("@jest/globals");
// Mock authentication middleware
globals_1.jest.mock('@/middleware/auth', () => ({
    teacherAuth: (req, res, next) => {
        req.user = {
            userId: 'teacher-123',
            username: 'testteacher',
            role: 'TEACHER'
        };
        next();
    },
    optionalAuth: (req, res, next) => {
        req.user = {
            userId: 'teacher-123',
            username: 'testteacher',
            role: 'TEACHER'
        };
        next();
    }
}));
describe('Games API Integration Tests', () => {
    globals_1.jest.setTimeout(3000);
    let server;
    let mockGameInstanceService;
    let mockGameParticipantService;
    beforeAll(async () => {
        server = (0, server_1.setupServer)(4001).httpServer; // Use test port 4001
        mockGameInstanceService = {
            createGameInstanceUnified: globals_1.jest.fn(),
            createGameInstance: globals_1.jest.fn(),
            getGameInstanceByAccessCode: globals_1.jest.fn(),
            getGameInstanceById: globals_1.jest.fn(),
            updateGameStatus: globals_1.jest.fn(),
            getTeacherActiveGames: globals_1.jest.fn(),
            generateUniqueAccessCode: globals_1.jest.fn()
        };
        mockGameParticipantService = {
            joinGame: globals_1.jest.fn(),
            createParticipant: globals_1.jest.fn(),
            submitAnswer: globals_1.jest.fn(),
            getParticipantById: globals_1.jest.fn()
        };
        (0, games_1.__setGameInstanceServiceForTesting)(mockGameInstanceService);
        (0, games_1.__setGameParticipantServiceForTesting)(mockGameParticipantService);
    });
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    afterAll(() => {
        server.close();
    });
    describe('POST /api/v1/games', () => {
        it('should create a game instance successfully', async () => {
            const gameData = {
                name: 'Test Game',
                gameTemplateId: 'quiz-123',
                playMode: 'quiz', // valid playMode
            };
            const createdGame = {
                id: 'game-123',
                ...gameData,
                status: 'pending',
                accessCode: 'ABC123',
                participants: []
            };
            mockGameInstanceService.createGameInstanceUnified.mockResolvedValue(createdGame);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/games')
                .send(gameData)
                .expect('Content-Type', /json/)
                .expect(201);
            expect(mockGameInstanceService.createGameInstanceUnified).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Test Game',
                gameTemplateId: 'quiz-123',
                playMode: 'quiz',
                initiatorUserId: 'teacher-123' // was 
            }));
            expect(response.body).toEqual({ gameInstance: createdGame });
        });
        it('should return 400 if required fields are missing', async () => {
            const incompleteData = {
                name: 'Missing Fields',
                playMode: 'quiz' // add playMode so we test missing gameTemplateId
            };
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/games')
                .send(incompleteData)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Required fields missing');
            expect(mockGameInstanceService.createGameInstance).not.toHaveBeenCalled();
        });
        it('should return 400 if playMode is invalid', async () => {
            const invalidData = {
                name: 'Test Game',
                gameTemplateId: 'quiz-123',
                playMode: 'invalid-mode' // Invalid mode
            };
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/games')
                .send(invalidData)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Invalid or missing playMode value');
            expect(mockGameInstanceService.createGameInstance).not.toHaveBeenCalled();
        });
    });
    describe('GET /api/v1/games/:accessCode', () => {
        it('should return a game by access code', async () => {
            const accessCode = 'ABC123';
            const mockGame = {
                id: 'game-123',
                name: 'Test Game',
                accessCode,
                status: 'pending'
            };
            mockGameInstanceService.getGameInstanceByAccessCode.mockResolvedValue(mockGame);
            const response = await (0, supertest_1.default)(server_1.app)
                .get(`/api/v1/games/${accessCode}`)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameInstanceService.getGameInstanceByAccessCode).toHaveBeenCalledWith(accessCode, false);
            expect(response.body).toEqual({ gameInstance: mockGame });
        });
        it('should return game with participants when includeParticipants is true', async () => {
            const accessCode = 'ABC123';
            const mockGameWithParticipants = {
                id: 'game-123',
                name: 'Test Game',
                accessCode,
                status: 'active',
                participants: [
                    { id: 'participant-1', userId: 'player-1', score: 200 }
                ]
            };
            mockGameInstanceService.getGameInstanceByAccessCode.mockResolvedValue(mockGameWithParticipants);
            const response = await (0, supertest_1.default)(server_1.app)
                .get(`/api/v1/games/${accessCode}?includeParticipants=true`)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameInstanceService.getGameInstanceByAccessCode).toHaveBeenCalledWith(accessCode, true);
            expect(response.body.gameInstance.participants).toHaveLength(1);
        });
        it('should return 404 if game not found', async () => {
            const accessCode = 'INVALID';
            mockGameInstanceService.getGameInstanceByAccessCode.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .get(`/api/v1/games/${accessCode}`)
                .expect('Content-Type', /json/)
                .expect(404);
            expect(response.body.error).toBe('Game not found');
        });
        it('should return 400 if access code format is invalid', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/games/ABC') // Too short
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Invalid access code format');
            expect(mockGameInstanceService.getGameInstanceByAccessCode).not.toHaveBeenCalled();
        });
    });
    describe('POST /api/v1/games/:accessCode/join', () => {
        it('should allow player to join a game', async () => {
            const accessCode = 'ABC123';
            const userId = 'player-123';
            const mockJoinResult = {
                success: true,
                gameInstance: { id: 'game-123', name: 'Test Game' },
                participant: {
                    id: 'participant-123',
                    userId,
                    username: 'TestPlayer',
                    avatarEmoji: '🎮',
                    score: 0
                }
            };
            mockGameParticipantService.joinGame.mockResolvedValue(mockJoinResult);
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/v1/games/${accessCode}/join`)
                .send({ userId })
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameParticipantService.joinGame).toHaveBeenCalledWith(userId, accessCode);
            expect(response.body).toEqual(mockJoinResult);
        });
        it('should return 400 if player ID is missing', async () => {
            const accessCode = 'ABC123';
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/v1/games/${accessCode}/join`)
                .send({}) // No userId
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Player ID is required');
            expect(mockGameParticipantService.joinGame).not.toHaveBeenCalled();
        });
        it('should return error if joining fails', async () => {
            const accessCode = 'ABC123';
            const userId = 'player-123';
            const mockFailureResult = {
                success: false,
                error: 'Game not found'
            };
            mockGameParticipantService.joinGame.mockResolvedValue(mockFailureResult);
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/v1/games/${accessCode}/join`)
                .send({ userId })
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Game not found');
        });
    });
    describe('PUT /api/v1/games/:id/status', () => {
        it('should update game status', async () => {
            const gameId = 'game-123';
            const updateData = {
                status: 'active',
                currentQuestionIndex: 1
            };
            const mockGame = {
                id: gameId,
                initiatorUserId: 'teacher-123' // Same as auth mock
            };
            const updatedGame = {
                ...mockGame,
                status: 'active',
                currentQuestionIndex: 1
            };
            mockGameInstanceService.getGameInstanceById.mockResolvedValue(mockGame);
            mockGameInstanceService.updateGameStatus.mockResolvedValue(updatedGame);
            const response = await (0, supertest_1.default)(server_1.app)
                .put(`/api/v1/games/${gameId}/status`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameInstanceService.getGameInstanceById).toHaveBeenCalledWith(gameId);
            expect(mockGameInstanceService.updateGameStatus).toHaveBeenCalledWith(gameId, updateData);
            expect(response.body).toEqual({ gameInstance: updatedGame });
        });
        it('should return 400 if status is missing', async () => {
            const gameId = 'game-123';
            const response = await (0, supertest_1.default)(server_1.app)
                .put(`/api/v1/games/${gameId}/status`)
                .send({ currentQuestionIndex: 1 }) // No status
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Status is required');
            expect(mockGameInstanceService.updateGameStatus).not.toHaveBeenCalled();
        });
        it('should return 400 if status is invalid', async () => {
            const gameId = 'game-123';
            const response = await (0, supertest_1.default)(server_1.app)
                .put(`/api/v1/games/${gameId}/status`)
                .send({ status: 'invalid-status' })
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Invalid status value');
            expect(mockGameInstanceService.updateGameStatus).not.toHaveBeenCalled();
        });
        it('should return 404 if game not found', async () => {
            const gameId = 'invalid-id';
            mockGameInstanceService.getGameInstanceById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .put(`/api/v1/games/${gameId}/status`)
                .send({ status: 'active' })
                .expect('Content-Type', /json/)
                .expect(404);
            expect(response.body.error).toBe('Game not found');
            expect(mockGameInstanceService.updateGameStatus).not.toHaveBeenCalled();
        });
        it('should return 403 if teacher does not own the game', async () => {
            const gameId = 'game-123';
            const mockGame = {
                id: gameId,
                initiatorUserId: 'different-teacher' // Different teacher
            };
            mockGameInstanceService.getGameInstanceById.mockResolvedValue(mockGame);
            const response = await (0, supertest_1.default)(server_1.app)
                .put(`/api/v1/games/${gameId}/status`)
                .send({ status: 'active' })
                .expect('Content-Type', /json/)
                .expect(403);
            expect(response.body.error).toBe('You do not have permission to update this game');
            expect(mockGameInstanceService.updateGameStatus).not.toHaveBeenCalled();
        });
    });
    describe('GET /api/v1/games/teacher/active', () => {
        it('should return active games for the teacher', async () => {
            const mockGames = [
                { id: 'game-1', status: 'pending', name: 'Game 1' },
                { id: 'game-2', status: 'active', name: 'Game 2' }
            ];
            mockGameInstanceService.getTeacherActiveGames.mockResolvedValue(mockGames);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/games/teacher/active');
            // Debug output for troubleshooting
            // eslint-disable-next-line no-console
            console.log('DEBUG response:', response.status, response.headers['content-type'], response.text);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.status).toBe(200);
            expect(mockGameInstanceService.getTeacherActiveGames).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({ games: mockGames });
        });
        it('should handle no active games', async () => {
            mockGameInstanceService.getTeacherActiveGames.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/games/teacher/active')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(response.body).toEqual({ games: [] });
        });
    });
});
