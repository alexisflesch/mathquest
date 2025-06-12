"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findFirst: globals_1.jest.fn(),
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
describe('Sequential Access Code Generation', () => {
    globals_1.jest.setTimeout(3000);
    let gameInstanceService;
    beforeEach(() => {
        gameInstanceService = new gameInstanceService_1.GameInstanceService();
        globals_1.jest.clearAllMocks();
    });
    it('should start with 100000 when no existing codes', async () => {
        // Mock empty database (no existing games)
        prisma_1.prisma.gameInstance.findFirst.mockResolvedValue(null);
        const code = await gameInstanceService.generateUniqueAccessCode();
        expect(code).toBe('100000');
        expect(code.length).toBe(6);
    });
    it('should increment from the highest existing code', async () => {
        // Mock existing game with access code 123456
        prisma_1.prisma.gameInstance.findFirst.mockResolvedValue({
            accessCode: '123456'
        });
        const code = await gameInstanceService.generateUniqueAccessCode();
        expect(code).toBe('123457');
        expect(code.length).toBe(6);
    });
    it('should handle codes with leading zeros', async () => {
        // Mock existing game with access code 100009
        prisma_1.prisma.gameInstance.findFirst.mockResolvedValue({
            accessCode: '100009'
        });
        const code = await gameInstanceService.generateUniqueAccessCode();
        expect(code).toBe('100010');
        expect(code.length).toBe(6);
    });
    it('should generate only numeric codes', async () => {
        prisma_1.prisma.gameInstance.findFirst.mockResolvedValue(null);
        const code = await gameInstanceService.generateUniqueAccessCode();
        // Check that code contains only digits
        expect(/^\d{6}$/.test(code)).toBe(true);
    });
    it('should throw error when reaching maximum 6-digit range', async () => {
        // Mock existing game with maximum 6-digit code
        prisma_1.prisma.gameInstance.findFirst.mockResolvedValue({
            accessCode: '999999'
        });
        await expect(gameInstanceService.generateUniqueAccessCode())
            .rejects.toThrow('Access code range exhausted');
    });
    it('should generate sequential unique codes', async () => {
        // Start with code 100005
        let currentCode = 100005;
        prisma_1.prisma.gameInstance.findFirst.mockImplementation(() => Promise.resolve({ accessCode: currentCode.toString().padStart(6, '0') }));
        const codes = [];
        for (let i = 0; i < 5; i++) {
            const code = await gameInstanceService.generateUniqueAccessCode();
            codes.push(code);
            currentCode++; // Simulate the increment for next call
        }
        // Verify sequential generation
        expect(codes).toEqual(['100006', '100007', '100008', '100009', '100010']);
    });
});
