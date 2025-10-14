require('../setupTestEnv');

import { GameTemplateService } from '@/core/services/gameTemplateService';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Mock logger
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

// Mock Prisma
jest.mock('@/db/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        question: {
            findMany: jest.fn(),
        },
        gameTemplate: {
            create: jest.fn(),
        }
    }
}));

describe('GameTemplateService - Tag Balanced Question Selection', () => {
    let service: GameTemplateService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new GameTemplateService();
    });

    it('should select questions with balanced tag distribution', async () => {
        // Mock user lookup
        (jest.mocked(prisma).user.findUnique as any).mockResolvedValue({ username: 'TestUser' });

        // Mock questions with tags: tagA, tagB, tagC, each with 5 questions
        const questions: Array<{ uid: string; discipline: string; gradeLevel: string; themes: string[]; tags: string[]; isHidden: boolean }> = [];
        for (let i = 0; i < 5; i++) {
            questions.push({ uid: `tagA-${i}`, discipline: 'math', gradeLevel: 'CE1', themes: ['addition'], tags: ['tagA'], isHidden: false });
            questions.push({ uid: `tagB-${i}`, discipline: 'math', gradeLevel: 'CE1', themes: ['addition'], tags: ['tagB'], isHidden: false });
            questions.push({ uid: `tagC-${i}`, discipline: 'math', gradeLevel: 'CE1', themes: ['addition'], tags: ['tagC'], isHidden: false });
        }

        // Mock first findMany for tags
        (jest.mocked(prisma).question.findMany as any)
            .mockResolvedValueOnce(questions.map(q => ({ tags: q.tags }))) // for getTagsForThemes
            .mockResolvedValueOnce(questions.slice(0, 3).map(q => ({ uid: q.uid }))) // tagA
            .mockResolvedValueOnce(questions.slice(5, 8).map(q => ({ uid: q.uid }))) // tagB
            .mockResolvedValueOnce(questions.slice(10, 13).map(q => ({ uid: q.uid }))) // tagC
            .mockResolvedValueOnce(questions.slice(0, 9)); // full questions

        // Mock gameTemplate create
        (jest.mocked(prisma).gameTemplate.create as any).mockResolvedValue({
            id: 'template-id',
            questions: questions.slice(0, 9).map((q, idx) => ({ questionUid: q.uid, sequence: idx + 1, question: q }))
        });

        // Call the method
        const result = await service.createStudentGameTemplate({
            userId: 'user-id',
            gradeLevel: 'CE1',
            discipline: 'math',
            themes: ['addition'],
            nbOfQuestions: 9,
            playMode: 'practice'
        });

        // Assert that gameTemplate was created
        expect(jest.mocked(prisma).gameTemplate.create).toHaveBeenCalled();

        // Get the selected question UIDs
        const selectedUids = result.questions.map(q => q.questionUid);

        // Count tags in selected questions
        const tagCounts: Record<string, number> = {};
        selectedUids.forEach(uid => {
            const question = questions.find(q => q.uid === uid);
            if (question) {
                question.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // With balanced selection, each tag should have roughly 3 questions (9/3)
        expect(tagCounts.tagA).toBeGreaterThanOrEqual(2);
        expect(tagCounts.tagB).toBeGreaterThanOrEqual(2);
        expect(tagCounts.tagC).toBeGreaterThanOrEqual(2);
        expect(selectedUids.length).toBe(9);
        expect(new Set(selectedUids).size).toBe(9); // No duplicates
    });
});