"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameTemplateService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameTemplateService');
class GameTemplateService {
    /**
     * Student-driven GameTemplate creation: randomly select questions and create a template
     */
    async createStudentGameTemplate(data) {
        // 1. Find random questions matching the filters
        const questions = await prisma_1.prisma.question.findMany({
            where: {
                gradeLevel: data.gradeLevel,
                discipline: data.discipline,
                tags: { hasSome: data.themes },
                isHidden: false
            },
            orderBy: { updatedAt: 'desc' }, // fallback order
            take: data.nbOfQuestions
        });
        if (questions.length < data.nbOfQuestions) {
            throw new Error('Not enough questions available for the selected filters');
        }
        // 2. Create the GameTemplate
        const gameTemplate = await prisma_1.prisma.gameTemplate.create({
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
    async creategameTemplate(userId, data) {
        const { questions, ...rest } = data;
        return prisma_1.prisma.gameTemplate.create({
            data: {
                ...rest,
                creatorId: userId, // Use unified creatorId
                defaultMode: data.defaultMode,
                ...(questions ? {
                    questions: {
                        create: questions.map((q, idx) => ({
                            questionUid: q.uid,
                            sequence: idx + 1
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
    async deletegameTemplate(userId, id) {
        const existing = await prisma_1.prisma.gameTemplate.findFirst({ where: { id, creatorId: userId } });
        if (!existing) {
            throw new Error(`Quiz template with ID ${id} not found or you don't have permission to delete it`);
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
                questionUid,
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
                    questionUid
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
                        questionUid
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
