// Shared test environment setup for backend tests
process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ADMIN_PASSWORD = "test_admin";
process.env.PORT = "3001";
process.env.LOG_LEVEL = "info";

// Add any other required environment variables here
