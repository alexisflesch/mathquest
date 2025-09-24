/**
 * General Network Connectivity Edge Cases Tests
 *
 * Tests behavior during network connectivity issues, offline scenarios,
 * connection recovery, and network-related edge cases for general HTTP requests.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock the logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock the storage hooks module
jest.mock('../../src/hooks/useStorage', () => ({
    useLocalStorage: jest.fn(),
    useSessionStorage: jest.fn()
}));

// Import after mocks
import { useLocalStorage, useSessionStorage } from '../../src/hooks/useStorage';

// Mock implementations
const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>;
const mockUseSessionStorage = useSessionStorage as jest.MockedFunction<typeof useSessionStorage>;

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
const mockNavigator = {
    onLine: true
};

Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
});

// Mock online/offline events
let onlineListeners: Function[] = [];
let offlineListeners: Function[] = [];

const mockAddEventListener = jest.fn((event: string, listener: Function) => {
    if (event === 'online') {
        onlineListeners.push(listener);
    } else if (event === 'offline') {
        offlineListeners.push(listener);
    }
});

const mockRemoveEventListener = jest.fn((event: string, listener: Function) => {
    if (event === 'online') {
        onlineListeners = onlineListeners.filter(l => l !== listener);
    } else if (event === 'offline') {
        offlineListeners = offlineListeners.filter(l => l !== listener);
    }
});

Object.defineProperty(window, 'addEventListener', {
    writable: true,
    value: mockAddEventListener
});

Object.defineProperty(window, 'removeEventListener', {
    writable: true,
    value: mockRemoveEventListener
});

// Helper to simulate online/offline events
const simulateOnline = () => {
    act(() => {
        onlineListeners.forEach(listener => listener());
    });
};

const simulateOffline = () => {
    act(() => {
        offlineListeners.forEach(listener => listener());
    });
};

// Component that handles network requests
const NetworkRequestComponent: React.FC = () => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setError(null);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setError('You are currently offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial online status
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const makeRequest = async (shouldFail = false) => {
        setLoading(true);
        setError(null);

        try {
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }

            const response = await fetch('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
            setRetryCount(0);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network request failed';
            setError(errorMessage);

            // Auto-retry logic for certain errors
            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => makeRequest(shouldFail), 1000 * (retryCount + 1));
            }
        } finally {
            setLoading(false);
        }
    };

    const makeRequestWithTimeout = async () => {
        setLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('/api/slow-endpoint', {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Request timed out');
            } else {
                setError(err instanceof Error ? err.message : 'Request failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div data-testid="online-status">{isOnline ? 'online' : 'offline'}</div>
            <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
            <div data-testid="error">{error || 'no-error'}</div>
            <div data-testid="retry-count">{retryCount}</div>
            <div data-testid="data">{data ? JSON.stringify(data) : 'no-data'}</div>
            <button data-testid="make-request" onClick={() => makeRequest()}>
                Make Request
            </button>
            <button data-testid="make-failing-request" onClick={() => makeRequest(true)}>
                Make Failing Request
            </button>
            <button data-testid="make-timeout-request" onClick={makeRequestWithTimeout}>
                Make Timeout Request
            </button>
        </div>
    );
};

// Component that handles offline queue
const OfflineQueueComponent: React.FC = () => {
    const [queue, setQueue] = React.useState<any[]>([]);
    const [processedItems, setProcessedItems] = React.useState<any[]>([]);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const addToQueue = (item: any) => {
        setQueue(prev => [...prev, { ...item, id: Date.now(), timestamp: Date.now() }]);
    };

    const processQueue = async () => {
        if (!navigator.onLine || queue.length === 0) return;

        const itemsToProcess = [...queue];
        setQueue([]);

        for (const item of itemsToProcess) {
            try {
                await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });

                setProcessedItems(prev => [...prev, item]);
            } catch (err) {
                // Re-queue failed items
                setQueue(prev => [...prev, item]);
                setError(err instanceof Error ? err.message : 'Processing failed');
            }
        }
    };

    const clearQueue = () => {
        setQueue([]);
    };

    return (
        <div>
            <div data-testid="queue-status">{isOnline ? 'online' : 'offline'}</div>
            <div data-testid="queue-length">{queue.length}</div>
            <div data-testid="processed-count">{processedItems.length}</div>
            <div data-testid="queue-error">{error || 'no-error'}</div>
            <button data-testid="add-to-queue" onClick={() => addToQueue({ type: 'test', data: 'test-data' })}>
                Add to Queue
            </button>
            <button data-testid="process-queue" onClick={processQueue}>
                Process Queue
            </button>
            <button data-testid="clear-queue" onClick={clearQueue}>
                Clear Queue
            </button>
        </div>
    );
};

// Component that handles connection recovery
const ConnectionRecoveryComponent: React.FC = () => {
    const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
    const [lastConnected, setLastConnected] = React.useState<Date | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleOnline = () => {
            attemptReconnection();
        };

        const handleOffline = () => {
            setConnectionStatus('disconnected');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial connection attempt
        attemptReconnection();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const attemptReconnection = async () => {
        setConnectionStatus('connecting');
        setError(null);

        try {
            const response = await fetch('/api/ping', {
                method: 'GET',
                timeout: 5000
            } as any);

            if (response.ok) {
                setConnectionStatus('connected');
                setLastConnected(new Date());
                setReconnectAttempts(0);
            } else {
                throw new Error('Connection failed');
            }
        } catch (err) {
            setReconnectAttempts(prev => prev + 1);
            setConnectionStatus('disconnected');

            if (reconnectAttempts < 5) {
                setTimeout(attemptReconnection, 2000 * (reconnectAttempts + 1));
            } else {
                setError('Failed to reconnect after multiple attempts');
            }
        }
    };

    const manualReconnect = () => {
        setReconnectAttempts(0);
        attemptReconnection();
    };

    return (
        <div>
            <div data-testid="connection-status">{connectionStatus}</div>
            <div data-testid="reconnect-attempts">{reconnectAttempts}</div>
            <div data-testid="last-connected">{lastConnected ? lastConnected.toISOString() : 'never'}</div>
            <div data-testid="recovery-error">{error || 'no-error'}</div>
            <button data-testid="manual-reconnect" onClick={manualReconnect}>
                Manual Reconnect
            </button>
        </div>
    );
};

describe('General Network Connectivity Edge Cases', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockUseLocalStorage.mockClear();
        mockUseSessionStorage.mockClear();
        mockFetch.mockClear();
        onlineListeners = [];
        offlineListeners = [];

        // Reset navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });

        // Use fake timers for setTimeout control
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Online/Offline Detection', () => {
        test('should detect online status', () => {
            render(<NetworkRequestComponent />);

            expect(screen.getByTestId('online-status')).toHaveTextContent('online');
        });

        test('should handle offline status', () => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            render(<NetworkRequestComponent />);

            expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
        });

        test('should handle online to offline transition', () => {
            render(<NetworkRequestComponent />);

            // Simulate going offline
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            simulateOffline();

            expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
            expect(screen.getByTestId('error')).toHaveTextContent('You are currently offline');
        });

        test('should handle offline to online transition', () => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            render(<NetworkRequestComponent />);

            // Simulate coming back online
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
            });

            simulateOnline();

            expect(screen.getByTestId('online-status')).toHaveTextContent('online');
        });
    });

    describe('Network Request Handling', () => {
        test('should handle successful network requests', async () => {
            const mockResponse = { data: 'test', success: true };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockResponse));
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
        });

        test('should handle network request failures', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('Network error');
            });
        });

        test('should handle HTTP error responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('HTTP 404: Not Found');
            });
        });

        test('should handle requests when offline', async () => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('No internet connection');
            });

            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Request Timeouts', () => {
        test.skip('should handle request timeouts', async () => {
            // Mock fetch to never resolve (simulate timeout)
            mockFetch.mockImplementation(() => new Promise(() => { }));

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-timeout-request'));

            // Fast-forward time to trigger timeout
            jest.advanceTimersByTime(5100);

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('Request timed out');
            }, { timeout: 10000 });
        });

        test('should handle successful requests before timeout', async () => {
            const mockResponse = { data: 'success' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-timeout-request'));

            await waitFor(() => {
                expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockResponse));
            });
        });
    });

    describe('Retry Logic', () => {
        test.skip('should retry failed requests automatically', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ data: 'success' })
                });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-failing-request'));

            // Advance timers to trigger retry
            jest.advanceTimersByTime(1000);

            await waitFor(() => {
                expect(screen.getByTestId('retry-count')).toHaveTextContent('1');
            });

            await waitFor(() => {
                expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify({ data: 'success' }));
            });
        });

        test.skip('should stop retrying after max attempts', async () => {
            mockFetch.mockRejectedValue(new Error('Persistent network error'));

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-failing-request'));

            // Advance timers to trigger retries
            jest.advanceTimersByTime(1000); // First retry
            jest.advanceTimersByTime(2000); // Second retry
            jest.advanceTimersByTime(4000); // Third retry

            await waitFor(() => {
                expect(screen.getByTestId('retry-count')).toHaveTextContent('3');
            });

            // Should stop retrying after 3 attempts
            expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
        });
    });

    describe('Offline Queue Management', () => {
        test('should queue requests when offline', () => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            render(<OfflineQueueComponent />);

            fireEvent.click(screen.getByTestId('add-to-queue'));

            expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
            expect(screen.getByTestId('queue-status')).toHaveTextContent('offline');
        });

        test.skip('should process queue when coming online', async () => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            render(<OfflineQueueComponent />);

            // Add items to queue while offline
            fireEvent.click(screen.getByTestId('add-to-queue'));
            fireEvent.click(screen.getByTestId('add-to-queue'));

            expect(screen.getByTestId('queue-length')).toHaveTextContent('2');

            // Come back online
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
            });

            simulateOnline();

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('2');
            }, { timeout: 5000 });

            expect(screen.getByTestId('queue-length')).toHaveTextContent('0');
        });

        test('should handle queue processing failures', async () => {
            mockFetch.mockRejectedValue(new Error('Processing failed'));

            render(<OfflineQueueComponent />);

            fireEvent.click(screen.getByTestId('add-to-queue'));
            fireEvent.click(screen.getByTestId('process-queue'));

            await waitFor(() => {
                expect(screen.getByTestId('queue-error')).toHaveTextContent('Processing failed');
            }, { timeout: 5000 });

            // Failed items should be re-queued
            expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
        });

        test('should allow manual queue clearing', () => {
            render(<OfflineQueueComponent />);

            fireEvent.click(screen.getByTestId('add-to-queue'));
            fireEvent.click(screen.getByTestId('add-to-queue'));

            expect(screen.getByTestId('queue-length')).toHaveTextContent('2');

            fireEvent.click(screen.getByTestId('clear-queue'));

            expect(screen.getByTestId('queue-length')).toHaveTextContent('0');
        });
    });

    describe('Connection Recovery', () => {
        test('should attempt reconnection on coming online', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ pong: true })
            });

            render(<ConnectionRecoveryComponent />);

            // Simulate coming online
            simulateOnline();

            await waitFor(() => {
                expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
            });
        });

        test('should handle reconnection failures', async () => {
            mockFetch.mockRejectedValue(new Error('Connection failed'));

            render(<ConnectionRecoveryComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
            });

            expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('1');
        });

        test.skip('should stop retrying after max attempts', async () => {
            mockFetch.mockRejectedValue(new Error('Connection failed'));

            render(<ConnectionRecoveryComponent />);

            // Advance timers to trigger all reconnection attempts
            for (let i = 0; i < 6; i++) {
                jest.advanceTimersByTime(2000 * (i + 1));
            }

            await waitFor(() => {
                expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('5');
            }, { timeout: 15000 });

            expect(screen.getByTestId('recovery-error')).toHaveTextContent('Failed to reconnect after multiple attempts');
        }, 15000);

        test('should allow manual reconnection', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Connection failed'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ pong: true })
                });

            render(<ConnectionRecoveryComponent />);

            // Wait for initial failure
            await waitFor(() => {
                expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
            });

            // Manual reconnect
            fireEvent.click(screen.getByTestId('manual-reconnect'));

            await waitFor(() => {
                expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
            });

            expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
        });
    });

    describe('Network State Persistence', () => {
        test('should maintain network state across re-renders', () => {
            const { rerender } = render(<NetworkRequestComponent />);

            expect(screen.getByTestId('online-status')).toHaveTextContent('online');

            // Simulate going offline
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            simulateOffline();

            rerender(<NetworkRequestComponent />);

            expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
        });

        test('should cleanup event listeners on unmount', () => {
            const { unmount } = render(<NetworkRequestComponent />);

            unmount();

            expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });

    describe('Concurrent Network Operations', () => {
        test('should handle multiple concurrent requests', async () => {
            const mockResponse = { data: 'concurrent' };
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ ...mockResponse, id: 1 })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ ...mockResponse, id: 2 })
                });

            render(<NetworkRequestComponent />);

            // Make two concurrent requests
            fireEvent.click(screen.getByTestId('make-request'));
            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });

        test.skip('should handle mixed success and failure in concurrent requests', async () => {
            let callCount = 0;
            mockFetch.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true })
                    });
                } else {
                    return Promise.reject(new Error('Concurrent failure'));
                }
            });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));
            fireEvent.click(screen.getByTestId('make-request'));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            // Check that we have some data (from successful request)
            expect(screen.getByTestId('data')).toHaveTextContent('{"success":true}');
        });
    });

    describe('Network Error Recovery', () => {
        test('should recover from temporary network failures', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Temporary failure'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ recovered: true })
                });

            render(<NetworkRequestComponent />);

            fireEvent.click(screen.getByTestId('make-request'));

            // Advance timer to trigger retry
            jest.advanceTimersByTime(1000);

            await waitFor(() => {
                expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify({ recovered: true }));
            }, { timeout: 5000 });
        });

        test('should handle network errors during offline queue processing', async () => {
            let callCount = 0;
            mockFetch.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true })
                    });
                } else {
                    return Promise.reject(new Error('Network error during processing'));
                }
            });

            render(<OfflineQueueComponent />);

            fireEvent.click(screen.getByTestId('add-to-queue'));
            fireEvent.click(screen.getByTestId('add-to-queue'));
            fireEvent.click(screen.getByTestId('process-queue'));

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('1');
            }, { timeout: 5000 });

            // One should succeed, one should fail and be re-queued
            expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
            expect(screen.getByTestId('queue-error')).toHaveTextContent('Network error during processing');
        });
    });
});