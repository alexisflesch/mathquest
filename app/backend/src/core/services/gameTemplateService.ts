import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { Prisma } from '@prisma/client';

const logger = createLogger('GameTemplateService');

export interface StudentGameTemplateCreationData {
    userId: string;
    gradeLevel: string;
    discipline: string;
    themes: string[];
    nbOfQuestions: number;
}

export interface GameTemplateCreationData {
    name: string;
    themes: string[];
    discipline: string;
    gradeLevel: string;
    description?: string;
    defaultMode?: string;
    questions?: any[];
    questionUids?: string[]; // Add support for simple question ID array
}

export interface GameTemplateUpdateData {
    id: string;
    name?: string;
    themes?: string[];
    discipline?: string;
    gradeLevel?: string;
    description?: string;
    defaultMode?: string;
    questions?: any[];
}

type PlayMode = 'quiz' | 'tournament' | 'practice';

export class GameTemplateService {
    /**
     * Student-driven GameTemplate creation: randomly select questions and create a template
     */
    async createStudentGameTemplate(data: StudentGameTemplateCreationData) {
        // 1. Find random questions matching the filters
        const questions = await prisma.question.findMany({
            where: {
                gradeLevel: data.gradeLevel,
                discipline: data.discipline,
                themes: { hasSome: data.themes },
                isHidden: false
            },
            orderBy: { updatedAt: 'desc' }, // fallback order
            take: data.nbOfQuestions
        });

        // Only check that we have at least one question
        if (questions.length === 0) {
            throw new Error('No questions found for the selected filters');
        }

        // Use whatever questions we found (even if less than requested)
        const actualNbOfQuestions = Math.min(questions.length, data.nbOfQuestions);

        // 2. Create the GameTemplate
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: `Student Game (${data.discipline})`,
                creatorId: data.userId, // Use unified creatorId
                gradeLevel: data.gradeLevel,
                themes: data.themes,
                discipline: data.discipline,
                defaultMode: 'tournament',
                questions: {
                    create: questions.map((q, idx) => ({
                        questionUid: q.uid,
                        sequence: idx + 1
                    }))
                }
            },
            include: {
                questions: { include: { question: true } }
            }
        });
        return gameTemplate;
    }
    async creategameTemplate(userId: string, data: GameTemplateCreationData) {
        const { questions, questionUids, ...rest } = data;

        // Convert questionUids to questions format if provided
        let questionData = questions;
        if (questionUids && questionUids.length > 0) {
            questionData = questionUids.map((questionUid, index) => ({
                questionUid, // unified naming
                sequence: index
            }));
        }

        logger.info({
            userId,
            questionData,
            rest,
            fullCreateData: {
                ...rest,
                creatorId: userId,
                defaultMode: data.defaultMode as PlayMode,
                ...(questionData ? {
                    questions: {
                        create: questionData.map(q => ({
                            questionUid: q.questionUid,
                            sequence: q.sequence
                        }))
                    }
                } : {})
            }
        }, 'About to create gameTemplate with questions');

        return prisma.gameTemplate.create({
            data: {
                ...rest,
                creatorId: userId, // Use unified creatorId
                defaultMode: data.defaultMode as PlayMode,
                ...(questionData ? {
                    questions: {
                        create: questionData.map(q => ({
                            questionUid: q.questionUid, // unified naming
                            sequence: q.sequence
                        }))
                    }
                } : {})
            },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
    async getgameTemplateById(id: string, includeQuestions?: boolean) {
        return prisma.gameTemplate.findUnique({
            where: { id },
            include: includeQuestions ? {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            } : undefined
        });
    }
    async getgameTemplates(userId: string, filters?: any, pagination?: any) {
        const where = { creatorId: userId, ...filters };
        const [gameTemplates, total] = await Promise.all([
            prisma.gameTemplate.findMany({
                where,
                skip: pagination?.skip,
                take: pagination?.take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.gameTemplate.count({ where })
        ]);
        return {
            gameTemplates,
            total,
            page: pagination?.skip ? Math.floor(pagination.skip / pagination.take) + 1 : 1,
            pageSize: pagination?.take || gameTemplates.length,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : 1
        };
    }
    async updategameTemplate(userId: string, updateData: GameTemplateUpdateData) {
        const { id, questions, ...rest } = updateData;
        const existing = await prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        return prisma.gameTemplate.update({
            where: { id },
            data: {
                ...rest,
                defaultMode: rest.defaultMode as PlayMode,
            },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
    async deletegameTemplate(userId: string, id: string, forceDelete: boolean = false) {
        const existing = await prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
        }

        // Check if there are any game instances using this template
        const gameInstanceCount = await prisma.gameInstance.count({
            where: { gameTemplateId: id }
        });

        if (gameInstanceCount > 0 && !forceDelete) {
            throw new Error(`Cannot delete template: ${gameInstanceCount} game session${gameInstanceCount > 1 ? 's' : ''} still reference${gameInstanceCount === 1 ? 's' : ''} this template. Delete the game sessions first.`);
        }

        // If forceDelete is true, first delete all related game instances
        if (forceDelete && gameInstanceCount > 0) {
            await prisma.gameInstance.deleteMany({
                where: { gameTemplateId: id }
            });
        }

        await prisma.gameTemplate.delete({ where: { id } });
    }
    async addQuestionTogameTemplate(userId: string, id: string, questionUid: string, sequence?: number) {
        const existing = await prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: id,
                questionUid: questionUid,
                sequence: sequence || 1
            }
        });
        return prisma.gameTemplate.findFirst({
            where: { id, creatorId: userId },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'desc' },
                    take: 1
                }
            }
        });
    }
    async removeQuestionFromgameTemplate(userId: string, id: string, questionUid: string) {
        const existing = await prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        await prisma.questionsInGameTemplate.delete({
            where: {
                gameTemplateId_questionUid: {
                    gameTemplateId: id,
                    questionUid: questionUid
                }
            }
        });
        return prisma.gameTemplate.findFirst({
            where: { id, creatorId: userId },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
    async updateQuestionSequence(userId: string, id: string, updates: any[]) {
        const existing = await prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        for (const { questionUid, sequence } of updates) {
            await prisma.questionsInGameTemplate.update({
                where: {
                    gameTemplateId_questionUid: {
                        gameTemplateId: id,
                        questionUid: questionUid
                    }
                },
                data: { sequence }
            });
        }
        return prisma.gameTemplate.findFirst({
            where: { id, creatorId: userId },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
}
