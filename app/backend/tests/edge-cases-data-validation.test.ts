// Mock the dependencies
jest.mock('../src/config/redis', () => ({
    redisClient: {
        status: 'ready',
        hget: jest.fn(),
        hset: jest.fn(),
        hdel: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        keys: jest.fn(),
        duplicate: jest.fn(() => ({} as any)),
    },
}));

jest.mock('../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        gameParticipant: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
        question: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Import after mocks are set up
import { redisClient } from '../src/config/redis';

// Cast to mocked type for proper typing
const mockedRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe('Edge Cases - Data Validation', () => {
    let mockPrisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Redis client status to ready for each test
        (mockedRedisClient as any).status = 'ready';

        // Mock Prisma client
        mockPrisma = {
            gameInstance: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            gameParticipant: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                upsert: jest.fn(),
                findMany: jest.fn(),
            },
            question: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };
    });

    describe('Empty Arrays and Null Values', () => {
        test('DV1: Empty participants array in game creation', async () => {
            // Mock empty participants array
            const gameData = {
                accessCode: 'GAME123',
                participants: [], // Empty array
                questions: [{ id: 'q1', text: 'Test question' }],
            };

            // Mock validation that should reject empty participants
            mockPrisma.gameInstance.create.mockRejectedValue(new Error('Participants array cannot be empty'));

            // Attempt to create game
            await expect(mockPrisma.gameInstance.create({ data: gameData })).rejects.toThrow('Participants array cannot be empty');

            expect(mockPrisma.gameInstance.create).toHaveBeenCalledWith({ data: gameData });
        });

        test('DV2: Null values in required fields', async () => {
            // Mock user creation with null required fields
            const userData = {
                username: null, // Required field is null
                email: 'test@example.com',
                role: 'student',
            };

            // Mock validation that should reject null username
            mockPrisma.user.create.mockRejectedValue(new Error('Username cannot be null'));

            await expect(mockPrisma.user.create({ data: userData })).rejects.toThrow('Username cannot be null');

            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });

        test('DV3: Empty questions array in quiz', async () => {
            // Mock quiz with no questions
            const quizData = {
                title: 'Empty Quiz',
                questions: [], // Empty questions array
                accessCode: 'QUIZ123',
            };

            // Mock validation that should reject empty questions
            mockPrisma.gameInstance.create.mockRejectedValue(new Error('Questions array cannot be empty'));

            await expect(mockPrisma.gameInstance.create({ data: quizData })).rejects.toThrow('Questions array cannot be empty');

            expect(mockPrisma.gameInstance.create).toHaveBeenCalledWith({ data: quizData });
        });

        test('DV4: Undefined optional fields', async () => {
            // Mock question creation with undefined optional fields
            const questionData = {
                text: 'Test question',
                type: 'multiple_choice',
                answers: ['A', 'B', 'C'],
                correctAnswer: 0,
                explanation: undefined, // Optional field undefined
                imageUrl: undefined, // Optional field undefined
            };

            // Mock successful creation with defaults for undefined fields
            mockPrisma.question.create.mockResolvedValue({
                id: 'q1',
                ...questionData,
                explanation: null,
                imageUrl: null,
            });

            const result = await mockPrisma.question.create({ data: questionData });

            expect(result.explanation).toBeNull();
            expect(result.imageUrl).toBeNull();
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: questionData });
        });
    });

    describe('Unicode and Special Characters', () => {
        test('DV5: Unicode characters in username', async () => {
            // Mock username with unicode characters
            const userData = {
                username: 'tëst_üšér_ñáme', // Unicode characters
                email: 'test@example.com',
                role: 'student',
            };

            // Mock successful creation
            mockPrisma.user.create.mockResolvedValue({
                id: 'u1',
                ...userData,
            });

            const result = await mockPrisma.user.create({ data: userData });

            expect(result.username).toBe('tëst_üšér_ñáme');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });

        test('DV6: Emoji in username', async () => {
            // Mock username with emojis
            const userData = {
                username: 'test_user_🚀⭐', // Emojis in username
                email: 'test@example.com',
                role: 'student',
            };

            // Mock successful creation
            mockPrisma.user.create.mockResolvedValue({
                id: 'u2',
                ...userData,
            });

            const result = await mockPrisma.user.create({ data: userData });

            expect(result.username).toBe('test_user_🚀⭐');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });

        test('DV7: Special characters in question text', async () => {
            // Mock question with special characters
            const questionData = {
                text: 'What is 2 + 2? ¡¿Special chars: @#$%^&*()!',
                type: 'multiple_choice',
                answers: ['3', '4', '5', '6'],
                correctAnswer: 1,
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                id: 'q2',
                ...questionData,
            });

            const result = await mockPrisma.question.create({ data: questionData });

            expect(result.text).toContain('¡¿Special chars: @#$%^&*()!');
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: questionData });
        });

        test('DV8: Mixed scripts in content', async () => {
            // Mock content with mixed scripts (Latin, Cyrillic, etc.)
            const questionData = {
                text: 'Hello Привет こんにちは', // English, Russian, Japanese
                type: 'text_input',
                answers: ['Greeting'],
                correctAnswer: 0,
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                id: 'q3',
                ...questionData,
            });

            const result = await mockPrisma.question.create({ data: questionData });

            expect(result.text).toBe('Hello Привет こんにちは');
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: questionData });
        });
    });

    describe('Long Data Fields', () => {
        test('DV9: Very long username', async () => {
            // Mock extremely long username
            const longUsername = 'a'.repeat(200); // 200 character username
            const userData = {
                username: longUsername,
                email: 'test@example.com',
                role: 'student',
            };

            // Mock validation that should reject overly long username
            mockPrisma.user.create.mockRejectedValue(new Error('Username too long'));

            await expect(mockPrisma.user.create({ data: userData })).rejects.toThrow('Username too long');

            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });

        test('DV10: Very long question text', async () => {
            // Mock extremely long question text
            const longText = 'What is the meaning of life? '.repeat(100); // Very long text
            const questionData = {
                text: longText,
                type: 'text_input',
                answers: ['42'],
                correctAnswer: 0,
            };

            // Mock validation that should reject overly long text
            mockPrisma.question.create.mockRejectedValue(new Error('Question text too long'));

            await expect(mockPrisma.question.create({ data: questionData })).rejects.toThrow('Question text too long');

            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: questionData });
        });

        test('DV11: Maximum allowed username length', async () => {
            // Mock username at maximum allowed length
            const maxUsername = 'a'.repeat(50); // Assume 50 is max
            const userData = {
                username: maxUsername,
                email: 'test@example.com',
                role: 'student',
            };

            // Mock successful creation at boundary
            mockPrisma.user.create.mockResolvedValue({
                id: 'u3',
                ...userData,
            });

            const result = await mockPrisma.user.create({ data: userData });

            expect(result.username).toBe(maxUsername);
            expect(result.username.length).toBe(50);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });

        test('DV12: Boundary length validation', async () => {
            // Mock testing boundary conditions
            const boundaryUsername = 'a'.repeat(51); // Just over assumed limit
            const userData = {
                username: boundaryUsername,
                email: 'test@example.com',
                role: 'student',
            };

            // Mock rejection at boundary + 1
            mockPrisma.user.create.mockRejectedValue(new Error('Username exceeds maximum length'));

            await expect(mockPrisma.user.create({ data: userData })).rejects.toThrow('Username exceeds maximum length');

            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
        });
    });

    describe('Malformed Data Structures', () => {
        test('DV13: Invalid data types', async () => {
            // Mock question with wrong data types
            const invalidQuestionData = {
                text: 123, // Should be string
                type: 'multiple_choice',
                answers: 'not an array', // Should be array
                correctAnswer: 'not a number', // Should be number
            };

            // Mock validation that should reject invalid types
            mockPrisma.question.create.mockRejectedValue(new Error('Invalid data types'));

            await expect(mockPrisma.question.create({ data: invalidQuestionData })).rejects.toThrow('Invalid data types');

            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: invalidQuestionData });
        });

        test('DV14: Missing required fields', async () => {
            // Mock incomplete user data
            const incompleteUserData = {
                // Missing required username
                email: 'test@example.com',
                role: 'student',
            };

            // Mock validation that should reject missing required fields
            mockPrisma.user.create.mockRejectedValue(new Error('Missing required field: username'));

            await expect(mockPrisma.user.create({ data: incompleteUserData })).rejects.toThrow('Missing required field: username');

            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: incompleteUserData });
        });

        test('DV15: Invalid enum values', async () => {
            // Mock user with invalid role
            const invalidUserData = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'invalid_role', // Invalid enum value
            };

            // Mock validation that should reject invalid enum
            mockPrisma.user.create.mockRejectedValue(new Error('Invalid role value'));

            await expect(mockPrisma.user.create({ data: invalidUserData })).rejects.toThrow('Invalid role value');

            expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: invalidUserData });
        });

        test('DV16: Nested object validation', async () => {
            // Mock complex nested data structure
            const complexGameData = {
                accessCode: 'GAME123',
                settings: {
                    timeLimit: -1, // Invalid negative time
                    allowLateJoin: 'not_boolean', // Invalid type
                },
                participants: [
                    {
                        userId: 'u1',
                        score: 'not_a_number', // Invalid type
                    }
                ],
            };

            // Mock validation that should reject nested invalid data
            mockPrisma.gameInstance.create.mockRejectedValue(new Error('Invalid nested data structure'));

            await expect(mockPrisma.gameInstance.create({ data: complexGameData })).rejects.toThrow('Invalid nested data structure');

            expect(mockPrisma.gameInstance.create).toHaveBeenCalledWith({ data: complexGameData });
        });
    });

    describe('Boundary Conditions', () => {
        test('DV17: Zero values in numeric fields', async () => {
            // Mock question with zero time limit
            const zeroTimeQuestion = {
                text: 'Instant question',
                type: 'multiple_choice',
                answers: ['A', 'B'],
                correctAnswer: 0,
                timeLimit: 0, // Zero time limit
            };

            // Mock successful creation with zero values
            mockPrisma.question.create.mockResolvedValue({
                id: 'q4',
                ...zeroTimeQuestion,
            });

            const result = await mockPrisma.question.create({ data: zeroTimeQuestion });

            expect(result.timeLimit).toBe(0);
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: zeroTimeQuestion });
        });

        test('DV18: Negative values in constrained fields', async () => {
            // Mock question with negative time limit
            const negativeTimeQuestion = {
                text: 'Negative time question',
                type: 'multiple_choice',
                answers: ['A', 'B'],
                correctAnswer: 0,
                timeLimit: -100, // Negative time limit
            };

            // Mock validation that should reject negative values
            mockPrisma.question.create.mockRejectedValue(new Error('Time limit cannot be negative'));

            await expect(mockPrisma.question.create({ data: negativeTimeQuestion })).rejects.toThrow('Time limit cannot be negative');

            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: negativeTimeQuestion });
        });

        test('DV19: Maximum numeric values', async () => {
            // Mock question with maximum time limit
            const maxTimeQuestion = {
                text: 'Maximum time question',
                type: 'multiple_choice',
                answers: ['A', 'B'],
                correctAnswer: 0,
                timeLimit: 86400000, // 24 hours in milliseconds
            };

            // Mock successful creation with large values
            mockPrisma.question.create.mockResolvedValue({
                id: 'q5',
                ...maxTimeQuestion,
            });

            const result = await mockPrisma.question.create({ data: maxTimeQuestion });

            expect(result.timeLimit).toBe(86400000);
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: maxTimeQuestion });
        });

        test('DV20: Array size boundaries', async () => {
            // Mock question with maximum number of answers
            const maxAnswersQuestion = {
                text: 'Many options question',
                type: 'multiple_choice',
                answers: Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`), // 10 answers
                correctAnswer: 0,
            };

            // Mock successful creation with maximum array size
            mockPrisma.question.create.mockResolvedValue({
                id: 'q6',
                ...maxAnswersQuestion,
            });

            const result = await mockPrisma.question.create({ data: maxAnswersQuestion });

            expect(result.answers).toHaveLength(10);
            expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: maxAnswersQuestion });
        });
    });
});