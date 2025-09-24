module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.tests.json', // Use test-specific tsconfig for proper path mapping
            // Add baseUrl to help ts-jest resolve paths correctly
            compilerOptions: {
                baseUrl: './'
            }
        }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverage: false, // Disable coverage collection for faster tests
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    // Setup global test environment
    globalSetup: '<rootDir>/tests/support/globalSetup.ts',
    globalTeardown: '<rootDir>/tests/support/globalTeardown.ts',
    setupFiles: ['<rootDir>/tests/setupTestEnv.js'],
    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // <rootDir> is /home/aflesch/mathquest/app/backend/
        '^@shared/(.*)$': '<rootDir>/../shared/$1'
    },
    modulePaths: ['<rootDir>/src'], // Add src to modulePaths
    // Prevent running the same tests in parallel to avoid port conflicts
    maxConcurrency: 1,
    maxWorkers: 1,
    // Force exit after tests complete to avoid hanging due to open handles
    forceExit: true,
    // Set a shorter timeout for tests
    testTimeout: 10000, // Reduced to 10 seconds
    // Skip node_modules transformation for faster startup
    transformIgnorePatterns: [
        'node_modules/(?!(@shared)/)'
    ],
    // Use faster test runner options
    detectOpenHandles: false, // Disable to speed up
    setupFilesAfterEnv: [], // No additional setup files needed
};
