// Add jest-dom custom matchers
require('@testing-library/jest-dom');

// Set up global custom matchers if needed
global.expect = require('@jest/globals').expect;

// Mock window.matchMedia for Jest
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false, // or true, depending on your needs
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
