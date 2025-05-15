/**
 * Basic test file to verify Jest is working properly
 */

import { prisma } from '../../src/db/prisma';

describe('Basic Database Test', () => {
    test('Should connect to database', async () => {
        // Simple query to test connection
        const teachers = await prisma.teacher.count();
        expect(typeof teachers).toBe('number');
    });
});
