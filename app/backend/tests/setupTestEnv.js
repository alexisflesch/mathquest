// Shared test environment setup for backend tests
require('module-alias/register');

process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ADMIN_PASSWORD = "test_admin";
process.env.PORT = "3001";
process.env.LOG_LEVEL = "error"; // Reduce logging noise in tests
process.env.NODE_ENV = "test"; // Ensure we're in test mode

// Safety check: Ensure we're not accidentally using production database
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mathquest') && !process.env.DATABASE_URL.includes('mathquest_test')) {
    throw new Error('TEST SAFETY VIOLATION: Test is configured to use production database! DATABASE_URL should point to mathquest_test, not mathquest.');
}

// Disable Winston file logging in tests to speed up
process.env.WINSTON_DISABLE_FILE_LOGGING = "true";

// Add any other required environment variables here
