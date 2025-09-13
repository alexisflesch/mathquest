// Shared test environment setup for backend tests
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ADMIN_PASSWORD = "test_admin";
process.env.PORT = "3001";
process.env.LOG_LEVEL = "error"; // Reduce logging noise in tests
process.env.NODE_ENV = "test"; // Ensure we're in test mode

// Disable Winston file logging in tests to speed up
process.env.WINSTON_DISABLE_FILE_LOGGING = "true";

// Add any other required environment variables here
