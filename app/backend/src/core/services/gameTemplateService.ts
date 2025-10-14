import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { Prisma } from '@prisma/client';
import { PlayMode } from '@shared/types/core';
import { deleteAllGameInstanceRedisKeys } from './deleteAllGameInstanceRedisKeys';

const logger = createLogger('GameTemplateService');

export interface StudentGameTemplateCreationData {
    userId: string;
    username?: string; // Add optional username field
    playMode?: string; // Add playMode to determine naming
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

export class GameTemplateService {
    /**
     * Student-driven GameTemplate creation: randomly select questions and create a template
     */
    async createStudentGameTemplate(data: StudentGameTemplateCreationData) {
        // Get the username if not provided
        let username = data.username;
        if (!username) {
            const user = await prisma.user.findUnique({
                where: { id: data.userId },
                select: { username: true }
            });
            username = user?.username || 'Élève';
        }

        // 1. Select random questions balancing across tags
        const selectedQuestionUids = await this.selectRandomQuestions(
            data.discipline,
            data.gradeLevel,
            data.themes,
            data.nbOfQuestions,
            data.playMode
        );

        // Now fetch the full question data for the selected UIDs
        const questions = await prisma.question.findMany({
            where: {
                uid: { in: selectedQuestionUids }
            }
        });

        // Use whatever questions we found (even if less than requested)
        const actualNbOfQuestions = Math.min(questions.length, data.nbOfQuestions);

        // 2. Create the GameTemplate
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: generateGameTemplateName(data.playMode, username, data.discipline),
                creatorId: data.userId, // Use unified creatorId
                gradeLevel: data.gradeLevel,
                themes: data.themes,
                discipline: data.discipline,
                description: "AUTO: Created from student UI",
                defaultMode: data.playMode === 'practice' ? 'practice' : 'tournament',
                questions: {
                    create: selectedQuestionUids.map((uid, idx) => ({
                        questionUid: uid,
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
        // Validate that the creator user exists
        const creator = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true }
        });

        if (!creator) {
            throw new Error(`Creator user with ID ${userId} does not exist`);
        }

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
            creatorUsername: creator.username,
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
        const gameInstances = await prisma.gameInstance.findMany({
            where: { gameTemplateId: id },
            select: { id: true, accessCode: true }
        });
        const gameInstanceCount = gameInstances.length;

        if (gameInstanceCount > 0 && !forceDelete) {
            throw new Error(`Cannot delete template: ${gameInstanceCount} game session${gameInstanceCount > 1 ? 's' : ''} still reference${gameInstanceCount === 1 ? 's' : ''} this template. Delete the game sessions first.`);
        }

        // If forceDelete is true, first delete all related game instances and their Redis state
        if (forceDelete && gameInstanceCount > 0) {
            for (const instance of gameInstances) {
                if (instance.accessCode) {
                    await deleteAllGameInstanceRedisKeys(instance.accessCode);
                }
                await prisma.gameInstance.delete({ where: { id: instance.id } });
            }
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

    /**
     * Get distinct tags for the given discipline, gradeLevel, and themes
     */
    private async getTagsForThemes(discipline: string, gradeLevel: string, themes: string[]): Promise<string[]> {
        const result = await prisma.question.findMany({
            where: {
                discipline,
                gradeLevel,
                themes: { hasSome: themes },
                isHidden: false
            },
            select: { tags: true }
        });
        const tagSet = new Set<string>();
        result.forEach(q => q.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet);
    }

    /**
     * Select N random questions balancing across tags
     */
    private async selectRandomQuestions(discipline: string, gradeLevel: string, themes: string[], N: number, playMode?: string): Promise<string[]> {
        const tags = await this.getTagsForThemes(discipline, gradeLevel, themes);
        if (tags.length === 0) {
            throw new Error('No tags found for the selected filters');
        }
        const perTag = Math.ceil(N / tags.length);
        const selectedQuestions: string[] = [];

        for (const tag of tags) {
            const questions = await prisma.question.findMany({
                where: {
                    discipline,
                    themes: { hasSome: themes },
                    tags: { has: tag },
                    gradeLevel,
                    isHidden: false,
                    ...(playMode && { excludedFrom: { has: playMode } })
                },
                select: { uid: true },
                orderBy: { uid: 'asc' }, // Note: RANDOM() not supported in Prisma orderBy, shuffle at end ensures randomness
                take: perTag
            });
            const uids = questions.map(q => q.uid);
            selectedQuestions.push(...uids);
            if (selectedQuestions.length >= N) break;
        }

        // If not enough, query remaining
        if (selectedQuestions.length < N) {
            const remaining = await prisma.question.findMany({
                where: {
                    discipline,
                    themes: { hasSome: themes },
                    gradeLevel,
                    isHidden: false,
                    uid: { notIn: selectedQuestions },
                    ...(playMode && { excludedFrom: { has: playMode } })
                },
                select: { uid: true },
                orderBy: { uid: 'asc' },
                take: N - selectedQuestions.length
            });
            selectedQuestions.push(...remaining.map(q => q.uid));
        }

        // Shuffle the final set
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }

        return selectedQuestions.slice(0, N);
    }
}

/**
 * Generate appropriate game template name based on play mode
 */
function generateGameTemplateName(playMode?: string, username?: string, discipline?: string): string {
    const displayName = username || 'Élève';

    switch (playMode) {
        case 'practice':
            return `Entraînement de ${displayName}`;
        case 'tournament':
            return `Tournoi de ${displayName}`;
        default:
            return `Jeu de ${displayName}`;
    }
}
