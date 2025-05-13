/**
 * Database Connection Module
 *
 * This module initializes and exports a single PrismaClient instance for database access.
 * It follows the singleton pattern to prevent multiple connections during development
 * or in a serverless environment.
 *
 * All database access throughout the application should use this exported instance
 * to ensure connection pooling works correctly and to avoid connection limits.
 */
import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@shared/prisma-client/runtime/library").DefaultArgs>;
export default prisma;
