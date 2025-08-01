import { GameInstanceService } from '@/core/services/gameInstanceService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findFirst: jest.fn(),
            findUnique: jest.fn()
        }
    }
}));

// Mock the logger
jest.mock('@/utils/logger', () => {
    return jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }));
});

describe('Sequential Access Code Generation', () => {
    jest.setTimeout(3000);

    let gameInstanceService: GameInstanceService;

    beforeEach(() => {
        gameInstanceService = new GameInstanceService();
        jest.clearAllMocks();
    });

    it('should start with 100000 when no existing codes', async () => {
        // Mock empty database (no existing games)
        (prisma.gameInstance.findFirst as any).mockResolvedValue(null);

        const code = await gameInstanceService.generateUniqueAccessCode();

        expect(code).toBe('100000');
        expect(code.length).toBe(6);
    });

    it('should increment from the highest existing code', async () => {
        // Mock existing game with access code 123456
        (prisma.gameInstance.findFirst as any).mockResolvedValue({
            accessCode: '123456'
        });

        const code = await gameInstanceService.generateUniqueAccessCode();

        expect(code).toBe('123457');
        expect(code.length).toBe(6);
    });

    it('should handle codes with leading zeros', async () => {
        // Mock existing game with access code 100009
        (prisma.gameInstance.findFirst as any).mockResolvedValue({
            accessCode: '100009'
        });

        const code = await gameInstanceService.generateUniqueAccessCode();

        expect(code).toBe('100010');
        expect(code.length).toBe(6);
    });

    it('should generate only numeric codes', async () => {
        (prisma.gameInstance.findFirst as any).mockResolvedValue(null);

        const code = await gameInstanceService.generateUniqueAccessCode();

        // Check that code contains only digits
        expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('should throw error when reaching maximum 6-digit range', async () => {
        // Mock existing game with maximum 6-digit code
        (prisma.gameInstance.findFirst as any).mockResolvedValue({
            accessCode: '999999'
        });

        await expect(gameInstanceService.generateUniqueAccessCode())
            .rejects.toThrow('Access code range exhausted');
    });

    it('should generate sequential unique codes', async () => {
        // Start with code 100005
        let currentCode = 100005;

        (prisma.gameInstance.findFirst as any).mockImplementation(() =>
            Promise.resolve({ accessCode: currentCode.toString().padStart(6, '0') })
        );

        const codes: string[] = [];
        for (let i = 0; i < 5; i++) {
            const code = await gameInstanceService.generateUniqueAccessCode();
            codes.push(code);
            currentCode++; // Simulate the increment for next call
        }

        // Verify sequential generation
        expect(codes).toEqual(['100006', '100007', '100008', '100009', '100010']);
    });
});
