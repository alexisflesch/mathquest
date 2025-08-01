/**
 * Basic test file to verify Jest is working properly
 */

import { prisma } from '../../src/db/prisma';

describe('Basic Database Test', () => {
    jest.setTimeout(3000);

    test('Should connect to database', async () => {
        // Simple query to test connection
        const teachers = await prisma.user.count({ where: { role: 'TEACHER' } });
        expect(typeof teachers).toBe('number');
    });
});
