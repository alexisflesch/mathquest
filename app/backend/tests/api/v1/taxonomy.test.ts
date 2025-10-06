import request from 'supertest';
import express from 'express';
import taxonomyRouter from '../../../src/api/v1/taxonomy';

// Mock Prisma using factory function to avoid hoisting issues
jest.mock('@/db/prisma', () => ({
    prisma: {
        taxonomy: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

// Import the mocked prisma to use in tests
import { prisma } from '@/db/prisma';

describe('Taxonomy API', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/taxonomy', taxonomyRouter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /taxonomy', () => {
        it('should return all taxonomy data in ParsedMetadata format', async () => {
            const mockRows = [
                {
                    id: '1',
                    gradeLevel: 'CP',
                    content: {
                        niveau: 'CP',
                        disciplines: [
                            {
                                nom: 'Mathématiques',
                                themes: [
                                    { nom: 'Nombres', tags: ['addition', 'soustraction'] }
                                ]
                            }
                        ]
                    },
                    contentHash: 'hash1',
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    gradeLevel: 'CE1',
                    content: {
                        niveau: 'CE1',
                        disciplines: [
                            {
                                nom: 'Français',
                                themes: [
                                    { nom: 'Grammaire', tags: ['verbes', 'adjectifs'] }
                                ]
                            }
                        ]
                    },
                    contentHash: 'hash2',
                    updatedAt: new Date(),
                },
            ];

            (prisma.taxonomy.findMany as jest.Mock).mockResolvedValue(mockRows);

            const response = await request(app).get('/taxonomy');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('gradeLevels');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.gradeLevels).toEqual(['CP', 'CE1']);
            expect(response.body.metadata).toHaveProperty('CP');
            expect(response.body.metadata).toHaveProperty('CE1');
            expect(response.body.metadata.CP.niveau).toBe('CP');
        });

        it('should return empty metadata if no rows found', async () => {
            (prisma.taxonomy.findMany as jest.Mock).mockResolvedValue([]);

            const response = await request(app).get('/taxonomy');

            expect(response.status).toBe(200);
            expect(response.body.gradeLevels).toEqual([]);
            expect(response.body.metadata).toEqual({});
        });
    });

    describe('GET /taxonomy/:level', () => {
        it('should return metadata for a specific grade level', async () => {
            const mockRow = {
                id: '1',
                gradeLevel: 'CP',
                content: {
                    niveau: 'CP',
                    disciplines: [
                        {
                            nom: 'Mathématiques',
                            themes: [
                                { nom: 'Nombres', tags: ['addition'] }
                            ]
                        }
                    ]
                },
                contentHash: 'hash1',
                updatedAt: new Date(),
            };

            (prisma.taxonomy.findUnique as jest.Mock).mockResolvedValue(mockRow);

            const response = await request(app).get('/taxonomy/CP');

            expect(response.status).toBe(200);
            expect(response.body.niveau).toBe('CP');
            expect(response.body.disciplines).toHaveLength(1);
        });

        it('should return 404 if grade level not found', async () => {
            (prisma.taxonomy.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/taxonomy/INVALID');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
