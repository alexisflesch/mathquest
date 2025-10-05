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

// Mock Request for Next.js API route testing - needed for NextRequest to work
global.Request = class MockRequest {
    constructor(url, options = {}) {
        this._url = typeof url === 'string' ? url : url.toString();
        this.method = options.method || 'GET';
        this.headers = options.headers || new Map();
    }

    get url() {
        return this._url;
    }

    clone() {
        return new MockRequest(this._url, { method: this.method, headers: this.headers });
    }
};

// Mock Response for Next.js API route testing
global.Response = class MockResponse {
    constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.statusText = options.statusText || 'OK';
        this.headers = options.headers || new Map();
        this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
        return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }

    clone() {
        return new MockResponse(this.body, {
            status: this.status,
            statusText: this.statusText,
            headers: this.headers
        });
    }

    static json(body, init = {}) {
        return new MockResponse(JSON.stringify(body), {
            ...init,
            headers: {
                'content-type': 'application/json',
                ...init.headers
            }
        });
    }
};

// Mock NextResponse for Next.js API route testing
jest.mock('next/server', () => {
    return {
        NextRequest: class MockNextRequest {
            constructor(url, options = {}) {
                this.url = typeof url === 'string' ? url : url.toString();
                this.method = options.method || 'GET';
                this.headers = options.headers || new Map();
                this.nextUrl = {
                    searchParams: new URLSearchParams(this.url.split('?')[1] || '')
                };
            }
        },
        NextResponse: {
            json: (body, init = {}) => {
                return new global.Response(JSON.stringify(body), {
                    ...init,
                    headers: {
                        'content-type': 'application/json',
                        ...init.headers
                    }
                });
            }
        }
    };
});

// Polyfill StorageEvent for jsdom compatibility
// This fixes issues with useStorage hooks that listen for storage events
if (typeof window !== 'undefined' && !window.StorageEvent) {
    window.StorageEvent = class StorageEvent extends Event {
        constructor(type, eventInitDict = {}) {
            super(type, eventInitDict);

            // Set StorageEvent-specific properties
            this.key = eventInitDict.key || null;
            this.oldValue = eventInitDict.oldValue || null;
            this.newValue = eventInitDict.newValue || null;
            this.storageArea = eventInitDict.storageArea || null;
        }

        // StorageEvent properties
        key;
        oldValue;
        newValue;
        storageArea;
    };
}

// Global mock for @monaco-editor/react to ensure tests get a stable, synchronous
// mock editor instead of the real loader which renders a Loading placeholder in jsdom.
// This mirrors the small in-test mock used by some unit tests but centralizes it so
// all tests benefit and behave consistently.
try {
    // Only apply when running under Jest
    if (typeof jest !== 'undefined') {
        jest.mock('@monaco-editor/react', () => {
            const React = require('react');

            const MockMonacoEditor = (props) => {
                const { onMount, value, onChange } = props || {};
                React.useEffect(() => {
                    if (onMount) {
                        let content = value || '';

                        const modelChangeCallbacks = [];
                        const selectionCallbacks = [];

                        const model = {
                            getValue: () => content,
                            setValue: (v) => {
                                content = v;
                                if (onChange) onChange(v);
                                modelChangeCallbacks.forEach((cb) => cb());
                                selectionCallbacks.forEach((cb) => cb());
                            },
                            getValueInRange: () => '',
                            getWordUntilPosition: () => ({ word: '', startColumn: 1, endColumn: 1 }),
                            getOffsetAt: () => 0,
                        };

                        const mockEditor = {
                            getModel: () => model,
                            setValue: model.setValue,
                            focus: () => { },
                            setPosition: () => { },
                            revealPositionInCenter: () => { },
                            onDidChangeModelContent: (cb) => { modelChangeCallbacks.push(cb); return { dispose: () => { } }; },
                            onDidChangeCursorSelection: (cb) => { selectionCallbacks.push(cb); return { dispose: () => { } }; },
                            getPosition: () => ({ lineNumber: 1, column: 1 }),
                        };

                        const mockMonaco = {
                            languages: { registerCompletionItemProvider: () => ({ dispose: () => { } }) },
                            editor: { setModelMarkers: () => { }, setTheme: () => { } },
                            MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
                        };

                        if (typeof window !== 'undefined') window.__mockMonacoEditor = mockEditor;

                        // Call the onMount hook to simulate real Monaco mounting
                        try {
                            onMount(mockEditor, mockMonaco);
                        } catch (e) {
                            // ignore
                        }
                    }
                }, [onMount, value, onChange]);

                return React.createElement('div', { 'data-testid': 'monaco-editor' }, value || '');
            };

            return { __esModule: true, default: MockMonacoEditor };
        });
    }
} catch (e) {
    // If mocking fails for any reason (non-Jest environment), silently ignore.
}
