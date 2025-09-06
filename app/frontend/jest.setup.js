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

// Mock HTMLCanvasElement for Plotly.js support
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: jest.fn().mockImplementation((contextType) => {
        if (contextType === '2d') {
            return {
                fillRect: jest.fn(),
                clearRect: jest.fn(),
                getImageData: jest.fn(() => ({ data: new Array(4) })),
                putImageData: jest.fn(),
                createImageData: jest.fn(() => ({ data: new Array(4) })),
                setTransform: jest.fn(),
                drawImage: jest.fn(),
                save: jest.fn(),
                fillText: jest.fn(),
                restore: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                closePath: jest.fn(),
                stroke: jest.fn(),
                translate: jest.fn(),
                scale: jest.fn(),
                rotate: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                transform: jest.fn(),
                rect: jest.fn(),
                clip: jest.fn(),
            };
        } else if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return {
                createShader: jest.fn(),
                shaderSource: jest.fn(),
                compileShader: jest.fn(),
                createProgram: jest.fn(),
                attachShader: jest.fn(),
                linkProgram: jest.fn(),
                useProgram: jest.fn(),
                createBuffer: jest.fn(),
                bindBuffer: jest.fn(),
                bufferData: jest.fn(),
                enableVertexAttribArray: jest.fn(),
                vertexAttribPointer: jest.fn(),
                drawArrays: jest.fn(),
                clear: jest.fn(),
                clearColor: jest.fn(),
                viewport: jest.fn(),
                getShaderParameter: jest.fn(() => true),
                getProgramParameter: jest.fn(() => true),
                getAttribLocation: jest.fn(() => 0),
                getUniformLocation: jest.fn(() => { }),
            };
        }
        return null;
    }),
});

// Mock URL.createObjectURL for Plotly.js support
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLCanvasElement methods that Plotly.js might use
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'mocked-data-url');
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
    if (callback) callback(new Blob());
});
