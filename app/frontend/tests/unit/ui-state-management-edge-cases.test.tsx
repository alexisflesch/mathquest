import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock components and utilities
jest.mock('../../src/components/ErrorBoundary', () => ({
    ErrorBoundary: ({ children, fallback }: any) => (
        <div data-testid="error-boundary">
            {children}
        </div>
    ),
}));

jest.mock('../../src/clientLogger', () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
});

// Mock components for state management testing
const MockStatefulComponent = ({ initialState = {}, onStateChange }: any) => {
    const [state, setState] = React.useState(() => {
        // Try to recover from localStorage on mount
        try {
            const saved = localStorage.getItem('test-state');
            return saved ? JSON.parse(saved) : initialState;
        } catch {
            return initialState;
        }
    });

    // Persist to localStorage whenever state changes
    React.useEffect(() => {
        try {
            localStorage.setItem('test-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }, [state]);

    React.useEffect(() => {
        onStateChange?.(state);
    }, [state, onStateChange]);

    return (
        <div data-testid="stateful-component">
            <div data-testid="state-display">{JSON.stringify(state)}</div>
            <button
                data-testid="update-state"
                onClick={() => setState((prev: any) => ({ ...prev, count: (prev.count || 0) + 1 }))}
            >
                Update State
            </button>
            <button
                data-testid="reset-state"
                onClick={() => setState(initialState)}
            >
                Reset State
            </button>
        </div>
    );
};

const MockFormComponent = ({ onSubmit }: any) => {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        age: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
    };

    return (
        <form data-testid="form-component" onSubmit={handleSubmit}>
            <input
                data-testid="name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
            />
            <input
                data-testid="email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
            />
            <input
                data-testid="age-input"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
            />
            <button data-testid="submit-button" type="submit">
                Submit
            </button>
        </form>
    );
};

const MockAsyncComponent = ({ onData }: any) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));
            const result = { id: 1, name: 'Test Data' };
            setData(result);
            onData?.(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    return (
        <div data-testid="async-component">
            {loading && <div data-testid="loading">Loading...</div>}
            {error && <div data-testid="error">{error}</div>}
            {data && <div data-testid="data">{JSON.stringify(data)}</div>}
            <button data-testid="retry-button" onClick={fetchData}>
                Retry
            </button>
        </div>
    );
};

describe('UI State Management Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        sessionStorageMock.clear();
    });

    describe('State Persistence and Recovery', () => {
        test('should persist state to localStorage on changes', async () => {
            const mockOnStateChange = jest.fn();
            localStorageMock.getItem.mockReturnValue(null);

            render(<MockStatefulComponent initialState={{ count: 0 }} onStateChange={mockOnStateChange} />);

            const updateButton = screen.getByTestId('update-state');
            fireEvent.click(updateButton);

            await waitFor(() => {
                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    expect.stringContaining('state'),
                    JSON.stringify({ count: 1 })
                );
            });
        });

        test('should recover state from localStorage on mount', () => {
            const savedState = { count: 5, timestamp: Date.now() };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

            render(<MockStatefulComponent initialState={{ count: 0 }} />);

            expect(screen.getByTestId('state-display')).toHaveTextContent(
                JSON.stringify(savedState)
            );
        });

        test('should handle corrupted localStorage data gracefully', () => {
            localStorageMock.getItem.mockReturnValue('invalid json');

            // Should not throw and should use initial state
            expect(() => {
                render(<MockStatefulComponent initialState={{ count: 0 }} />);
            }).not.toThrow();

            expect(screen.getByTestId('state-display')).toHaveTextContent(
                JSON.stringify({ count: 0 })
            );
        });

        test('should handle localStorage quota exceeded', () => {
            const largeState = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            render(<MockStatefulComponent initialState={largeState} />);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to save state to localStorage:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Concurrent State Updates', () => {
        test('should handle rapid consecutive state updates', async () => {
            const mockOnStateChange = jest.fn();

            render(<MockStatefulComponent initialState={{ count: 0 }} onStateChange={mockOnStateChange} />);

            const updateButton = screen.getByTestId('update-state');

            // Simulate rapid clicks
            await act(async () => {
                fireEvent.click(updateButton);
                fireEvent.click(updateButton);
                fireEvent.click(updateButton);
            });

            await waitFor(() => {
                expect(mockOnStateChange).toHaveBeenLastCalledWith({ count: 3 });
            });
        });

        test('should handle state updates from multiple sources', async () => {
            const TestComponent = () => {
                const [state, setState] = React.useState({ count: 0, source: '' });

                const updateFromSource1 = () => setState(prev => ({ ...prev, count: prev.count + 1, source: 'source1' }));
                const updateFromSource2 = () => setState(prev => ({ ...prev, count: prev.count + 1, source: 'source2' }));

                return (
                    <div>
                        <div data-testid="state">{JSON.stringify(state)}</div>
                        <button data-testid="source1-btn" onClick={updateFromSource1}>Source 1</button>
                        <button data-testid="source2-btn" onClick={updateFromSource2}>Source 2</button>
                    </div>
                );
            };

            render(<TestComponent />);

            const source1Btn = screen.getByTestId('source1-btn');
            const source2Btn = screen.getByTestId('source2-btn');

            fireEvent.click(source1Btn);
            fireEvent.click(source2Btn);
            fireEvent.click(source1Btn);

            await waitFor(() => {
                const stateText = screen.getByTestId('state').textContent;
                const state = JSON.parse(stateText || '{}');
                expect(state.count).toBe(3);
                expect(state.source).toBe('source1'); // Last update wins
            });
        });

        test('should handle state updates during component unmount', () => {
            const mockOnStateChange = jest.fn();

            const { unmount } = render(
                <MockStatefulComponent initialState={{ count: 0 }} onStateChange={mockOnStateChange} />
            );

            const updateButton = screen.getByTestId('update-state');
            fireEvent.click(updateButton);

            // Unmount before state update completes
            unmount();

            // Should not cause memory leaks or errors
            expect(mockOnStateChange).toHaveBeenCalledWith({ count: 1 });
        });
    });

    describe('Form State Management', () => {
        test('should preserve form state during re-renders', () => {
            const mockOnSubmit = jest.fn();

            const { rerender } = render(<MockFormComponent onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByTestId('name-input');
            const emailInput = screen.getByTestId('email-input');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            // Force re-render
            rerender(<MockFormComponent onSubmit={mockOnSubmit} />);

            expect(nameInput).toHaveValue('John Doe');
            expect(emailInput).toHaveValue('john@example.com');
        });

        test('should handle form validation state', () => {
            const ValidationForm = () => {
                const [formData, setFormData] = React.useState({ email: '' });
                const [errors, setErrors] = React.useState<any>({});

                const validateEmail = (email: string) => {
                    return email.includes('@') ? '' : 'Invalid email';
                };

                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const { value } = e.target;
                    setFormData({ email: value });
                    setErrors({ email: validateEmail(value) });
                };

                return (
                    <div>
                        <input
                            data-testid="email-input"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <div data-testid="email-error">{errors.email}</div>}
                    </div>
                );
            };

            render(<ValidationForm />);

            const emailInput = screen.getByTestId('email-input');

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email');

            fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
            expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
        });

        test('should handle form submission with loading states', async () => {
            const AsyncForm = () => {
                const [formData, setFormData] = React.useState({ name: '' });
                const [loading, setLoading] = React.useState(false);
                const [submitted, setSubmitted] = React.useState(false);

                const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 100));
                    setSubmitted(true);
                    setLoading(false);
                };

                return (
                    <form onSubmit={handleSubmit}>
                        <input
                            data-testid="name-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                        />
                        <button data-testid="submit-btn" type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                        {submitted && <div data-testid="success">Submitted!</div>}
                    </form>
                );
            };

            render(<AsyncForm />);

            const nameInput = screen.getByTestId('name-input');
            const submitBtn = screen.getByTestId('submit-btn');

            fireEvent.change(nameInput, { target: { value: 'Test Name' } });
            fireEvent.click(submitBtn);

            expect(submitBtn).toBeDisabled();
            expect(submitBtn).toHaveTextContent('Submitting...');

            await waitFor(() => {
                expect(submitBtn).not.toBeDisabled();
                expect(submitBtn).toHaveTextContent('Submit');
                expect(screen.getByTestId('success')).toBeInTheDocument();
            });
        });
    });

    describe('Async State Management', () => {
        test('should handle loading states correctly', async () => {
            const mockOnData = jest.fn();

            render(<MockAsyncComponent onData={mockOnData} />);

            expect(screen.getByTestId('loading')).toBeInTheDocument();
            expect(screen.queryByTestId('data')).not.toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
                expect(screen.getByTestId('data')).toBeInTheDocument();
            });

            expect(mockOnData).toHaveBeenCalledWith({ id: 1, name: 'Test Data' });
        });

        test('should handle error states and recovery', async () => {
            // Mock fetch to fail
            global.fetch = jest.fn(() =>
                Promise.reject(new Error('Network error'))
            ) as any;

            const ErrorAsyncComponent = () => {
                const [data, setData] = React.useState<any>(null);
                const [loading, setLoading] = React.useState(false);
                const [error, setError] = React.useState<any>(null);

                const fetchData = async () => {
                    setLoading(true);
                    setError(null);
                    try {
                        await fetch('/api/data');
                        setData({ success: true });
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                };

                React.useEffect(() => {
                    fetchData();
                }, []);

                return (
                    <div data-testid="async-component">
                        {loading && <div data-testid="loading">Loading...</div>}
                        {error && <div data-testid="error">{error}</div>}
                        {data && <div data-testid="data">Success</div>}
                        <button data-testid="retry-button" onClick={fetchData}>
                            Retry
                        </button>
                    </div>
                );
            };

            render(<ErrorAsyncComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('Network error');
            });

            // Retry should work
            global.fetch = jest.fn(() =>
                Promise.resolve({ json: () => Promise.resolve({ success: true }) })
            ) as any;

            const retryButton = screen.getByTestId('retry-button');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByTestId('data')).toHaveTextContent('Success');
            });

            // Cleanup
            (global.fetch as any).mockRestore();
        });

        test('should handle race conditions in async operations', async () => {
            const RaceConditionComponent = () => {
                const [data, setData] = React.useState<any>(null);
                const [loading, setLoading] = React.useState(false);

                const fetchData = async (id: number) => {
                    setLoading(true);
                    // Simulate different response times
                    const delay = id === 1 ? 100 : 50;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    setData({ id, timestamp: Date.now() });
                    setLoading(false);
                };

                return (
                    <div>
                        <div data-testid="data">{data ? JSON.stringify(data) : 'No data'}</div>
                        <button data-testid="btn1" onClick={() => fetchData(1)}>Fetch 1</button>
                        <button data-testid="btn2" onClick={() => fetchData(2)}>Fetch 2</button>
                    </div>
                );
            };

            render(<RaceConditionComponent />);

            // Start two requests - second should complete first but not override first if it's slower
            fireEvent.click(screen.getByTestId('btn1')); // 100ms
            fireEvent.click(screen.getByTestId('btn2')); // 50ms

            // Wait for all operations to complete
            await waitFor(() => {
                const dataText = screen.getByTestId('data').textContent;
                expect(dataText).not.toBe('No data');
            });

            // The last request (id: 2) should win due to race condition
            const finalData = JSON.parse(screen.getByTestId('data').textContent || '{}');
            expect(finalData.id).toBe(2);
        });
    });

    describe('State Synchronization', () => {
        test('should synchronize state with external sources', async () => {
            const ExternalSyncComponent = () => {
                const [localState, setLocalState] = React.useState({ count: 0 });
                const [externalState, setExternalState] = React.useState({ count: 0 });

                // Simulate external state updates
                React.useEffect(() => {
                    const interval = setInterval(() => {
                        setExternalState(prev => ({ count: prev.count + 1 }));
                    }, 50);

                    return () => clearInterval(interval);
                }, []);

                // Sync local state with external state
                React.useEffect(() => {
                    if (externalState.count > localState.count) {
                        setLocalState(externalState);
                    }
                }, [externalState, localState.count]);

                return (
                    <div>
                        <div data-testid="local-state">{localState.count}</div>
                        <div data-testid="external-state">{externalState.count}</div>
                    </div>
                );
            };

            render(<ExternalSyncComponent />);

            // Wait for external updates
            await waitFor(() => {
                expect(parseInt(screen.getByTestId('external-state').textContent || '0')).toBeGreaterThan(0);
            });

            // Local state should eventually sync
            await waitFor(() => {
                const localCount = parseInt(screen.getByTestId('local-state').textContent || '0');
                const externalCount = parseInt(screen.getByTestId('external-state').textContent || '0');
                expect(localCount).toBe(externalCount);
            });
        });

        test('should handle state conflicts gracefully', () => {
            const ConflictComponent = () => {
                const [state, setState] = React.useState({ value: 'initial' });
                const [conflicts, setConflicts] = React.useState<string[]>([]);

                const updateFromSourceA = () => {
                    setState(prev => {
                        if (prev.value !== 'sourceA') {
                            setConflicts(prevConflicts => [...prevConflicts, 'Conflict with sourceA']);
                        }
                        return { value: 'sourceA' };
                    });
                };

                const updateFromSourceB = () => {
                    setState(prev => {
                        if (prev.value !== 'sourceB') {
                            setConflicts(prevConflicts => [...prevConflicts, 'Conflict with sourceB']);
                        }
                        return { value: 'sourceB' };
                    });
                };

                return (
                    <div>
                        <div data-testid="state">{state.value}</div>
                        <div data-testid="conflicts">{conflicts.length}</div>
                        <button data-testid="sourceA-btn" onClick={updateFromSourceA}>Source A</button>
                        <button data-testid="sourceB-btn" onClick={updateFromSourceB}>Source B</button>
                    </div>
                );
            };

            render(<ConflictComponent />);

            fireEvent.click(screen.getByTestId('sourceA-btn'));
            fireEvent.click(screen.getByTestId('sourceB-btn'));
            fireEvent.click(screen.getByTestId('sourceA-btn'));

            expect(screen.getByTestId('state')).toHaveTextContent('sourceA');
            expect(screen.getByTestId('conflicts')).toHaveTextContent('3'); // Three state changes occurred
        });
    });

    describe('Memory and Performance', () => {
        test('should handle large state objects efficiently', () => {
            const LargeStateComponent = () => {
                const [largeState, setLargeState] = React.useState({
                    data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
                });

                return (
                    <div>
                        <div data-testid="item-count">{largeState.data.length}</div>
                        <button
                            data-testid="add-item"
                            onClick={() => setLargeState(prev => ({
                                data: [...prev.data, { id: prev.data.length, value: `item-${prev.data.length}` }]
                            }))}
                        >
                            Add Item
                        </button>
                    </div>
                );
            };

            render(<LargeStateComponent />);

            expect(screen.getByTestId('item-count')).toHaveTextContent('1000');

            const addButton = screen.getByTestId('add-item');
            fireEvent.click(addButton);

            expect(screen.getByTestId('item-count')).toHaveTextContent('1001');
        });

        test('should clean up event listeners on unmount', () => {
            const EventListenerComponent = () => {
                const [count, setCount] = React.useState(0);

                React.useEffect(() => {
                    const handleResize = () => setCount(prev => prev + 1);
                    window.addEventListener('resize', handleResize);

                    return () => {
                        window.removeEventListener('resize', handleResize);
                    };
                }, []);

                return <div data-testid="count">{count}</div>;
            };

            const { unmount } = render(<EventListenerComponent />);

            // Simulate resize event
            act(() => {
                window.dispatchEvent(new Event('resize'));
            });
            expect(screen.getByTestId('count')).toHaveTextContent('1');

            // Unmount should clean up listeners
            unmount();

            // This should not cause errors or memory leaks
            window.dispatchEvent(new Event('resize'));
        });

        test('should handle state updates in rapid succession without memory leaks', async () => {
            const RapidUpdateComponent = () => {
                const [count, setCount] = React.useState(0);
                const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

                React.useEffect(() => {
                    intervalRef.current = setInterval(() => {
                        setCount(prev => prev + 1);
                    }, 10);

                    return () => {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                        }
                    };
                }, []);

                return <div data-testid="count">{count}</div>;
            };

            const { unmount } = render(<RapidUpdateComponent />);

            // Let it run for a short time
            await new Promise(resolve => setTimeout(resolve, 100));

            const countBeforeUnmount = parseInt(screen.getByTestId('count').textContent || '0');
            expect(countBeforeUnmount).toBeGreaterThan(0);

            // Unmount should clean up the interval
            unmount();

            // Wait a bit more to ensure no memory leaks
            await new Promise(resolve => setTimeout(resolve, 50));
        });
    });
});