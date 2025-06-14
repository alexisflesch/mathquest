/**
 * Request validation middleware using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body using a Zod schema
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                logger.warn({ validationErrors, requestBody: req.body }, 'Request validation failed');

                res.status(400).json({
                    error: 'Invalid request data',
                    success: false,
                    details: validationErrors,
                    required: validationErrors
                        .filter(err => err.message.includes('required'))
                        .map(err => err.field)
                });
                return;
            }

            logger.error({ error }, 'Unexpected validation error');
            res.status(500).json({
                error: 'Internal validation error',
                success: false
            });
        }
    };
}

/**
 * Middleware to validate request params using a Zod schema
 */
export function validateRequestParams<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.params);
            req.params = validatedData as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                logger.warn({ validationErrors, requestParams: req.params }, 'Params validation failed');

                res.status(400).json({
                    error: 'Invalid request parameters',
                    success: false,
                    details: validationErrors
                });
                return;
            }

            logger.error({ error }, 'Unexpected params validation error');
            res.status(500).json({
                error: 'Internal validation error',
                success: false
            });
        }
    };
}

/**
 * Middleware to validate request query parameters using a Zod schema
 */
export function validateRequestQuery<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.query);
            req.query = validatedData as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                logger.warn({ validationErrors, requestQuery: req.query }, 'Query validation failed');

                res.status(400).json({
                    error: 'Invalid query parameters',
                    success: false,
                    details: validationErrors
                });
                return;
            }

            logger.error({ error }, 'Unexpected query validation error');
            res.status(500).json({
                error: 'Internal validation error',
                success: false
            });
        }
    };
}
