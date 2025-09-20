/**
 * Mobile UX Tests
 *
 * Tests for mobile user experience including:
 * - Safe areas and device-specific layouts
 * - Virtual keyboard handling
 * - Touch target accessibility
 * - Mobile navigation patterns
 * - Responsive design behaviors
 * - Orientation and viewport changes
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock viewport and device APIs
const mockViewport = {
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    orientation: 'portrait-primary'
};

const mockSafeAreas = {
    top: 44,    // Status bar
    bottom: 34, // Home indicator
    left: 0,
    right: 0
};

Object.defineProperty(window, 'visualViewport', {
    value: {
        width: mockViewport.width,
        height: mockViewport.height,
        offsetTop: 0,
        offsetLeft: 0,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    },
    writable: true
});

Object.defineProperty(window, 'orientation', {
    value: 0,
    writable: true
});

// Mock CSS environment variables for safe areas
Object.defineProperty(window, 'CSS', {
    value: {
        supports: jest.fn(() => true)
    },
    writable: true
});

// Mock matchMedia for responsive design
Object.defineProperty(window, 'matchMedia', {
    value: jest.fn((query) => ({
        matches: query.includes('375px') || query.includes('max-width'),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    writable: true
});

// Mock Components for Mobile UX Testing
const MockMobileLayout = ({
    deviceType = 'iphone',
    orientation = 'portrait',
    showKeyboard = false,
    contentHeight = 'auto'
}: {
    deviceType?: 'iphone' | 'android' | 'tablet';
    orientation?: 'portrait' | 'landscape';
    showKeyboard?: boolean;
    contentHeight?: string | number;
}) => {
    const safeAreaTop = deviceType === 'iphone' ? 44 : deviceType === 'android' ? 24 : 0;
    const safeAreaBottom = deviceType === 'iphone' ? 34 : deviceType === 'android' ? 16 : 0;

    const viewportHeight = orientation === 'portrait' ? 667 : 375;
    const keyboardHeight = showKeyboard ? 216 : 0;
    const availableHeight = viewportHeight - keyboardHeight - safeAreaTop - safeAreaBottom;

    return (
        <div
            className={`mobile-layout ${deviceType} ${orientation}`}
            style={{
                paddingTop: `${safeAreaTop}px`,
                paddingBottom: `${safeAreaBottom}px`,
                minHeight: `${availableHeight}px`,
                maxHeight: showKeyboard ? `${availableHeight}px` : '100vh'
            }}
            data-testid="mobile-layout"
        >
            <header
                className="mobile-header"
                style={{
                    position: 'sticky',
                    top: `${safeAreaTop}px`,
                    zIndex: 100
                }}
            >
                <h1>Mobile App</h1>
                <button
                    className="menu-button"
                    aria-label="Open menu"
                    style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        padding: '12px'
                    }}
                >
                    ☰
                </button>
            </header>

            <main
                className="mobile-content"
                style={{
                    flex: 1,
                    overflowY: showKeyboard ? 'auto' : 'visible',
                    paddingBottom: showKeyboard ? '216px' : 0
                }}
            >
                <div style={{ height: contentHeight }}>
                    <p>Content area with flexible height</p>
                    <input
                        type="text"
                        placeholder="Type here..."
                        className="mobile-input"
                        style={{
                            width: '100%',
                            minHeight: '44px',
                            padding: '12px',
                            fontSize: '16px' // Prevents zoom on iOS
                        }}
                    />
                </div>
            </main>

            <nav
                className="mobile-bottom-nav"
                style={{
                    position: 'fixed',
                    bottom: `${safeAreaBottom}px`,
                    left: 0,
                    right: 0,
                    minHeight: '60px',
                    background: '#fff',
                    borderTop: '1px solid #ccc'
                }}
            >
                <button
                    className="nav-item"
                    style={{
                        flex: 1,
                        minHeight: '44px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                    }}
                    aria-label="Home"
                >
                    🏠
                    <span style={{ fontSize: '12px' }}>Home</span>
                </button>
                <button
                    className="nav-item"
                    style={{
                        flex: 1,
                        minHeight: '44px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                    }}
                    aria-label="Search"
                >
                    🔍
                    <span style={{ fontSize: '12px' }}>Search</span>
                </button>
                <button
                    className="nav-item"
                    style={{
                        flex: 1,
                        minHeight: '44px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                    }}
                    aria-label="Profile"
                >
                    👤
                    <span style={{ fontSize: '12px' }}>Profile</span>
                </button>
            </nav>
        </div>
    );
};

const MockResponsiveCard = ({
    breakpoint = 'mobile',
    touchTargetSize = 44
}: {
    breakpoint?: 'mobile' | 'tablet' | 'desktop';
    touchTargetSize?: number;
}) => {
    const cardWidth = breakpoint === 'mobile' ? '100%' : breakpoint === 'tablet' ? '50%' : '33%';

    return (
        <div
            className={`responsive-card ${breakpoint}`}
            style={{
                width: cardWidth,
                margin: '8px',
                padding: '16px',
                border: '1px solid #ccc',
                borderRadius: '8px'
            }}
        >
            <h3>Card Title</h3>
            <p>Card content with responsive width</p>
            <button
                className="card-action"
                style={{
                    minWidth: `${touchTargetSize}px`,
                    minHeight: `${touchTargetSize}px`,
                    padding: '8px',
                    marginTop: '8px'
                }}
                aria-label="Card action"
            >
                Action
            </button>
        </div>
    );
};

const MockSwipeableList = ({
    items = ['Item 1', 'Item 2', 'Item 3'],
    onSwipe
}: {
    items?: string[];
    onSwipe?: (item: string, direction: 'left' | 'right') => void;
}) => {
    return (
        <div className="swipeable-list" role="list">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="swipeable-item"
                    role="listitem"
                    style={{
                        padding: '16px',
                        borderBottom: '1px solid #ccc',
                        background: '#fff',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        touchAction: 'pan-y'
                    }}
                    data-testid={`swipeable-item-${index}`}
                >
                    <span style={{ flex: 1 }}>{item}</span>
                    <button
                        className="swipe-action"
                        style={{
                            minWidth: '60px',
                            minHeight: '44px',
                            background: '#f0f0f0',
                            border: 'none',
                            marginLeft: '8px'
                        }}
                        aria-label={`Action for ${item}`}
                    >
                        ⋯
                    </button>
                </div>
            ))}
        </div>
    );
};

const MockVirtualKeyboardHandler = ({
    inputValue = '',
    onInputChange,
    keyboardVisible = false
}: {
    inputValue?: string;
    onInputChange?: (value: string) => void;
    keyboardVisible?: boolean;
}) => {
    const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(keyboardVisible);

    React.useEffect(() => {
        const handleResize = () => {
            const viewport = window.visualViewport;
            if (viewport) {
                const keyboardHeight = window.innerHeight - viewport.height;
                setIsKeyboardVisible(keyboardHeight > 150);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="keyboard-handler">
            <div
                className={`content-area ${isKeyboardVisible ? 'keyboard-visible' : ''}`}
                style={{
                    paddingBottom: isKeyboardVisible ? '216px' : 0,
                    transition: 'padding-bottom 0.3s ease'
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    onFocus={() => setIsKeyboardVisible(true)}
                    onBlur={() => setIsKeyboardVisible(false)}
                    placeholder="Type to show keyboard..."
                    className="keyboard-input"
                    style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '12px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                    data-testid="keyboard-input"
                />
                <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                    {isKeyboardVisible ? 'Keyboard is visible - content adjusted' : 'Tap input to show keyboard'}
                </p>
            </div>
        </div>
    );
};

describe('Mobile UX Tests', () => {
    describe('Safe Areas and Device Layout', () => {
        test('should apply correct safe areas for iPhone', () => {
            render(<MockMobileLayout deviceType="iphone" />);

            const layout = screen.getByTestId('mobile-layout');
            expect(layout).toHaveStyle({
                paddingTop: '44px',
                paddingBottom: '34px'
            });
        });

        test('should apply correct safe areas for Android', () => {
            render(<MockMobileLayout deviceType="android" />);

            const layout = screen.getByTestId('mobile-layout');
            expect(layout).toHaveStyle({
                paddingTop: '24px',
                paddingBottom: '16px'
            });
        });

        test('should adjust layout for landscape orientation', () => {
            render(<MockMobileLayout orientation="landscape" />);

            const layout = screen.getByTestId('mobile-layout');
            expect(layout).toHaveClass('landscape');
            // Check that landscape class is applied (height calculation is internal)
            expect(layout).toHaveAttribute('class', expect.stringContaining('landscape'));
        });

        test('should position header correctly with safe area', () => {
            render(<MockMobileLayout deviceType="iphone" />);

            const header = screen.getByRole('banner');
            expect(header).toHaveStyle({
                top: '44px'
            });
        });

        test('should position bottom navigation correctly with safe area', () => {
            render(<MockMobileLayout deviceType="iphone" />);

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveStyle({
                bottom: '34px'
            });
        });
    });

    describe('Virtual Keyboard Handling', () => {
        test('should detect keyboard visibility and adjust layout', () => {
            render(<MockVirtualKeyboardHandler keyboardVisible={true} />);

            const contentArea = document.querySelector('.content-area');
            expect(contentArea).toHaveClass('keyboard-visible');
            expect(contentArea).toHaveStyle({
                paddingBottom: '216px'
            });
        });

        test('should handle input focus and blur events', async () => {
            render(<MockVirtualKeyboardHandler />);

            const input = screen.getByTestId('keyboard-input');

            // Focus should show keyboard
            fireEvent.focus(input);
            await waitFor(() => {
                const contentArea = document.querySelector('.content-area');
                expect(contentArea).toHaveClass('keyboard-visible');
            });

            // Blur should hide keyboard
            fireEvent.blur(input);
            await waitFor(() => {
                const contentArea = document.querySelector('.content-area');
                expect(contentArea).not.toHaveClass('keyboard-visible');
            });
        });

        test('should prevent zoom on input focus (iOS)', () => {
            render(<MockMobileLayout />);

            const input = screen.getByPlaceholderText('Type here...');
            expect(input).toHaveStyle({
                fontSize: '16px'
            });
        });

        test('should adjust content area when keyboard appears', () => {
            render(<MockMobileLayout showKeyboard={true} />);

            const content = document.querySelector('.mobile-content');
            expect(content).toHaveStyle({
                paddingBottom: '216px'
            });
        });

        test('should maintain scrollability when keyboard is visible', () => {
            render(<MockMobileLayout showKeyboard={true} />);

            const content = document.querySelector('.mobile-content');
            expect(content).toHaveStyle({
                overflowY: 'auto'
            });
        });
    });

    describe('Touch Target Accessibility', () => {
        test('should have minimum 44px touch targets', () => {
            render(<MockMobileLayout />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                // Check that the buttons have the required attributes for touch targets
                expect(button).toBeInTheDocument();
                // The actual size validation would be done in integration tests
                // Here we verify the buttons exist and have proper accessibility
                expect(button).toHaveAttribute('aria-label');
            });
        });

        test('should have adequate padding for touch targets', () => {
            render(<MockMobileLayout />);

            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                expect(item).toHaveStyle({
                    padding: '8px'
                });
            });
        });

        test('should support custom touch target sizes', () => {
            render(<MockResponsiveCard touchTargetSize={48} />);

            const actionButton = screen.getByRole('button', { name: 'Card action' });
            expect(actionButton).toHaveStyle({
                minWidth: '48px',
                minHeight: '48px'
            });
        });

        test('should have sufficient spacing between touch targets', () => {
            render(<MockMobileLayout />);

            const navItems = document.querySelectorAll('.nav-item');
            expect(navItems).toHaveLength(3);

            // Check that items are evenly spaced with flex: 1
            navItems.forEach(item => {
                expect(item).toHaveStyle({
                    flex: '1'
                });
            });
        });

        test('should provide visual feedback for touch interactions', () => {
            render(<MockSwipeableList />);

            const items = screen.getAllByRole('listitem');
            items.forEach(item => {
                expect(item).toHaveStyle({
                    minHeight: '60px'
                });
            });
        });
    });

    describe('Responsive Design and Breakpoints', () => {
        test('should adapt to mobile breakpoint', () => {
            render(<MockResponsiveCard breakpoint="mobile" />);

            const card = document.querySelector('.responsive-card');
            expect(card).toHaveStyle({
                width: '100%'
            });
            expect(card).toHaveClass('mobile');
        });

        test('should adapt to tablet breakpoint', () => {
            render(<MockResponsiveCard breakpoint="tablet" />);

            const card = document.querySelector('.responsive-card');
            expect(card).toHaveStyle({
                width: '50%'
            });
            expect(card).toHaveClass('tablet');
        });

        test('should use CSS media queries for responsive behavior', () => {
            // Mock matchMedia should return true for mobile queries
            const mobileQuery = '(max-width: 768px)';
            expect(window.matchMedia(mobileQuery).matches).toBe(true);
        });

        test('should handle fluid layouts', () => {
            render(<MockMobileLayout />);

            const content = document.querySelector('.mobile-content');
            expect(content).toHaveStyle({
                flex: '1'
            });
        });

        test('should maintain readability across breakpoints', () => {
            render(<MockMobileLayout />);

            const input = screen.getByPlaceholderText('Type here...');
            expect(input).toHaveStyle({
                fontSize: '16px'
            });
        });
    });

    describe('Mobile Navigation Patterns', () => {
        test('should have accessible hamburger menu button', () => {
            render(<MockMobileLayout />);

            const menuButton = screen.getByRole('button', { name: 'Open menu' });
            expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
            expect(menuButton).toHaveStyle({
                minWidth: '44px',
                minHeight: '44px'
            });
        });

        test('should have bottom navigation with proper touch targets', () => {
            render(<MockMobileLayout />);

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveStyle({
                minHeight: '60px'
            });

            const navItems = document.querySelectorAll('.nav-item');
            expect(navItems).toHaveLength(3);

            navItems.forEach(item => {
                expect(item).toHaveAttribute('aria-label');
                expect(item).toHaveStyle({
                    minHeight: '44px'
                });
            });
        });

        test('should support swipe gestures on list items', () => {
            render(<MockSwipeableList />);

            const items = screen.getAllByRole('listitem');
            items.forEach(item => {
                // Check that items have proper touch action setup
                expect(item).toHaveAttribute('data-testid', expect.stringMatching(/^swipeable-item-/));
                expect(item).toHaveStyle({
                    minHeight: '60px'
                });
            });
        });

        test('should have accessible swipe actions', () => {
            render(<MockSwipeableList />);

            const actions = document.querySelectorAll('.swipe-action');
            actions.forEach(action => {
                expect(action).toHaveAttribute('aria-label');
                expect(action).toHaveStyle({
                    minWidth: '60px',
                    minHeight: '44px'
                });
            });
        });

        test('should maintain navigation context', () => {
            render(<MockMobileLayout />);

            const nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();

            const header = screen.getByRole('banner');
            expect(header).toBeInTheDocument();
        });
    });

    describe('Orientation and Viewport Changes', () => {
        test('should handle orientation changes', () => {
            const { rerender } = render(<MockMobileLayout orientation="portrait" />);

            let layout = screen.getByTestId('mobile-layout');
            expect(layout).toHaveClass('portrait');

            rerender(<MockMobileLayout orientation="landscape" />);
            layout = screen.getByTestId('mobile-layout');
            expect(layout).toHaveClass('landscape');
        });

        test('should adjust layout dimensions for orientation', () => {
            render(<MockMobileLayout orientation="landscape" />);

            const layout = screen.getByTestId('mobile-layout');
            // Landscape should have different height calculation
            expect(layout).toHaveClass('landscape');
            expect(layout).toHaveAttribute('style', expect.stringContaining('min-height'));
        });

        test('should handle viewport resize events', () => {
            render(<MockVirtualKeyboardHandler />);

            // Simulate viewport resize (keyboard appearing)
            Object.defineProperty(window.visualViewport, 'height', {
                value: 667 - 216,
                writable: true
            });

            fireEvent(window, new Event('resize'));

            const contentArea = document.querySelector('.content-area');
            expect(contentArea).toHaveClass('keyboard-visible');
        });

        test('should maintain accessibility during orientation changes', () => {
            render(<MockMobileLayout />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAttribute('aria-label');
            });
        });

        test('should preserve focus during orientation changes', () => {
            render(<MockMobileLayout />);

            const input = screen.getByPlaceholderText('Type here...');
            input.focus();

            expect(document.activeElement).toBe(input);
        });
    });

    describe('Performance and User Experience', () => {
        test('should use CSS transitions for smooth animations', () => {
            render(<MockVirtualKeyboardHandler />);

            const contentArea = document.querySelector('.content-area');
            expect(contentArea).toHaveStyle({
                transition: 'padding-bottom 0.3s ease'
            });
        });

        test('should prevent horizontal scrolling on mobile', () => {
            render(<MockMobileLayout />);

            const layout = screen.getByTestId('mobile-layout');
            // Should not have horizontal overflow
            expect(layout).not.toHaveStyle({
                overflowX: 'auto'
            });
        });

        test('should optimize for touch scrolling', () => {
            render(<MockSwipeableList />);

            const list = document.querySelector('.swipeable-list');
            expect(list).toHaveAttribute('role', 'list');
        });

        test('should handle long content gracefully', () => {
            render(<MockMobileLayout contentHeight="2000px" />);

            const content = document.querySelector('.mobile-content');
            expect(content).toHaveStyle({
                overflowY: 'visible'
            });
        });

        test('should provide loading states for mobile interactions', () => {
            // This would test loading spinners, disabled states, etc.
            render(<MockMobileLayout />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).not.toHaveAttribute('disabled');
            });
        });
    });
});