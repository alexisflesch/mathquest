"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const gameAuthorization_1 = require("@/utils/gameAuthorization");
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
const ValidatePageAccessSchema = zod_1.z.object({
    pageType: zod_1.z.enum(['dashboard', 'projection', 'practice', 'tournament']),
    accessCode: zod_1.z.string(),
    // Optionally add more fields as needed
});
// Route: POST /api/v1/validatePageAccess
router.post('/', auth_1.teacherAuth, async (req, res) => {
    console.log('[validatePageAccess] Incoming request', {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        user: req.user,
        cookies: req.cookies,
        headers: req.headers,
    });
    if (!req.user) {
        console.warn('[validatePageAccess] teacherAuth did not set req.user', {
            cookies: req.cookies,
            headers: req.headers,
        });
    }
    else {
        console.log('[validatePageAccess] teacherAuth set req.user', req.user);
    }
    try {
        const { pageType, accessCode } = ValidatePageAccessSchema.parse(req.body);
        let userId = null;
        if (req.user && typeof req.user.userId === 'string') {
            userId = req.user.userId;
            console.log('[validatePageAccess] userId from req.user', userId);
        }
        else if (typeof req.body.userId === 'string') {
            userId = req.body.userId;
            console.log('[validatePageAccess] userId from req.body', userId);
        }
        if (!userId) {
            console.warn('[validatePageAccess] NOT_AUTHENTICATED', { pageType, accessCode });
            res.status(401).json({ valid: false, reason: 'NOT_AUTHENTICATED' });
            return;
        }
        const requireQuizMode = (pageType === 'dashboard' || pageType === 'projection');
        const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'ci';
        console.log('[validatePageAccess] Validating access', { accessCode, userId, requireQuizMode, isTestEnvironment });
        const result = await (0, gameAuthorization_1.validateGameAccessByCode)({
            accessCode,
            userId,
            requireQuizMode,
            isTestEnvironment
        });
        console.log('[validatePageAccess] validateGameAccessByCode result', result);
        if (!result.isAuthorized) {
            console.warn('[validatePageAccess] ACCESS_DENIED', {
                accessCode,
                userId,
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                gameId: result.gameInstance?.id || null
            });
            res.status(403).json({
                valid: false,
                reason: result.errorCode || 'ACCESS_DENIED',
                message: result.errorMessage || 'Access denied',
                gameId: result.gameInstance?.id || null
            });
            return;
        }
        console.log('[validatePageAccess] ACCESS_GRANTED', { accessCode, userId, gameId: result.gameInstance.id });
        res.json({
            valid: true,
            gameId: result.gameInstance.id,
            playMode: result.gameInstance.playMode,
        });
    }
    catch (err) {
        let message = 'Unknown error';
        if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            message = err.message;
        }
        console.error('[validatePageAccess] INVALID_REQUEST', { error: err, message });
        res.status(400).json({ valid: false, reason: 'INVALID_REQUEST', message });
    }
});
exports.default = router;
