"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: globals_1.jest.fn()
        }
    }
}));
// Mock the logger
globals_1.jest.mock('@/utils/logger', () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }));
});
describe('Access Code Generation', () => {
    globals_1.jest.setTimeout(3000);
    let gameInstanceService;
    beforeEach(() => {
        gameInstanceService = new gameInstanceService_1.GameInstanceService();
        globals_1.jest.clearAllMocks();
        // Set up the mock to simulate that the generated code doesn't exist yet
        prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(null);
    });
    it('should generate a code with the correct length', async () => {
        const code = await gameInstanceService.generateUniqueAccessCode(6);
        expect(code.length).toBe(6);
        const code8 = await gameInstanceService.generateUniqueAccessCode(8);
        expect(code8.length).toBe(8);
    });
    it('should use only allowed characters', async () => {
        // Characters used in the code generator (excluding confusing characters)
        const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = await gameInstanceService.generateUniqueAccessCode();
        // Check that each character in the code is in the allowedChars set
        for (const char of code) {
            expect(allowedChars.includes(char)).toBe(true);
        }
    });
    it('should not include easily confused characters', async () => {
        // Characters that should be excluded
        const confusingChars = '0O1I';
        const code = await gameInstanceService.generateUniqueAccessCode();
        // Check that none of the confusing characters are in the code
        for (const char of confusingChars) {
            expect(code.includes(char)).toBe(false);
        }
    });
    it('should retry when a collision occurs', async () => {
        // For the first call to findUnique, return an existing game
        // For the second call, return null (meaning code is available)
        prisma_1.prisma.gameInstance.findUnique
            .mockResolvedValueOnce({ id: 'existing-game' })
            .mockResolvedValueOnce(null);
        const code = await gameInstanceService.generateUniqueAccessCode();
        // Verify that findUnique was called twice (collision handling)
        expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledTimes(2);
        expect(code).toBeDefined();
    });
    it('should throw error after maximum attempts', async () => {
        // Always return an existing game to force maximum attempts
        prisma_1.prisma.gameInstance.findUnique.mockResolvedValue({ id: 'always-exists' });
        // Should throw an error after max attempts
        await expect(gameInstanceService.generateUniqueAccessCode()).rejects
            .toThrow('Unable to generate unique access code after multiple attempts');
    });
    it('should generate statistically unique codes', async () => {
        // Generate a substantial number of codes to test uniqueness
        const numCodes = 100;
        const generatedCodes = new Set();
        for (let i = 0; i < numCodes; i++) {
            const code = await gameInstanceService.generateUniqueAccessCode();
            generatedCodes.add(code);
        }
        // If all codes are unique, the set size should equal the number of generations
        expect(generatedCodes.size).toBe(numCodes);
    });
});
