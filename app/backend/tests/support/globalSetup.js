const dotenv = require('dotenv');
const path = require('path');

module.exports = async () => {
    // Load test-specific environment variables
    dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

    // Set environment variables needed for tests
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-for-tests';

    // Assign a random port between 4000-9000 for tests to avoid conflicts
    process.env.PORT = (Math.floor(Math.random() * 5000) + 4000).toString();

    console.log(`Test setup complete, using port ${process.env.PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL}`);
    console.log(`Redis URL: ${process.env.REDIS_URL}`);

    // Return empty object to satisfy Jest
    return {};
};
