import express, { Request, Response } from 'express';
import createLogger from '@/utils/logger';
import { prisma } from '@/db/prisma';
import ParsedMetadataSchema from '@shared/types/taxonomy';
import type { ParsedMetadata } from '@shared/types/taxonomy';

const logger = createLogger('TaxonomyAPI');
const router = express.Router();

/**
 * GET /api/v1/questions/taxonomy
 * Returns all taxonomy rows as a ParsedMetadata-shaped object
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const rows = await prisma.taxonomy.findMany();
        const metadataMap: Record<string, any> = {};
        const gradeLevels: string[] = [];
        for (const row of rows) {
            const level = (row as any).gradeLevel || (row as any).grade_level;
            // row.content is stored as JSON; ensure it's an object
            metadataMap[level] = row.content as any;
            gradeLevels.push(level as string);
        }

        const payload: any = { gradeLevels, metadata: metadataMap };
        const parseResult = ParsedMetadataSchema.safeParse(payload);
        if (!parseResult.success) {
            logger.error({ errors: parseResult.error.errors }, 'Taxonomy payload failed validation');
            res.status(500).json({ error: 'Internal taxonomy serialization error' });
            return;
        }

        res.status(200).json(parseResult.data as ParsedMetadata);
    } catch (error) {
        logger.error({ error }, 'Error fetching taxonomy');
        res.status(500).json({ error: 'An error occurred while fetching taxonomy' });
    }
});

/**
 * GET /api/v1/questions/taxonomy/:level
 * Returns taxonomy content for a single grade level
 */
router.get('/:level', async (req: Request, res: Response) => {
    try {
        const { level } = req.params;
        const row = await prisma.taxonomy.findUnique({ where: { gradeLevel: level } as any });
        if (!row) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        // Validate the content matches GradeLevelMetadata via the parsed schema
        const singlePayload = { gradeLevels: [level], metadata: { [level]: row.content } };
        const parseResult = ParsedMetadataSchema.safeParse(singlePayload);
        if (!parseResult.success) {
            logger.error({ errors: parseResult.error.errors }, 'Taxonomy single payload failed validation');
            res.status(500).json({ error: 'Internal taxonomy serialization error' });
            return;
        }
        res.status(200).json((parseResult.data.metadata as any)[level]);
    } catch (error) {
        logger.error({ error }, 'Error fetching taxonomy level');
        res.status(500).json({ error: 'An error occurred while fetching taxonomy' });
    }
});

export default router;
