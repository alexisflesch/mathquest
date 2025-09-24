"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameTemplateService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const deleteAllGameInstanceRedisKeys_1 = require("./deleteAllGameInstanceRedisKeys");
const logger = (0, logger_1.default)('GameTemplateService');
class GameTemplateService {
    /**
     * Student-driven GameTemplate creation: randomly select questions and create a template
     */
    async createStudentGameTemplate(data) {
        // Get the username if not provided
        let username = data.username;
        if (!username) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: data.userId },
                select: { username: true }
            });
            username = user?.username || 'Élève';
        }
        // 1. Find random questions matching the filters
        // First get all matching questions to shuffle them
        const allQuestions = await prisma_1.prisma.question.findMany({
            where: {
                gradeLevel: data.gradeLevel,
                discipline: data.discipline,
                themes: { hasSome: data.themes },
                NOT: {
                    excludedFrom: {
                        has: data.playMode
                    }
                }
            },
            select: { uid: true } // Only need UIDs for efficiency
        });
        // Only check that we have at least one question
        if (allQuestions.length === 0) {
            throw new Error('No questions found for the selected filters');
        }
        // Shuffle and take the requested number (Fisher-Yates shuffle)
        const shuffledQuestions = [...allQuestions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }
        // Take only what we need
        const selectedQuestionUids = shuffledQuestions
            .slice(0, data.nbOfQuestions)
            .map(q => q.uid);
        // Now fetch the full question data for the selected UIDs
        const questions = await prisma_1.prisma.question.findMany({
            where: {
                uid: { in: selectedQuestionUids }
            }
        });
        // Use whatever questions we found (even if less than requested)
        const actualNbOfQuestions = Math.min(questions.length, data.nbOfQuestions);
        // 2. Create the GameTemplate
        const gameTemplate = await prisma_1.prisma.gameTemplate.create({
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
    async creategameTemplate(userId, data) {
        // Validate that the creator user exists
        const creator = await prisma_1.prisma.user.findUnique({
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
                defaultMode: data.defaultMode,
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
        return prisma_1.prisma.gameTemplate.create({
            data: {
                ...rest,
                creatorId: userId, // Use unified creatorId
                defaultMode: data.defaultMode,
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
    async getgameTemplateById(id, includeQuestions) {
        return prisma_1.prisma.gameTemplate.findUnique({
            where: { id },
            include: includeQuestions ? {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            } : undefined
        });
    }
    async getgameTemplates(userId, filters, pagination) {
        const where = { creatorId: userId, ...filters };
        const [gameTemplates, total] = await Promise.all([
            prisma_1.prisma.gameTemplate.findMany({
                where,
                skip: pagination?.skip,
                take: pagination?.take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.prisma.gameTemplate.count({ where })
        ]);
        return {
            gameTemplates,
            total,
            page: pagination?.skip ? Math.floor(pagination.skip / pagination.take) + 1 : 1,
            pageSize: pagination?.take || gameTemplates.length,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : 1
        };
    }
    async updategameTemplate(userId, updateData) {
        const { id, questions, ...rest } = updateData;
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        return prisma_1.prisma.gameTemplate.update({
            where: { id },
            data: {
                ...rest,
                defaultMode: rest.defaultMode,
            },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
    async deletegameTemplate(userId, id, forceDelete = false) {
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
        }
        // Check if there are any game instances using this template
        const gameInstances = await prisma_1.prisma.gameInstance.findMany({
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
                    await (0, deleteAllGameInstanceRedisKeys_1.deleteAllGameInstanceRedisKeys)(instance.accessCode);
                }
                await prisma_1.prisma.gameInstance.delete({ where: { id: instance.id } });
            }
        }
        await prisma_1.prisma.gameTemplate.delete({ where: { id } });
    }
    async addQuestionTogameTemplate(userId, id, questionUid, sequence) {
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        await prisma_1.prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: id,
                questionUid: questionUid,
                sequence: sequence || 1
            }
        });
        return prisma_1.prisma.gameTemplate.findFirst({
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
    async removeQuestionFromgameTemplate(userId, id, questionUid) {
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        await prisma_1.prisma.questionsInGameTemplate.delete({
            where: {
                gameTemplateId_questionUid: {
                    gameTemplateId: id,
                    questionUid: questionUid
                }
            }
        });
        return prisma_1.prisma.gameTemplate.findFirst({
            where: { id, creatorId: userId },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
    }
    async updateQuestionSequence(userId, id, updates) {
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to update it`);
        }
        for (const { questionUid, sequence } of updates) {
            await prisma_1.prisma.questionsInGameTemplate.update({
                where: {
                    gameTemplateId_questionUid: {
                        gameTemplateId: id,
                        questionUid: questionUid
                    }
                },
                data: { sequence }
            });
        }
        return prisma_1.prisma.gameTemplate.findFirst({
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
exports.GameTemplateService = GameTemplateService;
/**
 * Generate appropriate game template name based on play mode
 */
function generateGameTemplateName(playMode, username, discipline) {
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
