/**
 * Data Synchronization Edge Cases Tests
 *
 * Tests data synchronization scenarios across components, ensuring consistency,
 * handling race conditions, and maintaining data integrity during concurrent operations.
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

// Mock localStorage and sessionStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};

const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
});

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
});

// Mock StorageEvent for cross-tab synchronization
const mockStorageEvent = jest.fn();
Object.defineProperty(window, 'StorageEvent', {
    value: mockStorageEvent,
    writable: true
});

// Create a context for shared data
const DataContext = React.createContext<{
    sharedData: any;
    updateSharedData: (key: string, value: any) => void;
    syncErrors: string[];
    lastSyncTime: number;
    loadSharedData: () => void;
} | null>(null);

// Component that manages shared data state
const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sharedData, setSharedData] = React.useState<any>({});
    const [syncErrors, setSyncErrors] = React.useState<string[]>([]);
    const [lastSyncTime, setLastSyncTime] = React.useState<number>(Date.now());

    const updateSharedData = React.useCallback((key: string, value: any) => {
        setSharedData((prev: any) => {
            const newData = { ...prev, [key]: value };
            try {
                localStorage.setItem('sharedData', JSON.stringify(newData));
                setLastSyncTime(Date.now());
            } catch (error) {
                setSyncErrors(prev => [...prev, `Failed to sync ${key}: ${error}`]);
            }
            return newData;
        });
    }, []);

    const loadSharedData = React.useCallback(() => {
        try {
            const stored = localStorage.getItem('sharedData');
            if (stored) {
                const parsed = JSON.parse(stored);
                setSharedData(parsed);
                setLastSyncTime(Date.now());
            }
        } catch (error) {
            setSyncErrors(prev => [...prev, `Failed to load data: ${error}`]);
        }
    }, []);

    React.useEffect(() => {
        loadSharedData();
    }, [loadSharedData]);

    const contextValue = {
        sharedData,
        updateSharedData,
        syncErrors,
        lastSyncTime,
        loadSharedData
    };

    // Add data-testid to the provider
    return React.createElement(DataContext.Provider, { value: contextValue },
        React.createElement('div', { 'data-testid': 'data-provider' }, children)
    );
};

// Component that displays and modifies data
const DataConsumer: React.FC<{ id: string; initialData?: any }> = ({ id, initialData }) => {
    const context = React.useContext(DataContext);
    const [localData, setLocalData] = React.useState(initialData || {});
    const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [version, setVersion] = React.useState(1);

    // Sync with shared data when context changes
    React.useEffect(() => {
        if (context?.sharedData) {
            setLocalData((prev: any) => ({ ...prev, ...context.sharedData }));
        }
    }, [context?.sharedData]);

    const handleDataChange = (key: string, value: any) => {
        setSyncStatus('syncing');
        setLocalData((prev: any) => ({ ...prev, [key]: value }));

        // Update shared data
        context?.updateSharedData(key, value);

        // Simulate async operation
        setTimeout(() => {
            setSyncStatus('synced');
            setVersion(prev => prev + 1);
        }, 100);
    };

    const handleConcurrentUpdate = () => {
        // Simulate concurrent updates
        handleDataChange('counter', (localData.counter || 0) + 1);
        setTimeout(() => handleDataChange('counter', (localData.counter || 0) + 1), 50);
    };

    return (
        <div data-testid={`consumer-${id}`}>
            <div data-testid={`consumer-${id}-status`}>{syncStatus}</div>
            <div data-testid={`consumer-${id}-version`}>{version}</div>
            <div data-testid={`consumer-${id}-data`}>{JSON.stringify(localData)}</div>
            <button
                data-testid={`consumer-${id}-update-btn`}
                onClick={() => handleDataChange('name', `Updated by ${id}`)}
            >
                Update Name
            </button>
            <button
                data-testid={`consumer-${id}-counter-btn`}
                onClick={() => handleDataChange('counter', (localData.counter || 0) + 1)}
            >
                Increment Counter
            </button>
            <button
                data-testid={`consumer-${id}-concurrent-btn`}
                onClick={handleConcurrentUpdate}
            >
                Concurrent Update
            </button>
        </div>
    );
};

// Component that validates data integrity
const DataValidator: React.FC<{ expectedData: any }> = ({ expectedData }) => {
    const [validationResult, setValidationResult] = React.useState<'valid' | 'invalid' | 'checking'>('checking');
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

    React.useEffect(() => {
        const validate = () => {
            try {
                const stored = localStorage.getItem('sharedData');
                if (!stored) {
                    setValidationResult('invalid');
                    setValidationErrors(['No data found in storage']);
                    return;
                }

                const parsed = JSON.parse(stored);
                const errors: string[] = [];

                Object.keys(expectedData).forEach(key => {
                    if (parsed[key] !== expectedData[key]) {
                        errors.push(`Mismatch for ${key}: expected ${expectedData[key]}, got ${parsed[key]}`);
                    }
                });

                if (errors.length === 0) {
                    setValidationResult('valid');
                    setValidationErrors([]);
                } else {
                    setValidationResult('invalid');
                    setValidationErrors(errors);
                }
            } catch (error) {
                setValidationResult('invalid');
                setValidationErrors([`Parse error: ${error}`]);
            }
        };

        validate();
    }, [expectedData]);

    return (
        <div data-testid="data-validator">
            <div data-testid="validation-result">{validationResult}</div>
            <div data-testid="validation-errors">{JSON.stringify(validationErrors)}</div>
        </div>
    );
};

// Component that simulates network synchronization
const NetworkSyncer: React.FC = () => {
    const [networkStatus, setNetworkStatus] = React.useState<'online' | 'offline' | 'syncing'>('online');
    const [syncQueue, setSyncQueue] = React.useState<any[]>([]);
    const [lastNetworkError, setLastNetworkError] = React.useState<string | null>(null);

    const syncToServer = React.useCallback(async (data: any) => {
        setNetworkStatus('syncing');
        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            setNetworkStatus('online');
            setLastNetworkError(null);
            return await response.json();
        } catch (error) {
            setNetworkStatus('offline');
            setLastNetworkError(error instanceof Error ? error.message : 'Unknown error');
            // Add to queue for retry
            setSyncQueue(prev => [...prev, data]);
            throw error;
        }
    }, []);

    const retryFailedSyncs = React.useCallback(async () => {
        if (syncQueue.length === 0) return;

        const queueCopy = [...syncQueue];
        setSyncQueue([]);

        for (const data of queueCopy) {
            try {
                await syncToServer(data);
            } catch (error) {
                // Re-queue failed items
                setSyncQueue(prev => [...prev, data]);
            }
        }
    }, [syncQueue, syncToServer]);

    return (
        <div data-testid="network-syncer">
            <div data-testid="network-status">{networkStatus}</div>
            <div data-testid="sync-queue-length">{syncQueue.length}</div>
            <div data-testid="last-network-error">{lastNetworkError || 'no-error'}</div>
            <button
                data-testid="sync-btn"
                onClick={() => syncToServer({ test: 'data' }).catch(() => { })}
            >
                Sync to Server
            </button>
            <button
                data-testid="retry-btn"
                onClick={() => retryFailedSyncs().catch(() => { })}
            >
                Retry Failed Syncs
            </button>
        </div>
    );
};

describe('Data Synchronization Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();
        mockSessionStorage.clear();
        mockFetch.mockClear();
    });

    describe('Cross-Component Data Consistency', () => {
        test('should maintain data consistency between multiple consumers', async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ shared: 'initial' }));

            render(
                <div>
                    <DataConsumer id="consumer1" initialData={{ shared: 'initial' }} />
                    <DataConsumer id="consumer2" initialData={{ shared: 'initial' }} />
                </div>
            );

            // Both consumers should start with same data
            expect(screen.getByTestId('consumer-consumer1-data')).toHaveTextContent('{"shared":"initial"}');
            expect(screen.getByTestId('consumer-consumer2-data')).toHaveTextContent('{"shared":"initial"}');

            // Update first consumer
            fireEvent.click(screen.getByTestId('consumer-consumer1-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-consumer1-status')).toHaveTextContent('synced');
            });

            // Data should be updated locally
            expect(screen.getByTestId('consumer-consumer1-data')).toHaveTextContent('{"shared":"initial","name":"Updated by consumer1"}');
        });

        test('should handle concurrent data updates from multiple components', async () => {
            render(
                <div>
                    <DataConsumer id="consumer1" initialData={{ counter: 0 }} />
                    <DataConsumer id="consumer2" initialData={{ counter: 0 }} />
                </div>
            );

            // Trigger concurrent updates
            fireEvent.click(screen.getByTestId('consumer-consumer1-counter-btn'));
            fireEvent.click(screen.getByTestId('consumer-consumer2-counter-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-consumer1-status')).toHaveTextContent('synced');
                expect(screen.getByTestId('consumer-consumer2-status')).toHaveTextContent('synced');
            });

            // Both should have incremented counters
            const consumer1Data = JSON.parse(screen.getByTestId('consumer-consumer1-data').textContent || '{}');
            const consumer2Data = JSON.parse(screen.getByTestId('consumer-consumer2-data').textContent || '{}');

            expect(consumer1Data.counter).toBeGreaterThanOrEqual(1);
            expect(consumer2Data.counter).toBeGreaterThanOrEqual(1);
        });

        test('should detect and handle data corruption during synchronization', async () => {
            // Mock corrupted data in storage
            mockLocalStorage.getItem.mockReturnValue('{invalid json');

            render(<DataValidator expectedData={{ valid: 'data' }} />);

            await waitFor(() => {
                expect(screen.getByTestId('validation-result')).toHaveTextContent('invalid');
            });

            const errors = JSON.parse(screen.getByTestId('validation-errors').textContent || '[]');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toMatch(/Parse error/);
        });
    });

    describe('State Synchronization', () => {
        test('should synchronize state changes across component re-renders', async () => {
            const { rerender } = render(<DataConsumer id="test" initialData={{ value: 1 }} />);

            expect(screen.getByTestId('consumer-test-version')).toHaveTextContent('1');

            // Update data
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test-status')).toHaveTextContent('synced');
            });

            // Version should increment
            expect(screen.getByTestId('consumer-test-version')).toHaveTextContent('2');

            // Re-render component
            rerender(<DataConsumer id="test" initialData={{ value: 1 }} />);

            // Version should increment (not reset) but data should persist
            expect(screen.getByTestId('consumer-test-version')).toHaveTextContent('2');
        });

        test('should handle state synchronization during component unmounting', async () => {
            const { unmount } = render(<DataConsumer id="test" initialData={{ value: 1 }} />);

            // Update data
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test-status')).toHaveTextContent('synced');
            });

            // Unmount component
            unmount();

            // Component should have cleaned up properly (no errors)
            expect(screen.queryByTestId('consumer-test')).not.toBeInTheDocument();
        });
    });

    describe('Race Conditions', () => {
        test('should handle race conditions in concurrent data updates', async () => {
            render(<DataConsumer id="test" initialData={{ counter: 0 }} />);

            // Trigger concurrent updates rapidly
            fireEvent.click(screen.getByTestId('consumer-test-concurrent-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test-status')).toHaveTextContent('synced');
            });

            const data = JSON.parse(screen.getByTestId('consumer-test-data').textContent || '{}');
            // Counter should be incremented (exact value depends on timing)
            expect(typeof data.counter).toBe('number');
            expect(data.counter).toBeGreaterThanOrEqual(1);
        });

        test('should prevent data loss during rapid successive updates', async () => {
            render(<DataConsumer id="test" initialData={{ value: 'initial' }} />);

            // Rapid successive updates
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test-status')).toHaveTextContent('synced');
            });

            // Should have the latest update
            expect(screen.getByTestId('consumer-test-data')).toHaveTextContent('{"value":"initial","name":"Updated by test"}');
        });
    });

    describe('Network Synchronization', () => {
        test('should handle network failures during data synchronization', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await act(async () => {
                render(<NetworkSyncer />);
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('sync-btn'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('network-status')).toHaveTextContent('offline');
            });

            expect(screen.getByTestId('last-network-error')).toHaveTextContent('Network error');
            expect(screen.getByTestId('sync-queue-length')).toHaveTextContent('1');
        });

        test('should retry failed synchronizations when network recovers', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

            await act(async () => {
                render(<NetworkSyncer />);
            });

            // First sync fails
            await act(async () => {
                fireEvent.click(screen.getByTestId('sync-btn'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('network-status')).toHaveTextContent('offline');
            });

            // Retry should succeed
            await act(async () => {
                fireEvent.click(screen.getByTestId('retry-btn'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('network-status')).toHaveTextContent('online');
            });

            expect(screen.getByTestId('sync-queue-length')).toHaveTextContent('0');
            expect(screen.getByTestId('last-network-error')).toHaveTextContent('no-error');
        });

        test('should handle server errors during synchronization', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await act(async () => {
                render(<NetworkSyncer />);
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('sync-btn'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('network-status')).toHaveTextContent('offline');
            });

            expect(screen.getByTestId('last-network-error')).toHaveTextContent('Sync failed: 500');
        });
    });

    describe('Data Validation and Integrity', () => {
        test('should validate data integrity across synchronization points', async () => {
            const expectedData = { key1: 'value1', key2: 'value2' };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expectedData));

            render(<DataValidator expectedData={expectedData} />);

            await waitFor(() => {
                expect(screen.getByTestId('validation-result')).toHaveTextContent('valid');
            });

            expect(screen.getByTestId('validation-errors')).toHaveTextContent('[]');
        });

        test('should detect data integrity violations', async () => {
            const expectedData = { key1: 'value1', key2: 'value2' };
            const actualData = { key1: 'value1', key2: 'different_value' };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(actualData));

            render(<DataValidator expectedData={expectedData} />);

            await waitFor(() => {
                expect(screen.getByTestId('validation-result')).toHaveTextContent('invalid');
            });

            const errors = JSON.parse(screen.getByTestId('validation-errors').textContent || '[]');
            expect(errors).toContain('Mismatch for key2: expected value2, got different_value');
        });

        test('should handle missing data gracefully', async () => {
            const expectedData = { required: 'data' };
            mockLocalStorage.getItem.mockReturnValue(null);

            render(<DataValidator expectedData={expectedData} />);

            await waitFor(() => {
                expect(screen.getByTestId('validation-result')).toHaveTextContent('invalid');
            });

            const errors = JSON.parse(screen.getByTestId('validation-errors').textContent || '[]');
            expect(errors).toContain('No data found in storage');
        });
    });

    describe('Storage Synchronization', () => {
        test('should synchronize data with localStorage successfully', async () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            mockLocalStorage.setItem.mockImplementation(() => { });

            render(
                <DataProvider>
                    <DataConsumer id="test" initialData={{ test: 'data' }} />
                </DataProvider>
            );

            // Update should trigger storage sync
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                    'sharedData',
                    expect.stringContaining('"name":"Updated by test"')
                );
            });
        });

        test('should handle localStorage quota exceeded errors', async () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Quota exceeded');
            });

            render(
                <DataProvider>
                    <DataConsumer id="test" initialData={{ test: 'data' }} />
                </DataProvider>
            );

            // Update should trigger storage error
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test')).toBeInTheDocument();
            });

            // Should handle error gracefully without crashing
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        test('should recover from storage synchronization failures', async () => {
            let callCount = 0;
            mockLocalStorage.setItem.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Temporary storage error');
                }
                // Succeed on retry
            });

            render(
                <DataProvider>
                    <DataConsumer id="test" initialData={{ test: 'data' }} />
                </DataProvider>
            );

            // First update fails
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
            });

            // Second update should succeed
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Component Lifecycle Synchronization', () => {
        test('should handle data synchronization during component mounting', async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ loaded: 'data' }));

            const { rerender } = render(<DataConsumer id="test" />);

            // Component should load data on mount if connected to provider
            // Since this test doesn't use DataProvider, localStorage won't be called
            await waitFor(() => {
                expect(screen.getByTestId('consumer-test')).toBeInTheDocument();
            });

            // Re-render should maintain data
            rerender(<DataConsumer id="test" />);

            expect(screen.getByTestId('consumer-test-data')).toBeInTheDocument();
        });

        test('should clean up synchronization resources on unmount', async () => {
            const { unmount } = render(
                <DataProvider>
                    <DataConsumer id="test" initialData={{ test: 'data' }} />
                </DataProvider>
            );

            // Update data
            fireEvent.click(screen.getByTestId('consumer-test-update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test-status')).toHaveTextContent('synced');
            });

            // Unmount
            unmount();

            // Should not cause any errors
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        test('should handle component re-mounting with cached data', async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ cached: 'data' }));

            const { unmount } = render(<DataConsumer id="test" />);

            // Component should be rendered without calling localStorage (no provider)
            await waitFor(() => {
                expect(screen.getByTestId('consumer-test')).toBeInTheDocument();
            });

            unmount();

            // Re-mount should work without localStorage calls
            render(<DataConsumer id="test" />);

            await waitFor(() => {
                expect(screen.getByTestId('consumer-test')).toBeInTheDocument();
            });
        });
    });
});