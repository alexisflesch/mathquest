import express from 'express';
import { z } from 'zod';
import { validateGameAccessByCode } from '@/utils/gameAuthorization';

const router = express.Router();

const ValidatePageAccessSchema = z.object({
    pageType: z.enum(['dashboard', 'projection', 'practice', 'tournament']),
    accessCode: z.string(),
    // Optionally add more fields as needed
});

// Route: POST /api/v1/validatePageAccess
router.post('/', async (req, res) => {
    try {
        const { pageType, accessCode } = ValidatePageAccessSchema.parse(req.body);
        let userId: string | null = null;
        if (typeof req.user === 'object' && req.user && 'id' in req.user && typeof req.user.id === 'string') {
            userId = req.user.id;
        } else if (typeof req.body.userId === 'string') {
            userId = req.body.userId;
        }
        if (!userId) {
            return res.status(401).json({ valid: false, reason: 'NOT_AUTHENTICATED' });
        }
        const requireQuizMode = (pageType === 'dashboard' || pageType === 'projection');
        const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'ci';
        const result = await validateGameAccessByCode({
            accessCode,
            userId,
            requireQuizMode,
            isTestEnvironment
        });
        if (!result.isAuthorized) {
            return res.status(403).json({
                valid: false,
                reason: result.errorCode || 'ACCESS_DENIED',
                message: result.errorMessage || 'Access denied',
                gameId: result.gameInstance?.id || null
            });
        }
        return res.json({
            valid: true,
            gameId: result.gameInstance.id,
            playMode: result.gameInstance.playMode,
        });
    } catch (err) {
        let message = 'Unknown error';
        if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            message = err.message;
        }
        return res.status(400).json({ valid: false, reason: 'INVALID_REQUEST', message });
    }
});

export default router;
