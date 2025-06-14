"use strict";
/**
 * Request validation middleware using Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestBody = validateRequestBody;
exports.validateRequestParams = validateRequestParams;
exports.validateRequestQuery = validateRequestQuery;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Middleware to validate request body using a Zod schema
 */
function validateRequestBody(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                logger_1.logger.warn({ validationErrors, requestBody: req.body }, 'Request validation failed');
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
            logger_1.logger.error({ error }, 'Unexpected validation error');
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
function validateRequestParams(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.params);
            req.params = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                logger_1.logger.warn({ validationErrors, requestParams: req.params }, 'Params validation failed');
                res.status(400).json({
                    error: 'Invalid request parameters',
                    success: false,
                    details: validationErrors
                });
                return;
            }
            logger_1.logger.error({ error }, 'Unexpected params validation error');
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
function validateRequestQuery(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.query);
            req.query = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                logger_1.logger.warn({ validationErrors, requestQuery: req.query }, 'Query validation failed');
                res.status(400).json({
                    error: 'Invalid query parameters',
                    success: false,
                    details: validationErrors
                });
                return;
            }
            logger_1.logger.error({ error }, 'Unexpected query validation error');
            res.status(500).json({
                error: 'Internal validation error',
                success: false
            });
        }
    };
}
