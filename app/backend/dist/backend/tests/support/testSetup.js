"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardown = exports.setup = void 0;
// Test environment setup functions
const setup = async () => {
    process.env.NODE_ENV = 'test';
    // Assign a random port between 4000-9000 for tests
    process.env.PORT = (Math.floor(Math.random() * 5000) + 4000).toString();
    // Could add other test setup like:
    // - Setting up a test database
    // - Creating test data
    // - Setting up test JWT_SECRET
    process.env.JWT_SECRET = 'test-secret-key-for-tests';
};
exports.setup = setup;
const teardown = async () => {
    // Clean up any resources created for testing
};
exports.teardown = teardown;
