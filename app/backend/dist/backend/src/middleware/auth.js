"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.teacherAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("@/utils/logger"));
const prisma_1 = require("@/db/prisma");
// Create a middleware-specific logger
const logger = (0, logger_1.default)('Auth');
// JWT secret key should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
/**
 * Authentication middleware for teacher routes
 */
const teacherAuth = async (req, res, next) => {
    try {
        let token;
        // First, try to get the token from Authorization header
        const authHeader = req.headers.authorization;
        // Debug log for incoming Authorization header
        logger.info({ authHeader }, 'DEBUG: Received Authorization header');
        if (authHeader) {
            // Check for Bearer token format
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
        // If no token from header, try to get from cookies
        if (!token) {
            token = req.cookies?.teacherToken || req.cookies?.authToken;
            logger.info({
                cookiesAvailable: !!req.cookies,
                teacherToken: !!req.cookies?.teacherToken,
                authToken: !!req.cookies?.authToken,
                allCookies: req.cookies ? Object.keys(req.cookies) : []
            }, 'DEBUG: Checking cookies for token');
        }
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Validate that the user actually exists in the database
        const userExists = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, role: true }
        });
        if (!userExists) {
            logger.warn({
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            }, 'Authentication failed: User from JWT token does not exist in database');
            res.status(401).json({ error: 'Invalid user credentials' });
            return;
        }
        // Update the decoded payload with the actual user data from database
        const validatedUser = {
            userId: userExists.id,
            username: userExists.username || decoded.username,
            role: userExists.role
        };
        // Attach validated user info to request
        req.user = validatedUser;
        next();
    }
    catch (error) {
        logger.error({ error }, 'Authentication error');
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};
exports.teacherAuth = teacherAuth;
/**
 * Optional authentication middleware
 * Will set req.user if a valid token is provided but won't reject the request if no token is provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        // First, try to get the token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader) {
            // Check for Bearer token format
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
        // If no token from header, try to get from cookies
        if (!token) {
            token = req.cookies?.teacherToken || req.cookies?.authToken;
            // Debug: Log what we're getting from cookies
            logger.debug('Cookie token extraction', {
                hasTeacherToken: !!req.cookies?.teacherToken,
                hasAuthToken: !!req.cookies?.authToken,
                tokenLength: token ? token.length : 0,
                tokenStart: token ? token.substring(0, 20) : 'none',
                allCookies: Object.keys(req.cookies || {})
            });
        }
        if (!token) {
            return next(); // Continue without authentication
        }
        // Debug: Log the exact token we're trying to verify
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('JWT verification attempt', {
                fullToken: token,
                secretPresent: !!JWT_SECRET,
                secretLength: JWT_SECRET?.length || 0
            });
        }
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Validate that the user actually exists in the database
        const userExists = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, role: true }
        });
        if (!userExists) {
            // Invalid user, but we still continue without authentication
            logger.debug({
                userId: decoded.userId,
                username: decoded.username
            }, 'Invalid user in optional authentication - continuing without auth');
            return next();
        }
        // Update the decoded payload with the actual user data from database
        const validatedUser = {
            userId: userExists.id,
            username: userExists.username || decoded.username,
            role: userExists.role
        };
        // Attach validated user info to request
        req.user = validatedUser;
    }
    catch (error) {
        // Invalid token, but we still continue without authentication
        logger.debug({ error }, 'Invalid token in optional authentication');
    }
    next();
};
exports.optionalAuth = optionalAuth;
