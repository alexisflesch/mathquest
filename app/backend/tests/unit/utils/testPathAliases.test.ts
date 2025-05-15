import createLogger from '@/utils/logger';

// Make sure Jest recognizes this test
test('path aliases should work with @ alias', () => {
    // Test if we can import utils with the @ alias
    const logger = createLogger('TestLogger');

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
});
