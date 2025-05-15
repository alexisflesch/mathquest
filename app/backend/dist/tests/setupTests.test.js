"use strict";
// Test setup function
const setup = async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '9999'; // Use a specific port for this test
};
const teardown = async () => {
    // No cleanup needed
};
describe('Mock environment setup', () => {
    beforeAll(async () => {
        await setup();
    });
    afterAll(async () => {
        await teardown();
    });
    it('should set NODE_ENV to test', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });
    it('should set a test port', () => {
        expect(process.env.PORT).toBeDefined();
        expect(parseInt(process.env.PORT)).toBeGreaterThan(0);
    });
});
