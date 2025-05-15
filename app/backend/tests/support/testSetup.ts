// Test environment setup functions
export const setup = async (): Promise<void> => {
    process.env.NODE_ENV = 'test';

    // Assign a random port between 4000-9000 for tests
    process.env.PORT = (Math.floor(Math.random() * 5000) + 4000).toString();

    // Could add other test setup like:
    // - Setting up a test database
    // - Creating test data
    // - Setting up test JWT_SECRET
    process.env.JWT_SECRET = 'test-secret-key-for-tests';
};

export const teardown = async (): Promise<void> => {
    // Clean up any resources created for testing
};
