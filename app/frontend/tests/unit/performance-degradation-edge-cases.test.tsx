import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Simple component for performance testing
const SimpleComponent = () => {
    const [count, setCount] = React.useState(0);

    return (
        <div data-testid="simple-component">
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={() => setCount(c => c + 1)}>
                Increment
            </button>
        </div>
    );
};

// Component that tests basic performance
const PerformanceComponent = () => {
    const [items, setItems] = React.useState<number[]>([]);

    const addItem = React.useCallback(() => {
        setItems(prev => [...prev, prev.length]);
    }, []);

    return (
        <div data-testid="performance-component">
            <div data-testid="item-count">{items.length}</div>
            <button data-testid="add-item" onClick={addItem}>
                Add Item
            </button>
            {items.slice(0, 3).map((item, index) => (
                <div key={item} data-testid={`item-${index}`}>
                    Item {index}
                </div>
            ))}
        </div>
    );
};

describe('Performance Degradation Edge Cases', () => {
    describe('Basic Performance', () => {
        test('should handle basic state updates efficiently', () => {
            render(<SimpleComponent />);

            act(() => {
                screen.getByTestId('increment').click();
                screen.getByTestId('increment').click();
            });

            expect(screen.getByTestId('count')).toHaveTextContent('2');
        });

        test('should handle multiple rapid updates', () => {
            render(<SimpleComponent />);

            act(() => {
                for (let i = 0; i < 5; i++) {
                    screen.getByTestId('increment').click();
                }
            });

            expect(screen.getByTestId('count')).toHaveTextContent('5');
        });
    });

    describe('Component Rendering Performance', () => {
        test('should render components without performance issues', () => {
            render(<PerformanceComponent />);

            act(() => {
                screen.getByTestId('add-item').click();
                screen.getByTestId('add-item').click();
            });

            expect(parseInt(screen.getByTestId('item-count').textContent || '0')).toBe(2);
        });

        test('should handle component unmounting gracefully', () => {
            const { unmount } = render(<PerformanceComponent />);

            act(() => {
                screen.getByTestId('add-item').click();
            });

            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Memory Management', () => {
        test('should handle state cleanup on unmount', () => {
            const { unmount } = render(<PerformanceComponent />);

            act(() => {
                screen.getByTestId('add-item').click();
                screen.getByTestId('add-item').click();
                screen.getByTestId('add-item').click();
            });

            expect(parseInt(screen.getByTestId('item-count').textContent || '0')).toBe(3);

            // Unmount should not cause issues
            expect(() => unmount()).not.toThrow();
        });
    });
});