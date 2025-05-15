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
            tsconfig: 'tsconfig.json' // Points to backend's tsconfig
        }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    // Setup global test environment
    globalSetup: '<rootDir>/tests/support/globalSetup.js',
    globalTeardown: '<rootDir>/tests/support/globalTeardown.js',
    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    modulePaths: ['<rootDir>'],
    // Prevent running the same tests in parallel to avoid port conflicts
    maxConcurrency: 1,
    maxWorkers: 1,
    // Force exit after tests complete to avoid hanging due to open handles
    forceExit: true,
    // Set a timeout for tests to avoid hanging indefinitely
    testTimeout: 30000
};
