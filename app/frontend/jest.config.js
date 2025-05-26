/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'jsdom',

  // Use Next.js's built-in SWC transform for consistent behavior
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          jsx: true,
          decorators: false,
          dynamicImport: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
      module: {
        type: 'commonjs',
      },
    }],
  },

  // Module name mapping to match Next.js webpack aliases
  moduleNameMapper: {
    // Style files
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",

    // Next.js mocks
    "^next/link$": "<rootDir>/next-link-mock.js",
    "^next/image$": "<rootDir>/next-image-mock.js",

    // Path aliases (matching Next.js webpack config)
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/$1",
    "^@logger$": "<rootDir>/../shared/logger.ts",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@/app/utils/usernameFilter$": "<rootDir>/src/app/utils/usernameFilter.ts",
  },

  // Setup and configuration
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};