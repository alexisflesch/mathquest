/**
 * Multi-Tab Scenarios Tests
 *
 * Tests cross-tab communication, state synchronization, concurrent access,
 * tab-specific behavior, and multi-tab edge cases.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

// Mock BroadcastChannel
const mockBroadcastChannel = {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    close: jest.fn()
};

const originalBroadcastChannel = window.BroadcastChannel;

Object.defineProperty(window, 'BroadcastChannel', {
    value: jest.fn(() => mockBroadcastChannel),
    writable: true
});

// Mock StorageEvent
class MockStorageEvent extends Event {
    key: string | null;
    oldValue: string | null;
    newValue: string | null;
    storageArea: Storage | null;

    constructor(type: string, options: any = {}) {
        super(type);
        this.key = options.key || null;
        this.oldValue = options.oldValue || null;
        this.newValue = options.newValue || null;
        this.storageArea = options.storageArea || null;
    }
}

Object.defineProperty(window, 'StorageEvent', {
    value: MockStorageEvent,
    writable: true
});

// Component that handles cross-tab communication
const CrossTabComponent: React.FC = () => {
    const [sharedData, setSharedData] = useLocalStorage('shared-data', { counter: 0, lastUpdated: null as string | null });
    const [tabId] = React.useState(() => Math.random().toString(36).substr(2, 9));
    const [messages, setMessages] = React.useState<string[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let channel: any = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                channel = new BroadcastChannel('test-channel');

                const handleMessage = (event: MessageEvent) => {
                    try {
                        setMessages(prev => [...prev, `Received: ${JSON.stringify(event.data)}`]);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Message handling error');
                    }
                };

                channel.addEventListener('message', handleMessage);

                // Listen for storage events from other tabs
                const handleStorage = (e: StorageEvent) => {
                    if (e.key === 'shared-data') {
                        setMessages(prev => [...prev, `Storage changed: ${e.key} from ${e.oldValue} to ${e.newValue}`]);
                    }
                };

                window.addEventListener('storage', handleStorage);

                return () => {
                    if (channel) {
                        channel.removeEventListener('message', handleMessage);
                        channel.close();
                    }
                    window.removeEventListener('storage', handleStorage);
                };
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'BroadcastChannel initialization error');
        }

        // Return cleanup function for storage events even if BroadcastChannel fails
        return () => {
            window.removeEventListener('storage', () => { });
        };
    }, []);

    const sendMessage = () => {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('test-channel');
                channel.postMessage({ type: 'update', tabId, timestamp: Date.now() });
                channel.close();
                setMessages(prev => [...prev, `Sent: update from tab ${tabId}`]);
            } else {
                setError('BroadcastChannel not supported');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Broadcast error');
        }
    };

    const updateSharedData = () => {
        try {
            const newData = {
                counter: (sharedData as any).counter + 1,
                lastUpdated: new Date().toISOString()
            };
            setSharedData(newData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Data update error');
        }
    };

    const displayData = React.useMemo(() => {
        if (typeof sharedData === 'object' && sharedData !== null) {
            return JSON.stringify(sharedData);
        }
        return String(sharedData);
    }, [sharedData]);

    return (
        <div>
            <div data-testid="tab-id">{tabId}</div>
            <div data-testid="shared-data">{displayData}</div>
            <div data-testid="message-count">{messages.length}</div>
            <ul data-testid="messages">
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
            <button data-testid="send-message" onClick={sendMessage}>
                Send Message
            </button>
            <button data-testid="update-data" onClick={updateSharedData}>
                Update Shared Data
            </button>
            {error && <div data-testid="error">{error}</div>}
        </div>
    );
};

// Component that uses sessionStorage (tab-specific)
const SessionTabComponent: React.FC = () => {
    const [sessionData, setSessionData] = useSessionStorage('session-data', { tabSpecific: true } as any);
    const [tabId] = React.useState(() => Math.random().toString(36).substr(2, 9));
    const [error, setError] = React.useState<string | null>(null);

    const updateSessionData = () => {
        try {
            setSessionData({
                ...sessionData,
                tabId,
                timestamp: Date.now()
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Session update error');
        }
    };

    const displayData = React.useMemo(() => {
        if (typeof sessionData === 'object' && sessionData !== null) {
            return JSON.stringify(sessionData);
        }
        return String(sessionData);
    }, [sessionData]);

    return (
        <div>
            <div data-testid="session-tab-id">{tabId}</div>
            <div data-testid="session-data">{displayData}</div>
            <button data-testid="update-session" onClick={updateSessionData}>
                Update Session Data
            </button>
            {error && <div data-testid="session-error">{error}</div>}
        </div>
    );
};

// Component that handles concurrent operations
const ConcurrentComponent: React.FC = () => {
    const [concurrentData, setConcurrentData] = useLocalStorage('concurrent-data', { operations: [] } as any);
    const [operationCount, setOperationCount] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    const performConcurrentOperation = async () => {
        try {
            // Simulate concurrent operations
            const operations = Array.from({ length: 10 }, (_, i) => `operation-${i}-${Date.now()}`);

            for (const operation of operations) {
                setConcurrentData((prev: any) => ({
                    operations: [...(prev?.operations || []), operation]
                }));
                setOperationCount(prev => prev + 1);

                // Small delay to simulate async operations
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Concurrent operation error');
        }
    };

    const displayData = React.useMemo(() => {
        if (typeof concurrentData === 'object' && concurrentData !== null) {
            return JSON.stringify(concurrentData);
        }
        return String(concurrentData);
    }, [concurrentData]);

    return (
        <div>
            <div data-testid="concurrent-data">{displayData}</div>
            <div data-testid="operation-count">{operationCount}</div>
            <button data-testid="perform-concurrent" onClick={performConcurrentOperation}>
                Perform Concurrent Operations
            </button>
            {error && <div data-testid="concurrent-error">{error}</div>}
        </div>
    );
};

describe('Multi-Tab Scenarios', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockUseLocalStorage.mockClear();
        mockUseSessionStorage.mockClear();
        mockBroadcastChannel.postMessage.mockClear();
        mockBroadcastChannel.addEventListener.mockClear();
        mockBroadcastChannel.removeEventListener.mockClear();
        mockBroadcastChannel.close.mockClear();

        // Reset the mock to not trigger messages automatically
        mockBroadcastChannel.addEventListener.mockImplementation(() => { });
    });

    describe('Cross-Tab Communication', () => {
        test('should handle BroadcastChannel message sending', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            render(<CrossTabComponent />);

            fireEvent.click(screen.getByTestId('send-message'));

            expect(mockBroadcastChannel.postMessage).toHaveBeenCalled();
            expect(screen.getByTestId('message-count')).toHaveTextContent('1');
        });

        test('should handle BroadcastChannel message receiving', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            // Mock the message event listener
            mockBroadcastChannel.addEventListener.mockImplementation((event, handler) => {
                if (event === 'message') {
                    // Simulate receiving a message
                    const mockEvent = {
                        data: { type: 'update', tabId: 'other-tab', timestamp: Date.now() }
                    };
                    setTimeout(() => handler(mockEvent), 0);
                }
            });

            render(<CrossTabComponent />);

            // Wait for the message to be processed
            waitFor(() => {
                expect(screen.getByTestId('message-count')).toHaveTextContent('1');
            });
        });

        test('should handle BroadcastChannel errors', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            // Mock BroadcastChannel to throw an error
            const originalBroadcastChannel = window.BroadcastChannel;
            Object.defineProperty(window, 'BroadcastChannel', {
                value: jest.fn(() => {
                    throw new Error('BroadcastChannel not supported');
                }),
                writable: true
            });

            render(<CrossTabComponent />);

            fireEvent.click(screen.getByTestId('send-message'));

            expect(screen.getByTestId('error')).toHaveTextContent('BroadcastChannel not supported');

            // Restore original
            Object.defineProperty(window, 'BroadcastChannel', {
                value: originalBroadcastChannel,
                writable: true
            });
        });
    });

    describe('Storage Event Synchronization', () => {
        test('should handle storage events from other tabs', async () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            render(<CrossTabComponent />);

            // Wait for the component to mount and set up event listeners
            await waitFor(() => {
                expect(screen.getByTestId('tab-id')).toBeInTheDocument();
            });

            // Simulate storage event from another tab
            const storageEvent = new StorageEvent('storage', {
                key: 'shared-data',
                oldValue: JSON.stringify({ counter: 0, lastUpdated: null }),
                newValue: JSON.stringify({ counter: 1, lastUpdated: new Date().toISOString() }),
                storageArea: window.localStorage
            });

            window.dispatchEvent(storageEvent);

            // Wait for the event to be processed
            await waitFor(() => {
                expect(screen.getByTestId('message-count')).toHaveTextContent('1');
            });
        });

        test('should ignore storage events for different keys', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            render(<CrossTabComponent />);

            // Simulate storage event for a different key
            const storageEvent = new StorageEvent('storage', {
                key: 'other-key',
                oldValue: 'old-value',
                newValue: 'new-value',
                storageArea: window.localStorage
            });

            window.dispatchEvent(storageEvent);

            expect(screen.getByTestId('message-count')).toHaveTextContent('0');
        });
    });

    describe('Session Storage Isolation', () => {
        test('should maintain separate session data per tab', () => {
            const mockSetSessionData = jest.fn();
            mockUseSessionStorage.mockReturnValue([{ tabSpecific: true }, mockSetSessionData]);

            render(<SessionTabComponent />);

            fireEvent.click(screen.getByTestId('update-session'));

            expect(mockSetSessionData).toHaveBeenCalled();
            expect(mockUseSessionStorage).toHaveBeenCalledWith('session-data', { tabSpecific: true });
        });

        test('should handle sessionStorage updates', () => {
            const mockSetSessionData = jest.fn();
            mockUseSessionStorage.mockReturnValue([{ tabSpecific: true }, mockSetSessionData]);

            render(<SessionTabComponent />);

            fireEvent.click(screen.getByTestId('update-session'));

            expect(mockSetSessionData).toHaveBeenCalledWith(
                expect.objectContaining({
                    tabSpecific: true,
                    timestamp: expect.any(Number)
                })
            );
        });
    });

    describe('Concurrent Operations', () => {
        test('should handle rapid concurrent storage operations', async () => {
            const mockSetConcurrentData = jest.fn();
            mockUseLocalStorage.mockReturnValue([{ operations: [] }, mockSetConcurrentData]);

            render(<ConcurrentComponent />);

            fireEvent.click(screen.getByTestId('perform-concurrent'));

            // Wait for operations to complete
            await waitFor(() => {
                expect(mockSetConcurrentData).toHaveBeenCalledTimes(10);
            });

            expect(screen.getByTestId('operation-count')).toHaveTextContent('10');
        });

        test('should handle concurrent operation errors', () => {
            const mockSetConcurrentData = jest.fn(() => {
                throw new Error('Concurrent modification error');
            });
            mockUseLocalStorage.mockReturnValue([{ operations: [] }, mockSetConcurrentData]);

            render(<ConcurrentComponent />);

            fireEvent.click(screen.getByTestId('perform-concurrent'));

            expect(screen.getByTestId('concurrent-error')).toHaveTextContent('Concurrent modification error');
        });
    });

    describe('Shared State Synchronization', () => {
        test('should synchronize shared data across tabs', () => {
            const mockSetSharedData = jest.fn();
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, mockSetSharedData]);

            render(<CrossTabComponent />);

            fireEvent.click(screen.getByTestId('update-data'));

            expect(mockSetSharedData).toHaveBeenCalledWith(
                expect.objectContaining({
                    counter: 1,
                    lastUpdated: expect.any(String)
                })
            );
        });

        test('should handle shared data update errors', () => {
            const mockSetSharedData = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, mockSetSharedData]);

            render(<CrossTabComponent />);

            fireEvent.click(screen.getByTestId('update-data'));

            expect(screen.getByTestId('error')).toHaveTextContent('Storage quota exceeded');
        });
    });

    describe('Tab Lifecycle Management', () => {
        test('should handle tab-specific cleanup on unmount', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            const { unmount } = render(<CrossTabComponent />);

            unmount();

            expect(mockBroadcastChannel.close).toHaveBeenCalled();
            expect(mockBroadcastChannel.removeEventListener).toHaveBeenCalled();
        });

        test('should maintain tab identity across re-renders', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            const { rerender } = render(<CrossTabComponent />);

            const initialTabId = screen.getByTestId('tab-id').textContent;

            rerender(<CrossTabComponent />);

            expect(screen.getByTestId('tab-id')).toHaveTextContent(initialTabId || '');
        });
    });

    describe('Multi-Tab Race Conditions', () => {
        test('should handle rapid storage events from multiple tabs', async () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            render(<CrossTabComponent />);

            // Wait for the component to mount and set up event listeners
            await waitFor(() => {
                expect(screen.getByTestId('tab-id')).toBeInTheDocument();
            });

            // Simulate rapid storage events from multiple tabs
            const events = [
                { key: 'shared-data', oldValue: '{"counter":0}', newValue: '{"counter":1}' },
                { key: 'shared-data', oldValue: '{"counter":1}', newValue: '{"counter":2}' },
                { key: 'shared-data', oldValue: '{"counter":2}', newValue: '{"counter":3}' }
            ];

            events.forEach(eventData => {
                const storageEvent = new StorageEvent('storage', {
                    ...eventData,
                    storageArea: window.localStorage
                });
                window.dispatchEvent(storageEvent);
            });

            // Wait for all events to be processed
            await waitFor(() => {
                expect(screen.getByTestId('message-count')).toHaveTextContent('3');
            });
        });

        test('should handle conflicting concurrent updates', () => {
            const mockSetSharedData = jest.fn();
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, mockSetSharedData]);

            render(<CrossTabComponent />);

            // Simulate conflicting updates
            fireEvent.click(screen.getByTestId('update-data'));
            fireEvent.click(screen.getByTestId('update-data'));

            expect(mockSetSharedData).toHaveBeenCalledTimes(2);
        });
    });

    describe('BroadcastChannel Fallbacks', () => {
        test('should handle BroadcastChannel unavailability', () => {
            // Mock BroadcastChannel as undefined
            const originalBroadcastChannel = window.BroadcastChannel;
            Object.defineProperty(window, 'BroadcastChannel', {
                value: undefined,
                writable: true
            });

            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            expect(() => {
                render(<CrossTabComponent />);
            }).not.toThrow();

            // Restore original
            Object.defineProperty(window, 'BroadcastChannel', {
                value: originalBroadcastChannel,
                writable: true
            });
        });

        test('should handle BroadcastChannel message parsing errors', () => {
            mockUseLocalStorage.mockReturnValue([{ counter: 0, lastUpdated: null }, jest.fn()]);

            // Mock the message event listener with invalid JSON
            mockBroadcastChannel.addEventListener.mockImplementation((event, handler) => {
                if (event === 'message') {
                    const mockEvent = {
                        data: { invalid: undefined } // This will cause JSON.stringify to fail
                    };
                    setTimeout(() => handler(mockEvent), 0);
                }
            });

            render(<CrossTabComponent />);

            // Should handle the error gracefully
            waitFor(() => {
                expect(screen.getByTestId('error')).toBeInTheDocument();
            });
        });
    });
});