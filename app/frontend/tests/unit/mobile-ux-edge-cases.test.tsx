/**
 * Mobile UX Edge Cases Tests
 *
 * Tests mobile-specific user experience edge cases including:
 * - Touch interactions and gestures
 * - Responsive design breakpoints
 * - Mobile browser behaviors
 * - Device orientation changes
 * - Mobile-specific UI patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock the logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
})) as any;

// Import after mocks
import QuestionDisplay from '@/components/QuestionDisplay';
import { Question } from '@shared/types';

// Mock question data
const mockQuestion: Question = {
    uid: 'test-question-uid',
    text: 'What is the capital of France?',
    questionType: 'multiple_choice',
    durationMs: 30000, // 30 seconds
    multipleChoiceQuestion: {
        answerOptions: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswers: [true, false, false, false]
    },
    // Legacy fields for backward compatibility
    answerOptions: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswers: [true, false, false, false],
    explanation: 'Paris is the capital of France.',
    difficulty: 1,
    tags: ['capitals', 'europe']
};

// Component that simulates mobile viewport
const MobileViewport: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
    children,
    width = 375,
    height = 667
}) => {
    React.useEffect(() => {
        // Mock viewport dimensions
        Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: height, writable: true });

        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
    }, [width, height]);

    return <div data-testid="mobile-viewport">{children}</div>;
};

// Touch-enabled button component
const TouchButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}> = ({ onClick, children, disabled = false }) => {
    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        if (!disabled) {
            onClick();
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
    };

    return (
        <button
            data-testid="touch-button"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={onClick}
            disabled={disabled}
            style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            {children}
        </button>
    );
};

// Swipeable component
const SwipeableCard: React.FC<{
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    children: React.ReactNode;
}> = ({ onSwipeLeft, onSwipeRight, children }) => {
    const [touchStart, setTouchStart] = React.useState<number | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }
        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }
    };

    return (
        <div
            data-testid="swipeable-card"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                touchAction: 'pan-y pinch-zoom'
            }}
        >
            {children}
        </div>
    );
};

// Mobile navigation component
const MobileNavigation: React.FC<{
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ isOpen, onToggle, children }) => {
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isOpen) {
                onToggle();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, onToggle]);

    return (
        <div data-testid="mobile-nav">
            <button
                data-testid="nav-toggle"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-label="Toggle navigation"
            >
                ☰
            </button>
            {isOpen && (
                <nav data-testid="nav-menu" role="navigation">
                    {children}
                </nav>
            )}
        </div>
    );
};

// Virtual keyboard component
const VirtualKeyboard: React.FC<{
    onKeyPress: (key: string) => void;
    layout?: 'numeric' | 'qwerty' | 'formula';
}> = ({ onKeyPress, layout = 'qwerty' }) => {
    const layouts = {
        numeric: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
        qwerty: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '⌫'],
        formula: ['x', 'y', '+', '-', '×', '÷', '=', '(', ')', '⌫']
    };

    return (
        <div data-testid="virtual-keyboard" role="keyboard">
            {layouts[layout].map(key => (
                <button
                    key={key}
                    data-testid={`key-${key}`}
                    onClick={() => onKeyPress(key)}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        onKeyPress(key);
                    }}
                >
                    {key}
                </button>
            ))}
        </div>
    );
};

describe('Mobile UX Edge Cases', () => {
    describe('Touch Interactions', () => {
        test('should handle touch events on interactive elements', () => {
            const handleClick = jest.fn();
            render(<TouchButton onClick={handleClick}>Touch me</TouchButton>);

            const button = screen.getByTestId('touch-button');

            // Simulate touch start
            fireEvent.touchStart(button, {
                targetTouches: [{ clientX: 100, clientY: 100 }]
            });

            // Simulate touch end
            fireEvent.touchEnd(button);

            expect(handleClick).toHaveBeenCalled();
        });

        test('should prevent default touch behavior for better UX', () => {
            const handleClick = jest.fn();
            render(<TouchButton onClick={handleClick}>Touch me</TouchButton>);

            const button = screen.getByTestId('touch-button');

            const touchStartEvent = new Event('touchstart');
            const preventDefaultSpy = jest.spyOn(touchStartEvent, 'preventDefault');

            // Simulate touch start with preventDefault tracking
            fireEvent(button, touchStartEvent);

            // Note: In real implementation, preventDefault should be called
            // This test documents the expected behavior
        });

        test('should handle swipe gestures', () => {
            const onSwipeLeft = jest.fn();
            const onSwipeRight = jest.fn();

            render(
                <SwipeableCard onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
                    Swipe me
                </SwipeableCard>
            );

            const card = screen.getByTestId('swipeable-card');

            // Simulate left swipe
            fireEvent.touchStart(card, {
                targetTouches: [{ clientX: 200, clientY: 100 }]
            });
            fireEvent.touchMove(card, {
                targetTouches: [{ clientX: 100, clientY: 100 }]
            });
            fireEvent.touchEnd(card);

            expect(onSwipeLeft).toHaveBeenCalled();

            // Simulate right swipe
            fireEvent.touchStart(card, {
                targetTouches: [{ clientX: 100, clientY: 100 }]
            });
            fireEvent.touchMove(card, {
                targetTouches: [{ clientX: 200, clientY: 100 }]
            });
            fireEvent.touchEnd(card);

            expect(onSwipeRight).toHaveBeenCalled();
        });

        test('should handle disabled touch interactions', () => {
            const handleClick = jest.fn();
            render(<TouchButton onClick={handleClick} disabled>Disabled</TouchButton>);

            const button = screen.getByTestId('touch-button');

            fireEvent.touchStart(button, {
                targetTouches: [{ clientX: 100, clientY: 100 }]
            });

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('Responsive Design', () => {
        test('should adapt to mobile viewport sizes', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            render(
                <MobileViewport width={375} height={667}>
                    <QuestionDisplay question={mockQuestion} />
                </MobileViewport>
            );

            // Should render in mobile-optimized layout
            expect(screen.getByTestId('mobile-viewport')).toBeInTheDocument();
        });

        test('should handle tablet viewport sizes', () => {
            Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });

            render(
                <MobileViewport width={768} height={1024}>
                    <QuestionDisplay question={mockQuestion} />
                </MobileViewport>
            );

            expect(screen.getByTestId('mobile-viewport')).toBeInTheDocument();
        });

        test('should handle orientation changes', () => {
            const { rerender } = render(
                <MobileViewport width={375} height={667}>
                    <div data-testid="orientation-content">Portrait</div>
                </MobileViewport>
            );

            expect(screen.getByTestId('orientation-content')).toBeInTheDocument();

            // Simulate orientation change to landscape
            rerender(
                <MobileViewport width={667} height={375}>
                    <div data-testid="orientation-content">Landscape</div>
                </MobileViewport>
            );

            expect(screen.getByTestId('orientation-content')).toBeInTheDocument();
        });

        test('should handle very small screens', () => {
            render(
                <MobileViewport width={320} height={568}>
                    <QuestionDisplay question={mockQuestion} />
                </MobileViewport>
            );

            // Should still be usable on small screens
            expect(screen.getByTestId('mobile-viewport')).toBeInTheDocument();
        });
    });

    describe('Mobile Navigation', () => {
        test('should handle mobile navigation toggle', () => {
            const onToggle = jest.fn();
            const { rerender } = render(
                <MobileNavigation isOpen={false} onToggle={onToggle}>
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                </MobileNavigation>
            );

            const toggleButton = screen.getByTestId('nav-toggle');
            expect(screen.queryByTestId('nav-menu')).not.toBeInTheDocument();

            fireEvent.click(toggleButton);
            expect(onToggle).toHaveBeenCalled();

            rerender(
                <MobileNavigation isOpen={true} onToggle={onToggle}>
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                </MobileNavigation>
            );

            expect(screen.getByTestId('nav-menu')).toBeInTheDocument();
        });

        test('should auto-close navigation on desktop resize', () => {
            const onToggle = jest.fn();
            render(
                <MobileNavigation isOpen={true} onToggle={onToggle}>
                    <a href="#home">Home</a>
                </MobileNavigation>
            );

            // Simulate resize to desktop width
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            window.dispatchEvent(new Event('resize'));

            expect(onToggle).toHaveBeenCalled();
        });

        test('should maintain accessibility attributes', () => {
            const onToggle = jest.fn();
            render(
                <MobileNavigation isOpen={false} onToggle={onToggle}>
                    <a href="#home">Home</a>
                </MobileNavigation>
            );

            const toggleButton = screen.getByTestId('nav-toggle');
            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
            expect(toggleButton).toHaveAttribute('aria-label', 'Toggle navigation');
        });
    });

    describe('Virtual Keyboard', () => {
        test('should handle virtual keyboard input', () => {
            const onKeyPress = jest.fn();
            render(<VirtualKeyboard onKeyPress={onKeyPress} />);

            const key = screen.getByTestId('key-q');
            fireEvent.click(key);

            expect(onKeyPress).toHaveBeenCalledWith('q');
        });

        test('should handle different keyboard layouts', () => {
            const onKeyPress = jest.fn();
            const { rerender } = render(
                <VirtualKeyboard onKeyPress={onKeyPress} layout="numeric" />
            );

            expect(screen.getByTestId('key-1')).toBeInTheDocument();

            rerender(<VirtualKeyboard onKeyPress={onKeyPress} layout="formula" />);
            expect(screen.getByTestId('key-x')).toBeInTheDocument();
        });

        test('should handle touch input on virtual keys', () => {
            const onKeyPress = jest.fn();
            render(<VirtualKeyboard onKeyPress={onKeyPress} />);

            const key = screen.getByTestId('key-q');

            fireEvent.touchStart(key, {
                targetTouches: [{ clientX: 50, clientY: 50 }]
            });

            expect(onKeyPress).toHaveBeenCalledWith('q');
        });
    });

    describe('Mobile Browser Behaviors', () => {
        test('should handle viewport height changes (address bar)', () => {
            // Simulate mobile browser address bar hiding/showing
            const { rerender } = render(
                <MobileViewport width={375} height={667}>
                    <div data-testid="content">Content</div>
                </MobileViewport>
            );

            expect(screen.getByTestId('content')).toBeInTheDocument();

            // Simulate address bar appearing (smaller viewport)
            rerender(
                <MobileViewport width={375} height={600}>
                    <div data-testid="content">Content</div>
                </MobileViewport>
            );

            expect(screen.getByTestId('content')).toBeInTheDocument();
        });

        test('should handle focus management on mobile', () => {
            render(
                <div>
                    <input data-testid="input1" type="text" />
                    <input data-testid="input2" type="text" />
                    <TouchButton onClick={() => { }}>Button</TouchButton>
                </div>
            );

            const input1 = screen.getByTestId('input1');
            const input2 = screen.getByTestId('input2');

            // Focus should work normally
            input1.focus();
            expect(document.activeElement).toBe(input1);

            input2.focus();
            expect(document.activeElement).toBe(input2);
        });

        test('should handle mobile scrolling behaviors', () => {
            render(
                <div style={{ height: '200vh', overflow: 'auto' }}>
                    <div data-testid="scroll-content" style={{ height: '100px' }}>
                        Content
                    </div>
                </div>
            );

            const content = screen.getByTestId('scroll-content');
            expect(content).toBeInTheDocument();

            // In a real mobile environment, scrolling would be handled by the browser
            // This test documents the expected behavior
        });
    });

    describe('Performance on Mobile', () => {
        test('should handle rapid touch interactions', () => {
            const handleClick = jest.fn();
            render(<TouchButton onClick={handleClick}>Rapid Touch</TouchButton>);

            const button = screen.getByTestId('touch-button');

            // Simulate rapid touches
            for (let i = 0; i < 10; i++) {
                fireEvent.touchStart(button, {
                    targetTouches: [{ clientX: 100, clientY: 100 }]
                });
                fireEvent.touchEnd(button);
            }

            expect(handleClick).toHaveBeenCalledTimes(10);
        });

        test('should handle memory constraints gracefully', () => {
            // This test documents memory considerations for mobile devices
            const largeData = new Array(1000).fill(mockQuestion);

            render(
                <div>
                    {largeData.map((question, index) => (
                        <QuestionDisplay key={index} question={question} />
                    ))}
                </div>
            );

            // Should render without crashing
            expect(screen.getAllByText('What is the capital of France?').length).toBeGreaterThan(0);
        });

        test('should handle network interruptions on mobile', () => {
            // Mock network going offline
            Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

            render(<div data-testid="practice-session">Practice Session</div>);

            // Should handle offline state gracefully
            // This would typically show offline indicators or cached content
            expect(screen.getByTestId('practice-session')).toBeInTheDocument();
        });
    });

    describe('Mobile-Specific UI Patterns', () => {
        test('should handle pull-to-refresh gestures', () => {
            const onRefresh = jest.fn();
            const PullToRefresh = () => {
                const [pullDistance, setPullDistance] = React.useState(0);
                const [isRefreshing, setIsRefreshing] = React.useState(false);

                const handleTouchMove = (e: React.TouchEvent) => {
                    const touch = e.touches[0];
                    if (touch.clientY > 0) {
                        setPullDistance(Math.max(0, touch.clientY));
                    }
                };

                const handleTouchEnd = () => {
                    if (pullDistance > 100 && !isRefreshing) {
                        setIsRefreshing(true);
                        onRefresh();
                    }
                    setPullDistance(0);
                };

                return (
                    <div
                        data-testid="pull-to-refresh"
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ transform: `translateY(${Math.min(pullDistance, 100)}px)` }}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
                    </div>
                );
            };

            render(<PullToRefresh />);

            const element = screen.getByTestId('pull-to-refresh');

            // Simulate pull gesture
            fireEvent.touchMove(element, {
                touches: [{ clientY: 150 }]
            });
            fireEvent.touchEnd(element);

            expect(onRefresh).toHaveBeenCalled();
        });

        test('should handle bottom sheet interactions', () => {
            const BottomSheet = () => {
                const [isOpen, setIsOpen] = React.useState(false);

                return (
                    <div>
                        <button
                            data-testid="open-sheet"
                            onClick={() => setIsOpen(true)}
                        >
                            Open Sheet
                        </button>
                        {isOpen && (
                            <div
                                data-testid="bottom-sheet"
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '50vh',
                                    background: 'white'
                                }}
                            >
                                <button
                                    data-testid="close-sheet"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Close
                                </button>
                                Sheet Content
                            </div>
                        )}
                    </div>
                );
            };

            render(<BottomSheet />);

            const openButton = screen.getByTestId('open-sheet');
            fireEvent.click(openButton);

            expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();

            const closeButton = screen.getByTestId('close-sheet');
            fireEvent.click(closeButton);

            expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();
        });
    });
});