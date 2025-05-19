"use strict";
/**
 * Basic test file to verify Jest is working properly
 */
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../src/db/prisma");
describe('Basic Database Test', () => {
    test('Should connect to database', async () => {
        // Simple query to test connection
        const teachers = await prisma_1.prisma.teacher.count();
        expect(typeof teachers).toBe('number');
    });
});
