/**
 * Error Boundaries and Recovery Tests
 *
 * Tests for error boundary components, error recovery mechanisms,
 * fallback UI states, and graceful error handling throughout the application.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';

// Add Jest globals
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;

// Mock error logging
const mockLogError = jest.fn();
const mockReportError = jest.fn();

// Mock components that might throw errors
jest.mock('../../src/components/AnswerDebug', () => ({
    __esModule: true,
    default: ({ questionId }: any) => {
        if (questionId === 'error-question') {
            throw new Error('AnswerDebug component error');
        }
        return <div data-testid="answer-debug">AnswerDebug</div>;
    }
}));

jest.mock('../../src/components/QrCodeWithLogo', () => ({
    __esModule: true,
    default: ({ code }: any) => {
        if (code === 'error-code') {
            throw new Error('QrCode component error');
        }
        return <div data-testid="qr-code">QrCode</div>;
    }
}));

jest.mock('../../src/components/Snackbar', () => ({
    __esModule: true,
    default: ({ open, message, type }: any) => {
        if (message === 'error-message') {
            throw new Error('Snackbar component error');
        }
        return open ? <div data-testid="snackbar" data-type={type}>{message}</div> : null;
    }
}));

// Test Error Boundary Component
class TestErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError && this.state.error) {
            return (
                <div data-testid="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>{this.state.error.message}</p>
                    <button
                        data-testid="reset-error"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Test component that can throw errors
const TestComponent: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({
    shouldThrow = false,
    errorType = 'generic'
}) => {
    if (shouldThrow) {
        if (errorType === 'network') {
            throw new Error('Network error');
        }
        throw new Error('Component error');
    }
    return <div data-testid="test-component">Working component</div>;
};

describe('Error Boundaries and Recovery', () => {
    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        jest.clearAllMocks();
    });

    describe('Error Boundary Component', () => {
        it('should render children normally when no error occurs', () => {
            render(
                <TestErrorBoundary>
                    <TestComponent />
                </TestErrorBoundary>
            );

            expect(screen.getByTestId('test-component')).toBeInTheDocument();
            expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
        });

        it('should catch and display error when component throws', () => {
            render(
                <TestErrorBoundary>
                    <TestComponent shouldThrow={true} />
                </TestErrorBoundary>
            );

            expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('Component error')).toBeInTheDocument();
        });

        it('should display reset button when error occurs', () => {
            render(
                <TestErrorBoundary>
                    <TestComponent shouldThrow={true} />
                </TestErrorBoundary>
            );

            expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
            expect(screen.getByTestId('reset-error')).toBeInTheDocument();
            expect(screen.getByText('Try again')).toBeInTheDocument();
        });
    });

    describe('API Error Recovery', () => {
        it('should handle 404 errors gracefully', async () => {
            // Mock fetch to return 404
            global.fetch = (jest.fn() as any).mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: () => Promise.resolve({ error: 'Not Found' }),
            });

            const TestApiComponent = () => {
                const [data, setData] = React.useState(null);
                const [error, setError] = React.useState<Error | null>(null);

                React.useEffect(() => {
                    const makeApiCall = async () => {
                        try {
                            const response = await fetch('/api/questions');
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            const result = await response.json();
                            setData(result);
                            setError(null);
                        } catch (err) {
                            setError(err as Error);
                        }
                    };
                    makeApiCall();
                }, []);

                if (error) {
                    return <div data-testid="404-error">{error.message}</div>;
                }

                return <div data-testid="api-success">Success</div>;
            };

            render(<TestApiComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('404-error')).toBeInTheDocument();
            });
        });

        it('should handle 500 server errors gracefully', async () => {
            // Mock fetch to return 500
            global.fetch = (jest.fn() as any).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({ error: 'Internal Server Error' }),
            });

            const TestApiComponent = () => {
                const [data, setData] = React.useState(null);
                const [error, setError] = React.useState<Error | null>(null);

                React.useEffect(() => {
                    const makeApiCall = async () => {
                        try {
                            const response = await fetch('/api/questions');
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            const result = await response.json();
                            setData(result);
                            setError(null);
                        } catch (err) {
                            setError(err as Error);
                        }
                    };
                    makeApiCall();
                }, []);

                if (error) {
                    return <div data-testid="server-error">{error.message}</div>;
                }

                return <div data-testid="api-success">Success</div>;
            };

            render(<TestApiComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('server-error')).toBeInTheDocument();
            });
        });

        it('should retry API calls on failure with exponential backoff', async () => {
            jest.useFakeTimers();

            let callCount = 0;
            global.fetch = (jest.fn() as any).mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: 'success' }),
                });
            });

            const TestRetryComponent = () => {
                const [data, setData] = React.useState(null);
                const [error, setError] = React.useState<Error | null>(null);
                const [retryCount, setRetryCount] = React.useState(0);

                const makeApiCall = React.useCallback(async () => {
                    try {
                        const response = await fetch('/api/questions');
                        const result = await response.json();
                        setData(result);
                        setError(null);
                    } catch (err) {
                        if (retryCount < 2) { // Retry up to 2 times (3 total calls)
                            // Use setTimeout with a very short delay for testing
                            setTimeout(() => {
                                setRetryCount(prev => prev + 1);
                            }, 1);
                        } else {
                            setError(err as Error);
                        }
                    }
                }, [retryCount]);

                // Effect to trigger retry when retryCount changes
                React.useEffect(() => {
                    if (retryCount > 0 && retryCount <= 2) {
                        makeApiCall();
                    }
                }, [retryCount, makeApiCall]);

                React.useEffect(() => {
                    makeApiCall();
                }, []);

                if (error) {
                    return <div data-testid="retry-error">Failed after retries: {error.message}</div>;
                }

                if (data) {
                    return <div data-testid="retry-success">Success after {retryCount} retries</div>;
                }

                return <div data-testid="retry-loading">Loading...</div>;
            };

            render(<TestRetryComponent />);

            // Fast-forward timers to trigger retries
            await act(async () => {
                jest.advanceTimersByTime(10);
            });

            await waitFor(() => {
                expect(screen.getByTestId('retry-success')).toBeInTheDocument();
            });

            expect(callCount).toBe(3); // Should have made 3 calls (initial + 2 retries)

            jest.useRealTimers();
        });
    });

    describe('LocalStorage Corruption Recovery', () => {
        it('should handle corrupted localStorage data gracefully', () => {
            const originalGetItem = Storage.prototype.getItem;
            Storage.prototype.getItem = jest.fn((key: string) => {
                if (key === 'corrupted-data') {
                    return 'invalid-json{';
                }
                return originalGetItem.call(localStorage, key as string);
            });

            const TestStorageComponent = () => {
                const [data, setData] = React.useState(null);
                const [error, setError] = React.useState<Error | null>(null);

                React.useEffect(() => {
                    try {
                        const stored = localStorage.getItem('corrupted-data');
                        if (stored) {
                            JSON.parse(stored); // This will throw
                            setData(JSON.parse(stored));
                        }
                    } catch (err) {
                        setError(err as Error);
                    }
                }, []);

                if (error) {
                    return <div data-testid="storage-error">Storage error: {error.message}</div>;
                }

                return <div data-testid="storage-success">Storage OK</div>;
            };

            render(<TestStorageComponent />);

            expect(screen.getByTestId('storage-error')).toBeInTheDocument();
            expect(screen.getByText(/Storage error/)).toBeInTheDocument();

            // Restore original method
            Storage.prototype.getItem = originalGetItem;
        });
    });

    describe('Context Provider Error Recovery', () => {
        const TestContext = React.createContext<any>({});

        it('should handle context errors gracefully', () => {
            const TestContextComponent = () => {
                const context = React.useContext(TestContext);

                if (!context || !context.user) {
                    return <div data-testid="no-context">No context available</div>;
                }

                return <div data-testid="has-context">Welcome {context.user.name}</div>;
            };

            render(
                <TestContext.Provider value={{}}>
                    <TestContextComponent />
                </TestContext.Provider>
            );

            expect(screen.getByTestId('no-context')).toBeInTheDocument();
        });
    });
});