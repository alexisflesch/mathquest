import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createLogger from '@/utils/logger';

// Create a middleware-specific logger
const logger = createLogger('Auth');

// JWT secret key should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';

// Define interface for decoded JWT payload
export interface JwtPayload {
    userId: string;
    username: string;
    role: string;
}

// Extend Express Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Authentication middleware for teacher routes
 */
export const teacherAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;

        // Debug log for incoming Authorization header
        logger.info({ authHeader }, 'DEBUG: Received Authorization header');

        if (!authHeader) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Check for Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }

        const token = parts[1];

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (error) {
        logger.error({ error }, 'Authentication error');
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};

/**
 * Optional authentication middleware
 * Will set req.user if a valid token is provided but won't reject the request if no token is provided
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(); // Continue without authentication
        }

        // Check for Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next(); // Invalid format, but still continue
        }

        const token = parts[1];

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user info to request
        req.user = decoded;
    } catch (error) {
        // Invalid token, but we still continue without authentication
        logger.debug({ error }, 'Invalid token in optional authentication');
    }

    next();
};
